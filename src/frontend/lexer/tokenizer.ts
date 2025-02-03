/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Spec, TokenType } from "./specs"

export type Token = {
  type: TokenType
  value: any
  column: number
  line: number
  code?: string
}

export class Tokenizer {
  private _spec: Spec[]
  private _tokens: Token[] = []

  private _cursor = 0
  private _line = 1 // current line
  private _tokenNumber = 0 // current column

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
      column: -1,
      line: this._line,
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

    for (const { regex, tokenType } of this._spec) {
      let tokenValue = this._matched(regex, code)

      // skip iteration if there's no match
      if (tokenValue == null) continue

      if (tokenType == TokenType.EOL) {
        this._line++
        this._tokenNumber = 1
      }

      if (tokenType == TokenType.StringLiteral) {
        // remove quotes from string
        tokenValue = tokenValue.substring(1, tokenValue.length - 1)
      }

      if (tokenType == TokenType.EOL) {
        tokenValue = "\n"
      }

      return this._pushToken({
        type: tokenType,
        value: tokenValue,
        column: this._tokenNumber,
        line: this._line,
        // code,
      })
    }

    throw new Error(
      `Unexpected token '${code[0]}' at ${this._line}:${this._tokenNumber} in ${this._filename}`
    )
  }

  private _matched(regex: RegExp, string: string) {
    const matched = regex.exec(string)

    if (matched == null) return null

    this._cursor += matched[0].length
    this._tokenNumber++

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
    const indentStack: Stack<number> = new Stack([0]) // Initialize with root level 0
    let afterColon = false
    let afterEOL = false

    for (const token of tokens) {
      if (token.type === TokenType.Colon) {
        afterColon = true
        this._tokens.push(token)
      } else if (afterColon && token.type === TokenType.EOL) {
        this._tokens.push(token)
        afterEOL = true
      } else if (afterColon && afterEOL && token.type === TokenType.WhiteSpace) {
        const currentIndent = indentStack.peek
        const newIndent = token.value.length

        if (newIndent > currentIndent) {
          // Indent level increased
          indentStack.push(newIndent)
          this._tokens.push(this._createIndentToken(token))
        } else if (newIndent < currentIndent) {
          // Indent level decreased
          let dedentCount = 0
          while (indentStack.length > 1 && indentStack.peek > newIndent) {
            dedentCount++
            indentStack.pop()
          }

          if (indentStack.peek !== newIndent) {
            throw new Error(`Invalid indentation at ${token.line}:${token.column}`)
          }

          for (let i = 0; i < dedentCount; i++) {
            this._tokens.push(this._createDedentToken(token))
          }
        }
        afterEOL = false
      }
      // Token is not an EOL or whitespace
      else {
        this._tokens.push(token)
        afterEOL = false
      }
    }

    // Add final dedents for remaining indentation levels
    while (indentStack.length > 1) {
      indentStack.pop()
      // push dedent token(s), before EOF token
      insertAtIndex(
        this._tokens,
        this._tokens.length - 1,
        this._createDedentToken(this._tokens[this._tokens.length - 1])
      )
    }

    return this
  }

  removeUnwantedTokens() {
    this._tokens = this._tokens.filter(({ type }, index) => {
      const skippable = type === TokenType.WhiteSpace || type === TokenType.SingleLineComment
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
    let currentColumn = 1
    let currentLine = 1
    const tokens = []

    for (const token of this._tokens) {
      if (token.type === TokenType.EOL) {
        currentLine++
        currentColumn = 1
        continue
      }

      if (token.type === TokenType.Indent || token.type === TokenType.Dedent) {
        currentColumn = 1
      }

      const newToken = {
        ...token,
        column: currentColumn++,
        line: currentLine,
      }

      // the EOF token should have the column number of -1
      if (newToken.type === TokenType.EOF) {
        newToken.column = -1
      }

      tokens.push(newToken)
    }

    this._tokens = tokens
    return this
  }

  private _createIndentToken(baseToken: Token): Token {
    return {
      type: TokenType.Indent,
      value: "indent",
      column: 1,
      line: baseToken.line + 1,
    }
  }

  private _createDedentToken(baseToken: Token): Token {
    return {
      type: TokenType.Dedent,
      value: "dedent",
      column: 1,
      line: baseToken.line + 1,
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

  get peek() {
    return this.stack[this.stack.length - 1]
  }

  get length() {
    return this.stack.length
  }

  push(item: T) {
    this.stack.push(item)
  }

  pop(): T | undefined {
    return this.stack.pop()
  }
}
