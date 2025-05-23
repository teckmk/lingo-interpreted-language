export enum TokenType {
  NumberLiteral = "NUMBER_LITERAL",
  StringLiteral = "STRING_LITERAL",
  Identifier = "IDENTIFIER",
  TypeIdentifier = "TYPE_IDENTIFIER",
  SingleLineComment = "SINLE_LINE_COMMENT",
  DocComment = "DOC_COMMENT",
  MultiLineComment = "MULTI_LINE_COMMENT",
  WhiteSpace = "WHITE_SPACE",
  Tab = "TAB",
  Indent = "INDENT",
  Dedent = "DEDENT",
  EOF = "END_OF_FILE",
  EOL = "END_OF_LINE",

  QuestionMark = "QUESTION_MARK", // ?
  Arrow = "ARROW", // ->
  Equals = "ASSIGNMENT_OPERATOR", // =
  Comma = "COMMA", // ,
  Dot = "DOT", // .
  SemiColon = "SEMI_COLON", // ;
  Exclamation = "EXLAMATION", // "!"
  Colon = "COLON", //":"
  At = "AT", // @
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
  UpdateOperator = "UPDATE_OPERATOR", // ++ --
  ExponentOperator = "EXPONENT_OPERATOR", // **
  PipeOperator = "PIPE_OPERATOR", // |
  IntersectOperator = "INTERSECT_OPERATOR", // &

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
  For = "FOR",
  In = "IN",
  To = "TO",
  Through = "THROUGH",
  Label = "LABEL",
  Range = "RANGE",
  Step = "STEP",
  Break = "BREAK",
  Continue = "CONTINUE",
  Type = "TYPE",
  Get = "GET",
  FulFill = "FULFILL",
  Self = "SELF",
  Alias = "ALIAS",
  Mut = "MUT", // mut
  MutuableReference = "MUTUABLE_REFERENCE", // &mut
  Yield = "YIELD",

  // Primitive Types
  NumberType = "NUMBER_TYPE",
  StringType = "STRING_TYPE",
  BooleanType = "BOOL_TYPE",
  DynamicType = "DYNAMIC_TYPE",
  VoidType = "VOID_TYPE",
  StructType = "STRUCT_TYPE",
  ContractType = "CONTRACT_TYPE",
}

export type Spec = {
  regex: RegExp
  tokenType: TokenType
}

export const specs: Spec[] = [
  { regex: /^([\d]*[.])?[\d]+/, tokenType: TokenType.NumberLiteral },
  { regex: /^"((?:\\.|[^"\\])*)"/, tokenType: TokenType.StringLiteral },

  { regex: /^\blet\b/, tokenType: TokenType.Let },
  { regex: /^\bconst\b/, tokenType: TokenType.Const },
  { regex: /^\bfn\b/, tokenType: TokenType.Fn },
  { regex: /^\breturn\b/, tokenType: TokenType.Return },
  { regex: /^\bif\b/, tokenType: TokenType.If },
  { regex: /^\belse\b/, tokenType: TokenType.Else },
  { regex: /^\bwhile\b/, tokenType: TokenType.While },
  { regex: /^\bfor\b/, tokenType: TokenType.For },
  { regex: /^\bin\b/, tokenType: TokenType.In },
  { regex: /^\blabel\b/, tokenType: TokenType.Label },
  { regex: /^\brange\b/, tokenType: TokenType.Range },
  { regex: /^\bto\b/, tokenType: TokenType.To },
  { regex: /^\bthrough\b/, tokenType: TokenType.Through },
  { regex: /^\bstep\b/, tokenType: TokenType.Step },
  { regex: /^\bbreak\b/, tokenType: TokenType.Break },
  { regex: /^\bskip\b/, tokenType: TokenType.Continue },
  { regex: /^\btype\b/, tokenType: TokenType.Type },
  { regex: /^\bget\b/, tokenType: TokenType.Get },
  { regex: /^\bfulfill\b/, tokenType: TokenType.FulFill },
  { regex: /^\bself\b/, tokenType: TokenType.Self },
  { regex: /^\balias\b/, tokenType: TokenType.Alias },
  { regex: /^\bmut\b/, tokenType: TokenType.Mut },
  { regex: /^\b&mut\b/, tokenType: TokenType.MutuableReference },
  { regex: /^\byield\b/, tokenType: TokenType.Yield },

  { regex: /^\bnumber\b/, tokenType: TokenType.NumberType },
  { regex: /^\bstring\b/, tokenType: TokenType.StringType },
  { regex: /^\bbool\b/, tokenType: TokenType.BooleanType },
  { regex: /^\bdynamic\b/, tokenType: TokenType.DynamicType },
  { regex: /^\bvoid\b/, tokenType: TokenType.VoidType },
  { regex: /^\bstruct\b/, tokenType: TokenType.StructType },
  { regex: /^\bcontract\b/, tokenType: TokenType.ContractType },

  { regex: /^\band\b/, tokenType: TokenType.LogicGate },
  { regex: /^\bor\b/, tokenType: TokenType.LogicGate },

  { regex: /^[A-Z][a-zA-Z0-9_]*/, tokenType: TokenType.TypeIdentifier },
  { regex: /^[a-zA-Z_][a-zA-Z0-9_]*/, tokenType: TokenType.Identifier },

  { regex: /^\/\/.*/, tokenType: TokenType.SingleLineComment },
  { regex: /^\/\/\/.*/, tokenType: TokenType.DocComment },

  // these are making problem with line numbers, because they are read as single line, no matter how many lines they span on....
  // { regex: /^\/\*[\s\S]*?\*\//, tokenType: TokenType.MultiLineComment },

  // operators
  { regex: /^->/, tokenType: TokenType.Arrow },

  { regex: /^\*\*/, tokenType: TokenType.ExponentOperator },
  { regex: /^[+-]{2}/, tokenType: TokenType.UpdateOperator },
  { regex: /^[+-]/, tokenType: TokenType.AdditiveOperator },
  { regex: /^[*/%]/, tokenType: TokenType.MulitipicativeOperator },
  { regex: /^[><]=?/, tokenType: TokenType.RelationalOperator },
  { regex: /^[=!]=/, tokenType: TokenType.EqualityOperator },

  { regex: /^&&/, tokenType: TokenType.LogicGate },
  { regex: /^\|\|/, tokenType: TokenType.LogicGate },

  { regex: /^&/, tokenType: TokenType.IntersectOperator },
  { regex: /^\|/, tokenType: TokenType.PipeOperator },

  { regex: /^:/, tokenType: TokenType.Colon },
  { regex: /^;/, tokenType: TokenType.SemiColon },
  { regex: /^,/, tokenType: TokenType.Comma },
  { regex: /^\./, tokenType: TokenType.Dot },
  { regex: /^=/, tokenType: TokenType.Equals },
  { regex: /^!/, tokenType: TokenType.Exclamation },
  { regex: /^\(/, tokenType: TokenType.OpenParen },
  { regex: /^\)/, tokenType: TokenType.CloseParen },
  { regex: /^{/, tokenType: TokenType.OpenBrace },
  { regex: /^}/, tokenType: TokenType.CloseBrace },
  { regex: /^\[/, tokenType: TokenType.OpenBracket },
  { regex: /^\]/, tokenType: TokenType.CloseBracket },
  { regex: /^\?/, tokenType: TokenType.QuestionMark },
  { regex: /^@/, tokenType: TokenType.At },

  { regex: /^\r\n/, tokenType: TokenType.EOL },
  { regex: /^\n/, tokenType: TokenType.EOL },

  { regex: /^[^\S\r\n]+/, tokenType: TokenType.WhiteSpace }, // match one or more spaces and tabs
]
