import { parse } from "../../frontend/parser";

describe("Parser - If Else Statements", () => {
  it("should parse if statements", () => {
    const code = "if a < 10 { }";
    const ast = parse("test", code);

    expect(ast).toMatchSnapshot();
  });

  it("should parse if else statements", () => {
    const code = "if a < 10 { a = 10 } else { a = 20 }";
    const ast = parse("test", code);

    expect(ast).toMatchSnapshot();
  });

  it("should parse if else if statements", () => {
    const code = "if a < 10 { a = 10 } else if a < 20 { a = 20 }";
    const ast = parse("test", code);

    expect(ast).toMatchSnapshot();
  });
});
