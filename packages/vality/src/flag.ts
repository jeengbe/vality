import { CompoundFn } from "./compound";
import { _flags, _guard, _name, _type } from "./symbols";
import { Eny, EnyToGuard, enyToGuard } from "./utils";
import { CallOptions, GuardFn, Valit } from "./valit";

export type Flagged<
  E extends Eny,
  Name extends string,
  Value extends {}
> = EnyToGuard<E> & {
  flags: Map<Name, Value>;
};

export type GetFlagOptions<
  Name extends keyof vality.flags,
  F = vality.flags[Name]
> = F extends (...args: any[]) => Flagged<infer Type, any, infer Value>
  ? [Value, Type]
  : F extends (
      ...args: any[]
    ) => (...args: any[]) => Flagged<infer Type, any, infer Value>
  ? [Value, Type]
  : never;

export function flag<
  Name extends keyof vality.flags,
  Value extends GetFlagOptions<Name>[0],
  Type extends GetFlagOptions<Name>[1]
>(
  name: Name,
  value: Value,
  fn: (e: Type) => CompoundFn<Type, {}>
): (e: Type) => Flagged<Type, Name, Value> {
  return (inner) => {
    const innerGuard = enyToGuard(inner);
    const flagsMap = new Map(innerGuard[_flags]) as Map<Name, Value>;
    flagsMap.set(name, value);

    const getGuardFnFromOptions =
      (o: CallOptions<Type, never>): GuardFn<Type> =>
      (val, context, path, parent) =>
        fn(inner)(val, o, context, path, parent);

    const validate = ((options) => ({
      [_name]: innerGuard[_name],
      [_guard]: (val, context, path, parent) => {
        if (typeof options === "function") options = options(parent, context);
        // @ts-expect-error -- Incorrectly narrowed due to use of any
        return getGuardFnFromOptions(options)(val, context, path, parent);
      },
      [_type]: innerGuard[_type],
      [_flags]: flagsMap as any,
    })) as Valit<any, any, any, any>;

    validate[_name] = innerGuard[_name];
    validate[_guard] = getGuardFnFromOptions({});
    validate[_type] = innerGuard[_type];
    validate[_flags] = flagsMap;

    return validate as unknown as Flagged<Type, Name, Value>;
  };
}
