import { DocComment, LeafNode, StructType } from "../../frontend/ast"
import { ArrayVal, BooleanVal, FunctionVal, NullVal, PlaceholderVal, StringVal } from "./../values"
import {
  ArrayLiteral,
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  Identifier,
  MemberExpr,
  NumericLiteral,
  ObjectLiteral,
  StringLiteral,
} from "../../frontend/ast"
import Environment from "../environment"
import { evaluate } from "../interpreter"
import { MK_NULL } from "../macros"
import { NativeFnVal, NumberVal, ObjectVal, RuntimeVal } from "../values"
import { eval_code_block } from "./statements"
import { RuntimeError } from "../error"
import { ExecutionContext } from "../execution-context"
import { GenericTypeVal, PrimitiveTypeVal, StructTypeVal, TypeVal } from "../values.types"
import {
  areTypesCompatible,
  convertTypeNodeToTypeVal,
  createTypeArgMap,
  getRuntimeType,
  getStructTypeFromGeneric,
  getTypeName,
  getTypeOfKind,
  isAliasOfType,
} from "../type-checker"

function eval_numeric_binary_expr(
  lhs: NumberVal | PlaceholderVal,
  rhs: NumberVal,
  operator: string,
): NumberVal | BooleanVal {
  if ([">", "<", "==", "!=", "==", ">=", "<="].includes(operator)) {
    let result = false
    const left = lhs.type == "placeholder" ? 0 : lhs.value
    if (operator == ">") result = left > rhs.value
    else if (operator == "<") result = left < rhs.value
    else if (operator == "==") result = left == rhs.value
    else if (operator == "!=") result = left != rhs.value
    else if (operator == ">=") result = left >= rhs.value
    else if (operator == "<=") result = left <= rhs.value

    return { type: "boolean", value: result, returned: false }
  }

  let result = 0

  const left = lhs.type == "placeholder" ? 0 : lhs.value

  if (operator == "+") result = left + rhs.value
  else if (operator == "-") result = left - rhs.value
  else if (operator == "*") result = left * rhs.value
  else if (operator == "/") result = left / rhs.value
  else result = left % rhs.value

  return { type: "number", value: result, returned: false }
}

export function eval_boolean_binary_expr(
  lhs: BooleanVal | PlaceholderVal,
  rhs: BooleanVal,
  operator: string,
): BooleanVal {
  let result = false

  const left = lhs.type == "placeholder" ? false : lhs.value

  if (operator == "==") result = left == rhs.value
  else if (operator == "!=") result = left != rhs.value
  else if (operator == "&&" || operator == "and") result = left && rhs.value
  else if (operator == "||" || operator == "or") result = left || rhs.value

  return { type: "boolean", value: result, returned: false }
}

export function eval_string_binary_expr(
  lhs: StringVal | PlaceholderVal,
  rhs: StringVal,
  operator: string,
): BooleanVal {
  let result = false

  const left = lhs.type == "placeholder" ? "" : lhs.value
  if (operator == "==") result = left == rhs.value
  else if (operator == "!=") result = left != rhs.value

  return { type: "boolean", value: result, returned: false } as BooleanVal
}

export function eval_string_concatenation(
  lhs: StringVal | PlaceholderVal,
  rhs: StringVal,
  operator: string,
  context: ExecutionContext,
): StringVal {
  const left = lhs.type == "placeholder" ? "" : (lhs as StringVal).value
  if (operator != "+")
    throw new RuntimeError(context, `Invalid operator for string concatenation: ${operator}`)
  return {
    type: "string",
    value: left + (rhs as StringVal).value,
    returned: false,
  } as StringVal
}

export function eval_binary_expr(
  binop: BinaryExpr,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  const lhs = evaluate(binop.left, context, env)
  const rhs = evaluate(binop.right, context, env)

  if (["number", "placeholder"].includes(lhs.type) && rhs.type == "number") {
    return eval_numeric_binary_expr(lhs as NumberVal, rhs as NumberVal, binop.operator.value)
  }

  if (["boolean", "placeholder"].includes(lhs.type) && rhs.type == "boolean") {
    return eval_boolean_binary_expr(lhs as BooleanVal, rhs as BooleanVal, binop.operator.value)
  }

  // string concatenation
  if (["string", "placeholder"].includes(lhs.type) && rhs.type == "string") {
    switch (binop.operator.value) {
      case "+":
        return eval_string_concatenation(
          lhs as StringVal,
          rhs as StringVal,
          binop.operator.value,
          context,
        )
      case "==":
      case "!=":
        return eval_string_binary_expr(lhs as StringVal, rhs as StringVal, binop.operator.value)
    }
  }

  throw new RuntimeError(
    context,
    `Invalid binary operation: ${lhs.type} ${binop.operator.value} ${rhs.type}`,
  )
}

export function eval_identifier(ident: Identifier, env: Environment, _context: ExecutionContext) {
  const val = env.lookupVar(ident.symbol.value)
  return val
}

// struct fields must have type
// struct field can be optional
// optional fiedls can have default value

export function eval_struct_type(
  node: StructType,
  env: Environment,
  context: ExecutionContext,
): StructTypeVal {
  const members: Record<string, TypeVal> = {}
  const optional: Record<string, boolean> = {}

  for (const member of node.members) {
    const memberType = evaluate(member.type, context, env) as TypeVal
    if (memberType.type !== "type") {
      throw new RuntimeError(context, `Expected type for struct member but got ${memberType.type}`)
    }

    members[member.name.value] = memberType
    optional[member.name.value] = member.optional
  }

  return {
    type: "type",
    typeKind: "struct",
    typeName: node.name?.value,
    members,
    optional,
  } as StructTypeVal
}

export function eval_object_expr(
  obj: ObjectLiteral,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  const typeName = obj.instanceOf.value
  const object = {
    type: "object",
    properties: new Map(),
    returned: false,
    instanceOf: typeName,
  } as ObjectVal

  const type = env.lookupType(typeName) as TypeVal

  // Handle generic types and type arguments
  let structType: StructTypeVal
  let typeArgMap: Map<string, TypeVal> | undefined

  // If it's a generic struct, we need to resolve the type arguments
  if (obj.typeArgs && obj.typeArgs.length > 0) {
    // Check if the type is generic
    if (type.typeKind !== "generic") {
      throw new RuntimeError(context, `Type '${typeName}' is not a generic struct`)
    }

    const genericType = type as GenericTypeVal

    // Check if the correct number of type arguments is provided
    if (obj.typeArgs.length !== genericType.parameters.length) {
      throw new RuntimeError(
        context,
        `Expected ${genericType.parameters.length} type arguments, but got ${obj.typeArgs.length}`,
      )
    }

    // Convert AST type nodes to TypeVal
    const typeArgValues: TypeVal[] = obj.typeArgs.map((arg) => {
      return convertTypeNodeToTypeVal(arg, env, context)
    })

    // Create type argument map for type checking
    typeArgMap = createTypeArgMap(genericType.parameters, typeArgValues)

    // Get the instantiated struct type with type arguments applied
    structType = getStructTypeFromGeneric(genericType, typeArgValues, context)
  } else {
    // For non-generic types, just get the struct type directly
    structType = getTypeOfKind(type as TypeVal, "struct") as StructTypeVal

    if (!structType) {
      // Check if struct is behind an alias
      // ie alias Employee = Person
      const primitive = getTypeOfKind(type as TypeVal, "primitive") as PrimitiveTypeVal
      if (primitive) {
        structType = env.lookupType(primitive.primitiveType) as StructTypeVal
        structType = {
          ...structType,
          isNominal: type.isNominal,
        }
      }
    }
  }

  if (!structType || structType.typeKind !== "struct") {
    throw new RuntimeError(context, `Type '${typeName}' is not a struct`)
  }

  if (structType.typeName) object.instanceOf = structType.typeName

  // Ensure all required fields are initialized
  for (const [fieldName, _fieldType] of Object.entries(structType.members)) {
    const providedProperty = obj.properties.find(({ key }) => key.value === fieldName)
    const isOptional = structType.optional[fieldName]
    let fieldType = _fieldType

    if (!providedProperty && !isOptional) {
      throw new RuntimeError(
        context,
        `Missing required field '${fieldName}' in struct '${typeName}'`,
      )
    }

    let runtimeVal: RuntimeVal = { type: "null", value: null } as NullVal

    if (providedProperty) {
      runtimeVal = providedProperty.value
        ? evaluate(providedProperty.value, context, env)
        : env.lookupVar(fieldName)

      // Handle object types with proper nominal/structural typing
      if (runtimeVal.type === "object" && (runtimeVal as ObjectVal).instanceOf) {
        const objectVal = runtimeVal as ObjectVal
        const expectedTypeName = fieldType.typeName ?? getTypeName(fieldType)
        const actualTypeName = objectVal.instanceOf

        let fieldTypeVal: TypeVal = fieldType
        if (fieldType.typeKind == "alias") {
          fieldTypeVal = getTypeOfKind(fieldType as TypeVal, "primitive") as PrimitiveTypeVal

          if (fieldTypeVal) {
            fieldType = env.lookupType(expectedTypeName) as TypeVal
          }
        }

        if (fieldType.isNominal) {
          // For nominal typing, need to handle aliases
          if (actualTypeName !== expectedTypeName) {
            // Check if the actual type is an alias of the expected type or vice versa
            let isCompatibleAlias = false

            // Check if actualTypeName is an alias of expectedTypeName
            const actualTypeVal = env.lookupType(actualTypeName) as TypeVal
            if (actualTypeVal && isAliasOfType(actualTypeVal, expectedTypeName, env)) {
              isCompatibleAlias = true
            }

            // Check if expectedTypeName is an alias of actualTypeName
            const expectedTypeVal = env.lookupType(expectedTypeName) as TypeVal
            if (
              !isCompatibleAlias &&
              expectedTypeVal &&
              isAliasOfType(expectedTypeVal, actualTypeName, env)
            ) {
              isCompatibleAlias = true
            }

            if (!isCompatibleAlias) {
              throw new RuntimeError(
                context,
                `Field '${fieldName}' in struct '${typeName}' must be of nominal type '${expectedTypeName}', but got '${actualTypeName}'`,
              )
            }
          }
        } else {
          // Structural typing - check field compatibility
          const runtimeType = getRuntimeType(runtimeVal)
          const [isCompatible] = areTypesCompatible(runtimeType, fieldType, typeArgMap)

          if (!isCompatible) {
            throw new RuntimeError(
              context,
              `Field '${fieldName}' in struct '${typeName}' is incompatible: types do not match structurally`,
            )
          }
        }
      } else {
        // Handle non-object types
        const runtimeType = getRuntimeType(runtimeVal)
        const [isCompatible] = areTypesCompatible(runtimeType, fieldType, typeArgMap)

        if (!isCompatible) {
          const expectedTypeName = getTypeName(fieldType)
          const actualTypeName = getTypeName(runtimeType)

          throw new RuntimeError(
            context,
            `Field '${fieldName}' in struct '${typeName}' must be of type '${expectedTypeName}', but got '${actualTypeName}'`,
          )
        }
      }
    }

    object.properties.set(fieldName, runtimeVal)
  }

  // Ensure there are no extra fields in the object
  for (const { key } of obj.properties) {
    if (!structType.members[key.value]) {
      throw new RuntimeError(context, `Unknown field '${key.value}' in struct '${typeName}'`)
    }
  }

  return object
}

export function eval_array_expr(
  arr: ArrayLiteral,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  const elements = arr.elements.map((el) => evaluate(el, context, env))

  return { type: "array", elements } as ArrayVal
}

function get_caller_name(
  env: Environment,
  callExpr: CallExpr,
  context: ExecutionContext,
): LeafNode<string> {
  if (callExpr.kind !== "CallExpr") {
    throw new RuntimeError(context, "Expected a CallExpr node")
  }

  let caller = callExpr.caller

  // Traverse nested CallExpr nodes to get to the base caller
  while (caller.kind === "CallExpr") {
    caller = (caller as CallExpr).caller
  }

  // Handle Identifier case
  if (caller.kind === "Identifier") {
    return (caller as Identifier).symbol
  }

  // Handle MemberExpr case safely
  if (caller.kind === "MemberExpr") {
    let objectName

    // Resolve object name if it's an identifier
    if ((caller as MemberExpr).object.kind === "Identifier") {
      const object = (caller as MemberExpr).object
      objectName = (object as Identifier).symbol
    } else if ((caller as MemberExpr).object.kind === "MemberExpr") {
      objectName = get_caller_name(env, (caller as MemberExpr).object as CallExpr, context) // Recursively get nested member expressions
    } else {
      throw new RuntimeError(
        context,
        "Invalid MemberExpr: object must be an Identifier or another MemberExpr",
      )
    }

    // Resolve property name if it's an identifier
    if ((caller as MemberExpr).property.kind !== "Identifier") {
      throw new RuntimeError(context, "Invalid MemberExpr: property must be an Identifier")
    }

    const property = (caller as MemberExpr).property
    const propertyName = (property as Identifier).symbol

    return {
      value: `${objectName.value}.${propertyName.value}`,
      position: {
        start: propertyName.position.start,
        end: propertyName.position.end,
      },
    }
  }

  throw new RuntimeError(context, `Unsupported caller type: ${caller.kind}`)
}

export function eval_call_expr(
  expr: CallExpr,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  const fnName = get_caller_name(env, expr, context)
  const args = expr.args.map((arg) => evaluate(arg, context, env))
  const fn = evaluate(expr.caller, context, env)

  if (fn.type == "nativefn") {
    const result = (fn as NativeFnVal).call(args, env)
    return result
  }

  if (fn.type != "function") {
    throw new RuntimeError(context, `${fn.type} is not callable`)
  }

  context.pushCallStack({
    functionName: fnName.value,
    filename: "main", // TODO
    position: fnName.position,
  })

  const fnc = fn as FunctionVal
  const scope = new Environment(context, fnc.declarationEnv)
  const numParams = fnc.parameters.length

  // Check if we got args for all params (params are required by default)
  // TODO Better error handling here
  if (args.length != numParams)
    throw new RuntimeError(
      context,
      `Num of params passed to the function are greater or less than defined args in function declaration`,
    )

  // create variables for params
  for (let i = 0; i < numParams; i++) {
    const param = fnc.parameters[i]
    const arg = args[i]
    scope.declareVar(
      param.name,
      arg.type != "null" ? arg : param.default,
      "variable",
      param.valueType,
    )
  }

  let result: RuntimeVal = MK_NULL()

  result = eval_code_block(fnc.body, scope, context)

  context.popCallStack()

  return result
}

export function eval_assignment(
  node: AssignmentExpr,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  if (node.assigne.kind !== "Identifier")
    throw new RuntimeError(context, "Invalid LHS inside assignment expr")
  const varname = (node.assigne as Identifier).symbol.value
  const value = evaluate(node.value, context, env)

  return env.assignVar(varname, value)
}

export function eval_string_literal(
  node: StringLiteral,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  let str = node.value.value
  for (const ident of node.identifiers) {
    const result = env.lookupVar(ident.replace("$", "")) as StringVal | NumberVal | BooleanVal
    str = str.replace(ident, result.value.toString())
  }

  for (const [placeholder, expr] of Object.entries(node.expressions)) {
    const result = evaluate(expr, context, env) as StringVal | NumberVal | BooleanVal
    str = str.replace(placeholder, result.value.toString())
  }

  return { type: "string", value: str } as StringVal
}

export function eval_member_expr(
  expr: MemberExpr,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  const varname = (expr.object as Identifier).symbol.value
  const ident = env.resolve(varname).lookupVar(varname)

  switch (ident.type) {
    case "array": {
      const arr = ident as ArrayVal
      if (expr.property.kind == "NumericLiteral") {
        const index = expr.property as NumericLiteral

        if (index.value.value >= arr.elements.length)
          throw new RuntimeError(
            context,
            `Index ${index.value} is out of bounds of the array '${varname}'`,
          )

        return arr.elements[index.value.value]
      } else if (expr.property.kind == "Identifier") {
        const indexIdent = expr.property as Identifier
        const index = env.lookupVar(indexIdent.symbol.value)
        if (index.type !== "number") throw new RuntimeError(context, "Index must be a number")

        return arr.elements[(index as NumberVal).value]
      }

      break // to satisfy TS
    }
    case "object":
      // const obj = ident as ObjectVal
      throw new RuntimeError(context, "Object member access not implemented yet")

    default:
      throw new RuntimeError(context, "Cannot identify the type of variable")
  }

  return MK_NULL() // to satisfy TS
}

export function eval_comment_expr(_: DocComment, __: Environment): RuntimeVal {
  return { type: "docs", returned: false }
}
