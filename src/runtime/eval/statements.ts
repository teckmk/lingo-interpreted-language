import {
  BreakStatement,
  ContinueStatement,
  Expr,
  ForInStatement,
  ForRangeStatement,
  ForStatement,
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
import {
  ArrayVal,
  BooleanVal,
  BreakVal,
  ContinueVal,
  FunctionVal,
  NumberVal,
  ParamVal,
  ReturnVal,
  RuntimeVal,
  StringVal,
} from "../values"
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
  const parameters: ParamVal[] = declaration.parameters.map((param) => ({
    type: "paramter",
    name: param.name.value,
    valueType: (param.type && evaluate(param.type, context, env)) as TypeVal,
    default: param.default ? evaluate(param.default, context, env) : MK_NULL(),
    returned: false, // to satisfy TS
  }))
  const fn: FunctionVal = {
    type: "function",
    name: declaration.name.value,
    parameters,
    declarationEnv: env,
    body: declaration.body,
    returned: false, // to satisfy TS
  }

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
  const loopId = `while_${Math.random().toString(36).substring(2, 9)}`
  context.enterLoop(loopId, loop.label?.value)

  let result: RuntimeVal = MK_NULL()

  while (eval_condition(loop.check, env, context).value) {
    try {
      result = eval_code_block(loop.body, env, context)
      if (result.type === "break") {
        if ((result as BreakVal).loopId === loopId) {
          result = MK_NULL()
          break
        }
        // If break is for a different loop, rethrow
        throw result
      }
      if (result.type === "continue") {
        if ((result as ContinueVal).loopId === loopId) {
          result = MK_NULL()
          continue
        }
        // If continue is for a different loop, rethrow
        throw result
      }
      if (result.type === "return" || result.returned) {
        return result
      }
    } catch (e) {
      if (e instanceof RuntimeError) throw e
      // Handle break/continue from nested loops
      if (e && typeof e === "object" && "type" in e) {
        if (e.type === "break" && (e as BreakVal).loopId === loopId) {
          break
        }
        if (e.type === "continue" && (e as ContinueVal).loopId === loopId) {
          continue
        }
        throw e
      }
      throw e
    }
  }

  context.exitLoop()
  return result
}

export function eval_for_statement(
  loop: ForStatement,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  const loopId = `for_${Math.random().toString(36).substring(2, 9)}`
  context.enterLoop(loopId, loop.label?.value)

  // Initialize
  if (loop.initializer) {
    evaluate(loop.initializer, context, env)
  }

  let result: RuntimeVal = MK_NULL()

  // Check condition (default to true if not provided)
  while (loop.condition ? eval_condition(loop.condition, env, context).value : true) {
    try {
      // Execute body
      result = eval_code_block(loop.body, env, context)

      if (result.type === "break") {
        if ((result as BreakVal).loopId === loopId) {
          result = MK_NULL()
          break
        }
        throw result
      }
      if (result.type === "continue") {
        if ((result as ContinueVal).loopId === loopId) {
          result = MK_NULL()
          // Still execute update before continuing
          if (loop.update) evaluate(loop.update, context, env)
          continue
        }
        throw result
      }
      if (result.type === "return" || result.returned) {
        return result
      }

      // Execute update
      if (loop.update) {
        evaluate(loop.update, context, env)
      }
    } catch (e) {
      if (e instanceof RuntimeError) throw e
      if (e && typeof e === "object" && "type" in e) {
        if (e.type === "break" && (e as BreakVal).loopId === loopId) {
          break
        }
        if (e.type === "continue" && (e as ContinueVal).loopId === loopId) {
          if (loop.update) evaluate(loop.update, context, env)
          continue
        }
        throw e
      }
      throw e
    }
  }

  context.exitLoop()
  return result
}

export function eval_for_in_statement(
  loop: ForInStatement,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  const loopId = `forin_${Math.random().toString(36).substring(2, 9)}`
  context.enterLoop(loopId, loop.label?.value)

  const iterable = evaluate(loop.iterable, context, env)
  let result: RuntimeVal = MK_NULL()

  if (iterable.type !== "array" && iterable.type !== "string") {
    throw new RuntimeError(
      context,
      `For..in loops can only iterate over arrays or strings, got ${iterable.type}`,
    )
  }

  const elements =
    iterable.type === "array"
      ? (iterable as ArrayVal).elements
      : (iterable as StringVal).value.split("").map(
          (char) =>
            ({
              type: "string",
              value: char,
              returned: false,
            }) as StringVal,
        )

  for (let i = 0; i < elements.length; i++) {
    try {
      // Create block scope for loop iteration
      const scope = new Environment(context, env)

      // Declare value and index variables
      scope.declareVar(loop.valueIdentifier.value, elements[i], "variable")
      scope.declareVar(
        loop.indexIdentifier.value,
        { type: "number", value: i } as NumberVal,
        "variable",
      )

      // Execute body
      result = eval_code_block(loop.body, scope, context)

      if (result.type === "break") {
        if ((result as BreakVal).loopId === loopId) {
          result = MK_NULL()
          break
        }
        throw result
      }
      if (result.type === "continue") {
        if ((result as ContinueVal).loopId === loopId) {
          result = MK_NULL()
          continue
        }
        throw result
      }
      if (result.type === "return" || result.returned) {
        return result
      }
    } catch (e) {
      if (e instanceof RuntimeError) throw e
      if (e && typeof e === "object" && "type" in e) {
        if (e.type === "break" && (e as BreakVal).loopId === loopId) {
          break
        }
        if (e.type === "continue" && (e as ContinueVal).loopId === loopId) {
          continue
        }
        throw e
      }
      throw e
    }
  }

  context.exitLoop()
  return result
}

export function eval_for_range_statement(
  loop: ForRangeStatement,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  const loopId = `forrange_${Math.random().toString(36).substring(2, 9)}`
  context.enterLoop(loopId, loop.label?.value)

  // Evaluate range parameters
  const startVal = evaluate(loop.start, context, env) as NumberVal
  if (startVal.type !== "number") {
    throw new RuntimeError(context, "Range start must be a number")
  }

  const endVal = loop.end
    ? (evaluate(loop.end, context, env) as NumberVal)
    : ({ type: "number", value: Infinity } as NumberVal)

  if (endVal.type !== "number") {
    throw new RuntimeError(context, "Range end must be a number")
  }

  const stepVal = loop.step
    ? (evaluate(loop.step, context, env) as NumberVal)
    : ({ type: "number", value: 1 } as NumberVal)
  if (stepVal.type !== "number") {
    throw new RuntimeError(context, "Range step must be a number")
  }

  if (stepVal.value === 0) {
    throw new RuntimeError(context, "Range step cannot be zero")
  }

  let result: RuntimeVal = MK_NULL()

  // Determine direction
  const isIncreasing = stepVal.value > 0

  for (
    let i = startVal.value, idx = 0;
    isIncreasing
      ? loop.inclusive
        ? i <= endVal.value
        : i < endVal.value
      : loop.inclusive
        ? i >= endVal.value
        : i > endVal.value;
    i += stepVal.value, idx++
  ) {
    try {
      // Create block scope for loop iteration
      const scope = new Environment(context, env)

      // Declare value and index variables
      scope.declareVar(
        loop.valueIdentifier.value,
        { type: "number", value: i } as NumberVal,
        "variable",
      )
      scope.declareVar(
        loop.indexIdentifier.value,
        { type: "number", value: idx } as NumberVal,
        "variable",
      )

      // Execute body
      result = eval_code_block(loop.body, scope, context)

      if (result.type === "break") {
        if ((result as BreakVal).loopId === loopId) {
          result = MK_NULL()
          break
        }
        throw result
      }
      if (result.type === "continue") {
        if ((result as ContinueVal).loopId === loopId) {
          result = MK_NULL()
          continue
        }
        throw result
      }
      if (result.type === "return" || result.returned) {
        return result
      }
    } catch (e) {
      if (e instanceof RuntimeError) throw e
      if (e && typeof e === "object" && "type" in e) {
        if (e.type === "break" && (e as BreakVal).loopId === loopId) {
          break
        }
        if (e.type === "continue" && (e as ContinueVal).loopId === loopId) {
          continue
        }
        throw e
      }
      throw e
    }
  }

  context.exitLoop()
  return result
}

export function eval_break_statement(
  stmt: BreakStatement,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  if (!context.isInLoop()) {
    throw new RuntimeError(context, "Break statement can only be used inside a loop")
  }

  return {
    type: "break",
    loopId: stmt.loopId,
    label: stmt.label?.value,
  } as BreakVal
}

export function eval_continue_statement(
  stmt: ContinueStatement,
  env: Environment,
  context: ExecutionContext,
): RuntimeVal {
  if (!context.isInLoop()) {
    throw new RuntimeError(context, "Continue statement can only be used inside a loop")
  }

  return {
    type: "continue",
    loopId: stmt.loopId,
    label: stmt.label?.value,
  } as ContinueVal
}
