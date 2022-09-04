import { _readonly, _type, _validate, _valit } from "./symbols";
import { assert, MakeRequired, RSA, RSN } from "./utils";
import type { Path, Validate, ValidateFn, ValidationResult } from "./validate";

export type Valitate<V> = { [_valit]?: true; } & Validate<V>;
export type Valit<V, Options extends RSA = RSN> = Valitate<V> & ((options: Partial<Options>) => Valitate<V>);

export type ValitOptions<Name extends keyof vality.valits, Fn = vality.valits[Name]> = Fn extends (
  ...args: infer Args
) => Valit<infer Type, infer Options>
  ? [Args, Type, Options]
  : never;

// This is a special type used only by vality.readonly
export type ReadonlyValit<T> = { [_readonly]?: true; } & Valit<T>;

export function valit<
  Name extends keyof vality.valits,
  Arg extends ValitOptions<Name>[0],
  Type extends ValitOptions<Name>[1],
  Options extends RSA & ValitOptions<Name>[2]
>(
  name: Name,
  fn: (...args: Arg) => (val: unknown, path: Path, options: Partial<Options>, parent?: any) => ValidationResult<Type>,
  handleOptions?: {
    [K in keyof Options]?: (val: Type, o: NonNullable<Options[K]>, options: MakeRequired<Options, K>) => boolean;
  },
  defaultOptions?: Partial<Options>
): (...args: Arg) => Valit<Type, Options> {
  return (...args): Valit<Type, Options> => {
    const fnWithValit: ValidateFn<Type> = (val, path = [], parent) => {
      return fn(...args)(val, path, {}, parent);
    };

    return Object.assign(
      (options: Partial<Options>): Valitate<Type> => {
        const fnWithValitWithOptions: ValidateFn<Type> = (value, path = [], parent) => {
          const data = fn(...args)(value, path, options, parent);
          if (!data.valid) return data;

          if (handleOptions === undefined) return data;
          assert<Type>(value);
          const optionsWithDefault = { ...defaultOptions, ...options };

          const keysWithError = Object.keys(optionsWithDefault).filter(
            k =>
              handleOptions[k] !== undefined && !handleOptions[k]!(value, optionsWithDefault[k]!, options as MakeRequired<Options, typeof k>)
          );
          if (keysWithError.length === 0) return data;
          return {
            valid: false,
            data: undefined,
            errors: keysWithError.map(k => ({
              message: k in options ? `vality.${name}.options.${k}` : `vality.${name}.base`,
              options,
              path,
              value,
            })),
          };
        };

        return {
          [_validate]: fnWithValitWithOptions,
          [_type]: undefined as unknown as Type,
        };
      },
      {
        [_validate]: fnWithValit,
        [_type]: undefined as unknown as Type,
      }
    );
  };
}
