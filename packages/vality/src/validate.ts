import { CallOptions } from "./makeValidate";
import { ParseIn } from "./parse";
import { _name, _type, _validate } from "./symbols";
import { Eny, enyToGuardFn, RSE } from "./utils";
import { vality } from "./vality";

export interface Error {
  message: string;
  path: Path;
  options: unknown;
  value: unknown;
}

// Validate is a superset of Face
// I like to think of Face being the "final result" of a Valit
// Once it's been called with options, a Face is the only thing remaining

// Providing a type-safe signature for (parent: any) seems impossible to me. It would depend on whether the guard is contained in a model
// and that would create some sort of circular type reference which is not possible to represent with TypeScript.
// We'll have to rely on tests for this one
/**
 * A Face with a call signature that takes options and gives another Face back
 */
export type Validate<Name extends string, Type, O, IsValit> = Face<
  Name,
  Type,
  IsValit
> &
  ((
    options:
      | Partial<CallOptions<Type, O>>
      | ((parent: any) => Partial<CallOptions<Type, O>>)
  ) => Face<Name, Type, IsValit>);

// `isValit` isn't there at runtime so no worries about it not being a symbol :)
/**
 * The object that holds the validation function (and other stuff)
 */
export type Face<Name, Type, IsValit> = {
  [_name]: Name;
  [_validate]: ValidateFn<Type>;
  [_type]: Type;
  isValit?: IsValit;
};

/**
 * The function that is actually called when validating a value - is stored in the `[_validate]` property of a Face
 */
export type ValidateFn<T> = (
  val: unknown,
  path: Path,
  parent: any
) => ValidationResult<T>;
export type ValidationResult<T> =
  | { valid: true; data: T; errors: never[] }
  | { valid: false; data: undefined; errors: Error[] };

export type Path = (string | number)[];

// NOTE: bail only works for purely passed schemas, not object guards
export function validate<E extends Eny>(
  schema: E,
  val: unknown,
  bail = false
): ValidationResult<ParseIn<E>> {
  if (typeof schema === "function" && !(_validate in schema))
    schema = vality.object((schema as () => RSE)())(
      bail === true ? { bail } : {}
    ) as unknown as E;

  return enyToGuardFn(schema)(val, [], undefined);
}
