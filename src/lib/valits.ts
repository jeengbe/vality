import { Eny, enyToGuardFn, flat } from "./utils";
import { Error } from "./validate";
import { valit, Valit } from "./valit";
import { vality } from "./vality";

declare global {
  namespace vality {
    interface valits {
      array: <E extends Eny>(
        e: E
      ) => Valit<
        E[],
        {
          minLength?: number;
          maxLength?: number;
        }
      >;
      tuple: <E extends Eny[]>(...es: E) => Valit<E>;
      optional: <E extends Eny>(e: E) => Valit<E | undefined>;
      enum: <E extends Eny>(...es: E[]) => Valit<E>;
      object: <E extends Record<string, Eny>>(
        v: E
      ) => Valit<
        E,
        {
          bail?: boolean;
        }
      >;
    }
  }
}

vality.array = valit(
  "array",
  e => (val, path, options) => {
    if (!Array.isArray(val)) return { valid: false, errors: [{ message: "vality.array.type", path, options, val }] };
    const fn = enyToGuardFn(e);
    const errors = flat(val.map((_, i) => i).map(i => fn(val[i], [...path, i]).errors));
    return { valid: errors.length === 0, errors };
  },
  {
    minLength: (val, o) => val.length >= o,
    maxLength: (val, o) => val.length <= o,
  }
);

vality.object = valit("object", e => (val, path, options) => {
  if (typeof val !== "object" || val === null)
    return { valid: false, errors: [{ message: "vality.object.type", path, options, val }] };
  const errors: Error[] = [];
  for (const k in e) {
    // We can do this assertion here, since in the worst case, we'll get undefined, which is what we want to
    const res = enyToGuardFn(e[k])(val[k as keyof typeof val], [...path, k]);
    errors.push(...res.errors);
    if (!res.valid && options.bail) break;
  }
  return { valid: errors.length === 0, errors };
});

vality.optional = valit("optional", e => (val, path) => {
  if (val === undefined) return { valid: true, errors: [] };
  return enyToGuardFn(e)(val, path);
});

vality.enum = valit("enum", (...es) => (val, path, options) => {
  const valid = es.some(e => enyToGuardFn(e)(val, path).valid);
  return { valid, errors: valid ? [] : [{ message: "vality.enum.type", path, options, val }] };
});

vality.tuple = valit("tuple", (...es) => (val, path, options) => {
  if (!Array.isArray(val) || val.length !== es.length)
    return { valid: false, errors: [{ message: "vality.tuple.type", path, options, val }] };
  const errors = flat(val.map((_, i) => i).map(i => enyToGuardFn(es[i])(val[i], [...path, i]).errors));
  return { valid: errors.length === 0, errors };
});
