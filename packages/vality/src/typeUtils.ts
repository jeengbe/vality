import { _name, _type } from "./symbols";
import { types } from "./types";
import { Eny, enyToGuard } from "./utils";
import { Guard } from "./valit";
import { vality } from "./vality";

export function intersect(objs: Eny[]): Guard<any, any, any>[] {
  if (!objs.length) return [vality.never];

  let values = ([] as any[]).concat(
    ...objs.map((member) => {
      // @ts-expect-error
      if (getName(member) === "and") return intersect(member[_type]);
      return enyToGuard(member);
    })
  );

  values = values.filter(v => !isAny(v));

  if (values.length === 0) return [vality.never];
  if (values.length === 1) return values;
  if (values.some(isNever)) return [vality.never];

  // If one type is a scalar, the intersect is never
  if (values.some(isScalar)) return [vality.never];

  return values;
}

export function simplifyEnum(e: Eny): Guard<any, any, any> {
  const guard = enyToGuard(e);
  if (getName(guard) !== "enum") return guard;

  // Flatten members
  let values = [].concat(
    ...guard[_type]
      // @ts-expect-error
      .map((member) => {
        if (getName(member) === "enum") return simplifyEnum(member)[_type];
        return enyToGuard(member);
      })
  );

  // Filter never
  values = values.filter((v) => !isNever(v));

  if (values.length === 0) return vality.never;
  if (values.length === 1) return values[0];
  if (values.some(isAny)) return vality.any;

  let hasStringType = false;
  let hasNumberType = false;

  for (const value of values) {
    if (isAny(value)) return vality.any;

    if (getName(value) === "string") hasStringType = true;
    if (getName(value) === "number") hasNumberType = true;

    // Bail early if we have both string and number
    if (hasStringType && hasNumberType)
      return vality.enum(vality.string, vality.number);
  }

  values = values.filter((v) => {
    // Don't need literals if we have the full type
    if (
      hasStringType &&
      getName(v) === "literal" &&
      typeof v[_type] === "string"
    )
      return false;
    if (
      hasNumberType &&
      getName(v) === "literal" &&
      typeof v[_type] === "number"
    )
      return false;

    return true;
  });

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
