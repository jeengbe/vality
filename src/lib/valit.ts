import { _specialValit } from "./symbols";
import { CallOptions, makeValit, RSA, RSN, SharedParameters } from "./utils";
import type { Path, Validate, ValidationResult } from "./validate";

export type SpecialValit<Speciality, Type, Options extends RSA = RSN> = {
  [_specialValit]?: Speciality;
} & Valit<Type, Options>;

export type Valit<Type, Options extends RSA = RSN> = Validate<
  Type,
  Options,
  true
>;

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
): (...args: Arg) => Validate<Type, Options, true> {
  return makeValit(name, fn, handleOptions, defaultOptions);
}
