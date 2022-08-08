import type { GuardFunction, Validate, ValidationResult } from "./guard";
import { _options, _type, _validate } from "./symbols";
import { MakeRequired, RSA, RSN } from "./utils";
import type { Path } from "./validate";

// This symbol is used to distingush between a guard and a valit
export const _valit = Symbol("valit");

export type ValitFunction<V, Options extends RSA = RSN> = { [_valit]?: any } & GuardFunction<V, Options>;
export type Valit<V, Options extends RSA = RSN> = (<O extends Options>(options: Partial<O>) => ValitFunction<V, O>) &
  ValitFunction<V>;

export function valit<Arg extends any[], Type, Options extends RSA = RSN>(
  name: string,
  fn: (...args: Arg) => (val: unknown, path: Path, options: Partial<Options>) => ValidationResult,
  handleOptions?: {
    [K in keyof Options]-?: (val: Type, o: NonNullable<Options[K]>, options: MakeRequired<Options, K>) => boolean;
  }
): (...args: Arg) => Valit<Type, Options> {
  return (...args) => {
    const fnWithValit: Validate = (val, path = []) => {
      return fn(...args)(val, path, {});
    };

    return Object.assign(
      <O extends Options>(options: Partial<O>) => {
        const fnWithValitWithOptions: Validate = (val, path = []) => {
          const valid = fn(...args)(val, path, options);
          if (!valid.valid) return valid;
          if (handleOptions === undefined) return { valid: true, errors: [] };
          const keysWithError = Object.keys(options).filter(
            k => !handleOptions[k](val as Type, (options as Options)[k], options as MakeRequired<Options, typeof k>)
          );
          return {
            valid: keysWithError.length === 0,
            errors: keysWithError.map(k => ({
              message: `vality.${name}.options.${k}`,
              path,
              options,
              val,
            })),
          };
        };

        return Object.assign({
          [_validate]: fnWithValitWithOptions,
          [_type]: undefined as unknown as Type,
          [_options]: options,
        });
      },
      {
        [_validate]: fnWithValit,
        [_type]: undefined as unknown as Type,
        [_options]: {},
      }
    );
  };
}
