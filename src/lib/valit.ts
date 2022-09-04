import { _readonly } from "./symbols";
import { assert, MakeRequired, makeValidate, RSA, RSN } from "./utils";
import type { Path, Validate, ValidateFn, ValidationResult } from "./validate";

export type Valit<Type, Options extends RSA = RSN> = Validate<Type, Options, true>;

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
): (...args: Arg) => Validate<Type, Options, true> {
  return (...args) => {
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

    return makeValidate<Type, Options, true>(getFnWithValitWithOptions);
  };
}
