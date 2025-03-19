import { RuntimeVal } from "./values"
import {
  AliasTypeVal,
  ArrayTypeVal,
  GenericTypeVal,
  PrimitiveTypeVal,
  StructTypeVal,
  TypeVal,
  UnionTypeVal,
} from "./values.types"

export function areTypesCompatible(
  sourceType: TypeVal,
  targetType: TypeVal,
): [boolean, TypeVal, TypeVal] {
  // Dynamic type is compatible with anything
  if (
    (sourceType.typeKind === "primitive" &&
      (sourceType as PrimitiveTypeVal).primitiveType === "dynamic") ||
    (targetType.typeKind === "primitive" &&
      (targetType as PrimitiveTypeVal).primitiveType === "dynamic")
  ) {
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
    )
    return [isCompatible, resolvedSourceType, resolvedTargetType]
  }
  if (targetType.typeKind === "alias") {
    const [isCompatible, resolvedSourceType, resolvedTargetType] = areTypesCompatible(
      sourceType,
      (targetType as AliasTypeVal).aliasTo,
    )
    return [isCompatible, resolvedSourceType, resolvedTargetType]
  }

  // Arrays - check element type compatibility
  if (sourceType.typeKind === "array" && targetType.typeKind === "array") {
    const [isCompatible, resolvedElementSourceType, resolvedElementTargetType] = areTypesCompatible(
      (sourceType as ArrayTypeVal).elementType,
      (targetType as ArrayTypeVal).elementType,
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

  // Generic types - compare base types and parameters
  if (sourceType.typeKind === "generic" && targetType.typeKind === "generic") {
    if (sourceType.typeName !== targetType.typeName) {
      return [false, sourceType, targetType]
    }

    if (
      (sourceType as GenericTypeVal).parameters.length !==
      (targetType as GenericTypeVal).parameters.length
    ) {
      return [false, sourceType, targetType]
    }

    const resolvedSourceParams: TypeVal[] = []
    const resolvedTargetParams: TypeVal[] = []

    for (let i = 0; i < (sourceType as GenericTypeVal).parameters.length; i++) {
      const sourceParam = (sourceType as GenericTypeVal).parameters[i]
      const targetParam = (targetType as GenericTypeVal).parameters[i]

      const [isCompatible, resolvedSourceParam, resolvedTargetParam] = areTypesCompatible(
        sourceParam,
        targetParam,
      )

      if (!isCompatible) {
        return [false, sourceType, targetType]
      }

      resolvedSourceParams.push(resolvedSourceParam)
      resolvedTargetParams.push(resolvedTargetParam)
    }

    const resolvedSourceType: GenericTypeVal = {
      ...(sourceType as GenericTypeVal),
      parameters: resolvedSourceParams,
    }

    const resolvedTargetType: GenericTypeVal = {
      ...(targetType as GenericTypeVal),
      parameters: resolvedTargetParams,
    }

    return [true, resolvedSourceType, resolvedTargetType]
  }

  return [false, sourceType, targetType]
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

    // Handle other types as needed

    default:
      return {
        type: "type",
        typeKind: "primitive",
        primitiveType: "dynamic",
      } as PrimitiveTypeVal
  }
}
