import { assert, falseFn, flat, identity, trueFn } from "vality/utils";

describe("assert", () => {
  it("throws an error if the condition is false", () => {
    expect(() => {
      assert(null, false);
    }).toThrowError("Assertion failed");
  });
});

// TODO: shorts

test("flat", () => {
  expect(flat([[1], [2], [3]])).toEqual([1, 2, 3]);
  expect(flat([[1], [2], [3], [4, 5]])).toEqual([1, 2, 3, 4, 5]);
  // We only implement a depth of 1 since we don't need more
  expect(flat([[1], [2], [3], [4, 5, [6, 7]]])).toEqual([1, 2, 3, 4, 5, [6, 7]]);
});

test("identity", () => {
  expect(identity(1)).toBe(1);
  expect(identity("foo")).toBe("foo");
  expect(identity(true)).toBe(true);
  expect(identity(false)).toBe(false);
  expect(identity(null)).toBe(null);
  expect(identity(undefined)).toBe(undefined);
  expect(identity({})).toEqual({});
  expect(identity([])).toEqual([]);
});

test("trueFn", () => {
  expect(trueFn()).toBe(true);
  expect(trueFn("foo")).toBe(true);
});

test("falseFn", () => {
  expect(falseFn()).toBe(false);
  expect(falseFn("foo")).toBe(false);
});
