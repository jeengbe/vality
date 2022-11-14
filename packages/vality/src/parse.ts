import { Flagged } from "./flag";
import { Eny, IntersectItems, OneOrEnumOfTOrGuard } from "./utils";
import { Guard } from "./valit";

declare global {
  namespace vality {
    interface Config {}
  }
}

export type IsAny<T> = 0 extends 1 & T ? true : false;

// Thank you kind stranger https://discord.com/channels/508357248330760243/1041442977920319488/1041463546195751062
type Mapp<T> = T extends T
  ? {
      [K in keyof T]: T[K]
    }
  : never

export type Parse<T> = IsAny<T> extends true
  ? any
  : T extends Flagged<infer U, infer Name, infer Value>
  ? Name extends "optional"
    ? Parse<U> | undefined
    : Parse<U>
  : T extends Guard<"tuple", infer U, any>
  ? { [K in keyof U]: Parse<U[K]> }
  : T extends Guard<"and", infer U extends Eny[], true>
  ? Mapp<IntersectItems<U>>
  : T extends Guard<
      "dict",
      [OneOrEnumOfTOrGuard<infer L extends string | number>, infer V],
      true
    >
  ? {
      [P in L]: Parse<V>;
    }
  : T extends readonly [infer U] // Array Short
  ? Parse<U>[]
  : T extends Guard<any, (infer U)[], true> // Array Valit
  ? Parse<U>[]
  : T extends readonly (infer U)[] // Enum Short
  ? Parse<U>
  : T extends Guard<any, infer U, true> // Compounds' content needs to be parsed again
  ? Parse<U>
  : T extends Guard<any, infer U, false> // Whereas Scalars' doesn't
  ? U
  : {
      -readonly [K in keyof T as Parse<T[K]> extends never
        ? never
        : K]: Parse<T[K]>;
    };
