import { BuiltIn } from "../../types"
import Environment from "../environment"
import { MK_NATIVE_FN, MK_NULL } from "../macros"
import {
  ArrayVal,
  BooleanVal,
  FunctionVal,
  NullVal,
  NumberVal,
  ReturnVal,
  RuntimeVal,
  StringVal,
} from "../values"

const functions: BuiltIn[] = [
  {
    name: "print",
    value: MK_NATIVE_FN((args: RuntimeVal[], _: Environment) => {
      const getValue = (arg: RuntimeVal): any => {
        const argType = arg.type
        if (
          argType == "string" ||
          argType == "number" ||
          argType == "boolean" ||
          argType == "null"
        ) {
          return (arg as StringVal | NumberVal | BooleanVal | NullVal).value
        } else if (argType == "array") {
          return (arg as ArrayVal).elements.map(getValue)
        } else if (argType == "function") {
          const fn = arg as FunctionVal
          return `fn ${fn.name}(${fn.parameters
            .map((p) => `${p.name}: ${p.valueType || "dynamic"}`)
            .join()})`
        } else if (argType == "return") {
          return getValue((arg as ReturnVal).value)
        } else {
          return arg
        }
      }

      console.log(...args.map((arg) => getValue(arg)))

      return MK_NULL()
    }),
    modifier: "final",
  },

  {
    name: "length",
    value: MK_NATIVE_FN((args: any[], _: Environment) => {
      const arr = args[0] as ArrayVal
      if (arr.type !== "array") throw new Error(`Cannot get length of type '${arr.type}'`)
      return { type: "number", value: arr.elements.length, returned: false }
    }),
    modifier: "final",
  },
]

export default functions
