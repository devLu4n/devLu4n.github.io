const { parseId } = require("../utils/parseId");

describe("parseId", () => {
  test.each([
    ["1", 1],
    ["42", 42],
    [42, 42],
  ])("converte %p para um ID válido", (value, expected) => {
    expect(parseId(value)).toBe(expected);
  });

  test.each([undefined, null, "", "0", "-1", "1abc", "1.5", " 1", "01"])(
    "rejeita o ID inválido %p",
    (value) => {
      expect(parseId(value)).toBeNull();
    }
  );
});
