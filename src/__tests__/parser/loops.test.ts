import { parse } from "../../frontend/parser";

describe("Parser - Loops", () => {
  const testCases = [
    { description: "should parse infinite for loop", code: "for { }" },
    { description: "should parse for loop with condition", code: "for i < 10 { }" },
    {
      description: "should parse for loop with initializer, condition and update",
      code: "for var i = 0; i < 10; i = i + 1 { }",
    },
    { description: "should parse for in loop", code: "for var i,v in arr { }" },
    { description: "should parse for range loop", code: "for var i,v in range 0 to 10 { }" },
    {
      description: "should parse for range loop with step",
      code: "for var i,v in range 0 through 10 step 2 { }",
    },
    { description: "should parse for loop with label", code: "for label loop { }" },
    {
      description: "should parse for loop with label and condition",
      code: "for i < 10 label loop { }",
    },
    {
      description: "should parse for loop with label, initializer, condition and update",
      code: "for var i = 0; i < 10; i = i + 1 label loop { }",
    },
    {
      description: "should parse for in range loop with label",
      code: "for var i,v in range 0 to 10 label loop { }",
    },
    { description: "should parse for loop with break statement", code: "for { break }" },
    {
      description: "should parse nested for loop with break statement with correct loop id",
      code: "for { for { break } }",
    },
    {
      description: "should parse nested for loop with label and break statement with correct loop id",
      code: "for label outer { for label inner { break outer } break }",
    },
  ];

  testCases.forEach(({ description, code }) => {
    it(description, () => {
      const ast = parse("test", code);
      expect(ast).toMatchSnapshot();
    });
  });

  it("should not parse break statement outside of loop", () => {
    const code = "break";
    expect(() => parse("test", code)).toThrow("Unexpected break statement outside of loop.");
  });
});
