import { _validate, _virtual } from "./symbols";
import { Eny, enyToGuardFn, flat } from "./utils";
import { Error, Path } from "./validate";
import { valit, Valit, VirtualValit } from "./valit";
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
      /**
       * This valit wraps the passed eny so that it is ignored by ParseIn
       */
      virtual: <E extends Eny>(e: E) => VirtualValit<E>;
    }
  }
}

vality.array = valit(
  "array",
  e => (value, path, options) => {
    if (!Array.isArray(value)) return { valid: false, errors: [{ message: "vality.array.base", path, options, value }] };
    const fn = enyToGuardFn(e);
    const errors: Error[] = [];
    for (const k in value) {
      // We can do this assertion here, since in the worst case, we'll get undefined, which is what we want to
      const res = fn(value[k as keyof typeof value], [...path, k]);
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
  // We iterate the passed object (in the model) first
  for (const k in e) {
    const ek = e[k];
    if (typeof ek === "object" && ek !== null && _virtual in ek) continue; // We'll deal with these later
      // We can do this assertion here, since in the worst case, we'll get undefined, which is what we want to
      const res = enyToGuardFn(ek)(value[k as keyof typeof value], [...path, k]);
    errors.push(...res.errors);
    if (!res.valid && options.bail) break;
  }
  // And then check for additioal keys
  for (const k in value) {
    const ek = e[k];
    if (ek === undefined || (typeof ek === "object" && ek !== null && _virtual in ek)) {
      errors.push({
        message: "vality.object.extraProperty",
        path: [...path, k],
        options,
        value,
      });
      if (options.bail) break;
    }
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

// Gotta assert here as this is an exception where we don't just return your average valit, but need to add the _virtual marker
// This is required as vality.object checks for this symbol to correctly mark virtual proerties as "non-existend", not "required to be of value 'undefined'"
// Other valits could also mask this error in the future
// We still attach _validate, though, as, for whatever reason, this valit may still be called, and we really don't want a runtime error in that situation
vality.virtual = () =>
  ({
    [_virtual]: true,
    [_validate]: (value: any, path: Path) =>
      value === undefined
        ? { valid: true, errors: [] }
        : {
            valid: false,
            errors: [
              {
                message: "vality.virtual.base",
                path,
                options: {},
                value,
              },
            ],
          },
  } as unknown as VirtualValit<any>);
