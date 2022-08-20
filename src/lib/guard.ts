import { _type, _validate } from "./symbols";
import { identity, IdentityFn, isValid, MakeRequired, RSA, RSN, trueFn } from "./utils";
import type { Validate, ValidateFn } from "./validate";

export type Guard<Type, Options extends RSA = RSN> = Validate<Type> &
// Providing a type-safe signature for this seems impossible to me. It would depend on whether the guard is contained in a model
// and that would create some sort of circular type reference which is not possible to represent with TypeScript.
// We have to rely on tests for this one
  ((options: Partial<Options & ExtraOptions<Type>> | ((obj: any) => Partial<Options & ExtraOptions<Type>>)) => Validate<Type>);
export type GuardOptions<Name extends keyof vality.guards, G = vality.guards[Name]> = G extends Guard<infer Type, infer Options>
  ? [Type, Options]
  : G extends (...args: any[]) => Guard<infer Type, infer Options>
  ? [Type, Options]
  : never;

type ExtraOptions<T> = {
  transform: IdentityFn<T>;
  default: T;
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
  function getFnWithErrors(options: Partial<Options & ExtraOptions<Type>>): ValidateFn<Type> {
    return (value, path = []) => {
      const data = fn(value, options);

      // If value is not defined (i.e. passed as undefined) and a default value is either provided by definition or the caller, we return that before even considering further handleOptions
      if (!isValid(data) && value === undefined && (handleOptions?.default !== undefined || options?.default !== undefined)) {
        // Dunno why ! is necessary here
        return { valid: true, data: options?.default ?? handleOptions?.default!, errors: [] };
      }

      if (!isValid(data) || !(handleOptions?.validate ?? trueFn)(data)) {
        // Guard definition fails or provided implementation for validate option fails
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

      // Custom validation implementation failed
      if (!((options.validate ?? trueFn) as IdentityFn<Type>)(data)) {
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

      // Data transformed by 1. transformer in implementation, 2. provided transformer
      const transformedData = ((options.transform ?? identity) as IdentityFn<Type>)((handleOptions?.transform ?? identity)(data));

      if (handleOptions === undefined) return { valid: true, data: transformedData, errors: [] };
      const keysWithError = Object.keys(options).filter(
        k =>
          k !== "transform" &&
          k !== "validate" &&
          k !== "default" &&
          handleOptions[k] !== undefined &&
          // Options, however, are still given the original (untransformed) data
          !handleOptions[k]!(data, options[k]!, options as MakeRequired<Options, typeof k>)
      );

      if (keysWithError.length === 0) {
        return {
          valid: true,
          data: transformedData,
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
    (options: Partial<Options & ExtraOptions<Type>> | ((obj: any) => Partial<Options & ExtraOptions<Type>>)) => {
      return {
        [_validate]: (val, path, parent) => {
          if (typeof options === "function") options = options(parent);
          return getFnWithErrors({ ...defaultOptions, ...options })(val, path)
        },
        [_type]: undefined as unknown as Type,
      } as Validate<Type>;
    },
    {
      [_validate]: getFnWithErrors(defaultOptions),
      [_type]: undefined as unknown as Type,
    }
  );
}
