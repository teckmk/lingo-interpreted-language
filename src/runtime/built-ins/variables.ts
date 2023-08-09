import { BuiltIn } from "../../types"
import { MK_BOOL, MK_NULL } from "../macros"

const variables: BuiltIn[] = [
  { name: "true", value: MK_BOOL(true), modifier: "constant" },
  { name: "false", value: MK_BOOL(false), modifier: "constant" },
  { name: "null", value: MK_NULL(), modifier: "constant" },
]

export default variables
