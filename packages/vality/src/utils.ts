import { Guard, GuardFn } from "valit";
import { Parse } from "./parse";
import { _flags, _guard } from "./symbols";
import { vality } from "./vality";

export interface RSA {
  [K: string]: any;
}
export interface RSE {
  [K: string]: Eny;
}

export type Primitive = string | number | boolean | null;

export type Eny =
  | Guard<any, any, any>
  | readonly TOrGuard<Eny>[]
  | Primitive
  | (() => RSE)
  | RSE;

export type EnyToGuard<T> = T extends Guard<any, any, any>
  ? T
  : // prettier-ignore -- Wrongly removes parentheses
  T extends (() => infer U extends Eny)
  ? EnyToGuard<U>
  : T extends readonly [TOrGuard<Eny>]
  ? Guard<"array", T, true>
  : T extends Primitive
  ? string extends T
    ? Guard<"string", T, false>
    : number extends T
    ? Guard<"number", T, false>
    : boolean extends T
    ? Guard<"boolean", T, false>
    : null extends T
    ? Guard<"null", T, false>
    : Guard<"literal", T, false>
  : T extends EnumOfTOrGuard<infer U extends Eny>
  ? Guard<"enum", U, true>
  : T extends RSE
  ? Guard<"object", T, true>
  : never;

export function enyToGuard<E extends Eny>(eny: E): Guard<any, any, any> {
  // The issue with this function is that the connection to E gets lost within the branches
  // so TS can no longer be sure that the type actually matches the defined return type
  // Which means, that we unfortunately have to 'Guard<any, any, any>' this
  // See https://www.typescriptlang.org/play?jsx=0#code/DYUwLgBAZgvAPAFQHwAoBuAuBBKLEQAeYIAdgCYDOARAIZUD8tVGVARlTEmjD043S3ZA for a minimal example of the issue.
  // The code is minified for the link to fit into this comment, but expanding it shows the issue more clearly.

  if (isGuard(eny)) return eny;
  // Needs to be checked after isGuard since functions can be guards
  if (typeof eny === "function") return vality.object(eny());

  if (
    typeof eny === "string" ||
    typeof eny === "number" ||
    typeof eny === "boolean" ||
    eny === null
  ) {
    return vality.literal(eny);
  }

  if (Array.isArray(eny)) {
    // Model is malformed, it's ok to throw an error here
    if (eny.length === 0) throw new Error("Empty array short");
    if (eny.length === 1) return vality.array(enyToGuard(eny[0]));
    return vality.enum(...eny.map(enyToGuard));
  }

  // @ts-expect-error See above reason, and also, Array.isArray doesn't correctly narrow the type
  return vality.object(eny);
}

function isGuard(val: Eny): val is Guard<any, any, any> {
  return (
    (typeof val === "object" || typeof val === "function") &&
    val !== null &&
    _guard in val
  );
}

// For ease-of-use's sake, type this as any
export function enyToGuardFn<E extends Eny>(e: E): GuardFn<any> {
  return enyToGuard(e)[_guard];
}

const emptyMap = new Map();

export function getFlags(e: Eny): ReadonlyMap<string, unknown> {
  if (!isGuard(e)) return emptyMap;
  return e[_flags] ?? emptyMap;
}

export type OneOrEnumOfTOrGuard<T> = TOrGuard<T> | EnumOfTOrGuard<T>;

type EnumOfTOrGuard<T> = readonly [
  OneOrEnumOfTOrGuard<T>,
  OneOrEnumOfTOrGuard<T>,
  ...OneOrEnumOfTOrGuard<T>[]
];

 type TOrGuard<T> =
  | T
  | Guard<any, T, false>
  | Guard<any, OneOrEnumOfTOrGuard<T>, true>;

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
  [K in TupleKeys<T>]: { foo: Parse<T[K]> };
};

// get union of field types of an object (another answer by @jcalz again, I guess)
// Values<{ a: string, b: number }> = string | number
type Values<T> = T[keyof T];

// TS won't believe the result will always have a field "foo"
// so we have to check for it with a conditional first
type Unfoo<T> = T extends { foo: any } ? T["foo"] : never;

// combine three helpers to get an intersection of all the item types
export type IntersectItems<T extends any[]> = Unfoo<Intersect<Values<Foo<T>>>>;
