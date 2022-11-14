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

export function mergeOptions<Options extends RSA, Fields extends keyof Options>(
  options: Options,
  context: Partial<RSA>,
  fields: Fields[]
): Required<Pick<Options, Fields>> {
  const result: any = {};
  for (const field of fields) {
    result[field] =
    // @ts-expect-error
      options[field] ?? context[field] ?? config[field] ?? defaults[field];
  }
  return result;
}

export function validate<E extends Eny>(
  schema: E,
  val: unknown,
  context?: RSA
): ValidationResult<Parse<E>> {
  return enyToGuardFn(schema)(val, context ?? {}, [], undefined);
}
