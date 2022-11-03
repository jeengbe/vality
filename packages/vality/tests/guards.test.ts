import { expectTypeOf } from "expect-type";
import { Error, Face, Parse, v, validate } from "vality";
import { config } from "vality/config";
import { RSA } from "vality/utils";

export function testGuard(
  name: keyof vality.guards,
  guard: Face<any, any, any>,
  {
    option,
    options,
    valid,
    invalid,
  }: {
    option?: string;
    options?: RSA;
    valid: {
      value: unknown;
      expect?: unknown;
    }[];
    invalid: {
      value: unknown;
      errors?: Error[];
    }[];
  }
) {
  for (const v of valid) {
    expect(validate(guard, v.value)).toBeValid(
      "expect" in v ? v.expect : v.value
    );
  }
  for (const v of invalid) {
    expect(validate(guard, v.value)).toBeInvalid(
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

describe("vality.string", () => {
  describe("base type check", () => {
    test("in strict mode", () => {
      config.strict = true;

      testGuard("string", v.string, {
        valid: [
          { value: "" },
          { value: "foo" },
          { value: "bar" },
          { value: "foo bar" },
        ],
        invalid: [
          { value: -1.5 },
          { value: -1 },
          { value: 0 },
          { value: 1 },
          { value: 1.5 },
          { value: true },
          { value: false },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });
    });

    test("in non-strict mode", () => {
      config.strict = false;

      testGuard("string", v.string, {
        valid: [
          { value: "" },
          { value: "foo" },
          { value: "bar" },
          { value: "foo bar" },
          { value: -1.5, expect: "-1.5" },
          { value: -1, expect: "-1" },
          { value: 0, expect: "0" },
          { value: 1, expect: "1" },
          { value: 1.5, expect: "1.5" },
        ],
        invalid: [
          { value: true },
          { value: false },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });
    });
  });

  describe("options", () => {
    test("minLength", () => {
      testGuard("string", v.string({ minLength: 2 }), {
        option: "minLength",
        options: {
          minLength: 2,
        },
        valid: [{ value: "ab" }, { value: "abc" }],
        invalid: [{ value: "" }, { value: "a" }],
      });
    });

    test("maxLength", () => {
      testGuard("string", v.string({ maxLength: 2 }), {
        option: "maxLength",
        options: {
          maxLength: 2,
        },
        valid: [{ value: "" }, { value: "a" }, { value: "ab" }],
        invalid: [{ value: "abc" }, { value: "abcd" }],
      });
    });

    test("match", () => {
      testGuard("string", v.string({ match: /^(?:foo|bar)+$/ }), {
        option: "match",
        options: {
          match: /^(?:foo|bar)+$/,
        },
        valid: [{ value: "foo" }, { value: "bar" }, { value: "foofoofoobar" }],
        invalid: [{ value: "meow" }, { value: "" }, { value: "foobar69" }],
      });
    });
  });

  test("type", () => {
    const guard = v.string;
    const guardCalledArgs = v.string({});

    expectTypeOf<Parse<typeof guard>>().toEqualTypeOf<string>();
    expectTypeOf<Parse<typeof guardCalledArgs>>().toEqualTypeOf<string>();
  });
});

describe("vality.number", () => {
  describe("base type check", () => {
    test("in strict mode", () => {
      config.strict = true;

      testGuard("number", v.number, {
        valid: [
          { value: -1.5 },
          { value: -1 },
          { value: 0 },
          { value: 1 },
          { value: 1.5 },
        ],
        invalid: [
          { value: "" },
          { value: "foo" },
          { value: "bar" },
          { value: "foo bar" },
          { value: true },
          { value: false },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });
    });

    test("in non-strict mode", () => {
      config.strict = false;

      testGuard("number", v.number, {
        valid: [
          { value: -1.5 },
          { value: -1 },
          { value: 0 },
          { value: 1 },
          { value: 1.5 },
          { value: "-1.5", expect: -1.5 },
          { value: "-1", expect: -1 },
          { value: "0", expect: 0 },
          { value: "1", expect: 1 },
          { value: "1.5", expect: 1.5 },
        ],
        invalid: [
          { value: "" },
          { value: "foo" },
          { value: "bar" },
          { value: "foo bar" },
          { value: true },
          { value: false },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });
    });
  });

  describe("options", () => {
    test("min", () => {
      testGuard("number", v.number({ min: 2 }), {
        option: "min",
        options: {
          min: 2,
        },
        valid: [{ value: 2 }, { value: 3 }],
        invalid: [{ value: 1 }, { value: 0 }, { value: -1 }, { value: -2 }],
      });
    });

    test("max", () => {
      testGuard("number", v.number({ max: 2 }), {
        option: "max",
        options: {
          max: 2,
        },
        valid: [{ value: 1 }, { value: 2 }],
        invalid: [{ value: 3 }, { value: 4 }, { value: 5 }],
      });
    });

    test("integer", () => {
      testGuard("number", v.number({ integer: true }), {
        option: "integer",
        options: {
          integer: true,
        },
        valid: [{ value: 1 }, { value: 2 }, { value: 3 }],
        invalid: [{ value: 1.5 }, { value: 2.5 }, { value: 3.5 }],
      });

      testGuard("number", v.number({ integer: false }), {
        option: "integer",
        options: {
          integer: false,
        },
        valid: [
          { value: 1.5 },
          { value: 2.5 },
          { value: 3.5 },
          { value: 1 },
          { value: 2 },
          { value: 3 },
        ],
        invalid: [],
      });
    });

    test("unsafe", () => {
      testGuard("number", v.number({ unsafe: true }), {
        option: "unsafe",
        options: {
          unsafe: true,
        },
        valid: [
          { value: Infinity },
          { value: -Infinity },
          { value: NaN },
          { value: -1 },
          { value: 0 },
          { value: 1 },
          { value: 2 ** 69 },
        ],
        invalid: [],
      });

      testGuard("number", v.number({ unsafe: false }), {
        option: "unsafe",
        options: {
          unsafe: false,
        },
        valid: [{ value: -1 }, { value: 0 }, { value: 1 }],
        invalid: [
          { value: Infinity },
          { value: -Infinity },
          { value: NaN },
          { value: 2 ** 69 },
        ],
      });
    });
  });

  test("type", () => {
    const guard = v.number;
    const guardCalledArgs = v.number({});

    expectTypeOf<Parse<typeof guard>>().toEqualTypeOf<number>();
    expectTypeOf<Parse<typeof guardCalledArgs>>().toEqualTypeOf<number>();
  });
});

describe("vality.boolean", () => {
  describe("base type check", () => {
    test("in strict mode", () => {
      config.strict = true;

      testGuard("boolean", v.boolean, {
        valid: [{ value: true }, { value: false }],
        invalid: [
          { value: "" },
          { value: "foo" },
          { value: "bar" },
          { value: "foo bar" },
          { value: -1.5 },
          { value: -1 },
          { value: 0 },
          { value: 1 },
          { value: 1.5 },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });
    });

    test("in non-strict mode", () => {
      config.strict = false;

      testGuard("boolean", v.boolean, {
        valid: [
          { value: true },
          { value: false },
          { value: "true", expect: true },
          { value: "false", expect: false },
          { value: "1", expect: true },
          { value: "0", expect: false },
          { value: 1, expect: true },
          { value: 0, expect: false },
        ],
        invalid: [
          { value: "" },
          { value: "foo" },
          { value: "bar" },
          { value: "foo bar" },
          { value: -1.5 },
          { value: -1 },
          { value: 1.5 },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });
    });
  });

  test("type", () => {
    const guard = v.boolean;
    const guardCalledArgs = v.boolean({});

    expectTypeOf<Parse<typeof guard>>().toEqualTypeOf<boolean>();
    expectTypeOf<Parse<typeof guardCalledArgs>>().toEqualTypeOf<boolean>();
  });
});

describe("vality.date", () => {
  describe("base type check", () => {
    test("in strict mode", () => {
      config.strict = true;

      testGuard("date", v.date, {
        valid: [{ value: new Date() }, { value: new Date(NaN) }],
        invalid: [
          { value: "" },
          { value: "foo" },
          { value: "bar" },
          { value: "foo bar" },
          { value: -1.5 },
          { value: -1 },
          { value: 0 },
          { value: 1 },
          { value: 1.5 },
          { value: true },
          { value: false },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });
    });

    test("in non-strict mode", () => {
      config.strict = false;

      testGuard("date", v.date, {
        valid: [
          { value: new Date() },
          {
            value: "2020-01-01",
            expect: expect.callback(
              (val) => val instanceof Date && val.getTime() === 1577836800000
            ),
          },
          {
            value: "2020-01-01T00:00:00.000Z",
            expect: expect.callback(
              (val) => val instanceof Date && val.getTime() === 1577836800000
            ),
          },
          {
            value: -1,
            expect: expect.callback(
              (val) => val instanceof Date && val.getTime() === -1
            ),
          },
          {
            value: 0,
            expect: expect.callback(
              (val) => val instanceof Date && val.getTime() === 0
            ),
          },
          {
            value: 1,
            expect: expect.callback(
              (val) => val instanceof Date && val.getTime() === 1
            ),
          },
        ],
        invalid: [
          { value: "" },
          { value: "foo" },
          { value: "bar" },
          { value: "foo bar" },
          { value: true },
          { value: false },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });
    });
  });

  describe("options", () => {
    test("min", () => {
      testGuard("date", v.date({ min: new Date(0) }), {
        option: "min",
        options: {
          min: new Date(0),
        },
        valid: [
          { value: new Date(0) },
          { value: new Date(1) },
          { value: new Date(2) },
        ],
        invalid: [{ value: new Date(-2) }, { value: new Date(-1) }],
      });
    });

    test("max", () => {
      testGuard("date", v.date({ max: new Date(0) }), {
        option: "max",
        options: {
          max: new Date(0),
        },
        valid: [
          { value: new Date(-2) },
          { value: new Date(-1) },
          { value: new Date(0) },
        ],
        invalid: [{ value: new Date(1) }, { value: new Date(2) }],
      });
    });

    test("past", () => {
      jest.useFakeTimers().setSystemTime(1234);

      testGuard("date", v.date({ past: true }), {
        option: "past",
        options: {
          past: true,
        },
        valid: [
          { value: new Date(-1) },
          { value: new Date(0) },
          { value: new Date(1233) },
        ],
        invalid: [{ value: new Date(1234) }, { value: new Date(1235) }],
      });
    });

    test("future", () => {
      jest.useFakeTimers().setSystemTime(1234);

      testGuard("date", v.date({ future: true }), {
        option: "future",
        options: {
          future: true,
        },
        valid: [{ value: new Date(1235) }],
        invalid: [
          { value: new Date(-1) },
          { value: new Date(0) },
          { value: new Date(1233) },
          { value: new Date(1234) },
        ],
      });
    });
  });

  test("type", () => {
    const guard = v.date;
    const guardCalledArgs = v.date({});

    expectTypeOf<Parse<typeof guard>>().toEqualTypeOf<Date>();
    expectTypeOf<Parse<typeof guardCalledArgs>>().toEqualTypeOf<Date>();
  });
});

describe("vality.literal", () => {
  describe("base type check", () => {
    test("in strict mode", () => {
      config.strict = true;

      testGuard("literal", v.literal("foo"), {
        valid: [{ value: "foo" }],
        invalid: [
          { value: "" },
          { value: "bar" },
          { value: "foo bar" },
          { value: -1.5 },
          { value: -1 },
          { value: 0 },
          { value: 1 },
          { value: 1.5 },
          { value: true },
          { value: false },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });

      testGuard("literal", v.literal(7), {
        valid: [{ value: 7 }],
        invalid: [
          { value: "" },
          { value: "bar" },
          { value: "foo bar" },
          { value: "7" },
          { value: -1.5 },
          { value: -1 },
          { value: 0 },
          { value: 1 },
          { value: 1.5 },
          { value: true },
          { value: false },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });
    });

    test("in non-strict mode", () => {
      config.strict = false;

      testGuard("literal", v.literal("foo"), {
        valid: [{ value: "foo" }],
        invalid: [
          { value: "" },
          { value: "bar" },
          { value: "foo bar" },
          { value: -1.5 },
          { value: -1 },
          { value: 0 },
          { value: 1 },
          { value: 1.5 },
          { value: true },
          { value: false },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });

      testGuard("literal", v.literal("7"), {
        valid: [{ value: "7" }, { value: 7, expect: "7" }],
        invalid: [
          { value: "" },
          { value: "bar" },
          { value: "foo bar" },
          { value: -1.5 },
          { value: -1 },
          { value: 0 },
          { value: 1 },
          { value: 1.5 },
          { value: true },
          { value: false },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });

      testGuard("literal", v.literal(7.5), {
        valid: [{ value: 7.5 }, { value: "7.5", expect: 7.5 }],
        invalid: [
          { value: "" },
          { value: "bar" },
          { value: "foo bar" },
          { value: -1.5 },
          { value: -1 },
          { value: 0 },
          { value: 1 },
          { value: 1.5 },
          { value: true },
          { value: false },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });

      testGuard("literal", v.literal(true), {
        valid: [
          { value: true },
          { value: "true", expect: true },
          { value: "1", expect: true },
          { value: 1, expect: true },
        ],
        invalid: [
          { value: "" },
          { value: "bar" },
          { value: "foo bar" },
          { value: -1.5 },
          { value: -1 },
          { value: 0 },
          { value: 1.5 },
          { value: false },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });

      testGuard("literal", v.literal(false), {
        valid: [
          { value: false },
          { value: "false", expect: false },
          { value: "0", expect: false },
          { value: 0, expect: false },
        ],
        invalid: [
          { value: "" },
          { value: "bar" },
          { value: "foo bar" },
          { value: -1.5 },
          { value: -1 },
          { value: 1 },
          { value: 1.5 },
          { value: true },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });
    });
  });

  describe("options", () => {
    test("default", () => {
      testGuard("literal", v.literal("foo")({ default: true }), {
        options: {
          default: true,
        },
        valid: [{ value: "foo" }, { value: undefined, expect: "foo" }],
        invalid: [
          { value: "" },
          { value: "baz" },
          { value: "foo bar" },
          { value: -1.5 },
          { value: -1 },
          { value: 0 },
          { value: 1 },
          { value: 1.5 },
          { value: true },
          { value: false },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });

      testGuard("literal", v.literal("foo")({ default: false }), {
        valid: [{ value: "foo" }],
        invalid: [
          { value: "" },
          { value: "baz" },
          { value: "foo bar" },
          { value: -1.5 },
          { value: -1 },
          { value: 0 },
          { value: 1 },
          { value: 1.5 },
          { value: true },
          { value: false },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => {} },
        ],
      });
    });
  });

  test("type", () => {
    {
      const guard = v.literal(1);
      const guardCalledArgs = v.literal(1)({});

      expectTypeOf<Parse<typeof guard>>().toEqualTypeOf<1>();
      expectTypeOf<Parse<typeof guardCalledArgs>>().toEqualTypeOf<1>();
    }
    {
      const guard = v.literal("foo");
      const guardCalledArgs = v.literal("foo")({});

      expectTypeOf<Parse<typeof guard>>().toEqualTypeOf<"foo">();
      expectTypeOf<Parse<typeof guardCalledArgs>>().toEqualTypeOf<"foo">();
    }
    {
      const guard = v.literal(true);
      const guardCalledArgs = v.literal(true)({});

      expectTypeOf<Parse<typeof guard>>().toEqualTypeOf<true>();
      expectTypeOf<Parse<typeof guardCalledArgs>>().toEqualTypeOf<true>();
    }
  });
});

describe("vality.relation", () => {
  test("base type check", () => {
    testGuard(
      "relation",
      v.relation(() => ({})),
      {
        valid: [{ value: null }, { value: 0 }, { value: 1 }],
        invalid: [
          { value: "" },
          { value: "foo" },
          { value: "bar" },
          { value: "foo bar" },
          { value: true },
          { value: false },
          { value: undefined },
          { value: {} },
          { value: { foo: "bar" } },
          { value: [] },
          { value: ["foo"] },
          { value: () => { } },
        ],
      }
    );
  });

  test("type", () => {
    type M = {"my": "model"}
    const guard = v.relation(null as any as () => M);
    const guardCalledArgs = v.relation(null as any as () => M)({});

    expectTypeOf<Parse<typeof guard>>().toEqualTypeOf<M>();
    expectTypeOf<Parse<typeof guardCalledArgs>>().toEqualTypeOf<M>();
  });

});

describe("vality.any", () => {
  describe("base type check", () => {
    testGuard("any", v.any, {
      valid: [
        { value: null },
        { value: 0 },
        { value: 1 },
        { value: "" },
        { value: "foo" },
        { value: "bar" },
        { value: "foo bar" },
        { value: true },
        { value: false },
        { value: {} },
        { value: { foo: "bar" } },
        { value: [] },
        { value: ["foo"] },
        { value: () => { } },
      ],
      invalid: [{ value: undefined }],
    });
  });

  test("type", () => {
    const guard = v.any;
    const guardCalledArgs = v.any({});

    expectTypeOf<Parse<typeof guard>>().toEqualTypeOf<any>();
    expectTypeOf<Parse<typeof guardCalledArgs>>().toEqualTypeOf<any>();
  });
});
