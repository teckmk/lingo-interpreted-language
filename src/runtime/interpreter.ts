import Environment from "./environment"
import { NumberVal, RuntimeVal, StringVal } from "./values"
import {
  eval_fn_declaration,
  eval_if_else_statement,
  eval_program,
  eval_var_declaration,
  eval_while_statement,
} from "./eval/statements"
import {
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  FunctionDeclaration,
  Identifier,
  IfElseStatement,
  NumericLiteral,
  ObjectLiteral,
  Program,
  Stmt,
  StringLiteral,
  VarDeclaration,
  WhileStatement,
} from "../frontend/2-ast"
import {
  eval_assignment,
  eval_binary_expr,
  eval_call_expr,
  eval_identifier,
  eval_object_expr,
  eval_string_literal,
} from "./eval/expression"

export function evaluate(astNode: Stmt, env: Environment): RuntimeVal {
  switch (astNode.kind) {
    case "NumericLiteral":
      return {
        value: (astNode as NumericLiteral).value,
        type: "number",
      } as NumberVal
    case "StringLiteral":
      return eval_string_literal(astNode as StringLiteral, env) as StringVal
    case "BinaryExpr":
      return eval_binary_expr(astNode as BinaryExpr, env)
    case "AssignmentExpr":
      return eval_assignment(astNode as AssignmentExpr, env)
    case "Identifier":
      return eval_identifier(astNode as Identifier, env)
    case "ObjectLiteral":
      return eval_object_expr(astNode as ObjectLiteral, env)
    case "CallExpr":
      return eval_call_expr(astNode as CallExpr, env)
    case "Program":
      return eval_program(astNode as Program, env)
    case "VarDeclaration":
      return eval_var_declaration(astNode as VarDeclaration, env)
    case "FunctionDeclaration":
      return eval_fn_declaration(astNode as FunctionDeclaration, env)
    case "IfElseStatement":
      return eval_if_else_statement(astNode as IfElseStatement, env)
    case "WhileStatement":
      return eval_while_statement(astNode as WhileStatement, env)
    default:
      console.error("This AST can't be interpreted! For now atleast!", astNode)
      process.exit(0)
  }
}
