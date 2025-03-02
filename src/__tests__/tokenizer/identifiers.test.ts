import { specs } from "../../frontend/lexer/specs";
import { Tokenizer } from "../../frontend/lexer/tokenizer";

describe("Tokenizer - Identifiers", () => {
  it("should tokenize identifiers", () => {
    const code = "x";
    const tokens = new Tokenizer(specs, "test").tokenize(code);
    expect(tokens).toMatchSnapshot();
  });

  it("should tokenize identifiers with capital letters", () => {
    const code = "X";
    const tokens = new Tokenizer(specs, "test").tokenize(code);
    expect(tokens).toMatchSnapshot();
  });

  it("should tokenize identifiers with mixed case", () => {
    const code = "xY";
    const tokens = new Tokenizer(specs, "test").tokenize(code);
    expect(tokens).toMatchSnapshot();
  });

  it("should tokenize identifiers with numbers", () => {
    const code = "x1";
    const tokens = new Tokenizer(specs, "test").tokenize(code);
    expect(tokens).toMatchSnapshot();
  });

  it("should tokenize identifiers with underscores", () => {
    const code = "x_";
    const tokens = new Tokenizer(specs, "test").tokenize(code);
    expect(tokens).toMatchSnapshot();
  });

  it("should tokenize identifiers with underscores and numbers", () => {
    const code = "x_1";
    const tokens = new Tokenizer(specs, "test").tokenize(code);
    expect(tokens).toMatchSnapshot();
  });

  it("should tokenize identifiers with numbers and trailing underscores", () => {
    const code = "x1_";
    const tokens = new Tokenizer(specs, "test").tokenize(code);
    expect(tokens).toMatchSnapshot();
  });

  it("should tokenize identifiers with leading underscores", () => {
    const code = "_x";
    const tokens = new Tokenizer(specs, "test").tokenize(code);
    expect(tokens).toMatchSnapshot();
  });
});
