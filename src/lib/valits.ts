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
          /**
           * If true, stops validating after the first error.
           *
           * @default false
           */
          bail?: boolean;
        }
      >;
      tuple: <E extends Eny[]>(...es: E) => Valit<E>;
      optional: <E extends Eny>(e: E) => Valit<E | undefined>;
      enum: <E extends Eny[]>(...es: E) => Valit<E[number]>;
      object: <E extends Record<string, Eny>>(
        v: E
      ) => Valit<
        E,
        {
          /**
           * If true, stops validating after the first error.
           *
           * @default false
           */
          bail?: boolean;
        }
      >;
    }
  }
}

vality.array = valit(
  "array",
  e => (value, path, options) => {
    if (!Array.isArray(value)) return { valid: false, errors: [{ message: "vality.array.base", path, options, value }] };
    const errors: Error[] = [];
    for (const k in e) {
      // We can do this assertion here, since in the worst case, we'll get undefined, which is what we want to
      const res = enyToGuardFn(e[k])(value[k as keyof typeof value], [...path, k]);
      errors.push(...res.errors);
      if (!res.valid && options.bail) break;
    }
    return { valid: errors.length === 0, errors };
  },
  {
    minLength: (val, o) => val.length >= o,
    maxLength: (val, o) => val.length <= o,
    bail: val => true,
  }
);

vality.object = valit("object", e => (value, path, options) => {
  if (typeof value !== "object" || value === null)
    return { valid: false, errors: [{ message: "vality.object.base", path, options, value }] };
  const errors: Error[] = [];
  for (const k in e) {
    // We can do this assertion here, since in the worst case, we'll get undefined, which is what we want to
    const res = enyToGuardFn(e[k])(value[k as keyof typeof value], [...path, k]);
    errors.push(...res.errors);
    if (!res.valid && options.bail) break;
  }
  return { valid: errors.length === 0, errors };
});

vality.optional = valit("optional", e => (val, path) => {
  if (val === undefined) return { valid: true, errors: [] };
  return enyToGuardFn(e)(val, path);
});

vality.enum = valit("enum", (...es) => (value, path, options) => {
  const valid = es.some(e => enyToGuardFn(e)(value, path).valid);
  return { valid, errors: valid ? [] : [{ message: "vality.enum.base", path, options, value }] };
});

vality.tuple = valit("tuple", (...es) => (value, path, options) => {
  if (!Array.isArray(value) || value.length !== es.length)
    return { valid: false, errors: [{ message: "vality.tuple.base", path, options, value }] };
  const errors = flat(value.map((_, i) => i).map(i => enyToGuardFn(es[i])(value[i], [...path, i]).errors));
  return { valid: errors.length === 0, errors };
});
