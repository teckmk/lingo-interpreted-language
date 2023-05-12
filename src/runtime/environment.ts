import { MK_BOOL, MK_NATIVE_FN, MK_NULL } from "./macros"
import { ArrayVal, RuntimeVal } from "./values"

export default class Environment {
  private parent?: Environment
  private variables: Map<string, RuntimeVal>
  private constants: Set<string>

  constructor(parentEnv?: Environment) {
    this.parent = parentEnv
    this.variables = new Map()
    this.constants = new Set()

    const global = Boolean(parentEnv) == false
    if (global) {
      // global variables
      this.declareVar("true", MK_BOOL(true), true)
      this.declareVar("false", MK_BOOL(false), true)
      this.declareVar("null", MK_NULL(), true)

      // global native functions
      this.declareVar(
        "print",
        MK_NATIVE_FN((args: any[], _: Environment) => {
          const vals = args.map((arg) => (arg.value != undefined ? arg.value : arg))
          console.log(...vals)
          return MK_NULL()
        }),
        true
      )

      this.declareVar(
        "length",
        MK_NATIVE_FN((args: any[], _: Environment) => {
          const arr = args[0] as ArrayVal
          if (arr.type !== "array") throw new Error(`Cannot get length of type '${arr.type}'`)
          return { type: "number", value: arr.elements.length }
        }),
        true
      )
    }
  }

  public declareVar(varname: string, value: RuntimeVal, constant: boolean): RuntimeVal {
    if (this.variables.has(varname))
      throw new Error(`Cannot declare vairable ${varname}. As it already is defined.`)

    if (constant) this.constants.add(varname)

    this.variables.set(varname, value)
    return value
  }

  public assignVar(varname: string, value: RuntimeVal): RuntimeVal {
    const env = this.resolve(varname)

    // Can't assign to a constant variable
    if (this.constants.has(varname))
      throw new Error(`Cannot assign to a constant variable "${varname}"`)

    env.variables.set(varname, value)

    return value
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
