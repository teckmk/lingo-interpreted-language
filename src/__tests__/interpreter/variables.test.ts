import { interpret } from "../../runtime/interpreter"

describe("Interpreter - Variables", () => {
  it("should interpret var declaration", () => {
    const code = `var x = 5`

    const runtimeVal = interpret("test", code)

    expect(runtimeVal).toEqual({ type: "number", value: 5 })
  })

  it("should interpret shorthand var declaration", () => {
    const code = `var a = 5, b = 6, c = 7`

    const runtimeVal = interpret("test", code)

    expect(runtimeVal).toEqual({
      type: "array",
      returned: false,
      elements: [
        { type: "number", value: 5 },
        { type: "number", value: 6 },
        { type: "number", value: 7 },
      ],
    })
  })

  it("should interpret constant declaration", () => {
    const code = `const x = 5`

    const runtimeVal = interpret("test", code)

    expect(runtimeVal).toEqual({ type: "number", value: 5 })
  })

  it("should interpret constant shorthand declaration", () => {
    const code = `const a = 5, b = 6, c = 7`

    const runtimeVal = interpret("test", code)

    expect(runtimeVal).toEqual({
      type: "array",
      returned: false,
      elements: [
        { type: "number", value: 5 },
        { type: "number", value: 6 },
        { type: "number", value: 7 },
      ],
    })
  })

  it("should interpret final declaration", () => {
    const code = `final x = 5`

    const runtimeVal = interpret("test", code)

    expect(runtimeVal).toEqual({ type: "number", value: 5 })
  })

  it("should interpret final shorthand declaration", () => {
    const code = `final a = 5, b = 6, c = 7`

    const runtimeVal = interpret("test", code)

    expect(runtimeVal).toEqual({
      type: "array",
      returned: false,
      elements: [
        { type: "number", value: 5 },
        { type: "number", value: 6 },
        { type: "number", value: 7 },
      ],
    })
  })

  it("should update variable value after assignment", () => {
    const code = `var x = 5
     x = 10`

    const runtimeVal = interpret("test", code)

    expect(runtimeVal).toEqual({ type: "number", value: 10 })
  })

  it("should not allow constant reassignment", () => {
    const code = `const x = 5
     x = 10`

    expect(() => {
      interpret("test", code)
    }).toThrow("Cannot assign to a constant variable")
  })

  it("should not allow final reassignment", () => {
    const code = `final x = 5
     x = 10`

    expect(() => {
      interpret("test", code)
    }).toThrow("Cannot assign to a final variable")
  })

  it("should type infer types in variable assignment", () => {
    const code = `var x = 5
     x = "string"`

    expect(() => {
      interpret("test", code)
    }).toThrow("Can't assign a value of type string to a variable of type number")
  })

  it("should allow variable reassignment with different type of dynamic type", () => {
    const code = `var x: dynamic = 5
     x = "string"`

    const runtimeVal = interpret("test", code)

    expect(runtimeVal).toEqual({ type: "string", value: "string" })
  })
})
