import * as os from "os"

export enum TokenType {
  Number,
  String,
  Identifier,
  Equals,
  Let,
  Const,
  Fn,
  If,
  Else,
  While,
  Semicolon,
  Comma,
  Dot,
  And,
  Or,
  Exclamation,
  Equality,
  NotEquality,
  GreaterThan,
  LessThan,
  GreaterThanOrEqual,
  LessThanOrEqual,
  Colon,
  OpenParen, // (
  CloseParen, // )
  OpenBrace, // {
  CloseBrace, // }
  OpenBracket, // [
  CloseBracket, // ]
  BinaryOperator,
  EOF,
}

const KEYWORDS: Record<string, TokenType> = {
  var: TokenType.Let,
  const: TokenType.Const,
  fn: TokenType.Fn,
  if: TokenType.If,
  else: TokenType.Else,
  while: TokenType.While,
  and: TokenType.And,
  or: TokenType.Or,
}

export interface Token {
  type: TokenType
  value: string
}

function token(value = "", type: TokenType) {
  return { type, value }
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
  return src === " " || src === "\n" || src === "\t" || src === os.EOL || src === "\r"
}

export function tokenize(sourceCode: string): Token[] {
  const tokens = new Array<Token>()

  const src = sourceCode.split("")

  while (src.length > 0) {
    // parens
    /**/ if (src[0] === "(") tokens.push(token(src.shift(), TokenType.OpenParen))
    else if (src[0] === ")") tokens.push(token(src.shift(), TokenType.CloseParen))
    // braces
    else if (src[0] === "{") tokens.push(token(src.shift(), TokenType.OpenBrace))
    else if (src[0] === "}") tokens.push(token(src.shift(), TokenType.CloseBrace))
    // brackets
    else if (src[0] === "[") tokens.push(token(src.shift(), TokenType.OpenBracket))
    else if (src[0] === "]") tokens.push(token(src.shift(), TokenType.CloseBracket))
    // arithematic ops
    else if (src[0] === "+" || src[0] === "-" || src[0] === "/" || src[0] === "*" || src[0] === "%")
      tokens.push(token(src.shift(), TokenType.BinaryOperator))
    // special chars
    else if (src[0] === ":") tokens.push(token(src.shift(), TokenType.Colon))
    else if (src[0] === ";") tokens.push(token(src.shift(), TokenType.Semicolon))
    else if (src[0] === ",") tokens.push(token(src.shift(), TokenType.Comma))
    else if (src[0] === ".") tokens.push(token(src.shift(), TokenType.Dot))
    else if (src[0] === "=") {
      if (src[1] === "=") tokens.push(token(src.shift() + src.shift()!, TokenType.Equality))
      else tokens.push(token(src.shift(), TokenType.Equals))
    } else if (src[0] === "!") {
      if (src[1] === "=") tokens.push(token(src.shift() + src.shift()!, TokenType.NotEquality))
      else tokens.push(token(src.shift(), TokenType.Exclamation))
    } else if (src[0] === ">") {
      if (src[1] === "=")
        tokens.push(token(src.shift() + src.shift()!, TokenType.GreaterThanOrEqual))
      else tokens.push(token(src.shift(), TokenType.GreaterThan))
    } else if (src[0] === "<") {
      if (src[1] === "=") tokens.push(token(src.shift() + src.shift()!, TokenType.LessThanOrEqual))
      else tokens.push(token(src.shift(), TokenType.LessThan))
    } else if (src[0] === "|") {
      if (src[1] === "|") tokens.push(token(src.shift() + src.shift()!, TokenType.Or))
    } else if (src[0] === "&") {
      if (src[1] === "&") tokens.push(token(src.shift() + src.shift()!, TokenType.And))
    }
    // multi char tokens
    else {
      if (isint(src[0])) {
        let num = ""
        while (src.length > 0 && isint(src[0])) num += src.shift()

        tokens.push(token(num, TokenType.Number))
      } else if (isalpha(src[0])) {
        let str = ""
        while (src.length > 0 && (isalpha(src[0]) || isint(src[0]) || src[0] == "_"))
          str += src.shift()

        // check for reserved keywords
        const reserved = KEYWORDS[str]
        if (typeof reserved === "number") {
          tokens.push(token(str, reserved))
        } else {
          tokens.push(token(str, TokenType.Identifier))
        }
      } else if (isskippable(src[0])) {
        src.shift()
      } else if (src[0] === '"') {
        // handling strings
        src.shift() // remove start quote
        let str = ""
        while (src.length > 0 && src[0] !== '"') str += src.shift()
        src.shift() // remove end quote
        tokens.push(token(str, TokenType.String))
      } else {
        console.log("Unidentified token in source: ", src[0])
        process.exit()
      }
    }
  }

  tokens.push({ value: "EndOfFile", type: TokenType.EOF })

  return tokens
}
