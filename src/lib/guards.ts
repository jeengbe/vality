import { guard, Guard } from "./guard";
import { Primitive, RSE } from "./utils";
import { vality } from "./vality";

declare global {
  namespace vality {
    interface guards {
      string: Guard<
        string,
        {
          minLength?: number;
          maxLength?: number;
        }
      >;
      number: Guard<
        number,
        {
          min?: number;
          max?: number;
          /**
           * Allow ±NaN, ±Infinity
           *
           * @default false
           */
          allowNonFinite?: boolean;
        }
      >;
      boolean: Guard<boolean>;
      literal<T extends Primitive>(lit: T): Guard<T>;
      // type S is solely used to infer and keep the type of the relation
      relation<S extends () => RSE>(type: S): Guard<S>;
    }
  }
}

vality.string = guard("string", val => typeof val === "string", {
  minLength: (val, o) => val.length >= o,
  maxLength: (val, o) => val.length <= o,
});

vality.number = guard(
  "number",
  (val, o) => {
    let valid = typeof val === "number";
    if (o.allowNonFinite !== true) valid &&= Number.isFinite(val);
    return valid;
  },
  {
    min: (val, o) => val >= o,
    max: (val, o) => val <= o,
    allowNonFinite: val => true,
  }
);

vality.boolean = guard("boolean", val => typeof val === "boolean");

vality.literal = lit => guard("literal", val => val === lit);

vality.relation = () => guard("relation", val => typeof val === "number" && val > 0 && val % 1 === 0);
