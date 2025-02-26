import { VarModifier } from "../frontend/ast"
import functions from "./built-ins/functions"
import variables from "./built-ins/variables"
import { RuntimeVal, ValueType } from "./values"

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
      for (const _var of variables) this.declareVar(_var.name, _var.value, _var.modifier)

      // global native functions
      for (const fn of functions) this.declareVar(fn.name, fn.value, fn.modifier)
    }
  }

  private assertType(varType: ValueType, value: RuntimeVal) {
    let valueWithType = value

    if (value.type == "dynamic") {
      valueWithType = { ...value, type: "dynamic" }
    } else if (value.type != varType && varType != "dynamic") {
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
