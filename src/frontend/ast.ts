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
  // Expressions
  | "AssignmentExpr"
  | "MemberExpr"
  | "CallExpr"
  | "BinaryExpr"
  | "FunctionParam"
  // Literals
  | "Property"
  | "ObjectLiteral"
  | "StringLiteral"
  | "NumericLiteral"
  | "Identifier"
  | "ArrayLiteral"
  | "DocComment"

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
  type?: LeafNode<Type>
  value?: Expr
}

export interface MultiVarDeclaration extends Stmt {
  kind: "MultiVarDeclaration"
  variables: VarDeclaration[]
}

export interface FunctionParam extends Stmt {
  kind: "FunctionParam"
  name: LeafNode<string>
  type?: LeafNode<Type>
  default?: Expr // to assign a default value
}

export interface FunctionDeclaration extends Stmt {
  kind: "FunctionDeclaration"
  name: LeafNode<string>
  parameters: FunctionParam[]
  returnType: LeafNode<Type> | LeafNode<Type>[]
  body: Stmt[]
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

export interface WhileStatement extends Stmt {
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
}

export interface ContinueStatement extends Stmt {
  kind: "ContinueStatement"
  loopId: string
  label?: LeafNode<string>
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

export interface CallExpr extends Expr {
  kind: "CallExpr"
  args: Expr[]
  caller: Expr
}

export interface Identifier extends Expr {
  kind: "Identifier"
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

export interface ObjectLiteral extends Expr {
  kind: "ObjectLiteral"
  properties: Property[]
}

export interface ArrayLiteral extends Expr {
  kind: "ArrayLiteral"
  elements: []
}

export interface DocComment extends Expr {
  kind: "DocComment"
}
