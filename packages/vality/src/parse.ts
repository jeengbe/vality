import { Flagged } from "./flag";
import { Eny, IntersectItems, OneOrEnumOfTOrGuard } from "./utils";
import { Guard } from "./valit";

// Depending on the direction of the required type, we parse relations differently
// If the type comes from the api ("out"), we type a relation as the corresponding type
// If the type is for uploading data, the relation is meant to be a numerical id, and must be presented accordingly
// That's what we keep track of in _D
// In "out"-mode, _D is "out"
// In "in"-mode, _D is first set to "in-layer-one", so that the root-level model is not treated as a relation (and thus returned as a number)
// For subsequent enys, _D is then set to "in", which means that any relation should be returned as a number

declare global {
  namespace vality {
    interface Config {}
  }
}

// This is how a relation should be passed to the api (in "in"-mode)
export type RelationType = vality.Config extends { RelationType: infer R }
  ? R
  : number | null;

type DecD<D> = "in-layer-one" extends D ? "in" : D;

export type IsAny<T> = 0 extends 1 & T ? true : false;

// Thank you kind stranger https://discord.com/channels/508357248330760243/1041442977920319488/1041463546195751062
type Mapp<T> = T extends T
  ? {
      [K in keyof T]: T[K]
    }
  : never

export type Parse<T, _D = "out"> = IsAny<T> extends true
  ? any
  : T extends Flagged<infer U, infer Name, infer Value>
  ? Name extends "optional"
    ? Parse<U, _D> | undefined
    : Parse<U, _D>
  : T extends Guard<"tuple", infer U, any>
  ? { [K in keyof U]: Parse<U[K], DecD<_D>> }
  : T extends Guard<"and", infer U extends Eny[], true>
  ? Mapp<IntersectItems<U>>
  : T extends Guard<
      "dict",
      [OneOrEnumOfTOrGuard<infer L extends string | number>, infer V],
      true
    >
  ? {
      [P in L]: Parse<V, DecD<_D>>;
    }
  : T extends readonly [infer U] // Array Short
  ? Parse<U, DecD<_D>>[]
  : T extends Guard<any, (infer U)[], true> // Array Valit
  ? Parse<U, DecD<_D>>[]
  : T extends readonly (infer U)[] // Enum Short
  ? Parse<U, DecD<_D>>
  : T extends Guard<any, infer U, true> // Compounds' content needs to be parsed again
  ? Parse<U, DecD<_D>>
  : T extends Guard<any, infer U, false> // Whereas Scalars' doesn't
  ? U
  : T extends () => infer U // A model
  ? "in-layer-one" extends _D
    ? Parse<U, "in">
    : "in" extends _D
    ? RelationType
    : Parse<U, _D>
  : {
      -readonly [K in keyof T as Parse<T[K], _D> extends never
        ? never
        : K]: Parse<T[K], DecD<_D>>;
    };

export type ParseOut<T> = Parse<T>;
export type ParseIn<T> = Parse<T, "in-layer-one">;
