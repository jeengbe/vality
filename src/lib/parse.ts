import type { Eny, RSA } from "./utils";
import { Validate } from "./validate";
import type { ReadonlyValit, Valit, Valitate } from "./valit";

// Depending on the direction of the required type, we parse relations differently
// If the type comes from the api ("out"), we type a relation as the corresponding type
// If the type is for uploading data, the relation is meant to be a numerical id, and must be presented accordingly
// That's what we keep track of in _D
// In "out"-mode, _D is "out"
// In "in"-mode, _D is first set to "in-layer-one", so that the root-level model is not treated as a relation (and thus returned as a number)
// For subsequent enys, _D is then set to "in", which means that any relation should be returned as a number

// This is how a relation should be passed to the api (in "in"-mode)
export type RelationType = vality.Config extends { RelationType: infer R } ? R : string;

type ValitToType<T extends Eny, _D> =
  // Array short
  T extends readonly [infer U]
    ? Parse<U, _D>[]
    : // Enum short
    T extends readonly [...any]
    ? Parse<T[number], _D>
    : T extends ReadonlyValit<infer U>
    ? "writeable" extends _D
      ? never
      : U extends [...any[]]
      ? {
          [K in keyof U]: Parse<U[K], _D>;
        }
      : Parse<U, _D>
    : // Valits require parsing their actual type
    T extends Valitate<infer U>
    ? U extends [...any[]]
      ? {
          [K in keyof U]: Parse<U[K], _D>;
        }
      : Parse<U, _D>
    : // (Also a valit)
    T extends Valit<infer U, infer O>
    ? U extends [...any[]]
      ? {
          [K in keyof U]: Parse<U[K], _D>;
        }
      : Parse<U, _D>
    : // Whereas Validates directly from guards do not
    T extends Validate<infer U>
    ? U
    : T;

type MapObject<T, _D> = {
  -readonly [K in keyof T as Parse<T[K], _D> extends never ? never : undefined extends Parse<T[K], _D> ? never : K]: Parse<
    T[K],
    _D
  >;
} & {
  -readonly [K in keyof T as Parse<T[K], _D> extends never ? never : undefined extends Parse<T[K], _D> ? K : never]?: Parse<
    T[K],
    _D
  >;
};

export type Parse<T, _D = "out"> = T extends Validate<any> // also catches Valit<any, any>
  ? ValitToType<T, _D>
  : // We parse a model
  T extends () => infer U
  ? "in-layer-one" extends _D
    ? Parse<U, "in">
    : "in" extends _D
    ? RelationType
    : Parse<U, _D>
  : // We get an array short of any kind
  T extends readonly any[]
  ? ValitToType<T, _D>
  : // Plain object
  T extends RSA
  ? {
      [K in keyof MapObject<T, _D>]: MapObject<T, _D>[K];
    }
  : ValitToType<T, _D>;

export type ParseOut<T> = Parse<T>;
export type ParseIn<T> = Parse<T, "in-layer-one">;
export type ParseWriteable<T> = Parse<T, "writeable">;
