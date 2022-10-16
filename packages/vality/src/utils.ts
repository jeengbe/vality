import { Parse } from "./parse";
import { _name, _type, _validate } from "./symbols";
import { Face, ValidateFn } from "./validate";
import { vality } from "./vality";

export interface RSA { [K: string]: any; };
export interface RSN { [K: string]: never; };
export interface RSE { [K: string]: Eny; };

export type Primitive = string | number | boolean | null;

export type Eny = Face<any, any, any> | readonly TOrFace<Eny>[] | Primitive | (() => RSE) | RSE;

/**
 * Make all properties in `T` required whose key is assignable to `K`
 */
export type MakeRequired<T extends RSA, K extends keyof T> = {
  [P in K]-?: T[P];
} & {
    [P in Exclude<keyof T, K>]: T[P];
  };


// export type EnyToFace<T> = T extends [infer U]
//   ? Face<"array", U[], true>
//   : T extends [...infer U]
//   ? Face<"enum", U, true>
//   : T extends Primitive
//   ? Face<"literal", T, false>
//   : T extends Face<any, any, any>
//   ? T
//   : T extends () => infer U
//   ? Face<"relation", U, true>
//   : Face<"object", T, true>;

export type EnyToFace<T> = T extends Face<any, any, any>
  ? T
  : T extends () => (infer U extends Eny)
  ? Face<"relation", U, true>
  : T extends readonly [TOrFace<infer U extends Eny>]
  ? Face<"array", T, true>
  : T extends Primitive
  ? Face<"literal", T, false>
  : T extends EnumOfTOrFace<infer U extends Eny>
  ? Face<"enum", U, true>
  : T extends RSE
  ? Face<"object", T, true>
  : never;

// export function enyToGuard<T extends Face<any, any, any>>(eny: T): T;
// export function enyToGuard<T extends (() => Eny)>(eny: T): Face<"relation", T, true>;
// export function enyToGuard<T extends readonly [TOrFace<Primitive>]>(eny: T): Face<"array", T, true>;
// export function enyToGuard<T extends OneOrEnumOfTOrFace<Primitive>>(eny: T): T extends Primitive ? Face<"literal", T, true> : Face<"enum", T, true>;
// export function enyToGuard<T extends Primitive>(eny: T): Face<"literal", T, true>;
// export function enyToGuard<T extends EnumOfTOrFace<Primitive>>(eny: T): Face<"enum", T, true>;
// export function enyToGuard<T extends RSE>(eny: T): Face<"object", T, true>;
// export function enyToGuard(eny: Eny): Face<any, any, any> {
export function enyToGuard<E extends Eny>(eny: E): EnyToFace<E> {
  if (isArrayOrEnyShort(eny)) {
    if (eny.length === 0) throw new Error("Empty array short");
    if (eny.length === 1) return vality.array(enyToGuard(eny[0]));
    return vality.enum(...eny.map(enyToGuard));
  }
  if (
    typeof eny === "string" ||
    typeof eny === "number" ||
    typeof eny === "boolean" ||
    eny === null
  ) {
    return vality.literal(eny);
  }
  if (isFace(eny)) return eny;
  if (typeof eny === "function") return vality.relation(eny);
  return vality.object(eny as RSA);
}

function isArrayOrEnyShort(val: Eny): val is readonly TOrFace<Primitive>[] {
  return Array.isArray(val);
}

function isFace(val: Face<any, any, any> | (() => Eny) | RSE): val is Face<any, any, any> {
  return _validate in val;
}

export function enyToGuardFn<E extends Eny>(e: E): ValidateFn<any> {
  return enyToGuard(e)[_validate];
}

export type OneOrEnumOfTOrFace<T> = TOrFace<T> | EnumOfTOrFace<T>;

type EnumOfTOrFace<T> = readonly [OneOrEnumOfTOrFace<T>, OneOrEnumOfTOrFace<T>, ...OneOrEnumOfTOrFace<T>[]];

export type TOrFace<T> =
  | T
  | Face<string, T, false>
  // I will come back and revisit this one I am a TypeScript Grandmaster, but for now, I can't get this to work
  // | Face<string, OneOrEnumOfTOrFace<T>, true>;
  | {
    [_name]: string;
    [_validate]: any;
    [_type]: OneOrEnumOfTOrFace<T>;
    isValit?: true;
  };

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
