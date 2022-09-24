import { ParseIn } from "./parse";
import { _name, _type, _validate, _valit } from "./symbols";
import { CallOptions, Eny, enyToGuardFn, RSE } from "./utils";
import { vality } from "./vality";

export interface Error {
  message: string;
  path: Path;
  options: unknown;
  value: unknown;
}

// Providing a type-safe signature for (parent: any) seems impossible to me. It would depend on whether the guard is contained in a model
// and that would create some sort of circular type reference which is not possible to represent with TypeScript.
// We'll (eventually) have to rely on tests for this one
export type Validate<N extends string, T, O, V extends boolean> = Face<N, T, V> & ((options: Partial<CallOptions<T, O>> | ((parent: any) => Partial<CallOptions<T, O>>)) => Face<N, T, V>);
export type Face<N, T, V extends boolean> = { [_name]: N, [_validate]: ValidateFn<T>;[_type]: T;[_valit]?: V; };

export type ValidateFn<T> = (val: unknown, path: Path, parent: any) => ValidationResult<T>;
export type ValidationResult<T> = { valid: true; data: T, errors: never[]; } | { valid: false; data: undefined, errors: Error[]; };

export type Path = (string | number)[];

// NOTE: bail only works for purely passed schemas, not object guards
export function validate<E extends Eny>(schema: E, val: unknown, bail = false): ValidationResult<ParseIn<E>> {
  if (typeof schema === "function" && !(_validate in schema)) schema = vality.object((schema as () => RSE)())(bail === true ? { bail } : {}) as unknown as E;

  return enyToGuardFn(schema)(val, [], undefined);
}
