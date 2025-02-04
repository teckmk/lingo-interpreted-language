import { specs, TokenType } from "../../frontend/lexer/specs"
import { IndentMaker, Tokenizer } from "../../frontend/lexer/tokenizer"

describe("Tokenizer - Indented Code Blocks", () => {
  const tokenizer = new Tokenizer(specs, "test")

  it("should tokenize indented code block", () => {
    const code = `fn foo():
    x = 10
    y = 20
`
    const tokens = tokenizer.tokenize(code)

    const indented = new IndentMaker()
      .markIndents(tokens)
      .removeUnwantedTokens()
      .fixColumnNumbers().tokens

    expect(indented).toEqual([
      { type: TokenType.Fn, value: "fn", column: 1, line: 1 },
      { type: TokenType.Identifier, value: "foo", column: 2, line: 1 },
      { type: TokenType.OpenParen, value: "(", column: 3, line: 1 },
      { type: TokenType.CloseParen, value: ")", column: 4, line: 1 },

      { type: TokenType.Indent, value: "indent", column: 1, line: 2 },
      { type: TokenType.Identifier, value: "x", column: 2, line: 2 },
      { type: TokenType.Equals, value: "=", column: 3, line: 2 },
      { type: TokenType.NumberLiteral, value: "10", column: 4, line: 2 },

      { type: TokenType.Identifier, value: "y", column: 1, line: 3 },
      { type: TokenType.Equals, value: "=", column: 2, line: 3 },
      { type: TokenType.NumberLiteral, value: "20", column: 3, line: 3 },

      { type: TokenType.Dedent, value: "dedent", column: 1, line: 4 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 4 },
    ])
  })

  it("should tokenize nested and indented code block", () => {
    const code = `
fn foo():
    if (x > 10):
        y = 20`

    const tokens = tokenizer.tokenize(code)

    const indented = new IndentMaker()
      .markIndents(tokens)
      .removeUnwantedTokens()
      .fixColumnNumbers().tokens

    expect(indented).toEqual([
      { type: TokenType.Fn, value: "fn", column: 1, line: 2 },
      { type: TokenType.Identifier, value: "foo", column: 2, line: 2 },
      { type: TokenType.OpenParen, value: "(", column: 3, line: 2 },
      { type: TokenType.CloseParen, value: ")", column: 4, line: 2 },

      { type: TokenType.Indent, value: "indent", column: 1, line: 3 },
      { type: TokenType.If, value: "if", column: 2, line: 3 },
      { type: TokenType.OpenParen, value: "(", column: 3, line: 3 },
      { type: TokenType.Identifier, value: "x", column: 4, line: 3 },
      { type: TokenType.RelationalOperator, value: ">", column: 5, line: 3 },
      { type: TokenType.NumberLiteral, value: "10", column: 6, line: 3 },
      { type: TokenType.CloseParen, value: ")", column: 7, line: 3 },

      { type: TokenType.Indent, value: "indent", column: 1, line: 4 },
      { type: TokenType.Identifier, value: "y", column: 2, line: 4 },
      { type: TokenType.Equals, value: "=", column: 3, line: 4 },
      { type: TokenType.NumberLiteral, value: "20", column: 4, line: 4 },

      { type: TokenType.Dedent, value: "dedent", column: 1, line: 4 }, // auto-dedent, thats why the line number is 4, because the code block ends at line 4
      { type: TokenType.Dedent, value: "dedent", column: 1, line: 4 }, // auto-dedent
      { type: TokenType.EOF, value: "EOF", column: -1, line: 4 },
    ])
  })

  it("should tokenize nested indented code block with variable indentation", () => {
    const code = `
fn foo():
    if (x > 10):
        y = 20
    return y
foo()`

    const tokens = tokenizer.tokenize(code)

    const indented = new IndentMaker()
      .markIndents(tokens)
      .removeUnwantedTokens()
      .fixColumnNumbers().tokens

    expect(indented).toEqual([
      { type: TokenType.Fn, value: "fn", column: 1, line: 2 },
      { type: TokenType.Identifier, value: "foo", column: 2, line: 2 },
      { type: TokenType.OpenParen, value: "(", column: 3, line: 2 },
      { type: TokenType.CloseParen, value: ")", column: 4, line: 2 },

      { type: TokenType.Indent, value: "indent", column: 1, line: 3 },
      { type: TokenType.If, value: "if", column: 2, line: 3 },
      { type: TokenType.OpenParen, value: "(", column: 3, line: 3 },
      { type: TokenType.Identifier, value: "x", column: 4, line: 3 },
      { type: TokenType.RelationalOperator, value: ">", column: 5, line: 3 },
      { type: TokenType.NumberLiteral, value: "10", column: 6, line: 3 },
      { type: TokenType.CloseParen, value: ")", column: 7, line: 3 },

      { type: TokenType.Indent, value: "indent", column: 1, line: 4 },
      { type: TokenType.Identifier, value: "y", column: 2, line: 4 },
      { type: TokenType.Equals, value: "=", column: 3, line: 4 },
      { type: TokenType.NumberLiteral, value: "20", column: 4, line: 4 },

      { type: TokenType.Dedent, value: "dedent", column: 1, line: 5 },
      { type: TokenType.Return, value: "return", column: 2, line: 5 },
      { type: TokenType.Identifier, value: "y", column: 3, line: 5 },

      { type: TokenType.Dedent, value: "dedent", column: 1, line: 6 },
      { type: TokenType.Identifier, value: "foo", column: 2, line: 6 },
      { type: TokenType.OpenParen, value: "(", column: 3, line: 6 },
      { type: TokenType.CloseParen, value: ")", column: 4, line: 6 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 6 },
    ])
  })

  it("should tokenize indented code block with variable indentation", () => {
    const code = `
a:
    b:
        c
    d:
        e
        f
    g
h

k`

    const tokens = tokenizer.tokenize(code)

    const indented = new IndentMaker()
      .markIndents(tokens)
      .removeUnwantedTokens()
      .fixColumnNumbers().tokens

    expect(indented).toEqual([
      { type: TokenType.Identifier, value: "a", column: 1, line: 2 },
      { type: TokenType.Indent, value: "indent", column: 1, line: 3 },
      { type: TokenType.Identifier, value: "b", column: 2, line: 3 },

      { type: TokenType.Indent, value: "indent", column: 1, line: 4 },
      { type: TokenType.Identifier, value: "c", column: 2, line: 4 },

      { type: TokenType.Dedent, value: "dedent", column: 1, line: 5 },
      { type: TokenType.Identifier, value: "d", column: 2, line: 5 },

      { type: TokenType.Indent, value: "indent", column: 1, line: 6 },
      { type: TokenType.Identifier, value: "e", column: 2, line: 6 },

      { type: TokenType.Identifier, value: "f", column: 1, line: 7 },

      { type: TokenType.Dedent, value: "dedent", column: 1, line: 8 },
      { type: TokenType.Identifier, value: "g", column: 2, line: 8 },

      { type: TokenType.Dedent, value: "dedent", column: 1, line: 9 },
      { type: TokenType.Identifier, value: "h", column: 2, line: 9 },

      { type: TokenType.Identifier, value: "k", column: 1, line: 11 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 11 },
    ])
  })

  it("should not insert indent/dedent tokens when in regular code block .ie. in { and }", () => {
    const code = `
fn foo(){
    if (x > 10){
      y = 20
    }
    return y
}
foo()`

    const tokens = tokenizer.tokenize(code)

    const indented = new IndentMaker()
      .markIndents(tokens)
      .removeUnwantedTokens()
      .fixColumnNumbers().tokens

    expect(indented).toEqual([
      { type: TokenType.Fn, value: "fn", column: 1, line: 2 },
      { type: TokenType.Identifier, value: "foo", column: 2, line: 2 },
      { type: TokenType.OpenParen, value: "(", column: 3, line: 2 },
      { type: TokenType.CloseParen, value: ")", column: 4, line: 2 },
      { type: TokenType.OpenBrace, value: "{", column: 5, line: 2 },

      { type: TokenType.If, value: "if", column: 1, line: 3 },
      { type: TokenType.OpenParen, value: "(", column: 2, line: 3 },
      { type: TokenType.Identifier, value: "x", column: 3, line: 3 },
      { type: TokenType.RelationalOperator, value: ">", column: 4, line: 3 },
      { type: TokenType.NumberLiteral, value: "10", column: 5, line: 3 },
      { type: TokenType.CloseParen, value: ")", column: 6, line: 3 },
      { type: TokenType.OpenBrace, value: "{", column: 7, line: 3 },

      { type: TokenType.Identifier, value: "y", column: 1, line: 4 },
      { type: TokenType.Equals, value: "=", column: 2, line: 4 },
      { type: TokenType.NumberLiteral, value: "20", column: 3, line: 4 },

      { type: TokenType.CloseBrace, value: "}", column: 1, line: 5 },

      { type: TokenType.Return, value: "return", column: 1, line: 6 },
      { type: TokenType.Identifier, value: "y", column: 2, line: 6 },

      { type: TokenType.CloseBrace, value: "}", column: 1, line: 7 },

      { type: TokenType.Identifier, value: "foo", column: 1, line: 8 },
      { type: TokenType.OpenParen, value: "(", column: 2, line: 8 },
      { type: TokenType.CloseParen, value: ")", column: 3, line: 8 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 8 },
    ])
  })

  it("should indentify the indented block correctly", () => {
    const code = `
a
    b
        c
    d
e`

    const tokens = tokenizer.tokenize(code)

    const indented = new IndentMaker()
      .markIndents(tokens)
      .removeUnwantedTokens()
      .fixColumnNumbers().tokens

    expect(indented).toEqual([
      { type: TokenType.Identifier, value: "a", column: 1, line: 2 },
      { type: TokenType.Identifier, value: "b", column: 1, line: 3 },
      { type: TokenType.Identifier, value: "c", column: 1, line: 4 },
      { type: TokenType.Identifier, value: "d", column: 1, line: 5 },
      { type: TokenType.Identifier, value: "e", column: 1, line: 6 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 6 },
    ])
  })

  it("should throw error when indented block is inside non-indented block", () => {
    const code = `
fn foo(){
    if (x > 10):
      y = 20
    return y
}
foo()`

    const tokens = tokenizer.tokenize(code)

    expect(() => {
      new IndentMaker().markIndents(tokens).removeUnwantedTokens().fixColumnNumbers()
    }).toThrow("IndentationError: Invalid indentation at 5:2")
  })
})
