import * as os from "os"

export enum TokenType {
  Number,
  String,
  Identifier,
  Equals,
  Let,
  OpenParen,
  CloseParen,
  BinaryOperator,
  EOF,
}

const KEYWORDS: Record<string, TokenType> = {
  let: TokenType.Let,
}

export interface Token {
  value: string
  type: TokenType
}

function token(value = "", type: TokenType) {
  return { value, type }
}

function isalpha(src: string) {
  return src.toUpperCase() !== src.toLowerCase()
}

function isint(src: string) {
  const c = src.charCodeAt(0)
  const bounds = ["0".charCodeAt(0), "9".charCodeAt(0)]
  return c >= bounds[0] && c <= bounds[1]
}

function isskippable(src: string) {
  return src === " " || src === "\n" || src === "\t" || os.EOL
}

export function tokenize(sourceCode: string): Token[] {
  const tokens = new Array<Token>()

  const src = sourceCode.split("")

  while (src.length > 0) {
    if (src[0] === "(") tokens.push(token(src.shift(), TokenType.OpenParen))
    else if (src[0] === ")") tokens.push(token(src.shift(), TokenType.CloseParen))
    else if (src[0] === "+" || src[0] === "-" || src[0] === "/" || src[0] === "*" || src[0] === "%")
      tokens.push(token(src.shift(), TokenType.BinaryOperator))
    else if (src[0] === "=") tokens.push(token(src.shift(), TokenType.Equals))
    else {
      // multi char tokens

      if (isint(src[0])) {
        let num = ""
        while (src.length > 0 && isint(src[0])) num += src.shift()

        tokens.push(token(num, TokenType.Number))
      } else if (isalpha(src[0])) {
        let str = ""
        while (src.length > 0 && isalpha(src[0])) str += src.shift()

        // check for reserved keywords
        const reserved = KEYWORDS[str]
        if (reserved) {
          tokens.push(token(str, reserved))
        } else {
          tokens.push(token(str, TokenType.Identifier))
        }
      } else if (isskippable(src[0])) {
        src.shift()
      } else {
        console.log("Unidentified token in source: ", src[0])
        process.exit()
      }
    }
  }

  tokens.push({ value: "EndOfFile", type: TokenType.EOF })

  return tokens
}
