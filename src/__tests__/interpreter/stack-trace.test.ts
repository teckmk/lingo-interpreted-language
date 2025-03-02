import { interpret } from "../../runtime/interpreter";

describe("Interpreter - Stack Trace", () => {
  it("should print stack trace", () => {
    const code = `
        fn foo() {
            bar()
        }

        fn bar() {
            baz()
        }

        fn baz() {
            const x = 5
            x = 10
        }

        foo()
    `;

    const stackTrace = interpret("test", code);

    expect(stackTrace).toMatchSnapshot();
  });
});
