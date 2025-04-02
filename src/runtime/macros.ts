import { BooleanVal, FunctionCall, NativeFnVal, NullVal, NumberVal, PlaceholderVal } from "./values"

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
