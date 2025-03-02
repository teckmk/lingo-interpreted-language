import { specs } from "../../frontend/lexer/specs";
import { Tokenizer } from "../../frontend/lexer/tokenizer";

describe("Tokenizer - Reserved Words", () => {
  const testCases = [
    { code: "var", description: "let" },
    { code: "const", description: "const" },
    { code: "final", description: "final" },
    { code: "fn", description: "fn" },
    { code: "return", description: "return" },
    { code: "if", description: "if" },
    { code: "else", description: "else" },
    { code: "while", description: "while" },
    { code: "number", description: "number type" },
    { code: "string", description: "string type" },
    { code: "bool", description: "boolean type" },
    { code: "dynamic", description: "dynamic type" },
  ];

  testCases.forEach(({ code, description }) => {
    it(`should tokenize ${description}`, () => {
      const tokens = new Tokenizer(specs, "test").tokenize(code);
      expect(tokens).toMatchSnapshot();
    });
  });
});
