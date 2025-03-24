import { DocComment, LeafNode, StructType, TypeNode } from "../../frontend/ast"
import { ArrayVal, BooleanVal, FunctionVal, NullVal, StringVal } from "./../values"
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
import {
  ArrayTypeVal,
  GenericTypeVal,
  PrimitiveTypeVal,
  StructTypeVal,
  TypeParameterVal,
  TypeVal,
  UnionTypeVal,
} from "../values.types"
import {
  areTypesCompatible,
  createTypeArgMap,
  getRuntimeType,
  getTypeName,
  getTypeOfKind,
  instantiateGenericType,
} from "../type-checker"

function eval_numeric_binary_expr(
  lhs: NumberVal,
  rhs: NumberVal,
  operator: string,
): NumberVal | BooleanVal {
  if ([">", "<", "==", "!=", "==", ">=", "<="].includes(operator)) {
    let result = false
    if (operator == ">") result = lhs.value > rhs.value
    else if (operator == "<") result = lhs.value < rhs.value
    else if (operator == "==") result = lhs.value == rhs.value
    else if (operator == "!=") result = lhs.value != rhs.value
    else if (operator == ">=") result = lhs.value >= rhs.value
    else if (operator == "<=") result = lhs.value <= rhs.value

    return { type: "boolean", value: result, returned: false }
  }

  let result = 0

  if (operator == "+") result = lhs.value + rhs.value
  else if (operator == "-") result = lhs.value - rhs.value
  else if (operator == "*") result = lhs.value * rhs.value
  else if (operator == "/") result = lhs.value / rhs.value
  else result = lhs.value % rhs.value

  return { type: "number", value: result, returned: false }
}

export function eval_boolean_binary_expr(
  lhs: BooleanVal,
  rhs: BooleanVal,
  operator: string,
): BooleanVal {
  let result = false

  if (operator == "==") result = lhs.value == rhs.value
  else if (operator == "!=") result = lhs.value != rhs.value
  else if (operator == "&&" || operator == "and") result = lhs.value && rhs.value
  else if (operator == "||" || operator == "or") result = lhs.value || rhs.value

  return { type: "boolean", value: result, returned: false }
}

export function eval_binary_expr(
  binop: BinaryExpr,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  const lhs = evaluate(binop.left, context, env)
  const rhs = evaluate(binop.right, context, env)

  if (lhs.type == "number" && rhs.type == "number") {
    return eval_numeric_binary_expr(lhs as NumberVal, rhs as NumberVal, binop.operator.value)
  }

  if (lhs.type == "boolean" && rhs.type == "boolean") {
    return eval_boolean_binary_expr(lhs as BooleanVal, rhs as BooleanVal, binop.operator.value)
  }

  // One or both are NULL
  return MK_NULL()
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
  const object = { type: "object", properties: new Map(), returned: false } as ObjectVal

  const typeName = obj.instanceOf.value
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
      // This assumes you have a function to convert AST type nodes to TypeVal
      // You might need to implement this function or adapt an existing one
      return convertTypeNodeToTypeVal(arg, env, context)
    })

    // Create type argument map for type checking
    typeArgMap = createTypeArgMap(genericType.parameters, typeArgValues)

    // Get the instantiated struct type with type arguments applied
    structType = getStructTypeFromGeneric(genericType, typeArgValues, context)
  } else {
    // For non-generic types, just get the struct type directly
    structType = getTypeOfKind(type as TypeVal, "struct") as StructTypeVal
  }

  if (!structType) {
    throw new RuntimeError(context, `Type '${typeName}' is not a struct`)
  }

  // Ensure all required fields are initialized
  for (const [fieldName, fieldType] of Object.entries(structType.members)) {
    const providedProperty = obj.properties.find(({ key }) => key.value === fieldName)
    const isOptional = structType.optional[fieldName]

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

      // Get the runtime type of the value
      const runtimeType = getRuntimeType(runtimeVal)

      // Type check with type arguments if available
      const [isCompatible] = areTypesCompatible(runtimeType, fieldType, typeArgMap)

      if (!isCompatible) {
        // Improved error message that handles complex types
        const expectedTypeName = getTypeName(fieldType)
        const actualTypeName = getTypeName(runtimeType)

        throw new RuntimeError(
          context,
          `Field '${fieldName}' in struct '${typeName}' must be of type '${expectedTypeName}', but got '${actualTypeName}'`,
        )
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
function convertTypeNodeToTypeVal(
  typeNode: TypeNode,
  env: Environment,
  context: ExecutionContext,
): TypeVal {
  switch (typeNode.kind) {
    case "PrimitiveType":
      return {
        type: "type",
        typeKind: "primitive",
        primitiveType: typeNode.name.value,
      } as PrimitiveTypeVal

    case "AliasType": {
      // Look up the actual type in the environment
      const typeName = typeNode.name?.value
      const isPredefinedPrimitive =
        typeName === "string" || typeName === "number" || typeName === "bool"

      if (typeName && !isPredefinedPrimitive) {
        const type = env.lookupType(typeName)
        if (!type) {
          throw new RuntimeError(context, `Unknown type '${typeName}'`)
        }
        return type as TypeVal
      }
      // If it's an inline alias type or predefined primitive, convert its actual type
      return convertTypeNodeToTypeVal(typeNode.actualType, env, context)
    }

    case "StructType":
      // This would need to handle converting struct type nodes to StructTypeVal
      // Implementation depends on how you represent structs in your AST
      throw new RuntimeError(context, "Inline struct types not supported as type arguments yet")

    case "ArrayType":
      return {
        type: "type",
        typeKind: "array",
        elementType: convertTypeNodeToTypeVal(typeNode.elementType, env, context),
      } as ArrayTypeVal

    case "UnionType":
      return {
        type: "type",
        typeKind: "union",
        unionTypes: typeNode.types.map((t) => convertTypeNodeToTypeVal(t, env, context)),
      } as UnionTypeVal

    case "GenericType": {
      // For generic types, convert the base type and parameters
      const baseType = typeNode.name?.value ? env.lookupType(typeNode.name.value) : null
      if (!baseType) {
        throw new RuntimeError(
          context,
          `Unknown generic type '${typeNode.name?.value || "anonymous"}'`,
        )
      }

      // Convert type parameters
      const parameters = typeNode.parameters.map((param) => {
        return {
          type: "type",
          typeKind: "typeParameter",
          name: param.name.value,
          constraint: param.constraint
            ? convertTypeNodeToTypeVal(param.constraint, env, context)
            : undefined,
        } as TypeParameterVal
      })

      return {
        type: "type",
        typeKind: "generic",
        typeName: typeNode.name?.value,
        baseType: baseType as TypeVal,
        parameters,
      } as GenericTypeVal
    }
    default:
      throw new RuntimeError(context, `Unsupported type node kind: ${(typeNode as TypeNode).kind}`)
  }
}

// Helper function to get struct type from a generic type
function getStructTypeFromGeneric(
  genericType: GenericTypeVal,
  typeArgs: TypeVal[],
  context: ExecutionContext,
): StructTypeVal {
  // Instantiate the generic type with concrete type arguments
  const instantiatedType = instantiateGenericType(genericType, typeArgs)

  // Get the struct type from the instantiated type
  const structType = getTypeOfKind(instantiatedType, "struct") as StructTypeVal

  if (!structType) {
    throw new RuntimeError(context, `Generic type does not resolve to a struct`)
  }

  return structType
}

// Helper function to get a human-readable type name

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
      return {} as RuntimeVal

    default:
      throw new RuntimeError(context, "Cannot identify the type of variable")
  }

  return MK_NULL() // to satisfy TS
}

export function eval_comment_expr(_: DocComment, __: Environment): RuntimeVal {
  return { type: "docs", returned: false }
}
