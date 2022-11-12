import { _flags, _guard, _name, _type } from "./symbols";
import { Eny } from "./utils";

export type Flagged<
  E extends Eny,
  Name extends string,
  Value
  > = E & {
  [_flags]: { [K in Name]: Value };
};

export function flag(name: string, value: unknown, fn) {
  return (...args) => {
    const [inner] = args;

    const flagsMap = new Map(inner[_flags]);
    flagsMap.set(name, value);

    const newGuardFn = (o) => (val, context, path, parent) =>
      fn(inner)(val, o, context, path, parent);

    const validate = ((options) => ({
      [_name]: name,
      [_guard]: (val, context, path, parent) => {
        if (typeof options === "function") options = options(parent, context);
        return newGuardFn(options)(val, context, path, parent);
      },
      [_type]: args,
      [_flags]: flagsMap,
    })) as Valit<Name, Type, Options, IsValit>;

    validate[_name] = inner[_name];
    validate[_guard] = newGuardFn({});
    validate[_type] = inner[_type];
    validate[_flags] = flagsMap;

    return validate;
  };
}
