import { validate, vality } from "../lib";
import { Guard, guard } from "../lib/guard";
import { assert, MaybeArray } from "../lib/utils";

type IV = {
  valid: any[];
  invalid: any[];
};

type GuardOptions<G extends keyof vality.guards> = vality.guards[G] extends Guard<any, infer O> ? O : never;

function testGuard<G extends keyof vality.guards, O extends GuardOptions<G>>(
  guard: G,
  simple: IV,
  options: {
    [K in keyof O]?: MaybeArray<IV & { value: O[K] }>;
  }
) {
  describe(guard, () => {
    it("works without options", () => {
      for (const v of simple.valid) {
        expect(validate(vality[guard], v)).toBeValid();
      }
      for (const v of simple.invalid) {
        expect(validate(vality[guard], v)).toBeInvalid(`vality.${guard}.base`);
      }
    });

    if (Object.keys(options).length === 0) {
      it.skip("with options", () => void 0);
    }

    describe("options", () => {
      for (const o in options) {
        assert<keyof O>(o);
        const values = (Array.isArray(options[o]) ? options[o] : [options[o]]) as (IV & { value: O[typeof o] })[];
        it(o, () => {
          for (const val of values) {
            for (const v of val.valid) {
              expect(
                validate(
                  // TODO: un-any this
                  (vality[guard] as any)({
                    [o]: val.value,
                  }),
                  v
                )
              ).toBeValid();
            }
            for (const v of val.invalid) {
              expect(
                validate(
                  (vality[guard] as any)({
                    [o]: val.value,
                  }),
                  v
                )
              ).toBeInvalid(`vality.${guard}.options.${o}`);
            }
          }
        });
      }
    });
  });
}

const mockValid = jest.fn(() => true);
const mockInvalid = jest.fn(() => false);

describe("built-in guards", () => {
  describe("guard()", () => {
    it("resolves correctly", () => {
      expect(validate(guard("__test__", mockValid), "__val__")).toBeValid();
      expect(mockValid).toHaveBeenCalledTimes(1);
      expect(mockValid).toHaveBeenCalledWith("__val__", {});
      mockValid.mockClear();

      expect(validate(guard("__test__", mockInvalid), "__val__")).toBeInvalid("vality.__test__.base");
      expect(validate(guard("__test__", mockInvalid), "__val__")).toBeInvalid();
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
          guard<
            any,
            {
              foo?: any;
              bar?: any;
            }
          >("__test__", mockValid, {
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
          guard<
            any,
            {
              foo?: any;
              bar?: any;
            }
          >("__test__", mockValid, {
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
          guard<
            any,
            {
              foo?: any;
              bar?: any;
            }
          >("__test__", mockValid, {
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
          guard<
            any,
            {
              foo?: any;
              bar?: any;
            }
          >("__test__", mockValid, {
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

  testGuard(
    "string",
    {
      valid: ["", "a string"],
      invalid: [undefined, null, 0, 1, true, false, {}, [], () => {}],
    },
    {
      minLength: {
        value: 2,
        valid: ["__", "___"],
        invalid: ["", "_"],
      },
      maxLength: {
        value: 2,
        valid: ["", "_", "__"],
        invalid: ["___", "____"],
      },
    }
  );

  testGuard(
    "number",
    {
      valid: [-2, -1, 0, 1, 2],
      invalid: [undefined, null, "", "a string", true, false, {}, [], () => {}, -NaN, NaN, -Infinity, Infinity],
    },
    {
      min: {
        value: -1,
        valid: [-1, 0, 1],
        invalid: [-2],
      },
      max: {
        value: 1,
        valid: [-1, 0, 1],
        invalid: [2],
      },
    }
  );

  testGuard(
    "boolean",
    {
      valid: [true, false],
      invalid: [undefined, null, "", "a string", 0, 1, -1, -2],
    },
    {}
  );

  describe("literal", () => {
    it("works without options", () => {
      // String
      expect(validate(vality.literal("__foo__"), "__foo__")).toBeValid();
      expect(validate(vality.literal("__foo__"), "__bar__")).toBeInvalid();
      expect(validate(vality.literal("__foo__"), undefined)).toBeInvalid();
      expect(validate(vality.literal("__foo__"), 5)).toBeInvalid();
      expect(validate(vality.literal("__foo__"), false)).toBeInvalid();
      expect(validate(vality.literal("__foo__"), {})).toBeInvalid();
      expect(validate(vality.literal("__foo__"), [])).toBeInvalid();

      expect(validate(vality.literal(5), 5)).toBeValid();
      expect(validate(vality.literal(5), 8)).toBeInvalid();
      expect(validate(vality.literal(5), undefined)).toBeInvalid();
      expect(validate(vality.literal(5), "__foo__")).toBeInvalid();
      expect(validate(vality.literal(5), false)).toBeInvalid();
      expect(validate(vality.literal(5), {})).toBeInvalid();
      expect(validate(vality.literal(5), [])).toBeInvalid();

      expect(validate(vality.literal(true), true)).toBeValid();
      expect(validate(vality.literal(true), false)).toBeInvalid();
      expect(validate(vality.literal(true), undefined)).toBeInvalid();
      expect(validate(vality.literal(true), "__foo__")).toBeInvalid();
      expect(validate(vality.literal(true), 5)).toBeInvalid();
      expect(validate(vality.literal(true), {})).toBeInvalid();
      expect(validate(vality.literal(true), [])).toBeInvalid();
    });

    it.skip("with options", () => void 0);
  });
});
