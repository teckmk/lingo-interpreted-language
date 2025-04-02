/* eslint-disable no-constant-condition */
import { readFileSync } from "fs"

import { interpret } from "./runtime/interpreter"
import { prompt, validateFilename } from "./helpers"
import Environment from "./runtime/environment"
import { ExecutionContext } from "./runtime/execution-context"

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
  console.clear()
  console.log("\ncowlang REPL v0.1")

  let inputBuffer = ""
  let braceBalance = 0
  let inMultiline = false

  const context = new ExecutionContext()
  const scope = new Environment(context)

  while (true) {
    try {
      const promptText = inMultiline ? "... " : "> "
      const line = await prompt(promptText)

      if (line.trim() === ".exit") process.exit(1)

      // Check for opening/closing braces to track block balance
      braceBalance += line.match(/{/g)?.length || 0
      braceBalance -= line.match(/}/g)?.length || 0

      inputBuffer += line + "\n"

      // If we're not in a multiline context and brace balance is 0, execute immediately
      if (!inMultiline && braceBalance === 0) {
        const result = interpret("REPL", inputBuffer.trim(), scope)
        console.log(result)
        inputBuffer = ""
      } else {
        // We're in a multiline context
        inMultiline = true

        // If we've balanced all braces, execute the accumulated input
        if (braceBalance === 0) {
          const result = interpret("REPL", inputBuffer.trim(), scope)
          console.log(result)
          inputBuffer = ""
          inMultiline = false
        }
      }
    } catch (err) {
      // Reset state on error
      inputBuffer = ""
      braceBalance = 0
      inMultiline = false

      if (err instanceof Error) {
        console.log(err.message)
      } else {
        console.log("An unknown error occurred")
      }
    }
  }
}

function run(filename: string) {
  const input = readFileSync(validateFilename(filename), { encoding: "utf-8" })

  interpret(filename, input)
}
