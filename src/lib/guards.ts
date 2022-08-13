import { guard, Guard } from "./guard";
import { compose, Primitive, RSE } from "./utils";
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
        }
      >;
      /**
       * @example vality.literal(7)
       */
      literal<T extends Primitive>(lit: T): Guard<T>;
      // type S is solely used to infer and keep the type of the relation
      /**
       * @example vality.relation(SomeModel)
       */
      relation<S extends () => RSE>(type: S): Guard<S>;
    }
  }
}

vality.string = guard("string", val => typeof val === "string", {
  minLength: (val, o) => val.length >= o,
  maxLength: (val, o) => val.length <= o,
  match: (val, o) => o.test(val),
});

// prettier-ignore
vality.number = guard("number", val => (typeof val === "number" && val > Number.MIN_SAFE_INTEGER && val < Number.MAX_SAFE_INTEGER), {
  min: (val, o) => val >= o,
  max: (val, o) => val <= o,
  integer: (val, o) => (val % 1 === 0 ? o : !o),
});

vality.boolean = guard("boolean", val => typeof val === "boolean");

vality.date = guard("date", val => val instanceof Date, {
  min: (val, o) => val.getTime() >= o.getTime(),
  max: (val, o) => val.getTime() <= o.getTime(),
});

vality.literal = lit => guard("literal", val => val === lit);

vality.relation = () =>
  guard(
    "relation",
    compose(
      vality.number({
        integer: true,
        min: 0,
      })
    )
  );
