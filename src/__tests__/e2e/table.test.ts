import { parse } from "../../frontend/parser";
import { interpret } from "../../runtime/interpreter";

describe("Table - E2E", () => {
  it("should interpret table of 5", () => {
    const code = `
fn printTable(n: number) -> string {
    let mut table: string = ""
    for let mut i,v in range 1 to 10 {
        let result = n * i
        table = table + "$n x $i = $result" + "\n"
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
        value: `5 x 0 = 0
5 x 1 = 5
5 x 2 = 10
5 x 3 = 15
5 x 4 = 20
5 x 5 = 25
5 x 6 = 30
5 x 7 = 35
5 x 8 = 40
`,
      },
    });
  });
});
