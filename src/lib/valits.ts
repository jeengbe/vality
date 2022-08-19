import { _readonly, _validate } from "./symbols";
import { Eny, enyToGuardFn, RSA, RSE } from "./utils";
import { Error, Path } from "./validate";
import { ReadonlyValit, valit, Valit } from "./valit";
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
      tuple: <E extends Eny[]>(
        ...es: E
      ) => Valit<
        E,
        {
          /**
           * @default false
           */
          bail: boolean;
        }
      >;
      optional: <E extends Eny>(e: E) => Valit<undefined | E>;
      enum: <E extends Eny[]>(...es: E) => Valit<E[number]>;
      object: <E extends RSE>(
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
      readonly: <E extends Eny>(e: E) => ReadonlyValit<E>;
    }
  }
}

vality.array = valit(
  "array",
  e => (value, path, options) => {
    if (!Array.isArray(value))
      return { valid: false, data: undefined, errors: [{ message: "vality.array.base", path, options, value }] };
    const fn = enyToGuardFn(e);
    const data: any[] = [];
    const errors: Error[] = [];
    for (const k in value) {
      // We can do this assertion here, since in the worst case, we'll get undefined, which is what we want
      const res = fn(value[k], [...path, k]);
      if (!res.valid) {
        errors.push(...res.errors);
        if (options.bail) break;
      } else {
        data.push(res.data);
      }
    }
    if (errors.length === 0) return { valid: true, data, errors: [] };
    return { valid: false, data: undefined, errors };
  },
  {
    minLength: (val, o) => val.length >= o,
    maxLength: (val, o) => val.length <= o,
  }
);

vality.object = valit(
  "object",
  e => (value, path, options) => {
    if (typeof value !== "object" || value === null)
      return { valid: false, data: undefined, errors: [{ message: "vality.object.base", path, options, value }] };
    // This type would really just be ParseIn<typeof e>, but it's too complicated to represent
    const data: RSA = {};
    const errors: Error[] = [];
    // We iterate the passed object (the model) first
    for (const k in e) {
      const ek = e[k] as Eny;
      if (typeof ek === "object" && ek !== null && _readonly in ek) continue; // We'll deal with these later
      // We can do this assertion here, since in the worst case, we'll get undefined, which is what we want to
      const res = enyToGuardFn(ek)(value[k as keyof typeof value], [...path, k]);
      if (!res.valid) {
        errors.push(...res.errors);
        if (options.bail) break;
      } else {
        data[k] = res.data;
      }
    }
    // And then check for additional keys
    for (const k in value) {
      const ek = e[k];
      if (ek === undefined || (typeof ek === "object" && ek !== null && _readonly in ek)) {
        errors.push({
          message: "vality.object.extraProperty",
          path: [...path, k],
          options,
          value,
        });
        if (options.bail) break;
      }
    }
    if (errors.length === 0) return { valid: true, data: data as typeof e, errors: [] };
    return { valid: false, data: undefined, errors };
  },
  {},
  {
    bail: false,
  }
);

// @ts-ignore
vality.optional = valit("optional", e => (val, path) => {
  // Not the slightest idea why undefined doesn't work
  if (val === undefined) return { valid: true, data: undefined as unknown as typeof e };
  return enyToGuardFn(e)(val, path);
});

vality.enum = valit("enum", (...es) => (value, path, options) => {
  for (const e of es) {
    const res = enyToGuardFn(e)(value, path);
    if (res.valid) return res;
  }
  return { valid: false, data: undefined, errors: [{ message: "vality.enum.base", path, options, value }] };
});

vality.tuple = valit("tuple", (...es) => (value, path, options) => {
  if (!Array.isArray(value) || value.length !== es.length)
    return { valid: false, data: undefined, errors: [{ message: "vality.tuple.base", path, options, value }] };
  const data: any[] = [];
  const errors: Error[] = [];
  for (let i = 0; i < es.length; i++) {
    const res = enyToGuardFn(es[i])(value[i], [...path, i]);
    if (!res.valid) {
      errors.push(...res.errors);
      if (options.bail) break;
    } else {
      data[i] = res.data;
    }
  }
  for (let i = es.length; i < value.length; i++) {
    errors.push({
      message: "vality.tuple.extraProperty",
      path: [...path, i],
      options,
      value,
    });
    if (options.bail) break;
  }

  if (errors.length === 0) return { valid: true, data: data as typeof es, errors: [] };
  return { valid: false, data: undefined, errors };
});

// Gotta assert here as this is an exception where we don't just return your average valit, but need to add the _readonly marker
// This is required as vality.object checks for this symbol to correctly check for readonly properties to be unset, not just of value undefined

// We still attach _validate, though, as (for whatever reason) this valit may still be called, and we really don't want a runtime error in that situation
vality.readonly = () =>
  ({
    [_readonly]: true,
    [_validate]: (value: any, path: Path) =>
      value === undefined
        ? { valid: true, data: undefined }
        : {
            valid: false,
            errors: [
              {
                message: "vality.readonly.base",
                path,
                options: {},
                value,
              },
            ],
          },
  } as unknown as ReadonlyValit<any>);
