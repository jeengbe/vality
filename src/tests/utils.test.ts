import { validate, vality } from "../lib";
import { assert, enyToGuard, flat, identity } from "../lib/utils";

describe("assert", () => {
  it("throws an error if the condition is false", () => {
    expect(() => {
      assert(null, false);
    }).toThrowError("Assertion failed");
  });
});

describe("enyToGuard", () => {
  it("throws on an empty array", () => {
    expect(() => enyToGuard([])).toThrow("Empty array valit");
  });

  describe("converts an array with one element to an array valit", () => {
    it("works", () => {
      const guard = enyToGuard([vality.string]);
      expect(validate(guard, ["a string", "another string"])).toBeValid();
      expect(validate(guard, ["a string"])).toBeValid();
      expect(validate(guard, "a string")).toBeInvalid();
      expect(validate(guard, 5)).toBeInvalid();
    });

    it("recursively converts nested enys", () => {
      const guard = enyToGuard([[vality.string]]);
      expect(validate(guard, [["a string", "another string"]])).toBeValid();
      expect(
        validate(guard, [
          ["a string", "another string"],
          ["a string", "another string"],
        ])
      ).toBeValid();
      expect(validate(guard, ["a string", "another string"])).toBeInvalid();
      expect(validate(guard, "a string")).toBeInvalid();
    });
  });

  describe("converts an array with multiple elements to an enum valit", () => {
    it("works", () => {
      const guard = enyToGuard([vality.string, vality.number]);
      expect(validate(guard, 1)).toBeValid();
      expect(validate(guard, 2)).toBeValid();
      expect(validate(guard, "a string")).toBeValid();
      expect(validate(guard, "")).toBeValid();
      expect(validate(guard, undefined)).toBeInvalid();
      expect(validate(guard, { yo: "mama" })).toBeInvalid();
      expect(validate(guard, ["a string", 1])).toBeInvalid();
    });

    it("recursively converts nested enys", () => {
      const guard = enyToGuard([
        [vality.string, vality.literal(2)],
        [vality.literal(3), vality.literal(4)],
      ]);
      expect(validate(guard, 4)).toBeValid();
      expect(validate(guard, 2)).toBeValid();
      expect(validate(guard, "a string")).toBeValid();
      expect(validate(guard, "")).toBeValid();
      expect(validate(guard, undefined)).toBeInvalid();
      expect(validate(guard, { yo: "mama" })).toBeInvalid();
      expect(validate(guard, ["a string", 1])).toBeInvalid();
    });
  });

  it("converts literals to a literal guard", () => {
    for (const { value, invalid } of [
      {
        value: 1,
        invalid: [2, "a string", { yo: "mama" }, undefined],
      },
      {
        value: "a string",
        invalid: [2, 1, { yo: "mama" }, undefined],
      },
      {
        value: true,
        invalid: [false, 1, "a string", { yo: "mama" }, undefined],
      },
      {
        value: null,
        invalid: [true, false, 1, "a string", { yo: "mama" }, undefined],
      },
    ]) {
      expect(validate(value, value)).toBeValid();
      for (const v of invalid) {
        expect(validate(value, v)).toBeInvalid();
      }
    }
  });

  it("converts functions to relations", () => {
    const guard = enyToGuard(() => ({}));
    expect(validate(guard, 0)).toBeValid();
    expect(validate(guard, 4)).toBeValid();
    expect(validate(guard, 4.6)).toBeInvalid();
    expect(validate(guard, -1)).toBeInvalid();
    expect(validate(guard, -1)).toBeInvalid();
    expect(validate(guard, "a string")).toBeInvalid();
    expect(validate(guard, {})).toBeInvalid();
  });

  describe("converts object to object valits", () => {
    it("works", () => {
      const guard = enyToGuard({
        a: vality.string,
        b: vality.number,
      });
      expect(validate(guard, { a: "a string", b: 1 })).toBeValid();
      expect(validate(guard, { a: "a string", b: 1 })).toBeValid();
      expect(validate(guard, "a string")).toBeInvalid();
      expect(validate(guard, { a: "a string" })).toBeInvalid();
      expect(validate(guard, { a: "a string", b: "a string" })).toBeInvalid();
    });

    it("recursively converts nested enys", () => {
      const guard = enyToGuard({
        a: vality.string,
        b: {
          c: {
            d: vality.number,
          },
        },
      });
      expect(validate(guard, { a: "a string", b: { c: { d: 1 } } })).toBeValid();
      expect(validate(guard, { a: "a string", b: { c: { d: "a string" } } })).toBeInvalid();
    });
  });
});

it("flat", () => {
  expect(flat([[1], [2], [3]])).toEqual([1, 2, 3]);
  expect(flat([[1], [2], [3], [4, 5]])).toEqual([1, 2, 3, 4, 5]);
  // We only implement a depth of 1 since we don't need more
  expect(flat([[1], [2], [3], [4, 5, [6, 7]]])).toEqual([1, 2, 3, 4, 5, [6, 7]]);
});

it("identity", () => {
  expect(identity(1)).toBe(1);
  expect(identity("a string")).toBe("a string");
  expect(identity(true)).toBe(true);
  expect(identity(false)).toBe(false);
  expect(identity(null)).toBe(null);
  expect(identity(undefined)).toBe(undefined);
  expect(identity({})).toEqual({});
  expect(identity([])).toEqual([]);
})
