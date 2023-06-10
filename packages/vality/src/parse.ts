import { Flagged } from "./flag";
import { Eny, IntersectItems, OneOrEnumOfTOrGuard, Primitive } from "./utils";
import { Guard } from "./valit";

declare global {
  namespace vality {
    interface Config {}
  }
}

export type IsAny<T> = 0 extends 1 & T ? true : false;

type Intersect<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

export type Parse<T> = Eny extends T
  ? unknown
  : IsAny<T> extends true
  ? any
  : T extends Primitive
  ? T
  : T extends Flagged<infer U, infer Name, infer Value>
  ? Name extends "optional"
    ? Parse<U> | undefined
    : Parse<U>
  : T extends Guard<"tuple", infer U, any>
  ? { [K in keyof U]: Parse<U[K]> }
  : T extends Guard<"and", infer U, true>
  ? U extends Eny[]
    ? Expand<IntersectItems<U>>
    : never
  : T extends Guard<"dict", [OneOrEnumOfTOrGuard<infer L>, infer V], true>
  ? Expand<
      Intersect<
        L extends string | number
          ? {
              [P in L]: Parse<V>;
            }
          : never
      >
    >
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
      -readonly [K in GetObjectKeys<T> as K extends `${infer U}?` ? U : K]:
        | Expand<Parse<T[K]>>
        | (K extends `${string}?` ? undefined : never);
    };

type GetObjectKeys<T> = Parse<T[keyof T]> extends never ? never : keyof T;

type Expand<T> = T extends object
  ? T extends infer U
    ? { [K in keyof U]: U[K] }
    : never
  : T;
