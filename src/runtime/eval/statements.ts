import {
  Expr,
  FunctionDeclaration,
  IfElseStatement,
  MultiVarDeclaration,
  Program,
  ReturnStatement,
  Stmt,
  TypeDeclaration,
  VarDeclaration,
  WhileStatement,
} from "../../frontend/ast"
import Environment from "../environment"
import { RuntimeError } from "../error"
import { ExecutionContext } from "../execution-context"
import { evaluate } from "../interpreter"
import { MK_NULL } from "../macros"
import { areTypesCompatible, getRuntimeType } from "../type-checker"
import { ArrayVal, BooleanVal, FunctionVal, ParamVal, ReturnVal, RuntimeVal } from "../values"
import { GenericTypeVal, PrimitiveTypeVal, TypeParameterVal, TypeVal } from "../values.types"

export function eval_program(
  program: Program,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  let evaluated: RuntimeVal = MK_NULL()

  for (const stmt of program.body) evaluated = evaluate(stmt, context, env)

  return evaluated
}

// Update in eval/statements.ts
export function eval_type_declaration(
  node: TypeDeclaration,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  // Evaluate the type definition
  const typeVal = evaluate(node.type, context, env) as TypeVal

  if (typeVal.type !== "type") {
    throw new RuntimeError(context, `Expected a type, got ${typeVal.type}`)
  }

  const typeName = node.name.name?.value || "unnamed"

  // If this is a generic type declaration, handle parameters
  if (node.name.kind === "GenericType") {
    if (node.name.parameters && node.name.parameters.length > 0) {
      // Store a template for the generic type
      // The actual instantiation happens in eval_generic_type
      const genericBase: GenericTypeVal = {
        type: "type",
        typeKind: "generic",
        typeName,
        parameters: node.name.parameters.map((p) => evaluate(p, context, env) as TypeParameterVal),
        baseType: typeVal,
        returned: false, // to satisfy TS
      }

      env.declareType(typeName, genericBase as TypeVal)
      return genericBase as RuntimeVal
    }
  }

  // For non-generic types, just store the type
  env.declareType(typeName, typeVal)
  return typeVal
}

export function eval_var_declaration(
  node: VarDeclaration,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  let value: RuntimeVal = { type: "null", returned: false }

  if (node.value) {
    value = evaluate(node.value, context, env)
  }

  // If a type is specified, check compatibility
  if (node.type) {
    const declaredType = evaluate(node.type, context, env) as TypeVal

    if (declaredType.type !== "type") {
      throw new RuntimeError(context, `Expected a type, got ${declaredType.type}`)
    }

    // Check if the value's type matches the declared type
    // This requires tracking runtime type information
    const [isCompatible, , targetType] = areTypesCompatible(getRuntimeType(value), declaredType)
    if (value.type !== "null" && !isCompatible) {
      throw new RuntimeError(
        context,
        `Type mismatch: Cannot assign value of type ${value.type} to variable of type ${declaredType.typeKind}`,
      )
    }

    // If the target type is dynamic, set the value type to dynamic, so it can be re-assigned with any type
    if (
      targetType.typeKind == "primitive" &&
      (targetType as PrimitiveTypeVal).primitiveType == "dynamic"
    ) {
      value = { ...value, type: "dynamic" }
    }
  }

  return env.declareVar(node.identifier.value, value, node.modifier)
}

export function eval_multi_var_declaration(
  declaration: MultiVarDeclaration,
  env: Environment,
  context: ExecutionContext,
): ArrayVal {
  const values = []
  for (const dec of declaration.variables) values.push(eval_var_declaration(dec, env, context))

  return { type: "array", elements: values, returned: false }
}

export function eval_fn_declaration(
  declaration: FunctionDeclaration,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  const parameters = declaration.parameters.map(
    (param) =>
      ({
        type: "paramter",
        name: param.name.value,
        valueType: param.type,
        default: param.default ? evaluate(param.default, context, env) : MK_NULL(),
      }) as ParamVal,
  )
  const fn = {
    type: "function",
    name: declaration.name.value,
    parameters,
    declarationEnv: env,
    body: declaration.body,
  } as FunctionVal

  return env.declareVar(declaration.name.value, fn, "final")
}

export function eval_return_statement(
  stmt: Stmt,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  const returnStmt = stmt as ReturnStatement
  const returnValue = Array.isArray(returnStmt.value)
    ? returnStmt.value.map((expr) => evaluate(expr, context, env))
    : evaluate(returnStmt.value, context, env)
  return { type: "return", value: returnValue } as ReturnVal
}

export function eval_code_block(
  block: Stmt[],
  parentEnv: Environment,
  context: ExecutionContext,
): RuntimeVal {
  const scope = new Environment(context, parentEnv)

  let result: RuntimeVal = MK_NULL()

  for (const stmt of block) {
    result = evaluate(stmt, context, scope)
    if (result.type == "return" || result.returned) return { ...result, returned: true }
  }

  return MK_NULL()
}

export function eval_condition(
  check: Expr,
  env: Environment,
  context: ExecutionContext,
): BooleanVal {
  const eval_check = evaluate(check, context, env) as BooleanVal

  if (eval_check.type != "boolean")
    throw new RuntimeError(context, "Restult of check in 'if' statment must be a boolean")

  return eval_check
}

export function eval_if_else_statement(
  ifstmt: IfElseStatement,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  const { condition: check, body, branches: childChecks } = ifstmt

  let result: RuntimeVal = MK_NULL()

  if (eval_condition(check, env, context).value) {
    result = eval_code_block(body, env, context)
  } else if (childChecks && childChecks.length > 0) {
    for (const acheck of childChecks) {
      if (eval_condition(acheck.condition, env, context).value) {
        result = eval_code_block(acheck.body, env, context)
        break
      }
    }
  } else if (ifstmt.else) result = eval_code_block(ifstmt.else, env, context)

  return result
}

export function eval_while_statement(
  loop: WhileStatement,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  while (eval_condition(loop.check, env, context).value) {
    eval_code_block(loop.body, env, context)
  }

  return MK_NULL()
}
