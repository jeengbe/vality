import { expectType, TypeEqual } from "ts-expect";
import { Error, Face, Parse, v, validate } from "vality";
import { config } from "vality/config";
import { RSA } from "vality/utils";

export function testGuard(
  name: keyof vality.guards,
  guard: Face<any, any, any>,
  {
    option,
    options,
    context,
    config: newConfig,
    valid = [],
    invalid = [],
  }: {
    option?: string;
    options?: RSA;
    context?: RSA;
    config?: RSA;
    default?: RSA;
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

describe("vality.string", () => {
  describe("base type check", () => {
    test("in strict mode", () => {
      testGuard(
        "string",
        v.string({
          strict: true,
        }),
        {
          options: {
            strict: true,
          },
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
        }
      );

      testGuard("string", v.string, {
        context: {
          strict: true,
        },
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

      testGuard("string", v.string, {
        config: {
          strict: true,
        },
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
      testGuard(
        "string",
        v.string({
          strict: false,
        }),
        {
          options: {
            strict: false,
          },
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
        }
      );

      testGuard("string", v.string, {
        context: {
          strict: false,
        },
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

      testGuard("string", v.string, {
        config: {
          strict: false,
        },
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

    expectType<TypeEqual<string, Parse<typeof guard>>>(true);
    expectType<TypeEqual<string, Parse<typeof guardCalledArgs>>>(true);
  });
});

describe("vality.number", () => {
  describe("base type check", () => {
    test("in strict mode", () => {
      testGuard("number", v.number({
        strict: true
      }), {
        options: {strict: true},
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

      testGuard("number", v.number, {
        context: {strict: true},
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

      testGuard("number", v.number, {
        config: {strict: true},
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
      testGuard("number", v.number({
        strict: false
      }), {
        options: {strict: false},
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

      testGuard("number", v.number, {
        context: {strict: false},
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

      testGuard("number", v.number, {
        config: {strict: false},
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

    expectType<TypeEqual<number, Parse<typeof guard>>>(true);
    expectType<TypeEqual<number, Parse<typeof guardCalledArgs>>>(true);
  });
});

describe("vality.boolean", () => {
  describe("base type check", () => {
    test("in strict mode", () => {
      testGuard("boolean", v.boolean({strict: true}), {
        options: { strict: true },
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

      testGuard("boolean", v.boolean, {
        context: { strict: true },
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

      testGuard("boolean", v.boolean, {
        config: { strict: true },
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
      testGuard("boolean", v.boolean({strict: false}), {
        options: { strict: false },
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

      testGuard("boolean", v.boolean, {
        context: { strict: false },
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

      testGuard("boolean", v.boolean, {
        config: { strict: false },
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

    expectType<TypeEqual<boolean, Parse<typeof guard>>>(true);
    expectType<TypeEqual<boolean, Parse<typeof guardCalledArgs>>>(true);
  });
});

describe("vality.date", () => {
  describe("base type check", () => {
    test("in strict mode", () => {
      testGuard("date", v.date({strict: true}), {
        options: { strict: true },
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

      testGuard("date", v.date, {
        context: { strict: true },
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

      testGuard("date", v.date, {
        config: { strict: true },
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
      testGuard("date", v.date({strict: false}), {
        options: { strict: false },
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

      testGuard("date", v.date, {
        context: { strict: false },
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

      testGuard("date", v.date, {
        config: { strict: false },
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

    expectType<TypeEqual<Date, Parse<typeof guard>>>(true);
    expectType<TypeEqual<Date, Parse<typeof guardCalledArgs>>>(true);
  });
});

describe("vality.literal", () => {
  describe("base type check", () => {
    test("in strict mode", () => {
      testGuard("literal", v.literal("foo")({
        strict: true,
      }), {
        options: { strict: true },
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

      testGuard("literal", v.literal(7)({
        strict: true,
      }), {
        options: { strict: true },
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

      testGuard("literal", v.literal(7), {
        context: { strict: true },
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

      testGuard("literal", v.literal(7), {
        config: { strict: true },
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
      testGuard("literal", v.literal("foo")({
        strict: false,
      }), {
        options: { strict: false },
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

      testGuard("literal", v.literal("7")({
        strict: false,
      }), {
        options: { strict: false },
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

      testGuard("literal", v.literal(7.5)({
        strict: false,
      }), {
        options: { strict: false },
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

      testGuard("literal", v.literal(true)({
        strict: false,
      }), {
        options: { strict: false },
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

      testGuard("literal", v.literal(false)({
        strict: false,
      }), {
        options: { strict: false },
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

      testGuard("literal", v.literal(false), {
        context: { strict: false },
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

      testGuard("literal", v.literal(false), {
        config: { strict: false },
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

      expectType<TypeEqual<1, Parse<typeof guard>>>(true);
      expectType<TypeEqual<1, Parse<typeof guardCalledArgs>>>(true);
    }
    {
      const guard = v.literal("foo");
      const guardCalledArgs = v.literal("foo")({});

      expectType<TypeEqual<"foo", Parse<typeof guard>>>(true);
      expectType<TypeEqual<"foo", Parse<typeof guardCalledArgs>>>(true);
    }
    {
      const guard = v.literal(true);
      const guardCalledArgs = v.literal(true)({});

      expectType<TypeEqual<true, Parse<typeof guard>>>(true);
      expectType<TypeEqual<true, Parse<typeof guardCalledArgs>>>(true);
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
          { value: () => {} },
        ],
      }
    );
  });

  test("type", () => {
    type M = { my: "model" };
    const guard = v.relation(null as any as () => M);
    const guardCalledArgs = v.relation(null as any as () => M)({});

    expectType<TypeEqual<M, Parse<typeof guard>>>(true);
    expectType<TypeEqual<M, Parse<typeof guardCalledArgs>>>(true);
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
        { value: () => {} },
      ],
      invalid: [{ value: undefined }],
    });
  });

  test("type", () => {
    const guard = v.any;
    const guardCalledArgs = v.any({});

    expectType<TypeEqual<unknown, Parse<typeof guard>>>(true);
    expectType<TypeEqual<unknown, Parse<typeof guardCalledArgs>>>(true);
  });
});

describe("vality.never", () => {
  describe("base type check", () => {
    testGuard("never", v.never, {
      invalid: [
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
        { value: () => {} },
        { value: undefined },
      ],
    });
  });

  test("type", () => {
    const guard = v.never;
    const guardCalledArgs = v.never({});

    expectType<TypeEqual<never, Parse<typeof guard>>>(true);
    expectType<TypeEqual<never, Parse<typeof guardCalledArgs>>>(true);
  });
});
