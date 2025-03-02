import { interpret } from "../../runtime/interpreter";

describe("Interpreter - Arithmetic - Binary Expressions", () => {
  it("should interpret expressions 1", () => {
    const code = "1 + 2";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "number", value: 3, returned: false });
  });

  it("should interpret expressions 2", () => {
    const code = "1 + 2 * 3";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "number", value: 7, returned: false });
  });

  it("should interpret expressions 3", () => {
    const code = "5 - 2 * 3";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "number", value: -1, returned: false });
  });

  it("should interpret parenthesized expressions 1", () => {
    const code = "(1 + 2) * 3";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "number", value: 9, returned: false });
  });

  it("should interpret parenthesized expressions 2", () => {
    const code = "1 + (2 * 3)";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "number", value: 7, returned: false });
  });

  it("should interpret parenthesized expressions 3", () => {
    const code = "1 + (2 * (3 + 4))";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "number", value: 15, returned: false });
  });
});

describe("Interpreter - Boolean - Binary Expressions", () => {
  it("should interpret expressions 1", () => {
    const code = "true && false";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: false, returned: false });
  });

  it("should interpret expressions 2", () => {
    const code = "true || false";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: true, returned: false });
  });

  it("should interpret expressions 3", () => {
    const code = "true && true";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: true, returned: false });
  });

  it("should interpret expressions 4", () => {
    const code = "true || true";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: true, returned: false });
  });

  it("should interpret expressions 5", () => {
    const code = "5 == 5";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: true, returned: false });
  });

  it("should interpret expressions 6", () => {
    const code = "5 != 5";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: false, returned: false });
  });

  it("should interpret expressions 7", () => {
    const code = "5 > 6";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: false, returned: false });
  });

  it("should interpret expressions 8", () => {
    const code = "5 < 6";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: true, returned: false });
  });

  it("should interpret expressions 9", () => {
    const code = "5 >= 5";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: true, returned: false });
  });

  it("should interpret expressions 10", () => {
    const code = "5 <= 5";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: true, returned: false });
  });

  it("should interpret expressions 11", () => {
    const code = "5 + 1 == 6";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: true, returned: false });
  });

  it("should interpret parenthesized expressions 1", () => {
    const code = "true && (true || false)";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: true, returned: false });
  });

  it("should interpret parenthesized expressions 2", () => {
    const code = "true || (true && false)";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: true, returned: false });
  });

  it("should interpret parenthesized expressions 3", () => {
    const code = "(true && true) || (true && false)";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: true, returned: false });
  });

  it("should interpret parenthesized expressions 4", () => {
    const code = "5 > (6 - 1)";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: false, returned: false });
  });

  it("should interpret parenthesized expressions 5", () => {
    const code = "(5 + 1) == 6";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: true, returned: false });
  });

  it("should interpret parenthesized expressions 6", () => {
    const code = "(5 + 1) == (6 - 1)";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: false, returned: false });
  });

  it("should interpret parenthesized expressions 7", () => {
    const code = "(5 + 1) == (6 - 1) || true";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: true, returned: false });
  });

  it("should interpret parenthesized expressions 8", () => {
    const code = "(5 + 1) == (6 - 1) && true";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: false, returned: false });
  });

  it("should interpret parenthesized expressions 9", () => {
    const code = "10 > 5 && 10 < 11";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: true, returned: false });
  });

  it("should interpret parenthesized expressions 10", () => {
    const code = "10 > 5 && 10 > 11";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: false, returned: false });
  });

  it("should interpret parenthesized expressions 11", () => {
    const code = "10 > 5 || 10 > 11 && 11 > 10";

    const runtimeVal = interpret("test", code);

    expect(runtimeVal).toEqual({ type: "boolean", value: true, returned: false });
  });
});
