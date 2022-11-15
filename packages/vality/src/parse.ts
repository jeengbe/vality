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
      [K in keyof T]: T[K];
    }
  : never;

type Intersect<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type ParseWorker<T> = IsAny<T> extends true
  ? any
  : T extends Flagged<infer U, infer Name, infer Value>
  ? Name extends "optional"
    ? ParseWorker<U> | undefined
    : ParseWorker<U>
  : T extends Guard<"tuple", infer U, any>
  ? { [K in keyof U]: ParseWorker<U[K]> }
  : T extends Guard<"and", infer U, true>
  ? U extends Eny[]
    ? Mapp<IntersectItems<U>>
    : never
  : T extends Guard<"dict", [OneOrEnumOfTOrGuard<infer L>, infer V], true>
  ? Intersect<
      L extends string | number
        ? {
            [P in L]: ParseWorker<V>;
          }
        : never
    >
  : T extends readonly [infer U] // Array Short
  ? ParseWorker<U>[]
  : T extends Guard<any, (infer U)[], true> // Array Valit
  ? ParseWorker<U>[]
  : T extends readonly (infer U)[] // Enum Short
  ? ParseWorker<U>
  : T extends Guard<any, infer U, true> // Compounds' content needs to be parsed again
  ? ParseWorker<U>
  : T extends Guard<any, infer U, false> // Whereas Scalars' doesn't
  ? U
  : {
      -readonly [K in GetObjectKeys<T> as K extends `${infer U}?` ? U : K]:
        | ParseWorker<T[K]>
        | (K extends `${string}?` ? undefined : never);
    };

type GetObjectKeys<T> = ParseWorker<T[keyof T]> extends never ? never : keyof T;

type ExpandRecursively<T> = T extends object
  ? T extends infer U
    ? { [K in keyof U]: U[K] }
    : never
  : T;

export type Parse<T> = ExpandRecursively<ParseWorker<T>>;
