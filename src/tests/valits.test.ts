import { validate, vality } from "../lib";
import { assert, MaybeArray } from "../lib/utils";
import { Valit } from "../lib/valit";

type IV = {
  valid: any[];
  invalid: any[];
};

type ValitOptions<G extends keyof vality.valits> = vality.valits[G] extends (...args: any[]) => Valit<any, infer O> ? O : never;

function testValit<G extends keyof vality.valits, O extends ValitOptions<G>>(
  valit: G,
  simple: MaybeArray<
    {
      eny: any;
    } & IV
  >,
  options: {
    [K in keyof O]: MaybeArray<{ eny: any; value: O[K] } & IV>;
  }
) {
  describe(valit, () => {
    it("works without options", () => {
      const s = Array.isArray(simple) ? simple : [simple];
      for (const sc of s) {
        for (const v of sc.valid) {
          // @ts-ignore
          expect(validate((vality[valit] as any)(sc.eny), v)).toBeValid();
        }
        for (const v of sc.invalid) {
          expect(validate((vality[valit] as any)(sc.eny), v)).toBeInvalid(`vality.${valit}.base`);
        }
      }
    });

    if (Object.keys(options).length === 0) {
      it.skip("with options", () => void 0);
    }

    describe("options", () => {
      for (const o in options) {
        assert<keyof O>(o);
        const values = (Array.isArray(options[o]) ? options[o] : [options[o]]) as (IV & { eny: any, value: O[typeof o] })[];
        it(o, () => {
          for (const val of values) {
            for (const v of val.valid) {
              expect(
                validate(
                  // TODO: un-any this
                  (vality[valit] as any)(val.eny)({
                    [o]: val.value,
                  }),
                  v
                )
              ).toBeValid();
            }
            for (const v of val.invalid) {
              expect(
                validate(
                  (vality[valit] as any)(val.eny)({
                    [o]: val.value,
                  }),
                  v
                )
              ).toBeInvalid(`vality.${valit}.options.${o}`);
            }
          }
        });
      }
    });
  });
}

describe.skip("built-in valits", () => {
  testValit(
    "array",
    [
      {
        eny: vality.string,
        valid: [[], ["a string"], ["a string", "another string", "a third string"]],
        invalid: [1, "a string", {}, [1, 2, 3]],
      },
      {
        eny: {
          a: vality.string,
          b: vality.number,
        },
        valid: [
          [
            { a: "a string", b: 1 },
            { a: "another string", b: 2 },
          ],
          [
            { a: "a string", b: 1 },
            { a: "another string", b: 2 },
            { a: "a third string", b: 3 },
          ],
        ],
        invalid: [
          [
            { a: "a string", b: 1 },
            { a: "another string", b: 2 },
            { a: "a third string", b: "not a number" },
          ],
          ["a", "b"],
        ],
      },
    ],
    {
      minLength: [
        {
          eny: vality.string,
          value: 2,
          valid: [
            ["a string", "another string"],
            ["a string", "another string", "a third string"],
          ],
          invalid: [[], ["a string"], undefined, null, 1, "a string", {}, [1, 2, 3]],
        },
      ],
    }
  );
});

describe("built-in valits", () => {

})
