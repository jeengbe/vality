import { validate } from "../lib";
import { guard } from "../lib/guard";
import { identity } from "../lib/utils";

const mockValid = jest.fn(identity);
const mockInvalid = jest.fn(() => undefined);

describe("guard", () => {
  it("resolves correctly", () => {
    expect(validate(guard("__test__" as any, mockValid), "__val__")).toBeValid();
    expect(mockValid).toHaveBeenCalledTimes(1);
    expect(mockValid).toHaveBeenCalledWith("__val__", {});
    mockValid.mockClear();

    expect(validate(guard("__test__" as any, mockInvalid), "__val__")).toBeInvalid("vality.__test__.base");
    expect(validate(guard("__test__" as any, mockInvalid), "__val__")).toBeInvalid();
    expect(mockInvalid).toHaveBeenCalledTimes(2);
    expect(mockInvalid).toHaveBeenCalledWith("__val__", {});
    mockInvalid.mockClear();
  });

  it("validates with options", () => {
    const mockOptionValid = jest.fn(() => true);
    const mockOptionInvalid = jest.fn(() => false);

    // Does it work with no options
    expect(
      validate(
        guard("__test__" as any, mockValid, {
          foo: mockOptionValid,
          bar: mockOptionInvalid,
        }),
        "__val__"
      )
    ).toBeValid();
    expect(mockValid).toHaveBeenCalledTimes(1);
    expect(mockOptionValid).toHaveBeenCalledTimes(0);
    expect(mockOptionInvalid).toHaveBeenCalledTimes(0);

    mockValid.mockClear();
    mockOptionValid.mockClear();
    mockOptionInvalid.mockClear();

    // Are valid options respected
    expect(
      validate(
        guard("__test__" as any, mockValid, {
          foo: mockOptionValid,
          bar: mockOptionInvalid,
        })({
          foo: "__foo__",
        }),
        "__val__"
      )
    ).toBeValid();

    expect(mockValid).toHaveBeenCalledTimes(1);
    expect(mockOptionValid).toHaveBeenCalledTimes(1);
    expect(mockOptionValid).toHaveBeenCalledWith("__val__", "__foo__", { foo: "__foo__" });
    expect(mockOptionInvalid).toHaveBeenCalledTimes(0);

    mockValid.mockClear();
    mockOptionValid.mockClear();
    mockOptionInvalid.mockClear();

    // Are invalid options respected
    expect(
      validate(
        guard("__test__" as any, mockValid, {
          foo: mockOptionValid,
          bar: mockOptionInvalid,
        })({
          bar: "__bar__",
        }),
        "__val__"
      )
    ).toBeInvalid("vality.__test__.options.bar");

    expect(mockValid).toHaveBeenCalledTimes(1);
    expect(mockOptionValid).toHaveBeenCalledTimes(0);
    expect(mockOptionInvalid).toHaveBeenCalledTimes(1);
    expect(mockOptionInvalid).toHaveBeenCalledWith("__val__", "__bar__", { bar: "__bar__" });

    mockValid.mockClear();
    mockOptionValid.mockClear();
    mockOptionInvalid.mockClear();

    // Do options not bail
    expect(
      validate(
        guard("__test__" as any, mockValid, {
          foo: mockOptionValid,
          bar: mockOptionInvalid,
        })({
          foo: "__foo__",
          bar: "__bar__",
        }),
        "__val__"
      )
    ).toBeInvalid("vality.__test__.options.bar");

    expect(mockValid).toHaveBeenCalledTimes(1);
    expect(mockOptionValid).toHaveBeenCalledTimes(1);
    expect(mockOptionValid).toHaveBeenCalledWith("__val__", "__foo__", { foo: "__foo__", bar: "__bar__" });
    expect(mockOptionInvalid).toHaveBeenCalledTimes(1);
    expect(mockOptionInvalid).toHaveBeenCalledWith("__val__", "__bar__", { foo: "__foo__", bar: "__bar__" });

    mockValid.mockClear();
    mockOptionValid.mockClear();
    mockOptionInvalid.mockClear();
  });
});
