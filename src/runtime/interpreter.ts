import { NullVal, NumberVal, RuntimeVal, ValueType } from "./values"
import { BinaryExpr, NodeType, NumericLiteral, Program, Stmt } from "../frontend/ast"

function eval_program(program: Program): RuntimeVal {
  let evaluated: RuntimeVal = { type: "null", value: "null" } as NullVal

  for (const stmt of program.body) {
    evaluated = evaluate(stmt)
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

function eval_binary_expr(binop: BinaryExpr): RuntimeVal {
  const lhs = evaluate(binop.left)
  const rhs = evaluate(binop.right)

  if (lhs.type == "number" && rhs.type == "number") {
    return eval_numeric_binary_expr(lhs as NumberVal, rhs as NumberVal, binop.operator)
  }

  // One or both are NULL
  return { type: "null", value: "null" } as NullVal
}

export function evaluate(astNode: Stmt): RuntimeVal {
  switch (astNode.kind) {
    case "NumericLiteral":
      return {
        value: (astNode as NumericLiteral).value,
        type: "number",
      } as NumberVal
    case "NullLiteral":
      return { value: "null", type: "null" } as NullVal
    case "BinaryExpr":
      return eval_binary_expr(astNode as BinaryExpr)
    case "Program":
      return eval_program(astNode as Program)
    default:
      console.error("This AST can't be interpreted! For now atleast!")
      process.exit(0)
  }
}
