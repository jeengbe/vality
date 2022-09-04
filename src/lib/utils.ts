import { _type, _validate } from "./symbols";
import { Face, Path, Validate, ValidateFn, ValidationResult } from "./validate";
import { vality } from "./vality";

export type RSA = Record<string, any>;
export type RSN = Record<string, never>;
// Can't use Record here because circular types are not valid via type aliases
export type RSE = {
  [K: string]: Eny;
};

export type MaybeArray<T> = T | T[];

export type Primitive = string | number | boolean | null;
export type _Eny = Primitive | Face<Primitive, any> | (() => RSE) | RSE;
export type Eny = MaybeArray<_Eny> | Readonly<MaybeArray<_Eny>>;

/**
 * Make all properties in T required whose key is assignable to K
 */
export type MakeRequired<T extends RSA, K extends keyof T> = {
  [key in K]-?: T[key];
} & {
    [key in Exclude<keyof T, K>]: T[key];
  };

export function assert<T>(val: any, condition?: boolean): asserts val is T {
  if (condition === false) {
    throw new Error("Assertion failed");
  }
}

export function isValid<Type>(data: Type | undefined): data is Type {
  return data !== undefined;
}

export type EnyToFace<T> = T extends [infer U]
  ? Face<U[], true>
  : T extends [...infer U]
  ? Face<U, true>
  : T extends Primitive
  ? Face<T, false>
  : T extends Face<any, any>
  ? T
  : T extends () => infer U
  ? Face<U, true>
  : Face<T, true>;

export function enyToGuard<E extends Eny>(eny: E): EnyToFace<E> {
  // TODO: Fix this type mess -- I have no idea why it does that
  if (Array.isArray(eny)) {
    if (eny.length === 0) throw new Error("Empty array short");
    // @ts-ignore
    if (eny.length === 1) return vality.array(enyToGuard(eny[0]));
    // @ts-ignore
    return vality.enum(...eny.map(enyToGuard));
  }
  // @ts-ignore
  if (typeof eny === "string" || typeof eny === "number" || typeof eny === "boolean" || eny === null) return vality.literal(eny);
  // Not sure why we have to assert here, a symbol should never be a key in RSA
  // @ts-ignore
  if (_validate in eny) return eny as Exclude<typeof eny, RSA>;
  // This should only allow () => RSE at this point...
  // @ts-ignore
  if (typeof eny === "function") return vality.relation(eny as () => RSE);
  // Not sure why we have to assert here, as RSA should be the only type left after narrowing
  // @ts-ignore
  return vality.object(eny as RSA);
}

// This type is too complicated to represent - should be ValidateFn<ParseIn<E>>
export function enyToGuardFn<E extends Eny>(e: E): ValidateFn<any> {
  return enyToGuard(e)[_validate];
}

export function flat<T>(arr: T[][]): T[] {
  return ([] as T[]).concat(...arr);
}

export type IdentityFn<T> = (x: T) => T;
export function identity<T>(x: T): T {
  return x;
}

export function trueFn(..._args: any[]): true {
  return true;
}
export function falseFn(..._args: any[]): false {
  return false;
}

export function makeValidate<Type, Options, V extends boolean>(callback: (options: Partial<CallOptions<Type, Options>>) => ValidateFn<Type>): Validate<Type, Options, V> {
  return Object.assign(
    (options: Partial<CallOptions<Type, Options>> | ((obj: any) => Partial<CallOptions<Type, Options>>)) => {
      return {
        [_validate]: (val, path, parent) => {
          if (typeof options === "function") options = options(parent);
          return callback(options)(val, path, parent);
        },
        [_type]: undefined as unknown as Type,
      } as Face<Type, V>;
    },
    {
      [_validate]: callback({}),
      [_type]: undefined as unknown as Type,
    }
  );
}

export type ExtraOptions<T, O> = {
  transform: IdentityFn<T>;
  default: T;
  validate: (val: T, options: CallOptions<T, O>) => boolean;
};

export type CallOptions<Type, Options> = Options extends RSN
  ? ExtraOptions<Type, Options>
  // We Omit keyof Options here to allow Options to override default extra option implementations
  : Options & Omit<ExtraOptions<Type, Options>, keyof Options>;

export function dealWithHandleOptions<Type, Options extends RSA>(name: string,
  options: Partial<CallOptions<Type, Options>>,
  data: ValidationResult<Type>,
  path: Path,
  value: unknown,
  handleOptions?: {
    // keyof ExtraOptions are ignored if present in handleOptions
    [K in Exclude<keyof Options, keyof ExtraOptions<Type, Options>>]?: (val: Type, o: NonNullable<Options[K]>, options: MakeRequired<Options, K> & Partial<ExtraOptions<Type, Options>>) => boolean;
  },
  defaultOptions?: Partial<Options>,
): ValidationResult<Type> {
  if (!data.valid) {
    if (value === undefined && options.default !== undefined) {
      return { valid: true, data: options.default, errors: [] };
    }

    return data;
  }
  const origData = data.data;

  if (options.validate && !options.validate(origData, options)) {
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

  if (options.transform) {
    data.data = options.transform(data.data);
  }

  if (handleOptions === undefined) return data;
  const optionsWithDefault = { ...defaultOptions, ...options };

  const keysWithError = Object.keys(optionsWithDefault).filter(
    k =>
      k !== "transform" &&
      k !== "validate" &&
      k !== "default" &&
      // @ts-ignore
      handleOptions[k] !== undefined && !handleOptions[k]!(origData, optionsWithDefault[k]!, options as MakeRequired<Options, typeof k>)
  );
  if (keysWithError.length === 0) return data;
  return {
    valid: false,
    data: undefined,
    errors: keysWithError.map(k => ({
      message: k in options ? `vality.${name}.options.${k}` : `vality.${name}.base`,
      options,
      path,
      value,
    })),
  };
}

export function makeValidatee<
  Name extends keyof (vality.valits & vality.guards),
  Arg extends any[],
  Type,
  Options extends RSA,
  V extends boolean
>(
  name: Name,
  fn: (...args: Arg) => (val: unknown, options: Partial<CallOptions<Type, Options>>, path: Path, parent?: any) => ValidationResult<Type>,
  handleOptions?: {
    [K in Exclude<keyof Options, keyof ExtraOptions<Type, Options>>]?: (val: Type, o: NonNullable<Options[K]>, options: MakeRequired<Options, K> & Partial<ExtraOptions<Type, Options>>) => boolean;
  },
  defaultOptions?: Partial<Options>,
): (...args: Arg) => Validate<Type, Options, V> {
  return (...args) => {
    function getFnWithValitWithOptions(options: Partial<CallOptions<Type, Options>>): ValidateFn<Type> {
      return (value, path, parent) => {
        const data = fn(...args)(value, options, path, parent);

        return dealWithHandleOptions<Type, Options>(name, options, data, path, value, handleOptions, defaultOptions);
      };
    }

    return makeValidate<Type, Options, V>(getFnWithValitWithOptions);
  };
}
