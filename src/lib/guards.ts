import { config } from "./config";
import { guard, Guard } from "./guard";
import { RelationType } from "./parse";
import { Primitive, RSE } from "./utils";
import { validate } from "./validate";
import { Valit } from "./valit";
import { vality } from "./vality";

declare global {
  namespace vality {
    interface guards {
      string: Guard<
        string,
        {
          minLength?: number;
          maxLength?: number;
          match?: RegExp;
        }
      >;
      number: Guard<
        number,
        {
          min?: number;
          max?: number;
          /**
           * @default false
           */
          integer?: boolean;
        }
      >;
      boolean: Guard<boolean>;
      date: Guard<
        Date,
        {
          min?: Date;
          max?: Date;
          past?: boolean;
          future?: boolean;
        }
      >;
      /**
       * @example vality.literal(7)
       */
      literal(lit: Primitive): Guard<typeof lit>;
      /**
       * @example vality.relation(SomeModel)
       */
      // type S is solely used to infer and keep the type of the relation and not used in runtime
      relation<S extends () => RSE>(
        type: S
      ): Valit<
        S,
        {
          transform: (v: RelationType) => RelationType;
        }
      >;
    }
  }
}

vality.string = guard("string", val => (typeof val === "string" ? val : undefined), {
  minLength: (val, o) => val.length >= o,
  maxLength: (val, o) => val.length <= o,
  match: (val, o) => o.test(val),
});

vality.number = guard(
  "number",
  val => {
    const nr = typeof val === "number" ? val : config.strict ? NaN : typeof val === "string" ? Number.parseFloat(val) : NaN;
    if (nr > Number.MIN_SAFE_INTEGER && nr < Number.MAX_SAFE_INTEGER) return nr;
    return undefined;
  },
  {
    min: (val, o) => val >= o,
    max: (val, o) => val <= o,
    integer: (val, o) => (val % 1 === 0 ? o : !o),
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
    min: (val, o) => val.getTime() >= o.getTime(),
    max: (val, o) => val.getTime() <= o.getTime(),
    past: (val, o) => !o || val < new Date(),
    future: (val, o) => !o || val > new Date(),
  }
);

vality.literal = lit => guard("literal", val => (val === lit ? lit : undefined));

vality.relation = s =>
  guard("relation", val => {
    const r = validate(
      vality.number({
        integer: true,
        min: 0,
      }),
      val
    );
    // Need to assert here as these returns really don't match, and we just simulate the return type of the relation to be the object
    return r.valid ? (r.data as unknown as typeof s) : undefined;
  }) as Valit<typeof s, {
    transform: (v: RelationType) => RelationType;
  }>;
