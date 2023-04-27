import { FunctionDeclaration, Program, VarDeclaration } from "../../frontend/2-ast"
import Environment from "../environment"
import { evaluate } from "../interpreter"
import { MK_NULL } from "../macros"
import { FunctionVal, RuntimeVal } from "../values"

export function eval_program(program: Program, env: Environment): RuntimeVal {
  let evaluated: RuntimeVal = MK_NULL()

  for (const stmt of program.body) {
    evaluated = evaluate(stmt, env)
  }

  return evaluated
}

export function eval_var_declaration(declaration: VarDeclaration, env: Environment): RuntimeVal {
  const value = declaration.value ? evaluate(declaration.value, env) : MK_NULL()

  return env.declareVar(declaration.identifier, value, declaration.constant)
}

export function eval_fn_declaration(
  declaration: FunctionDeclaration,
  env: Environment
): RuntimeVal {
  const fn = {
    type: "function",
    name: declaration.name,
    paramteres: declaration.parameters,
    declarationEnv: env,
    body: declaration.body,
  } as FunctionVal

  return env.declareVar(declaration.name, fn, true)
}
