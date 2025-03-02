import { specs } from "../../frontend/lexer/specs";
import { Tokenizer } from "../../frontend/lexer/tokenizer";

describe("Tokenizer - Literals", () => {
  const tokenizer = new Tokenizer(specs, "test");

  const testCases = [
    { name: "integers", code: "10" },
    { name: "positive integers", code: "+10" },
    { name: "negative integers", code: "-10" },
    { name: "floats", code: "10.5" },
    { name: "positive floats", code: "+10.5" },
    { name: "negative floats", code: "-10.5" },
    { name: "strings", code: '"hello world"' },
    { name: "strings with escaped characters", code: '"hello "world""' },
  ];

  testCases.forEach(({ name, code }) => {
    it(`should tokenize ${name}`, () => {
      expect(tokenizer.tokenize(code)).toMatchSnapshot();
    });
  });
});
