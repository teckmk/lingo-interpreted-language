import {
  Expr,
  FunctionDeclaration,
  IfElseStatement,
  MultiVarDeclaration,
  Program,
  ReturnStatement,
  Stmt,
  VarDeclaration,
  WhileStatement,
} from "../../frontend/ast"
import Environment from "../environment"
import { evaluate } from "../interpreter"
import { MK_NULL } from "../macros"
import { ArrayVal, BooleanVal, FunctionVal, ParamVal, ReturnVal, RuntimeVal } from "../values"

export function eval_program(program: Program, env: Environment): RuntimeVal {
  let evaluated: RuntimeVal = MK_NULL()

  for (const stmt of program.body) evaluated = evaluate(stmt, env)

  return evaluated
}

export function eval_var_declaration(declaration: VarDeclaration, env: Environment): RuntimeVal {
  let value = declaration.value ? evaluate(declaration.value, env) : MK_NULL()

  if (declaration.type) {
    if (declaration.type !== "dynamic" && declaration.type !== value.type) {
      throw new Error(
        `Can't initialize variable of type ${declaration.type} with value of type ${value.type}`,
      )
    } else if (declaration.type === "dynamic") {
      value = { ...value, type: "dynamic" }
    }
  }

  return env.declareVar(declaration.identifier, value, declaration.modifier)
}

export function eval_multi_var_declaration(
  declaration: MultiVarDeclaration,
  env: Environment,
): ArrayVal {
  const values = []
  for (const dec of declaration.variables) values.push(eval_var_declaration(dec, env))

  return { type: "array", elements: values, returned: false }
}

export function eval_fn_declaration(
  declaration: FunctionDeclaration,
  env: Environment,
): RuntimeVal {
  const parameters = declaration.parameters.map(
    (param) =>
      ({
        type: "paramter",
        name: param.name,
        valueType: param.type,
        default: param.default ? evaluate(param.default, env) : MK_NULL(),
      }) as ParamVal,
  )
  const fn = {
    type: "function",
    name: declaration.name,
    parameters,
    declarationEnv: env,
    body: declaration.body,
  } as FunctionVal

  return env.declareVar(declaration.name, fn, "final")
}

export function eval_return_statement(stmt: Stmt, env: Environment): RuntimeVal {
  const returnStmt = stmt as ReturnStatement
  const returnValue = Array.isArray(returnStmt.value)
    ? returnStmt.value.map((expr) => evaluate(expr, env))
    : evaluate(returnStmt.value, env)
  return { type: "return", value: returnValue } as ReturnVal
}

export function eval_code_block(block: Stmt[], parentEnv: Environment): RuntimeVal {
  const scope = new Environment(parentEnv)

  let result: RuntimeVal = MK_NULL()

  for (const stmt of block) {
    result = evaluate(stmt, scope)
    if (result.type == "return" || result.returned) return { ...result, returned: true }
  }

  return MK_NULL()
}

export function eval_condition(check: Expr, env: Environment): BooleanVal {
  const eval_check = evaluate(check, env) as BooleanVal

  if (eval_check.type != "boolean")
    throw new Error("Restult of check in 'if' statment must be a boolean")

  return eval_check
}

export function eval_if_else_statement(ifstmt: IfElseStatement, env: Environment): RuntimeVal {
  const { condition: check, body, branches: childChecks } = ifstmt

  let result: RuntimeVal = MK_NULL()

  if (eval_condition(check, env).value) {
    result = eval_code_block(body, env)
  } else if (childChecks && childChecks.length > 0) {
    for (const acheck of childChecks) {
      if (eval_condition(acheck.condition, env).value) {
        result = eval_code_block(acheck.body, env)
        break
      }
    }
  } else if (ifstmt.else) result = eval_code_block(ifstmt.else, env)

  return result
}

export function eval_while_statement(loop: WhileStatement, env: Environment): RuntimeVal {
  while (eval_condition(loop.check, env).value) {
    eval_code_block(loop.body, env)
  }

  return MK_NULL()
}
