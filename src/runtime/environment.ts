import { VarModifier } from "../frontend/ast"
import { ExecutionContext } from "./execution-context"
import { RuntimeError } from "./error"
import { RuntimeVal, ValueType } from "./values"
import { TypeVal, PrimitiveTypeVal, AliasTypeVal } from "./values.types"
import { areTypesCompatible, getRuntimeType } from "./type-checker"

import functions from "./built-ins/functions"
import variables from "./built-ins/variables"
import primitiveTypes from "./built-ins/types"

export default class Environment {
  private parent?: Environment
  private typeDefinitions: Map<string, RuntimeVal>
  private aliasDefinitions: Map<string, RuntimeVal>
  private variables: Map<string, RuntimeVal>
  private constants: Set<string>
  private finals: Set<string>
  private executionContext: ExecutionContext
  private variableTypes: Map<string, TypeVal>

  constructor(executionContext: ExecutionContext, parentEnv?: Environment) {
    this.parent = parentEnv
    this.executionContext = executionContext
    this.variables = new Map()
    this.constants = new Set()
    this.finals = new Set()
    this.typeDefinitions = new Map()
    this.aliasDefinitions = new Map()
    this.variableTypes = new Map()

    const global = Boolean(parentEnv) == false
    if (global) {
      // global variables
      for (const _var of variables) {
        this.declareVar(_var.name, _var.value, _var.modifier ?? "constant")
      }
      // global native functions
      for (const fn of functions) {
        this.declareVar(fn.name, fn.value, fn.modifier ?? "final")
      }

      // global primitive types
      for (const { name, value } of primitiveTypes) {
        this.declareType(name, value, true)
      }
    }
  }

  get context() {
    return this.executionContext
  }

  public declareType(name: string, value: RuntimeVal, isNominal = true): RuntimeVal {
    // Verify that we're dealing with a type
    if (value.type !== "type") {
      throw new RuntimeError(
        this.executionContext,
        `Cannot declare ${isNominal ? "type" : "alias"} ${name} with a non-type value.`,
      )
    }

    const alreadyDefined = this.typeDefinitions.has(name) || this.aliasDefinitions.has(name)

    if (isNominal) {
      if (alreadyDefined) {
        throw new RuntimeError(
          this.executionContext,
          `Cannot declare type ${name}. It is already defined.`,
        )
      }

      this.typeDefinitions.set(name, value)
      return value
    }

    if (alreadyDefined) {
      throw new RuntimeError(
        this.executionContext,
        `Cannot declare alias ${name}. It is already defined.`,
      )
    }

    // Prevent creating alias of an alias
    // Currently, our system wraps every type in AliasType, so we need to check if this alias contains another alias
    if (value.type == "type" && (value as TypeVal).typeKind == "alias") {
      const actualType = (value as AliasTypeVal).aliasTo
      if (actualType.type == "type" && actualType.typeKind == "alias")
        throw new RuntimeError(
          this.executionContext,
          `Cannot create an alias of another alias. Use the original type instead.`,
        )
    }

    this.aliasDefinitions.set(name, value)

    return value
  }

  public resolveType(name: string): Environment {
    if (this.typeDefinitions.has(name)) return this

    if (this.aliasDefinitions.has(name)) return this

    if (this.parent == undefined)
      throw new RuntimeError(this.executionContext, `Unable to resolve type ${name}`)

    return this.parent.resolveType(name)
  }

  public lookupType(name: string): RuntimeVal {
    const env = this.resolveType(name)

    let value
    if (env.aliasDefinitions.has(name)) {
      value = env.aliasDefinitions.get(name) as TypeVal
      value.isNominal = false
    } else if (env.typeDefinitions.has(name)) {
      value = env.typeDefinitions.get(name)
    }
    return value as RuntimeVal
  }

  private assertType(type: TypeVal | ValueType, value: RuntimeVal): RuntimeVal {
    // Handle primitive type strings for backward compatibility
    if (typeof type === "string") {
      // Dynamic type accepts any value
      if (type === "dynamic") {
        return { ...value, type: value.type }
      }

      // Convert string type to PrimitiveTypeVal
      const primitiveType: PrimitiveTypeVal = {
        type: "type",
        typeKind: "primitive",
        primitiveType: type as any,
        returned: false,
      }

      return this.assertType(primitiveType, value)
    }

    // If the value is dynamic, it can be assigned to any type
    if (value.type === "dynamic") {
      return { ...value, type: value.type }
    }

    // Get the runtime type of the value
    const valueType = getRuntimeType(value)

    // Check if the types are compatible
    const [isCompatible] = areTypesCompatible(valueType, type)

    if (!isCompatible) {
      const sourceTypeName =
        valueType.typeKind === "primitive"
          ? (valueType as PrimitiveTypeVal).primitiveType
          : valueType.typeKind

      const targetTypeName =
        type.typeKind === "primitive" ? (type as PrimitiveTypeVal).primitiveType : type.typeKind

      throw new RuntimeError(
        this.executionContext,
        `Type error: Cannot assign a value of type ${sourceTypeName} to a variable of type ${targetTypeName}`,
      )
    }

    return value
  }

  public declareVar(
    varname: string,
    value: RuntimeVal,
    modifier: VarModifier,
    type?: TypeVal | ValueType,
  ): RuntimeVal {
    if (this.variables.has(varname))
      throw new RuntimeError(
        this.executionContext,
        `Cannot declare variable ${varname}. As it already is defined.`,
      )

    switch (modifier) {
      case "final":
        this.finals.add(varname)
        break
      case "constant":
        this.constants.add(varname)
        break
    }

    let valueWithType = value

    if (type) {
      valueWithType = this.assertType(type, value)

      // Store the variable's type for future assignments
      if (typeof type !== "string") {
        this.variableTypes.set(varname, type)
      } else {
        // Convert string type to TypeVal
        const primitiveType: PrimitiveTypeVal = {
          type: "type",
          typeKind: "primitive",
          primitiveType: type as any,
          returned: false,
        }
        this.variableTypes.set(varname, primitiveType)
      }
    } else {
      // Infer the type from the value
      const inferredType = getRuntimeType(value)
      this.variableTypes.set(varname, inferredType)
    }

    this.variables.set(varname, valueWithType)

    return valueWithType
  }

  public assignVar(varname: string, value: RuntimeVal): RuntimeVal {
    const env = this.resolve(varname)

    // Can't assign to a constant or final variable
    if (this.finals.has(varname))
      throw new RuntimeError(
        this.executionContext,
        `Cannot assign to a final variable "${varname}"`,
      )
    else if (this.constants.has(varname))
      throw new RuntimeError(
        this.executionContext,
        `Cannot assign to a constant variable "${varname}"`,
      )

    const prevVal = env.lookupVar(varname)

    // Get the variable's declared type
    const varType = env.variableTypes.get(varname)

    let valueWithType = value

    if (varType) {
      valueWithType = env.assertType(varType, value)
    } else {
      // If no type was explicitly declared, ensure the new value matches the previous value's type
      const prevType = getRuntimeType(prevVal)
      valueWithType = env.assertType(prevType, value)
    }

    env.variables.set(varname, valueWithType)

    return valueWithType
  }

  public resolve(varname: string): Environment {
    if (this.variables.has(varname)) return this

    if (this.parent == undefined)
      throw new RuntimeError(
        this.executionContext,
        `Cannot resolve ${varname} as it does not exist.`,
      )

    return this.parent.resolve(varname)
  }

  public lookupVar(varname: string): RuntimeVal {
    const env = this.resolve(varname)
    return env.variables.get(varname) as RuntimeVal
  }
}
