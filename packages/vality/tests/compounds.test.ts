import { expectType, TypeEqual } from "ts-expect";
import { Error, Parse, v, validate } from "vality";
import { config } from "vality/config";
import { _guard } from "vality/symbols";
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

    it("bails on extra properties", () => {
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
      const valit = v.object({ foo: v.optional(v.number), bar: v.string });
      expectType<TypeEqual<{ foo: number; bar: string }, Parse<typeof valit>>>(
        true
      );
    });
  });
});

describe("vality.optional", () => {
  describe("type check", () => {
    it("passes (value, context, path, parent) correctly", () => {
      const guard = jest.fn(() => ({
        valid: true,
        data: undefined,
        errors: [],
      }));

      testCompound("object", v.optional({ [_guard]: guard }), {
        context: {
          strict: false,
        },
        ignore: [{ value: "foo" }, { value: 1 }],
      });

      expect(guard).toHaveBeenCalledWith(
        "foo",
        { strict: false },
        [],
        undefined
      );
      expect(guard).toHaveBeenCalledWith(1, { strict: false }, [], undefined);
    });

    it("passes if member passes", () => {
      testCompound("optional", v.optional(v.number), {
        valid: [{ value: 1 }],
      });
    });

    it("fails if member fails", () => {
      testCompound("optional", v.optional(v.number), {
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
    testCompound("optional", v.optional(v.number), {
      valid: [{ value: undefined }, {} as any],
    });
  });

  describe("allows 'null' in non-strict mode", () => {
    test("options", () => {
      testCompound("optional", v.optional(v.number)({ strict: true }), {
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

      testCompound("optional", v.optional(v.number)({ strict: false }), {
        options: { strict: false },
        valid: [{ value: null, expect: undefined }],
      });
    });

    test("context", () => {
      testCompound("optional", v.optional(v.number), {
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

      testCompound("optional", v.optional(v.number), {
        context: { strict: false },
        valid: [{ value: null, expect: undefined }],
      });
    });

    test("config", () => {
      testCompound("optional", v.optional(v.number), {
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

      testCompound("optional", v.optional(v.number), {
        config: { strict: false },
        valid: [{ value: null, expect: undefined }],
      });
    });

    test("default", () => {
      testCompound("optional", v.optional(v.number), {
        valid: [{ value: null, expect: undefined }],
      });
    });
  });

  test("type", () => {
    const valit = v.optional(v.number);
    expectType<TypeEqual<number | undefined, Parse<typeof valit>>>(true);
  });
});

describe("vality.enum", () => {
  describe("member type check", () => {
    it("passes (value, context, path, parent) correctly", () => {});

    it("works with Shorts", () => {});

    it("returns first match", () => {});

    it("fails if all members fail", () => {});
  });

  describe("type", () => {
    describe("Short", () => {
      test("flat", () => {});

      test("nested", () => {});
    });

    describe("Valit", () => {
      test("flat", () => {});

      test("nested", () => {});
    });
  });
});

describe("vality.tuple", () => {
  test("base type check", () => {});

  describe("allows non-array values in non-strict mode", () => {
    test("order of priority", () => {});
  });

  describe("check items", () => {
    it("passes (value, context, path, parent) correctly", () => {});

    it("works with Shorts", () => {});

    it("fails if member fails", () => {});
  });

  test("type", () => {});
});

test("vality.readonly", () => {});

describe("vality.and", () => {
  test("base type check", () => {});

  describe("member type check", () => {
    it("passes (value, context, path, parent) correctly to values", () => {});

    test("object + object", () => {});

    test("object + enum", () => {});

    test("object + vality.and", () => {});

    it("works with Shorts", () => {});

    it("fails if member fails", () => {});
  });

  // TODO
});

describe("vality.dict", () => {
  test("base type check", () => {});

  describe("check properties", () => {
    test("type keys", () => {});

    test("literal keys", () => {});

    test("enum keys (mixed)", () => {});

    it("uses keys' return value as properties in data", () => {});

    describe("fails if literal key missing", () => {
      it("works", () => {});

      it("ignores optional keys", () => {});

      it("respects bail", () => {});
    });

    describe("fails if remaining property not covered by type keys", () => {
      it("works", () => {});

      it("respects allowExtraProperties", () => {});

      it("respects bail", () => {});
    });
  });

  describe("return data", () => {
    it("uses keys' return value as properties in data", () => {});

    it("passes (value, context, path, parent) correctly to values", () => {});

    it("works with Shorts", () => {});

    it("fails if member fails", () => {});

    it("respects bail", () => {});
  });

  test("type", () => {});
});

test.skip("a", () => {
  console.log(validate(v.and({ a: "a" }, { b: "b" }), { a: "a", b: "b" }));
});
