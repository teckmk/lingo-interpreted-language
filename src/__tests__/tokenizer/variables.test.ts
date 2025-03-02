import { tokenize, Tokenizer } from "../../frontend/lexer/tokenizer";
import { specs } from "../../frontend/lexer/specs";

describe("Tokenizer - Variable Declarations", () => {
  const tokenizer = new Tokenizer(specs, "test");
  const testCases = [
    { name: "var declaration", code: "var x = 10" },
    { name: "const declaration", code: "const y = 20" },
    { name: "final declaration", code: "final z = 30" },
    { name: "multiple var declarations", code: "var a = 1, b = 2, c = 3" },
  ];

  testCases.forEach(({ name, code }) => {
    it(`should tokenize ${name}`, () => {
      expect(tokenizer.tokenize(code)).toMatchSnapshot();
    });
  });
});

describe("Tokenizer - Variable Assignments", () => {
  it("should tokenize var assignment", () => {
    const code = `var a: dynamic = 10\n    a = 20`;
    expect(tokenize("test", code)).toMatchSnapshot();
  });
});
