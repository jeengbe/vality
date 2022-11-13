import { config } from "./config";
import { Parse } from "./parse";
import { Eny, enyToGuardFn, RSA } from "./utils";

export interface Error {
  message: string;
  path: Path;
  options: unknown;
  value: unknown;
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
};

export function mergeOptions(
  options: Partial<RSA>,
  context: Partial<RSA>
): Required<Context> {
  return {
    allowExtraProperties:
      options.allowExtraProperties ??
      context.allowExtraProperties ??
      config.allowExtraProperties ??
      defaults.allowExtraProperties,
    strict:
      options.strict ?? context.strict ?? config.strict ?? defaults.strict,
    bail: options.bail ?? context.bail ?? config.bail ?? defaults.bail,
  };
}

export function validate<E extends Eny>(
  schema: E,
  val: unknown,
  context?: RSA
): ValidationResult<Parse<E>> {
  return enyToGuardFn(schema)(val, context ?? {}, [], undefined);
}
