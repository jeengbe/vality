import { Face, v } from "vality";
import { enyToGuard } from "vality/utils";

describe("enyToGuard", () => {
  it("throws on empty array", () => {
    expect(() => enyToGuard([])).toThrow("Empty array short");
  });

  test("array with one item -> vality.array", () => {
    const spy = jest.spyOn(v, "array");
    // We construct a fresh inner guard to check for equality
    const inner = v.string({ minLength: 1 });
    const valit = enyToGuard([inner]);
    expect(spy).toHaveBeenCalledWith(inner);
    expect(valit).toBe(spy.mock.results[0].value);
  });

  test("array with multiple items -> vality.enum", () => {
    const spy = jest.spyOn(v, "enum");
    const inner = [v.string({ minLength: 1 }), v.number({ min: 1 })];
    const valit = enyToGuard(inner);
    expect(spy).toHaveBeenCalledWith(...inner);
    expect(valit).toBe(spy.mock.results[0].value);
  });

  test("primitive -> vality.literal", () => {
    const spy = jest.spyOn(v, "literal");
    let valit: Face<any, any, any> = enyToGuard("foo");
    expect(spy).toHaveBeenCalledWith("foo");
    expect(valit).toBe(spy.mock.results[0].value);
    spy.mockClear();

    valit = enyToGuard(5);
    expect(spy).toHaveBeenCalledWith(5);
    expect(valit).toBe(spy.mock.results[0].value);
    spy.mockClear();

    valit = enyToGuard(false);
    expect(spy).toHaveBeenCalledWith(false);
    expect(valit).toBe(spy.mock.results[0].value);
  });

  test("identity for guards and valits", () => {
    const guard = v.string({ minLength: 1 });
    const valit = v.array(guard);
    expect(enyToGuard(guard)).toBe(guard);
    expect(enyToGuard(valit)).toBe(valit);
  });

  test("function -> relation", () => {
    const spy = jest.spyOn(v, "relation");
    const model = () => v.string;
    const valit = enyToGuard(model);
    expect(spy).toHaveBeenCalledWith(model);
    expect(valit).toBe(spy.mock.results[0].value);
  });

  test("object -> vality.object", () => {
    const spy = jest.spyOn(v, "object");
    const model = { foo: v.string };
    const valit = enyToGuard(model);
    expect(spy).toHaveBeenCalledWith(model);
    expect(valit).toBe(spy.mock.results[0].value);
  });
});
