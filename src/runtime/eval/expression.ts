import { ArrayVal, BooleanVal, FunctionVal, StringVal } from "./../values"
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
} from "../../frontend/2-ast"
import Environment from "../environment"
import { evaluate } from "../interpreter"
import { MK_NULL } from "../macros"
import { NativeFnVal, NumberVal, ObjectVal, RuntimeVal } from "../values"
import { eval_code_block } from "./statements"

function eval_numeric_binary_expr(
  lhs: NumberVal,
  rhs: NumberVal,
  operator: string
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
  operator: string
): BooleanVal {
  let result = false

  if (operator == "==") result = lhs.value == rhs.value
  else if (operator == "!=") result = lhs.value != rhs.value
  else if (operator == "&&" || operator == "and") result = lhs.value && rhs.value
  else if (operator == "||" || operator == "or") result = lhs.value || rhs.value

  return { type: "boolean", value: result, returned: false }
}

export function eval_binary_expr(binop: BinaryExpr, env: Environment): RuntimeVal {
  const lhs = evaluate(binop.left, env)
  const rhs = evaluate(binop.right, env)

  if (lhs.type == "number" && rhs.type == "number") {
    return eval_numeric_binary_expr(lhs as NumberVal, rhs as NumberVal, binop.operator)
  }

  if (lhs.type == "boolean" && rhs.type == "boolean") {
    return eval_boolean_binary_expr(lhs as BooleanVal, rhs as BooleanVal, binop.operator)
  }

  // One or both are NULL
  return MK_NULL()
}

export function eval_identifier(ident: Identifier, env: Environment) {
  const val = env.lookupVar(ident.symbol)
  return val
}

export function eval_object_expr(obj: ObjectLiteral, env: Environment): RuntimeVal {
  const object = { type: "object", properties: new Map() } as ObjectVal

  for (const { key, value } of obj.properties) {
    const runtimeVal = value == undefined ? env.lookupVar(key) : evaluate(value, env)

    object.properties.set(key, runtimeVal)
  }

  return object
}

export function eval_array_expr(arr: ArrayLiteral, env: Environment): RuntimeVal {
  const elements = arr.elements.map((el) => evaluate(el, env))

  return { type: "array", elements } as ArrayVal
}

export function eval_call_expr(expr: CallExpr, env: Environment): RuntimeVal {
  const args = expr.args.map((arg) => evaluate(arg, env))
  const fn = evaluate(expr.caller, env)

  if (fn.type == "nativefn") {
    const result = (fn as NativeFnVal).call(args, env)
    return result
  }

  if (fn.type == "function") {
    const fnc = fn as FunctionVal
    const scope = new Environment(fnc.declarationEnv)
    const numParams = fnc.parameters.length

    // Check if we got args for all params (params are required by default)
    // TODO Better error handling here
    if (args.length != numParams)
      throw new Error(
        `Num of params passed to the function are greater or less than defined args in function declaration`
      )

    // create variables for params
    for (let i = 0; i < numParams; i++) {
      const param = fnc.parameters[i]
      const arg = args[i]
      scope.declareVar(
        param.name,
        arg.type != "null" ? arg : param.default,
        "variable",
        param.valueType
      )
    }

    let result: RuntimeVal = MK_NULL()

    result = eval_code_block(fnc.body, scope)

    return result
  }

  throw new Error("Cannot call value that is not a function")
}

export function eval_assignment(node: AssignmentExpr, env: Environment): RuntimeVal {
  if (node.assigne.kind !== "Identifier") throw new Error("Invalid LHS inside assignment expr")
  const varname = (node.assigne as Identifier).symbol
  const value = evaluate(node.value, env)

  return env.assignVar(varname, value)
}

export function eval_string_literal(node: StringLiteral, env: Environment): RuntimeVal {
  let str = node.value
  for (const ident of node.identifiers) {
    const result = env.lookupVar(ident.replace("$", "")) as StringVal | NumberVal | BooleanVal
    str = str.replace(ident, result.value.toString())
  }

  for (const [placeholder, expr] of Object.entries(node.expressions)) {
    const result = evaluate(expr, env) as StringVal | NumberVal | BooleanVal
    str = str.replace(placeholder, result.value.toString())
  }

  return { type: "string", value: str } as StringVal
}

export function eval_member_expr(expr: MemberExpr, env: Environment): RuntimeVal {
  const varname = (expr.object as Identifier).symbol
  const ident = env.resolve(varname).lookupVar(varname)

  switch (ident.type) {
    case "array": {
      const arr = ident as ArrayVal
      if (expr.property.kind == "NumericLiteral") {
        const index = expr.property as NumericLiteral

        if (index.value >= arr.elements.length)
          throw new Error(`Index ${index.value} is out of bounds of the array '${varname}'`)

        return arr.elements[index.value]
      } else if (expr.property.kind == "Identifier") {
        const indexIdent = expr.property as Identifier
        const index = env.resolve(indexIdent.symbol).lookupVar(indexIdent.symbol)
        if (index.type !== "number") throw new Error("Index must be a number")

        return arr.elements[(index as NumberVal).value]
      }
    }
    case "object":
      // const obj = ident as ObjectVal
      return {} as RuntimeVal

    default:
      throw new Error("Cannot identify the type of variable")
  }
}
