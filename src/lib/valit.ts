import { _undefined, _validate, _valit } from "./symbols";
import { assert, MakeRequired, RSA, RSN } from "./utils";
import type { Path, Validate, ValidateFn, ValidationResult } from "./validate";

export type Valitate<V, MaybeUndefined extends boolean> = { [_valit]?: never; [_undefined]?: MaybeUndefined } & Validate<V>;
export type Valit<V, Options extends RSA = RSN, MaybeUndefined extends boolean = false> = Valitate<V, MaybeUndefined> & ((options: Partial<Options>) => Valitate<V, MaybeUndefined>);

export function valit<Arg extends any[], Type, Options extends RSA = RSN, MaybeUndefined extends boolean = false>(
  name: string,
  fn: (...args: Arg) => (val: unknown, path: Path, options: Partial<Options>) => ValidationResult,
  handleOptions?: {
    [K in keyof Options]?: (val: Type, o: NonNullable<Options[K]>, options: MakeRequired<Options, K>) => boolean;
  },
  defaultOptions?: {
    [K in keyof Options]?: Options[K];
  }
): (...args: Arg) => Valit<Type, Options, MaybeUndefined> {
  return (...args): Valit<Type, Options, MaybeUndefined> => {
    const fnWithValit: ValidateFn = (val, path = []) => {
      return fn(...args)(val, path, defaultOptions ?? {});
    };

    return Object.assign(
      (options: Partial<Options>): Valitate<Type, MaybeUndefined> => {
        const fnWithValitWithOptions: ValidateFn = (value, path = []) => {
          const valid = fn(...args)(value, path, { ...defaultOptions, ...options });
          if (!valid.valid) return valid;
          assert<Type>(value);
          if (handleOptions === undefined) return { valid: true, errors: [] };
          const keysWithError = Object.keys(options).filter(
            k =>
              handleOptions[k] !== undefined && !handleOptions[k]!(value, options[k]!, options as MakeRequired<Options, typeof k>)
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

        return {
          [_validate]: fnWithValitWithOptions,
        };
      },
      {
        [_validate]: fnWithValit,
      }
    );
  };
}
