import type { Eny, RSA } from "./utils";
import { Validate } from "./validate";
import type { Valit, Valitate } from "./valit";
import { v } from "./vality";

// Depending on the direction of the required type, we parse relations differently
// If the type comes from the api ("out"), we type a relation as the corresponding type
// If the type is for uploading data, the relation is meant to be a numerical id, and must be presented accordingly
// That's what we keep track of in _D
// In "out"-mode, _D is never
// In "in"-mode, _D is first set to false, so that the root-level model is not treated as a relation (and thus returned as a number)
// For subsequent Enys, _D is then set to true, which means that any relation should be returned as a number

// This is how a relation should be passed to the api
type RelationType = vality.Config extends { RelationType: infer R } ? R : string;

type ValitToType<T extends Eny, _D> = T extends readonly [infer U]
  ? Parse<U, _D>[]
  : T extends readonly [...any]
  ? Parse<T[number], _D>
  : T extends Valitate<infer U>
  ? U extends [...any[]]
    ? {
        [K in keyof U]: Parse<U[K], _D>;
      }
    : Parse<U, _D>
  : T extends Valit<infer U, infer O>
  ? U extends [...any[]]
    ? {
        [K in keyof U]: Parse<U[K], _D>;
      }
    : Parse<U, _D>
  : T extends Validate<infer U>
  ? U
  : T;

export type Parse<T, _D = never> = T extends Validate<any> // also catches Valit<any, any>
  ? ValitToType<T, _D>
  : T extends () => infer U
  ? false extends _D
    ? Parse<U, true>
    : true extends _D
    ? RelationType
    : Parse<U, _D>
  : T extends readonly any[]
  ? ValitToType<T, _D>
  : T extends RSA
  ? {
      -readonly [K in keyof T]: Parse<T[K], _D>;
    }
  : ValitToType<T, _D>;

export type ParseOut<T> = Parse<T>;
export type ParseIn<T> = Parse<T, false>;


// Models are defined like this:
const Person = () => ({
  name: v.string,
  age: v.optional(v.number),
  address: {
    street: v.string,
    city: v.string,
    country: v.string,
  },
});


// And can easily be converted into a type:
type PersonModel = Parse<typeof Person>;
