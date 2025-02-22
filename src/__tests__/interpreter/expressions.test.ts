import { interpret } from "../../runtime/interpreter"

describe("Interpreter - Arithmetic - Binary Expressions", () => {
  it("should interpret expressions 1", () => {
    const code = "1 + 2"

    const runtimeVal = interpret("test", code)

    expect(runtimeVal).toEqual({ type: "number", value: 3, returned: false })
  })

  it("should interpret expressions 2", () => {
    const code = "1 + 2 * 3"

    const runtimeVal = interpret("test", code)

    expect(runtimeVal).toEqual({ type: "number", value: 7, returned: false })
  })

  it("should interpret expressions 3", () => {
    const code = "5 - 2 * 3"

    const runtimeVal = interpret("test", code)

    expect(runtimeVal).toEqual({ type: "number", value: -1, returned: false })
  })

  it("should interpret parenthesized expressions 1", () => {
    const code = "(1 + 2) * 3"

    const runtimeVal = interpret("test", code)

    expect(runtimeVal).toEqual({ type: "number", value: 9, returned: false })
  })

  it("should interpret parenthesized expressions 2", () => {
    const code = "1 + (2 * 3)"

    const runtimeVal = interpret("test", code)

    expect(runtimeVal).toEqual({ type: "number", value: 7, returned: false })
  })

  it("should interpret parenthesized expressions 3", () => {
    const code = "1 + (2 * (3 + 4))"

    const runtimeVal = interpret("test", code)

    expect(runtimeVal).toEqual({ type: "number", value: 15, returned: false })
  })
})
