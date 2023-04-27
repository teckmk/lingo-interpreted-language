import * as readline from "readline"
import { EXT } from "./contants"

export async function prompt(question: string): Promise<string> {
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

export function validateFilename(filename: string): string {
  if (filename.endsWith(EXT)) return filename

  throw new Error(`Invalid file, filename must end with '${EXT}'`)
}
