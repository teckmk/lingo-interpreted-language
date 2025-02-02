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
        tokenValue = tokenValue.substring(1, tokenValue.length - 1)
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

export class Organizer {
  private _tokens: Token[] = []

  get tokens() {
    return this._tokens
  }

  organize(tokens: Token[]): Organizer {
    const indentQ = new Queue<TokenType>(3)
    const nestedIndentQ = new Queue<TokenType>(5)
    const rootKeyValQ = new Queue<TokenType>(3)

    let indentWidth = 0

    for (const token of tokens) {
      this._tokens.push(token)

      indentQ.enqueue(token.type)
      nestedIndentQ.enqueue(token.type)
      rootKeyValQ.enqueue(token.type)

      if (isIndent(indentQ)) {
        // if new indent is started, and indentWidth is already > 0
        // then push dedent for each indentWidth
        if (!isNestedIndent(nestedIndentQ)) {
          for (let i = indentWidth; i > 0; i--) {
            insertAtIndex(this._tokens, this._tokens.length - 4, {
              type: TokenType.Dedent,
              value: "auto dedent",
              column: token.column + 1,
              line: token.column,
            })
          }
        }

        indentWidth = token.value.length

        this._tokens.push({
          type: TokenType.Indent,
          value: "indent",
          column: token.column + 1,
          line: token.column,
        })
      }

      if (token.type === TokenType.WhiteSpace) {
        if (token.value.length < indentWidth) {
          indentWidth = token.value.length
          this._tokens.push({
            type: TokenType.Dedent,
            value: "dedent",
            column: token.column + 1,
            line: token.column,
          })
        }
      }

      if (isRootKeyVal(rootKeyValQ)) {
        for (let i = indentWidth; i > 0; i--) {
          insertAtIndex(this._tokens, this._tokens.length - 4, {
            type: TokenType.Dedent,
            value: "auto dedent",
            column: token.column + 1,
            line: token.column,
          })
        }

        indentWidth = 0
      }
    }

    return this
  }

  filter() {
    this._tokens = this._tokens.filter(({ type }, index) => {
      const skippable = [TokenType.WhiteSpace, TokenType.SingleLineComment, TokenType.EOL].includes(
        type
      )

      // skip colon token before indent token
      const next = this._tokens[index + 1]
      const indentColon = type === TokenType.Colon && next.type === TokenType.Indent

      return !skippable && !indentColon
    })

    return this
  }
}

function isIndent(q: Queue<TokenType>) {
  return (
    q.peek(0) === TokenType.Colon &&
    q.peek(1) === TokenType.EOL &&
    q.peek(2) === TokenType.WhiteSpace
  )
}

function isNestedIndent(q: Queue<TokenType>) {
  return (
    q.peek(0) === TokenType.WhiteSpace &&
    q.peek(2) === TokenType.Colon &&
    q.peek(3) === TokenType.EOL &&
    q.peek(4) === TokenType.WhiteSpace
  )
}

function isRootKeyVal(q: Queue<TokenType>) {
  return (
    q.peek(0) === TokenType.EOL &&
    q.peek(1) === TokenType.Identifier &&
    q.peek(2) === TokenType.Equals
  )
}

class Queue<T> {
  private items: T[] = []
  private maxLength: number

  constructor(maxLength: number) {
    if (maxLength <= 0) {
      throw new Error("Maximum length should be greater than zero")
    }
    this.maxLength = maxLength
  }

  enqueue(item: T): void {
    this.items.push(item)

    if (this.items.length > this.maxLength) {
      this.dequeue()
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()
  }

  peek(index = 0): T | undefined {
    return this.items[index]
  }

  toList() {
    return [...this.items]
  }

  get size(): number {
    return this.items.length
  }

  get empty(): boolean {
    return this.items.length === 0
  }

  get full(): boolean {
    return this.items.length === this.maxLength
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
