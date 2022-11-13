import { v } from "vality";
import { getName } from "vality/typeUtils";
import { enyToGuard } from "vality/utils";

describe("enyToGuard()", () => {
  it("returns guards untouched", () => {
    const guard = v.string({});
    expect(enyToGuard(guard)).toBe(guard);
  });

  it("converts string, numbers, booleans and null to literals", () => {
    expect(getName(enyToGuard("foo"))).toBe("literal");
    expect(getName(enyToGuard(1))).toBe("literal");
    expect(getName(enyToGuard(true))).toBe("literal");
    expect(getName(enyToGuard(null))).toBe("literal");
  });

  it("throws on array with no items", () => {
    expect(() => enyToGuard([])).toThrow("Empty array Short");
  });

  it("converts array with one item to arrays", () => {
    expect(getName(enyToGuard(["foo"]))).toBe("array");
  });

  it("converts array with multiple items to enums", () => {
    expect(getName(enyToGuard(["foo", "bar"]))).toBe("enum");
  });

  it("converts object to object", () => {
    expect(getName(enyToGuard({}))).toBe("object");
  });
});
