export enum TokenType {
  NumberLiteral = "NUMBER_LITERAL",
  StringLiteral = "STRING_LITERAL",
  Identifier = "IDENTIFIER",
  SingleLineComment = "SINLE_LINE_COMMENT",
  MultiLineComment = "MULTI_LINE_COMMENT",
  WhiteSpace = "WHITE_SPACE",
  Tab = "TAB",
  Indent = "INDENT",
  Dedent = "DEDENT",
  EOF = "END_OF_FILE",
  EOL = "END_OF_LINE",

  Equals = "ASSIGNMENT_OPERATOR", // =
  Comma = "COMMA", // ,
  Dot = "DOT", // .
  Exclamation = "EXLAMATION", // "!"
  Colon = "COLON", //":"
  OpenParen = "OPEN_PAREN", //  (
  CloseParen = "CLOSE_PAREN", // )
  OpenBrace = "OPEN_BRACE", // {
  CloseBrace = "CLOSE_BRACE", // }
  OpenBracket = "OPEN_BRACKET", // [
  CloseBracket = "CLOSE_BRACKET", // ]
  LogicGate = "LOGIC_GATE", // && || and or
  AdditiveOperator = "ADDITIVE_OPERATOR", //  + -
  MulitipicativeOperator = "MULTIPICATIVE_OPERATOR", // / * %
  EqualityOperator = "EQUALITY_OPERATOR", // == !=
  RelationalOperator = "RELATIONAL_OPERATOR", // > < >= <=

  // Reserved
  // KeyWords
  Let = "LET",
  Const = "CONST",
  Final = "FINAL",
  Fn = "FN",
  Return = "RETURN",
  If = "IF",
  Else = "ELSE",
  While = "WHILE",

  // Primitive Types
  NumberType = "NUMBER_TYPE",
  StringType = "STRING_TYPE",
  BooleanType = "BOOL_TYPE",
  DynamicType = "DYNAMIC_TYPE",
}

export type Spec = {
  regex: RegExp
  tokenType: TokenType
}

export const specs: Spec[] = [
  { regex: /^[+-]?([\d]*[.])?[\d]+/, tokenType: TokenType.NumberLiteral },
  { regex: /^"[^"]*"/, tokenType: TokenType.StringLiteral },
  { regex: /^'[^']*'/, tokenType: TokenType.StringLiteral },
  { regex: /^\w+/, tokenType: TokenType.Identifier },

  { regex: /^\blet\b/, tokenType: TokenType.Let },
  { regex: /^\bconst\b/, tokenType: TokenType.Const },
  { regex: /^\bfinal\b/, tokenType: TokenType.Final },
  { regex: /^\bfn\b/, tokenType: TokenType.Fn },
  { regex: /^\breturn\b/, tokenType: TokenType.Return },
  { regex: /^\bif\b/, tokenType: TokenType.If },
  { regex: /^\belse\b/, tokenType: TokenType.Else },
  { regex: /^\bwhile\b/, tokenType: TokenType.While },

  { regex: /^\bnumber\b/, tokenType: TokenType.NumberType },
  { regex: /^\bstring\b/, tokenType: TokenType.StringType },
  { regex: /^\bbool\b/, tokenType: TokenType.BooleanType },
  { regex: /^\bdynamic\b/, tokenType: TokenType.DynamicType },

  { regex: /^\/\/.*/, tokenType: TokenType.SingleLineComment },
  { regex: /^\/\*[\s\S]*?\*\//, tokenType: TokenType.MultiLineComment },

  { regex: /^:/, tokenType: TokenType.Colon },
  { regex: /^,/, tokenType: TokenType.Comma },
  { regex: /^./, tokenType: TokenType.Dot },
  { regex: /^=/, tokenType: TokenType.Equals },
  { regex: /^!/, tokenType: TokenType.Exclamation },
  { regex: /^\(/, tokenType: TokenType.OpenParen },
  { regex: /^\)/, tokenType: TokenType.CloseParen },
  { regex: /^{/, tokenType: TokenType.OpenBrace },
  { regex: /^}/, tokenType: TokenType.CloseBrace },
  { regex: /^\[/, tokenType: TokenType.OpenBracket },
  { regex: /^\]/, tokenType: TokenType.CloseBracket },

  // operators
  { regex: /^[+-]/, tokenType: TokenType.AdditiveOperator },
  { regex: /^[*\\%]/, tokenType: TokenType.MulitipicativeOperator },
  { regex: /^[><]=?/, tokenType: TokenType.RelationalOperator },
  { regex: /^[=!]=/, tokenType: TokenType.EqualityOperator },

  { regex: /^&&/, tokenType: TokenType.LogicGate },
  { regex: /^\|\|/, tokenType: TokenType.LogicGate },
  { regex: /^\band\b/, tokenType: TokenType.LogicGate },
  { regex: /^\bor\b/, tokenType: TokenType.LogicGate },

  { regex: /^\\n/, tokenType: TokenType.EOL },
  { regex: /^\\r\\n/, tokenType: TokenType.EOL },

  // By treating whitespace and tab as a token, we can add bash and python like features in future
  { regex: /^\s+/, tokenType: TokenType.WhiteSpace }, // match on or more spaces
  { regex: /^\\t+/, tokenType: TokenType.Tab }, // match one or more tabs
]
