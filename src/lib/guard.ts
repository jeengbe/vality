import { _type, _validate } from "./symbols";
import { IdentityFn, isValid, MakeRequired, RSA, RSN } from "./utils";
import type { Validate, ValidateFn } from "./validate";

type CallOptions<Type, Options> = Partial<Options extends RSN
  ? ExtraOptions<Type, Options>
  // We Omit keyof Options here to allow Options to override default extra option implementations
  : Options & Omit<ExtraOptions<Type, Options>, keyof Options>>;

export type Guard<Type, Options extends RSA = RSN> = Validate<Type> &
  // Providing a type-safe signature for (obj: any) seems impossible to me. It would depend on whether the guard is contained in a model
  // and that would create some sort of circular type reference which is not possible to represent with TypeScript.
  // We'll (eventually) have to rely on tests for this one
  ((options: CallOptions<Type, Options>) => Validate<Type>);
export type GuardOptions<Name extends keyof vality.guards, G = vality.guards[Name]> = G extends Guard<infer Type, infer Options>
  ? [Type, Options]
  : G extends (...args: any[]) => Guard<infer Type, infer Options>
  ? [Type, Options]
  : never;

type ExtraOptions<T, O> = {
  transform: IdentityFn<T>;
  default: T;
  validate: (val: T, options: CallOptions<T, O>) => boolean;
};

export function guard<
  Name extends keyof vality.guards,
  Type extends GuardOptions<Name>[0],
  // I have no idea why we need RSA & here, but it seems to only work with
  Options extends RSA & GuardOptions<Name>[1]
>(
  name: Name,
  fn: (val: unknown, options: CallOptions<Type, Options>) => Type | undefined,
  // The difference between Options and ExtraOptions is that for Options, the guard implementation also provides the implementation of the options
  // Scheams using the guard then only provide a value to the guard whereas for ExtraOptions, both the guard and the caller may implement functions which are then both considered
  // Also, we purposefully don't initialize it by default to cut some corners further down when checking as we can just check if handleOptions === undefined
  handleOptions?: {
    // keyof ExtraOptions are ignored if present in handleOptions
    [K in Exclude<keyof Options, keyof ExtraOptions<Type, Options>>]?: (val: Type, o: NonNullable<Options[K]>, options: MakeRequired<Options, K> & Partial<ExtraOptions<Type, Options>>) => boolean;
  },
  defaultOptions?: Partial<Options>
): Guard<Type, Options> {
  function getFnWithErrors(options: CallOptions<Type, Options>): ValidateFn<Type> {
    return (value, path = []) => {
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

      if (options.validate) {
        if (!options.validate(res, options)) {
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

  return Object.assign(
    (options: CallOptions<Type, Options> | ((obj: any) => CallOptions<Type, Options>)) => {
      return {
        [_validate]: (val, path, parent) => {
          if (typeof options === "function") options = options(parent);
          return getFnWithErrors({ ...options })(val, path);
        },
        [_type]: undefined as unknown as Type,
      } as Validate<Type>;
    },
    {
      [_validate]: getFnWithErrors({}),
      [_type]: undefined as unknown as Type,
    }
  );
}
