import { _specialValit } from "./symbols";
import { Eny, IntersectItems, OneOrEnumOfFace } from "./utils";
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
    interface Config {
    }
  }
}

// This is how a relation should be passed to the api (in "in"-mode)
export type RelationType = vality.Config extends { RelationType: infer R; } ? R : number | null;

type DecD<D> = "in-layer-one" extends D ? "in" : D;

export type Parse<T, _D = "out"> = T extends infer U & { [_specialValit]: "tuple"; }
  ? { [K in keyof U]: Parse<U[K], DecD<_D>> }
  : T extends (infer U extends Eny[]) & { [_specialValit]: "and"; }
  ? IntersectItems<U>
  : T extends [infer K extends OneOrEnumOfFace<string | number>, infer V] & { [_specialValit]: "dict"; }
  ? {
    [KK in Parse<K, DecD<_D>>]: Parse<V, DecD<_D>>;
  }
  : T extends readonly [infer U] // Array short
  ? Parse<U, DecD<_D>>[]
  : T extends readonly (infer U)[] // Enum short
  ? Parse<U, DecD<_D>>
  : T extends Face<infer U, true> & {[_specialValit]: "readonly"} // Readonly valit
  ? "writeable" extends _D
  ? never
  : Parse<U, DecD<_D>>
  : T extends Face<infer U, true> // Valits' content needs to be parsed again
  ? Parse<U, DecD<_D>>
  : T extends Face<infer U, false> // Whereas guards' doesn't
  ? U
  : T extends () => infer U // A model
  ? "in-layer-one" extends _D
  ? Parse<U, "in">
  : "in" extends _D
  ? RelationType
  : Parse<U, _D>
  : {
    -readonly [K in keyof T as Parse<T[K], _D> extends never ? never : K]: Parse<T[K], DecD<_D>>;
  };

export type ParseOut<T> = Parse<T>;
export type ParseIn<T> = Parse<T, "in-layer-one">;
