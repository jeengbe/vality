import { expectType, TypeEqual } from "ts-expect";
import { Error, Parse, v, validate } from "vality";
import { config } from "vality/config";
import { _type } from "vality/symbols";
import { RSA } from "vality/utils";
import { Guard } from "vality/valit";

export function testScalar(
  name: keyof vality.scalars,
  guard: Guard<any, any, any>,
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
      testScalar(
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

      testScalar("string", v.string, {
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

      testScalar("string", v.string, {
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
      testScalar(
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

      testScalar("string", v.string, {
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

      testScalar("string", v.string, {
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

      testScalar("string", v.string, {
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
      testScalar("string", v.string({ minLength: 2 }), {
        option: "minLength",
        options: {
          minLength: 2,
        },
        valid: [{ value: "ab" }, { value: "abc" }],
        invalid: [{ value: "" }, { value: "a" }],
      });
    });

    test("maxLength", () => {
      testScalar("string", v.string({ maxLength: 2 }), {
        option: "maxLength",
        options: {
          maxLength: 2,
        },
        valid: [{ value: "" }, { value: "a" }, { value: "ab" }],
        invalid: [{ value: "abc" }, { value: "abcd" }],
      });
    });

    test("match", () => {
      testScalar("string", v.string({ match: /^(?:foo|bar)+$/ }), {
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
    expectType<TypeEqual<string, Parse<typeof guard>>>(true);
  });
});

describe("vality.number", () => {
  describe("base type check", () => {
    test("in strict mode", () => {
      testScalar(
        "number",
        v.number({
          strict: true,
        }),
        {
          options: { strict: true },
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
        }
      );

      testScalar("number", v.number, {
        context: { strict: true },
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

      testScalar("number", v.number, {
        config: { strict: true },
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
      testScalar(
        "number",
        v.number({
          strict: false,
        }),
        {
          options: { strict: false },
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
        }
      );

      testScalar("number", v.number, {
        context: { strict: false },
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

      testScalar("number", v.number, {
        config: { strict: false },
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

      testScalar("number", v.number, {
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
      testScalar("number", v.number({ min: 2 }), {
        option: "min",
        options: {
          min: 2,
        },
        valid: [{ value: 2 }, { value: 3 }],
        invalid: [{ value: 1 }, { value: 0 }, { value: -1 }, { value: -2 }],
      });
    });

    test("max", () => {
      testScalar("number", v.number({ max: 2 }), {
        option: "max",
        options: {
          max: 2,
        },
        valid: [{ value: 1 }, { value: 2 }],
        invalid: [{ value: 3 }, { value: 4 }, { value: 5 }],
      });
    });

    test("onlyInteger", () => {
      testScalar("number", v.number({ onlyInteger: true }), {
        option: "onlyInteger",
        options: {
          onlyInteger: true,
        },
        valid: [{ value: 1 }, { value: 2 }, { value: 3 }],
        invalid: [{ value: 1.5 }, { value: 2.5 }, { value: 3.5 }],
      });

      testScalar("number", v.number({ onlyInteger: false }), {
        option: "onlyInteger",
        options: {
          onlyInteger: false,
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

    test("allowUnsafe", () => {
      testScalar("number", v.number({ allowUnsafe: true, allowNaN: true }), {
        option: "allowUnsafe",
        options: {
          allowNaN: true,
          allowUnsafe: true,
        },
        valid: [
          { value: Infinity },
          { value: -Infinity },
          { value: NaN },
          { value: -1 },
          { value: 0 },
          { value: 1 },
          { value: 2 ** 69 },
          { value: 2 ** -69 },
          { value: -(2 ** 69) },
          { value: -(2 ** -69) },
        ],
        invalid: [],
      });

      testScalar("number", v.number({ allowUnsafe: false, allowNaN: true }), {
        option: "allowUnsafe",
        options: {
          allowNaN: true,
          allowUnsafe: false,
        },
        valid: [{ value: -1 }, { value: 0 }, { value: 1 }],
        invalid: [
          { value: Infinity },
          { value: -Infinity },
          { value: NaN },
          { value: 2 ** 69 },
          { value: 2 ** -69 },
          { value: -(2 ** 69) },
          { value: -(2 ** -69) },
        ],
      });
    });

    test("allowNaN", () => {
      testScalar("number", v.number({ allowUnsafe: true, allowNaN: true }), {
        option: "allowNaN",
        options: {
          allowNaN: true,
          allowUnsafe: true,
        },
        valid: [{ value: 0 }, { value: NaN }],
        invalid: [],
      });

      testScalar("number", v.number({ allowUnsafe: true, allowNaN: false }), {
        option: "allowNaN",
        options: {
          allowNaN: false,
          allowUnsafe: true,
        },
        valid: [{ value: 0 }],
        invalid: [{ value: NaN }],
      });
    });
  });

  test("type", () => {
    const guard = v.number;
    expectType<TypeEqual<number, Parse<typeof guard>>>(true);
  });
});

describe("vality.boolean", () => {
  describe("base type check", () => {
    test("in strict mode", () => {
      testScalar("boolean", v.boolean({ strict: true }), {
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

      testScalar("boolean", v.boolean, {
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

      testScalar("boolean", v.boolean, {
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
      testScalar("boolean", v.boolean({ strict: false }), {
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

      testScalar("boolean", v.boolean, {
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

      testScalar("boolean", v.boolean, {
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

      testScalar("boolean", v.boolean, {
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
    expectType<TypeEqual<boolean, Parse<typeof guard>>>(true);
  });
});

describe("vality.date", () => {
  describe("base type check", () => {
    test("in strict mode", () => {
      testScalar("date", v.date({ strict: true }), {
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

      testScalar("date", v.date, {
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

      testScalar("date", v.date, {
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
      testScalar("date", v.date({ strict: false }), {
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

      testScalar("date", v.date, {
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

      testScalar("date", v.date, {
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

      testScalar("date", v.date, {
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
      testScalar("date", v.date({ min: new Date(0) }), {
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
      testScalar("date", v.date({ max: new Date(0) }), {
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

      testScalar("date", v.date({ past: true }), {
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

      testScalar("date", v.date({ future: true }), {
        option: "future",
        options: {
          future: true,
        },
        valid: [{ value: new Date(1235) }, { value: new Date(1234) }],
        invalid: [
          { value: new Date(-1) },
          { value: new Date(0) },
          { value: new Date(1233) },
        ],
      });
    });
  });

  test("type", () => {
    const guard = v.date;
    expectType<TypeEqual<Date, Parse<typeof guard>>>(true);
  });
});

describe("vality.literal", () => {
  describe("base type check", () => {
    test("in strict mode", () => {
      testScalar(
        "literal",
        v.literal("foo")({
          strict: true,
        }),
        {
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
        }
      );

      testScalar(
        "literal",
        v.literal(7)({
          strict: true,
        }),
        {
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
        }
      );

      testScalar("literal", v.literal(7), {
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

      testScalar("literal", v.literal(7), {
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
      testScalar(
        "literal",
        v.literal("foo")({
          strict: false,
        }),
        {
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
        }
      );

      testScalar(
        "literal",
        v.literal("7")({
          strict: false,
        }),
        {
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
        }
      );

      testScalar(
        "literal",
        v.literal(7.5)({
          strict: false,
        }),
        {
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
        }
      );

      testScalar(
        "literal",
        v.literal(true)({
          strict: false,
        }),
        {
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
        }
      );

      testScalar(
        "literal",
        v.literal(false)({
          strict: false,
        }),
        {
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
        }
      );

      testScalar("literal", v.literal(false), {
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

      testScalar("literal", v.literal(false), {
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

      testScalar("literal", v.literal(false), {
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
      testScalar("literal", v.literal("foo")({ default: true }), {
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

      testScalar("literal", v.literal("foo")({ default: false }), {
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

  it("attaches the value to the Guard", () => {
    const val = {};
    // @ts-expect-error We use an object to check for reference equality
    expect(v.literal(val)[_type][0][_type]).toBe(val);
  });

  test("type", () => {
    {
      const guard = v.literal(1);
      expectType<TypeEqual<1, Parse<typeof guard>>>(true);
    }
    {
      const guard = v.literal("foo");
      expectType<TypeEqual<"foo", Parse<typeof guard>>>(true);
    }
    {
      const guard = v.literal(true);
      expectType<TypeEqual<true, Parse<typeof guard>>>(true);
    }
  });
});

describe("vality.any", () => {
  describe("base type check", () => {
    testScalar("any", v.any, {
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
    expectType<TypeEqual<unknown, Parse<typeof guard>>>(true);
  });
});

describe("vality.never", () => {
  describe("base type check", () => {
    testScalar("never", v.never, {
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
    expectType<TypeEqual<never, Parse<typeof guard>>>(true);
  });
});
