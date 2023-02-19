import * as readline from "readline"
import Parser from "./frontend/parser"
import { evaluate } from "./runtime/interpreter"

repl()

async function repl() {
  const parser = new Parser()
  console.log("\n Repl v0.1")

  while (true) {
    const input = await prompt("> ")

    if (input.includes(".exit")) {
      process.exit(1)
    }

    const program = parser.produceAST(input)

    const result = evaluate(program)
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
