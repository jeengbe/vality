import { Validate } from "./validate";
import type { ReadonlyValit, Valitate } from "./valit";

// Depending on the direction of the required type, we parse relations differently
// If the type comes from the api ("out"), we type a relation as the corresponding type
// If the type is for uploading data, the relation is meant to be a numerical id, and must be presented accordingly
// That's what we keep track of in _D
// In "out"-mode, _D is "out"
// In "in"-mode, _D is first set to "in-layer-one", so that the root-level model is not treated as a relation (and thus returned as a number)
// For subsequent enys, _D is then set to "in", which means that any relation should be returned as a number

// This is how a relation should be passed to the api (in "in"-mode)
export type RelationType = vality.Config extends { RelationType: infer R } ? R : number;

export type Parse<T, _D = "out"> = T extends readonly [infer U] // Array short
  ? Parse<U, _D>[]
  : T extends readonly (infer U)[] // Enum short
  ? Parse<U, _D>
  : T extends ReadonlyValit<infer U> // Readonly valit
  ? "writeable" extends _D
    ? never
    : Parse<U, _D>
  : T extends Valitate<infer U> // Valits needs to be parsed again
  ? Parse<U, _D>
  : T extends Validate<infer U> // Whereas guards don't
  ? U
  : T extends () => infer U // A model
  ? "in-layer-one" extends _D
    ? Parse<U, "in">
    : "in" extends _D
    ? RelationType
    : Parse<U, _D>
  : {
      -readonly [K in keyof T as Parse<T[K], _D> extends never ? never : K]: Parse<T[K], _D>;
    };

export type ParseOut<T> = Parse<T>;
export type ParseIn<T> = Parse<T, "in-layer-one">;
