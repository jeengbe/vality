import { ValitFn } from "valit";
import { _name, _validate } from "./symbols";
import { MakeRequired, RSA, RSN } from "./utils";
import { Path, Validate, ValidateFn } from "./validate";

export type SharedParameters<Name, Type, Options extends RSA, Fn> = [
    name: Name,
    fn: Fn,
    // The difference between Options and ExtraOptions is that for Options, the guard implementation also provides the implementation of the options
    // Schemas using the guard then only provide a value to the guard whereas for ExtraOptions, both the guard and the caller may implement functions which are then both considered
    // Also, we purposefully don't initialize it by default to cut some corners further down when checking as we can just check if handleOptions === undefined
    handleOptions?: {
      // keyof ExtraOptions are ignored if present in handleOptions
      [K in Exclude<keyof Options, keyof ExtraOptions<Type, Options>>]?: (
        val: Type,
        o: NonNullable<Options[K]>,
        options: MakeRequired<Options, K> & Partial<ExtraOptions<Type, Options>>
      ) => boolean;
    },
    defaultOptions?: Partial<Options>
  ];

  export type ExtraOptions<T, O> = {
    transform: (val: T) => T;
    preprocess: (
      val: unknown,
      options: Partial<CallOptions<T, O>>,
      path: Path,
      parent?: any
    ) => unknown;
    default: T;
    validate: (val: T, options: Partial<CallOptions<T, O>>) => boolean;
  };

  export type CallOptions<Type, Options> = Options extends RSN
    ? ExtraOptions<Type, Options>
    : // We Omit keyof Options here to allow Options to override default extra option implementations
      Options & Omit<ExtraOptions<Type, Options>, keyof Options>;

  export function makeValit<
    Name extends keyof (vality.valits & vality.guards),
    Arg extends any[],
    Type,
    Options extends RSA,
    V extends boolean
  >(
    ...[name, fn, handleOptions, defaultOptions]: SharedParameters<
      Name,
      Type,
      Options,
      (...args: Arg) => ValitFn<Type, Options>
    >
  ): (...args: Arg) => Validate<Name, Type, Options, V> {
    return (...args) => {
      const getValidateFnFromOptions =
        (options: Partial<CallOptions<Type, Options>>): ValidateFn<Type> =>
        (value, path, parent) => {
          const {
            transform = undefined,
            preprocess = undefined,
            default: defaultValue = undefined,
            validate = undefined,
            ...optionsWithoutExtras
          }: Partial<CallOptions<Type, Options>> = { ...options };

          const optionsWithDefault = {
            ...defaultOptions,
            ...optionsWithoutExtras,
          };

          // Validation follows a simple list of steps:
          // =====
          // 1: Preprocess the value (is provided)
          // 2: Invoke the Valit function
          // 2.1: If step 2 failed, check if a default value is provided and return it, else error
          // 3: Transform the value (is provided)
          // 4: Validate with options (using the value from before step 3 i.e. the untransformed value)
          // 5: If options handlers fail, return errors, else a passed validation result

          if (preprocess) {
            value = preprocess(value, options, path, parent);
          }

          const data = fn(...args)(value, options, path, parent);

          if (!data.valid) {
            if (value === undefined && defaultValue !== undefined) {
              return { valid: true, data: defaultValue, errors: [] };
            }

            return data;
          }

          if (validate?.(data.data, options) === false) {
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
          const origData = data.data;
          if (transform) {
            data.data = transform(data.data);
          }

          if (handleOptions === undefined) return data;

          const keysWithError = Object.keys(optionsWithDefault).filter(
            (k) =>
              handleOptions[k]?.(
                origData,
                optionsWithDefault[k]!,
                options as MakeRequired<Options, typeof k>
              ) === false
          );

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

      function applyFnType<Fn extends Function>(f: Fn): Fn {
        // @ts-expect-error -- This extra nugget of information is untyped
        f[_type] = args;
        return f;
      }

      const validate = ((
        options:
          | Partial<CallOptions<Type, Options>>
          | ((obj: any) => Partial<CallOptions<Type, Options>>)
      ) => ({
        [_validate]: applyFnType((val, path, parent) => {
          if (typeof options === "function") options = options(parent);
          return getValidateFnFromOptions(options)(val, path, parent);
        }),
        [_name]: name,
      })) as Validate<Name, Type, Options, V>;

      validate[_validate] = applyFnType(getValidateFnFromOptions({}));
      validate[_name] = name;

      return validate;
    };
  }