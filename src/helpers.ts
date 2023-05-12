import * as fs from "node:fs"
import * as readline from "readline"
import path from "path"
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

export class Placholder {
  static expr(title: string | number) {
    return `#expr(${title})`
  }
}

export const emitTempFile = (filename: string, data: string) => {
  const tempPath = "_temp_"

  return new Promise((resolve, reject) => {
    fs.mkdir(tempPath, { recursive: true }, (err) => {
      if (err) reject(err)

      fs.writeFile(path.join(tempPath, filename), data, { encoding: "utf-8" }, (err) => {
        if (err) reject(err)
        resolve(filename)
      })
    })
  })
}
