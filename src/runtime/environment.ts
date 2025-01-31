import { VarModifier } from "../frontend/2-ast"
import { MK_BOOL, MK_NATIVE_FN, MK_NULL } from "./macros"
import {
  ArrayVal,
  RuntimeVal,
  BooleanVal,
  FunctionVal,
  NumberVal,
  StringVal,
  NullVal,
  ValueType,
  ReturnVal,
} from "./values"

export default class Environment {
  private parent?: Environment
  private variables: Map<string, RuntimeVal>
  private constants: Set<string>
  private finals: Set<string>

  constructor(parentEnv?: Environment) {
    this.parent = parentEnv
    this.variables = new Map()
    this.constants = new Set()
    this.finals = new Set()

    const global = Boolean(parentEnv) == false
    if (global) {
      // global variables
      this.declareVar("true", MK_BOOL(true), "constant")
      this.declareVar("false", MK_BOOL(false), "constant")
      this.declareVar("null", MK_NULL(), "constant")

      // global native functions
      this.declareVar(
        "print",
        MK_NATIVE_FN((args: RuntimeVal[], _: Environment) => {
          const getValue = (arg: RuntimeVal): any => {
            const argType = arg.type

            switch (argType) {
              case "string":
                return (arg as StringVal).value
              case "number":
                return (arg as NumberVal).value
              case "boolean":
                return (arg as BooleanVal).value
              case "null":
                return (arg as NullVal).value
              case "array":
                return (arg as ArrayVal).elements.map(getValue)
              case "return":
                return getValue((arg as ReturnVal).value)
              case "function": {
                const fn = arg as FunctionVal
                return `fn ${fn.name}(${fn.parameters
                  .map((p) => `${p.name}: ${p.valueType || "dynamic"}`)
                  .join()})`
              }

              default:
                return arg
            }
          }

          console.log(...args.map((arg) => getValue(arg)))

          return MK_NULL()
        }),
        "final"
      )

      this.declareVar(
        "length",
        MK_NATIVE_FN((args: any[], _: Environment) => {
          const arr = args[0] as ArrayVal
          if (arr.type !== "array") throw new Error(`Cannot get length of type '${arr.type}'`)
          return { type: "number", value: arr.elements.length, returned: false }
        }),
        "final"
      )
    }
  }

  private assertType(varType: ValueType, value: RuntimeVal) {
    let valueWithType = value

    if (value.type == "dynamic") {
      valueWithType = { ...value, type: "dynamic" }
    } else if (value.type != varType) {
      throw new Error(`Can't assign a value of type ${value.type} to a variable of type ${varType}`)
    }

    return valueWithType
  }

  public declareVar(
    varname: string,
    value: RuntimeVal,
    modifier: VarModifier,
    type?: ValueType
  ): RuntimeVal {
    if (this.variables.has(varname))
      throw new Error(`Cannot declare variable ${varname}. As it already is defined.`)

    switch (modifier) {
      case "final":
        this.finals.add(varname)
        break
      case "constant":
        this.constants.add(varname)
        break
    }

    let valueWithType = value
    if (type) valueWithType = this.assertType(type, value)
    this.variables.set(varname, valueWithType)

    return valueWithType
  }

  public assignVar(varname: string, value: RuntimeVal): RuntimeVal {
    const env = this.resolve(varname)

    // Can't assign to a constant or final variable
    if (this.finals.has(varname)) throw new Error(`Cannot assign to a final variable "${varname}"`)
    else if (this.constants.has(varname))
      throw new Error(`Cannot assign to a constant variable "${varname}"`)

    const prevVal = env.lookupVar(varname)

    const valueWithType = this.assertType(prevVal.type, value)

    env.variables.set(varname, valueWithType)

    return valueWithType
  }

  public resolve(varname: string): Environment {
    if (this.variables.has(varname)) return this

    if (this.parent == undefined) throw new Error(`Cannot resolve ${varname} as it does not exist.`)

    return this.parent.resolve(varname)
  }

  public lookupVar(varname: string): RuntimeVal {
    const env = this.resolve(varname)
    return env.variables.get(varname) as RuntimeVal
  }
}
