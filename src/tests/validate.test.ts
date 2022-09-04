import { validate, vality } from "vality";
import { _validate } from "vality/symbols";

describe("validate", () => {
  it("works with enys", () => {
    expect(validate(vality.string, "foo")).toBeValid();
    expect(validate([vality.string], ["foo"])).toBeValid();
    expect(validate([vality.string], [true])).toBeInvalid({
      message: "vality.string.base",
      path: [0],
      value: true,
      options: {}
    });

    const mockGuard = {
      [_validate]: jest.fn(() => ({ valid: true, data: "foo", errors: [] })),
    };
    expect(validate(mockGuard, "foo")).toBeValid();
    expect(mockGuard[_validate]).toHaveBeenCalledTimes(1);
    expect(mockGuard[_validate]).toHaveBeenCalledWith("foo", []);
  });

  it("converts a model to an object valit", () => {
    const Model = () => ({
      foo: vality.string,
      baz: vality.number,
    });
    expect(validate(Model, { foo: "bar", baz: 1 })).toBeValid();
    expect(validate(Model, "foo")).toBeInvalid({
      message: "vality.object.base",
      path: [],
      value: "foo",
      options: {},
    });
  });
});
