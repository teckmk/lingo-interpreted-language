import { interpret } from "../../runtime/interpreter";

describe("Interpreter - Contracts", () => {
  it("should interpret contracts", () => {
    const code = `
        type Point contract {
            fn setPoint(x:number, y:number) -> void
            get x -> number
            get y -> number
        }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });

  it("should interpret contract fullfillment", () => {
    const code = `
        type Point contract {
            fn setPoint(x:number, y:number) -> void
            get x -> number
            get y -> number
        }

        type Point3D struct {
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
        }
`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });

  it("should not interpret contract fullfillment with wrong function signature", () => {
    const code = `
        type Point contract {
            fn setPoint(x:number, y:number) -> void
            get x -> number
        }
        type Point3D struct {
            x: number
            y: number
            z: number
        }
        fulfill Point for Point3D {
            fn setPoint(self, x:number) -> void {
                self.x = x
            }
            get x(self) -> number {
                self.x
            }
        }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toEqual("Method setPoint(number) -> void of struct Point3D, does not satisfy signature Point.setPoint(number, number) -> void.\n");
  });

  it("should not interpret contract fullfillment with missing implementation", () => {
    const code = `
        type Point contract {
            fn setPoint(x:number, y:number) -> void
            get x -> number
        }
        type Point3D struct {
            x: number
            y: number
            z: number
        }
        fulfill Point for Point3D {
            fn setPoint(self, x:number, y:number) -> void {
                self.x = x
            }
          
        }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toEqual("Implementation of contract Point is missing method x, for struct Point3D.\n");
  });
});
