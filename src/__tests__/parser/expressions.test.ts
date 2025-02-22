import { tokenize } from "../../frontend/lexer/tokenizer"
import Parser from "../../frontend/parser"

describe("Parser - Expressions", () => {
  describe("Binary expressions", () => {
    it("should parse binary expressions", () => {
      const code = "1 + 2"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "BinaryExpr",
            left: { kind: "NumericLiteral", value: 1 },
            right: { kind: "NumericLiteral", value: 2 },
            operator: "+",
          },
        ],
      })
    })

    it("should parse nested binary expressions", () => {
      const code = "1 + 2 * 3"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "BinaryExpr",
            left: { kind: "NumericLiteral", value: 1 },
            right: {
              kind: "BinaryExpr",
              left: { kind: "NumericLiteral", value: 2 },
              right: { kind: "NumericLiteral", value: 3 },
              operator: "*",
            },
            operator: "+",
          },
        ],
      })
    })

    it("should parse nested binary expressions with parenthesis", () => {
      const code = "(1 + 2) * 3"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "BinaryExpr",
            left: {
              kind: "BinaryExpr",
              left: { kind: "NumericLiteral", value: 1 },
              right: { kind: "NumericLiteral", value: 2 },
              operator: "+",
            },
            right: { kind: "NumericLiteral", value: 3 },
            operator: "*",
          },
        ],
      })
    })

    it("should parse nested binary expressions with parenthesis", () => {
      const code = "1 + (2 * 3)"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "BinaryExpr",
            left: { kind: "NumericLiteral", value: 1 },
            right: {
              kind: "BinaryExpr",
              left: { kind: "NumericLiteral", value: 2 },
              right: { kind: "NumericLiteral", value: 3 },
              operator: "*",
            },
            operator: "+",
          },
        ],
      })
    })

    it("should parse nested binary expressions with parenthesis", () => {
      const code = "1 + (2 * 3) + 4"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "BinaryExpr",
            left: {
              kind: "BinaryExpr",
              left: { kind: "NumericLiteral", value: 1 },
              right: {
                kind: "BinaryExpr",
                left: { kind: "NumericLiteral", value: 2 },
                right: { kind: "NumericLiteral", value: 3 },
                operator: "*",
              },
              operator: "+",
            },
            right: { kind: "NumericLiteral", value: 4 },
            operator: "+",
          },
        ],
      })
    })
  })

  describe("Assignment expressions", () => {
    it("should parse assignment expressions", () => {
      const code = "a = 1"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "AssignmentExpr",
            assigne: { kind: "Identifier", symbol: "a" },
            value: { kind: "NumericLiteral", value: 1 },
          },
        ],
      })
    })

    it("should parse nested assignment expressions", () => {
      const code = "a = b = 1"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "AssignmentExpr",
            assigne: { kind: "Identifier", symbol: "a" },
            value: {
              kind: "AssignmentExpr",
              assigne: { kind: "Identifier", symbol: "b" },
              value: { kind: "NumericLiteral", value: 1 },
            },
          },
        ],
      })
    })
  })

  describe("Member expressions", () => {
    it("should parse member expressions", () => {
      const code = "a.b"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "MemberExpr",
            object: { kind: "Identifier", symbol: "a" },
            property: { kind: "Identifier", symbol: "b" },
            computed: false,
          },
        ],
      })
    })
  })

  describe("Call expressions", () => {
    it("should parse call expressions", () => {
      const code = "foo()"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "CallExpr",
            caller: { kind: "Identifier", symbol: "foo" },
            args: [],
          },
        ],
      })
    })

    it("should parse call expressions with arguments", () => {
      const code = "foo(1, 2)"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "CallExpr",
            caller: { kind: "Identifier", symbol: "foo" },
            args: [
              { kind: "NumericLiteral", value: 1 },
              { kind: "NumericLiteral", value: 2 },
            ],
          },
        ],
      })
    })

    it("should parse call expressions with nested call expressions", () => {
      const code = "foo(bar())"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "CallExpr",
            caller: { kind: "Identifier", symbol: "foo" },
            args: [
              {
                kind: "CallExpr",
                caller: { kind: "Identifier", symbol: "bar" },
                args: [],
              },
            ],
          },
        ],
      })
    })

    it("should parse call expressions with assignment expressions", () => {
      const code = "foo(a = 1)"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "CallExpr",
            caller: { kind: "Identifier", symbol: "foo" },
            args: [
              {
                kind: "AssignmentExpr",
                assigne: { kind: "Identifier", symbol: "a" },
                value: { kind: "NumericLiteral", value: 1 },
              },
            ],
          },
        ],
      })
    })

    it("should parse call expressions with following call expressions", () => {
      const code = "foo()()"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "CallExpr",
            caller: {
              kind: "CallExpr",
              caller: { kind: "Identifier", symbol: "foo" },
              args: [],
            },
            args: [],
          },
        ],
      })
    })
  })

  describe("Identifier expressions", () => {
    it("should parse identifier expressions", () => {
      const code = "foo"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [{ kind: "Identifier", symbol: "foo" }],
      })
    })
  })

  describe("Numeric literal expressions", () => {
    it("should parse numeric literal expressions", () => {
      const code = "1"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [{ kind: "NumericLiteral", value: 1 }],
      })
    })
  })

  describe("String literal expressions", () => {
    it("should parse string literal expressions", () => {
      const code = '"foo"'
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [{ kind: "StringLiteral", value: "foo", identifiers: [], expressions: {} }],
      })
    })

    it("should parse string literal expressions with embedded variables", () => {
      const code = '"foo $bar"'
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "StringLiteral",
            value: "foo $bar",
            identifiers: ["$bar"],
            expressions: {},
          },
        ],
      })
    })

    it("should parse string literal expressions with embedded expressions", () => {
      const code = '"foo ${bar + 3}"' // ${bar + 3} is an expression
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "StringLiteral",
            value: "foo #expr(0)",
            identifiers: [],
            expressions: {
              "#expr(0)": {
                kind: "BinaryExpr",
                left: { kind: "Identifier", symbol: "bar" },
                right: { kind: "NumericLiteral", value: 3 },
                operator: "+",
              },
            },
          },
        ],
      })
    })

    it("should parse string literal expressions with multiple embedded expressions and variables", () => {
      const code = '"foo $bar ${bar + 3} ${foo * 2}"' // ${bar + 3} is an expression
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "StringLiteral",
            value: "foo $bar #expr(0) #expr(1)",
            identifiers: ["$bar"],
            expressions: {
              "#expr(0)": {
                kind: "BinaryExpr",
                left: { kind: "Identifier", symbol: "bar" },
                right: { kind: "NumericLiteral", value: 3 },
                operator: "+",
              },
              "#expr(1)": {
                kind: "BinaryExpr",
                left: { kind: "Identifier", symbol: "foo" },
                right: { kind: "NumericLiteral", value: 2 },
                operator: "*",
              },
            },
          },
        ],
      })
    })
  })

  describe("Object expressions", () => {
    it("should parse object expressions", () => {
      const code = "{ foo: 1, bar: 2 }"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "ObjectLiteral",
            properties: [
              {
                kind: "Property",
                key: "foo",
                value: { kind: "NumericLiteral", value: 1 },
              },
              {
                kind: "Property",
                key: "bar",
                value: { kind: "NumericLiteral", value: 2 },
              },
            ],
          },
        ],
      })
    })

    it("should parse object expressions with shorthand properties", () => {
      const code = "{ foo, bar }"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "ObjectLiteral",
            properties: [
              { kind: "Property", key: "foo" },
              { kind: "Property", key: "bar" },
            ],
          },
        ],
      })
    })

    it("should parse object expressions with nested object expressions", () => {
      const code = "{ foo: { bar: 1 } }"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "ObjectLiteral",
            properties: [
              {
                kind: "Property",
                key: "foo",
                value: {
                  kind: "ObjectLiteral",
                  properties: [
                    { kind: "Property", key: "bar", value: { kind: "NumericLiteral", value: 1 } },
                  ],
                },
              },
            ],
          },
        ],
      })
    })
  })

  describe("Array expressions", () => {
    it("should parse array expressions", () => {
      const code = "[1, 2, 3]"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "ArrayLiteral",
            elements: [
              { kind: "NumericLiteral", value: 1 },
              { kind: "NumericLiteral", value: 2 },
              { kind: "NumericLiteral", value: 3 },
            ],
          },
        ],
      })
    })

    it("should parse array expressions with nested array expressions", () => {
      const code = "[1, [2, 3]]"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "ArrayLiteral",
            elements: [
              { kind: "NumericLiteral", value: 1 },
              {
                kind: "ArrayLiteral",
                elements: [
                  { kind: "NumericLiteral", value: 2 },
                  { kind: "NumericLiteral", value: 3 },
                ],
              },
            ],
          },
        ],
      })
    })

    it("should parse array expressions with nested object expressions", () => {
      const code = "[1, { foo: 2 }]"
      const tokens = tokenize("test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "ArrayLiteral",
            elements: [
              { kind: "NumericLiteral", value: 1 },
              {
                kind: "ObjectLiteral",
                properties: [
                  { kind: "Property", key: "foo", value: { kind: "NumericLiteral", value: 2 } },
                ],
              },
            ],
          },
        ],
      })
    })
  })
})
