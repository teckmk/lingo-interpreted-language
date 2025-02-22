import { specs, TokenType } from "../../frontend/lexer/specs"
import { Tokenizer } from "../../frontend/lexer/tokenizer"

describe("Tokenizer - Operators", () => {
  it("should tokenize +", () => {
    const code = "+"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.AdditiveOperator, value: "+", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize -", () => {
    const code = "-"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.AdditiveOperator, value: "-", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize *", () => {
    const code = "*"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.MulitipicativeOperator, value: "*", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize /", () => {
    const code = "/"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.MulitipicativeOperator, value: "/", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize =", () => {
    const code = "="
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Equals, value: "=", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize !", () => {
    const code = "!"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Exclamation, value: "!", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize !=", () => {
    const code = "!="
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.EqualityOperator, value: "!=", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize ==", () => {
    const code = "=="
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.EqualityOperator, value: "==", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize <", () => {
    const code = "<"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.RelationalOperator, value: "<", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize <=", () => {
    const code = "<="
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.RelationalOperator, value: "<=", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize >", () => {
    const code = ">"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.RelationalOperator, value: ">", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize >=", () => {
    const code = ">="
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.RelationalOperator, value: ">=", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize &&", () => {
    const code = "&&"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.LogicGate, value: "&&", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize ||", () => {
    const code = "||"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.LogicGate, value: "||", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize 'and'", () => {
    const code = "and"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.LogicGate, value: "and", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize 'or'", () => {
    const code = "or"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.LogicGate, value: "or", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize .", () => {
    const code = "."
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Dot, value: ".", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize ,", () => {
    const code = ","
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Comma, value: ",", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize :", () => {
    const code = ":"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.Colon, value: ":", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize ++", () => {
    const code = "++"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.UpdateOperator, value: "++", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize --", () => {
    const code = "--"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.UpdateOperator, value: "--", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize **", () => {
    const code = "**"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.ExponentOperator, value: "**", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })

  it("should tokenize %", () => {
    const code = "%"
    const tokens = new Tokenizer(specs, "test").tokenize(code)

    expect(tokens).toEqual([
      { type: TokenType.MulitipicativeOperator, value: "%", column: 1, line: 1 },
      { type: TokenType.EOF, value: "EOF", column: -1, line: 1 },
    ])
  })
})
