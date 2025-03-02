import { parse } from "../../frontend/parser";

describe("Parser - Expressions", () => {
  describe("Binary expressions", () => {
    it("should parse binary expressions", () => {
      const code = "1 + 2";
      const ast = parse("test", code);
      expect(ast).toMatchSnapshot();
    });

    it("should parse nested binary expressions", () => {
      const code = "1 + 2 * 3";
      const ast = parse("test", code);
      expect(ast).toMatchSnapshot();
    });

    it("should parse nested binary expressions with parenthesis", () => {
      const code = "(1 + 2) * 3";
      const ast = parse("test", code);
      expect(ast).toMatchSnapshot();
    });

    it("should parse nested binary expressions with parenthesis", () => {
      const code = "1 + (2 * 3)";
      const ast = parse("test", code);
      expect(ast).toMatchSnapshot();
    });

    it("should parse nested binary expressions with parenthesis", () => {
      const code = "1 + (2 * 3) + 4";
      const ast = parse("test", code);
      expect(ast).toMatchSnapshot();
    });
  });

  describe("Assignment expressions", () => {
    it("should parse assignment expressions", () => {
      const code = "a = 1";
      const ast = parse("test", code);
      expect(ast).toMatchSnapshot();
    });

    it("should parse nested assignment expressions", () => {
      const code = "a = b = 1";
      const ast = parse("test", code);
      expect(ast).toMatchSnapshot();
    });
  });

  describe("Member expressions", () => {
    it("should parse member expressions", () => {
      const code = "a.b";
      const ast = parse("test", code);
      expect(ast).toMatchSnapshot();
    });
  });

  describe("Call expressions", () => {
    it("should parse call expressions", () => {
      const code = "foo()";
      const ast = parse("test", code);
      expect(ast).toMatchSnapshot();
    });

    it("should parse call expressions with arguments", () => {
      const code = "foo(1, 2)";
      const ast = parse("test", code);
      expect(ast).toMatchSnapshot();
    });
  });

  describe("Identifier expressions", () => {
    it("should parse identifier expressions", () => {
      const code = "foo";
      const ast = parse("test", code);
      expect(ast).toMatchSnapshot();
    });
  });

  describe("Numeric literal expressions", () => {
    it("should parse numeric literal expressions", () => {
      const code = "1";
      const ast = parse("test", code);
      expect(ast).toMatchSnapshot();
    });
  });

  describe("String literal expressions", () => {
    it("should parse string literal expressions", () => {
      const code = '"foo"';
      const ast = parse("test", code);
      expect(ast).toMatchSnapshot();
    });
  });
});
