import { VarModifier } from "./frontend/2-ast"
import { RuntimeVal } from "./runtime/values"

export type BuiltIn = {
  name: string
  value: RuntimeVal
  modifier: VarModifier
}
