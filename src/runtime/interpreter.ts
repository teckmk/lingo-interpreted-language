import Environment from "./environment"
import { NumberVal, RuntimeVal, StringVal } from "./values"
import {
  AliasType,
  ArrayLiteral,
  ArrayType,
  AssignmentExpr,
  BinaryExpr,
  CallExpr,
  DocComment,
  FunctionDeclaration,
  GenericType,
  Identifier,
  IfElseStatement,
  MemberExpr,
  MultiVarDeclaration,
  NumericLiteral,
  ObjectLiteral,
  PrimitiveType,
  Program,
  ReturnStatement,
  Stmt,
  StringLiteral,
  StructType,
  TypeDeclaration,
  TypeParameter,
  UnionType,
  VarDeclaration,
  WhileStatement,
} from "../frontend/ast"

import {
  eval_fn_declaration,
  eval_if_else_statement,
  eval_multi_var_declaration,
  eval_program,
  eval_return_statement,
  eval_type_declaration,
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
  eval_struct_type,
} from "./eval/expression"
import { parse } from "../frontend/parser"
import { RuntimeError } from "./error"
import { ExecutionContext } from "./execution-context"
import {
  eval_alias_type,
  eval_array_type,
  eval_generic_type,
  eval_primitive_type,
  eval_type_parameter,
  eval_union_type,
} from "./eval/types"

export function evaluate(astNode: Stmt, context: ExecutionContext, env: Environment): RuntimeVal {
  switch (astNode.kind) {
    case "NumericLiteral":
      return {
        value: (astNode as NumericLiteral).value.value,
        type: "number",
      } as NumberVal
    case "StringLiteral":
      return eval_string_literal(astNode as StringLiteral, env, context) as StringVal
    case "BinaryExpr":
      return eval_binary_expr(astNode as BinaryExpr, env, context)
    case "AssignmentExpr":
      return eval_assignment(astNode as AssignmentExpr, env, context)
    case "Identifier":
      return eval_identifier(astNode as Identifier, env, context)
    case "ObjectLiteral":
      return eval_object_expr(astNode as ObjectLiteral, env, context)
    case "TypeDeclaration":
      return eval_type_declaration(astNode as TypeDeclaration, env, context)
    case "StructType":
      return eval_struct_type(astNode as StructType, env, context)
    case "AliasType":
      return eval_alias_type(astNode as AliasType, env, context)
    case "PrimitiveType":
      return eval_primitive_type(astNode as PrimitiveType, env, context)
    case "TypeParameter":
      return eval_type_parameter(astNode as TypeParameter, env, context)
    case "GenericType":
      return eval_generic_type(astNode as GenericType, env, context)
    case "UnionType":
      return eval_union_type(astNode as UnionType, env, context)
    case "ArrayType":
      return eval_array_type(astNode as ArrayType, env, context)
    case "ArrayLiteral":
      return eval_array_expr(astNode as ArrayLiteral, env, context)
    case "CallExpr":
      return eval_call_expr(astNode as CallExpr, env, context)
    case "Program":
      return eval_program(astNode as Program, env, context)
    case "VarDeclaration":
      return eval_var_declaration(astNode as VarDeclaration, env, context)
    case "MultiVarDeclaration":
      return eval_multi_var_declaration(astNode as MultiVarDeclaration, env, context)
    case "FunctionDeclaration":
      return eval_fn_declaration(astNode as FunctionDeclaration, env, context)
    case "ReturnStatement":
      return eval_return_statement(astNode as ReturnStatement, env, context)
    case "IfElseStatement":
      return eval_if_else_statement(astNode as IfElseStatement, env, context)
    case "WhileStatement":
      return eval_while_statement(astNode as WhileStatement, env, context)
    case "MemberExpr":
      return eval_member_expr(astNode as MemberExpr, env, context)
    case "DocComment":
      return eval_comment_expr(astNode as DocComment, env)
    default:
      console.error("This AST can't be interpreted! For now atleast!", astNode)
      process.exit(0)
  }
}

export function interpret(filename: string, code: string, env?: Environment): RuntimeVal | string {
  const executionContext = new ExecutionContext()
  env = env || new Environment(executionContext)
  try {
    const ast = parse(filename, code)
    return evaluate(ast, executionContext, env)
  } catch (e) {
    let error = (e as { message: string }).message + "\n"

    if (e instanceof RuntimeError) {
      const stack = executionContext.getCallStack() || []

      if (stack.length) {
        error += ExecutionContext.formatStackTrace(stack)
      }
    }

    return error
  }
}
