import { specs } from "../../frontend/lexer/specs"
import { tokenize } from "../../frontend/lexer/tokenizer"
import Parser from "../../frontend/parser"

describe("FunctionDeclaration", () => {
  it("should parse function declarations without parameters", () => {
    const code = "fn a() {}"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "FunctionDeclaration",
          name: "a",
          parameters: [],
          body: [],
        },
      ],
    })
  })

  it("should parse function declarations with parameters", () => {
    const code = "fn a(b: number, c: string) {}"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "FunctionDeclaration",
          name: "a",
          parameters: [
            {
              kind: "FunctionParam",
              name: "b",
              type: "number",
            },
            {
              kind: "FunctionParam",
              name: "c",
              type: "string",
            },
          ],
          body: [],
        },
      ],
    })
  })

  it("should parse function declarations with return type", () => {
    const code = "fn a() -> number {}"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "FunctionDeclaration",
          name: "a",
          parameters: [],
          returnType: "number",
          body: [],
        },
      ],
    })
  })

  it("should parse function declarations with parameters and return type", () => {
    const code = "fn a(b: number, c: string) -> number {}"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "FunctionDeclaration",
          name: "a",
          parameters: [
            {
              kind: "FunctionParam",
              name: "b",
              type: "number",
            },
            {
              kind: "FunctionParam",
              name: "c",
              type: "string",
            },
          ],
          returnType: "number",
          body: [],
        },
      ],
    })
  })

  it("should parse function declarations with body", () => {
    const code = "fn a() { return 1 }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "FunctionDeclaration",
          name: "a",
          parameters: [],
          body: [
            {
              kind: "ReturnStatement",
              value: {
                kind: "NumericLiteral",
                value: 1,
              },
            },
          ],
        },
      ],
    })
  })

  it("should parse function declarations with parameters and body", () => {
    const code = "fn a(b: number, c: string) { return 1 }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "FunctionDeclaration",
          name: "a",
          parameters: [
            {
              kind: "FunctionParam",
              name: "b",
              type: "number",
            },
            {
              kind: "FunctionParam",
              name: "c",
              type: "string",
            },
          ],
          body: [
            {
              kind: "ReturnStatement",
              value: {
                kind: "NumericLiteral",
                value: 1,
              },
            },
          ],
        },
      ],
    })
  })

  it("should parse function declarations with return type and body", () => {
    const code = "fn a() -> number { return 1 }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "FunctionDeclaration",
          name: "a",
          parameters: [],
          returnType: "number",
          body: [
            {
              kind: "ReturnStatement",
              value: {
                kind: "NumericLiteral",
                value: 1,
              },
            },
          ],
        },
      ],
    })
  })

  it("should parse function declarations with parameters, return type and body", () => {
    const code = "fn a(b: number, c: string) -> number { return 1 }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "FunctionDeclaration",
          name: "a",
          parameters: [
            {
              kind: "FunctionParam",
              name: "b",
              type: "number",
            },
            {
              kind: "FunctionParam",
              name: "c",
              type: "string",
            },
          ],
          returnType: "number",
          body: [
            {
              kind: "ReturnStatement",
              value: {
                kind: "NumericLiteral",
                value: 1,
              },
            },
          ],
        },
      ],
    })
  })

  it("should parse function declarations with multiple statements in body", () => {
    const code = `fn a() { 
      var b = 1
      return b 
    }`
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "FunctionDeclaration",
          name: "a",
          parameters: [],
          body: [
            {
              kind: "VarDeclaration",
              identifier: "b",
              modifier: "variable",
              type: undefined, // type is not explicitly defined
              value: {
                kind: "NumericLiteral",
                value: 1,
              },
            },
            {
              kind: "ReturnStatement",
              value: {
                kind: "Identifier",
                symbol: "b",
              },
            },
          ],
        },
      ],
    })
  })

  it("should parse function declarations with indented code block", () => {
    const code = `fn a(): 
      var b = 1
      return b`
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "FunctionDeclaration",
          name: "a",
          parameters: [],
          body: [
            {
              kind: "VarDeclaration",
              identifier: "b",
              modifier: "variable",
              type: undefined, // type is not explicitly defined
              value: {
                kind: "NumericLiteral",
                value: 1,
              },
            },
            {
              kind: "ReturnStatement",
              value: {
                kind: "Identifier",
                symbol: "b",
              },
            },
          ],
        },
      ],
    })
  })

  it("should parse function declarations with indented code block and return type", () => {
    const code = `fn a() -> number: 
      var b = 1
      return b`
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "FunctionDeclaration",
          name: "a",
          parameters: [],
          returnType: "number",
          body: [
            {
              kind: "VarDeclaration",
              identifier: "b",
              modifier: "variable",
              type: undefined, // type is not explicitly defined
              value: {
                kind: "NumericLiteral",
                value: 1,
              },
            },
            {
              kind: "ReturnStatement",
              value: {
                kind: "Identifier",
                symbol: "b",
              },
            },
          ],
        },
      ],
    })
  })
})
