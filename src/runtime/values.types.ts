import { FunctionSignature, RuntimeVal } from "./values"

export type TypeKind =
  | "primitive"
  | "struct"
  | "alias"
  | "typeParameter"
  | "generic"
  | "union"
  | "array"
  | "contract"
  | "function"
  | "getter"

export interface TypeVal extends RuntimeVal {
  type: "type"
  typeKind: TypeKind
  typeName?: string
  isNominal?: boolean // Track if this is a nominal type (created with 'type' keyword)
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

export interface ContractTypeVal extends TypeVal {
  typeKind: "contract"
  members: Record<string, FunctionTypeVal | GetterTypeVal>
  parameters?: TypeParameterVal[]
}

export interface FunctionTypeVal extends TypeVal {
  typeKind: "function"
  signature: FunctionSignature
}

export interface GetterTypeVal extends TypeVal {
  typeKind: "getter"
  signature: FunctionSignature
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
