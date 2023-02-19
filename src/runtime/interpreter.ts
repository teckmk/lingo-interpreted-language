import { NullVal, NumberVal, RuntimeVal, ValueType } from "./values"
import { BinaryExpr, Identifier, NodeType, NumericLiteral, Program, Stmt } from "../frontend/ast"
import Environment from "./environment"
import { MK_NULL } from "./macros"

function eval_program(program: Program, env: Environment): RuntimeVal {
  let evaluated: RuntimeVal = MK_NULL()

  for (const stmt of program.body) {
    evaluated = evaluate(stmt, env)
  }

  return evaluated
}

function eval_numeric_binary_expr(lhs: NumberVal, rhs: NumberVal, operator: string): NumberVal {
  let result = 0

  if (operator == "+") {
    result = lhs.value + rhs.value
  } else if (operator == "-") {
    result = lhs.value - rhs.value
  } else if (operator == "*") {
    result = lhs.value * rhs.value
  } else if (operator == "/") {
    // TODO: Division by zero-checks
    result = lhs.value / rhs.value
  } else {
    result = lhs.value % rhs.value
  }

  return { value: result, type: "number" }
}

function eval_binary_expr(binop: BinaryExpr, env: Environment): RuntimeVal {
  const lhs = evaluate(binop.left, env)
  const rhs = evaluate(binop.right, env)

  if (lhs.type == "number" && rhs.type == "number") {
    return eval_numeric_binary_expr(lhs as NumberVal, rhs as NumberVal, binop.operator)
  }

  // One or both are NULL
  return MK_NULL()
}

function eval_identifier(ident: Identifier, env: Environment) {
  const val = env.lookupVar(ident.symbol)
  return val
}

export function evaluate(astNode: Stmt, env: Environment): RuntimeVal {
  switch (astNode.kind) {
    case "NumericLiteral":
      return {
        value: (astNode as NumericLiteral).value,
        type: "number",
      } as NumberVal
    case "BinaryExpr":
      return eval_binary_expr(astNode as BinaryExpr, env)
    case "Identifier":
      return eval_identifier(astNode as Identifier, env)
    case "Program":
      return eval_program(astNode as Program, env)
    default:
      console.error("This AST can't be interpreted! For now atleast!")
      process.exit(0)
  }
}
