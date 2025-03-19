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

export interface RuntimeVal {
  type: ValueType
  returned: boolean
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
}

export interface StructVal extends RuntimeVal {
  type: "struct"
  fields: Map<string, { type: TypeVal; optional: boolean }>
}

export type FunctionCall = (args: RuntimeVal[], env: Environment) => RuntimeVal

export interface NativeFnVal extends RuntimeVal {
  type: "nativefn"
  call: FunctionCall
}

export interface ParamVal extends RuntimeVal {
  type: "paramter"
  name: string
  valueType?: ValueType
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

export interface ArrayVal extends RuntimeVal {
  type: "array"
  elements: RuntimeVal[]
}

export interface DocCommentVal extends RuntimeVal {
  type: "docs"
}
