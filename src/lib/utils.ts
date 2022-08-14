import { Guard } from "./guard";
import { ParseIn } from "./parse";
import { _validate } from "./symbols";
import { ValidateFn } from "./validate";
import type { Valit, Valitate } from "./valit";
import { vality } from "./vality";

export type RSA = Record<string, any>;
export type RSN = Record<string, never>;
// Can't use Record here because circular types are not valid via type aliases
export type RSE = {
  [K: string]: Eny;
};

export type MaybeArray<T> = T | T[];

export type Primitive = string | number | boolean | null;
export type _Eny = Primitive | Guard<Primitive, RSA> | Valitate<Primitive> | (() => RSE) | RSE;
export type Eny = MaybeArray<_Eny> | Readonly<MaybeArray<_Eny>>;

/**
 * Make all properties in T required whose key is assignable to K
 */
export type MakeRequired<T extends RSA, K extends keyof T> = {
  [P in keyof _MakeRequired<T, K>]: _MakeRequired<T, K>[P];
};
type _MakeRequired<T extends RSA, K extends keyof T> = Required<Pick<T, K>> & Pick<T, Exclude<keyof T, K>>;

export function assert<T>(val: any, condition?: boolean): asserts val is T {
  if (condition === false) {
    throw new Error("Assertion failed");
  }
}

export function isValid<Type>(data: Type | undefined): data is Type {
  return data !== undefined;
}

export type EnyToGuard<T> = T extends [infer U]
  ? Valit<U[], any>
  : T extends [...infer U]
  ? Valit<U, any>
  : T extends Primitive
  ? Guard<T>
  : T extends Guard<any>
  ? T
  : T extends () => infer U
  ? Guard<U>
  : Valit<T, any>;

export function enyToGuard<E extends Eny>(eny: E): EnyToGuard<E> {
  // TODO: Fix this type mess -- I have no idea why it does that
  if (Array.isArray(eny)) {
    if (eny.length === 0) throw new Error("Empty array valit");
    // @ts-ignore
    if (eny.length === 1) return vality.array(enyToGuard(eny[0]));
    // @ts-ignore
    return vality.enum(...eny.map(enyToGuard));
  }
  // @ts-ignore
  if (typeof eny === "string" || typeof eny === "number" || typeof eny === "boolean" || eny === null) return vality.literal(eny);
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

export function enyToGuardFn<E extends Eny>(e: E): ValidateFn<ParseIn<E>> {
  return enyToGuard(e)[_validate] as ValidateFn<ParseIn<E>>;
}

export function flat<T>(arr: T[][]): T[] {
  return ([] as T[]).concat(...arr);
}

export type Identity<T> = T;
export type IdentityFn<T> = (x: T) => T;
export function identity<T>(x: T): T {
  return x;
}

export function trueFn(..._args: any[]): true {
  return true;
}
export function falseFn(..._args: any[]): false {
  return false;
}
