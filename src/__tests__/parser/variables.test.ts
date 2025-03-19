import { parse } from "../../frontend/parser";

describe("Parser - Statements", () => {
  const testParse = (code: string) => parse("test", code);

  it("should parse various variable declarations", () => {
    const testCases = [
      "let mut a",
      "let mut a: number",
      "const a = 10",
      "const a: number = 10",
      "let mut a, b",
      "let mut a: number, b: number",
      "let mut a = 10, b = 20",
      "let mut a: number = 10, b: number = 20",
      "let mut a, b = 20",
      "let mut a: number, b: number = 20",
      "let mut a: dynamic = 10\na = 20",
    ];

    testCases.forEach((code) => {
      expect(testParse(code)).toMatchSnapshot();
    });
  });

  it("should throw errors for invalid constant/final declarations", () => {
    const errorCases = [
      { code: "const a: number", error: "Must assign a value to constant expression." },
      { code: "const a", error: "Must assign a value to constant expression." },
      { code: "let a: number", error: "Must assign a value to final expression." },
      { code: "let a", error: "Must assign a value to final expression." },
    ];

    errorCases.forEach(({ code, error }) => {
      expect(() => testParse(code)).toThrow(error);
    });
  });
});
