import { parse } from "../../frontend/parser";

describe("Parser - Contracts", () => {
  it("should parse contracts", () => {
    const code = `type Point = contract {
            fn setPoint(x:number, y:number) -> void
            get x -> number
            get y -> number
        }`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });
});
