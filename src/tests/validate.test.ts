import { validate, vality } from "../lib";
import { _validate } from "../lib/symbols";

describe("validate", () => {
  it("works with enys", () => {
    expect(validate(vality.string, "a string")).toBeValid();

    const mockGuard = {
      [_validate]: jest.fn(() => ({ valid: true })),
    };
    expect(validate(mockGuard, "__mock__")).toBeValid();
    expect(mockGuard[_validate]).toHaveBeenCalledTimes(1);
    expect(mockGuard[_validate]).toHaveBeenCalledWith("__mock__");
  });

  it("converts a model to an object valit", () => {
    const Model = () => ({
      a: vality.string,
      b: vality.number,
    });
    expect(validate(Model, { a: "a string", b: 1 })).toBeValid();
    expect(validate(Model, "a string")).toBeInvalid();
  });
});
