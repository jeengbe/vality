import { _validate } from "./symbols";
import { assert, MakeRequired, RSA, RSN } from "./utils";
import type { Path, Validate, ValidateFn, ValidationResult } from "./validate";

// This symbol is used to distingush between a guard and a valit
export const _valit = Symbol("valit");

export type Valitate<V> = { [_valit]?: never } & Validate<V>;
export type Valit<V, Options extends RSA = RSN> = Valitate<V> & ((options: Partial<Options>) => Valitate<V>);

export function valit<Arg extends any[], Type, Options extends RSA = RSN>(
  name: string,
  fn: (...args: Arg) => (val: unknown, path: Path, options: Partial<Options>) => ValidationResult,
  handleOptions?: {
    [K in keyof Options]?: (val: Type, o: NonNullable<Options[K]>, options: MakeRequired<Options, K>) => boolean;
  },
  defaultOptions?: {
    [K in keyof Options]?: Options[K];
  }
): (...args: Arg) => Valit<Type, Options> {
  return (...args): Valit<Type, Options> => {
    const fnWithValit: ValidateFn = (val, path = []) => {
      return fn(...args)(val, path, defaultOptions ?? {});
    };

    return Object.assign(
      (options: Partial<Options>): Valitate<Type> => {
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
