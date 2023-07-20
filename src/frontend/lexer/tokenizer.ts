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
  private _spec: Spec[]
  private _tokens: Token[] = []

  private _cursor = 0
  private _line = 1 // current line
  private _tokenNumber = 1 // current column
  private _indentation = 0

  private _code = ""
  private _filename = ""

  constructor(spec: Spec[], filename: string) {
    this._spec = spec
    this._filename = filename
  }

  tokenize(code: string) {
    this._code = code
    this._cursor = 0

    while (!this._isEOF && this._hasNext) this._readToken()

    this._tokens.push({
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

  private _indentWidth = 0
  private _lastTokenType: TokenType | null = null
  private _isIndented = false

  private _readToken() {
    const code = this._code.slice(this._cursor)

    for (const { regex, tokenType } of this._spec) {
      const tokenValue = this._matched(regex, code)

      // skip iteration if there's no match
      if (tokenValue == null) continue

      if (this._lastTokenType == TokenType.EOL) {
        this._lastTokenType = tokenType
        this._line++
        this._tokenNumber = 0 // now starting from 0 of the new line

        if (tokenType == TokenType.WhiteSpace) {
          if (this._indentWidth == 0) this._indentWidth = tokenValue.length

          const whitespace = tokenValue.length

          if (whitespace % this._indentWidth != 0) {
            throw InvalidIndentationError(this._indentWidth, this._line)
          }

          if (whitespace > this._indentation) {
            this._indentation += this._indentWidth
            this._isIndented = true
            this._tokens.push({
              type: TokenType.Indent,
              value: tokenValue,
              column: this._tokenNumber,
              line: this._line,
            })
            return
          } else if (whitespace < this._indentation) {
            this._indentation -= this._indentWidth
            this._isIndented = false
            this._tokens.push({
              type: TokenType.Dedent,
              value: tokenValue,
              column: this._tokenNumber,
              line: this._line,
            })
            return
          }
        } else {
          // handle last dedent (note: we are not returning after this block)
          if (this._indentation == this._indentWidth && this._isIndented) {
            this._indentation = 0
            this._isIndented = false
            this._tokens.push({
              type: TokenType.Dedent,
              value: tokenValue,
              column: this._tokenNumber,
              line: this._line,
            })
          }
        }
      }

      this._lastTokenType = tokenType

      if (
        tokenType == TokenType.WhiteSpace ||
        tokenType == TokenType.EOL ||
        tokenType == TokenType.SingleLineComment
      )
        return

      this._tokens.push({
        type: tokenType,
        value: tokenValue,
        column: this._tokenNumber,
        line: this._line,
        // code,
      })
      return
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
}
