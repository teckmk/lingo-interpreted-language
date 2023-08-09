/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { InvalidIndentationError } from "../../error"
import { Spec, TokenType } from "./specs"

export type Token = {
  type: TokenType
  value: any
  column: number
  line: number
  code?: string
}

export default class Tokenizer {
  private MAX_QUEUE_LEN = 3

  private _spec: Spec[]
  private _tokens: Token[] = []
  private _tokenTypesQueue: TokenType[] = []

  private _cursor = 0
  private _line = 1 // current line
  private _tokenNumber = 1 // current column

  private _code = ""
  private _filename = ""

  private _tabSize = 0
  private _indentation = 0
  private _isIndentMode = false

  constructor(spec: Spec[], filename: string) {
    this._spec = spec
    this._filename = filename
  }

  tokenize(code: string) {
    this._code = code
    this._cursor = 0

    while (!this._isEOF && this._hasNext) this._readToken()

    this._pushToken({
      type: TokenType.EOF,
      value: "EOF",
      column: this._tokenNumber,
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
      const tokenValue = this._matched(regex, code)

      // skip iteration if there's no match
      if (tokenValue == null) continue

      if (tokenType == TokenType.EOL) {
        this._line++
        this._tokenNumber = 0
      }

      if (tokenType == TokenType.WhiteSpace) {
        const indent = this._handleIndentation(tokenValue)
        if (indent) return
      }

      if (this._isIndentMode) {
        const dedent = this._handleDedentation(tokenValue, tokenType)
        if (dedent) return
      }

      if (
        tokenType == TokenType.EOL ||
        tokenType == TokenType.SingleLineComment ||
        tokenType == TokenType.WhiteSpace
      ) {
        this._updateQueue(tokenType)
        return
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

  private _updateQueue(tokenType: TokenType) {
    const queueLen = this._tokenTypesQueue.length

    if (queueLen == this.MAX_QUEUE_LEN) this._tokenTypesQueue.shift()

    this._tokenTypesQueue.push(tokenType)
  }

  private _pushToken(token: Token) {
    this._tokens.push(token)
    this._updateQueue(token.type)
  }

  private _handleIndentation(tokenValue: string) {
    const q = this._tokenTypesQueue
    const whitespace = tokenValue.length

    if (q.length != this.MAX_QUEUE_LEN) return false

    // handle indent start
    if (q[1] != TokenType.Colon && q[2] != TokenType.EOL) return false

    // remove ':' token so it doesn't bother us in parser
    if (this._tokens.at(-1)?.type == TokenType.Colon) this._tokens.pop()

    if (this._tabSize == 0) this._tabSize = whitespace

    if (whitespace % this._tabSize != 0) throw InvalidIndentationError(this._tabSize, this._line)

    if (whitespace > this._indentation) {
      this._indentation += this._tabSize
      this._isIndentMode = true

      this._pushToken({
        type: TokenType.Indent,
        value: whitespace,
        column: this._tokenNumber,
        line: this._line,
      })

      return true
    }

    return false
  }

  private _handleDedentation(tokenValue: any, tokenType: TokenType) {
    if (this._tokenTypesQueue[2] != TokenType.EOL) return false

    if (tokenType == TokenType.WhiteSpace) {
      const whitespace = tokenValue.length

      if (whitespace < this._indentation) {
        this._indentation -= this._tabSize

        this._pushToken({
          type: TokenType.Dedent, // TokenType.Dedent
          value: tokenValue,
          column: this._tokenNumber,
          line: this._line,
        })

        return true
      }
    }

    if (this._indentation == this._tabSize) {
      this._indentation = 0
      this._isIndentMode = false

      this._pushToken({
        type: TokenType.Dedent, // TokenType.Dedent
        value: tokenValue,
        column: this._tokenNumber,
        line: this._line,
      })

      return true
    }

    return false
  }
}
