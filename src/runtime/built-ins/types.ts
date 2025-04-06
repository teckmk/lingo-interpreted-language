import { BuiltIn } from "../../types"
import { MK_PRIM_TYPE } from "../macros"

const primitiveTypes: BuiltIn[] = [
  { name: "number", value: MK_PRIM_TYPE("number") },
  { name: "bool", value: MK_PRIM_TYPE("bool") },
  { name: "string", value: MK_PRIM_TYPE("string") },
  { name: "dynamic", value: MK_PRIM_TYPE("dynamic") },
]

export default primitiveTypes
