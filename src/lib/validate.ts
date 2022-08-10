import { _type, _validate } from "./symbols";
import { Eny, enyToGuardFn, RSE } from "./utils";
import { vality } from "./vality";

export interface Error {
  message: string;
  path: Path;
  options: any;
  value: any;
}

export type ValidationResult = { valid: boolean;errors: Error[] };
export type Validate<T> = { [_validate]: ValidateFn; [_type]: T };
export type ValidateFn = (val: unknown, path?: Path) => ValidationResult;
export type Path = (string | number)[];

// NOTE: bail only works for purely passed schemas, not object guards
export function validate(schema: Eny, val: unknown, bail = false): ValidationResult {
  if (typeof schema === "function" && !(_validate in schema)) schema = vality.object((schema as () => RSE)())({ bail });

  return enyToGuardFn(schema)(val);
}
