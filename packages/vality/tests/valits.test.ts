import { expectType, TypeEqual } from "ts-expect";
import { Error, Face, Parse, v, validate } from "vality";
import { config } from "vality/config";
import { _validate } from "vality/symbols";
import { RSA } from "vality/utils";

export function testValit(
  name: keyof vality.valits,
  valit: Face<any, any, any>,
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
      value: unknown[];
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
    validate(valit, v.value, context);
  }
  for (const v of valid) {
    expect(validate(valit, v.value, context)).toBeValid(
      "expect" in v ? v.expect : v.value
    );
  }
  for (const v of invalid) {
    expect(validate(valit, v.value, context)).toBeInvalid(
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
    testValit("array", v.array(v.number), {
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

  it("casts non-array values in non-strict mode", () => {
    testValit("array", v.array(v.number)({ strict: true }), {
      options: { strict: true },
      valid: [{ value: [1] }],
      invalid: [{ value: 1 }],
    });

    testValit("array", v.array(v.number), {
      context: { strict: true },
      valid: [{ value: [1] }],
      invalid: [{ value: 1 }],
    });

    testValit("array", v.array(v.number), {
      config: { strict: true },
      valid: [{ value: [1] }],
      invalid: [{ value: 1 }],
    });

    testValit("array", v.array(v.number)({ strict: false }), {
      options: { strict: false },
      valid: [{ value: [1, 2, 3] }, { value: 1, expect: [1] }],
    });

    testValit("array", v.array(v.number), {
      context: {
        strict: false,
      },
      valid: [{ value: [1, 2, 3] }, { value: 1, expect: [1] }],
    });

    testValit("array", v.array(v.number), {
      config: {
        strict: false,
      },
      valid: [{ value: [1, 2, 3] }, { value: 1, expect: [1] }],
    });

    testValit("array", v.array(v.number), {
      valid: [{ value: [1, 2, 3] }, { value: 1, expect: [1] }],
    });
  });

  it("casts values in non-strict mode", () => {
    testValit("array", v.array(v.number({ strict: true })), {
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

    testValit("array", v.array(v.number), {
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

    testValit("array", v.array(v.number), {
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

    testValit("array", v.array(v.number({ strict: false })), {
      valid: [
        { value: [1, 2, 3] },
        { value: ["1", "2", "3"], expect: [1, 2, 3] },
      ],
    });

    testValit("array", v.array(v.number), {
      context: { strict: false },
      valid: [
        { value: [1, 2, 3] },
        { value: ["1", "2", "3"], expect: [1, 2, 3] },
      ],
    });

    testValit("array", v.array(v.number), {
      config: { strict: false },
      valid: [
        { value: [1, 2, 3] },
        { value: ["1", "2", "3"], expect: [1, 2, 3] },
      ],
    });

    testValit("array", v.array(v.number), {
      valid: [
        { value: [1, 2, 3] },
        { value: ["1", "2", "3"], expect: [1, 2, 3] },
      ],
    });
  });

  describe("check items", () => {
    it("passes (value, path, context, parent) correctly", () => {
      {
        const guard = jest.fn(() => ({
          valid: true,
          data: undefined,
          errors: [],
        }));

        testValit("array", v.array({ [_validate]: guard }), {
          context: {
            strict: false,
          },
          ignore: [{ value: ["foo", "bar"] }],
        });

        expect(guard).toHaveBeenCalledWith("foo", [0], { strict: false }, [
          "foo",
          "bar",
        ]);
        expect(guard).toHaveBeenCalledWith("bar", [1], { strict: false }, [
          "foo",
          "bar",
        ]);
      }
    });

    it("works with Shorts", () => {
      testValit("array", v.array(v.array(v.number)), {
        valid: [{ value: [[1, 2], [3]], expect: [[1, 2], [3]] }],
      });
    });

    it("fails if item fails", () => {
      testValit("array", v.array(v.number), {
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

    it("respects bail", () => {
      testValit("array", v.array(v.number)({ bail: true }), {
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

      testValit("array", v.array(v.number), {
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

      testValit("array", v.array(v.number), {
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

      testValit("array", v.array(v.number)({ bail: false }), {
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

      testValit("array", v.array(v.number), {
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

      testValit("array", v.array(v.number), {
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

      testValit("array", v.array(v.number), {
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

  describe("options", () => {
    test("minLength", () => {
      testValit("array", v.array(v.number)({ minLength: 2 }), {
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
      testValit("array", v.array(v.number)({ maxLength: 2 }), {
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
    expect(true).toBe(false);
  });

  describe("check properties", () => {
    it("passes (value, path, context, parent) correctly to values", () => {
      expect(true).toBe(false);
    });

    it("works with Shorts as values", () => {
      expect(true).toBe(false);
    });

    it("fails if member fails", () => {
      expect(true).toBe(false);
    });

    it("respects bail for member check", () => {
      expect(true).toBe(false);
    });

    it("allows 'key[]' as 'key' if value is of type array", () => {
      expect(true).toBe(false);
    });

    it("treats readonly properties as not set", () => {
      expect(true).toBe(false);
    });

    it("allows extra properties", () => {
      expect(true).toBe(false);
    });

    it("bails on extra properties", () => {
      expect(true).toBe(false);
    });
  });

  describe("type", () => {
    describe("Short", () => {
      test("flat", () => {
        expect(true).toBe(false);
      });

      test("nested", () => {
        expect(true).toBe(false);
      });

      test("marks optional properties as optional", () => {
        expect(true).toBe(false);
      });
    });

    describe("Valit", () => {
      test("flat", () => {
        expect(true).toBe(false);
      });

      test("nested", () => {
        expect(true).toBe(false);
      });

      test("marks optional properties as optional", () => {
        expect(true).toBe(false);
      });
    });
  });
});

describe("vality.optional", () => {
  describe("type check", () => {
    it("passes (value, path, context, parent) correctly", () => {
      expect(true).toBe(false);
    });

    it("passes if member passes", () => {
      expect(true).toBe(false);
    });
  });

  it("allows 'undefined'", () => {
    expect(true).toBe(false);
  });

  describe("allows 'null' in strict mode", () => {
    test("order of priority", () => {
      expect(true).toBe(false);
    });
  });

  test("type", () => {
    expect(true).toBe(false);
  });
});

describe("vality.enum", () => {
  describe("member type check", () => {
    it("passes (value, path, context, parent) correctly", () => {
      expect(true).toBe(false);
    });

    it("works with Shorts", () => {
      expect(true).toBe(false);
    });

    it("returns first match", () => {
      expect(true).toBe(false);
    });

    it("fails if all members fail", () => {
      expect(true).toBe(false);
    });
  });

  describe("type", () => {
    describe("Short", () => {
      test("flat", () => {
        expect(true).toBe(false);
      });

      test("nested", () => {
        expect(true).toBe(false);
      });
    });

    describe("Valit", () => {
      test("flat", () => {
        expect(true).toBe(false);
      });

      test("nested", () => {
        expect(true).toBe(false);
      });
    });
  });
});

describe("vality.tuple", () => {
  test("base type check", () => {
    expect(true).toBe(false);
  });

  describe("allows non-array values in non-strict mode", () => {
    test("order of priority", () => {
      expect(true).toBe(false);
    });
  });

  describe("check items", () => {
    it("passes (value, path, context, parent) correctly", () => {
      expect(true).toBe(false);
    });

    it("works with Shorts", () => {
      expect(true).toBe(false);
    });

    it("fails if member fails", () => {
      expect(true).toBe(false);
    });
  });

  test("type", () => {
    expect(true).toBe(false);
  });
});

test("vality.readonly", () => {
  expect(true).toBe(false);
});

describe("vality.and", () => {
  test("base type check", () => {
    expect(true).toBe(false);
  });

  describe("member type check", () => {
    it("passes (value, path, context, parent) correctly to values", () => {
      expect(true).toBe(false);
    });

    test("object + object", () => {
      expect(true).toBe(false);
    });

    test("object + enum", () => {
      expect(true).toBe(false);
    });

    test("object + vality.and", () => {
      expect(true).toBe(false);
    });

    it("works with Shorts", () => {
      expect(true).toBe(false);
    });

    it("fails if member fails", () => {
      expect(true).toBe(false);
    });
  });

  // TODO
});

describe("vality.dict", () => {
  test("base type check", () => {
    expect(true).toBe(false);
  });

  describe("check properties", () => {
    test("type keys", () => {
      expect(true).toBe(false);
    });

    test("literal keys", () => {
      expect(true).toBe(false);
    });

    test("enum keys (mixed)", () => {
      expect(true).toBe(false);
    });

    it("uses keys' return value as properties in data", () => {
      expect(true).toBe(false);
    });

    describe("fails if literal key missing", () => {
      it("works", () => {
        expect(true).toBe(false);
      });

      it("ignores optional keys", () => {
        expect(true).toBe(false);
      });

      it("respects bail", () => {
        expect(true).toBe(false);
      });
    });

    describe("fails if remaining property not covered by type keys", () => {
      it("works", () => {
        expect(true).toBe(false);
      });

      it("respects allowExtraProperties", () => {
        expect(true).toBe(false);
      });

      it("respects bail", () => {
        expect(true).toBe(false);
      });
    });
  });

  describe("return data", () => {
    it("uses keys' return value as properties in data", () => {
      expect(true).toBe(false);
    });

    it("passes (value, path, context, parent) correctly to values", () => {
      expect(true).toBe(false);
    });

    it("works with Shorts", () => {
      expect(true).toBe(false);
    });

    it("fails if member fails", () => {
      expect(true).toBe(false);
    });

    it("respects bail", () => {
      expect(true).toBe(false);
    });
  });

  test("type", () => {
    expect(true).toBe(false);
  });
});

test("a", () => {
  console.log(validate(v.and({ a: "a" }, { b: "b" }), { a: "a", b: "b" }));
});
