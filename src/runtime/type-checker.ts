import {
  AliasType,
  ArrayType,
  GenericType,
  PrimitiveType,
  TypeNode,
  UnionType,
} from "../frontend/ast"
import Environment from "./environment"
import { RuntimeError } from "./error"
import { ExecutionContext } from "./execution-context"
import { ObjectVal, RuntimeVal } from "./values"
import {
  AliasTypeVal,
  ArrayTypeVal,
  GenericTypeVal,
  PrimitiveTypeVal,
  StructTypeVal,
  TypeKind,
  TypeParameterVal,
  TypeVal,
  UnionTypeVal,
} from "./values.types"

function satisfiesConstraint(type: TypeVal, constraint: TypeVal): boolean {
  if (!constraint) {
    return true
  }

  const [isCompatible] = areTypesCompatible(type, constraint)
  return isCompatible
}

export function areTypesCompatible(
  sourceType: TypeVal,
  targetType: TypeVal,
  typeArgMap?: Map<string, TypeVal>, // Map of type parameter names to their concrete type arguments
): [boolean, TypeVal, TypeVal] {
  const bothNominal = sourceType.isNominal && targetType.isNominal
  // Check if types are nominally different
  if (bothNominal) {
    // Nominal types with different names are never compatible
    return [sourceType.typeName === targetType.typeName, sourceType, targetType]
  }

  // Handle type parameters with provided type arguments
  if (sourceType.typeKind === "typeParameter") {
    const sourceParam = sourceType as TypeParameterVal

    // If we have a concrete type for this parameter, use it instead
    if (typeArgMap && typeArgMap.has(sourceParam.name)) {
      const concreteType = typeArgMap.get(sourceParam.name)
      if (!concreteType) {
        throw new Error(`Type argument ${sourceParam.name} is not defined`)
      }
      return areTypesCompatible(concreteType, targetType, typeArgMap)
    }
  }

  if (targetType.typeKind === "typeParameter") {
    const targetParam = targetType as TypeParameterVal

    // If we have a concrete type for this parameter, use it instead
    if (typeArgMap && typeArgMap.has(targetParam.name)) {
      const concreteType = typeArgMap.get(targetParam.name)
      if (!concreteType) {
        throw new Error(`Type argument ${targetParam.name} is not defined`)
      }
      return areTypesCompatible(sourceType, concreteType, typeArgMap)
    }
  }

  // Dynamic type is compatible with anything
  if (
    (sourceType.typeKind === "primitive" &&
      (sourceType as PrimitiveTypeVal).primitiveType === "dynamic") ||
    (targetType.typeKind === "primitive" &&
      (targetType as PrimitiveTypeVal).primitiveType === "dynamic")
  ) {
    return [true, sourceType, targetType]
  }

  // Type parameter compatibility
  if (sourceType.typeKind === "typeParameter") {
    const sourceParam = sourceType as TypeParameterVal

    // If the target is also a type parameter, they are compatible if they have the same name
    // or if the source satisfies the target's constraint
    if (targetType.typeKind === "typeParameter") {
      const targetParam = targetType as TypeParameterVal

      // Same named parameters are compatible
      if (sourceParam.name === targetParam.name) {
        return [true, sourceType, targetType]
      }

      // If target has a constraint, source must satisfy it
      if (targetParam.constraint) {
        if (sourceParam.constraint) {
          // If source also has a constraint, check if source's constraint is compatible with target's
          const [isCompatible] = areTypesCompatible(
            sourceParam.constraint,
            targetParam.constraint,
            typeArgMap,
          )
          return [isCompatible, sourceType, targetType]
        } else {
          // If source has no constraint, it's not compatible with a constrained target
          return [false, sourceType, targetType]
        }
      }

      // Target has no constraint, so they're compatible
      return [true, sourceType, targetType]
    }

    // If source is a parameter and target is a type, check if source's constraint is compatible with target
    if (sourceParam.constraint) {
      const [isCompatible] = areTypesCompatible(sourceParam.constraint, targetType, typeArgMap)
      return [isCompatible, sourceType, targetType]
    }

    // Without constraints, can't determine compatibility
    return [false, sourceType, targetType]
  }

  // If target is a type parameter, check if source satisfies its constraint
  if (targetType.typeKind === "typeParameter") {
    const targetParam = targetType as TypeParameterVal

    if (targetParam.constraint) {
      const [isCompatible] = areTypesCompatible(sourceType, targetParam.constraint, typeArgMap)
      return [isCompatible, sourceType, targetType]
    }

    // No constraint means any type is acceptable
    return [true, sourceType, targetType]
  }

  // Same kind of primitives
  if (sourceType.typeKind === "primitive" && targetType.typeKind === "primitive") {
    return [
      (sourceType as PrimitiveTypeVal).primitiveType ===
        (targetType as PrimitiveTypeVal).primitiveType,
      sourceType,
      targetType,
    ]
  }

  // Check if source is compatible with any type in a union
  if (targetType.typeKind === "union") {
    for (const unionType of (targetType as UnionTypeVal).unionTypes) {
      const [isCompatible, resolvedSourceType, resolvedUnionType] = areTypesCompatible(
        sourceType,
        unionType,
        typeArgMap,
      )
      if (isCompatible) {
        return [true, resolvedSourceType, resolvedUnionType]
      }
    }
    return [false, sourceType, targetType]
  }

  // Alias types - check the underlying type
  if (sourceType.typeKind === "alias") {
    const [isCompatible, resolvedSourceType, resolvedTargetType] = areTypesCompatible(
      (sourceType as AliasTypeVal).aliasTo,
      targetType,
      typeArgMap,
    )
    return [isCompatible, resolvedSourceType, resolvedTargetType]
  }
  if (targetType.typeKind === "alias") {
    const [isCompatible, resolvedSourceType, resolvedTargetType] = areTypesCompatible(
      sourceType,
      (targetType as AliasTypeVal).aliasTo,
      typeArgMap,
    )
    return [isCompatible, resolvedSourceType, resolvedTargetType]
  }

  // Arrays - check element type compatibility
  if (sourceType.typeKind === "array" && targetType.typeKind === "array") {
    const [isCompatible, resolvedElementSourceType, resolvedElementTargetType] = areTypesCompatible(
      (sourceType as ArrayTypeVal).elementType,
      (targetType as ArrayTypeVal).elementType,
      typeArgMap,
    )

    if (!isCompatible) {
      return [false, sourceType, targetType]
    }

    // Create new array types with the resolved element types
    const resolvedSourceType: ArrayTypeVal = {
      ...(sourceType as ArrayTypeVal),
      elementType: resolvedElementSourceType,
    }

    const resolvedTargetType: ArrayTypeVal = {
      ...(targetType as ArrayTypeVal),
      elementType: resolvedElementTargetType,
    }

    return [true, resolvedSourceType, resolvedTargetType]
  }

  // Structs - check all required fields are compatible
  if (sourceType.typeKind === "struct" && targetType.typeKind === "struct") {
    const resolvedSourceMembers: Record<string, TypeVal> = {
      ...(sourceType as StructTypeVal).members,
    }
    const resolvedTargetMembers: Record<string, TypeVal> = {
      ...(targetType as StructTypeVal).members,
    }

    for (const [key, targetMemberType] of Object.entries((targetType as StructTypeVal).members)) {
      // Skip optional fields that don't exist in source
      if (
        (targetType as StructTypeVal).optional[key] &&
        !(sourceType as StructTypeVal).members[key]
      ) {
        continue
      }

      // Required field must exist and be compatible
      if (!(sourceType as StructTypeVal).members[key]) {
        return [false, sourceType, targetType]
      }

      const sourceMemberType = (sourceType as StructTypeVal).members[key]
      const [isCompatible, resolvedSourceMemberType, resolvedTargetMemberType] = areTypesCompatible(
        sourceMemberType,
        targetMemberType,
        typeArgMap,
      )

      if (!isCompatible) {
        return [false, sourceType, targetType]
      }

      resolvedSourceMembers[key] = resolvedSourceMemberType
      resolvedTargetMembers[key] = resolvedTargetMemberType
    }

    const resolvedSourceType: StructTypeVal = {
      ...(sourceType as StructTypeVal),
      members: resolvedSourceMembers,
    }

    const resolvedTargetType: StructTypeVal = {
      ...(targetType as StructTypeVal),
      members: resolvedTargetMembers,
    }

    return [true, resolvedSourceType, resolvedTargetType]
  }

  // Generic types - compare base types and parameters with constraint checking
  if (sourceType.typeKind === "generic" && targetType.typeKind === "generic") {
    if (sourceType.typeName !== targetType.typeName) {
      return [false, sourceType, targetType]
    }

    const sourceGeneric = sourceType as GenericTypeVal
    const targetGeneric = targetType as GenericTypeVal

    if (sourceGeneric.parameters.length !== targetGeneric.parameters.length) {
      return [false, sourceType, targetType]
    }

    // Create a new type arg map for this generic type comparison
    const newTypeArgMap = new Map(typeArgMap || [])

    // Process the parameters and build up type argument mapping
    for (let i = 0; i < sourceGeneric.parameters.length; i++) {
      const sourceParam = sourceGeneric.parameters[i]
      const targetParam = targetGeneric.parameters[i]

      // If we have concrete types for these parameters, add them to the map
      if (sourceParam.typeKind === "typeParameter" && targetParam.typeKind !== "typeParameter") {
        newTypeArgMap.set(sourceParam.name, targetParam)
      }

      // Check that parameters are compatible
      const [isCompatible] = areTypesCompatible(sourceParam, targetParam, newTypeArgMap)

      if (!isCompatible) {
        return [false, sourceType, targetType]
      }

      // Additional check: if target parameter has a constraint, source must satisfy it
      if (targetParam.constraint) {
        if (!satisfiesConstraint(sourceParam, targetParam.constraint)) {
          return [false, sourceType, targetType]
        }
      }
    }

    // If we got here, the generic types are compatible with the given type arguments
    return [true, sourceType, targetType]
  }

  return [false, sourceType, targetType]
}

// Helper function to create a type argument map from type parameters and arguments
export function createTypeArgMap(
  typeParameters: TypeParameterVal[],
  typeArguments: TypeVal[],
): Map<string, TypeVal> {
  const typeArgMap = new Map<string, TypeVal>()

  for (let i = 0; i < Math.min(typeParameters.length, typeArguments.length); i++) {
    const parameter = typeParameters[i]
    const { constraint } = parameter
    const typeArg = typeArguments[i]
    if (constraint && !satisfiesConstraint(typeArg, constraint)) {
      throw new Error(
        `Type argument ${getTypeName(typeArg)} does not satisfy constraint ${getTypeName(constraint)} of type parameter ${parameter.name}`,
      )
    }
    typeArgMap.set(parameter.name, typeArg)
  }

  return typeArgMap
}

// Function to instantiate a generic type with concrete type arguments
export function instantiateGenericType(
  genericType: GenericTypeVal,
  typeArguments: TypeVal[],
): TypeVal {
  // Create a map of type parameter names to concrete type arguments
  const typeArgMap = createTypeArgMap(genericType.parameters, typeArguments)

  // Create a deep copy of the base type
  const instantiatedType = JSON.parse(JSON.stringify(genericType.baseType))

  // Replace all type parameters with their concrete types
  return substituteTypeParameters(instantiatedType, typeArgMap)
}

// Helper function to substitute type parameters in a type with concrete types
function substituteTypeParameters(type: TypeVal, typeArgMap: Map<string, TypeVal>): TypeVal {
  if (type.typeKind === "primitive") {
    const paramName = (type as PrimitiveTypeVal).primitiveType
    if (typeArgMap.has(paramName)) {
      return typeArgMap.get(paramName) as TypeVal
    }
    return type
  }

  if (type.typeKind === "array") {
    const arrayType = type as ArrayTypeVal
    return {
      ...arrayType,
      elementType: substituteTypeParameters(arrayType.elementType, typeArgMap),
    } as ArrayTypeVal
  }

  if (type.typeKind === "alias") {
    const aliasType = type as AliasTypeVal
    return substituteTypeParameters(aliasType.aliasTo, typeArgMap)
  }

  if (type.typeKind === "struct") {
    const structType = type as StructTypeVal
    const members: Record<string, TypeVal> = {}

    for (const [key, memberType] of Object.entries(structType.members)) {
      members[key] = substituteTypeParameters(memberType, typeArgMap)
    }

    return {
      ...structType,
      members,
    } as StructTypeVal
  }

  if (type.typeKind === "generic") {
    const genericType = type as GenericTypeVal

    // Substitute parameters in the base type
    const substitutedBaseType = substituteTypeParameters(genericType.baseType, typeArgMap)

    return {
      ...genericType,
      baseType: substitutedBaseType,
    } as GenericTypeVal
  }

  // For other types, return as is
  return type
}

export function getRuntimeType(value: RuntimeVal): TypeVal {
  switch (value.type) {
    case "number":
      return {
        type: "type",
        typeKind: "primitive",
        primitiveType: "number",
      } as PrimitiveTypeVal

    case "string":
      return {
        type: "type",
        typeKind: "primitive",
        primitiveType: "string",
      } as PrimitiveTypeVal

    case "boolean":
      return {
        type: "type",
        typeKind: "primitive",
        primitiveType: "bool",
      } as PrimitiveTypeVal

    case "object":
      return {
        type: "type",
        typeKind: "struct",
        typeName: (value as ObjectVal).instanceOf,
        members: {},
        optional: {},
        isNominal: true,
      } as StructTypeVal

    // Handle other types as needed

    default:
      return {
        type: "type",
        typeKind: "primitive",
        primitiveType: "dynamic",
      } as PrimitiveTypeVal
  }
}

export function getTypeOfKind(typeVal: TypeVal, targetKind: TypeKind): TypeVal | undefined {
  // Base case: if the typeVal's typeKind matches the targetKind, return true
  if (typeVal.typeKind === targetKind) {
    return typeVal
  }

  // Handle different type kinds recursively, but skip struct members and array elements
  switch (typeVal.typeKind) {
    case "alias":
      return getTypeOfKind((typeVal as AliasTypeVal).aliasTo, targetKind)

    case "generic":
      return getTypeOfKind((typeVal as GenericTypeVal).baseType, targetKind)

    // case "union":
    //   return (typeVal as UnionTypeVal).unionTypes.some((unionType) =>
    //     isTypeOfKind(unionType, targetKind),
    //   )

    // case "typeParameter":
    // case "struct":
    // case "array":
    // case "primitive":
    //   // Do not check members or elements
    //   return false

    default:
      return
  }
}

export function getTypeName(type: TypeVal): string {
  switch (type.typeKind) {
    case "primitive":
      return (type as PrimitiveTypeVal).primitiveType

    case "struct":
      return type.typeName || "struct"

    case "array":
      return `${getTypeName((type as ArrayTypeVal).elementType)}[]`

    case "union":
      return (type as UnionTypeVal).unionTypes.map(getTypeName).join(" | ")

    case "generic": {
      const genericType = type as GenericTypeVal
      const baseTypeName = genericType.typeName || "generic"
      const paramNames = genericType.parameters.map((p) => p.name).join(", ")
      return `${baseTypeName}<${paramNames}>`
    }

    case "typeParameter":
      return (type as TypeParameterVal).name

    case "alias":
      return type.typeName || getTypeName((type as AliasTypeVal).aliasTo)

    default:
      return "unknown"
  }
}

export function isAliasOfType(type: TypeVal, targetTypeName: string, env: Environment): boolean {
  if (type.typeKind !== "alias") {
    return false
  }

  const aliasType = type as AliasTypeVal
  const aliasedType = aliasType.aliasTo as TypeVal

  // Direct match?
  if (aliasedType.typeName === targetTypeName) {
    return true
  }

  // Need to follow the alias chain
  if (aliasedType.typeKind === "alias") {
    return isAliasOfType(aliasedType, targetTypeName, env)
  } else if (aliasedType.typeKind === "primitive") {
    const primitiveType = aliasedType as PrimitiveTypeVal
    // Check if the primitive type points to our target
    return primitiveType.primitiveType === targetTypeName
  }

  return false
}

export function convertTypeNodeToTypeVal(
  typeNode: TypeNode,
  env: Environment,
  context: ExecutionContext,
): TypeVal {
  switch (typeNode.kind) {
    case "PrimitiveType":
      return {
        type: "type",
        typeKind: "primitive",
        primitiveType: (typeNode as PrimitiveType).name.value,
      } as PrimitiveTypeVal

    case "AliasType": {
      // Look up the actual type in the environment
      const typeName = typeNode.name?.value
      const isPredefinedPrimitive =
        typeName === "string" || typeName === "number" || typeName === "bool"

      if (typeName && !isPredefinedPrimitive) {
        const type = env.lookupType(typeName)
        if (!type) {
          throw new RuntimeError(context, `Unknown type '${typeName}'`)
        }
        return type as TypeVal
      }
      // If it's an inline alias type or predefined primitive, convert its actual type
      return convertTypeNodeToTypeVal((typeNode as AliasType).actualType, env, context)
    }

    case "StructType":
      // This would need to handle converting struct type nodes to StructTypeVal
      // Implementation depends on how you represent structs in your AST
      throw new RuntimeError(context, "Inline struct types not supported as type arguments yet")

    case "ArrayType":
      return {
        type: "type",
        typeKind: "array",
        elementType: convertTypeNodeToTypeVal((typeNode as ArrayType).elementType, env, context),
      } as ArrayTypeVal

    case "UnionType":
      return {
        type: "type",
        typeKind: "union",
        unionTypes: (typeNode as UnionType).types.map((t) =>
          convertTypeNodeToTypeVal(t, env, context),
        ),
      } as UnionTypeVal

    case "GenericType": {
      // For generic types, convert the base type and parameters
      const baseType = typeNode.name?.value ? env.lookupType(typeNode.name.value) : null
      if (!baseType) {
        throw new RuntimeError(
          context,
          `Unknown generic type '${typeNode.name?.value || "anonymous"}'`,
        )
      }

      // Convert type parameters
      const parameters = (typeNode as GenericType).parameters.map((param) => {
        return {
          type: "type",
          typeKind: "typeParameter",
          name: param.name.value,
          constraint: param.constraint
            ? convertTypeNodeToTypeVal(param.constraint, env, context)
            : undefined,
        } as TypeParameterVal
      })

      return {
        type: "type",
        typeKind: "generic",
        typeName: typeNode.name?.value,
        baseType: baseType as TypeVal,
        parameters,
      } as GenericTypeVal
    }
    default:
      throw new RuntimeError(context, `Unsupported type node kind: ${(typeNode as TypeNode).kind}`)
  }
}

export function getStructTypeFromGeneric(
  genericType: GenericTypeVal,
  typeArgs: TypeVal[],
  context: ExecutionContext,
): StructTypeVal {
  // Instantiate the generic type with concrete type arguments
  const instantiatedType = instantiateGenericType(genericType, typeArgs)

  // Get the struct type from the instantiated type
  const structType = getTypeOfKind(instantiatedType, "struct") as StructTypeVal

  if (!structType) {
    throw new RuntimeError(context, `Generic type does not resolve to a struct`)
  }

  return structType
}
