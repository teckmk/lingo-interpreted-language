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
  IfElseStatement,
  WhileStatement,
  StringLiteral,
  ArrayLiteral,
  Type,
  FunctionParam,
  ReturnStatement,
  MultiVarDeclaration,
  VarModifier,
} from "./2-ast"
import { TokenType, Token, tokenize } from "./1-lexer"
import { Placholder, emitTempFile } from "../helpers"

enum SearchGroup {
  TypeAnnotation,
}
export default class Parser {
  constructor(inputString?: string) {
    if (inputString) this.tokens = tokenize(inputString)
  }

  private tokens: Token[] = []

  private not_eof(): boolean {
    return this.tokens[0].type !== TokenType.EOF
  }

  private at(index = 0) {
    return this.tokens[index] as Token
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

  private expectOneOf(group: SearchGroup, types: TokenType[], err: any) {
    const prev = this.eat() as Token
    if (!prev || !types.includes(prev.type)) {
      console.log("Parser Error:\n", err, prev, "Expecting: ", group)
      process.exit(1)
    }
    return prev
  }

  // 1.
  private parse_stmt(): Stmt {
    switch (this.at().type) {
      case TokenType.Let:
      case TokenType.Const:
      case TokenType.Final:
        return this.parse_var_declaration()
      case TokenType.Fn:
        return this.parse_fn_declaration()
      case TokenType.If:
        return this.parse_if_statement()
      case TokenType.Return:
        return this.parse_return_statement()
      case TokenType.While:
        return this.parse_while_statement()
      default:
        return this.parse_expr()
    }
  }

  private parse_code_block(): Stmt[] {
    this.expect(TokenType.OpenBrace, "Expected { in code block")

    const block: Stmt[] = []

    while (this.at().type != TokenType.EOF && this.at().type != TokenType.CloseBrace)
      block.push(this.parse_stmt())

    this.expect(TokenType.CloseBrace, "Missing } in after code block")

    return block
  }

  private parse_fn_declaration(): Stmt {
    this.eat() // eat fn token
    const name = this.expect(
      TokenType.Identifier,
      "Expected function name following fn keyword"
    ).value

    const params = this.parse_params()

    const body = this.parse_code_block()

    const fn = {
      kind: "FunctionDeclaration",
      name,
      parameters: params,
      body,
    } as FunctionDeclaration

    return fn
  }

  private parse_return_statement() {
    this.eat() // eat return token

    const value = this.parse_expr()

    return { kind: "ReturnStatement", value } as ReturnStatement
  }

  private parse_condition(): Stmt {
    this.expect(TokenType.OpenParen, "Expected open paren following if keyword")

    const check = this.parse_expr() // parse condition

    this.expect(TokenType.CloseParen, "Expected closing paren in if statement after condition")

    return check
  }

  private parse_if_statement(): Stmt {
    this.eat() // eat if token

    const check = this.parse_condition()

    const body = this.parse_code_block() // parse if statement body

    const childChecks = []

    // parse 'else if' block, if there's any
    while (this.at().type == TokenType.Else && this.at(1).type == TokenType.If) {
      this.eat() // eat else token
      this.eat() // eat if token

      const childCheck = {
        kind: "IfElseStatement",
        check: this.parse_condition(),
        body: this.parse_code_block(),
      } as IfElseStatement

      childChecks.push(childCheck)
    }

    let elseBlock: Stmt[] = []

    // parse 'else' block if there's any
    if (this.at().type == TokenType.Else) {
      this.eat() // eat else token
      elseBlock = this.parse_code_block()
    }

    const ifStmt = {
      kind: "IfElseStatement",
      check,
      body,
      childChecks,
      else: elseBlock,
    } as IfElseStatement

    return ifStmt
  }

  private parse_while_statement(): Stmt {
    this.eat() // eat while token

    return {
      kind: "WhileStatement",
      check: this.parse_condition(),
      body: this.parse_code_block(),
    } as WhileStatement
  }

  private parse_type_anotation(): Type | undefined {
    // Check for types
    if (this.at().type == TokenType.Colon) {
      this.eat() // eat :
      const type = this.expectOneOf(
        SearchGroup.TypeAnnotation,
        [
          TokenType.ArrayType,
          TokenType.NumberType,
          TokenType.ObjectType,
          TokenType.StringType,
          TokenType.BooleanType,
          TokenType.DynamicType,
        ],
        "Expected valid type annotation following ':'"
      ).value as Type

      return type
    }

    return
  }

  private verify_must_assign(modifier: VarModifier) {
    if (modifier == "final") {
      throw new Error("Must assign a value to final expression.")
    } else if (modifier == "constant") {
      throw new Error("Must assign a value to constant expression.")
    }
  }

  private parse_var_declaration(): Stmt {
    const declaratorType = this.eat().type

    const isConstant = declaratorType == TokenType.Const
    const isFinal = declaratorType == TokenType.Final

    const modifier = isFinal ? "final" : isConstant ? "constant" : "variable"

    const identifier = this.expect(
      TokenType.Identifier,
      "Expected identifier name following variable declarator."
    ).value

    const type = this.parse_type_anotation()

    if (this.at().type == TokenType.Comma) {
      const shorthands: VarDeclaration[] = []

      // Get one before the comma
      shorthands.push({
        kind: "VarDeclaration",
        identifier,
        type,
        modifier: "variable",
      })

      // Get rest of them
      while (this.at().type == TokenType.Comma) {
        this.eat() // eat comma
        shorthands.push({
          kind: "VarDeclaration",
          identifier: this.expect(TokenType.Identifier, "Expected identifier after comma.").value,
          type: this.parse_type_anotation(),
          modifier: "variable",
        })
      }

      // Get values
      if (this.at().type == TokenType.Equals) {
        this.eat() // eat equals
        const values = [this.parse_expr()] // get first value

        // Check for multiple valuess
        while (this.at().type == TokenType.Comma) {
          this.eat() // eat comma
          values.push(this.parse_expr())
        }

        const numShortHands = shorthands.length
        const numValues = values.length
        const diff = numShortHands - numValues

        if (diff == 0) {
          for (let i = 0; i < numShortHands; i++) shorthands[i].value = values[i]
        } else if (numValues == 1) {
          for (let i = 0; i < numShortHands; i++) shorthands[i].value = values[0]
        } else {
          if (diff > numShortHands) {
            throw new Error(
              `Expected values for all ${numShortHands} variables in shorthand expression`
            )
          } else if (diff < numShortHands) {
            throw new Error(
              `Expected ${numShortHands} values but got ${numValues} in shorthand expression`
            )
          }
        }
      } else {
        // to make sure if constants and finals are being initialized
        this.verify_must_assign(modifier)
      }

      return {
        kind: "MultiVarDeclaration",
        variables: shorthands,
      } as MultiVarDeclaration
    }

    if (this.at().type != TokenType.Equals) {
      this.verify_must_assign(modifier)

      return {
        kind: "VarDeclaration",
        identifier,
        modifier: "variable",
        type,
      } as VarDeclaration
    }

    this.expect(TokenType.Equals, "Expected equals token following identifier in var declaration.")

    const declaration = {
      kind: "VarDeclaration",
      value: this.parse_expr(),
      identifier,
      modifier,
      type,
    } as VarDeclaration

    return declaration
  }

  // 2.
  private parse_expr(): Expr {
    return this.parse_assignment_expr()
  }

  private parse_assignment_expr(): Expr {
    const assigne = this.parse_assigne()

    if (this.at().type == TokenType.Equals) {
      this.eat()
      const value = this.parse_assignment_expr()
      return { value, assigne, kind: "AssignmentExpr" } as AssignmentExpr
    }

    return assigne
  }

  private parse_array_expr(): Expr {
    this.eat() // eat [ token

    const elements = []

    while (this.not_eof() && this.at().type != TokenType.CloseBracket) {
      const el = this.parse_expr()
      if (this.at().type == TokenType.Comma) this.eat() // eat comma
      elements.push(el)
    }

    this.expect(TokenType.CloseBracket, "Expected ] in array declaration")

    return { kind: "ArrayLiteral", elements } as ArrayLiteral
  }

  private parse_object_expr(): Expr {
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

  private parse_assigne(): Expr {
    if (this.at().type == TokenType.OpenBracket) {
      return this.parse_array_expr()
    } else if (this.at().type == TokenType.OpenBrace) {
      return this.parse_object_expr()
    }

    return this.parse_comparitive_expr()
  }

  private parse_comparitive_expr(): Expr {
    let left = this.parse_additive_expr()

    while (
      this.at().value == ">" ||
      this.at().value == ">=" ||
      this.at().value == "<" ||
      this.at().value == "<=" ||
      this.at().value == "==" ||
      this.at().value == "!=" ||
      this.at().value == "&&" ||
      this.at().value == "||" ||
      this.at().value == "and" ||
      this.at().value == "or"
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

  private parse_params(): Expr[] {
    this.expect(TokenType.OpenParen, "Expected open paren")
    const params = this.at().type == TokenType.CloseParen ? [] : this.parse_params_list()

    this.expect(TokenType.CloseParen, "Missing closing paren")

    return params
  }

  private parse_params_list(): Expr[] {
    const params = [this.parse_parameter()]

    while (this.at().type == TokenType.Comma && this.eat()) params.push(this.parse_parameter())

    return params
  }

  private parse_parameter(): Expr {
    const ident = this.expect(TokenType.Identifier, "Expected identifier in function parameter")

    const type = this.parse_type_anotation()

    // check for default values
    if (this.at().type == TokenType.Equals) {
      this.eat() // eat = token

      const defaultVal = this.parse_expr()

      return {
        kind: "FunctionParam",
        name: ident.value,
        type,
        default: defaultVal,
      } as FunctionParam
    }

    return { kind: "FunctionParam", name: ident.value, type } as FunctionParam
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
          throw new Error("Dot operator can only be used on identifier")
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

  private parse_string_literal() {
    const inputString = this.eat().value
    const expressions: { [key: string]: Expr } = {}

    let outputString = inputString

    // handle expressions
    if (inputString.includes("${")) {
      const regex = /\${(.+?)}/g
      const matches = inputString.match(regex) || []

      if (matches.length) {
        let i = 0
        const results = matches.map((match) => match.replace(regex, "$1")) // remove ${ } from expressions

        // replace expressions with placeholders
        outputString = inputString.replace(regex, () => Placholder.expr(i++))

        // parse the expressions
        results.forEach((exprStr, i) => {
          expressions[Placholder.expr(i)] = new Parser(exprStr).parse_expr()
        })
      }
    }

    // handle identifiers
    const identRegex = /\$([a-zA-Z_]\w*)/g
    const identifiers = outputString.match(identRegex) || []

    return {
      kind: "StringLiteral",
      value: outputString,
      identifiers,
      expressions,
    } as StringLiteral
  }

  private parse_paren_expression() {
    this.eat() // eat opening paren
    const value = this.parse_expr()
    this.expect(
      TokenType.CloseParen,
      "Unexpected token found in parenthesized expression. Expected closing paren"
    ) // eat closing paren
    return value
  }

  // 5.
  private parse_primary_expr(): Expr {
    const tk = this.at().type

    switch (tk) {
      case TokenType.Identifier:
        return { kind: "Identifier", symbol: this.eat().value } as Identifier
      case TokenType.Number:
        return { kind: "NumericLiteral", value: parseFloat(this.eat().value) } as NumericLiteral
      case TokenType.String:
        return this.parse_string_literal() as StringLiteral
      case TokenType.OpenParen:
        return this.parse_paren_expression()
      default:
        console.error("Unexpected token found in parser:", this.at())
        process.exit(1)
    }
  }

  // 0
  public produceAST(sourceCode: string): Program {
    this.tokens = tokenize(sourceCode)

    emitTempFile("tokens.json", JSON.stringify(this.tokens))

    const program: Program = {
      kind: "Program",
      body: [],
    }

    while (this.not_eof()) program.body.push(this.parse_stmt())

    return program
  }
}
