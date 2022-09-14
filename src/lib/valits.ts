import { config } from "./config";
import { _readonly, _specialValit, _type, _validate } from "./symbols";
import { Eny, enyToGuardFn, RSE } from "./utils";
import { Error, Face, Path } from "./validate";
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
          minLength: number;
          maxLength: number;
          /**
           * Whether to stop validating after the first error
           *
           * @default false
           */
          bail: boolean;
        }
      >;
      tuple: <E extends Eny[]>(
        ...es: E
      ) => Valit<
        E & {
          [_specialValit]: "tuple";
        },
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
           * Whether to stop validating after the first error
           *
           * @default false
           */
          bail: boolean;
        }
      >;
      /**
       * This valit wraps the passed eny so that it is ignored by ParseIn
       */
      readonly: <E extends Eny>(e: E) => ReadonlyValit<E>;
      // v.and() only accepts objects, enums of only objects or valits that resolve to objects (object/enum) and enums
      and: <E extends (RSE | [RSE, RSE, ...RSE[]] | Face<RSE, true>)[]>(...es: E) => Valit<E & {
        [_specialValit]: "and";
      }>;
    }
  }
}

vality.array = valit(
  "array",
  e => (value, options, path) => {
    const fn = enyToGuardFn(e);
    if (!Array.isArray(value)) {
      if (!config.strict) {
        const res = fn(value, [...path, 0], value);
        if (res.valid) {
          return { valid: true, data: [res.data], errors: [] };
        }
      }
      return { valid: false, data: undefined, errors: [{ message: "vality.array.base", path, options, value }] };
    }
    const data: any[] = [];
    const errors: Error[] = [];
    for (let k = 0; k < value.length; k++) {
      // We can do this assertion here, since in the worst case, we'll get undefined, which is what we want
      const res = fn(value[k], [...path, k], value);
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
  },
  {
    bail: false,
  }
);

vality.object = valit(
  "object",
  e => (value, options, path) => {
    if (typeof value !== "object" || value === null)
      return { valid: false, data: undefined, errors: [{ message: "vality.object.base", path, options, value }] };
    const data = {} as typeof e;
    const errors: Error[] = [];
    // We iterate the passed object (the model) first
    for (const k in e) {
      const ek = e[k] as Eny;
      if (typeof ek === "object" && ek !== null && _readonly in ek) continue; // We'll deal with these later
      // We can do this assertion here, since in the worst case, we'll get undefined, which is what we want to
      const res = enyToGuardFn(ek)(value[k as keyof typeof value], [...path, k], value);
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
          value: value[k as keyof typeof value],
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

vality.optional = valit("optional", e => (val, _options, path, parent) => {
  // Here, we must first check whether the eny allows undefined (as is the case with default values)
  // If it validates, all good. Elsewise, we allow undefined, or else return the original error the eny had returned.
  const enyVal = enyToGuardFn(e)(val, path, parent);
  if (enyVal.valid) return enyVal;
  if (val === undefined) return { valid: true, data: undefined, errors: [] };
  if (!config.strict && val === null) return { valid: true, data: undefined, errors: [] };
  return enyVal;
});

vality.enum = valit("enum", (...es) => (value, options, path, parent) => {
  for (const e of es) {
    const res = enyToGuardFn(e)(value, path, parent);
    if (res.valid) return res;
  }
  return { valid: false, data: undefined, errors: [{ message: "vality.enum.base", path, options, value }] };
});

vality.tuple = valit(
  "tuple",
  (...es) =>
    (value, options, path) => {
      if (!Array.isArray(value)) return { valid: false, data: undefined, errors: [{ message: "vality.tuple.base", path, options, value }] };
      const data = [] as unknown as typeof es & { [_specialValit]: "tuple"; };
      const errors: Error[] = [];
      for (let i = 0; i < es.length; i++) {
        const res = enyToGuardFn(es[i])(value[i], [...path, i], value);
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
          value: value[i],
        });
        if (options.bail) break;
      }

      if (errors.length === 0) return { valid: true, data, errors: [] };
      return { valid: false, data: undefined, errors };
    },
  {},
  {
    bail: false,
  }
);

// Gotta assert here as this is an exception where we don't just return your average valit, but need to add the _readonly marker
// This is required as vality.object checks for this symbol to correctly check for readonly properties to be unset, not just of value undefined

// We still attach _validate, though, as (for whatever reason) this valit may still be called directly, and we really don't want a runtime error in that situation
vality.readonly = () =>
({
  [_readonly]: true,
  [_type]: undefined, // For consistency
  [_validate]: (value: any, path: Path) =>
    value === undefined
      ? { valid: true, data: undefined, errors: [] }
      : {
        valid: false,
        data: undefined,
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
