import { VarModifier } from "./frontend/ast"
import { RuntimeVal } from "./runtime/values"

export type BuiltIn = {
  name: string
  value: RuntimeVal
  modifier: VarModifier
}
