import { interpret } from "../../runtime/interpreter";

describe("Interpreter - Type/Alias", () => {
  it("should match nominal type by name", () => {
    const code = `
type Person struct {
    name: string
}

type Person2 struct {
    name: string
}

let p: Person = Person2 { name: "John" }
`;
    const ast = interpret("test", code);
    expect(ast).toEqual("Type mismatch: Cannot assign value of type Person2 to variable of type Person\n");
  });

  it("should match structural type by value", () => {
    const code = `
type Person struct {
    name: string
}

alias Person2 = Person

let p: Person = Person2 { name: "John" }
`;
    const ast = interpret("test", code);
    expect(ast).toEqual({
      type: "object",
      instanceOf: "Person",
      properties: new Map([["name", { type: "string", value: "John" }]]),
      returned: false,
    });
  });
});
