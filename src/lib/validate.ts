import { ParseIn } from "./parse";
import { _readonly, _type, _validate, _valit } from "./symbols";
import { Eny, enyToGuardFn, RSE } from "./utils";
import { vality } from "./vality";

export interface Error {
  message: string;
  path: Path;
  options: any;
  value: any;
}

export type Validate<T> = { [_validate]: ValidateFn<T>; [_type]: T; [_readonly]?: false; [_valit]?: false };
export type ValidateFn<T> = (val: unknown, path?: Path) => ValidationResult<T>;
export type ValidationResult<T> = { valid: true; data: T, errors: never[] } | { valid: false; data: undefined, errors: Error[] };
export type Path = (string | number)[];

// NOTE: bail only works for purely passed schemas, not object guards
export function validate<E extends Eny>(schema: E, val: unknown, bail = false): ValidationResult<ParseIn<E>> {
  if (typeof schema === "function" && !(_validate in schema)) schema = vality.object((schema as () => RSE)())({ bail }) as unknown as E;

  return enyToGuardFn(schema)(val);
}
