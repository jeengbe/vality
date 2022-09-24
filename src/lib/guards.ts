import { config } from "./config";
import { guard, Guard, GuardFn } from "./guard";
import { RelationType } from "./parse";
import { _type } from "./symbols";
import { Primitive, RSE } from "./utils";
import { validate } from "./validate";
import { Valit } from "./valit";
import { vality } from "./vality";

declare global {
  namespace vality {
    interface guards {
      string: Guard<
        "string",
        string,
        {
          minLength: number;
          maxLength: number;
          match: RegExp;
        }
      >;
      number: Guard<
        "number",
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
      boolean: Guard<"boolean", boolean>;
      date: Guard<
        "date",
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
        "literal",
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
        // We return a valit because we have to parse its contents in Parse<>, and guards don't do that
        "relation",
        S,
        {
          transform: (v: RelationType) => RelationType;
        }
      >;
      any: Guard<"any", unknown>;
    }
  }
}

vality.string = guard(
  "string",
  (val) => {
    if (typeof val === "string") return val;
    if (config.strict) return undefined;
    if (typeof val !== "number") return undefined;
    return val.toString();
  },
  {
    minLength: (val, o) => val.length >= o,
    maxLength: (val, o) => val.length <= o,
    match: (val, o) => o.test(val),
  }
);

vality.number = guard(
  "number",
  (val) => {
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
    unsafe: (val, o) =>
      o || (val > Number.MIN_SAFE_INTEGER && val < Number.MAX_SAFE_INTEGER),
  },
  {
    unsafe: false,
  }
);

const y = ["1", 1, "true"];
const n = ["0", 0, "false"];
vality.boolean = guard("boolean", (val) => {
  if (typeof val === "boolean") return val;
  if (config.strict) return undefined;
  if (typeof val !== "string" && typeof val !== "number") return undefined;
  return y.indexOf(val) !== -1
    ? true
    : n.indexOf(val) !== -1
    ? false
    : undefined;
});

vality.date = guard(
  "date",
  (val) => {
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

vality.literal = (lit) => {
  const guardFn: GuardFn<typeof lit, { default: boolean }> = (val, options) => {
    if (options.default === true) {
      if (val === undefined) return lit;
    } else {
      delete options.default;
    }
    if (val === lit) return lit;
    if (config.strict) return undefined;
    if (typeof lit === "string" && typeof val === "number")
      return val.toString() === lit ? lit : undefined;
    if (typeof lit === "number" && typeof val === "string")
      return parseFloat(val) === lit ? lit : undefined;
    if (
      typeof lit === "boolean" &&
      (typeof val === "string" || typeof val === "number")
    ) {
      if (lit === true && y.indexOf(val) !== -1) return lit;
      if (lit === false && n.indexOf(val) !== -1) return lit;
    }
    return undefined;
  };
  Object.assign(guardFn, { [_type]: lit });

  return guard("literal", guardFn);
};

vality.relation = () =>
  guard("relation", (val) => {
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
      // Also, guard() infers its parameter types, and since 'guards["relation"]' doesn't extend 'Guard<>', 'fn' is resolved to '() => never | undefiend' and we cheat by solely asserting it as 'undefined'
    ).data as unknown as undefined;
    // We can just assert this as any, as otherwise we'd just repeat ourselves
    // Asertion is necessary here because a guard is obviously not a valit
  }) as any;

vality.any = guard("any", (val) => val);
