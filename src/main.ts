import * as readline from "readline"
import Parser from "./frontend/parser"
import Environment from "./runtime/environment"
import { evaluate } from "./runtime/interpreter"
import { MK_BOOL, MK_NULL } from "./runtime/macros"
import { NumberVal } from "./runtime/values"

repl()

async function repl() {
  const parser = new Parser()
  const env = new Environment()

  // global variables
  env.declareVar("true", MK_BOOL(true))
  env.declareVar("false", MK_BOOL(false))
  env.declareVar("null", MK_NULL())

  console.log("\n Repl v0.1")

  while (true) {
    const input = await prompt("> ")

    if (input.includes(".exit")) {
      process.exit(1)
    }

    const program = parser.produceAST(input)

    const result = evaluate(program, env)
    console.log(result)
  }
}

async function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const reader = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    reader.question(question, (input: string) => {
      resolve(input)
      reader.close()
    })
  })
}
