import type { Guard, GuardFunction, Validate } from "./guard";
import { _validate } from "./symbols";
import type { Valit } from "./valit";
import { vality } from "./vality";

export type RSA = Record<string, any>;
export type RSN = Record<string, never>;
// Can't use Record here because circular types are not valid via type aliases
export type RSE = {
  [K: string]: Eny;
};

export type MaybeArray<T> = T | T[];

export type Primitive = string | number | boolean;
export type _Eny = Primitive | Guard<Primitive, RSA> | GuardFunction<Primitive, RSA> | (() => RSE) | RSE;
export type Eny = MaybeArray<_Eny> | Readonly<MaybeArray<_Eny>>;

/**
 * Make all properties in T required whose key is assignable to K
 */
export type MakeRequired<T extends RSA, K extends keyof T> = {
  [KK in keyof _MakeRequired<T, K>]: _MakeRequired<T, K>[KK];
};
type _MakeRequired<T extends RSA, K extends keyof T> = Required<Pick<T, K>> & Pick<T, Exclude<keyof T, K>>;

export function assert<T>(val: any, condition?: boolean): asserts val is T {
  if (condition === false) {
    throw new Error("Assertion failed");
  }
}

type EnyToGuard<T> = T extends [infer U]
  ? Valit<U[], any>
  : T extends [...infer U]
  ? Valit<U, any>
  : T extends Primitive
  ? Guard<T>
  : T extends Guard<any>
  ? T
  : T extends () => infer U
  ? Guard<U>
  : Guard<T>;

export function enyToGuard(eny: Eny): EnyToGuard<Eny> {
  if (Array.isArray(eny)) {
    if (eny.length === 0) throw new Error("Empty array valit");
    if (eny.length === 1) return vality.array(enyToGuard(eny[0]));
    return vality.enum(...eny.map(enyToGuard));
  }
  if (typeof eny === "string" || typeof eny === "number" || typeof eny === "boolean") return vality.literal(eny);
  // Not sure why we have to assert here, a symbol should never be a key in RSA
  if (_validate in eny) return eny as Exclude<typeof eny, RSA>;
  // This should only allow () => RSE at this point...
  if (typeof eny === "function") return vality.relation(eny as () => RSE);
  // Not sure why we have to assert here, as RSA should be the only type left after narrowing
  return vality.object(eny as RSA);
}

export function enyToGuardFn(v: Eny): Validate {
  return enyToGuard(v)[_validate];
}

export function flat<T>(arr: T[][]): T[] {
  return ([] as T[]).concat(...arr);
}
