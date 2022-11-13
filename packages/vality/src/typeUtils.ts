import { Compound } from "./compound";
import { Scalar } from "./scalar";
import { _name, _type } from "./symbols";
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

  return null as any;
}

export function simplifyEnum(e: Eny): Guard<any, any, any> {
  const guard = enyToGuard(e);
  if (getName(guard) !== "enum") return guard;

  // Flatten members
  let values = guard[_type]
    // @ts-expect-error
    .map((member) => {
      if (getName(member) === "enum") return simplifyEnum(member)[_type];
      return enyToGuard(member);
    })
    .flat();

  // Filter never
  // @ts-expect-error
  values = values.filter((v) => !isNever(v));

  if(values.length === 0) return vality.never;
  if (values.length === 1) return values[0];

  let hasStringType = false;
  let hasNumberType = false;

  for(const value of values) {
    if (isAny(value)) return vality.any;

    if (getName(value) === "string") hasStringType = true;
    if (getName(value) === "number") hasNumberType = true;

    // Bail early if we have both string and number
    if (hasStringType && hasNumberType) return vality.enum(vality.string, vality.number);
  }

  // @ts-expect-error
  values = values.filter(v => {
    // Don't need literals if we have the full type
    if (hasStringType && getName(v) === "literal" && typeof v[_type] === "string") return false;
    if (hasNumberType && getName(v) === "literal" && typeof v[_type] === "number") return false;

    return true;
  })

  if (values.length === 1) return values[0];

  return vality.enum(...values);
}

export function isNever(g: Guard<any, any, any>): boolean {
  return getName(g) === "never";
}

export function isAny(g: Guard<any, any, any>): boolean {
  return getName(g) === "any";
}

const primitiveTypes = new Set()
  .add("string")
  .add("number")
  .add("boolean")
  .add("date")
  .add("literal");
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
