import { Compound } from "./compound";
import { Scalar } from "./scalar";
import { _name } from "./symbols";
import { types } from "./types";
import { Eny, enyToGuard, RSA } from "./utils";
import { Guard } from "./valit";
import { vality } from "./vality";

export function intersect(
  ...obj: Eny[]
): Compound<"object", RSA> | Scalar<"never", never> | Scalar<"any", any> {
  if (!obj.length) return vality.never;

  const guards = obj.map(enyToGuard);

  // If there is only one guard, we can just return it
  if (guards.length === 1) return guards[0] as any;
  // The easiest check first is to see whether any of the values are never
  if (guards.some(isNever)) return vality.never;
  // If any of the guards are any, we can just return any
  if (guards.some(isAny)) return vality.any;

  // The next step is comparing types
  // If one type is a scalar, the intersect is never
  if (guards.some(isScalar)) return vality.never;

}

export function isNever(g: Guard<any, any, any>): boolean {
  return getName(g) === "never";
}

export function isAny(g: Guard<any, any, any>): boolean {
  return getName(g) === "any";
}

const primitiveTypes = new Set(["string", "number", "boolean", "date", "literal"]);
export function isScalar(g: Guard<any, any, any>): boolean {
  return primitiveTypes.has(getName(g));
}


export function getName(e: Eny): string {
  const g = enyToGuard(e);

  let type = g[_name];
  const seen = new Set();
  if (!(type in types)) return type;

  while (types[type] !== type) {
    type = types[type];
    if (seen.has(type)) throw new Error("Circular type definition");
    seen.add(type);
  }
  return type;
}
