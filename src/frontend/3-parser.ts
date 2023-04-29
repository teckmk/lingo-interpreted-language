import {
  Stmt,
  Expr,
  Program,
  Identifier,
  NumericLiteral,
  BinaryExpr,
  VarDeclaration,
  AssignmentExpr,
  Property,
  ObjectLiteral,
  CallExpr,
  MemberExpr,
  FunctionDeclaration,
} from "./2-ast"
import { TokenType, Token, tokenize } from "./1-lexer"

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
    switch (this.at().type) {
      case TokenType.Let:
      case TokenType.Const:
        return this.parse_var_declaration()
      case TokenType.Fn:
        return this.parse_fn_declaration()
      default:
        return this.parse_expr()
    }
  }

  parse_fn_declaration(): Stmt {
    this.eat() // eat fn token
    const name = this.expect(
      TokenType.Identifier,
      "Expected function name following fn keyword"
    ).value

    const args = this.parse_args()

    // To make sure args are strings
    const params: string[] = []
    for (const arg of args) {
      if (arg.kind != "Identifier") throw "Expected function parameter to be type of string"

      params.push((arg as Identifier).symbol)
    }

    this.expect(TokenType.OpenBrace, "Expected function body in function declaration")

    const body: Stmt[] = []

    while (this.at().type != TokenType.EOF && this.at().type != TokenType.CloseBrace)
      body.push(this.parse_stmt())

    this.expect(TokenType.CloseBrace, "Missing } in function body")

    const fn = {
      kind: "FunctionDeclaration",
      name,
      parameters: params,
      body,
    } as FunctionDeclaration

    return fn
  }

  parse_var_declaration(): Stmt {
    const isConstant = this.eat().type == TokenType.Const

    const identifier = this.expect(
      TokenType.Identifier,
      "Expected identifier name following let | const keywords."
    ).value

    if (this.at().type == TokenType.Semicolon) {
      this.eat() // expect semicolon 🤔
      if (isConstant) {
        console.log("Must assign value to constant expression. No value provided.")
        process.exit()
      }

      return { kind: "VarDeclaration", identifier, constant: false } as VarDeclaration
    }

    this.expect(TokenType.Equals, "Expected equals token following identifier in var declaration.")

    const declaration = {
      kind: "VarDeclaration",
      value: this.parse_expr(),
      identifier,
      constant: isConstant,
    } as VarDeclaration

    this.expect(TokenType.Semicolon, "Variable declaration statement must end with semicolon")

    return declaration
  }

  // 2.
  private parse_expr(): Expr {
    return this.parse_assignment_expr()
  }

  private parse_assignment_expr(): Expr {
    const left = this.parse_object_expr()

    if (this.at().type == TokenType.Equals) {
      this.eat()
      const value = this.parse_assignment_expr()
      return { value, assigne: left, kind: "AssignmentExpr" } as AssignmentExpr
    }

    return left
  }

  private parse_object_expr(): Expr {
    if (this.at().type != TokenType.OpenBrace) {
      return this.parse_comparitive_expr()
    }

    this.eat() // eat opening brace
    const props = new Array<Property>()

    while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
      const key = this.expect(TokenType.Identifier, "Object literal key expected").value

      // handling shorthands {key,}
      if (this.at().type == TokenType.Comma) {
        this.eat() // eat comma
        props.push({ kind: "Property", key })
        continue
      }
      // handling shorthands {key}
      else if (this.at().type == TokenType.CloseBrace) {
        props.push({ kind: "Property", key })
        continue
      }

      // handling {key: value}
      this.expect(TokenType.Colon, "Missing colon following identifier in object")
      const value = this.parse_expr()

      props.push({ kind: "Property", key, value })

      if (this.at().type != TokenType.CloseBrace) {
        this.expect(TokenType.Comma, "Expected comma or closing bracket")
      }
    }

    this.expect(TokenType.CloseBrace, "Object literal missing closing brace.")
    return { kind: "ObjectLiteral", properties: props } as ObjectLiteral
  }

  private parse_comparitive_expr(): Expr {
    let left = this.parse_additive_expr()

    while (
      this.at().value == ">" ||
      this.at().value == ">=" ||
      this.at().value == "<" ||
      this.at().value == "<=" ||
      this.at().value == "==" ||
      this.at().value == "!="
    ) {
      const operator = this.eat().value
      const right = this.parse_additive_expr()
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr
    }

    return left
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
    let left = this.parse_call_member_expr()

    while (this.at().value == "/" || this.at().value == "*" || this.at().value == "%") {
      const operator = this.eat().value
      const right = this.parse_call_member_expr()
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr
    }

    return left
  }

  private parse_call_member_expr(): Expr {
    const member = this.parse_member_expr()

    if (this.at().type == TokenType.OpenParen) return this.parse_call_expr(member)

    return member
  }

  private parse_call_expr(caller: Expr): Expr {
    let call_expr: Expr = {
      kind: "CallExpr",
      caller,
      args: this.parse_args(),
    } as CallExpr

    // to handle foo.x()()
    if (this.at().type == TokenType.OpenParen) call_expr = this.parse_call_expr(call_expr)

    return call_expr
  }

  private parse_args(): Expr[] {
    this.expect(TokenType.OpenParen, "Expected open paren")
    const args = this.at().type == TokenType.CloseParen ? [] : this.parse_args_list()

    this.expect(TokenType.CloseParen, "Missing closing paren")

    return args
  }

  private parse_args_list(): Expr[] {
    // parsing assignment expr, so that we can first assign, then pass
    // i.e foo(x=5, bar="heavy")
    const args = [this.parse_assignment_expr()]

    while (this.at().type == TokenType.Comma && this.eat()) args.push(this.parse_assignment_expr())

    return args
  }

  private parse_member_expr(): Expr {
    let object = this.parse_primary_expr()

    while (this.at().type == TokenType.Dot || this.at().type == TokenType.OpenBracket) {
      const operator = this.eat()
      let property: Expr
      let computed: boolean

      // static props
      if (operator.type == TokenType.Dot) {
        computed = false
        property = this.parse_primary_expr()

        if (property.kind != "Identifier")
          throw new Error("Cannot use dot operator on token that is not identifier")
      } else {
        // computed props
        computed = true
        property = this.parse_expr()
        this.expect(TokenType.CloseBracket, "Missing closing bracket")
      }

      object = {
        kind: "MemberExpr",
        object,
        property,
        computed,
      } as MemberExpr
    }

    return object
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
    console.log(this.tokens)

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
