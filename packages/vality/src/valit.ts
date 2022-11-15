import { CompoundFn } from "./compound";
import { _flags, _guard, _name, _type } from "./symbols";
import { RSA } from "./utils";
import { Context, Path, ValidationResult } from "./validate";

export interface SpecialOptions<T, O> {
  strict: boolean;
  bail: boolean;
  preprocess: (
    val: unknown,
    options: Partial<CallOptions<T, O>>,
    context: Context,
    path: Path,
    parent?: any
  ) => unknown;
  default: T;
  validate: (
    val: T,
    options: Partial<CallOptions<T, O>>,
    context: Context,
    path: Path,
    parent?: any
  ) => boolean;
  transform: (val: T) => T;
}

export type ValitParameters<Name, Type, Options extends RSA, Fn> = [
  name: Name,
  fn: Fn,
  handleOptions?: {
    [K in string & keyof Options]?: (
      val: Type,
      o: NonNullable<Options[K]>,
      // Only 'Options[K]' is required
      options: CallOptions<Type, Options> & Pick<Options, K>,
      context: Context
    ) => boolean;
  },
  defaultOptions?: Partial<Options>
];

export type Valit<Name, Type, Options, IsCompound> = ((
  options:
    | CallOptions<Type, Options>
    | ((parent: any, context: Context) => CallOptions<Type, Options>)
) => Guard<Name, Type, IsCompound>) &
  Guard<Name, Type, IsCompound>;

// `isCompound` isn't there at runtime so no worries about it not being a symbol :)
export interface Guard<Name, Type, IsCompound> {
  [_name]: Name;
  [_guard]: GuardFn<Type>;
  [_type]: Type;
  [_flags]: Map<string, unknown>;
  isCompound?: IsCompound;
}

export interface GuardFn<T> {
  (
    val: unknown,
    context: Context,
    path: Path,
    parent: any
  ): ValidationResult<T>;
}

export type CallOptions<Type, Options> = [Options] extends [never]
  ? Partial<SpecialOptions<Type, Options>>
  : // We Omit keyof Options here to allow Options to override default extra option implementations
    Partial<Options & Omit<SpecialOptions<Type, Options>, keyof Options>>;

export type FnArgs<Type, Options, ValueType = unknown> = [
  value: ValueType,
  options: Partial<CallOptions<Type, Options>>,
  context: Context,
  path: Path,
  parent?: any
];

export function makeValit<
  Name extends string,
  Arg extends any[],
  Type,
  Options extends RSA,
  IsValit extends boolean
>(
  ...[name, fn, handleOptions, defaultOptions]: ValitParameters<
    Name,
    Type,
    Options,
    (...args: Arg) => CompoundFn<Type, Options>
  >
): (...args: Arg) => Valit<Name, Type, Options, IsValit> {
  return (...args) => {
    const getGuardFnFromOptions =
      (options: CallOptions<Type, Options>): GuardFn<Type> =>
      (value, context, path, parent) => {
        const {
          transform,
          preprocess,
          default: defaultValue,
          validate,
          bail,
          ...optionsWithoutExtras
        }: CallOptions<Type, Options> = options;

        const optionsWithDefault = {
          ...defaultOptions,
          ...optionsWithoutExtras,
        };

        // Validation follows a simple list of steps:
        // =====
        // 1: Preprocess the value (is provided)
        // 2: If no value is provided and we have a default value, return that
        // 3: Invoke the Valit function
        // 4: Transform the value (is provided)
        // 5: Validate with options (using the value from before step 3 i.e. the untransformed value)
        // 6: If options handlers fail, return errors, else a passed validation result

        if (typeof preprocess === "function") {
          // @ts-expect-error
          value = preprocess(value, options, context, path, parent);
        }

        const data = fn(...args)(value, options, context, path, parent);

        if (!data.valid) {
          // We need to do this *after* fn() in order to allow custom behaviour of default values (in vality.literal for example)
          if (value === undefined && defaultValue !== undefined) {
            return { valid: true, data: defaultValue, errors: [] };
          }
          return data;
        }

        // @ts-expect-error
        if (typeof validate === "function" && validate(data.data, options, context, path, parent) === false) {
          return {
            valid: false,
            data: undefined,
            errors: [
              {
                message: `vality.${name}.custom`,
                path,
                options,
                value,
              },
            ],
          };
        }

        // We retain a copy here because we pass the original data into handleOptions
        const origData = data.data!;
        if (typeof transform === "function") {
          // @ts-expect-error
          data.data = transform(data.data);
        }

        if (handleOptions === undefined) return data;

        const keysWithError: string[] = [];
        for (const key in optionsWithDefault) {
          // ?. just in the case that we still somehow pass options that are not in handleOptions (just so we don't crash everything)
          if (
            handleOptions[key]?.(
              origData,
              optionsWithDefault[key]!,
              options as CallOptions<Type, Options> & Pick<Options, typeof key>,
              context
            ) === false
          ) {
            keysWithError.push(key);
            if (bail) break;
          }
        }

        if (keysWithError.length === 0) return data;
        return {
          valid: false,
          data: undefined,
          errors: keysWithError.map((k) => ({
            message:
              // If a key is not present in options, it must have been a default Option, in which case we use the base error message
              k in options
                ? `vality.${name}.options.${k}`
                : `vality.${name}.base`,
            options,
            path,
            value,
          })),
        };
      };

    const flagsMap = new Map();

    const validate = (options => ({
      [_name]: name,
      [_guard]: (val, context, path, parent) => {
        if (typeof options === "function") options = options(parent, context);
        return getGuardFnFromOptions(options)(val, context, path, parent);
      },
      [_type]: args as unknown as Type,
      [_flags]: flagsMap,
    })) as Valit<Name, Type, Options, IsValit>;

    validate[_name] = name;
    // @ts-ignore Error with TS 4.2.2
    validate[_guard] = getGuardFnFromOptions({});
    validate[_type] = args as unknown as Type;
    validate[_flags] = flagsMap;

    return validate;
  };
}
