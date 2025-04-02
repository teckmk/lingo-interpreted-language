import { parse } from "../../frontend/parser";

describe("Parser - Contracts", () => {
  it("should parse contracts", () => {
    const code = `
        type Point = contract {
            fn setPoint(x:number, y:number) -> void
            get x -> number
            get y -> number
        }`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse contract fullfillment", () => {
    const code = `
        type Point = contract {
            fn setPoint(x:number, y:number) -> void
            get x -> number
            get y -> number
        }

        type Point3D = struct {
            x: number
            y: number
            z: number
        }

        fulfill Point for Point3D {
            fn setPoint(self, x:number, y:number) -> void {
                self.x = x
                self.y = y
            }
            get x(self) -> number {
                self.x
            }
            get y(self) -> number {
                self.y
            }
        }`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse contract fullfillment with generic parameters", () => {
    const code = `
       type Point<T> = contract {
            fn setPoint(x:T, y:T) -> void
            get x -> T
            get y -> T
        }

        type Point3D = struct {
            x: number
            y: number
            z: number
        }

        fulfill Point<number> for Point3D {
            fn setPoint(self, x:number, y:number) -> void {
                self.x = x
                self.y = y
            }
            get x(self) -> number {
                self.x
            }
            get y(self) -> number {
                self.y
            }
        }`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse contract with indented body", () => {
    const code = `
type Point = contract:
    fn setPoint(x:number, y:number) -> void
    get x -> number
    get y -> number
`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });

  it("should parse contract fullfillment with indented body", () => {
    const code = `
type Point = contract:
    fn setPoint(x:number, y:number) -> void
    get x -> number
    get y -> number

fulfill Point for Point3D:
    fn setPoint(self, x:number, y:number) -> void:
        self.x = x
        self.y = y
    get x(self) -> number:
        self.x
    get y(self) -> number:
        self.y
`;
    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();
  });
});
