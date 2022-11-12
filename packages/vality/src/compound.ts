import { RSA } from "./utils";
import type { ValidationResult } from "./validate";
import { FnArgs, makeValit, Valit, ValitParameters } from "./valit";

export interface Compound<Name, Type, Options extends RSA = never>
  extends Valit<Name, Type, Options, true> {}

export type GetCompoundOptions<
  Name extends keyof vality.compounds,
  C = vality.compounds[Name]
> = C extends (...args: infer Args) => Compound<any, infer Type, infer Options>
  ? [Args, Type, Options]
  : C extends (
      ...args: any
    ) => (...args: infer Args) => Compound<any, infer Type, infer Options>
  ? [Args, Type, Options]
  : never;

export interface CompoundFn<Type, Options> {
  (...args: FnArgs<Type, Options>): ValidationResult<Type>;
}

export function compound<
  Name extends keyof vality.compounds,
  Arg extends GetCompoundOptions<Name>[0],
  Type extends GetCompoundOptions<Name>[1],
  Options extends GetCompoundOptions<Name>[2]
>(
  ...[name, fn, handleOptions, defaultOptions]: ValitParameters<
    Name,
    Type,
    Options,
    (...args: Arg) => CompoundFn<Type, Options>
  >
): (...args: Arg) => Valit<Name, Type, Options, true> {
  return makeValit(name, fn, handleOptions, defaultOptions);
}
