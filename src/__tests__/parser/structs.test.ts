import { parse } from "../../frontend/parser";

describe("Parser - Structs", () => {
  it("should parse structs", () => {
    const code = `type Point struct { \n      x: number \n      y: number \n    }`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse struct intialization", () => {
    const code = `let p = Point { x: 1, y: 2 }`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });
});

/*
type Point = struct {
    x: number
    y: number
}

type Name = string

type Students = Student[]

type Nodes = map<string, Node>

*/
