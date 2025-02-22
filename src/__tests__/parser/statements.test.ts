import { specs } from "../../frontend/lexer/specs"
import { tokenize } from "../../frontend/lexer/tokenizer"
import Parser from "../../frontend/parser"

describe("Parser - Statements", () => {
  describe("VarDeclaration", () => {
    it("should parse var declarations without value", () => {
      const code = "var a"
      const tokens = tokenize(specs, "test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "VarDeclaration",
            modifier: "variable",
            identifier: "a",
          },
        ],
      })
    })

    it("should parse var declarations with type", () => {
      const code = "var a: number"
      const tokens = tokenize(specs, "test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "VarDeclaration",
            modifier: "variable",
            identifier: "a",
            type: "number",
          },
        ],
      })
    })

    it("should parse var declarations with value", () => {
      const code = "const a = 10"
      const tokens = tokenize(specs, "test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "VarDeclaration",
            modifier: "constant",
            identifier: "a",
            value: {
              kind: "NumericLiteral",
              value: 10,
            },
          },
        ],
      })
    })

    it("should parse var declarations with type", () => {
      const code = "const a: number = 10"
      const tokens = tokenize(specs, "test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "VarDeclaration",
            modifier: "constant",
            identifier: "a",
            type: "number",
            value: {
              kind: "NumericLiteral",
              value: 10,
            },
          },
        ],
      })
    })

    it("should not parse var declarations with const modifier and no value", () => {
      const code = "const a: number"
      const tokens = tokenize(specs, "test", code)

      expect(() => new Parser(tokens).produceAST()).toThrow(
        "Must assign a value to constant expression."
      )

      const codeWithoutType = "const a"
      const tokensWithoutType = tokenize(specs, "test", codeWithoutType)

      expect(() => new Parser(tokensWithoutType).produceAST()).toThrow(
        "Must assign a value to constant expression."
      )
    })

    it("should not parse var declarations with final modifier and no value", () => {
      const code = "final a: number"
      const tokens = tokenize(specs, "test", code)

      expect(() => new Parser(tokens).produceAST()).toThrow(
        "Must assign a value to final expression."
      )

      const codeWithoutType = "final a"
      const tokensWithoutType = tokenize(specs, "test", codeWithoutType)

      expect(() => new Parser(tokensWithoutType).produceAST()).toThrow(
        "Must assign a value to final expression."
      )
    })
  })

  describe("MultiVarDeclaration", () => {
    it("should parse multiple var declarations", () => {
      const code = "var a, b"
      const tokens = tokenize(specs, "test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "MultiVarDeclaration",
            variables: [
              {
                kind: "VarDeclaration",
                modifier: "variable",
                identifier: "a",
                type: undefined,
              },
              {
                kind: "VarDeclaration",
                modifier: "variable",
                identifier: "b",
                type: undefined,
              },
            ],
          },
        ],
      })
    })

    it("should parse multiple var declarations with type and no value", () => {
      const code = "var a: number, b: number"
      const tokens = tokenize(specs, "test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "MultiVarDeclaration",
            variables: [
              {
                kind: "VarDeclaration",
                modifier: "variable",
                identifier: "a",
                type: "number",
              },
              {
                kind: "VarDeclaration",
                modifier: "variable",
                identifier: "b",
                type: "number",
              },
            ],
          },
        ],
      })
    })

    it("should parse multiple var declarations with value", () => {
      const code = "var a = 10, b = 20"
      const tokens = tokenize(specs, "test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "MultiVarDeclaration",
            variables: [
              {
                kind: "VarDeclaration",
                modifier: "variable",
                identifier: "a",
                type: undefined,
                value: {
                  kind: "NumericLiteral",
                  value: 10,
                },
              },
              {
                kind: "VarDeclaration",
                modifier: "variable",
                identifier: "b",
                type: undefined,
                value: {
                  kind: "NumericLiteral",
                  value: 20,
                },
              },
            ],
          },
        ],
      })
    })

    it("should parse multiple var declarations with type and value", () => {
      const code = "var a: number = 10, b: number = 20"
      const tokens = tokenize(specs, "test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "MultiVarDeclaration",
            variables: [
              {
                kind: "VarDeclaration",
                modifier: "variable",
                identifier: "a",
                type: "number",
                value: {
                  kind: "NumericLiteral",
                  value: 10,
                },
              },
              {
                kind: "VarDeclaration",
                modifier: "variable",
                identifier: "b",
                type: "number",
                value: {
                  kind: "NumericLiteral",
                  value: 20,
                },
              },
            ],
          },
        ],
      })
    })
  })

  describe("Shorthand Assignment", () => {
    it("should parse multiple var declarations with shorthand value", () => {
      const code = "var a, b = 20"

      const tokens = tokenize(specs, "test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "MultiVarDeclaration",
            variables: [
              {
                kind: "VarDeclaration",
                modifier: "variable",
                identifier: "a",
                type: undefined,
                value: {
                  kind: "NumericLiteral",
                  value: 20,
                },
              },
              {
                kind: "VarDeclaration",
                modifier: "variable",
                identifier: "b",
                type: undefined,
                value: {
                  kind: "NumericLiteral",
                  value: 20,
                },
              },
            ],
          },
        ],
      })
    })
    it("should parse multiple var declarations with type and shorthand value", () => {
      const code = "var a: number, b: number = 20"

      const tokens = tokenize(specs, "test", code)

      const ast = new Parser(tokens).produceAST()

      expect(ast).toEqual({
        kind: "Program",
        body: [
          {
            kind: "MultiVarDeclaration",
            variables: [
              {
                kind: "VarDeclaration",
                modifier: "variable",
                identifier: "a",
                type: "number",
                value: {
                  kind: "NumericLiteral",
                  value: 20,
                },
              },
              {
                kind: "VarDeclaration",
                modifier: "variable",
                identifier: "b",
                type: "number",
                value: {
                  kind: "NumericLiteral",
                  value: 20,
                },
              },
            ],
          },
        ],
      })
    })
  })
})
