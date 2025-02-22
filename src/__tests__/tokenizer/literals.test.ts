import { specs, TokenType } from "../../frontend/lexer/specs"
import { Tokenizer } from "../../frontend/lexer/tokenizer"

describe("Tokenizer - Liternals", () => {
  const tokenizer = new Tokenizer(specs, "test")

  describe("should tokenize number literals", () => {
    it("should tokenize integers", () => {
      const code = "10"
      const tokens = tokenizer.tokenize(code)

      expect(tokens).toEqual([
        { type: TokenType.NumberLiteral, value: "10", column: 1, line: 1 },
        { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
      ])
    })

    it("should tokenize positive integers", () => {
      const code = "+10"
      const tokens = tokenizer.tokenize(code)

      expect(tokens).toEqual([
        { type: TokenType.AdditiveOperator, value: "+", column: 1, line: 1 },
        { type: TokenType.NumberLiteral, value: "10", column: 2, line: 1 },
        { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
      ])
    })

    it("should tokenize negative integers", () => {
      const code = "-10"
      const tokens = tokenizer.tokenize(code)

      expect(tokens).toEqual([
        { type: TokenType.AdditiveOperator, value: "-", column: 1, line: 1 },
        { type: TokenType.NumberLiteral, value: "10", column: 2, line: 1 },
        { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
      ])
    })
  })

  describe("should tokenize floats", () => {
    it("should tokenize floats", () => {
      const code = "10.5"
      const tokens = tokenizer.tokenize(code)

      expect(tokens).toEqual([
        { type: TokenType.NumberLiteral, value: "10.5", column: 1, line: 1 },
        { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
      ])
    })

    it("should tokenize positive floats", () => {
      const code = "+10.5"
      const tokens = tokenizer.tokenize(code)

      expect(tokens).toEqual([
        { type: TokenType.AdditiveOperator, value: "+", column: 1, line: 1 },
        { type: TokenType.NumberLiteral, value: "10.5", column: 2, line: 1 },
        { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
      ])
    })
    it("should tokenize negative floats", () => {
      const code = "-10.5"
      const tokens = tokenizer.tokenize(code)

      expect(tokens).toEqual([
        { type: TokenType.AdditiveOperator, value: "-", column: 1, line: 1 },
        { type: TokenType.NumberLiteral, value: "10.5", column: 2, line: 1 },
        { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
      ])
    })
  })

  // ? true/false are not literals, they are identifiers

  describe("should tokenize strings", () => {
    it("should tokenize strings", () => {
      const code = '"hello world"'
      const tokens = tokenizer.tokenize(code)

      expect(tokens).toEqual([
        { type: TokenType.StringLiteral, value: "hello world", column: 1, line: 1 },
        { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
      ])
    })

    it("should tokenize strings with escaped characters", () => {
      const code = '"hello \\"world\\""'
      const tokens = tokenizer.tokenize(code)

      expect(tokens).toEqual([
        { type: TokenType.StringLiteral, value: 'hello "world"', column: 1, line: 1 },
        { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
      ])
    })
  })
})
