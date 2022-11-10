import { Eny, IntersectItems, OneOrEnumOfTOrFace } from "./utils";
import { Face } from "./validate";

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

export type Parse<T, _D = "out"> = T extends Face<"tuple", infer U, any>
  ? { [K in keyof U]: Parse<U[K], DecD<_D>> }
  : T extends Face<"and", infer U extends Eny[], true>
  ? IntersectItems<U>
  : T extends Face<
      "dict",
      [OneOrEnumOfTOrFace<infer L extends string | number>, infer V],
      true
    >
  ? {
      [P in L]: Parse<V, DecD<_D>>;
    }
  : T extends readonly [infer U] // Array Short
  ? Parse<U, DecD<_D>>[]
  : T extends Face<any, (infer U)[], true> // Array Valit
  ? Parse<U, DecD<_D>>[]
  : T extends readonly (infer U)[] // Enum Short
  ? Parse<U, DecD<_D>>
  : T extends Face<any, infer U, true> // Valits' content needs to be parsed again
  ? Parse<U, DecD<_D>>
  : T extends Face<any, infer U, false> // Whereas Guards' doesn't
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
