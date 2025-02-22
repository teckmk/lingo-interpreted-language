export type NodeType =
  // Statements
  | "Program"
  | "VarDeclaration"
  | "MultiVarDeclaration"
  | "FunctionDeclaration"
  | "ReturnStatement"
  | "IfElseStatement"
  | "WhileStatement"
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
  identifier: string
  type?: Type
  value?: Expr
}

export interface MultiVarDeclaration extends Stmt {
  kind: "MultiVarDeclaration"
  variables: VarDeclaration[]
}

export interface FunctionParam extends Stmt {
  kind: "FunctionParam"
  name: string
  type?: Type
  default?: Expr // to assign a default value
}

export interface FunctionDeclaration extends Stmt {
  kind: "FunctionDeclaration"
  name: string
  parameters: FunctionParam[]
  returnType: Type
  body: Stmt[]
}

export interface ReturnStatement extends Stmt {
  kind: "ReturnStatement"
  value: Expr
}

export interface IfElseStatement extends Stmt {
  kind: "IfElseStatement"
  check: Expr
  body: Stmt[]
  childChecks?: IfElseStatement[] // "else if" checks
  else?: Stmt[]
}

export interface WhileStatement extends Stmt {
  kind: "WhileStatement"
  check: Expr
  body: Stmt[]
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Expr extends Stmt {}

export interface BinaryExpr extends Expr {
  kind: "BinaryExpr"
  left: Expr
  right: Expr
  operator: string
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
  symbol: string
}

export interface NumericLiteral extends Expr {
  kind: "NumericLiteral"
  value: number
}

export interface StringLiteral extends Expr {
  kind: "StringLiteral"
  value: string
  identifiers: string[] // handle embeded variables
  expressions: { [key: string]: Expr }
}

export interface Property extends Expr {
  kind: "Property"
  key: string
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
