import { Stmt } from "../frontend/ast"
import Environment from "./environment"
import { TypeVal } from "./values.types"

export type ValueType =
  | "null"
  | "number"
  | "string"
  | "boolean"
  | "object"
  | "nativefn"
  | "function"
  | "return"
  | "paramter"
  | "conditional"
  | "whileloop"
  | "array"
  | "dynamic"
  | "docs"
  | "struct"
  | "type"
  | "break"
  | "continue"
  | "placeholder"

export interface RuntimeVal {
  type: ValueType
  returned: boolean
}

// Used for declaring a variable with loops as their value
// See eval_var_declaration in interpreter.ts
export interface PlaceholderVal extends RuntimeVal {
  type: "placeholder"
}

export interface NullVal extends RuntimeVal {
  type: "null"
  value: null
}
export interface BooleanVal extends RuntimeVal {
  type: "boolean"
  value: boolean
}

export interface NumberVal extends RuntimeVal {
  type: "number"
  value: number
}

export interface StringVal extends RuntimeVal {
  type: "string"
  value: string
}

export interface ObjectVal extends RuntimeVal {
  type: "object"
  properties: Map<string, RuntimeVal>
  instanceOf: string
}

export type FunctionCall = (args: RuntimeVal[], env: Environment) => RuntimeVal

export interface NativeFnVal extends RuntimeVal {
  type: "nativefn"
  call: FunctionCall
}

export interface ParamVal extends RuntimeVal {
  type: "paramter"
  name: string
  valueType?: TypeVal
  default: RuntimeVal // to assign a default value
}

export interface FunctionVal extends RuntimeVal {
  type: "function"
  name: string
  parameters: ParamVal[]
  declarationEnv: Environment
  body: Stmt[]
}

export interface ReturnVal extends RuntimeVal {
  type: "return"
  value: RuntimeVal | RuntimeVal[]
}

export interface ConditionalVal extends RuntimeVal {
  type: "conditional"
  check: RuntimeVal
  body: Stmt[]
  childChecks?: ConditionalVal[]
  else?: Stmt[]
}

export interface WhileLoopVal extends RuntimeVal {
  type: "whileloop"
  check: RuntimeVal
  body: Stmt[]
}

export interface BreakVal extends RuntimeVal {
  type: "break"
  loopId: string
  label?: string
  value?: RuntimeVal
}

export interface ContinueVal extends RuntimeVal {
  type: "continue"
  loopId: string
  label?: string
}

export interface ArrayVal extends RuntimeVal {
  type: "array"
  elements: RuntimeVal[]
}

export interface DocCommentVal extends RuntimeVal {
  type: "docs"
}
