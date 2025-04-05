import { parse } from "../../frontend/parser";

describe("Parser - Alias", () => {
  it("should parse alias", () => {
    const code = `alias User = Response`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse alias for generic type", () => {
    const code = `alias User<T> = Response<T>`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse alias for function signature", () => {
    const code = `alias Callback = fn (x: number) -> number`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse alias for function signature with name", () => {
    const code = `alias Callback = fn callback (x: number) -> number`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse alias for function signature with name and type parameters", () => {
    const code = `alias Callback = fn callback<T, U> (x: T) -> U`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse alias for getter", () => {
    const code = `alias GetUser = get user -> User`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should not parse alias for struct literal", () => {
    const code = `alias User = struct { name: string }`;
    expect(() => parse("test", code)).toThrow();
  });

  it("should not parse alias for contract literal", () => {
    const code = `alias User = contract { fn setPoint(x:number, y:number) -> void }`;
    expect(() => parse("test", code)).toThrow();
  });
});
