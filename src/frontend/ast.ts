export type NodeType =
  // Statements
  | "Program"
  | "VarDeclaration"
  | "MultiVarDeclaration"
  | "FunctionDeclaration"
  | "ReturnStatement"
  | "IfElseStatement"
  | "WhileStatement"
  | "ForStatement"
  | "ForInStatement"
  | "ForRangeStatement"
  | "BreakStatement"
  | "ContinueStatement"
  | "TypeDeclaration"
  | "ContractFulfillment"
  // Expressions
  | "AssignmentExpr"
  | "MemberExpr"
  | "CallExpr"
  | "BinaryExpr"
  | "FunctionParam"
  | "StructMember"
  // Literals
  | "Property"
  | "ObjectLiteral"
  | "StringLiteral"
  | "NumericLiteral"
  | "Identifier"
  | "ArrayLiteral"
  | "DocComment"
  | "SelfKeyword"
  // Types
  | "TypeDeclaration"
  | "AliasDeclaration"
  | "PrimitiveType"
  | "StructType"
  | "AliasType"
  | "GenericType"
  | "UnionType"
  | "ArrayType"
  | "TypeParameter"
  | "FunctionType"
  | "GetterType"
  | "ContractType"

export type Type = "string" | "number" | "bool" | "array" | "object" | "dynamic"
export type VarModifier = "constant" | "final" | "variable"

export interface LeafNode<T> {
  value: T
  position: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
}

export interface Stmt {
  kind: NodeType
}

export interface Program extends Stmt {
  kind: "Program"
  body: Stmt[]
}

export interface VarDeclaration extends Stmt {
  kind: "VarDeclaration"
  modifier: VarModifier
  identifier: LeafNode<string>
  type?: TypeNode
  value?: Expr
}

export interface MultiVarDeclaration extends Stmt {
  kind: "MultiVarDeclaration"
  variables: VarDeclaration[]
}

export interface FunctionParam extends Stmt {
  kind: "FunctionParam"
  name: LeafNode<string>
  type?: TypeNode
  default?: Expr // to assign a default value
}

export interface FunctionDeclaration extends Stmt {
  kind: "FunctionDeclaration"
  name: LeafNode<string>
  parameters: FunctionParam[]
  returnType: TypeNode | TypeNode[] | undefined
  body: Stmt[]
  typeParameters?: TypeParameter[] // to support generic type parameters
}

export interface CallExpr extends Expr {
  kind: "CallExpr"
  args: Expr[]
  caller: Expr
  typeArgs?: TypeNode[] // Add support for type arguments in function calls
}

export interface ReturnStatement extends Stmt {
  kind: "ReturnStatement"
  value: Expr | Expr[] // to support multiple return values
}

export interface IfElseStatement extends Stmt {
  kind: "IfElseStatement"
  condition: Expr
  body: Stmt[]
  branches?: IfElseStatement[] // "else if" checks
  else?: Stmt[]
}

export interface WhileStatement extends Loop {
  kind: "WhileStatement"
  check: Expr
  body: Stmt[]
}

export interface Loop extends Stmt {
  loopId: string
  label?: LeafNode<string>
  body: Stmt[]
}

export interface ForStatement extends Loop {
  kind: "ForStatement"
  initializer?: Stmt
  condition?: Expr
  update?: Stmt
}

export interface ForInStatement extends Loop {
  kind: "ForInStatement"
  valueIdentifier: LeafNode<string>
  indexIdentifier: LeafNode<string>
  iterable: Expr
}

export interface ForRangeStatement extends Loop {
  kind: "ForRangeStatement"
  valueIdentifier: LeafNode<string>
  indexIdentifier: LeafNode<string>
  start: Expr
  end?: Expr
  step?: Expr
  inclusive: boolean // false for "to" and true for "through"
}

export interface BreakStatement extends Stmt {
  kind: "BreakStatement"
  loopId: string
  label?: LeafNode<string>
  value?: Expr // to support breaking with a value
}

export interface ContinueStatement extends Stmt {
  kind: "ContinueStatement"
  loopId: string
  label?: LeafNode<string>
}

export interface ContractFulfillment extends Stmt {
  kind: "ContractFulfillment"
  contract?: LeafNode<string> // undefined for default contract
  typeArgs?: TypeNode[] // Add support for type arguments in contract fulfillment
  for: LeafNode<string>
  members: (GetterType | FunctionType)[]
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Expr extends Stmt {}

export interface BinaryExpr extends Expr {
  kind: "BinaryExpr"
  left: Expr
  right: Expr
  operator: LeafNode<string>
}

export interface AssignmentExpr extends Expr {
  kind: "AssignmentExpr"
  assigne: Expr
  value: Expr
}

export interface MemberExpr extends Expr {
  kind: "MemberExpr"
  object: Expr
  property: Expr
  computed: boolean
}

// instance of struct
export interface ObjectLiteral extends Expr {
  kind: "ObjectLiteral"
  instanceOf: LeafNode<string>
  properties: Property[]
  typeArgs?: TypeNode[] // Add support for type arguments in object instantiation
}

export interface Identifier extends Expr {
  kind: "Identifier"
  symbol: LeafNode<string>
}

export interface SelfKeyword extends Expr {
  kind: "SelfKeyword"
  symbol: LeafNode<string>
}

export interface NumericLiteral extends Expr {
  kind: "NumericLiteral"
  value: LeafNode<number>
}

export interface StringLiteral extends Expr {
  kind: "StringLiteral"
  value: LeafNode<string>
  identifiers: string[] // handle embeded variables
  expressions: Record<string, Expr> // handle embeded expressions
}

export interface Property extends Expr {
  kind: "Property"
  key: LeafNode<string>
  value?: Expr // its optional to support shorthand i.e. {key}
}

export interface ArrayLiteral extends Expr {
  kind: "ArrayLiteral"
  elements: []
}

export interface DocComment extends Expr {
  kind: "DocComment"
}

/**
 * ==========
 * Types AST
 * ==========
 */

export interface TypeNode extends Expr {
  isNominal: boolean
  name?: LeafNode<string>
}

// 'alias' keyword is for creating aliases to existing types
// ie
// alias User = Response
// User == Response // true
export interface AliasDeclaration extends Stmt {
  kind: "AliasDeclaration"
  name: TypeNode
  type: TypeNode

  // we need this to differentiate b/w generic type:
  // alias User<T> = Response<T>
  // and
  // alias UserR = Response<User> // note: UserR is not generic, on left
  parameters?: TypeNode[]

  isNominal: false // Added this flag just for clarity
}

// 'type' keyword is for distinct types
// ie
// type User Response
// User == Response // false
// User == User // true
export interface TypeDeclaration extends Stmt {
  kind: "TypeDeclaration"
  name: TypeNode
  type: TypeNode

  // we need this to differentiate b/w generic type:
  // type User<T> Response<T>
  // and
  // type UserR Response<User> // note: UserR is not generic, on left
  parameters?: TypeNode[]

  isNominal: true
}

export interface ContractType extends TypeNode {
  kind: "ContractType"
  name?: LeafNode<string>

  members: (GetterType | FunctionType)[]
}

export interface PrimitiveType extends TypeNode {
  kind: "PrimitiveType"
  name: LeafNode<"string" | "number" | "bool" | "dynamic" | "void">
}

export interface StructType extends TypeNode {
  kind: "StructType"
  name?: LeafNode<string>
  members: StructMember[]
}

export interface StructMember extends TypeNode {
  kind: "StructMember"
  name: LeafNode<string>
  type: TypeNode // Supports structs, generics, etc.
  optional: boolean
}

export interface AliasType extends TypeNode {
  kind: "AliasType"
  name?: LeafNode<string>
  actualType: TypeNode
}

export interface GenericType extends TypeNode {
  kind: "GenericType"
  name?: LeafNode<string>
  parameters: TypeParameter[] // Changed from TypeNode[] to TypeParameter[]
}

// New interface to represent type parameters with constraints
export interface TypeParameter extends Expr {
  kind: "TypeParameter"
  name: LeafNode<string>
  constraint?: TypeNode // Optional constraint (e.g., "number" in T: number)
}

export interface UnionType extends TypeNode {
  kind: "UnionType"
  name?: LeafNode<string>
  types: TypeNode[]
}

export interface ArrayType extends TypeNode {
  kind: "ArrayType"
  name?: LeafNode<string>
  elementType: TypeNode
}

export interface FunctionType extends TypeNode {
  kind: "FunctionType"
  name?: LeafNode<string>
  parameters: FunctionParam[]
  returnType: TypeNode | TypeNode[]
  typeParameters?: TypeParameter[]
  body?: Stmt[] // undefined in contracts, and defined in contract fulfillment
}

// ie get name -> string
export interface GetterType extends TypeNode {
  kind: "GetterType"
  name: LeafNode<string>
  parameters?: FunctionParam[] // for self keyword in contract
  returnType: TypeNode | TypeNode[]
  body?: Stmt[]
}
