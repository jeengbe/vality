import type { ValidationResult } from "./guard";
import { _validate } from "./symbols";
import { Eny, enyToGuardFn, RSE } from "./utils";
import { vality } from "./vality";

export type Path = (string | number)[];

export interface Error {
  message: string;
  path: Path;
  options: any;
  val: any;
}

// NOTE: bail only works for purely passed schemas, not object guards
export function validate(schema: Eny, val: unknown, bail = false): ValidationResult {
  if (typeof schema === "function" && !(_validate in schema)) schema = vality.object((schema as () => RSE)())({ bail });

  return enyToGuardFn(schema)(val);
}
