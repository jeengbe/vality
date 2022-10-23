import { CallOptions, makeValit, SharedParameters } from "./makeValidate";
import { RSA, RSN } from "./utils";
import type { Path, Validate, ValidationResult } from "./validate";

export interface SpecialValit<
  Name extends keyof vality.valits,
  Type,
  Options extends RSA = RSN
> extends Validate<Name, Type, Options, true> {}

export interface Valit<
  Type,
  Options extends RSA = RSN
> extends Validate<Type, Options, true> { }

/**
 * Extract options from a given valit from its name
 */
export type ValitOptions<
  Name extends keyof vality.valits,
  Fn = vality.valits[Name]
> = Fn extends (...args: infer Args) => Valit<infer Type, infer Options>
  ? [Args, Type, Options]
  : never;

export type ValitFn<Type, Options> = (
  val: unknown,
  options: Partial<CallOptions<Type, Options>>,
  path: Path,
  parent?: any
) => ValidationResult<Type>;

export function valit<
  Name extends keyof vality.valits,
  Arg extends ValitOptions<Name>[0],
  Type extends ValitOptions<Name>[1],
  Options extends RSA & ValitOptions<Name>[2]
>(
  ...[name, fn, handleOptions, defaultOptions]: SharedParameters<
    Name,
    Type,
    Options,
    (...args: Arg) => ValitFn<Type, Options>
  >
): (...args: Arg) => Validate<Name, Type, Options, true> {
  return makeValit(name, fn, handleOptions, defaultOptions);
}
