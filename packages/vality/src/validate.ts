import { config } from "./config";
import { CallOptions } from "./makeValidate";
import { Parse } from "./parse";
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
export type Validate<Name, Type, Options, IsValit> = Face<Name, Type, IsValit> &
  ((
    options:
      | Partial<CallOptions<Type, Options>>
      | ((parent: any, context: Context) => Partial<CallOptions<Type, Options>>)
  ) => Face<Name, Type, IsValit>);

// `isValit` isn't there at runtime so no worries about it not being a symbol :)
/**
 * The object that holds the validation function (and other stuff)
 */
export interface Face<Name, Type, IsValit> {
  [_name]: Name;
  [_validate]: ValidateFn<Type>;
  [_type]: Type;
  isValit?: IsValit;
}

/**
 * The function that is actually called when validating a value - is stored in the `[_validate]` property of a Face
 */
export interface ValidateFn<T> {
  (
    val: unknown,
    path: Path,
    context: Context,
    parent: any
  ): ValidationResult<T>;
}

export type ValidationResult<T> =
  | { valid: true; data: T; errors: readonly never[] }
  | { valid: false; data: undefined; errors: readonly Error[] };

export type Path = (string | number)[];

/**
 * The context holds data per validation operation, e.g. whether to allow excess properties on objects
 *
 * For all values holds the following order of priority:
 * - Options
 * - if above undefined, Context
 * - if above undefined, Config
 * - if above undefined, Default
 */
export interface Context {
  /**
   * Controls whether object guards should allow extra keys that are not defined in the model
   *
   * @default true
   */
  allowExtraProperties?: boolean;

  /**
   * Controls whether the validation should happen in strict mode
   *
   * @default false
   */
  strict?: boolean;

  /**
   * Controls whether to bail on first error
   *
   * @default false
   */
  bail?: boolean;
}

const defaults = {
  allowExtraProperties: true,
  strict: false,
  bail: false,
}

export function mergeOptions(options: Context, context: Context): Required<Context> {
  return {
    allowExtraProperties: options.allowExtraProperties ?? context.allowExtraProperties ?? config.allowExtraProperties ?? defaults.allowExtraProperties,
    strict: options.strict ?? context.strict ?? config.strict ?? defaults.strict,
    bail: options.bail ?? context.bail ?? config.bail ?? defaults.bail,
  };
}

export function validate<E extends Eny>(
  schema: E,
  val: unknown,
  bail = false
): ValidationResult<Parse<E>> {
  // Call top-level functions (So they're not treated as relations)
  if (typeof schema === "function" && !(_validate in schema))
    schema = vality.object((schema as () => RSE)())(
      bail === true ? { bail } : {}
    ) as unknown as E;

  const context = {};

  return enyToGuardFn(schema)(val, [], context, undefined);
}
