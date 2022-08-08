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
        }
      >;
      boolean: Guard<boolean>;
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
});

vality.number = guard("number", val => typeof val === "number" && Number.isFinite(val), {
  min: (val, o) => val >= o,
  max: (val, o) => val <= o,
});

vality.boolean = guard("boolean", val => typeof val === "boolean");

vality.literal = lit => guard("literal", val => val === lit);

// TODO: Accept user defined relation checks (we already support types so right now, those are lying)
vality.relation = () => guard("relation", val => typeof val === "number" && val > 0 && val % 1 === 0);
