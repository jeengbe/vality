import { config } from "./config";
import { guard, Guard } from "./guard";
import { RelationType } from "./parse";
import { Primitive, RSE } from "./utils";
import { validate } from "./validate";
import { Valit } from "./valit";
import { vality } from "./vality";

// The idea behind default options is to only specify them they further restrict the more generic type that solely checking would give.
// e.g.integer: false would be a bad default option, as it wouldn't actually impose any further constraints
// unsafe: false, however, does further narrow down number inputs to safe ones only, which is why a default option is good here

declare global {
  namespace vality {
    interface guards {
      string: Guard<
        string,
        {
          minLength: number;
          maxLength: number;
          match: RegExp;
        }
      >;
      number: Guard<
        number,
        {
          min: number;
          max: number;
          /**
           * Whether the number has to be an integer
           */
          integer: boolean;
          /**
           * Whether to allow numbers outside the safe integer range
           *
           * @default false
           * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
           */
          unsafe: boolean;
        }
      >;
      boolean: Guard<boolean>;
      date: Guard<
        Date,
        {
          min: Date;
          max: Date;
          /**
           * Whether the date must lie in the past
           */
          past: boolean;
          /**
           * Whether the date must lie in the future
           */
          future: boolean;
        }
      >;
      /**
       * @example vality.literal(7)
       */
      literal<P extends Primitive>(
        lit: P
      ): Guard<
        P,
        {
          // Overwrite the default dehaviour of 'default'
          default: boolean;
        }
      >;
      /**
       * @example vality.relation(SomeModel)
       */
      // model S is solely used to infer and keep the type of the relation and not used in runtime
      relation<S extends () => RSE>(
        model: S
      ): Valit<
        S,
        {
          transform: (v: RelationType) => RelationType;
        }
      >;
    }
  }
}

vality.string = guard(
  "string",
  val => (typeof val === "string" || typeof val === "number" || typeof val === "boolean" ? val.toString() : undefined),
  {
    minLength: (val, o) => val.length >= o,
    maxLength: (val, o) => val.length <= o,
    match: (val, o) => o.test(val),
  }
);

vality.number = guard(
  "number",
  val => {
    if (typeof val === "number") return val;
    if (config.strict) return undefined;
    if (typeof val !== "string") return undefined;
    const nr = Number.parseFloat(val);
    if (Number.isNaN(nr)) return undefined;
    return nr;
  },
  {
    min: (val, o) => val >= o,
    max: (val, o) => val <= o,
    integer: (val, o) => !o || val % 1 === 0,
    unsafe: (val, o) => o || (val > Number.MIN_SAFE_INTEGER && val < Number.MAX_SAFE_INTEGER),
  },
  {
    unsafe: false,
  }
);

const y = ["1", 1, "true"];
const n = ["0", 0, "false"];
vality.boolean = guard("boolean", val => {
  if (typeof val === "boolean") return val;
  if (config.strict) return undefined;
  if (typeof val !== "string" && typeof val !== "number") return undefined;
  return y.indexOf(val) !== -1 ? true : n.indexOf(val) !== -1 ? false : undefined;
});

vality.date = guard(
  "date",
  val => {
    if (val instanceof Date) return val;
    if (config.strict) return undefined;
    if (typeof val !== "string" && typeof val !== "number") return undefined;
    const date = new Date(val);
    if (Number.isNaN(date.getTime())) return undefined;
    return date;
  },
  {
    min: (val, o) => val >= o,
    max: (val, o) => val <= o,
    past: (val, o) => !o || val < new Date(),
    future: (val, o) => !o || val > new Date(),
  }
);

vality.literal = lit =>
  guard("literal", (val, options) => {
    // If the literal should be used as default, then we don't want to have to specify the literal value twice, so here we check whether we should use it as default
    // In that case, we simply set it to the literal value here (before it is checked) and then leave the rest running as it should
    // @ts-expect-error - Hacky solution
    if (options.default === true) options.default = val;
    return val === lit ? lit : undefined;
  });

vality.relation = m =>
  guard("relation", val => {
    return validate(
      [
        null,
        vality.number({
          integer: true,
          min: 0,
        }),
      ],
      val
      // Need to assert here as these returns really don't match, and we just simulate the return type of the relation to be the object
    ).data as unknown as typeof m | undefined;
  }) as unknown as Valit<
    typeof m,
    {
      transform: (v: RelationType) => RelationType;
    }
  >;
