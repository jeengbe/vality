import { CallOptions, ExtraOptions, isValid, MakeRequired, makeValit, RSA, RSN } from "./utils";
import type { Path, Validate } from "./validate";

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
  guardFn: (value: unknown, options: Partial<CallOptions<Type, Options>>, path: Path, parent?: any) => Type | undefined,
  // The difference between Options and ExtraOptions is that for Options, the guard implementation also provides the implementation of the options
  // Scheams using the guard then only provide a value to the guard whereas for ExtraOptions, both the guard and the caller may implement functions which are then both considered
  // Also, we purposefully don't initialize it by default to cut some corners further down when checking as we can just check if handleOptions === undefined
  handleOptions?: {
    // keyof ExtraOptions are ignored if present in handleOptions
    [K in Exclude<keyof Options, keyof ExtraOptions<Type, Options>>]?: (val: Type, o: NonNullable<Options[K]>, options: MakeRequired<Options, K> & Partial<ExtraOptions<Type, Options>>) => boolean;
  },
  defaultOptions?: Partial<Options>
): Validate<Type, Options, false> {
  // Under the hood, a guard is just a Valit that gets the guard's implementation as inner
  return makeValit<
    Name,
    [guardFn: (value: unknown, options: Partial<CallOptions<Type, Options>>, path: Path, parent?: any) => Type | undefined],
    Type,
    Options,
    false
  >(name, fn => (value, options, path, parent) => {
    const res = fn(value, options, path, parent);
    if (isValid(res)) return {
      valid: true,
      data: res,
      errors: []
    };

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
  }, handleOptions, defaultOptions)(guardFn);
}
