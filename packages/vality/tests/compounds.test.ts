import { expectType, TypeEqual } from "ts-expect";
import { Error, Parse, v, validate } from "vality";
import { config } from "vality/config";
import { _guard, _type } from "vality/symbols";
import { RSA } from "vality/utils";
import { Guard } from "vality/valit";

export function testCompound(
  name: keyof vality.compounds,
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

describe("vality.array", () => {
  test("base type check", () => {
    testCompound("array", v.array(v.number), {
      context: {
        strict: true,
      },
      valid: [{ value: [] }, { value: [1, 2, 3] }],
      invalid: [
        { value: -1 },
        { value: 0 },
        { value: 1 },
        { value: "" },
        { value: "foo" },
        { value: "foo bar" },
        { value: true },
        { value: false },
        { value: undefined },
        { value: null },
        { value: {} },
        { value: { foo: "bar" } },
        { value: () => {} },
      ],
    });
  });

  describe("casts non-array values in non-strict mode", () => {
    test("options", () => {
      testCompound("array", v.array(v.number)({ strict: true }), {
        options: { strict: true },
        valid: [{ value: [1] }],
        invalid: [{ value: 1 }],
      });

      testCompound("array", v.array(v.number)({ strict: false }), {
        options: { strict: false },
        valid: [{ value: [1, 2, 3] }, { value: 1, expect: [1] }],
      });
    });

    test("context", () => {
      testCompound("array", v.array(v.number), {
        context: { strict: true },
        valid: [{ value: [1] }],
        invalid: [{ value: 1 }],
      });

      testCompound("array", v.array(v.number), {
        context: {
          strict: false,
        },
        valid: [{ value: [1, 2, 3] }, { value: 1, expect: [1] }],
      });
    });

    test("config", () => {
      testCompound("array", v.array(v.number), {
        config: { strict: true },
        valid: [{ value: [1] }],
        invalid: [{ value: 1 }],
      });

      testCompound("array", v.array(v.number), {
        config: {
          strict: false,
        },
        valid: [{ value: [1, 2, 3] }, { value: 1, expect: [1] }],
      });
    });

    test("default", () => {
      testCompound("array", v.array(v.number), {
        valid: [{ value: [1, 2, 3] }, { value: 1, expect: [1] }],
      });
    });
  });

  describe("casts values in non-strict mode", () => {
    test("options", () => {
      testCompound("array", v.array(v.number({ strict: true })), {
        valid: [{ value: [1, 2, 3] }],
        invalid: [
          {
            value: ["1", "2", "3"],
            errors: [
              {
                message: "vality.number.base",
                options: { strict: true },
                path: [0],
                value: "1",
              },
              {
                message: "vality.number.base",
                options: { strict: true },
                path: [1],
                value: "2",
              },
              {
                message: "vality.number.base",
                options: { strict: true },
                path: [2],
                value: "3",
              },
            ],
          },
        ],
      });

      testCompound("array", v.array(v.number({ strict: false })), {
        valid: [
          { value: [1, 2, 3] },
          { value: ["1", "2", "3"], expect: [1, 2, 3] },
        ],
      });
    });

    test("context", () => {
      testCompound("array", v.array(v.number), {
        context: { strict: true },
        valid: [{ value: [1, 2, 3] }],
        invalid: [
          {
            value: ["1", "2", "3"],
            errors: [
              {
                message: "vality.number.base",
                options: {},
                path: [0],
                value: "1",
              },
              {
                message: "vality.number.base",
                options: {},
                path: [1],
                value: "2",
              },
              {
                message: "vality.number.base",
                options: {},
                path: [2],
                value: "3",
              },
            ],
          },
        ],
      });

      testCompound("array", v.array(v.number), {
        context: { strict: false },
        valid: [
          { value: [1, 2, 3] },
          { value: ["1", "2", "3"], expect: [1, 2, 3] },
        ],
      });
    });

    test("config", () => {
      testCompound("array", v.array(v.number), {
        config: { strict: true },
        valid: [{ value: [1, 2, 3] }],
        invalid: [
          {
            value: ["1", "2", "3"],
            errors: [
              {
                message: "vality.number.base",
                options: {},
                path: [0],
                value: "1",
              },
              {
                message: "vality.number.base",
                options: {},
                path: [1],
                value: "2",
              },
              {
                message: "vality.number.base",
                options: {},
                path: [2],
                value: "3",
              },
            ],
          },
        ],
      });

      testCompound("array", v.array(v.number), {
        config: { strict: false },
        valid: [
          { value: [1, 2, 3] },
          { value: ["1", "2", "3"], expect: [1, 2, 3] },
        ],
      });
    });

    test("default", () => {
      testCompound("array", v.array(v.number), {
        valid: [
          { value: [1, 2, 3] },
          { value: ["1", "2", "3"], expect: [1, 2, 3] },
        ],
      });
    });
  });

  describe("check items", () => {
    it("passes (value, context, path, parent) correctly", () => {
      const guard = jest.fn(() => ({
        valid: true,
        data: undefined,
        errors: [],
      }));

      testCompound("array", v.array({ [_guard]: guard }), {
        context: {
          strict: false,
        },
        ignore: [{ value: ["foo", "bar"] }],
      });

      expect(guard).toHaveBeenCalledWith(
        "foo",
        { strict: false },
        [0],
        ["foo", "bar"]
      );
      expect(guard).toHaveBeenCalledWith(
        "bar",
        { strict: false },
        [1],
        ["foo", "bar"]
      );
    });

    it("works with Shorts", () => {
      testCompound("array", v.array([v.number]), {
        valid: [{ value: [[1, 2], [3]], expect: [[1, 2], [3]] }],
      });
    });

    it("fails if item fails", () => {
      testCompound("array", v.array(v.number), {
        context: {
          strict: true,
        },
        valid: [{ value: [1, 2, 3] }],
        invalid: [
          {
            value: [1, "2", 3],
            errors: [
              {
                message: "vality.number.base",
                options: {},
                path: [1],
                value: "2",
              },
            ],
          },
        ],
      });
    });

    describe("respects bail", () => {
      test("options", () => {
        testCompound("array", v.array(v.number)({ bail: true }), {
          invalid: [
            {
              value: [true, true],
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: [0],
                  value: true,
                },
              ],
            },
          ],
        });

        testCompound("array", v.array(v.number)({ bail: false }), {
          invalid: [
            {
              value: [true, true],
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: [0],
                  value: true,
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: [1],
                  value: true,
                },
              ],
            },
          ],
        });
      });

      test("context", () => {
        testCompound("array", v.array(v.number), {
          context: { bail: true },
          invalid: [
            {
              value: [true, true],
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: [0],
                  value: true,
                },
              ],
            },
          ],
        });

        testCompound("array", v.array(v.number), {
          context: { bail: false },
          invalid: [
            {
              value: [true, true],
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: [0],
                  value: true,
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: [1],
                  value: true,
                },
              ],
            },
          ],
        });
      });

      test("config", () => {
        testCompound("array", v.array(v.number), {
          config: { bail: true },
          invalid: [
            {
              value: [true, true],
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: [0],
                  value: true,
                },
              ],
            },
          ],
        });

        testCompound("array", v.array(v.number), {
          config: { bail: false },
          invalid: [
            {
              value: [true, true],
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: [0],
                  value: true,
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: [1],
                  value: true,
                },
              ],
            },
          ],
        });
      });

      test("default", () => {
        testCompound("array", v.array(v.number), {
          invalid: [
            {
              value: [true, true],
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: [0],
                  value: true,
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: [1],
                  value: true,
                },
              ],
            },
          ],
        });
      });
    });
  });

  describe("options", () => {
    test("minLength", () => {
      testCompound("array", v.array(v.number)({ minLength: 2 }), {
        option: "minLength",
        options: { minLength: 2 },
        valid: [{ value: [1, 2] }],
        invalid: [
          {
            value: [1],
          },
        ],
      });
    });

    test("maxLength", () => {
      testCompound("array", v.array(v.number)({ maxLength: 2 }), {
        option: "maxLength",
        options: { maxLength: 2 },
        valid: [{ value: [1, 2] }],
        invalid: [
          {
            value: [1, 2, 3],
          },
        ],
      });
    });
  });

  describe("type", () => {
    test("flat", () => {
      const valit = v.array(v.number);
      expectType<TypeEqual<number[], Parse<typeof valit>>>(true);
    });

    test("nested", () => {
      const valit = v.array(v.array(v.number));
      expectType<TypeEqual<number[][], Parse<typeof valit>>>(true);
    });
  });
});

describe("vality.tuple", () => {
  test("base type check", () => {
    testCompound("tuple", v.tuple(v.number, v.string), {
      valid: [{ value: [1, "2"] }],
      invalid: [
        {
          value: 1,
        },
      ],
    });
  });

  describe("check items", () => {
    it("passes (value, context, path, parent) correctly", () => {
      const guard = jest.fn(() => ({
        valid: true,
        data: undefined,
        errors: [],
      }));

      testCompound("array", v.tuple({ [_guard]: guard }, { [_guard]: guard }), {
        context: {
          strict: false,
        },
        ignore: [{ value: ["foo", "bar"] }],
      });

      expect(guard).toHaveBeenCalledWith(
        "foo",
        { strict: false },
        [0],
        ["foo", "bar"]
      );
      expect(guard).toHaveBeenCalledWith(
        "bar",
        { strict: false },
        [1],
        ["foo", "bar"]
      );
    });

    it("works with Shorts", () => {
      testCompound("tuple", v.tuple([v.number], v.string), {
        context: { strict: true },
        valid: [{ value: [[1], "2"] }, { value: [[1, 1], "2"] }],
        invalid: [
          {
            value: [1, "2"],
            errors: [
              {
                message: "vality.array.base",
                options: {},
                path: [0],
                value: 1,
              },
            ],
          },
        ],
      });
    });

    it("fails if member fails", () => {
      testCompound("tuple", v.tuple(v.number, v.string), {
        context: { strict: true },
        valid: [{ value: [1, "2"] }],
        invalid: [
          {
            value: [1, 2],
            errors: [
              {
                message: "vality.string.base",
                options: {},
                path: [1],
                value: 2,
              },
            ],
          },
        ],
      });
    });

    describe("respects bail", () => {
      test("options", () => {
        testCompound("tuple", v.tuple(v.number, v.number)({ bail: true }), {
          options: { bail: true },
          context: { strict: true },
          invalid: [
            {
              value: ["1", "2"],
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: [0],
                  value: "1",
                },
              ],
            },
          ],
        });

        testCompound("tuple", v.tuple(v.number, v.number)({ bail: false }), {
          options: { bail: false },
          context: { strict: true },
          invalid: [
            {
              value: ["1", "2"],
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: [0],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: [1],
                  value: "2",
                },
              ],
            },
          ],
        });
      });

      test("context", () => {
        testCompound("tuple", v.tuple(v.number, v.number), {
          context: { strict: true, bail: true },
          invalid: [
            {
              value: ["1", "2"],
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: [0],
                  value: "1",
                },
              ],
            },
          ],
        });

        testCompound("tuple", v.tuple(v.number, v.number), {
          context: { strict: true, bail: false },
          invalid: [
            {
              value: ["1", "2"],
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: [0],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: [1],
                  value: "2",
                },
              ],
            },
          ],
        });
      });

      test("config", () => {
        testCompound("tuple", v.tuple(v.number, v.number), {
          config: { bail: true },
          context: { strict: true },
          invalid: [
            {
              value: ["1", "2"],
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: [0],
                  value: "1",
                },
              ],
            },
          ],
        });

        testCompound("tuple", v.tuple(v.number, v.number), {
          config: { bail: false },
          context: { strict: true },
          invalid: [
            {
              value: ["1", "2"],
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: [0],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: [1],
                  value: "2",
                },
              ],
            },
          ],
        });
      });

      test("default", () => {
        testCompound("tuple", v.tuple(v.number, v.number), {
          context: { strict: true },
          invalid: [
            {
              value: ["1", "2"],
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: [0],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: [1],
                  value: "2",
                },
              ],
            },
          ],
        });
      });
    });
  });

  describe("type", () => {
    test("flat", () => {
      const valit = v.tuple(v.number, v.string);
      expectType<TypeEqual<[number, string], Parse<typeof valit>>>(true);
    });

    test("nested", () => {
      const valit = v.tuple(v.tuple(v.number, v.string), v.string);
      expectType<TypeEqual<[[number, string], string], Parse<typeof valit>>>(
        true
      );
    });
  });
});

describe("vality.object", () => {
  test("base type check", () => {
    testCompound("object", v.object({}), {
      valid: [{ value: {} }],
      invalid: [
        {
          value: [],
        },
        {
          value: "",
        },
        {
          value: 1,
        },
      ],
    });

    testCompound("object", v.object({ foo: "bar" }), {
      valid: [{ value: { foo: "bar" } }],
      invalid: [
        {
          value: [],
        },
        {
          value: "",
        },
        {
          value: 1,
        },
      ],
    });
  });

  describe("check properties", () => {
    it("passes (value, context, path, parent) correctly to values", () => {
      const guard = jest.fn(() => ({
        valid: true,
        data: undefined,
        errors: [],
      }));

      testCompound(
        "object",
        v.object({ foo: { [_guard]: guard }, bar: { [_guard]: guard } }),
        {
          context: {
            strict: false,
          },
          ignore: [{ value: { foo: "bar", bar: "baz" } }],
        }
      );

      expect(guard).toHaveBeenCalledWith("bar", { strict: false }, ["foo"], {
        foo: "bar",
        bar: "baz",
      });
      expect(guard).toHaveBeenCalledWith("baz", { strict: false }, ["bar"], {
        foo: "bar",
        bar: "baz",
      });
    });

    it("works with Shorts as values", () => {
      testCompound("object", v.object({ foo: { bar: v.number } }), {
        context: { strict: true },
        valid: [{ value: { foo: { bar: 1 } } }],
        invalid: [
          {
            value: { foo: "1" },
            errors: [
              {
                message: "vality.object.base",
                options: {},
                path: ["foo"],
                value: "1",
              },
            ],
          },
        ],
      });
    });

    it("fails if member fails", () => {
      testCompound("object", v.object({ foo: v.number, bar: v.number }), {
        context: { strict: true },
        invalid: [
          {
            value: { foo: 1, bar: "1" },
            errors: [
              {
                message: "vality.number.base",
                options: {},
                path: ["bar"],
                value: "1",
              },
            ],
          },
        ],
      });
    });

    describe("respects bail for member check", () => {
      test("option", () => {
        testCompound(
          "object",
          v.object({ foo: v.number, bar: v.number })({ bail: true }),
          {
            context: { strict: true },
            options: { bail: true },
            invalid: [
              {
                value: { foo: "1", bar: "1" },
                errors: [
                  {
                    message: "vality.number.base",
                    options: {},
                    path: ["foo"],
                    value: "1",
                  },
                ],
              },
            ],
          }
        );

        testCompound(
          "object",
          v.object({ foo: v.number, bar: v.number })({ bail: false }),
          {
            context: { strict: true },
            options: { bail: false },
            invalid: [
              {
                value: { foo: "1", bar: "1" },
                errors: [
                  {
                    message: "vality.number.base",
                    options: {},
                    path: ["foo"],
                    value: "1",
                  },
                  {
                    message: "vality.number.base",
                    options: {},
                    path: ["bar"],
                    value: "1",
                  },
                ],
              },
            ],
          }
        );
      });

      test("context", () => {
        testCompound("object", v.object({ foo: v.number, bar: v.number }), {
          context: { bail: true, strict: true },
          invalid: [
            {
              value: { foo: "1", bar: "1" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
              ],
            },
          ],
        });

        testCompound("object", v.object({ foo: v.number, bar: v.number }), {
          context: { bail: false, strict: true },
          invalid: [
            {
              value: { foo: "1", bar: "1" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["bar"],
                  value: "1",
                },
              ],
            },
          ],
        });
      });

      test("config", () => {
        testCompound("object", v.object({ foo: v.number, bar: v.number }), {
          context: { strict: true },
          config: { bail: true },
          invalid: [
            {
              value: { foo: "1", bar: "1" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
              ],
            },
          ],
        });

        testCompound("object", v.object({ foo: v.number, bar: v.number }), {
          context: { strict: true },
          config: { bail: false },
          invalid: [
            {
              value: { foo: "1", bar: "1" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["bar"],
                  value: "1",
                },
              ],
            },
          ],
        });
      });

      test("default", () => {
        testCompound("object", v.object({ foo: v.number, bar: v.number }), {
          context: { strict: true },
          invalid: [
            {
              value: { foo: "1", bar: "1" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["bar"],
                  value: "1",
                },
              ],
            },
          ],
        });
      });
    });

    describe("allows 'key[]' as 'key' if value is of type array", () => {
      it("works with a Valit", () => {
        testCompound("object", v.object({ foo: v.array(v.number) }), {
          context: { strict: true, allowExtraProperties: false },
          valid: [
            { value: { foo: [1, 2] } },
            { value: { "foo[]": [1, 2] }, expect: { foo: [1, 2] } },
          ],
          invalid: [
            {
              value: { foo: [1, "1"] },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo", 1],
                  value: "1",
                },
              ],
            },
          ],
        });

        testCompound("object", v.object({ foo: v.number }), {
          valid: [{ value: { foo: 1 } }],
          invalid: [
            {
              value: { "foo[]": 1 },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: undefined,
                },
              ],
            },
          ],
        });
      });

      it("works with a Short", () => {
        testCompound("object", v.object({ foo: [v.number] }), {
          context: { strict: true },
          valid: [
            { value: { foo: [1, 2] } },
            { value: { "foo[]": [1, 2] }, expect: { foo: [1, 2] } },
          ],
          invalid: [
            {
              value: { foo: [1, "1"] },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo", 1],
                  value: "1",
                },
              ],
            },
          ],
        });

        testCompound("object", v.object({ foo: v.number }), {
          valid: [{ value: { foo: 1 } }],
          invalid: [
            {
              value: { "foo[]": 1 },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: undefined,
                },
              ],
            },
          ],
        });
      });
    });

    it("errors on 'key[]' if 'key' is not an array", () => {
      testCompound("object", v.object({ foo: v.number }), {
        context: { bail: false, allowExtraProperties: false },
        invalid: [
          {
            value: { "foo[]": 1 },
            errors: [
              {
                message: "vality.number.base",
                options: {},
                path: ["foo"],
                value: undefined,
              },
              {
                message: "vality.object.extraProperty",
                options: {},
                path: ["foo[]"],
                value: 1,
              },
            ],
          },
        ],
      });
    });

    describe("property remapping", () => {
      it("allows for remapping", () => {
        testCompound("object", v.object({ foo: v.from("bar")(v.number) }), {
          valid: [{ value: { bar: 1 }, expect: { foo: 1 } }],
        });
      });

      it("duplicates properties if specified multiple times", () => {
        testCompound(
          "object",
          v.object({
            foo: v.from("baz")(v.number),
            bar: v.from("baz")(v.number),
          }),
          {
            valid: [{ value: { baz: 1 }, expect: { foo: 1, bar: 1 } }],
          }
        );
      });

      describe("falls back to the original key in non-strict mode", () => {
        test("options", () => {
          testCompound(
            "object",
            v.object({ foo: v.from("bar")(v.number) })({ strict: true }),
            {
              valid: [{ value: { bar: 1 }, expect: { foo: 1 } }],
              invalid: [
                {
                  value: { foo: 1 },
                  errors: [
                    {
                      message: "vality.number.base",
                      options: {},
                      path: ["bar"],
                      value: undefined,
                    },
                  ],
                },
              ],
            }
          );

          testCompound(
            "object",
            v.object({ foo: v.from("bar")(v.number) })({ strict: false }),
            {
              options: { strict: false },
              valid: [
                { value: { bar: 1 }, expect: { foo: 1 } },
                { value: { foo: 1 } },
              ],
            }
          );
        });

        test("context", () => {
          testCompound("object", v.object({ foo: v.from("bar")(v.number) }), {
            context: { strict: true },
            valid: [{ value: { bar: 1 }, expect: { foo: 1 } }],
            invalid: [
              {
                value: { foo: 1 },
                errors: [
                  {
                    message: "vality.number.base",
                    options: {},
                    path: ["bar"],
                    value: undefined,
                  },
                ],
              },
            ],
          });

          testCompound("object", v.object({ foo: v.from("bar")(v.number) }), {
            context: { strict: false },
            valid: [
              { value: { bar: 1 }, expect: { foo: 1 } },
              { value: { foo: 1 } },
            ],
          });
        });

        test("config", () => {
          testCompound("object", v.object({ foo: v.from("bar")(v.number) }), {
            config: { strict: true },
            valid: [{ value: { bar: 1 }, expect: { foo: 1 } }],
            invalid: [
              {
                value: { foo: 1 },
                errors: [
                  {
                    message: "vality.number.base",
                    options: {},
                    path: ["bar"],
                    value: undefined,
                  },
                ],
              },
            ],
          });

          testCompound("object", v.object({ foo: v.from("bar")(v.number) }), {
            config: { strict: false },
            valid: [
              { value: { bar: 1 }, expect: { foo: 1 } },
              { value: { foo: 1 } },
            ],
          });
        });

        test("default", () => {
          testCompound("object", v.object({ foo: v.from("bar")(v.number) }), {
            valid: [
              { value: { bar: 1 }, expect: { foo: 1 } },
              { value: { foo: 1 } },
            ],
          });

          testCompound("object", v.object({ foo: v.from("bar")(v.number) }), {
            config: { strict: false },
            valid: [
              { value: { bar: 1 }, expect: { foo: 1 } },
              { value: { foo: 1 } },
            ],
          });
        });

        it("overrides the original key", () => {
          testCompound("object", v.object({ foo: v.from("bar")(v.number) }), {
            valid: [{ value: { foo: 1, bar: 2 }, expect: { foo: 2 } }],
          });
        });
      });
    });

    it("treats readonly properties as not set", () => {
      testCompound("object", v.object({ foo: v.readonly(v.number) }), {
        context: { allowExtraProperties: false },
        valid: [{ value: {} }],
        invalid: [
          {
            value: { foo: 1 },
            errors: [
              {
                message: "vality.object.extraProperty",
                options: {},
                path: ["foo"],
                value: 1,
              },
            ],
          },
        ],
      });
    });

    describe("allows extra properties", () => {
      test("options", () => {
        testCompound(
          "object",
          v.object({ foo: v.number, bar: v.number })({
            allowExtraProperties: true,
          }),
          {
            options: { allowExtraProperties: true },
            valid: [
              { value: { foo: 1, bar: 1, baz: 1 }, expect: { foo: 1, bar: 1 } },
            ],
          }
        );

        testCompound(
          "object",
          v.object({ foo: v.number, bar: v.number })({
            allowExtraProperties: false,
          }),
          {
            options: { allowExtraProperties: false },
            invalid: [
              {
                value: { foo: 1, bar: 1, baz: 1 },
                errors: [
                  {
                    message: "vality.object.extraProperty",
                    options: { allowExtraProperties: false },
                    path: ["baz"],
                    value: 1,
                  },
                ],
              },
            ],
          }
        );
      });

      test("context", () => {
        testCompound("object", v.object({ foo: v.number, bar: v.number }), {
          context: { allowExtraProperties: true },
          valid: [
            { value: { foo: 1, bar: 1, baz: 1 }, expect: { foo: 1, bar: 1 } },
          ],
        });

        testCompound("object", v.object({ foo: v.number, bar: v.number }), {
          context: { allowExtraProperties: false },
          invalid: [
            {
              value: { foo: 1, bar: 1, baz: 1 },
              errors: [
                {
                  message: "vality.object.extraProperty",
                  options: {},
                  path: ["baz"],
                  value: 1,
                },
              ],
            },
          ],
        });
      });

      test("config", () => {
        testCompound("object", v.object({ foo: v.number, bar: v.number }), {
          config: { allowExtraProperties: true },
          valid: [
            { value: { foo: 1, bar: 1, baz: 1 }, expect: { foo: 1, bar: 1 } },
          ],
        });

        testCompound("object", v.object({ foo: v.number, bar: v.number }), {
          config: { allowExtraProperties: false },
          invalid: [
            {
              value: { foo: 1, bar: 1, baz: 1 },
              errors: [
                {
                  message: "vality.object.extraProperty",
                  options: {},
                  path: ["baz"],
                  value: 1,
                },
              ],
            },
          ],
        });
      });

      test("default", () => {
        testCompound("object", v.object({ foo: v.number, bar: v.number }), {
          valid: [
            { value: { foo: 1, bar: 1, baz: 1 }, expect: { foo: 1, bar: 1 } },
          ],
        });
      });
    });

    describe("bails on extra properties", () => {
      test("options", () => {
        testCompound(
          "object",
          v.object({ foo: v.number, bar: v.number })({ bail: true }),
          {
            options: { bail: true },
            context: { allowExtraProperties: false },
            invalid: [
              {
                value: { foo: 1, bar: 1, baz: 1, qux: 1 },
                errors: [
                  {
                    message: "vality.object.extraProperty",
                    options: { bail: true },
                    path: ["baz"],
                    value: 1,
                  },
                ],
              },
            ],
          }
        );

        testCompound(
          "object",
          v.object({ foo: v.number, bar: v.number })({ bail: false }),
          {
            options: { bail: false },
            context: { allowExtraProperties: false },
            invalid: [
              {
                value: { foo: 1, bar: 1, baz: 1, qux: 1 },
                errors: [
                  {
                    message: "vality.object.extraProperty",
                    options: { bail: false },
                    path: ["baz"],
                    value: 1,
                  },
                  {
                    message: "vality.object.extraProperty",
                    options: { bail: false },
                    path: ["qux"],
                    value: 1,
                  },
                ],
              },
            ],
          }
        );
      });

      test("context", () => {
        testCompound("object", v.object({ foo: v.number, bar: v.number }), {
          context: { allowExtraProperties: false, bail: true },
          invalid: [
            {
              value: { foo: 1, bar: 1, baz: 1, qux: 1 },
              errors: [
                {
                  message: "vality.object.extraProperty",
                  options: {},
                  path: ["baz"],
                  value: 1,
                },
              ],
            },
          ],
        });

        testCompound("object", v.object({ foo: v.number, bar: v.number }), {
          context: { allowExtraProperties: false, bail: false },
          invalid: [
            {
              value: { foo: 1, bar: 1, baz: 1, qux: 1 },
              errors: [
                {
                  message: "vality.object.extraProperty",
                  options: {},
                  path: ["baz"],
                  value: 1,
                },
                {
                  message: "vality.object.extraProperty",
                  options: {},
                  path: ["qux"],
                  value: 1,
                },
              ],
            },
          ],
        });
      });

      test("config", () => {
        testCompound("object", v.object({ foo: v.number, bar: v.number }), {
          context: { allowExtraProperties: false },
          config: { bail: true },
          invalid: [
            {
              value: { foo: 1, bar: 1, baz: 1, qux: 1 },
              errors: [
                {
                  message: "vality.object.extraProperty",
                  options: {},
                  path: ["baz"],
                  value: 1,
                },
              ],
            },
          ],
        });

        testCompound("object", v.object({ foo: v.number, bar: v.number }), {
          context: { allowExtraProperties: false },
          config: { bail: false },
          invalid: [
            {
              value: { foo: 1, bar: 1, baz: 1, qux: 1 },
              errors: [
                {
                  message: "vality.object.extraProperty",
                  options: {},
                  path: ["baz"],
                  value: 1,
                },
                {
                  message: "vality.object.extraProperty",
                  options: {},
                  path: ["qux"],
                  value: 1,
                },
              ],
            },
          ],
        });
      });

      test("default", () => {
        testCompound("object", v.object({ foo: v.number, bar: v.number }), {
          context: { allowExtraProperties: false },
          invalid: [
            {
              value: { foo: 1, bar: 1, baz: 1, qux: 1 },
              errors: [
                {
                  message: "vality.object.extraProperty",
                  options: {},
                  path: ["baz"],
                  value: 1,
                },
                {
                  message: "vality.object.extraProperty",
                  options: {},
                  path: ["qux"],
                  value: 1,
                },
              ],
            },
          ],
        });
      });
    });
  });

  describe("type", () => {
    test("flat", () => {
      const valit = v.object({ foo: v.number, bar: v.string });
      expectType<TypeEqual<{ foo: number; bar: string }, Parse<typeof valit>>>(
        true
      );
    });

    test("nested", () => {
      const valit = v.object({
        foo: { bar: v.number, baz: { qux: v.string } },
      });
      expectType<
        TypeEqual<
          {
            foo: {
              bar: number;
              baz: {
                qux: string;
              };
            };
          },
          Parse<typeof valit>
        >
      >(true);
    });

    test("marks optional properties as optional", () => {
      const valit = { foo: v.optional(v.number), bar: v.string };
      expectType<
        TypeEqual<{ foo: number | undefined; bar: string }, Parse<typeof valit>>
      >(true);
    });
  });
});

describe("vality.dict", () => {
  test("base type check", () => {
    testCompound("dict", v.dict(v.string, v.number), {
      valid: [{ value: {} }, { value: { foo: 1 } }],
      invalid: [
        { value: -1 },
        { value: 0 },
        { value: 1 },
        { value: "" },
        { value: "foo" },
        { value: "foo bar" },
        { value: true },
        { value: false },
        { value: undefined },
        { value: null },
        { value: () => {} },
      ],
    });
  });

  it("returns undefined if the value is readonly", () => {
    testCompound("dict", v.dict(v.string, v.readonly(v.any)), {
      valid: [
        { value: {}, expect: undefined },
        { value: { foo: "bar", baz: "qux" }, expect: undefined },
      ],
      invalid: [
        {
          value: "foo",
        },
      ],
    });
  });

  it("works with one literal key", () => {
    testCompound("dict", v.dict(v.literal("foo"), v.number), {
      valid: [{ value: { foo: 1 } }],
      invalid: [
        {
          value: {},
          errors: [
            {
              message: "vality.number.base",
              options: {},
              path: ["foo"],
              value: undefined,
            },
          ],
        },
        {
          value: { foo: "bar" },
          errors: [
            {
              message: "vality.number.base",
              options: {},
              path: ["foo"],
              value: "bar",
            },
          ],
        },
      ],
    });
  });

  it("works with one type key", () => {
    testCompound("dict", v.dict(v.string, v.number), {
      valid: [
        { value: {} },
        { value: { foo: 1 } },
        { value: { foo: 1, bar: 1 } },
      ],
      invalid: [
        {
          value: { foo: "bar" },
          errors: [
            {
              message: "vality.number.base",
              options: {},
              path: ["foo"],
              value: "bar",
            },
          ],
        },
      ],
    });
  });

  it("works with only literal keys", () => {
    testCompound("dict", v.dict(v.enum("foo", "bar"), v.number), {
      valid: [
        { value: { foo: 1, bar: 2 } },
        { value: { foo: 1, bar: 2, baz: 3 }, expect: { foo: 1, bar: 2 } },
      ],
      invalid: [
        {
          value: {},
          errors: [
            {
              message: "vality.number.base",
              options: {},
              path: ["foo"],
              value: undefined,
            },
            {
              message: "vality.number.base",
              options: {},
              path: ["bar"],
              value: undefined,
            },
          ],
        },
        {
          value: { foo: 1 },
          errors: [
            {
              message: "vality.number.base",
              options: {},
              path: ["bar"],
              value: undefined,
            },
          ],
        },
        {
          value: { bar: 2 },
          errors: [
            {
              message: "vality.number.base",
              options: {},
              path: ["foo"],
              value: undefined,
            },
          ],
        },
      ],
    });
  });

  it("works with only type keys", () => {
    testCompound("dict", v.dict(v.enum(v.string, v.number), v.number), {
      context: { allowExtraProperties: false },
      valid: [
        { value: {} },
        { value: { foo: 1 } },
        { value: { foo: 1, bar: 2 } },
        { value: { 1: 1, bar: 2 } },
        { value: { 1: 1, bar: 2, "3": 3 } },
      ],
    });
  });

  it("works with mixed keys", () => {
    testCompound("dict", v.dict(v.enum("foo", v.number), v.number), {
      valid: [
        { value: { foo: 1 } },
        { value: { foo: 1, 2: 2 } },
        { value: { foo: 1, 2: 2, 3: 3 } },
        { value: { foo: 1, 2: 2, bar: "3" }, expect: { foo: 1, 2: 2 } },
      ],
      invalid: [
        {
          value: {},
          errors: [
            {
              message: "vality.number.base",
              options: {},
              path: ["foo"],
              value: undefined,
            },
          ],
        },
        {
          value: { 1: 1 },
          errors: [
            {
              message: "vality.number.base",
              options: {},
              path: ["foo"],
              value: undefined,
            },
          ],
        },
      ],
    });
  });

  describe("literal keys", () => {
    it("passes (value, context, path, parent) correctly to the value", () => {
      const guard = jest.fn(() => ({
        valid: true,
        data: undefined,
        errors: [],
      }));

      testCompound("dict", v.dict(v.enum("foo", "bar"), { [_guard]: guard }), {
        context: {
          strict: false,
        },
        ignore: [{ value: { foo: "bar", bar: "baz" } }],
      });

      expect(guard).toHaveBeenCalledWith("bar", { strict: false }, ["foo"], {
        foo: "bar",
        bar: "baz",
      });
      expect(guard).toHaveBeenCalledWith("baz", { strict: false }, ["bar"], {
        foo: "bar",
        bar: "baz",
      });
    });

    it("works with Shorts", () => {
      testCompound("dict", v.dict(v.enum("foo", "bar"), [v.number]), {
        context: { strict: true, bail: true },
        valid: [{ value: { foo: [1], bar: [2] } }],
        invalid: [
          {
            value: { foo: 1, bar: "2" },
            errors: [
              {
                message: "vality.array.base",
                options: {},
                path: ["foo"],
                value: 1,
              },
            ],
          },
        ],
      });
    });

    describe("respects bail", () => {
      test("options", () => {
        testCompound(
          "dict",
          v.dict(v.enum("foo", "bar"), v.number)({ bail: true }),
          {
            options: { bail: true },
            context: { strict: true },
            valid: [{ value: { foo: 1, bar: 2 } }],
            invalid: [
              {
                value: { foo: "1", bar: "2" },
                errors: [
                  {
                    message: "vality.number.base",
                    options: {},
                    path: ["foo"],
                    value: "1",
                  },
                ],
              },
            ],
          }
        );

        testCompound(
          "dict",
          v.dict(v.enum("foo", "bar"), v.number)({ bail: false }),
          {
            options: { bail: false },
            context: { strict: true },
            valid: [{ value: { foo: 1, bar: 2 } }],
            invalid: [
              {
                value: { foo: "1", bar: "2" },
                errors: [
                  {
                    message: "vality.number.base",
                    options: {},
                    path: ["foo"],
                    value: "1",
                  },
                  {
                    message: "vality.number.base",
                    options: {},
                    path: ["bar"],
                    value: "2",
                  },
                ],
              },
            ],
          }
        );
      });

      test("context", () => {
        testCompound("dict", v.dict(v.enum("foo", "bar"), v.number), {
          context: { bail: true, strict: true },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
              ],
            },
          ],
        });

        testCompound("dict", v.dict(v.enum("foo", "bar"), v.number), {
          context: { bail: false, strict: true },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["bar"],
                  value: "2",
                },
              ],
            },
          ],
        });
      });

      test("config", () => {
        testCompound("dict", v.dict(v.enum("foo", "bar"), v.number), {
          config: { bail: true },
          context: { strict: true },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
              ],
            },
          ],
        });

        testCompound("dict", v.dict(v.enum("foo", "bar"), v.number), {
          config: { bail: false },
          context: { strict: true },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["bar"],
                  value: "2",
                },
              ],
            },
          ],
        });
      });

      test("default", () => {
        testCompound("dict", v.dict(v.enum("foo", "bar"), v.number), {
          context: { strict: true },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["bar"],
                  value: "2",
                },
              ],
            },
          ],
        });
      });
    });

    it("fails if value fails", () => {
      testCompound("dict", v.dict(v.enum("foo", "bar"), v.number), {
        context: { strict: true, bail: true },
        valid: [{ value: { foo: 1, bar: 2 } }],
        invalid: [
          {
            value: { foo: "1", bar: "2" },
            errors: [
              {
                message: "vality.number.base",
                options: {},
                path: ["foo"],
                value: "1",
              },
            ],
          },
        ],
      });
    });

    describe("respects bail", () => {
      test("options", () => {
        testCompound(
          "dict",
          v.dict(v.enum("foo", "bar"), v.number)({ bail: true }),
          {
            options: { bail: true },
            context: { strict: true },
            invalid: [
              {
                value: { foo: "1", bar: "2" },
                errors: [
                  {
                    message: "vality.number.base",
                    options: {},
                    path: ["foo"],
                    value: "1",
                  },
                ],
              },
            ],
          }
        );

        testCompound(
          "dict",
          v.dict(v.enum("foo", "bar"), v.number)({ bail: false }),
          {
            options: { bail: false },
            context: { strict: true },
            valid: [{ value: { foo: 1, bar: 2 } }],
            invalid: [
              {
                value: { foo: "1", bar: "2" },
                errors: [
                  {
                    message: "vality.number.base",
                    options: {},
                    path: ["foo"],
                    value: "1",
                  },
                  {
                    message: "vality.number.base",
                    options: {},
                    path: ["bar"],
                    value: "2",
                  },
                ],
              },
            ],
          }
        );
      });

      test("context", () => {
        testCompound("dict", v.dict(v.enum("foo", "bar"), v.number), {
          context: { bail: true, strict: true },
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
              ],
            },
          ],
        });

        testCompound("dict", v.dict(v.enum("foo", "bar"), v.number), {
          context: { bail: false, strict: true },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["bar"],
                  value: "2",
                },
              ],
            },
          ],
        });
      });

      test("config", () => {
        testCompound("dict", v.dict(v.enum("foo", "bar"), v.number), {
          config: { bail: true },
          context: { strict: true },
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
              ],
            },
          ],
        });

        testCompound("dict", v.dict(v.enum("foo", "bar"), v.number), {
          config: { bail: false },
          context: { strict: true },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["bar"],
                  value: "2",
                },
              ],
            },
          ],
        });
      });

      test("default", () => {
        testCompound("dict", v.dict(v.enum("foo", "bar"), v.number), {
          context: { strict: true },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["bar"],
                  value: "2",
                },
              ],
            },
          ],
        });
      });
    });
  });

  describe("type keys", () => {
    it("passes (value, context, path, parent) correctly to the key", () => {
      const guard = jest.fn((x) => ({
        valid: true,
        data: x,
        errors: [],
      }));

      testCompound(
        "dict",
        // @ts-expect-error
        v.dict({ [_guard]: guard, [_type]: "string" }, v.number),
        {
          context: {
            strict: false,
          },
          ignore: [{ value: { foo: "bar", bar: "baz" } }],
        }
      );

      expect(guard).toHaveBeenCalledWith("foo", { strict: false }, ["foo"], {
        foo: "bar",
        bar: "baz",
      });
      expect(guard).toHaveBeenCalledWith("bar", { strict: false }, ["bar"], {
        foo: "bar",
        bar: "baz",
      });
    });

    it("passes (value, context, path, parent) correctly to the value", () => {
      const guard = jest.fn(() => ({
        valid: true,
        data: undefined,
        errors: [],
      }));

      testCompound("dict", v.dict(v.string, { [_guard]: guard }), {
        context: {
          strict: false,
        },
        ignore: [{ value: { foo: "bar", bar: "baz" } }],
      });

      expect(guard).toHaveBeenCalledWith("bar", { strict: false }, ["foo"], {
        foo: "bar",
        bar: "baz",
      });
      expect(guard).toHaveBeenCalledWith("baz", { strict: false }, ["bar"], {
        foo: "bar",
        bar: "baz",
      });
    });

    it("works with Shorts", () => {
      testCompound("dict", v.dict(v.string, [v.number]), {
        context: { strict: true, bail: true },
        valid: [{ value: { foo: [1], bar: [2] } }],
        invalid: [
          {
            value: { foo: 1, bar: "2" },
            errors: [
              {
                message: "vality.array.base",
                options: {},
                path: ["foo"],
                value: 1,
              },
            ],
          },
        ],
      });
    });

    describe("respects bail", () => {
      test("options", () => {
        testCompound("dict", v.dict(v.string, v.number)({ bail: true }), {
          options: { bail: true },
          context: { strict: true },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
              ],
            },
          ],
        });

        testCompound("dict", v.dict(v.string, v.number)({ bail: false }), {
          options: { bail: false },
          context: { strict: true },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["bar"],
                  value: "2",
                },
              ],
            },
          ],
        });
      });

      test("context", () => {
        testCompound("dict", v.dict(v.string, v.number), {
          context: { bail: true, strict: true },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
              ],
            },
          ],
        });

        testCompound("dict", v.dict(v.string, v.number), {
          context: { bail: false, strict: true },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["bar"],
                  value: "2",
                },
              ],
            },
          ],
        });
      });

      test("config", () => {
        testCompound("dict", v.dict(v.string, v.number), {
          config: { bail: true },
          context: { strict: true },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
              ],
            },
          ],
        });

        testCompound("dict", v.dict(v.string, v.number), {
          config: { bail: false },
          context: { strict: true },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["bar"],
                  value: "2",
                },
              ],
            },
          ],
        });
      });

      test("default", () => {
        testCompound("dict", v.dict(v.string, v.number), {
          context: { strict: true },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: "1", bar: "2" },
              errors: [
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["foo"],
                  value: "1",
                },
                {
                  message: "vality.number.base",
                  options: {},
                  path: ["bar"],
                  value: "2",
                },
              ],
            },
          ],
        });
      });
    });

    it("fails if value fails", () => {
      testCompound("dict", v.dict(v.string, v.number), {
        context: { strict: true, bail: true },
        valid: [{ value: { foo: 1, bar: 2 } }],
        invalid: [
          {
            value: { foo: "1", bar: "2" },
            errors: [
              {
                message: "vality.number.base",
                options: {},
                path: ["foo"],
                value: "1",
              },
            ],
          },
        ],
      });
    });

    it("remaps properties", () => {
      testCompound(
        "dict",
        v.dict(
          v.string({
            transform: (x) => x + "bar",
          }),
          v.number
        ),
        {
          context: { strict: true, bail: true },
          valid: [
            { value: {} },
            { value: { foo: 1, bar: 2 }, expect: { foobar: 1, barbar: 2 } },
          ],
        }
      );
    });

    describe("allows extra properties", () => {
      test("options", () => {
        testCompound(
          "dict",
          v.dict(
            v.string({ maxLength: 3 }),
            v.number
          )({ allowExtraProperties: true }),
          {
            options: { allowExtraProperties: true },
            valid: [
              { value: { foo: 1, bar: 2 } },
              {
                value: { foo: 1, bar: 2, foobar: 3 },
                expect: { foo: 1, bar: 2 },
              },
            ],
          }
        );

        testCompound(
          "dict",
          v.dict(
            v.string({ maxLength: 3 }),
            v.number
          )({ allowExtraProperties: false }),
          {
            options: { allowExtraProperties: false },
            valid: [{ value: { foo: 1, bar: 2 } }],
            invalid: [
              {
                value: { foo: 1, bar: 2, foobar: 3 },
                errors: [
                  {
                    message: "vality.dict.extraProperty",
                    options: { allowExtraProperties: false },
                    path: ["foobar"],
                    value: 3,
                  },
                ],
              },
            ],
          }
        );
      });

      test("context", () => {
        testCompound("dict", v.dict(v.string({ maxLength: 3 }), v.number), {
          context: { allowExtraProperties: true },
          valid: [
            { value: { foo: 1, bar: 2 } },
            {
              value: { foo: 1, bar: 2, foobar: 3 },
              expect: { foo: 1, bar: 2 },
            },
          ],
        });

        testCompound("dict", v.dict(v.string({ maxLength: 3 }), v.number), {
          context: { allowExtraProperties: false },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: 1, bar: 2, foobar: 3 },
              errors: [
                {
                  message: "vality.dict.extraProperty",
                  options: {},
                  path: ["foobar"],
                  value: 3,
                },
              ],
            },
          ],
        });
      });

      test("config", () => {
        testCompound("dict", v.dict(v.string({ maxLength: 3 }), v.number), {
          valid: [
            { value: { foo: 1, bar: 2 } },
            {
              value: { foo: 1, bar: 2, foobar: 3 },
              expect: { foo: 1, bar: 2 },
            },
          ],
        });
      });

      test("config", () => {
        testCompound("dict", v.dict(v.string({ maxLength: 3 }), v.number), {
          config: { allowExtraProperties: true },
          valid: [
            { value: { foo: 1, bar: 2 } },
            {
              value: { foo: 1, bar: 2, foobar: 3 },
              expect: { foo: 1, bar: 2 },
            },
          ],
        });

        testCompound("dict", v.dict(v.string({ maxLength: 3 }), v.number), {
          config: { allowExtraProperties: false },
          valid: [{ value: { foo: 1, bar: 2 } }],
          invalid: [
            {
              value: { foo: 1, bar: 2, foobar: 3 },
              errors: [
                {
                  message: "vality.dict.extraProperty",
                  options: {},
                  path: ["foobar"],
                  value: 3,
                },
              ],
            },
          ],
        });
      });
    });

    describe("bails on extra properties", () => {
      test("options", () => {
        testCompound(
          "dict",
          v.dict(v.string({ maxLength: 3 }), v.number)({ bail: true }),
          {
            options: { bail: true },
            context: { allowExtraProperties: false },
            invalid: [
              {
                value: { foobar: 1, barbar: 2 },
                errors: [
                  {
                    message: "vality.dict.extraProperty",
                    options: { bail: true },
                    path: ["foobar"],
                    value: 1,
                  },
                ],
              },
            ],
          }
        );

        testCompound(
          "dict",
          v.dict(v.string({ maxLength: 3 }), v.number)({ bail: false }),
          {
            options: { bail: false },
            context: { allowExtraProperties: false },
            invalid: [
              {
                value: { foobar: 1, barbar: 2 },
                errors: [
                  {
                    message: "vality.dict.extraProperty",
                    options: { bail: false },
                    path: ["foobar"],
                    value: 1,
                  },
                  {
                    message: "vality.dict.extraProperty",
                    options: { bail: false },
                    path: ["barbar"],
                    value: 2,
                  },
                ],
              },
            ],
          }
        );
      });

      test("context", () => {
        testCompound("dict", v.dict(v.string({ maxLength: 3 }), v.number), {
          context: { bail: true, allowExtraProperties: false },
          invalid: [
            {
              value: { foobar: 1, barbar: 2 },
              errors: [
                {
                  message: "vality.dict.extraProperty",
                  options: {},
                  path: ["foobar"],
                  value: 1,
                },
              ],
            },
          ],
        });

        testCompound("dict", v.dict(v.string({ maxLength: 3 }), v.number), {
          context: { bail: false, allowExtraProperties: false },
          invalid: [
            {
              value: { foobar: 1, barbar: 2 },
              errors: [
                {
                  message: "vality.dict.extraProperty",
                  options: {},
                  path: ["foobar"],
                  value: 1,
                },
                {
                  message: "vality.dict.extraProperty",
                  options: {},
                  path: ["barbar"],
                  value: 2,
                },
              ],
            },
          ],
        });
      });

      test("config", () => {
        testCompound("dict", v.dict(v.string({ maxLength: 3 }), v.number), {
          context: { allowExtraProperties: false },
          config: { bail: true },
          invalid: [
            {
              value: { foobar: 1, barbar: 2 },
              errors: [
                {
                  message: "vality.dict.extraProperty",
                  options: {},
                  path: ["foobar"],
                  value: 1,
                },
              ],
            },
          ],
        });

        testCompound("dict", v.dict(v.string({ maxLength: 3 }), v.number), {
          context: { allowExtraProperties: false },
          config: { bail: false },
          invalid: [
            {
              value: { foobar: 1, barbar: 2 },
              errors: [
                {
                  message: "vality.dict.extraProperty",
                  options: {},
                  path: ["foobar"],
                  value: 1,
                },
                {
                  message: "vality.dict.extraProperty",
                  options: {},
                  path: ["barbar"],
                  value: 2,
                },
              ],
            },
          ],
        });
      });

      test("default", () => {
        testCompound("dict", v.dict(v.string({ maxLength: 3 }), v.number), {
          context: { allowExtraProperties: false },
          invalid: [
            {
              value: { foobar: 1, barbar: 2 },
              errors: [
                {
                  message: "vality.dict.extraProperty",
                  options: {},
                  path: ["foobar"],
                  value: 1,
                },
                {
                  message: "vality.dict.extraProperty",
                  options: {},
                  path: ["barbar"],
                  value: 2,
                },
              ],
            },
          ],
        });
      });
    });
  });

  describe("type", () => {
    test("one literal key", () => {
      const guard = v.dict(v.literal("foo"), v.number);
      expectType<TypeEqual<{ foo: number }, Parse<typeof guard>>>(true);
    });

    test("one type key", () => {
      const guard = v.dict(v.string, v.number);
      expectType<TypeEqual<{ [key: string]: number }, Parse<typeof guard>>>(
        true
      );
    });

    test("only literal keys", () => {
      const guard = v.dict(v.enum("foo" as const, "bar" as const), v.number);
      expectType<TypeEqual<{ foo: number; bar: number }, Parse<typeof guard>>>(
        true
      );
    });

    test("only type keys", () => {
      const guard = v.dict(v.enum(v.string, v.number), v.number);
      expectType<
        TypeEqual<
          { [key: string]: number; [key: number]: number },
          Parse<typeof guard>
        >
      >(true);
    });
  });
});

describe("vality.enum", () => {
  describe("member type check", () => {
    it("passes (value, context, path, parent) correctly", () => {
      const guard = jest.fn(() => ({
        valid: false,
        data: undefined,
        errors: [],
      }));
      const guard2 = jest.fn(() => ({
        valid: false,
        data: undefined,
        errors: [],
      }));

      testCompound("array", v.enum({ [_guard]: guard }, { [_guard]: guard2 }), {
        context: {
          strict: false,
        },
        ignore: [{ value: "foo" }],
      });

      expect(guard).toHaveBeenCalledWith(
        "foo",
        { strict: false },
        [],
        undefined
      );
      expect(guard2).toHaveBeenCalledWith(
        "foo",
        { strict: false },
        [],
        undefined
      );
    });

    it("works with Shorts", () => {
      testCompound("enum", v.enum([v.string], v.number), {
        context: { strict: true },
        valid: [
          { value: [] },
          {
            value: ["foo", "bar"],
          },
          {
            value: 5,
          },
        ],
        invalid: [
          {
            value: "foo",
          },
          {
            value: [1],
          },
        ],
      });
    });

    it("returns first match", () => {
      testCompound(
        "enum",
        v.enum(
          v.string({ transform: (x) => x + "foo" }),
          v.string({ transform: (x) => x + "bar" })
        ),
        {
          valid: [
            {
              value: "foo",
              expect: "foofoo",
            },
          ],
        }
      );
    });

    it("fails if all members fail", () => {
      testCompound("enum", v.enum(v.string, v.number), {
        invalid: [
          {
            value: true,
          },
          { value: {} },
        ],
      });
    });
  });

  describe("type", () => {
    describe("Valit", () => {
      test("flat", () => {
        const guard = v.enum(v.string, v.number);
        expectType<TypeEqual<string | number, Parse<typeof guard>>>(true);
      });

      test("nested", () => {
        const guard = v.enum(v.enum(v.string, v.number), v.boolean);
        expectType<TypeEqual<string | number | boolean, Parse<typeof guard>>>(
          true
        );
      });
    });
  });
});

// describe("vality.and", () => {
//   test("base type check", () => {});

//   describe("member type check", () => {
//     it("passes (value, context, path, parent) correctly to values", () => {});

//     test("object + object", () => {});

//     test("object + enum", () => {});

//     test("object + vality.and", () => {});

//     it("works with Shorts", () => {});

//     it("fails if member fails", () => {});
//   });

//   // TODO
// });
