import { interpret } from "../../runtime/interpreter";

describe("Interpreter - Structs", () => {
  it("should interpret structs", () => {
    const code = `type Point = struct { \n      x: number \n      y: number \n    }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });

  it("should interpret structs with optional fields", () => {
    const code = `type Point = struct { \n      x: number \n      y: number? \n    }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });

  it("should interpret struct instantiation", () => {
    const code = `
    type Point = struct { 
        x: number
        y: number?
    }    
    let p = Point { x: 1, y: 2}`;

    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toEqual({
      type: "object",
      properties: new Map([
        ["x", { type: "number", value: 1 }],
        ["y", { type: "number", value: 2 }],
      ]),
      returned: false,
    });
  });

  it("should interpret struct instantiation with missing values for optional fields", () => {
    const code = `
    type Point = struct { 
        x: number
        y: number?
    }    
    let p = Point { x: 1 }`;

    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toEqual({
      type: "object",
      properties: new Map([
        ["x", { type: "number", value: 1 }],
        ["y", { type: "null", value: null }],
      ]),
      returned: false,
    });
  });

  it("should interpret struct with struct type fields", () => {
    const code = `
    type Point = struct { 
        x: number
        y: number
    }
    type Location = struct {
        point: Point
        name: string
    }
    let loc = Location { point: Point { x: 1, y: 2 }, name: "Home"}`;

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({
      type: "object",
      properties: new Map([
        [
          "point",
          {
            type: "object",
            properties: new Map([
              ["x", { type: "number", value: 1 }],
              ["y", { type: "number", value: 2 }],
            ]),
            returned: false,
          },
        ],
        ["name", { type: "string", value: "Home" }],
      ]),
      returned: false,
    });
  });

  it("should not interpret struct instantiation with missing values for required fields", () => {
    const code = `
    type Point = struct { 
        x: number
        y: number
    }    
    let p = Point { x: 1 }`;

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual("Missing required field 'y' in struct 'Point'\n");
  });

  it("should not interpret struct instantiation with unknown fields", () => {
    const code = `  
    type Point = struct { 
        x: number
        y: number
    }    
    let p = Point { x: 1, y: 2, z: 3 }`;

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual("Unknown field 'z' in struct 'Point'\n");
  });

  it("should not interpret if struct is not resolved", () => {
    const code = `
    let p = Point { x: 1, y: 2 }`;

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual("Unable to resolve type Point\n");
  });

  it("should not interpret if struct field type is not matched", () => {
    const code = `
    type Point = struct { 
        x: number
        y: string
    }    
    let p = Point { x: 1, y: 2 }`;

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual("Field 'y' in struct 'Point' must be of type 'string', but got 'number'\n");
  });

  it("should not interpret if type is not a struct", () => {
    const code = `
    type Point = number
    let p = Point { x: 1, y: 2 }`;

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual("Type 'Point' is not a struct\n");
  });
});
