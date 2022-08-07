import { _options, _type, _validate } from "./symbols";
import type { MakeRequired, RSA, RSN } from "./utils";
import type { Error, Path } from "./validate";

export type GuardResult = { valid: boolean; errors: Error[] };

export type Validate = (val: unknown, path?: Path) => GuardResult;

export type GuardFunction<Type, Options extends RSA = RSN> = {
  [_validate]: Validate;
  // We need this so that GuardFunction doesn't lose its type
  [_type]: Type;
  [_options]: Partial<Options>;
};

export type Guard<Type, Options extends RSA = RSN> = GuardFunction<Type, RSN> &
  (<O extends Options>(options: Readonly<O>) => GuardFunction<Type, O>);

export function guard<Type, Options extends RSA = RSN>(
  name: string,
  fn: (val: unknown, options: Partial<Options>) => boolean,
  handleOptions?: {
    [K in keyof Options]-?: (val: Type, o: NonNullable<Options[K]>, options: MakeRequired<Options, K>) => boolean;
  }
): Guard<Type, Options> {
  const fnWithError: Validate = (val, path = []) => {
    const valid = fn(val, {});
    return {
      valid,
      errors: valid
        ? []
        : [
            {
              message: `vality.${name}.type`,
              path,
              options: {},
              val,
            },
          ],
    };
  };

  return Object.assign(
    <O extends Options>(options: Partial<O>) => {
      const fnWithErrorAndOptions: Validate = (val, path = []) => {
        const valid = fn(val, options);
        if (!valid)
          return {
            valid,
            errors: [
              {
                message: `vality.${name}.type`,
                path,
                options,
                val,
              },
            ],
          };
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
        [_validate]: fnWithErrorAndOptions,
        // This is ugly, but the only way to ensure [_type] keeps its type
        [_type]: undefined as unknown as Type,
        [_options]: options,
      });
    },
    {
      [_validate]: fnWithError,
      [_type]: undefined as unknown as Type,
      [_options]: {},
    }
  );
}
