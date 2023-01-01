import { Stmt, Expr, Program, Identifier, NumericLiteral } from "./ast"
import { TokenType, Token, tokenize } from "./lexer"

export default class Parser {
  private tokens: Token[] = []

  private not_eof(): boolean {
    return this.tokens[0].type !== TokenType.EOF
  }

  private at() {
    return this.tokens[0] as Token
  }

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

  private eat() {
    return this.tokens.shift() as Token
  }

  private parse_stmt(): Stmt {
    return this.parse_expr()
  }

  private parse_expr(): Expr {
    return this.parse_primary_expr()
  }

  private parse_primary_expr(): Expr {
    const tk = this.at().type

    switch (tk) {
      case TokenType.Identifier:
        return { kind: "Identifier", symbol: this.eat().value } as Identifier
      case TokenType.Number:
        return { kind: "NumericLiteral", value: parseFloat(this.eat().value) } as NumericLiteral
      default:
        console.error("Unexpected token found in parser:", this.at())
        process.exit(1)
    }
  }
}
