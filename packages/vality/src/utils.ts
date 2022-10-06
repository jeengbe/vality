import { Parse } from "./parse";
import { _name, _type, _validate } from "./symbols";
import { Face, ValidateFn } from "./validate";
import { vality } from "./vality";

export type RSA = Record<string, any>;
export type RSN = Record<string, never>;
// Can't use Record here because circular types are not valid via type aliases
export type RSE = {
  [K: string]: Eny;
};

export type MaybeArray<T> = T | T[];

export type Primitive = string | number | boolean | null;
export type _Eny = Primitive | Face<any, Primitive, any> | (() => Eny) | RSE;
export type Eny = MaybeArray<_Eny> | Readonly<MaybeArray<_Eny>>;

/**
 * Make all properties in `T` required whose key is assignable to `K`
 */
export type MakeRequired<T extends RSA, K extends keyof T> = {
  [P in K]-?: T[P];
} & {
    [P in Exclude<keyof T, K>]: T[P];
  };


export type EnyToFace<T> = T extends [infer U]
  ? Face<"array", U[], true>
  : T extends [...infer U]
  ? Face<"enum", U, true>
  : T extends Primitive
  ? Face<"literal", T, false>
  : T extends Face<any, any, any>
  ? T
  : T extends () => infer U
  ? Face<"relation", U, true>
  : Face<"object", T, true>;

export function enyToGuard<E extends Eny>(eny: E): EnyToFace<E> {
  // TODO: Fix this type mess -- I have no idea why it does that
  if (Array.isArray(eny)) {
    if (eny.length === 0) throw new Error("Empty array short");
    // @ts-ignore
    if (eny.length === 1) return vality.array(enyToGuard(eny[0]));
    // @ts-ignore
    return vality.enum(...eny.map(enyToGuard));
  }
  if (
    typeof eny === "string" ||
    typeof eny === "number" ||
    typeof eny === "boolean" ||
    eny === null
  ) {
    // @ts-ignore
    return vality.literal(eny);
  }
  // Not sure why we have to assert here, a symbol should never be a key in RSA
  // @ts-ignore
  if (_validate in eny) return eny as Exclude<typeof eny, RSA>;
  // This should only allow () => RSE at this point...
  // @ts-ignore
  if (typeof eny === "function") return vality.relation(eny as () => RSE);
  // Not sure why we have to assert here, as RSA should be the only type left after narrowing
  // @ts-ignore
  return vality.object(eny as RSA);
}

// This type is too complicated to represent - should be ValidateFn<ParseIn<E>>
export function enyToGuardFn<E extends Eny>(e: E): ValidateFn<any> {
  return enyToGuard(e)[_validate];
}

// Adapted from https://stackoverflow.com/a/59463385/12405307
// union to intersection converter by @jcalz
// Intersect<{ a: 1 } | { b: 2 }> = { a: 1 } & { b: 2 }
type Intersect<T> = (T extends any ? (x: T) => 0 : never) extends (
  x: infer R
) => 0
  ? R
  : never;

// get keys of tuple
// TupleKeys<[string, string, string]> = 0 | 1 | 2
type TupleKeys<T extends any[]> = Exclude<keyof T, keyof []>;

// apply { foo: ... } to every type in tuple
// Foo<[1, 2]> = { 0: { foo: 1 }, 1: { foo: 2 } }
type Foo<T extends any[]> = {
  [K in TupleKeys<T>]: { foo: T[K]; };
};

// get union of field types of an object (another answer by @jcalz again, I guess)
// Values<{ a: string, b: number }> = string | number
type Values<T> = T[keyof T];

// TS won't believe the result will always have a field "foo"
// so we have to check for it with a conditional first
type Unfoo<T> = T extends { foo: any; } ? T["foo"] : never;

// combine three helpers to get an intersection of all the item types
export type IntersectItems<T extends any[]> = Unfoo<
  Intersect<Parse<Values<Foo<T>>>>
>;

/**
 * A type that represents either `T`, a Guard that resolves to `T` or a Valit that recursively resolves to the previously mentioned (i.e. a Valit for a Valit for a Guard for a string)
 */
export type TOrFace<T, Depth extends null[] = []> =
  | T
  | Face<string, T, false>
  // The reason we implement the Face directly here is that only so are we able to recursively use TOrFace<T>
  // Ideally we'd use something like `Face<string, TOrFace<T>, true>;` but that doesn't work
  // | Face<string, Face<string, T, true>, true>
  // Also, to prevent errors from too deep recursion, we have to introduce a limit
  // https://stackoverflow.com/questions/73978875/hint-outcome-of-infinitely-recursive-type
  | (Depth["length"] extends 15
    ? never
    : {
      [_name]: string;
      [_validate]: any;
      [_type]: TOrFace<T, [...Depth, null]>;
      isValit?: true;
    });

/**
 * A type that's either `T` or a Face of `T` or an enum Short for `T` or Face of `T`
 */
export type OneOrEnumOfTOrFace<T> = OneOrEnumOf<TOrFace<T>>;

/**
 * A type that's either `T` directly or an enum Short for `T`
 */
export type OneOrEnumOf<T> = T | readonly [T, T, ...T[]];
