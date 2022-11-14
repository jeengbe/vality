import { vality } from "vality";
import { extendScalar, Scalar } from "vality/scalar";
import { _guard } from "vality/symbols";
import { types } from "vality/types";
import { testScalar } from "./scalars.test";

type UUID = string & { __uuid: true };
declare global {
  namespace vality {
    interface scalars {
      uuid: Scalar<
        "uuid",
        UUID,
        {
          test: boolean;
        }
      >;
    }
  }
}
describe("extendScalar()", () => {
  let mockUUID: jest.MockedFunction<(value: string) => UUID | undefined>;
  beforeAll(() => {
    mockUUID = jest.fn((x) => {
      expect(typeof x).toBe("string");

      if (!/^meh?$/.test(x)) return undefined;
      return x as UUID;
    });

    const x = extendScalar(vality.string({ minLength: 3 }));
    vality.uuid = x("uuid", mockUUID);
  });

  test("extension", () => {
    // Tested in beforeAll
  });

  it("sets extended types correctly", () => {
    expect(types.get("uuid")).toBe("string");
  });

  it("fails errors on the base type", () => {
    testScalar("uuid", vality.uuid, {
      invalid: [{ value: "me" }, { value: 0 }, { value: null }],
    });
  });

  it("fails on the extended type", () => {
    testScalar("uuid", vality.uuid, {
      invalid: [{ value: "meeeh" }],
    });
  });

  it("passes on the extended type", () => {
    testScalar("uuid", vality.uuid, {
      valid: [{ value: "meh" }],
      invalid: [{ value: "foo" }, { value: 0 }, { value: null }],
    });
  });

  it("passes (value, options, context, path, parent) correctly", () => {
    mockUUID.mockClear();
    // @ts-expect-error Context error
    vality.uuid[_guard]("meh", { foo: "bar" }, ["baz"], { qux: "quux" });
    expect(mockUUID).toHaveBeenCalledWith("meh", {}, { foo: "bar" }, ["baz"], {
      qux: "quux",
    });

    mockUUID.mockClear();
    vality
      .uuid({ test: true })
      // @ts-expect-error Context error
      [_guard]("meh", { foo: "bar" }, ["baz"], { qux: "quux" });

    expect(mockUUID).toHaveBeenCalledWith(
      "meh",
      { test: true },
      { foo: "bar" },
      ["baz"],
      {
        qux: "quux",
      }
    );
  });
});
