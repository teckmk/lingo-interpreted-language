import { specs } from "../../frontend/lexer/specs"
import { tokenize } from "../../frontend/lexer/tokenizer"
import Parser from "../../frontend/parser"

describe("Parser - If Else Statements", () => {
  it("should parse if statements", () => {
    const code = "if a < 10 { }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "IfElseStatement",
          condition: {
            kind: "BinaryExpr",
            left: { kind: "Identifier", symbol: "a" },
            operator: "<",
            right: { kind: "NumericLiteral", value: 10 },
          },
          else: [],
          branches: [],
          body: [],
        },
      ],
    })
  })

  it("should parse if else statements", () => {
    const code = "if a < 10 { a = 10 } else { a = 20 }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "IfElseStatement",
          condition: {
            kind: "BinaryExpr",
            left: { kind: "Identifier", symbol: "a" },
            operator: "<",
            right: { kind: "NumericLiteral", value: 10 },
          },

          body: [
            {
              kind: "AssignmentExpr",
              assigne: { kind: "Identifier", symbol: "a" },
              value: { kind: "NumericLiteral", value: 10 },
            },
          ],

          else: [
            {
              kind: "AssignmentExpr",
              assigne: { kind: "Identifier", symbol: "a" },
              value: { kind: "NumericLiteral", value: 20 },
            },
          ],
          branches: [],
        },
      ],
    })
  })

  it("should parse if else if statements", () => {
    const code = "if a < 10 { a = 10 } else if a < 20 { a = 20 }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "IfElseStatement",
          condition: {
            kind: "BinaryExpr",
            left: { kind: "Identifier", symbol: "a" },
            operator: "<",
            right: { kind: "NumericLiteral", value: 10 },
          },
          body: [
            {
              kind: "AssignmentExpr",
              assigne: { kind: "Identifier", symbol: "a" },
              value: { kind: "NumericLiteral", value: 10 },
            },
          ],
          else: [],
          branches: [
            {
              kind: "IfElseStatement",
              condition: {
                kind: "BinaryExpr",
                left: { kind: "Identifier", symbol: "a" },
                operator: "<",
                right: { kind: "NumericLiteral", value: 20 },
              },
              body: [
                {
                  kind: "AssignmentExpr",
                  assigne: { kind: "Identifier", symbol: "a" },
                  value: { kind: "NumericLiteral", value: 20 },
                },
              ],
            },
          ],
        },
      ],
    })
  })
})
