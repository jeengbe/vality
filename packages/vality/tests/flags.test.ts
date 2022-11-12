import { expectType, TypeEqual } from "ts-expect";
import { Error, Parse, v, validate } from "vality";
import { config } from "vality/config";
import { _guard } from "vality/symbols";
import { RSA } from "vality/utils";
import { Guard } from "vality/valit";

export function testFlag(
  name: keyof vality.flags,
  guard: Guard<any, any, any>,
  {
    option,
    context = {},
    options,
    config: newConfig,
    ignore = [],
    valid = [],
    invalid = [],
  }: {
    option?: string;
    context?: RSA;
    options?: RSA;
    config?: RSA;
    ignore?: {
      value: unknown;
    }[];
    valid?: {
      value: unknown;
      expect?: unknown;
    }[];
    invalid?: {
      value: unknown;
      errors?: Error[];
    }[];
  }
) {
  // @ts-ignore
  for (const k in config) delete config[k];
  Object.assign(config, newConfig);

  for (const v of ignore) {
    validate(guard, v.value, context);
  }
  for (const v of valid) {
    expect(validate(guard, v.value, context)).toBeValid(
      "expect" in v ? v.expect : v.value
    );
  }
  for (const v of invalid) {
    expect(validate(guard, v.value, context)).toBeInvalid(
      ...(v.errors ?? [
        {
          message: option
            ? `vality.${name}.options.${option}`
            : `vality.${name}.base`,
          path: [],
          value: v.value,
          options: options ?? {},
        },
      ])
    );
  }
}

describe("vality.optional", () => {
  describe("type check", () => {
    it("passes (value, context, path, parent) correctly", () => {
      const guard = jest.fn(() => ({
        valid: true,
        data: undefined,
        errors: [],
      }));

      testFlag(
        "optional",
        v.optional({ [_guard]: guard } as any as Guard<any, any, any>),
        {
          context: {
            strict: false,
          },
          ignore: [{ value: "foo" }, { value: 1 }],
        }
      );

      expect(guard).toHaveBeenCalledWith(
        "foo",
        { strict: false },
        [],
        undefined
      );
      expect(guard).toHaveBeenCalledWith(1, { strict: false }, [], undefined);
    });

    it("passes if member passes", () => {
      testFlag("optional", v.optional(v.number), {
        valid: [{ value: 1 }],
      });
    });

    it("fails if member fails", () => {
      testFlag("optional", v.optional(v.number), {
        invalid: [
          {
            value: "foo",
            errors: [
              {
                message: "vality.number.base",
                options: {},
                path: [],
                value: "foo",
              },
            ],
          },
        ],
      });
    });
  });

  it("allows 'undefined'", () => {
    testFlag("optional", v.optional(v.number), {
      valid: [{ value: undefined }, {} as any],
    });
  });

  describe("allows 'null' in non-strict mode", () => {
    test("options", () => {
      testFlag("optional", v.optional(v.number)({ strict: true }), {
        options: { strict: true },
        invalid: [
          {
            value: null,
            errors: [
              {
                message: "vality.number.base",
                options: {},
                path: [],
                value: null,
              },
            ],
          },
        ],
      });

      testFlag("optional", v.optional(v.number)({ strict: false }), {
        options: { strict: false },
        valid: [{ value: null, expect: undefined }],
      });
    });

    test("context", () => {
      testFlag("optional", v.optional(v.number), {
        context: { strict: true },
        invalid: [
          {
            value: null,
            errors: [
              {
                message: "vality.number.base",
                options: {},
                path: [],
                value: null,
              },
            ],
          },
        ],
      });

      testFlag("optional", v.optional(v.number), {
        context: { strict: false },
        valid: [{ value: null, expect: undefined }],
      });
    });

    test("config", () => {
      testFlag("optional", v.optional(v.number), {
        config: { strict: true },
        invalid: [
          {
            value: null,
            errors: [
              {
                message: "vality.number.base",
                options: {},
                path: [],
                value: null,
              },
            ],
          },
        ],
      });

      testFlag("optional", v.optional(v.number), {
        config: { strict: false },
        valid: [{ value: null, expect: undefined }],
      });
    });

    test("default", () => {
      testFlag("optional", v.optional(v.number), {
        valid: [{ value: null, expect: undefined }],
      });
    });
  });

  test("type", () => {
    const valit = v.optional(v.number);
    expectType<TypeEqual<number | undefined, Parse<typeof valit>>>(true);
  });
});
