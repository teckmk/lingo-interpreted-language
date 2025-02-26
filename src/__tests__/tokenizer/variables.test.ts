import { tokenize, Tokenizer } from "../../frontend/lexer/tokenizer"
import { TokenType, specs } from "../../frontend/lexer/specs"

describe("Tokenizer - Variable Declarations", () => {
  const tokenizer = new Tokenizer(specs, "test")

  it("should tokenize var declaration", () => {
    const code = "var x = 10"
    const tokens = tokenizer.tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Let, value: "var", column: 1, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 2, line: 1 },
      { type: TokenType.Identifier, value: "x", column: 3, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 4, line: 1 },
      { type: TokenType.Equals, value: "=", column: 5, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 6, line: 1 },
      { type: TokenType.NumberLiteral, value: "10", column: 7, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize const declaration", () => {
    const code = "const y = 20"
    const tokens = tokenizer.tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Const, value: "const", column: 1, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 2, line: 1 },
      { type: TokenType.Identifier, value: "y", column: 3, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 4, line: 1 },
      { type: TokenType.Equals, value: "=", column: 5, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 6, line: 1 },
      { type: TokenType.NumberLiteral, value: "20", column: 7, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize final declaration", () => {
    const code = "final z = 30"
    const tokens = tokenizer.tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Final, value: "final", column: 1, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 2, line: 1 },
      { type: TokenType.Identifier, value: "z", column: 3, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 4, line: 1 },
      { type: TokenType.Equals, value: "=", column: 5, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 6, line: 1 },
      { type: TokenType.NumberLiteral, value: "30", column: 7, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize multiple var declarations", () => {
    const code = "var a = 1, b = 2, c = 3"
    const tokens = tokenizer.tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Let, value: "var", column: 1, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 2, line: 1 },
      { type: TokenType.Identifier, value: "a", column: 3, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 4, line: 1 },
      { type: TokenType.Equals, value: "=", column: 5, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 6, line: 1 },
      { type: TokenType.NumberLiteral, value: "1", column: 7, line: 1 },
      { type: TokenType.Comma, value: ",", column: 8, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 9, line: 1 },
      { type: TokenType.Identifier, value: "b", column: 10, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 11, line: 1 },
      { type: TokenType.Equals, value: "=", column: 12, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 13, line: 1 },
      { type: TokenType.NumberLiteral, value: "2", column: 14, line: 1 },
      { type: TokenType.Comma, value: ",", column: 15, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 16, line: 1 },
      { type: TokenType.Identifier, value: "c", column: 17, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 18, line: 1 },
      { type: TokenType.Equals, value: "=", column: 19, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 20, line: 1 },
      { type: TokenType.NumberLiteral, value: "3", column: 21, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })
})

describe("Tokenizer - Variable Assignments", () => {
  it("should tokenize var assignment", () => {
    const code = `var a: dynamic = 10
    a = 20`

    const tokens = tokenize("test", code)

    expect(tokens).toEqual([
      { type: TokenType.Let, value: "var", column: 1, line: 1 },
      { type: TokenType.Identifier, value: "a", column: 2, line: 1 },
      { type: TokenType.Colon, value: ":", column: 3, line: 1 },
      { type: TokenType.DynamicType, value: "dynamic", column: 4, line: 1 },
      { type: TokenType.Equals, value: "=", column: 5, line: 1 },
      { type: TokenType.NumberLiteral, value: "10", column: 6, line: 1 },

      { type: TokenType.Identifier, value: "a", column: 1, line: 2 },
      { type: TokenType.Equals, value: "=", column: 2, line: 2 },
      { type: TokenType.NumberLiteral, value: "20", column: 3, line: 2 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 2 },
    ])
  })
})
