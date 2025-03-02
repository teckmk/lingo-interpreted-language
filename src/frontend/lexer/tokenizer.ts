/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Spec, specs, TokenType } from "./specs"

type Position = {
  line: number
  column: number
}

export type Token = {
  type: TokenType
  value: any
  position: { start: Position; end: Position } // end.column is exclusive
}

export class Tokenizer {
  private _spec: Spec[]
  private _tokens: Token[] = []

  private _cursor = 0
  private _line = 1 // current line
  private _tokenNumber = 0 // current token

  private _code = ""
  private _filename = ""

  constructor(spec: Spec[], filename: string) {
    this._spec = spec
    this._filename = filename
  }

  tokenize(code: string) {
    this._code = code
    this._cursor = 0
    this._line = 1
    this._tokenNumber = 0
    this._tokens = []

    while (!this._isEOF && this._hasNext) this._readToken()

    this._pushToken({
      type: TokenType.EOF,
      value: "EOF",
      position: { start: { line: this._line, column: -1 }, end: { line: this._line, column: -1 } },
    })

    return this._tokens
  }

  private get _isEOF(): boolean {
    if (!this._code) return true

    return this._cursor == this._code.length
  }

  private get _hasNext(): boolean {
    if (!this._code || this._code.length == 0) return false

    return this._cursor < this._code.length
  }

  private _readToken() {
    const code = this._code.slice(this._cursor)
    const startCursor = this._cursor

    for (const { regex, tokenType } of this._spec) {
      let tokenValue = this._matched(regex, code)

      // skip iteration if there's no match
      if (tokenValue == null) continue

      // Get the position of the current cursor within the current line
      // We need to calculate the actual column by finding the start position of the current line
      const lineStartIndex = this._code.lastIndexOf("\n", startCursor - 1) + 1
      // Column is 1-indexed
      const startColumn = startCursor - lineStartIndex + 1

      // Calculate the start position
      const startPos = {
        line: this._line,
        column: startColumn,
      }

      // Calculate the end position
      const endPos = {
        line: this._line,
        column: startColumn + tokenValue.length,
      }

      // Handle newlines separately
      if (tokenType == TokenType.EOL) {
        this._line++
        tokenValue = "\n"
      }

      // Process string literals
      if (tokenType == TokenType.StringLiteral) {
        // Unescape escaped quotes and backslashes.
        // TODO: expand this to support other escape sequences.
        tokenValue = tokenValue.replace(/\\"/g, '"').replace(/\\\\/g, "\\")
        // trim the quotes
        tokenValue = tokenValue.slice(1, -1)
      }

      return this._pushToken({
        type: tokenType,
        value: tokenValue,
        position: {
          start: startPos,
          end: endPos,
        },
      })
    }

    throw new Error(
      `Unexpected token '${code[0]}' at ${this._line}:${this._cursor - this._code.lastIndexOf("\n", this._cursor - 1)} in ${this._filename}`,
    )
  }

  private _matched(regex: RegExp, string: string) {
    const matched = regex.exec(string)

    if (matched == null) return null

    this._cursor += matched[0].length
    // Don't increment _tokenNumber here anymore as we're calculating column differently

    return matched[0]
  }

  private _pushToken(token: Token) {
    this._tokens.push(token)
  }
}

export class IndentMaker {
  private _tokens: Token[] = []

  get tokens() {
    return this._tokens
  }

  markIndents(tokens: Token[]): IndentMaker {
    const indentStack: Stack<number> = new Stack([0]) // initialize with root indent 0
    let afterEOL = false
    let afterColon = false

    for (const token of tokens) {
      // If the token is a colon, set the flag and push the token.
      if (token.type === TokenType.Colon) {
        afterColon = true
        this._tokens.push(token)
        continue
      }

      // If there was not EOL immediately after a colon (and afterEOL is not already true), reset the flag.
      if (afterColon && !afterEOL && token.type !== TokenType.EOL) {
        afterColon = false
      }

      // If the token is an end-of-line, push it and note that the next token starts a new line.
      if (token.type === TokenType.EOL) {
        this._tokens.push(token)
        afterEOL = true
        continue
      }

      // If we’re at the start of a new line…
      if (afterEOL && token.type === TokenType.WhiteSpace) {
        const currentIndent = indentStack.peek()
        const newIndent = token.value.length

        // When indent increases, only allow it if the previous line ended with a colon.
        if (newIndent > currentIndent) {
          if (afterColon) {
            indentStack.push(newIndent)
            this._tokens.push(this._createIndentToken(token))
          }
        }
        // When indent decreases, insert one or more dedent tokens.
        else if (newIndent < currentIndent) {
          while (indentStack.length > 1 && indentStack.peek() > newIndent) {
            this._tokens.push(this._createDedentToken(token))
            indentStack.pop()
          }
          if (indentStack.peek() !== newIndent) {
            throw new Error(
              `IndentationError: Invalid indentation at ${token.position.start.line}:${token.position.start.column}`,
            )
          }
        }
        // Reset the flags after processing the whitespace.
        afterEOL = false
        afterColon = false
        // Do not push the whitespace token itself.
        continue
      }

      // If we're at the start of a new line but the line does not start with whitespace…
      if (afterEOL) {
        const currentIndent = indentStack.peek()
        const newIndent = 0
        if (newIndent < currentIndent) {
          while (indentStack.length > 1 && indentStack.peek() > newIndent) {
            this._tokens.push(this._createDedentToken(token))
            indentStack.pop()
          }
          if (indentStack.peek() !== newIndent) {
            throw new Error(
              `Invalid indentation at ${token.position.start.line}:${token.position.start.column}`,
            )
          }
        }
        afterEOL = false
        afterColon = false
        this._tokens.push(token)
        continue
      }

      // For all other tokens, just push them.
      this._tokens.push(token)
    }

    // At the end, add any necessary dedent tokens for any remaining indents.
    while (indentStack.length > 1) {
      indentStack.pop()
      insertAtIndex(
        this._tokens,
        this._tokens.length - 1,
        this._createDedentToken(this._tokens[this._tokens.length - 1]),
      )
    }

    return this
  }

  removeUnwantedTokens() {
    this._tokens = this._tokens.filter(({ type }, index) => {
      const skippable =
        type === TokenType.WhiteSpace ||
        type === TokenType.SingleLineComment ||
        type === TokenType.EOL

      const next = this._tokens[index + 1]
      const nextOfNext = this._tokens[index + 2]
      const indentColon =
        type === TokenType.Colon &&
        next?.type === TokenType.EOL &&
        nextOfNext?.type === TokenType.Indent
      return !skippable && !indentColon
    })
    return this
  }

  fixColumnNumbers() {
    // let currentColumn = 1
    // let currentLine = 1
    // const tokens = []

    // for (const token of this._tokens) {
    //   if (token.type === TokenType.EOL) {
    //     currentLine++
    //     currentColumn = 1
    //     continue
    //   }

    //   if (token.type === TokenType.Indent || token.type === TokenType.Dedent) {
    //     currentColumn = 1
    //   }

    //   const newToken = {
    //     ...token,
    //     column: currentColumn++,
    //     line: currentLine,
    //   }

    //   // the EOF token should have the column number of -1
    //   if (newToken.type === TokenType.EOF) {
    //     newToken.column = -1
    //   }

    //   tokens.push(newToken)
    // }

    // this._tokens = tokens
    return this
  }

  private _createIndentToken(baseToken: Token): Token {
    return {
      type: TokenType.Indent,
      value: "indent",
      position: {
        start: { line: baseToken.position.end.line, column: 1 },
        end: { line: baseToken.position.end.line, column: baseToken.value.length },
      },
    }
  }

  private _createDedentToken(baseToken: Token): Token {
    return {
      type: TokenType.Dedent,
      value: "dedent",
      position: {
        start: { line: baseToken.position.end.line, column: 1 },
        end: { line: baseToken.position.end.line, column: baseToken.value.length },
      },
    }
  }
}

function insertAtIndex<T>(array: T[], index: number, element: T): T[] {
  if (index < 0 || index > array.length) {
    throw new Error("Index is out of range")
  }

  // Use splice to insert the element at the specified index
  array.splice(index, 0, element)

  return array
}

// Create stack class
class Stack<T> {
  private stack: T[] = []

  constructor(initialItems: T[] = []) {
    this.stack = initialItems
  }

  get length() {
    return this.stack.length
  }

  peek(): T {
    return this.stack[this.stack.length - 1]
  }

  push(item: T) {
    this.stack.push(item)
  }

  pop(): T | undefined {
    return this.stack.pop()
  }
}

export function tokenize(filename: string, code: string): Token[] {
  const tokens = new Tokenizer(specs, filename).tokenize(code)

  return new IndentMaker().markIndents(tokens).removeUnwantedTokens().fixColumnNumbers().tokens
}
