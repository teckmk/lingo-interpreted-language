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
  FunctionParam,
  ReturnStatement,
  MultiVarDeclaration,
  VarModifier,
  ForStatement,
  ForInStatement,
  ForRangeStatement,
  BreakStatement,
  ContinueStatement,
  LeafNode,
  TypeDeclaration,
  StructMember,
  TypeNode,
  GenericType,
  StructType,
  TypeParameter,
  ContractType,
  FunctionType,
  GetterType,
  ContractFulfillment,
  SelfKeyword,
} from "./ast"
import { Placholder } from "../helpers"
import { TokenType } from "./lexer/specs"
import { Token, tokenize } from "./lexer/tokenizer"

enum TypesGroup {
  TypeAnnotation,
  BlockOpening,
  BlockClosing,
}

export function get_leaf(token: Token) {
  return {
    value: token.value,
    position: token.position,
  }
}

export function is_expression_start(tokenType: TokenType): boolean {
  const expressionStartTokens = [
    TokenType.Identifier,
    TokenType.NumberLiteral,
    TokenType.StringLiteral,
    TokenType.OpenParen,
    TokenType.CloseParen,
    TokenType.OpenBracket,
    TokenType.CloseBracket,
    TokenType.Exclamation,
    // Add other tokens that can start expressions
  ]
  return expressionStartTokens.includes(tokenType)
}

function isLessThan(token: Token) {
  return token.type == TokenType.RelationalOperator && token.value == "<"
}

function isGreaterThan(token: Token) {
  return token.type == TokenType.RelationalOperator && token.value == ">"
}

export default class Parser {
  private loopStack: string[] = [] // Stack of loop IDs
  private labelMap: Map<string, string> = new Map() // Label to loop ID mapping
  private insideContractFulfillment = false
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
      throw new Error(`Parser Error:", ${err}, got: ${prev.type}, "Expecting: ", ${type}`)
    }
    return prev
  }

  private expectOneOf(label: TypesGroup, types: TokenType[], err: any) {
    const token = this.eat() as Token
    if (!token || !types.includes(token.type)) {
      throw new Error(`Parser Error:", ${err},got: ${token.type}, "Expecting: ", ${label}`)
    }
    return token
  }

  private expect_less_than() {
    const token = this.eat()
    if (!isLessThan(token)) {
      throw new Error("Expected '<' for generic type arguments")
    }
  }

  private expect_greater_than() {
    const token = this.eat()
    if (!isGreaterThan(token)) {
      throw new Error("Expected '>' to close generic type arguments")
    }
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
      case TokenType.Type:
        return this.parse_type_declaration()
      case TokenType.FulFill:
        return this.parse_contract_fulfillment()
      default:
        return this.parse_expr()
    }
  }

  private parse_type_declaration(): TypeDeclaration {
    this.eat() // eat type token
    if (this.at().type != TokenType.TypeIdentifier) {
      throw new Error(`Type name '${this.at().value}' must start with a capital letter.`)
    }
    const name = this.parse_type_name()
    this.expect(TokenType.Equals, "Expected '=' following type name")
    const type = this.parse_type()
    return { kind: "TypeDeclaration", name, type }
  }

  private parse_type_name(): TypeNode {
    // Check if it's a named type (could be a struct, alias, or generic)
    const typeName = this.expect(TokenType.TypeIdentifier, "Expected type name")

    // Check if it's a generic type with parameters
    if (isLessThan(this.at())) {
      return this.parse_generic_type(typeName)
    }

    // Regular named type
    return {
      kind: "AliasType",
      name: get_leaf(typeName),
      actualType: {
        kind: "PrimitiveType",
        name: get_leaf(typeName),
      },
    }
  }

  private parse_type_anotation(typeSeparator: TokenType = TokenType.Colon): TypeNode | undefined {
    // Skip the colon/arrow that typically precedes a type annotation
    if (this.at().type === typeSeparator) {
      this.eat()
      return this.parse_type()
    }

    return undefined // No type annotation present
  }

  private parse_type(): TypeNode {
    const token = this.at()
    if (token.type == TokenType.StructType) {
      return this.parse_struct_type()
    }

    if (token.type == TokenType.ContractType) {
      return this.parse_contract_type()
    }

    // Start by parsing the first type in a potential union
    let type = this.parse_single_type()

    // Check if it's a union type
    while (this.at().type === TokenType.PipeOperator) {
      this.eat() // consume '|'
      const right = this.parse_single_type()

      // If we already have a union, add to it
      if (type.kind === "UnionType") {
        type.types.push(right)
      } else {
        // Create a new union type
        type = {
          kind: "UnionType",
          types: [type, right],
        }
      }
    }

    return type
  }

  private parse_struct_type(): StructType {
    this.eat() // eat struct token
    const members = new Array<StructMember>()

    this.expect(TokenType.OpenBrace, "Struct literal missing opening brace.")

    while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
      const name = this.expect(TokenType.Identifier, "Struct literal key expected")
      this.expect(TokenType.Colon, `Missing colon following '${name.value}' in struct`)
      const type = this.parse_type()

      if (!type) {
        throw new Error("Struct member must have a type")
      }

      let optional = false
      if (this.at().type == TokenType.QuestionMark) {
        this.eat()
        optional = true
      }

      members.push({ kind: "StructMember", name: get_leaf(name), type, optional })
    }

    this.expect(TokenType.CloseBrace, "Struct literal missing closing brace.")

    return { kind: "StructType", members }
  }

  private parse_contract_body(): Array<FunctionType | GetterType> {
    const members = new Array<FunctionType | GetterType>()

    this.parse_block(() => {
      switch (this.at().type) {
        case TokenType.Fn:
          members.push(this.parse_fn_definition())
          break
        case TokenType.Get:
          members.push(this.parse_getter_definition())
          break
        default:
          throw new Error("Contract member must be a function or getter")
      }
    })

    return members
  }

  private parse_contract_type(): ContractType {
    this.eat() // eat contract token
    const members = this.parse_contract_body()
    return { kind: "ContractType", members }
  }

  private parse_fn_definition(): FunctionType {
    this.eat() // eat fn token
    const name = this.expect(TokenType.Identifier, "Expected function name following fn keyword")

    let typeParameters: TypeParameter[] | undefined = undefined
    if (isLessThan(this.at())) {
      typeParameters = this.parse_generic_type(name).parameters
    }

    const params: FunctionParam[] = this.parse_params()

    if (this.at().type != TokenType.Arrow) {
      throw new Error("Expected '->' after function parameters")
    }

    const returnType = this.parse_return_type()

    if (!returnType) {
      throw new Error("Function definition must have a return type")
    }

    let body: Stmt[] | undefined = undefined
    if (this.insideContractFulfillment) {
      body = this.parse_code_block()
    }

    return {
      kind: "FunctionType",
      name: get_leaf(name),
      parameters: params,
      typeParameters,
      returnType,
      body,
    }
  }

  private parse_getter_definition(): GetterType {
    this.eat() // eat get token
    const name = this.expect(TokenType.Identifier, "Expected getter name following get keyword")

    let params: FunctionParam[] | undefined = undefined
    if (this.insideContractFulfillment) {
      params = this.parse_params()
    }

    if (this.at().type != TokenType.Arrow) {
      throw new Error("Expected '->' after function parameters")
    }

    const returnType = this.parse_return_type()

    if (!returnType) {
      throw new Error("Getter definition must have a return type")
    }

    let body: Stmt[] | undefined = undefined
    if (this.insideContractFulfillment) {
      body = this.parse_code_block()
    }

    return {
      kind: "GetterType",
      name: get_leaf(name),
      returnType,
      parameters: params,
      body,
    }
  }

  private parse_contract_fulfillment(): ContractFulfillment {
    this.eat() // eat fulfill token

    let contractName: LeafNode<string> | undefined = undefined
    let structName: Token | undefined = undefined
    let typeArgs = undefined

    // contract name may not present for default contract fulfillment
    if (this.at().type == TokenType.TypeIdentifier) {
      contractName = get_leaf(this.eat())

      // Check if it's a generic type with parameters
      if (isLessThan(this.at())) {
        typeArgs = this.parse_generic_type_args()
      }
    }

    this.eat() // eat for token
    structName = this.expect(TokenType.TypeIdentifier, "Expected struct name following for keyword")

    this.insideContractFulfillment = true

    const members = this.parse_contract_body()

    this.insideContractFulfillment = false

    return {
      kind: "ContractFulfillment",
      contract: contractName,
      members,
      typeArgs,
      for: get_leaf(structName),
    }
  }

  private parse_single_type(): TypeNode {
    // Parse the base type (primitive or named)
    let type = this.parse_base_type()

    // Check for array notation that follows the type
    while (this.at().type === TokenType.OpenBracket) {
      this.eat() // consume '['
      this.expect(TokenType.CloseBracket, "Expected ']' after '['")

      // Wrap the current type in an array type
      type = {
        kind: "ArrayType",
        elementType: type,
      }
    }

    return type
  }

  private parse_base_type(): TypeNode {
    // Check if it's a named type (could be a struct, alias, or generic)
    if (this.at().type === TokenType.TypeIdentifier) {
      const typeName = this.eat()

      // Check if it's a generic type with parameters
      if (isLessThan(this.at())) {
        if (typeName) return this.parse_generic_type(typeName)
      }

      // Regular named type
      return {
        kind: "AliasType",
        name: get_leaf(typeName),
        actualType: {
          kind: "PrimitiveType",
          name: get_leaf(typeName),
        },
      }
    }

    // Primitive types
    const typeToken = this.expectOneOf(
      TypesGroup.TypeAnnotation,
      [
        TokenType.NumberType,
        TokenType.StringType,
        TokenType.BooleanType,
        TokenType.DynamicType,
        TokenType.VoidType,
      ],
      "Expected valid type annotation",
    )

    return {
      kind: "PrimitiveType",
      name: get_leaf(typeToken),
    }
  }

  private parse_generic_type(nameToken: Token): GenericType {
    this.eat() // consume '<'

    const parameters: TypeParameter[] = []

    // Parse type parameters
    while (this.not_eof() && !isGreaterThan(this.at())) {
      // Parse parameter name
      const paramNameToken = this.expect(TokenType.TypeIdentifier, "Expected type parameter name")

      let constraint: TypeNode | undefined = undefined

      // Check for constraint (T: number)
      if (this.at().type === TokenType.Colon) {
        this.eat() // consume ':'
        constraint = this.parse_type()
      }

      // Create TypeParameter
      parameters.push({
        kind: "TypeParameter",
        name: get_leaf(paramNameToken),
        constraint,
      })

      if (this.at().type === TokenType.Comma) {
        this.eat() // consume comma
      } else {
        break
      }
    }

    const token = this.eat() // consume '>'

    if (!isGreaterThan(token)) {
      throw new Error("Expected '>' after type parameters")
    }

    return {
      kind: "GenericType",
      name: get_leaf(nameToken),
      parameters,
    }
  }

  private parse_block(parser: () => any) {
    const indented = this.at().type === TokenType.Indent

    if (indented) {
      this.expect(TokenType.Indent, "Expected indented code block")
    } else {
      this.expect(TokenType.OpenBrace, "Expected opening brace for code block")
    }

    const blockEndingTypes = [TokenType.CloseBrace, TokenType.Dedent, TokenType.EOF]

    while (!blockEndingTypes.includes(this.at().type)) parser()

    if (indented) {
      this.expect(TokenType.Dedent, "Unexpected ending of indented code block")
    } else {
      this.expect(TokenType.CloseBrace, "Unexpected ending of code block, expected '}'")
    }
  }

  private parse_code_block(): Stmt[] {
    const block: Stmt[] = []

    this.parse_block(() => {
      block.push(this.parse_stmt())
    })

    return block
  }

  private parse_return_type(): TypeNode | TypeNode[] | undefined {
    let returnType = undefined
    if (this.at().type == TokenType.Arrow) {
      returnType = this.parse_type_anotation(TokenType.Arrow)
    }

    while (this.at().type == TokenType.Comma) {
      this.eat() // eat comma
      if (!returnType) returnType = []
      else if (!Array.isArray(returnType)) returnType = [returnType]

      returnType.push(this.parse_type())
    }

    return returnType
  }

  private parse_fn_declaration(): FunctionDeclaration {
    this.eat() // eat fn token
    const name = this.expect(TokenType.Identifier, "Expected function name following fn keyword")

    let typeParameters: TypeParameter[] | undefined = undefined
    if (isLessThan(this.at())) {
      typeParameters = this.parse_generic_type(name).parameters
    }

    const params = this.parse_params()

    const returnType = this.parse_return_type()

    const body = this.parse_code_block()

    return {
      kind: "FunctionDeclaration",
      name: get_leaf(name),
      parameters: params,
      typeParameters,
      body,
      returnType,
    }
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

  private parse_label(): { label?: LeafNode<string>; loopId: string } {
    const loopId = `loop_${this.loopStack.length + 1}`
    this.loopStack.push(loopId)

    if (this.at().type == TokenType.Label) {
      this.eat() // eat label token

      const label = this.expect(TokenType.Identifier, "Expected identifier after label keyword")

      this.labelMap.set(label.value, loopId)
      return { label: get_leaf(label), loopId }
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

      this.decrement_loop_stack(label?.value)

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

      this.decrement_loop_stack(label?.value)

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

    this.decrement_loop_stack(label?.value)

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

    const indexIdent = this.expect(TokenType.Identifier, "Expected identifier in for loop")

    this.expect(TokenType.Comma, "Expected comma after first identifier in for loop")

    const valIdent = this.expect(TokenType.Identifier, "Expected identifier in for loop")

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

    this.decrement_loop_stack(label?.value)
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

  private parse_for_range_statement(
    valIdent: LeafNode<string>,
    indexIdent: LeafNode<string>,
  ): ForRangeStatement {
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

    this.decrement_loop_stack(label?.value)

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
    let label: LeafNode<string> | undefined
    let value: Expr | undefined

    // Check for label (@identifier)
    if (this.at().type == TokenType.At) {
      this.eat() // eat @ token
      const labelToken = this.expect(TokenType.Identifier, "Expected identifier after @")

      if (!this.labelMap.has(labelToken.value)) {
        throw new Error(`Invalid label '${labelToken.value}' for break statement.`)
      }

      loopId = this.labelMap.get(labelToken.value) || loopId
      label = get_leaf(labelToken)
    }

    // Check for break value - look ahead to see if next token could start an expression
    if (is_expression_start(this.at().type)) {
      value = this.parse_expr()
    }

    return {
      kind: "BreakStatement",
      loopId,
      label,
      value,
    }
  }

  private parse_continue_statement(): ContinueStatement {
    this.eat() // eat continue token

    if (this.loopStack.length == 0) {
      throw new Error("Unexpected continue statement outside of loop.")
    }

    let loopId = this.loopStack[this.loopStack.length - 1]

    if (this.at().type == TokenType.Identifier) {
      const labelToken = this.eat()

      if (!this.labelMap.has(labelToken.value)) {
        throw new Error(`Invalid label '${labelToken.value}' for skip statement.`)
      }

      loopId = this.labelMap.get(labelToken.value) || loopId

      return { kind: "ContinueStatement", loopId, label: get_leaf(labelToken) }
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
      "Expected identifier name following variable declarator.",
    )

    const type = this.parse_type_anotation()

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
        identifier: get_leaf(identifier),
        type,
        modifier,
      })

      // Get rest of them
      while (this.at().type == TokenType.Comma) {
        this.eat() // eat comma

        const identifier = this.expect(TokenType.Identifier, "Expected identifier after comma.")

        const type = this.parse_type_anotation()

        shorthands.push({
          kind: "VarDeclaration",
          identifier: get_leaf(identifier),
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
        identifier: get_leaf(identifier),
        modifier,
        type,
        value: this.parse_expr(),
      } as VarDeclaration)
    }

    // parse rest of them
    if (this.at().type == TokenType.Comma) {
      while (this.at().type == TokenType.Comma) {
        this.eat() // eat comma

        const identifier = this.expect(TokenType.Identifier, "Expected identifier after comma.")

        const type = this.parse_type_anotation()

        const dec = {
          kind: "VarDeclaration",
          identifier: get_leaf(identifier),
          type,
          modifier,
        } as VarDeclaration

        this.expect(
          TokenType.Equals,
          "Expected equals token following identifier in var declaration.",
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
      identifier: get_leaf(identifier),
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

  private parse_generic_type_args(): TypeNode[] {
    this.expect_less_than()

    const typeArgs: TypeNode[] = []

    // Parse first type argument
    typeArgs.push(this.parse_type())

    // Parse remaining type arguments separated by commas
    while (this.at().type === TokenType.Comma) {
      this.eat() // eat comma
      typeArgs.push(this.parse_type())
    }

    this.expect_greater_than()

    return typeArgs
  }

  private parse_object_expr(): ObjectLiteral {
    const structName = this.expect(TokenType.TypeIdentifier, "Expected struct name.")

    let typeArgs = undefined

    if (isLessThan(this.at())) {
      typeArgs = this.parse_generic_type_args()
    }

    this.eat() // eat open brace
    const props = new Array<Property>()

    while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
      const key = this.expect(TokenType.Identifier, "Object literal key expected")

      // handling shorthands {key,}
      if (this.at().type == TokenType.Comma) {
        this.eat() // eat comma
        props.push({ kind: "Property", key: get_leaf(key) })
        continue
      }
      // handling shorthands {key}
      else if (this.at().type == TokenType.CloseBrace) {
        props.push({ kind: "Property", key: get_leaf(key) })
        continue
      }

      // handling {key: value}
      this.expect(TokenType.Colon, "Missing colon following identifier in object")
      const value = this.parse_expr()

      props.push({ kind: "Property", key: get_leaf(key), value })

      if (this.at().type != TokenType.CloseBrace) {
        this.expect(TokenType.Comma, "Expected comma or closing bracket")
      }
    }

    this.expect(TokenType.CloseBrace, "Object literal missing closing brace.")
    return { kind: "ObjectLiteral", properties: props, instanceOf: get_leaf(structName), typeArgs }
  }

  private parse_assigne(): Expr {
    if (this.at().type == TokenType.OpenBracket) {
      return this.parse_array_expr()
    } else if (
      this.at().type == TokenType.TypeIdentifier &&
      (this.at(1).type == TokenType.OpenBrace || isLessThan(this.at(1)))
    ) {
      return this.parse_object_expr()
    }

    return this.parse_gate_expr()
  }

  private parse_gate_expr(): Expr {
    let left = this.parse_comparitive_expr()

    while (this.at().type == TokenType.LogicGate) {
      const operator = this.eat()
      const right = this.parse_comparitive_expr()
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator: get_leaf(operator),
      } as BinaryExpr
    }

    return left
  }

  private parse_comparitive_expr(): Expr {
    let left = this.parse_additive_expr()

    while (
      this.at().type == TokenType.RelationalOperator ||
      this.at().type == TokenType.EqualityOperator
    ) {
      const operator = this.eat()
      const right = this.parse_additive_expr()
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator: get_leaf(operator),
      } as BinaryExpr
    }

    return left
  }

  // 3.
  private parse_additive_expr(): Expr {
    let left = this.parse_multipicative_expr()

    while (this.at().type == TokenType.AdditiveOperator) {
      const operator = this.eat()
      const right = this.parse_multipicative_expr()
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator: get_leaf(operator),
      } as BinaryExpr
    }

    return left
  }

  // 4.
  private parse_multipicative_expr(): Expr {
    let left = this.parse_call_member_expr()

    while (this.at().type == TokenType.MulitipicativeOperator) {
      const operator = this.eat()
      const right = this.parse_call_member_expr()
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator: get_leaf(operator),
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

  private parse_params(): FunctionParam[] {
    this.expect(TokenType.OpenParen, "Expected open paren")
    const params = this.at().type == TokenType.CloseParen ? [] : this.parse_params_list()

    this.expect(TokenType.CloseParen, "Missing closing paren")

    return params
  }

  private parse_params_list(): FunctionParam[] {
    // inside contract fulfillment, first param is self
    const params = [this.parse_parameter(this.insideContractFulfillment)]

    while (this.at().type == TokenType.Comma && this.eat()) params.push(this.parse_parameter())

    return params
  }

  private parse_parameter(parse_self = false): FunctionParam {
    let ident
    if (parse_self) {
      ident = this.expect(TokenType.Self, "Expected self keyword")
    } else {
      ident = this.expect(TokenType.Identifier, "Expected identifier in function parameter")
    }

    // self keyword can't have type anotation
    const type = parse_self ? undefined : this.parse_type_anotation()

    // check for default values
    if (this.at().type == TokenType.Equals) {
      if (parse_self) throw new Error("Self keyword can't have default value")

      this.eat() // eat = token

      const defaultVal = this.parse_expr()

      return {
        kind: "FunctionParam",
        name: get_leaf(ident),
        type,
        default: defaultVal,
      } as FunctionParam
    }

    return { kind: "FunctionParam", name: get_leaf(ident), type } as FunctionParam
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
    const stringToken = this.eat()
    const inputString = stringToken.value
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
          const tokens = tokenize("string_expr", exprStr)
          expressions[Placholder.expr(i)] = new Parser(tokens).parse_expr()
        })
      }
    }

    // handle identifiers
    const identRegex = /\$([a-zA-Z_]\w*)/g
    const identifiers = outputString.match(identRegex) || []

    stringToken.value = outputString

    return {
      kind: "StringLiteral",
      value: get_leaf(stringToken),
      identifiers,
      expressions,
    } as StringLiteral
  }

  private parse_paren_expression() {
    this.eat() // eat opening paren
    const value = this.parse_expr()
    this.expect(
      TokenType.CloseParen,
      "Unexpected token found in parenthesized expression. Expected closing paren",
    ) // eat closing paren
    return value
  }

  // ? if/else expressions will be parsed here
  private parse_primary_expr(): Expr {
    const tk = this.at().type

    switch (tk) {
      case TokenType.Identifier:
        return { kind: "Identifier", symbol: get_leaf(this.eat()) } as Identifier
      case TokenType.Self:
        return { kind: "SelfKeyword", symbol: get_leaf(this.eat()) } as SelfKeyword
      case TokenType.NumberLiteral: {
        const numberToken = this.eat()
        numberToken.value = parseFloat(numberToken.value)
        return { kind: "NumericLiteral", value: get_leaf(numberToken) } as NumericLiteral
      }
      case TokenType.For:
        return this.parse_for_statement() // To support 'for' expressions
      case TokenType.If:
        return this.parse_if_statement() // To support 'if/else' expressions
      case TokenType.StringLiteral:
        return this.parse_string_literal() as StringLiteral
      case TokenType.OpenParen:
        return this.parse_paren_expression()
      default:
        throw new Error(`Unexpected token found in parser:, ${this.at().type}: ${this.at().value}`)
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

export function parse(filename: string, code: string): Program {
  const tokens = tokenize(filename, code)
  return new Parser(tokens).produceAST(tokens)
}
