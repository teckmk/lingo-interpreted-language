import { specs } from "../../frontend/lexer/specs";
import { Tokenizer } from "../../frontend/lexer/tokenizer";

describe("Tokenizer - Operators", () => {
  const testCases = [
    { input: "+", description: "should tokenize +" },
    { input: "-", description: "should tokenize -" },
    { input: "*", description: "should tokenize *" },
    { input: "/", description: "should tokenize /" },
    { input: "=", description: "should tokenize =" },
    { input: "!", description: "should tokenize !" },
    { input: "!=", description: "should tokenize !=" },
    { input: "==", description: "should tokenize ==" },
    { input: "<", description: "should tokenize <" },
    { input: "<=", description: "should tokenize <=" },
    { input: ">", description: "should tokenize >" },
    { input: ">=", description: "should tokenize >=" },
    { input: "&&", description: "should tokenize &&" },
    { input: "||", description: "should tokenize ||" },
    { input: "and", description: "should tokenize 'and'" },
    { input: "or", description: "should tokenize 'or'" },
    { input: ".", description: "should tokenize ." },
    { input: ",", description: "should tokenize ," },
    { input: ":", description: "should tokenize :" },
    { input: "++", description: "should tokenize ++" },
    { input: "--", description: "should tokenize --" },
    { input: "**", description: "should tokenize **" },
    { input: "%", description: "should tokenize %" },
  ];

  testCases.forEach(({ input, description }) => {
    it(description, () => {
      const tokens = new Tokenizer(specs, "test").tokenize(input);
      expect(tokens).toMatchSnapshot();
    });
  });
});
