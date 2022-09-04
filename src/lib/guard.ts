import { CallOptions, ExtraOptions, isValid, MakeRequired, makeValidate, RSA, RSN } from "./utils";
import type { Validate, ValidateFn } from "./validate";

export type Guard<Type, Options extends RSA = RSN> = Validate<Type, CallOptions<Type, Options>, false>;

export type GuardOptions<Name extends keyof vality.guards, G = vality.guards[Name]> = G extends Guard<infer Type, infer Options>
  ? [Type, Options]
  : G extends (...args: any[]) => Guard<infer Type, infer Options>
  ? [Type, Options]
  : never;

export function guard<
  Name extends keyof vality.guards,
  Type extends GuardOptions<Name>[0],
  // I have no idea why we need RSA & here, but it seems to only work with
  Options extends RSA & GuardOptions<Name>[1]
>(
  name: Name,
  fn: (val: unknown, options: Partial<CallOptions<Type, Options>>) => Type | undefined,
  // The difference between Options and ExtraOptions is that for Options, the guard implementation also provides the implementation of the options
  // Scheams using the guard then only provide a value to the guard whereas for ExtraOptions, both the guard and the caller may implement functions which are then both considered
  // Also, we purposefully don't initialize it by default to cut some corners further down when checking as we can just check if handleOptions === undefined
  handleOptions?: {
    // keyof ExtraOptions are ignored if present in handleOptions
    [K in Exclude<keyof Options, keyof ExtraOptions<Type, Options>>]?: (val: Type, o: NonNullable<Options[K]>, options: MakeRequired<Options, K> & Partial<ExtraOptions<Type, Options>>) => boolean;
  },
  defaultOptions?: Partial<Options>
): Validate<Type, CallOptions<Type, Options>, false> {
  function getFnWithErrors(options: Partial<CallOptions<Type, Options>>): ValidateFn<Type> {
    return (value, path) => {
      const res = fn(value, options);

      if (!isValid(res)) {
        if (value === undefined && options.default !== undefined) {
          return { valid: true, data: options.default, errors: [] };
        }

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

      if (options.validate && !options.validate(res, options)) {
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

      let data = res;
      if (options.transform) {
        data = options.transform(data);
      }

      if (handleOptions === undefined) return { valid: true, data: data, errors: [] };
      const optionsWithDefault = { ...defaultOptions, ...options };

      const keysWithError = Object.keys(optionsWithDefault).filter(
        k =>
          k !== "transform" &&
          k !== "validate" &&
          k !== "default" &&
          handleOptions[k] !== undefined &&
          // We purposefully pass 'res' to handleOptions. We don't want it to validate already transformed data.
          !handleOptions[k]!(res, optionsWithDefault[k]!, options as MakeRequired<Options, typeof k> & Partial<ExtraOptions<Type, Options>>)
      );

      if (keysWithError.length === 0) {
        return {
          valid: true,
          data,
          errors: [],
        };
      }
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
  }

  return makeValidate<Type, CallOptions<Type, Options>, false>(getFnWithErrors);
}
