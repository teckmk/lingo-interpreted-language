import { tokenize } from "../../frontend/lexer/tokenizer";

describe("Tokenizer - Indented Code Blocks", () => {
  const processTokens = (code: string) => {
    return tokenize("test", code);
  };

  it("should tokenize indented code block", () => {
    const code = `fn foo():
    x = 10
    y = 20
`;
    expect(processTokens(code)).toMatchSnapshot();
  });

  it("should tokenize nested and indented code block", () => {
    const code = `
fn foo():
    if (x > 10):
        y = 20`;

    expect(processTokens(code)).toMatchSnapshot();
  });

  it("should tokenize nested indented code block with variable indentation", () => {
    const code = `
fn foo():
    if (x > 10):
        y = 20
    return y
foo()`;

    expect(processTokens(code)).toMatchSnapshot();
  });

  it("should tokenize indented code block with variable indentation", () => {
    const code = `
a:
    b:
        c
    d:
        e
        f
    g
h

k`;

    expect(processTokens(code)).toMatchSnapshot();
  });

  it("should not insert indent/dedent tokens when in regular code block (inside { and })", () => {
    const code = `
fn foo(){
    if (x > 10):
      y = 20
    
    return y
}
foo()`;

    expect(() => processTokens(code)).toThrow("IndentationError: Invalid indentation at 5:1");
  });
});
