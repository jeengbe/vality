import { _type, _validate } from "./symbols";
import { assert, MakeRequired, RSA, RSN } from "./utils";
import type { Validate, ValidateFn } from "./validate";

export type Guard<Type, Options extends RSA = RSN> = Validate<Type> & ((options: Partial<Options>) => Validate<Type>);

export function guard<Type, Options extends RSA = RSN>(
  name: string,
  fn: (val: unknown, options: Partial<Options>) => boolean,
  handleOptions?: {
    [K in keyof Options]?: (val: Type, o: NonNullable<Options[K]>, options?: MakeRequired<Options, K>) => boolean;
  },
  defaultOptions: {
    [K in keyof Options]?: Options[K];
  } = {}
): Guard<Type, Options> {
  function getFnWithErrors(options: Partial<Options>): ValidateFn {
    assert<(val: unknown, options: Partial<Options>) => val is Type>(fn);

    return (value, path = []) => {
      const valid = fn(value, options);
      if (!valid)
        return {
          valid,
          errors: [
            {
              message: `vality.${name}.base`,
              path,
              options,
              value,
            },
          ],
        };
      if (handleOptions === undefined) return { valid: true, value, errors: [] };
      const keysWithError = Object.keys(options).filter(
        k => handleOptions[k] !== undefined && !handleOptions[k]!(value, options[k]!, options as MakeRequired<Options, typeof k>)
      );
      return {
        valid: keysWithError.length === 0,
        errors: keysWithError.map(k => ({
          message: `vality.${name}.options.${k}`,
          options,
          path,
          value,
        })),
      };
    };
  }

  return Object.assign(
    (options: Partial<Options>) => {
      return {
        [_validate]: getFnWithErrors({ ...defaultOptions, ...options }),
        [_type]: undefined as unknown as Type,
      };
    },
    {
      [_validate]: getFnWithErrors(defaultOptions),
      [_type]: undefined as unknown as Type,
    }
  );
}
