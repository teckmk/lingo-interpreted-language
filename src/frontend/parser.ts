import { Stmt, Expr, Program, Identifier, NumericLiteral, BinaryExpr } from "./ast"
import { TokenType, Token, tokenize } from "./lexer"

export default class Parser {
  private tokens: Token[] = []

  private not_eof(): boolean {
    return this.tokens[0].type !== TokenType.EOF
  }

  private at() {
    return this.tokens[0] as Token
  }

  private eat() {
    return this.tokens.shift() as Token
  }

  private expect(type: TokenType, err: any) {
    const prev = this.eat() as Token
    if (!prev || prev.type !== type) {
      console.log("Parser Error:\n", err, prev, "Expecting: ", type)
      process.exit(1)
    }
    return prev
  }

  // 1.
  private parse_stmt(): Stmt {
    return this.parse_expr()
  }

  // 2.
  private parse_expr(): Expr {
    return this.parse_additive_expr()
  }

  // 3.
  private parse_additive_expr(): Expr {
    let left = this.parse_multipicative_expr()

    while (this.at().value == "+" || this.at().value == "-") {
      const operator = this.eat().value
      const right = this.parse_multipicative_expr()
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr
    }

    return left
  }

  // 4.
  private parse_multipicative_expr(): Expr {
    let left = this.parse_primary_expr()

    while (this.at().value == "/" || this.at().value == "*" || this.at().value == "%") {
      const operator = this.eat().value
      const right = this.parse_primary_expr()
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr
    }

    return left
  }

  // 5.
  private parse_primary_expr(): Expr {
    const tk = this.at().type

    switch (tk) {
      case TokenType.Identifier:
        return { kind: "Identifier", symbol: this.eat().value } as Identifier
      case TokenType.Number:
        return { kind: "NumericLiteral", value: parseFloat(this.eat().value) } as NumericLiteral
      case TokenType.OpenParen:
        this.eat() // eat opening paren
        const value = this.parse_expr()
        this.expect(
          TokenType.CloseParen,
          "Unexpected token found in parenthesized expression. Expected closing paren"
        ) // eat closing paren
        return value
      default:
        console.error("Unexpected token found in parser:", this.at())
        process.exit(1)
    }
  }

  // 0
  public produceAST(sourceCode: string): Program {
    this.tokens = tokenize(sourceCode)
    console.log({ tokens: this.tokens })

    const program: Program = {
      kind: "Program",
      body: [],
    }

    while (this.not_eof()) {
      program.body.push(this.parse_stmt())
    }
    return program
  }
}
