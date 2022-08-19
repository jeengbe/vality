import { _readonly, _type, _validate, _valit } from "./symbols";
import { assert, MakeRequired, RSA, RSN } from "./utils";
import type { Path, Validate, ValidateFn, ValidationResult } from "./validate";

export type Valitate<V> = { [_valit]?: typeof _valit } & Validate<V>;
export type Valit<V, Options extends RSA = RSN> = Valitate<V> & ((options: Partial<Options>) => Valitate<V>);

export type ValitOptions<Name extends keyof vality.valits, Fn = vality.valits[Name]> = Fn extends (
  ...args: infer Args
) => Valit<infer T, infer O>
  ? [Args, T, O]
  : never;

// This is a special type used only by vality.readonly
export type ReadonlyValit<T> = { [_readonly]?: typeof _readonly } & Valit<T>;

export function valit<
  Name extends keyof vality.valits,
  Arg extends ValitOptions<Name>[0],
  Type extends ValitOptions<Name>[1],
  Options extends RSA & ValitOptions<Name>[2]
>(
  name: Name,
  fn: (...args: Arg) => (val: unknown, path: Path, options: Partial<Options>) => ValidationResult<Type>,
  handleOptions?: {
    [K in keyof Options]?: (val: Type, o: NonNullable<Options[K]>, options: MakeRequired<Options, K>) => boolean;
  },
  defaultOptions?: {
    [K in keyof Options]?: Options[K];
  }
): (...args: Arg) => Valit<Type, Options> {
  return (...args): Valit<Type, Options> => {
    const fnWithValit: ValidateFn<Type> = (val, path = []) => {
      return fn(...args)(val, path, defaultOptions ?? {});
    };

    return Object.assign(
      (options: Partial<Options>): Valitate<Type> => {
        const fnWithValitWithOptions: ValidateFn<Type> = (value, path = []) => {
          const data = fn(...args)(value, path, { ...defaultOptions, ...options });
          if (!data.valid) return data;
          assert<Type>(value);
          if (handleOptions === undefined) return data;
          const keysWithError = Object.keys(options).filter(
            k =>
              handleOptions[k] !== undefined && !handleOptions[k]!(value, options[k]!, options as MakeRequired<Options, typeof k>)
          );
          if (keysWithError.length === 0) return data;
          return {
            valid: false,
            data: undefined,
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
          [_type]: undefined as any,
        };
      },
      {
        [_validate]: fnWithValit,
        [_type]: undefined as any,
      }
    );
  };
}
