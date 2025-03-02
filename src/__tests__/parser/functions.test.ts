import { parse } from "../../frontend/parser";

describe("Parser - FunctionDeclaration", () => {
  it("should parse function declarations without parameters", () => {
    const code = "fn a() {}";
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse function declarations with parameters", () => {
    const code = "fn a(b: number, c: string) {}";
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse function declarations with return type", () => {
    const code = "fn a() -> number {}";
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse function declarations with multiple return types", () => {
    const code = "fn a() -> number, string {}";
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse function declarations with parameters and return type", () => {
    const code = "fn a(b: number, c: string) -> number {}";
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse function declarations with body", () => {
    const code = "fn a() { return 1 }";
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse function declarations with parameters and body", () => {
    const code = "fn a(b: number, c: string) { return 1 }";
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse function declarations with return type and body", () => {
    const code = "fn a() -> number { return 1 }";
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse function declarations with multiple return values", () => {
    const code = `fn a() -> number, number { \n      return 1, 2 \n    }`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse function declarations with parameters, return type and body", () => {
    const code = "fn a(b: number, c: string) -> number { return 1 }";
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse function declarations with multiple statements in body", () => {
    const code = `fn a() { \n      var b = 1\n      return b \n    }`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse function declarations with indented code block", () => {
    const code = `fn a():\n      var b = 1\n      return b`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse function declarations with indented code block and return type", () => {
    const code = `fn a() -> number:\n      var b = 1\n      return b`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });
});
