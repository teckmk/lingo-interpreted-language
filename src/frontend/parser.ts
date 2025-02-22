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
  ForStatement,
  ForInStatement,
  ForRangeStatement,
  BreakStatement,
  ContinueStatement,
} from "./ast"
import { Placholder } from "../helpers"
import { TokenType, specs } from "./lexer/specs"
import { Token, tokenize } from "./lexer/tokenizer"

enum TypesGroup {
  TypeAnnotation,
  BlockOpening,
  BlockClosing,
}
export default class Parser {
  private loopStack: string[] = [] // Stack of loop IDs
  private labelMap: Map<string, string> = new Map() // Label to loop ID mapping
  constructor(tokens?: Token[]) {
    if (tokens) {
      this.tokens = tokens
    }
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

  private expectOneOf(label: TypesGroup, types: TokenType[], err: any) {
    const token = this.eat() as Token
    if (!token || !types.includes(token.type)) {
      console.log("Parser Error:\n", err, token, "Expecting: ", label)
      process.exit(1)
    }
    return token
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
      case TokenType.For:
        return this.parse_for_statement()
      case TokenType.Break:
        return this.parse_break_statement()
      case TokenType.Continue:
        return this.parse_continue_statement()
      default:
        return this.parse_expr()
    }
  }

  private parse_code_block(): Stmt[] {
    const indented = this.at().type === TokenType.Colon

    if (indented) {
      this.eat() // eat colon
      this.expect(TokenType.Indent, "Expected indented code block")
    } else {
      this.expect(TokenType.OpenBrace, "Expected opening brace for code block")
    }

    const block: Stmt[] = []

    const blockEndingTypes = [TokenType.CloseBrace, TokenType.Dedent, TokenType.EOF]

    while (!blockEndingTypes.includes(this.at().type)) block.push(this.parse_stmt())

    if (indented) {
      this.expect(TokenType.Dedent, "Unexpected ending of indented code block")
    } else {
      this.expect(TokenType.CloseBrace, "Unexpected ending of code block, expected '}'")
    }

    return block
  }

  private parse_return_type(): Type | Type[] | undefined {
    let returnType = undefined
    if (this.at().type == TokenType.Arrow) {
      this.eat() // eat arrow
      returnType = this.parse_type_anotation()
    }

    while (this.at().type == TokenType.Comma) {
      this.eat() // eat comma
      if (!returnType) returnType = []
      else if (!Array.isArray(returnType)) returnType = [returnType]

      returnType.push(this.parse_type_anotation())
    }

    return returnType
  }

  private parse_fn_declaration(): Stmt {
    this.eat() // eat fn token
    const name = this.expect(
      TokenType.Identifier,
      "Expected function name following fn keyword"
    ).value

    const params = this.parse_params()

    const returnType = this.parse_return_type()

    const body = this.parse_code_block()

    const fn = {
      kind: "FunctionDeclaration",
      name,
      parameters: params,
      body,
      returnType,
    } as FunctionDeclaration

    return fn
  }

  private parse_return_statement() {
    this.eat() // eat return token

    let value: Expr | Expr[] = this.parse_expr()

    while (this.at().type == TokenType.Comma) {
      this.eat() // eat comma
      if (!Array.isArray(value)) value = [value]
      value.push(this.parse_expr())
    }

    return { kind: "ReturnStatement", value } as ReturnStatement
  }

  private parse_condition(): Stmt {
    // handle optional parenthesis
    const isOpeningParen = this.at().type == TokenType.OpenParen
    if (isOpeningParen) this.eat() // eat open paren

    const condition = this.parse_expr() // parse condition

    if (isOpeningParen) this.expect(TokenType.CloseParen, "Expected closing paren for condition")

    return condition
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
        condition: this.parse_condition(),
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
      condition: check,
      body,
      branches: childChecks,
      else: elseBlock,
    } as IfElseStatement

    return ifStmt
  }

  private parse_label(): { label?: string; loopId: string } {
    const loopId = `loop_${this.loopStack.length + 1}`
    this.loopStack.push(loopId)

    if (this.at().type == TokenType.Label) {
      this.eat() // eat label token

      const label = this.expect(
        TokenType.Identifier,
        "Expected identifier after label keyword"
      ).value

      this.labelMap.set(label, loopId)
      return { label, loopId }
    }
    return { loopId }
  }

  private decrement_loop_stack(label?: string) {
    if (label) this.labelMap.delete(label)
    this.loopStack.pop()
  }

  // 1 infinite loop
  // 2 for in loop (for loop with range)
  // 3 for loop with initializer, condition and update
  // 4 for loop with condition (while loop)
  /* Examples:
      for {} -- for label outer {}
      for i < 10 {} -- for i < 10 label outer {}
      for var i = 0; i < 10; i = i + 1 {} -- for var i = 0; i < 10; i = i + 1 label outer {}
      for i, v in range 10 {} -- for i, v in range 10 label outer {}
    */

  private parse_for_statement(): ForStatement | ForInStatement | ForRangeStatement {
    this.eat() // eat for token

    // 1. Infinite loop
    if (this.at().type == TokenType.OpenBrace || this.at().type == TokenType.Label) {
      const { label, loopId } = this.parse_label()
      const body = this.parse_code_block()

      this.decrement_loop_stack(label)

      return {
        kind: "ForStatement",
        loopId,
        label,
        body,
      }
    }

    // Eat optional open paren
    const hasOpenParen = this.at().type == TokenType.OpenParen
    if (hasOpenParen) this.eat()

    // 2. For in loop
    if (
      this.at().type == TokenType.Let &&
      this.at(1).type == TokenType.Identifier &&
      this.at(2).type == TokenType.Comma
    ) {
      return this.parse_for_in_statement(hasOpenParen)
    }

    // 3. For loop with initializer, condition and update
    if (this.at().type == TokenType.Let) {
      const initializer = this.parse_var_declaration()

      this.expect(TokenType.SemiColon, "Expected semicolon after for initializer")

      const condition = this.parse_expr()

      this.expect(TokenType.SemiColon, "Expected semicolon after for condition")

      const update = this.parse_expr()

      if (hasOpenParen) {
        this.expect(TokenType.CloseParen, "Expected closing paren after opening paren")
      }

      const { label, loopId } = this.parse_label()

      const body = this.parse_code_block()

      this.decrement_loop_stack(label)

      return {
        kind: "ForStatement",
        loopId,
        label,
        initializer,
        condition,
        update,
        body,
      }
    }

    // 4. For loop with condition (while loop)
    const condition = this.parse_expr()

    if (hasOpenParen) {
      this.expect(TokenType.CloseParen, "Expected closing paren after opening paren")
    }

    const { label, loopId } = this.parse_label()

    const body = this.parse_code_block()

    this.decrement_loop_stack(label)

    return {
      kind: "ForStatement",
      loopId,
      label,
      condition,
      body,
    }
  }

  private parse_for_in_statement(hasOpenParen: boolean): ForInStatement | ForRangeStatement {
    this.eat() // eat let token

    const indexIdent = this.expect(TokenType.Identifier, "Expected identifier in for loop").value

    this.expect(TokenType.Comma, "Expected comma after first identifier in for loop")

    const valIdent = this.expect(TokenType.Identifier, "Expected identifier in for loop").value

    this.expect(TokenType.In, "Expected 'in' keyword in for loop")

    if (this.at().type == TokenType.Range) {
      return this.parse_for_range_statement(valIdent, indexIdent)
    }

    const iterable = this.parse_expr()

    // Eat optional close paren
    if (hasOpenParen) {
      this.expect(TokenType.CloseParen, "Expected closing paren after opening paren")
    }

    const { label, loopId } = this.parse_label()

    const body = this.parse_code_block()

    this.decrement_loop_stack(label)
    return {
      kind: "ForInStatement",
      loopId,
      label,
      valueIdentifier: valIdent,
      indexIdentifier: indexIdent,
      iterable,
      body: body,
    }
  }

  private parse_for_range_statement(valIdent: string, indexIdent: string): ForRangeStatement {
    this.eat() // eat range token

    const start = this.parse_expr()
    let end: Expr | undefined
    let step: Expr | undefined

    const inclusive = this.at().type == TokenType.Through
    if (this.at().type == TokenType.To || inclusive) {
      this.eat() // eat to or through token

      end = this.parse_expr()

      if (this.at().type == TokenType.Step) {
        this.eat() // eat step token
        step = this.parse_expr()
      }
    }

    const { label, loopId } = this.parse_label()

    const body = this.parse_code_block()

    this.decrement_loop_stack(label)

    return {
      kind: "ForRangeStatement",
      loopId,
      label,
      valueIdentifier: valIdent,
      indexIdentifier: indexIdent,
      inclusive,
      start,
      end,
      step,
      body,
    }
  }

  private parse_break_statement(): BreakStatement {
    this.eat() // eat break token

    if (this.loopStack.length == 0) {
      throw new Error("Unexpected break statement outside of loop.")
    }

    let loopId = this.loopStack[this.loopStack.length - 1]

    if (this.at().type == TokenType.Identifier) {
      const label = this.eat().value

      if (!this.labelMap.has(label)) {
        throw new Error(`Invalid label '${label}' for break statement.`)
      }

      loopId = this.labelMap.get(label) || loopId
    }

    return { kind: "BreakStatement", loopId }
  }

  private parse_continue_statement(): ContinueStatement {
    this.eat() // eat continue token

    if (this.loopStack.length == 0) {
      throw new Error("Unexpected continue statement outside of loop.")
    }

    let loopId = this.loopStack[this.loopStack.length - 1]

    if (this.at().type == TokenType.Identifier) {
      const label = this.eat().value

      if (!this.labelMap.has(label)) {
        throw new Error(`Invalid label '${label}' for skip statement.`)
      }

      loopId = this.labelMap.get(label) || loopId
    }

    return { kind: "ContinueStatement", loopId }
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
    const type = this.expectOneOf(
      TypesGroup.TypeAnnotation,
      [TokenType.NumberType, TokenType.StringType, TokenType.BooleanType, TokenType.DynamicType],
      "Expected valid type annotation following ':'"
    ).value as Type

    return type
  }

  private verify_must_assign(modifier: VarModifier) {
    if (modifier == "final") {
      throw new Error("Must assign a value to final expression.")
    } else if (modifier == "constant") {
      throw new Error("Must assign a value to constant expression.")
    }
  }

  // cases:
  // var a
  // var a: number
  // var a = 10
  // var a: number = 10
  // var a, b
  // var a, b = 10
  // var a = 10, b = 20
  // var a: number, b: number
  // var a: number, b: number = 10
  // var a: number = 10, b: number = 20
  private parse_var_declaration(): Stmt {
    const declaratorType = this.eat().type

    const isConstant = declaratorType == TokenType.Const
    const isFinal = declaratorType == TokenType.Final

    const modifier = isFinal ? "final" : isConstant ? "constant" : "variable"

    const identifier = this.expect(
      TokenType.Identifier,
      "Expected identifier name following variable declarator."
    ).value

    let type = undefined
    if (this.at().type == TokenType.Colon) {
      this.eat() // eat colon
      type = this.parse_type_anotation()
    }

    // parse shorthands like:
    // var a, b
    // var a, b = 10
    // var a: number, b: number
    // var a: number, b: number = 10
    if (this.at().type == TokenType.Comma) {
      const shorthands: VarDeclaration[] = []

      // Get one before the comma
      shorthands.push({
        kind: "VarDeclaration",
        identifier,
        type,
        modifier,
      })

      // Get rest of them
      while (this.at().type == TokenType.Comma) {
        this.eat() // eat comma

        const identifier = this.expect(
          TokenType.Identifier,
          "Expected identifier after comma."
        ).value

        let type = undefined
        if (this.at().type == TokenType.Colon) {
          this.eat() // eat colon
          type = this.parse_type_anotation()
        }

        shorthands.push({
          kind: "VarDeclaration",
          identifier,
          type,
          modifier,
        })
      }

      // Get values
      if (this.at().type == TokenType.Equals) {
        this.eat() // eat equals

        // Assign value to shorthands
        const value = this.parse_expr()
        for (let i = 0; i < shorthands.length; i++) {
          shorthands[i].value = value
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

    const shorthands: VarDeclaration[] = []

    // for case like
    // const a: number = 10
    // const a = 10, b = 20
    // const a: number = 10, b: number = 20

    // parse first declaration
    if (this.at().type == TokenType.Equals) {
      this.eat() // eat equals
      shorthands.push({
        kind: "VarDeclaration",
        identifier,
        modifier,
        type,
        value: this.parse_expr(),
      } as VarDeclaration)
    }

    // parse rest of them
    if (this.at().type == TokenType.Comma) {
      while (this.at().type == TokenType.Comma) {
        this.eat() // eat comma

        const identifier = this.expect(
          TokenType.Identifier,
          "Expected identifier after comma."
        ).value

        let type = undefined
        if (this.at().type == TokenType.Colon) {
          this.eat() // eat colon
          type = this.parse_type_anotation()
        }

        const dec = {
          kind: "VarDeclaration",
          identifier,
          type,
          modifier,
        } as VarDeclaration

        this.expect(
          TokenType.Equals,
          "Expected equals token following identifier in var declaration."
        )

        dec.value = this.parse_expr()

        shorthands.push(dec)
      }

      return {
        kind: "MultiVarDeclaration",
        variables: shorthands,
      } as MultiVarDeclaration
    }

    if (shorthands.length == 1) return shorthands[0]

    // make sure if constants and finals are being initialized
    if (this.at().type != TokenType.Equals) {
      this.verify_must_assign(modifier)
    }

    // if there's only one declaration, without a value
    return {
      kind: "VarDeclaration",
      identifier,
      modifier,
      type,
    } as VarDeclaration
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
      this.at().type == TokenType.RelationalOperator ||
      this.at().type == TokenType.EqualityOperator ||
      this.at().type == TokenType.LogicGate
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

    while (this.at().type == TokenType.AdditiveOperator) {
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

    while (this.at().type == TokenType.MulitipicativeOperator) {
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

    let type = undefined
    if (this.at().type == TokenType.Colon) {
      this.eat() // eat colon
      type = this.parse_type_anotation()
    }

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
        const results = matches.map((match: string) => match.replace(regex, "$1")) // remove ${ } from expressions

        // replace expressions with placeholders
        outputString = inputString.replace(regex, () => Placholder.expr(i++))

        // parse the expressions
        results.forEach((exprStr: string, i: number) => {
          const tokens = tokenize(specs, "string_expr", exprStr)
          expressions[Placholder.expr(i)] = new Parser(tokens).parse_expr()
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
      case TokenType.NumberLiteral:
        return { kind: "NumericLiteral", value: parseFloat(this.eat().value) } as NumericLiteral
      case TokenType.StringLiteral:
        return this.parse_string_literal() as StringLiteral
      case TokenType.OpenParen:
        return this.parse_paren_expression()
      default:
        console.error("Unexpected token found in parser:", this.at())
        process.exit(1)
    }
  }

  // 0
  public produceAST(tokens?: Token[]): Program {
    if (tokens) this.tokens = tokens
    const program: Program = {
      kind: "Program",
      body: [],
    }

    if (!this.tokens) throw new Error("Initialization Error: Parser is not initialized with tokens")

    while (this.not_eof()) program.body.push(this.parse_stmt())

    return program
  }
}
