import { _type } from "./symbols";
import {
  CallOptions,
  isValid,
  makeValit,
  RSA,
  RSN,
  SharedParameters
} from "./utils";
import type { Path, Validate } from "./validate";
import { ValitFn } from "./valit";

export type Guard<
  Name extends string,
  Type,
  Options extends RSA = RSN
> = Validate<Name, Type, Options, false>;

/**
 * Extract options from a given guard from its name
 */
export type GuardOptions<
  Name extends keyof vality.guards,
  G = vality.guards[Name]
> = G extends
  | Guard<any, infer Type, infer Options>
  | ((...args: any[]) => Guard<any, infer Type, infer Options>)
  ? [Type, Options]
  : never;

export type GuardFn<Type, Options> = (
  value: unknown,
  options: Partial<CallOptions<Type, Options>>,
  path: Path,
  parent?: any
) => Type | undefined;

export function guard<
  Name extends keyof vality.guards,
  Type extends GuardOptions<Name>[0],
  Options extends RSA & GuardOptions<Name>[1]
>(
  ...[name, guardFn, handleOptions, defaultOptions]: SharedParameters<
    Name,
    Type,
    Options,
    GuardFn<Type, Options>
  >
): Validate<Name, Type, Options, false> {
  // Under the hood, a guard is just a Valit that gets the guard's implementation as inner
  return makeValit<Name, [GuardFn<Type, Options>], Type, Options, false>(
    name,
    (fn: GuardFn<Type, Options>) => {
      const validateFn = ((value, options, path, parent) => {
        const res = fn(value, options, path, parent);
        if (isValid(res))
          return {
            valid: true,
            data: res,
            errors: [],
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
      }) as ValitFn<Type, Options>;
      // @ts-expect-error -- This nugget is also unyped
      validateFn[_type] = fn[_type];

      return validateFn;
    },
    handleOptions,
    defaultOptions
  )(guardFn);
}
