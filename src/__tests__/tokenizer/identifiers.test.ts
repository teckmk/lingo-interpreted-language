import { specs, TokenType } from "../../frontend/lexer/specs"
import { Tokenizer } from "../../frontend/lexer/tokenizer"

describe("Tokenizer - Identifiers", () => {
  it("should tokenize identifiers", () => {
    const code = "x"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: "x", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize identifiers with capital letters", () => {
    const code = "X"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: "X", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize identifiers with mixed case", () => {
    const code = "xY"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: "xY", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize identifiers with numbers", () => {
    const code = "x1"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: "x1", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize identifiers with underscores", () => {
    const code = "x_"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: "x_", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize identifiers with underscores and numbers", () => {
    const code = "x_1"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: "x_1", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize identifiers with numbers and trailing underscores", () => {
    const code = "x1_"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: "x1_", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize identifiers with leading underscores", () => {
    const code = "_x"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: "_x", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })
})
