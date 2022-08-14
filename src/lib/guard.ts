import { _options, _type, _validate } from "./symbols";
import { identity, Identity, IdentityFn, isValid, MakeRequired, RSA, RSN, trueFn } from "./utils";
import type { Validate, ValidateFn } from "./validate";

export type Guard<Type, Options extends RSA = RSN> = Validate<Type> & ((options: Partial<Options>) => Validate<Type>);
export type GuardOptions<Name extends keyof vality.guards, G = vality.guards[Name]> = G extends Guard<infer Type, infer Options>
  ? [Type, Options]
  : G extends (...args: any[]) => Guard<infer Type, infer Options>
  ? [Type, Options]
  : never;

type ExtraOptions<T> = {
  transform?: Identity<T>;
  validate?: (val: T) => boolean;
};

export function guard<
  Name extends keyof vality.guards,
  Type extends GuardOptions<Name>[0],
  Options extends RSA & Omit<GuardOptions<Name>[1], keyof ExtraOptions<any>>
>(
  name: Name,
  fn: (val: unknown, options: Partial<Options>) => Type | undefined,
  handleOptions?: {
    [K in keyof ({
      [K in keyof Options]?: (val: Type, o: NonNullable<Options[K]>, options?: MakeRequired<Options, K>) => boolean;
    } & {
      [K in keyof ExtraOptions<Type>]: ExtraOptions<Type>[K];
    })]: ({
      [K in keyof Options]?: (val: Type, o: NonNullable<Options[K]>, options?: MakeRequired<Options, K>) => boolean;
    } & {
      [K in keyof ExtraOptions<Type>]: ExtraOptions<Type>[K];
    })[K];
  },
  defaultOptions: {
    [K in keyof Options]?: Options[K];
  } = {}
): Guard<Type, Options> {
  const transform = (handleOptions?.transform ?? identity) as IdentityFn<Type>;
  const validate = (handleOptions?.validate ?? trueFn) as (...args: any[]) => boolean;

  function getFnWithErrors(options: Partial<Options>): ValidateFn<Type> {
    return (value, path = []) => {
      const data = fn(value, options);
      if (!isValid(data)) {
        return {
          valid: false,
          data: undefined,
          errors: [
            {
              message: `vality.${name}.base`,
              path,
              options,
              value,
            },
          ],
        };
      }

      if (!validate(data)) {
        return {
          valid: false,
          data: undefined,
          errors: [
            {
              message: `vality.${name}.custom`,
              path,
              options,
              value,
            },
          ],
        };
      }
      if (handleOptions === undefined) return { valid: true, data: transform(data), errors: [] };
      const keysWithError = Object.keys(options).filter(
        k =>
          k !== "transform" &&
          k !== "validate" &&
          handleOptions[k] !== undefined &&
          !handleOptions[k]!(data, options[k]!, options as MakeRequired<Options, typeof k>)
      );

      if (keysWithError.length === 0) {
        return {
          valid: true,
          data: transform(data),
          errors: [],
        };
      }
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
  }

  return Object.assign(
    (options: Partial<Options>) => {
      return {
        [_validate]: getFnWithErrors({ ...defaultOptions, ...options }),
        [_options]: undefined as any,
        [_type]: undefined as any,
      };
    },
    {
      [_validate]: getFnWithErrors(defaultOptions),
      [_options]: undefined as any,
      [_type]: undefined as any,
    }
  );
}
