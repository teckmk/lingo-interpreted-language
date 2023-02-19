import { RuntimeVal } from "./values"

export default class Environment {
  private parent?: Environment
  private variables: Map<string, RuntimeVal>

  constructor(parentEnv?: Environment) {
    this.parent = parentEnv
    this.variables = new Map()
  }

  public declareVar(varname: string, value: RuntimeVal): RuntimeVal {
    if (this.variables.has(varname))
      throw new Error(`Cannot declare vairable ${varname}. As it already is defined.`)

    this.variables.set(varname, value)
    return value
  }

  public assignVar(varname: string, value: RuntimeVal): RuntimeVal {
    const env = this.resolve(varname)
    env.variables.set(varname, value)

    return value
  }

  public resolve(varname: string): Environment {
    if (this.variables.has(varname)) return this

    if (this.parent === undefined)
      throw new Error(`Cannot resolve ${varname} as it does not exist.`)

    return this.parent.resolve(varname)
  }

  public lookupVar(varname: string): RuntimeVal {
    const env = this.resolve(varname)
    return env.variables.get(varname) as RuntimeVal
  }
}
