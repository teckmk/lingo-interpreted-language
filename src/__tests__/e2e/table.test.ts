import { parse } from "../../frontend/parser";
import { interpret } from "../../runtime/interpreter";

describe("Table - E2E", () => {
  it("should interpret table of 5", () => {
    const code = `
fn printTable(n: number) -> string {
    let mut table: string = ""
    for let mut i,v in range 1 to 10 {
        let result = n * v
        table = table + "$n x $v = $result" + "\n"
    }

    return table
}

printTable(5)

`;

    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();

    const val = interpret("test", code);
    expect(val).toEqual({
      returned: true,
      type: "return",
      value: {
        returned: false,
        type: "string",
        value: `5 x 1 = 5
5 x 2 = 10
5 x 3 = 15
5 x 4 = 20
5 x 5 = 25
5 x 6 = 30
5 x 7 = 35
5 x 8 = 40
5 x 9 = 45
`,
      },
    });
  });

  it("should interpret table of 5, with inclusive range", () => {
    const code = `
fn printTable(n: number) -> string {
    let mut table: string = ""
    for let mut i,v in range 1 through 10 {
        let result = n * v
        table = table + "$n x $v = $result" + "\n"
    }

    return table
}

printTable(5)

`;

    const ast = parse("test", code);
    expect(ast).toMatchSnapshot();

    const val = interpret("test", code);
    expect(val).toEqual({
      returned: true,
      type: "return",
      value: {
        returned: false,
        type: "string",
        value: `5 x 1 = 5
5 x 2 = 10
5 x 3 = 15
5 x 4 = 20
5 x 5 = 25
5 x 6 = 30
5 x 7 = 35
5 x 8 = 40
5 x 9 = 45
5 x 10 = 50
`,
      },
    });
  });

  it("should interpret for range loop over array", () => {
    const code = `
    let mut arr = [1, 2, 3, 4, 5]
    let mut sum = 0

    for let mut i,v in arr {
        sum = sum + v
    }

    sum
    `;

    const val = interpret("test", code);

    expect(val).toEqual({
      returned: false,
      type: "number",
      value: 15,
    });
  });

  it("should interpret for range loop over string", () => {
    const code = `
    let mut str = "hello"
    let mut result = ""

    for let mut i,v in str {
        result = result + " " + v
    }

    result
    `;

    const val = interpret("test", code);

    expect(val).toEqual({
      returned: false,
      type: "string",
      value: " h e l l o",
    });
  });

  it("should interpret for range loop over string with direct assignment", () => {
    // This is how variable mutability works when using for loop
    // 1. Interpreter creates a temporary variable for the loop (inside the loop scope)
    // 2. Then evaluates the loop
    // 3. Interpreter creates a new variable in parent scope with the same name
    const code = `
    let result = for let mut i,v in "hello" {
        result = result + " " + v
    }

    result
    `;

    const val = interpret("test", code);

    expect(val).toEqual({
      returned: false,
      type: "string",
      value: " h e l l o",
    });
  });

  it("should skip iteration if skip keyword is used", () => {
    const code = `
    let result = for let mut i,v in "hello" {
        if (v == "h") {
            skip
        }
        result = result + " " + v
    }

    result
    `;

    const val = interpret("test", code);

    expect(val).toEqual({
      returned: false,
      type: "string",
      value: " e l l o",
    });
  });

  it("should skip iteration if break keyword is used", () => {
    const code = `
    let result = ""
    
    for let mut i,v in "hello" {
        if (v == "e") {
            break
        }
        result = result + " " + v
    }

    result
    `;

    const val = interpret("test", code);

    expect(val).toEqual({
      returned: false,
      type: "string",
      value: " h",
    });
  });
});
