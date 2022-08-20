import { validate, vality } from "../lib";
import { Guard } from "../lib/guard";
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
    [K in keyof O]: MaybeArray<IV & { value: O[K] }>;
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
                // TODO: Fix this hot mess
                // @ts-ignore
                validate(
                  // @ts-ignore
                  vality[guard]({
                    [o]: val.value,
                  }),
                  v
                )
              ).toBeValid();
            }
            for (const v of val.invalid) {
              expect(
                // @ts-ignore
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

describe("built-in guards", () => {
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
      match: {
        value: /^[a-z]+$/,
        valid: ["a", "z", "sdgasdfgsdfg"],
        invalid: ["A", "Z", "0", "9", " ", "", "__", "___"],
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
      integer: [
        {
          value: true,
          valid: [-1, 0, 1],
          invalid: [-1.1, 1.1],
        }
      ],
    }
  );

  testGuard(
    "boolean",
    {
      valid: [true, false, 0, 1, "0", "1", "true", "false"],
      invalid: [undefined, null, "", "a string"],
    },
    {}
  );

  const futureDate = new Date();
  futureDate.setFullYear(9999);

  testGuard(
    "date",
    {
      valid: [new Date(), -1, -2, new Date().getTime(), "1995-12-17T03:24:00"],
      invalid: [undefined, null, "", "a string"],
    },
    {
      min: {
        value: new Date(1234),
        valid: [new Date(1234), new Date()],
        invalid: [new Date(1233), new Date(0)],
      },
      max: {
        value: new Date(1234),
        valid: [new Date(1234), new Date(0)],
        invalid: [new Date(1235), new Date()],
      },
      past: {
        value: true,
        valid: [new Date(0)],
        invalid: [futureDate],
      },
      future: {
        value: true,
        valid: [futureDate],
        invalid: [new Date(0)],
      },
    }
  );

  describe("literal", () => {
    it("works without options", () => {
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

  describe("relation (default implementation)", () => {
    it("works without options", () => {
      const Person = () => ({
        name: vality.string,
      });

      expect(validate(vality.relation(Person), { name: "__foo__" })).toBeInvalid();
      expect(validate(vality.relation(Person), true)).toBeInvalid();
      expect(validate(vality.relation(Person), 42)).toBeValid();
      expect(validate(vality.relation(Person), 0)).toBeValid();
      expect(validate(vality.relation(Person), -1)).toBeInvalid();
    });
  });
});
