import { readFileSync } from "fs"

import Parser from "./frontend/3-parser"
import Environment from "./runtime/environment"

import { evaluate } from "./runtime/interpreter"
import { prompt, validateFilename } from "./helper"

main()

async function main() {
  try {
    const [, , filename] = process.argv

    if (filename) run(filename)
    else await repl()
  } catch (err) {
    if (err instanceof Error) return console.log(err.message)
    console.log(err)

    process.exit()
  }
}

async function repl() {
  const parser = new Parser()
  const env = new Environment()

  console.log("\nmlang REPL v0.1")

  while (true) {
    const input = await prompt("> ")

    if (input.includes(".exit")) process.exit(1)

    const program = parser.produceAST(input)

    evaluate(program, env)
  }
}

function run(filename: string) {
  const parser = new Parser()
  const env = new Environment()

  const input = readFileSync(validateFilename(filename), { encoding: "utf-8" })

  const program = parser.produceAST(input)
  require("fs").writeFileSync("ast.json", JSON.stringify(program))

  evaluate(program, env)
}
