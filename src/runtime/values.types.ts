import { RuntimeVal } from "./values"

export interface TypeVal extends RuntimeVal {
  type: "type"
  typeKind: string // The specific type kind (primitive, struct, etc.)
  typeName?: string // Optional name for named types
}

export interface PrimitiveTypeVal extends TypeVal {
  typeKind: "primitive"
  primitiveType: "string" | "number" | "bool" | "dynamic"
}

export interface StructTypeVal extends TypeVal {
  typeKind: "struct"
  members: Record<string, TypeVal>
  optional: Record<string, boolean> // Track which members are optional
}

export interface AliasTypeVal extends TypeVal {
  typeKind: "alias"
  aliasTo: TypeVal
}

export interface TypeParameterVal extends TypeVal {
  type: "type"
  typeKind: "typeParameter"
  name: string
  constraint?: TypeVal // i.e. T: number
}

export interface GenericTypeVal extends TypeVal {
  typeKind: "generic"
  baseType: TypeVal
  parameters: TypeParameterVal[]
}

export interface UnionTypeVal extends TypeVal {
  typeKind: "union"
  unionTypes: TypeVal[]
}

export interface ArrayTypeVal extends TypeVal {
  typeKind: "array"
  elementType: TypeVal
}
