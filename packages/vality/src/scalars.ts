import { scalar, Scalar, ScalarFn } from "./scalar";
import { _type } from "./symbols";
import { Primitive } from "./utils";
import { mergeOptions } from "./validate";
import { vality } from "./vality";

declare global {
  namespace vality {
    interface scalars {
      /**
       * Allows any string value
       *
       * @example
       * ```ts
       * isValid(vality.string, "hello world"); // -> true
       * isValid(vality.string, false); // -> false
       * ```
       */
      string: Scalar<
        "string",
        string,
        {
          /**
           * The minimum length the value must have (inclusive)
           *
           * @example
           * ```ts
           * isValid(vality.string({ minLength: 5 }), "hello"); // -> true
           * isValid(vality.string({ minLength: 5 }), "hi"); // -> false
           * ```
           */
          minLength: number;
          /**
           * The maximum length the value may have (inclusive)
           *
           * @example
           * ```ts
           * isValid(vality.string({ maxLength: 5 }), "hello"); // -> true
           * isValid(vality.string({ maxLength: 5 }), "hello world"); // -> false
           * ```
           */
          maxLength: number;
          /**
           * A regular expression the string must match
           *
           * @example
           * ```ts
           * isValid(vality.string({ pattern: /hello/ }), "hello world"); // -> true
           * isValid(vality.string({ pattern: /hello/ }), "hi"); // -> false
           * ```
           */
          match: RegExp;
        }
      >;
      /**
       * Allows any number value
       */
      number: Scalar<
        "number",
        number,
        {
          /**
           * The minimum value the value must have (inclusive)
           *
           * @default undefined
           * @example
           * ```ts
           * isValid(vality.number({ min: 5 }), 5); // -> true
           * isValid(vality.number({ min: 5 }), 4); // -> false
           * ```
           */
          min: number;
          /**
           * The maximum value the value may have (inclusive)
           *
           * @default undefined
           * @example
           * ```ts
           * isValid(vality.number({ max: 5 }), 5); // -> true
           * isValid(vality.number({ max: 5 }), 6); // -> false
           * ```
           */
          max: number;
          /**
           * Whether the value has to be an integer
           *
           * @default false
           * @example
           * ```ts
           * isValid(vality.number({ onlyInteger: true }), 5); // -> true
           * isValid(vality.number({ onlyInteger: true }), 5.5); // -> false
           * ```
           */
          onlyInteger: boolean;
          /**
           * Whether to allow unsafe value
           *
           * @default false
           * @example
           * ```ts
           * isValid(vality.number({ allowUnsafe: true }), Math.pow(2, 53)); // -> true
           * isValid(vality.number({ allowUnsafe: true }), Math.pow(2, 53)); // -> false
           * ```
           *
           * Allows numbers `x` where `x ∉ [Number.MIN_SAFE_INTEGER, -Number.EPSILON] ∧ x ∉ [Number.EPSILON, Number.MAX_SAFE_INTEGER]`
           *
           * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON
           * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MIN_SAFE_INTEGER
           * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
           */
          allowUnsafe: boolean;
          /**
           * Whether to allow NaN values
           *
           * @default false
           * @example
           * ```ts
           * isValid(vality.number({ allowNaN: true }), NaN); // -> true
           * ```
           */
          allowNaN: boolean;
        }
      >;
      /**
       * Allows any boolean value
       *
       * @example
       * ```ts
       * isValid(vality.boolean, true); // -> true
       * isValid(vality.boolean, false); // -> true
       * ```
       */
      boolean: Scalar<"boolean", boolean>;
      /**
       * Allows any date value
       *
       * @example
       * ```ts
       * isValid(vality.date, new Date()); // -> true
       * isValid(vality.date, "hello"); // -> false
       * ```
       */
      date: Scalar<
        "date",
        Date,
        {
          min: Date;
          max: Date;
          /**
           * Whether the value must lie in the past (exclusive)
           *
           * @default false
           * @example
           * ```ts
           * isValid(vality.date({ past: true }), new Date(0)); // -> true
           * isValid(vality.date({ past: true }), new Date()); // -> false
           * ```
           */
          past: boolean;
          /**
           * Whether the value must lie in the future (inclusive)
           *
           * @default false
           * @example
           * ```ts
           * isValid(vality.date({ future: true }), new Date()); // -> true
           * isValid(vality.date({ future: true }), new Date(0)); // -> false
           * ```
           */
          future: boolean;
        }
      >;
      /**
       * Allows any value except `undefined`
       *
       * Use in combination with `vality.optional` to also allow `undefined`
       *
       * @example
       * ```ts
       * isValid(vality.any, "hello"); // -> true
       * isValid(vality.any, undefined); // -> false
       * ```
       */
      any: Scalar<"any", unknown>;
      /**
       * Allows no value
       *
       * @example
       * ```ts
       * isValid(vality.never, "hello"); // -> false
       * isValid(vality.never, undefined); // -> true
       * ```
       */
      never: Scalar<"never", never>;
      /**
       * Allows only the specified literal value
       * @param lit
       */
      literal<P extends Primitive>(
        lit: P
      ): Scalar<
        "literal",
        P,
        {
          // Overwrite the default behaviour of 'default'
          /**
           * Whether to use the primitive as the default if no value is provided
           */
          default: boolean;
        }
      >;
    }
  }
}

vality.string = scalar(
  "string",
  (val, options, context) => {
    if (typeof val === "string") return val;

    const { strict } = mergeOptions(options, context, ["strict"]);

    if (strict) return undefined;
    if (typeof val !== "number") return undefined;
    return val.toString();
  },
  {
    minLength: (val, o) => val.length >= o,
    maxLength: (val, o) => val.length <= o,
    match: (val, o) => o.test(val),
  }
);

vality.number = scalar(
  "number",
  (val, options, context) => {
    if (typeof val === "number") return val;

    const { strict } = mergeOptions(options, context, ["strict"]);

    if (strict) return undefined;
    if (typeof val !== "string") return undefined;
    const nr = Number.parseFloat(val);
    if (Number.isNaN(nr)) return undefined;
    return nr;
  },
  {
    min: (val, o) => val >= o,
    max: (val, o) => val <= o,
    onlyInteger: (val, o) => !o || val % 1 === 0,
    allowUnsafe: (val, o) =>
      o ||
      (val > Number.MIN_SAFE_INTEGER && val < -Number.EPSILON) ||
      (val < Number.MAX_SAFE_INTEGER && val > Number.EPSILON) ||
      val === 0,
    allowNaN: (val, o) => o || !Number.isNaN(val),
  },
  {
    onlyInteger: false,
    allowUnsafe: false,
    allowNaN: false,
  }
);

const y = new Set().add("1").add(1).add("true");
const n = new Set().add("0").add(0).add("false");
vality.boolean = scalar("boolean", (val, options, context) => {
  if (typeof val === "boolean") return val;

  const { strict } = mergeOptions(options, context, ["strict"]);

  if (strict) return undefined;
  if (typeof val !== "string" && typeof val !== "number") return undefined;
  return y.has(val) ? true : n.has(val) ? false : undefined;
});

vality.date = scalar(
  "date",
  (val, options, context) => {
    if (val instanceof Date) return val;

    const { strict } = mergeOptions(options, context, ["strict"]);

    if (strict) return undefined;
    if (typeof val !== "string" && typeof val !== "number") return undefined;
    const date = new Date(val);
    if (Number.isNaN(date.getTime())) return undefined;
    return date;
  },
  {
    min: (val, o) => val >= o,
    max: (val, o) => val <= o,
    past: (val, o) => !o || val < new Date(),
    future: (val, o) => !o || val >= new Date(),
  },
  {
    past: false,
    future: false,
  }
);

vality.any = scalar("any", (val) => val);

vality.never = scalar("never", () => undefined);

vality.literal = (lit) => {
  // We don't do this inline to attach [_type] to scalarFn
  const scalarFn: ScalarFn<typeof lit, { default: boolean }> = (
    val,
    options,
    context
  ) => {
    if (options.default === true) {
      if (val === undefined) return lit;
    } else {
      // We delete here to make sure it isn't used as a fallback default value in makeValit
      delete options.default;
    }
    if (val === lit) return lit;

    const { strict } = mergeOptions(options, context, ["strict"]);

    if (strict) return undefined;
    if (typeof lit === "string" && typeof val === "number")
      return val.toString() === lit ? lit : undefined;
    if (typeof lit === "number" && typeof val === "string")
      return parseFloat(val) === lit ? lit : undefined;
    if (
      typeof lit === "boolean" &&
      (typeof val === "string" || typeof val === "number")
    ) {
      if (lit === true && y.has(val)) return lit;
      if (lit === false && n.has(val)) return lit;
    }
    return undefined;
  };
  // @ts-expect-error -- Symbol is untyped
  scalarFn[_type] = lit;

  return scalar("literal", scalarFn);
};
