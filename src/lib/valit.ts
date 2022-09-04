import { _readonly } from "./symbols";
import { CallOptions, ExtraOptions, MakeRequired, makeValidatee, RSA, RSN } from "./utils";
import type { Path, Validate, ValidationResult } from "./validate";

export type Valit<Type, Options extends RSA = RSN> = Validate<Type, Options, true>;

export type ValitOptions<Name extends keyof vality.valits, Fn = vality.valits[Name]> = Fn extends (
  ...args: infer Args
) => Valit<infer Type, infer Options>
  ? [Args, Type, Options]
  : never;

// This is a special type used only by vality.readonly
export type ReadonlyValit<T> = { [_readonly]?: true; } & Valit<T>;

export function valit<
  Name extends keyof vality.valits,
  Arg extends ValitOptions<Name>[0],
  Type extends ValitOptions<Name>[1],
  Options extends RSA & ValitOptions<Name>[2]
>(
  name: Name,
  _fn: (...args: Arg) => (val: unknown, options: Partial<CallOptions<Type, Options>>, path: Path, parent?: any) => ValidationResult<Type>,
  handleOptions?: {
    // keyof ExtraOptions are ignored if present in handleOptions
    [K in Exclude<keyof Options, keyof ExtraOptions<Type, Options>>]?: (val: Type, o: NonNullable<Options[K]>, options: MakeRequired<Options, K> & Partial<ExtraOptions<Type, Options>>) => boolean;
  },
  defaultOptions?: Partial<Options>
): (...args: Arg) => Validate<Type, Options, true> {
  return makeValidatee(name, _fn, handleOptions, defaultOptions);
}
