import { specs, TokenType } from "../../frontend/lexer/specs"
import { Tokenizer } from "../../frontend/lexer/tokenizer"

describe("Tokenizer - Reserved Words", () => {
  it("should tokenize let", () => {
    const code = "var x"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Let, value: "var", column: 1, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 2, line: 1 },
      { type: TokenType.Identifier, value: "x", column: 3, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize const", () => {
    const code = "const x = 10"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Const, value: "const", column: 1, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 2, line: 1 },
      { type: TokenType.Identifier, value: "x", column: 3, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 4, line: 1 },
      { type: TokenType.Equals, value: "=", column: 5, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 6, line: 1 },
      { type: TokenType.NumberLiteral, value: "10", column: 7, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize final", () => {
    const code = "final x = 10"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Final, value: "final", column: 1, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 2, line: 1 },
      { type: TokenType.Identifier, value: "x", column: 3, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 4, line: 1 },
      { type: TokenType.Equals, value: "=", column: 5, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 6, line: 1 },
      { type: TokenType.NumberLiteral, value: "10", column: 7, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize fn", () => {
    const code = "fn x() {}"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Fn, value: "fn", column: 1, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 2, line: 1 },
      { type: TokenType.Identifier, value: "x", column: 3, line: 1 },
      { type: TokenType.OpenParen, value: "(", column: 4, line: 1 },
      { type: TokenType.CloseParen, value: ")", column: 5, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 6, line: 1 },
      { type: TokenType.OpenBrace, value: "{", column: 7, line: 1 },
      { type: TokenType.CloseBrace, value: "}", column: 8, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize return", () => {
    const code = "return 10"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Return, value: "return", column: 1, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 2, line: 1 },
      { type: TokenType.NumberLiteral, value: "10", column: 3, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize if", () => {
    const code = "if"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.If, value: "if", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize else", () => {
    const code = "else"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Else, value: "else", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize while", () => {
    const code = "while"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.While, value: "while", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize number", () => {
    const code = "number"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.NumberType, value: "number", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize string", () => {
    const code = "string"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.StringType, value: "string", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize bool", () => {
    const code = "bool"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.BooleanType, value: "bool", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize dynamic", () => {
    const code = "dynamic"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.DynamicType, value: "dynamic", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })
})
