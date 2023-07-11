/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Spec, TokenType } from "./specs"

export type Token = {
  type: TokenType
  value: any
  cursor: number
  line: number
}

export default class Tokenizer {
  private _spec: Spec[]
  private _tokens: Token[] = []
  private _lastTokenType: TokenType = TokenType.WhiteSpace

  private _cursor = 0
  private _currentLine = 0
  private _identation = 0

  private _code = ""
  private _filename = ""

  constructor(spec: Spec[], filename: string) {
    this._spec = spec
    this._filename = filename
  }

  tokenize(code: string) {
    this._code = code
    this._cursor = 0

    while (!this._isEOF && this._hasNext) this._tokens.push(this._readToken())

    this._tokens.push({
      type: TokenType.EOF,
      value: "EOF",
      cursor: this._cursor,
      line: this._currentLine,
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

  private _readToken(): Token {
    const code = this._code.slice(this._cursor)

    for (const { regex, tokenType } of this._spec) {
      const tokenValue = this._matched(regex, code)

      if (tokenValue == null) continue

      // Capture Identation
      if (this._lastTokenType == TokenType.EOL && tokenType == TokenType.Tab) {
        this._lastTokenType = tokenType
        const tabLength = tokenValue!.length

        if (tabLength > this._identation) {
          this._identation += tabLength
          return {
            type: TokenType.Indent,
            value: tokenValue,
            cursor: this._cursor,
            line: this._currentLine,
          }
        } else if (tabLength < this._identation) {
          this._identation -= tabLength
          return {
            type: TokenType.Dedent,
            value: tokenValue,
            cursor: this._cursor,
            line: this._currentLine,
          }
        }
      }

      if (tokenType == TokenType.WhiteSpace || tokenType == TokenType.Tab) continue // Skipping whitespace

      if (tokenType == TokenType.EOL) {
        this._lastTokenType = tokenType
        this._currentLine++
        continue
      }

      this._lastTokenType = tokenType

      return {
        type: tokenType,
        value: tokenValue,
        cursor: this._cursor,
        line: this._currentLine,
      }
    }

    throw new Error(
      `Unexpected token: "${code[0]}" at ${this._currentLine}:${this._cursor} in ${this._filename}`
    )
  }

  private _matched(regex: RegExp, string: string) {
    const matched = regex.exec(string)

    if (matched == null) return null

    this._cursor += matched[0].length

    return matched[0]
  }
}
