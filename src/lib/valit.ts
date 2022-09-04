import { _readonly } from "./symbols";
import { makeValit, RSA, RSN, ValitParameters } from "./utils";
import type { Validate } from "./validate";

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
  ...[name, fn, handleOptions, defaultOptions]: ValitParameters<Name, Arg, Type, Options>
): (...args: Arg) => Validate<Type, Options, true> {
  return makeValit(name, fn, handleOptions, defaultOptions);
}
