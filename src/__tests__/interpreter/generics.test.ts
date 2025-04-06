import { interpret } from "../../runtime/interpreter";

describe("Interpreter - Generics", () => {
  it("should interpret generics", () => {
    const code = `type Box<T> struct { \n      value: T \n    }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });
  it("should interpret generics with multiple type parameters", () => {
    const code = `type Pair<T, U> struct { \n      first: T \n      second: U \n    }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });
  it("should interpret generics with type parameters with constraints", () => {
    const code = `type Box<T: number> struct { \n      value: T \n    }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });
  it("should interpret generics with type parameters with constraints and multiple constraints", () => {
    const code = `type Box<T: number | string> struct { \n      value: T \n    }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });
  it("should interpret generics with type parameters with constraints and multiple constraints and multiple type parameters", () => {
    const code = `type Pair<T: number | string, U: number> struct { \n      first: T \n      second: U \n    }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });
});

describe("Interpreter - Generics - Instantiation", () => {
  it("should interpret generic type instantiation", () => {
    const code = `type Box<T> struct { \n      value: T \n    }
      let box = Box<number> { value: 10 }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toEqual({
      type: "object",
      returned: false,
      instanceOf: "Box",
      properties: new Map([["value", { type: "number", value: 10 }]]),
    });
  });

  it("should interpret generic type instantiation with multiple type parameters", () => {
    const code = `type Pair<T, U> struct { \n      first: T \n      second: U \n    }
      let pair = Pair<number, string> { first: 10, second: "hello" }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toEqual({
      type: "object",
      returned: false,
      instanceOf: "Pair",
      properties: new Map([
        ["first", { type: "number", value: 10 }],
        ["second", { type: "string", value: "hello" }],
      ]),
    });
  });

  it("should interpret generic type instantiation with type parameters with constraints", () => {
    const code = `type Box<T: number> struct { \n      value: T \n    }
      let box = Box<number> { value: 10 }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toEqual({
      type: "object",
      returned: false,
      instanceOf: "Box",
      properties: new Map([["value", { type: "number", value: 10 }]]),
    });
  });

  it("should interpret generic type instantiation with type parameters with constraints and multiple constraints", () => {
    const code = `type Box<T: number | string> struct { \n      value: T \n    }
      let box = Box<number> { value: 10 }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toEqual({
      type: "object",
      returned: false,
      instanceOf: "Box",
      properties: new Map([["value", { type: "number", value: 10 }]]),
    });
  });

  it("should interpret generic type instantiation with type parameters with constraints and multiple constraints and multiple type parameters", () => {
    const code = `type Pair<T: number | string, U: number> struct { \n      first: T \n      second: U \n    }
      let pair = Pair<number, number> { first: 10, second: 20 }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toEqual({
      type: "object",
      returned: false,
      instanceOf: "Pair",
      properties: new Map([
        ["first", { type: "number", value: 10 }],
        ["second", { type: "number", value: 20 }],
      ]),
    });
  });

  it("should throw error for generic type instantiation with wrong type parameters", () => {
    const code = `type Box<T: number> struct { \n      value: T \n    }
        let box = Box<string> { value: "hello" }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toBe("Type argument string does not satisfy constraint number of type parameter T\n");
  });

  it("should throw error for generic union type instantiation with wrong type parameters", () => {
    const code = `type Pair<T: number | string, U: number> struct { \n      first: T \n      second: U \n    }
      let pair = Pair<bool, number> { first: 10, second: 20 }`;
    const runtimeVal = interpret("test", code);
    expect(runtimeVal).toEqual("Type argument bool does not satisfy constraint number | string of type parameter T\n");
  });
});
