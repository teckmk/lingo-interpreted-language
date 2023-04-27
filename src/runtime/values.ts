import { Stmt } from "../frontend/2-ast"
import Environment from "./environment"

export type ValueType = "null" | "number" | "boolean" | "object" | "nativefn" | "function"

export interface RuntimeVal {
  type: ValueType
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

export interface ObjectVal extends RuntimeVal {
  type: "object"
  properties: Map<string, RuntimeVal>
}

export type FunctionCall = (args: RuntimeVal[], env: Environment) => RuntimeVal

export interface NativeFnVal extends RuntimeVal {
  type: "nativefn"
  call: FunctionCall
}

export interface FunctionVal extends RuntimeVal {
  type: "function"
  name: string
  paramteres: string[]
  declarationEnv: Environment
  body: Stmt[]
}
