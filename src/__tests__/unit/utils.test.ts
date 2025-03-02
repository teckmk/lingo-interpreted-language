import { TokenType } from "../../frontend/lexer/specs";
import { get_leaf } from "../../frontend/parser";

describe("Utils", () => {
  it("should return leaf node when token is provided", () => {
    const token = {
      type: TokenType.Identifier,
      value: "foo",
      position: { start: { line: 1, column: 1 }, end: { line: 1, column: 4 } },
    };
    const leaf = get_leaf(token);
    expect(leaf).toEqual({ value: "foo", position: token.position });
  });
});
