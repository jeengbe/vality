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

  // If we have 0 length _after_ filtering out anys, we had [any] to begin with
  if (values.length === 0) return [vality.any];
  if (values.some(isNever)) return [vality.never];
  if (values.length === 1) return values;

  return values;
}

export function simplifyEnum(objs: Eny[]): Guard<any, any, any>[] {
  if(!objs.length) return [vality.never];

  // Flatten members
  let values = ([] as any[]).concat(
    ...objs
      .map((member) => {
        // @ts-expect-error
        if (getName(member) === "enum") return simplifyEnum(member[_type]);
        return enyToGuard(member);
      })
  );

  // Filter never
  values = values.filter((v) => !isNever(v));

  if (values.length === 0) return [vality.never];
  if (values.some(isAny)) return [vality.any];
  if (values.length === 1) return values;

  let hasStringType = false;
  let hasNumberType = false;

  for (const value of values) {
    if (getName(value) === "string") hasStringType = true;
    if (getName(value) === "number") hasNumberType = true;

    // Bail early if we have both string and number
    if (hasStringType && hasNumberType)
      return [vality.string, vality.number];
  }

  values = values.filter((v) => {
    // Don't need literals if we have the full type
    if (
      hasStringType &&
      getName(v) === "literal" &&
      typeof v[_type][0][_type] === "string"
    )
      return false;
    if (
      hasNumberType &&
      getName(v) === "literal" &&
      typeof v[_type][0][_type] === "number"
    )
      return false;

    return true;
  });

  return values;
}

function isNever(g: Guard<any, any, any>): boolean {
  return getName(g) === "never";
}

function isAny(g: Guard<any, any, any>): boolean {
  return getName(g) === "any";
}

export function getName(e: Eny): string {
  const g = enyToGuard(e);

  let type = g[_name];
  const seen = new Set();
  while (types.has(type)) {
    type = types.get(type);
    if (seen.has(type)) throw new Error("Circular type extension");
    seen.add(type);
  }
  return type;
}
