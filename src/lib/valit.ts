import { _readonly, _type, _validate, _valit } from "./symbols";
import { assert, MakeRequired, RSA, RSN } from "./utils";
import type { Path, Validate, ValidateFn, ValidationResult } from "./validate";

export type Valitate<V> = { [_valit]?: true; } & Validate<V>;
export type Valit<V, Options extends RSA = RSN> = Valitate<V> & ((options: Partial<Options> | ((parent: any) => Partial<Options>)) => Valitate<V>);

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
    const getFnWithValitWithOptions: (options: Partial<Options>) => ValidateFn<Type> = (options) => (value, path, parent) => {
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

    return Object.assign(
      (options: Partial<Options> | ((parent: any) => Partial<Options>)): Valitate<Type> => {
        return {
          [_validate]: (val, path, parent) => {
            if (typeof options === "function") options = options(parent);
            return getFnWithValitWithOptions(options)(val, path);
          },
          [_type]: undefined as unknown as Type,
        };
      },
      {
        [_validate]: getFnWithValitWithOptions({}),
        [_type]: undefined as unknown as Type,
      }
    );
  };
}
