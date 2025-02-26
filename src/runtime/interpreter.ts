import Environment from "./environment"
import { NumberVal, RuntimeVal, StringVal } from "./values"
import {
  ArrayLiteral,
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  DocComment,
  FunctionDeclaration,
  Identifier,
  IfElseStatement,
  MemberExpr,
  MultiVarDeclaration,
  NumericLiteral,
  ObjectLiteral,
  Program,
  ReturnStatement,
  Stmt,
  StringLiteral,
  VarDeclaration,
  WhileStatement,
} from "../frontend/ast"

import {
  eval_fn_declaration,
  eval_if_else_statement,
  eval_multi_var_declaration,
  eval_program,
  eval_return_statement,
  eval_var_declaration,
  eval_while_statement,
} from "./eval/statements"
import {
  eval_array_expr,
  eval_assignment,
  eval_binary_expr,
  eval_call_expr,
  eval_comment_expr,
  eval_identifier,
  eval_member_expr,
  eval_object_expr,
  eval_string_literal,
} from "./eval/expression"
import { parse } from "../frontend/parser"

export function evaluate(astNode: Stmt, env: Environment = new Environment()): RuntimeVal {
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
    case "ArrayLiteral":
      return eval_array_expr(astNode as ArrayLiteral, env)
    case "CallExpr":
      return eval_call_expr(astNode as CallExpr, env)
    case "Program":
      return eval_program(astNode as Program, env)
    case "VarDeclaration":
      return eval_var_declaration(astNode as VarDeclaration, env)
    case "MultiVarDeclaration":
      return eval_multi_var_declaration(astNode as MultiVarDeclaration, env)
    case "FunctionDeclaration":
      return eval_fn_declaration(astNode as FunctionDeclaration, env)
    case "ReturnStatement":
      return eval_return_statement(astNode as ReturnStatement, env)
    case "IfElseStatement":
      return eval_if_else_statement(astNode as IfElseStatement, env)
    case "WhileStatement":
      return eval_while_statement(astNode as WhileStatement, env)
    case "MemberExpr":
      return eval_member_expr(astNode as MemberExpr, env)
    case "DocComment":
      return eval_comment_expr(astNode as DocComment, env)
    default:
      console.error("This AST can't be interpreted! For now atleast!", astNode)
      process.exit(0)
  }
}

export function interpret(
  filename: string,
  code: string,
  env: Environment = new Environment(),
): RuntimeVal {
  const ast = parse(filename, code)
  return evaluate(ast, env)
}
