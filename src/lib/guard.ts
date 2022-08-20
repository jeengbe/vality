import { _type, _validate } from "./symbols";
import { identity, IdentityFn, isValid, MakeRequired, RSA, RSN, trueFn } from "./utils";
import type { Validate, ValidateFn } from "./validate";

export type Guard<Type, Options extends RSA = RSN> = Validate<Type> &
  ((options: Partial<Options & ExtraOptions<Type>>) => Validate<Type>);
export type GuardOptions<Name extends keyof vality.guards, G = vality.guards[Name]> = G extends Guard<infer Type, infer Options>
  ? [Type, Options]
  : G extends (...args: any[]) => Guard<infer Type, infer Options>
  ? [Type, Options]
  : never;

type ExtraOptions<T> = {
  transform: IdentityFn<T>;
  validate: (val: T) => boolean;
};

export function guard<
  Name extends keyof vality.guards,
  Type extends GuardOptions<Name>[0],
  // I have no idea why we need RSA & here, but it seems to only work with
  Options extends RSA & GuardOptions<Name>[1]
>(
  name: Name,
  fn: (val: unknown, options: Partial<Options>) => Type | undefined,
  // The difference between Options and ExtraOptions is that for Options, the guard implementation also provides the implementation of the options
  // Scheams using the guard then only provide a value to the guard whereas for ExtraOptions, both the guard and the caller may implement functions which are then both considered
  // Also, we purposefully don't initialize it by default to cut some corners further down when checking as we can just check if handleOptions === undefined
  handleOptions?: {
    [K in keyof Options]?: (val: Type, o: NonNullable<Options[K]>, options: MakeRequired<Options, K>) => boolean;
  } & Partial<ExtraOptions<Type>>,
  defaultOptions: Partial<Options> = {}
): Guard<Type, Options> {
  function getFnWithErrors(options: Partial<Options>): ValidateFn<Type> {
    return (value, path = []) => {
      const data = fn(value, options);
      if (!isValid(data) || !(handleOptions?.validate ?? trueFn)(data)) {
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

      if (!(options.validate ?? trueFn)(data)) {
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
      const transformedData = (handleOptions?.transform ?? identity)(data) as Type;

      if (handleOptions === undefined) return { valid: true, data: (options.transform ?? identity)(transformedData), errors: [] };
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
          data: (options.transform ?? identity)(transformedData),
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
        [_type]: undefined as unknown as Type,
      };
    },
    {
      [_validate]: getFnWithErrors(defaultOptions),
      [_type]: undefined as unknown as Type,
    }
  );
}
