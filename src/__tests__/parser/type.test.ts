import { parse } from "../../frontend/parser";

describe("Parser - Type", () => {
  it("should parse type with function signature", () => {
    const code = `type Callback fn (x: number) -> number`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse type with function signature with type parameters", () => {
    const code = `type Callback fn cb<T, U> (x: T) -> U`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse type for getter", () => {
    const code = `type GetUser get user -> User`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse type for getter with type parameters", () => {
    const code = `type GetUser get user<T> -> User<T>`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });
});
