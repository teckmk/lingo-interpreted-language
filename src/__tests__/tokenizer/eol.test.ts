import { Tokenizer } from "../../frontend/lexer/tokenizer";
import { specs } from "../../frontend/lexer/specs";

describe("Tokenizer - End of Line", () => {
  const tokenizer = new Tokenizer(specs, "test");

  it("should tokenize eol", () => {
    const code = `var x = 10
    var y = 20`;
    const tokens = tokenizer.tokenize(code);

    expect(tokens).toMatchSnapshot();
  });
});
