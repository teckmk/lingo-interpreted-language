import { Tokenizer } from "../../frontend/lexer/tokenizer"
import { TokenType, specs } from "../../frontend/lexer/specs"

describe("Tokenizer - End of Line", () => {
  const tokenizer = new Tokenizer(specs, "test")

  it("should tokenize eol", () => {
    const code = `var x = 10
    var y = 20`
    const tokens = tokenizer.tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Let, value: "var", column: 1, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 2, line: 1 },
      { type: TokenType.Identifier, value: "x", column: 3, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 4, line: 1 },
      { type: TokenType.Equals, value: "=", column: 5, line: 1 },
      { type: TokenType.WhiteSpace, value: " ", column: 6, line: 1 },
      { type: TokenType.NumberLiteral, value: "10", column: 7, line: 1 },

      { type: TokenType.EOL, value: "\n", column: 1, line: 2 },
      { type: TokenType.WhiteSpace, value: "    ", column: 2, line: 2 },
      { type: TokenType.Let, value: "var", column: 3, line: 2 },
      { type: TokenType.WhiteSpace, value: " ", column: 4, line: 2 },
      { type: TokenType.Identifier, value: "y", column: 5, line: 2 },
      { type: TokenType.WhiteSpace, value: " ", column: 6, line: 2 },
      { type: TokenType.Equals, value: "=", column: 7, line: 2 },
      { type: TokenType.WhiteSpace, value: " ", column: 8, line: 2 },
      { type: TokenType.NumberLiteral, value: "20", column: 9, line: 2 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 2 },
    ])
  })
})
