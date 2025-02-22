import { specs } from "../../frontend/lexer/specs"
import { tokenize } from "../../frontend/lexer/tokenizer"
import Parser from "../../frontend/parser"

describe("Parser - Loops", () => {
  it("should parse infinite for loop", () => {
    const code = "for { }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "ForStatement",
          label: undefined,
          loopId: "loop_1",
          body: [],
        },
      ],
    })
  })

  it("should parse for loop with condition", () => {
    const code = "for i < 10 { }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "ForStatement",
          label: undefined,
          loopId: "loop_1",
          condition: {
            kind: "BinaryExpr",
            operator: "<",
            left: {
              kind: "Identifier",
              symbol: "i",
            },
            right: {
              kind: "NumericLiteral",
              value: 10,
            },
          },
          body: [],
        },
      ],
    })
  })

  it("should parse for loop with initializer, condition and update", () => {
    const code = "for var i = 0; i < 10; i = i + 1 { }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "ForStatement",
          label: undefined,
          loopId: "loop_1",
          initializer: {
            kind: "VarDeclaration",
            identifier: "i",
            type: undefined,
            value: {
              kind: "NumericLiteral",
              value: 0,
            },
            modifier: "variable",
          },
          condition: {
            kind: "BinaryExpr",
            operator: "<",
            left: {
              kind: "Identifier",
              symbol: "i",
            },
            right: {
              kind: "NumericLiteral",
              value: 10,
            },
          },
          update: {
            kind: "AssignmentExpr",
            assigne: {
              kind: "Identifier",
              symbol: "i",
            },
            value: {
              kind: "BinaryExpr",
              operator: "+",
              left: {
                kind: "Identifier",
                symbol: "i",
              },
              right: {
                kind: "NumericLiteral",
                value: 1,
              },
            },
          },
          body: [],
        },
      ],
    })
  })

  it("should parse for in loop", () => {
    const code = "for var i,v in arr { }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "ForInStatement",
          loopId: "loop_1",
          label: undefined,
          valueIdentifier: "v",
          indexIdentifier: "i",
          iterable: {
            kind: "Identifier",
            symbol: "arr",
          },
          body: [],
        },
      ],
    })
  })

  it("should parse for range loop", () => {
    const code = "for var i,v in range 0 to 10 { }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "ForRangeStatement",
          loopId: "loop_1",
          label: undefined,
          valueIdentifier: "v",
          indexIdentifier: "i",
          start: {
            kind: "NumericLiteral",
            value: 0,
          },
          end: {
            kind: "NumericLiteral",
            value: 10,
          },
          inclusive: false,
          body: [],
        },
      ],
    })
  })

  it("should parse for range loop with step", () => {
    const code = "for var i,v in range 0 through 10 step 2 { }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "ForRangeStatement",
          loopId: "loop_1",
          label: undefined,
          valueIdentifier: "v",
          indexIdentifier: "i",
          start: {
            kind: "NumericLiteral",
            value: 0,
          },
          end: {
            kind: "NumericLiteral",
            value: 10,
          },
          step: {
            kind: "NumericLiteral",
            value: 2,
          },
          inclusive: true,
          body: [],
        },
      ],
    })
  })

  it("should parse for loop with label", () => {
    const code = "for label loop { }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "ForStatement",
          label: "loop",
          loopId: "loop_1",
          body: [],
        },
      ],
    })
  })

  it("should parse for loop with label and condition", () => {
    const code = "for i < 10 label loop { }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "ForStatement",
          label: "loop",
          loopId: "loop_1",
          condition: {
            kind: "BinaryExpr",
            operator: "<",
            left: {
              kind: "Identifier",
              symbol: "i",
            },
            right: {
              kind: "NumericLiteral",
              value: 10,
            },
          },
          body: [],
        },
      ],
    })
  })

  it("should parse for loop with label, initializer, condition and update", () => {
    const code = "for var i = 0; i < 10; i = i + 1 label loop { }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "ForStatement",
          label: "loop",
          loopId: "loop_1",
          initializer: {
            kind: "VarDeclaration",
            identifier: "i",
            type: undefined,
            value: {
              kind: "NumericLiteral",
              value: 0,
            },
            modifier: "variable",
          },
          condition: {
            kind: "BinaryExpr",
            operator: "<",
            left: {
              kind: "Identifier",
              symbol: "i",
            },
            right: {
              kind: "NumericLiteral",
              value: 10,
            },
          },
          update: {
            kind: "AssignmentExpr",
            assigne: {
              kind: "Identifier",
              symbol: "i",
            },
            value: {
              kind: "BinaryExpr",
              operator: "+",
              left: {
                kind: "Identifier",
                symbol: "i",
              },
              right: {
                kind: "NumericLiteral",
                value: 1,
              },
            },
          },
          body: [],
        },
      ],
    })
  })

  it("should parse for in range loop with label", () => {
    const code = "for var i,v in range 0 to 10 label loop { }"
    const tokens = tokenize(specs, "test", code)

    const ast = new Parser(tokens).produceAST()

    expect(ast).toEqual({
      kind: "Program",
      body: [
        {
          kind: "ForRangeStatement",
          loopId: "loop_1",
          label: "loop",
          valueIdentifier: "v",
          indexIdentifier: "i",
          start: {
            kind: "NumericLiteral",
            value: 0,
          },
          end: {
            kind: "NumericLiteral",
            value: 10,
          },
          inclusive: false,
          body: [],
        },
      ],
    })
  })
})
