import { BooleanVal, FunctionCall, NativeFnVal, NullVal, NumberVal, PlaceholderVal } from "./values"
import { PrimitiveTypeVal } from "./values.types"

export function MK_NUMBER(n = 0) {
  return { type: "number", value: n } as NumberVal
}

export function MK_NULL() {
  return { type: "null", value: null } as NullVal
}

export function MK_PLACEHOLDER() {
  return { type: "placeholder" } as PlaceholderVal
}

export function MK_BOOL(b: boolean) {
  return { type: "boolean", value: b } as BooleanVal
}

export function MK_NATIVE_FN(call: FunctionCall) {
  return { type: "nativefn", call } as NativeFnVal
}

export function MK_PRIM_TYPE(name: "number" | "bool" | "string" | "dynamic"): PrimitiveTypeVal {
  return {
    type: "type",
    typeName: name,
    typeKind: "primitive",
    primitiveType: name,
    returned: false, // To satify TS
  }
}
