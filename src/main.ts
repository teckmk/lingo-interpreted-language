/* eslint-disable no-constant-condition */
import { readFileSync } from "fs"

import Parser from "./frontend/3-parser"
import Environment from "./runtime/environment"

import { evaluate } from "./runtime/interpreter"
import { prompt, validateFilename, emitTempFile } from "./helpers"
import Tokenizer from "./frontend/lexer/tokenizer"
import { specs } from "./frontend/lexer/specs"

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
  const env = new Environment()

  console.clear()
  console.log("\ncowlang REPL v0.1")

  while (true) {
    try {
      const input = await prompt("> ")

      if (input.includes(".exit")) process.exit(1)
      const tokens = new Tokenizer(specs, "REPL").tokenize(input)
      emitTempFile("tokens.json", JSON.stringify(tokens))
      const program = new Parser(tokens).produceAST()

      evaluate(program, env)
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      console.log(err.message)
    }
  }
}

function run(filename: string) {
  const parser = new Parser()
  const env = new Environment()
  const tokenizer = new Tokenizer(specs, filename)

  const input = readFileSync(validateFilename(filename), { encoding: "utf-8" })

  const tokens = tokenizer.tokenize(input)
  emitTempFile("tokens.json", JSON.stringify(tokens))

  const program = parser.produceAST(tokens)

  evaluate(program, env)

  emitTempFile("ast.json", JSON.stringify(program))
}
