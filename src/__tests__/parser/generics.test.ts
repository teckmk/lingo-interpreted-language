import { parse } from "../../frontend/parser";

describe("Parser - Generics", () => {
  it("should parse generics", () => {
    const code = `type Box<T> struct { \n      value: T \n    }`;
    const runtimeVal = parse("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });
  it("should parse generics with multiple type parameters", () => {
    const code = `type Pair<T, U> struct { \n      first: T \n      second: U \n    }`;
    const runtimeVal = parse("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });
  it("should parse generics with type parameters with constraints", () => {
    const code = `type Box<T: number> struct { \n      value: T \n    }`;
    const runtimeVal = parse("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });
  it("should parse generics with type parameters with constraints and multiple constraints", () => {
    const code = `type Box<T: number | string> struct { \n      value: T \n    }`;
    const runtimeVal = parse("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });
  it("should parse generics with type parameters with constraints and multiple constraints and multiple type parameters", () => {
    const code = `type Pair<T: number | string, U: number> struct { \n      first: T \n      second: U \n    }`;
    const runtimeVal = parse("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });
});

describe("Parser - Generics - Instantiation", () => {
  it("should interpret generic type instantiation", () => {
    const code = `type Box<T> struct { \n      value: T \n    }
      let box = Box<number> { value: 10 }`;
    const runtimeVal = parse("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });
  it("should parse generic type instantiation with multiple type parameters", () => {
    const code = `type Pair<T, U> struct { \n      first: T \n      second: U \n    }
      let pair = Pair<number, string> { first: 10, second: "hello" }`;
    const runtimeVal = parse("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });
  it("should parse generic type instantiation with type parameters with constraints", () => {
    const code = `type Box<T: number> struct { \n      value: T \n    }
      let box = Box<number> { value: 10 }`;
    const runtimeVal = parse("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });
  it("should parse generic type instantiation with type parameters with constraints and multiple constraints", () => {
    const code = `type Box<T: number | string> struct { \n      value: T \n    }
      let box = Box<number> { value: 10 }`;
    const runtimeVal = parse("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });
  it("should parse generic type instantiation with type parameters with constraints and multiple constraints and multiple type parameters", () => {
    const code = `type Pair<T: number | string, U: number> struct { \n      first: T \n      second: U \n    }
      let pair = Pair<number, number> { first: 10, second: 20 }`;
    const runtimeVal = parse("test", code);
    expect(runtimeVal).toMatchSnapshot();
  });
});
