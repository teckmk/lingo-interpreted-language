import * as readline from "readline"
import Parser from "./frontend/parser"

repl()

async function repl() {
  const parser = new Parser()
  console.log("\n Repl v0.1")

  while (true) {
    const input = await prompt("> ")

    if (!input || input.includes(".exit")) {
      process.exit(1)
    }

    const program = parser.produceAST(input)
    console.log(program)
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
