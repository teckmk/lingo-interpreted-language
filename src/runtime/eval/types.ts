import Environment from "../environment"
import { RuntimeError } from "../error"
import { ExecutionContext } from "../execution-context"
import { evaluate } from "../interpreter"
import {
  AliasType,
  ArrayType,
  GenericType,
  PrimitiveType,
  StructType,
  TypeParameter,
  UnionType,
} from "../../frontend/ast"
import {
  AliasTypeVal,
  ArrayTypeVal,
  GenericTypeVal,
  PrimitiveTypeVal,
  StructTypeVal,
  TypeParameterVal,
  TypeVal,
  UnionTypeVal,
} from "../values.types"

export function eval_primitive_type(
  node: PrimitiveType,
  _env: Environment,
  _context: ExecutionContext,
): PrimitiveTypeVal {
  return {
    type: "type",
    typeKind: "primitive",
    primitiveType: node.name.value,
  } as PrimitiveTypeVal
}

export function eval_struct_type(
  node: StructType,
  env: Environment,
  context: ExecutionContext,
): StructTypeVal {
  const members: Record<string, TypeVal> = {}
  const optional: Record<string, boolean> = {}

  for (const member of node.members) {
    const memberType = evaluate(member.type, context, env) as TypeVal
    if (memberType.type !== "type") {
      throw new RuntimeError(context, `Expected type for struct member but got ${memberType.type}`)
    }

    members[member.name.value] = memberType
    optional[member.name.value] = member.optional
  }

  return {
    type: "type",
    typeKind: "struct",
    typeName: node.name?.value,
    members,
    optional,
  } as StructTypeVal
}

export function eval_alias_type(
  node: AliasType,
  env: Environment,
  context: ExecutionContext,
): AliasTypeVal {
  const actualType = evaluate(node.actualType, context, env) as TypeVal
  if (actualType.type !== "type") {
    throw new RuntimeError(context, `Expected type for alias but got ${actualType.type}`)
  }

  return {
    type: "type",
    typeKind: "alias",
    typeName: node.name?.value,
    aliasTo: actualType,
  } as AliasTypeVal
}

export function eval_type_parameter(
  node: TypeParameter,
  env: Environment,
  context: ExecutionContext,
): TypeParameterVal {
  let constraint: TypeVal | undefined = undefined

  if (node.constraint) {
    const constraintVal = evaluate(node.constraint, context, env) as TypeVal
    if (constraintVal.type !== "type") {
      throw new RuntimeError(
        context,
        `Expected type for parameter constraint but got ${constraintVal.type}`,
      )
    }
    constraint = constraintVal
  }

  return {
    type: "type",
    typeKind: "typeParameter",
    name: node.name.value,
    constraint,
    returned: false, // to satisfy the interface
  }
}

export function eval_generic_type(
  node: GenericType,
  env: Environment,
  context: ExecutionContext,
): GenericTypeVal {
  // Retrieve the base type (this would be a named type that accepts parameters)
  const baseType = env.lookupType(node.name?.value ?? "")
  if (!baseType || baseType.type !== "type") {
    throw new RuntimeError(context, `Unknown generic type: ${node.name?.value}`)
  }

  // Evaluate the type parameters
  const parameters: TypeParameterVal[] = []
  for (const param of node.parameters) {
    // Now we expect TypeParameter nodes instead of TypeNode
    const paramVal = evaluate(param, context, env) as TypeParameterVal
    if (paramVal.typeKind !== "typeParameter") {
      throw new RuntimeError(context, `Expected type parameter but got ${paramVal.type}`)
    }
    parameters.push(paramVal)
  }

  return {
    type: "type",
    typeKind: "generic",
    typeName: node.name?.value,
    baseType,
    parameters,
  } as GenericTypeVal
}

export function eval_union_type(
  node: UnionType,
  env: Environment,
  context: ExecutionContext,
): UnionTypeVal {
  const unionTypes: TypeVal[] = []

  for (const typeNode of node.types) {
    const typeVal = evaluate(typeNode, context, env) as TypeVal
    if (typeVal.type !== "type") {
      throw new RuntimeError(context, `Expected type for union member but got ${typeVal.type}`)
    }
    unionTypes.push(typeVal)
  }

  return {
    type: "type",
    typeKind: "union",
    unionTypes,
  } as UnionTypeVal
}

export function eval_array_type(
  node: ArrayType,
  env: Environment,
  context: ExecutionContext,
): ArrayTypeVal {
  const elementType = evaluate(node.elementType, context, env) as TypeVal
  if (elementType.type !== "type") {
    throw new RuntimeError(context, `Expected type for array element but got ${elementType.type}`)
  }

  return {
    type: "type",
    typeKind: "array",
    elementType,
  } as ArrayTypeVal
}
