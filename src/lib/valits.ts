import { config } from "./config";
import { Guard } from "./guard";
import { _name, _type, _validate } from "./symbols";
import {
  Eny,
  enyToGuard,
  enyToGuardFn,
  OneOrEnumOfTOrFace,
  RSE
} from "./utils";
import { Error, ValidationResult } from "./validate";
import { valit, Valit } from "./valit";
import { vality } from "./vality";

declare global {
  namespace vality {
    interface valits {
      array: <E extends Eny>(
        e: E
      ) => Valit<
        "array",
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
        "tuple",
        E,
        {
          /**
           * @default false
           */
          bail: boolean;
        }
      >;
      optional: <E extends Eny>(e: E) => Valit<"optional", undefined | E>;
      enum: <E extends Eny[]>(...es: E) => Valit<"enum", E[number]>;
      object: <E extends RSE>(
        v: E
      ) => Valit<
        "object",
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
      readonly: <E extends Eny>(e: E) => Valit<"readonly", E>;
      // v.and() only accepts objects, enums of only objects or valits that resolve to objects (object/enum) and enums
      and: <E extends OneOrEnumOfTOrFace<RSE | Valit<"and", RSE[], any>>[]>(
        ...es: E
      ) => Valit<
        "and",
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
      dict: <K extends OneOrEnumOfTOrFace<string | number>, V extends Eny>(
        k: K,
        v: V
      ) => Valit<
        "dict",
        [K, V],
        {
          /**
           * Whether to stop validating after the first error
           *
           * @default false
           */
          bail: boolean;
        }
      >;
    }
  }
}

vality.array = valit(
  "array",
  (e) => (value, options, path) => {
    const fn = enyToGuardFn(e);
    if (!Array.isArray(value)) {
      if (!config.strict) {
        const res = fn(value, [...path, 0], value);
        if (res.valid) {
          return { valid: true, data: [res.data], errors: [] };
        }
      }
      return {
        valid: false,
        data: undefined,
        errors: [{ message: "vality.array.base", path, options, value }],
      };
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
  (e) => (value, options, path) => {
    if (typeof value !== "object" || value === null)
      return {
        valid: false,
        data: undefined,
        errors: [{ message: "vality.object.base", path, options, value }],
      };
    const data = {} as typeof e;
    const errors: Error[] = [];
    // We iterate the passed object (the model) first
    for (const k in e) {
      const ek = e[k] as Eny;
      if (
        typeof ek === "function" &&
        ek?.[_type as keyof typeof ek] === "readonly"
      )
        continue; // We'll deal with these later
      // We can do this assertion here, since in the worst case, we'll get undefined, which is what we want to
      const res = enyToGuardFn(ek)(
        value[k as keyof typeof value],
        [...path, k],
        value
      );
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
      if (
        ek === undefined ||
        (typeof ek === "function" &&
          ek?.[_type as keyof typeof ek] === "readonly")
      ) {
        errors.push({
          message: "vality.object.extraProperty",
          path: [...path, k],
          options,
          value: value[k as keyof typeof value],
        });
        if (options.bail) break;
      }
    }
    if (errors.length === 0)
      return { valid: true, data: data as typeof e, errors: [] };
    return { valid: false, data: undefined, errors };
  },
  {},
  {
    bail: false,
  }
);

vality.optional = valit("optional", (e) => (val, _options, path, parent) => {
  // Here, we must first check whether the eny allows undefined (as is the case with default values)
  // If it validates, all good. Elsewise, we allow undefined, or else return the original error the eny had returned.
  const enyVal = enyToGuardFn(e)(val, path, parent);
  if (enyVal.valid) return enyVal;
  if (val === undefined) return { valid: true, data: undefined, errors: [] };
  if (!config.strict && val === null)
    return { valid: true, data: undefined, errors: [] };
  return enyVal;
});

vality.enum = valit("enum", (...es) => (value, options, path, parent) => {
  for (const e of es) {
    const res = enyToGuardFn(e)(value, path, parent);
    if (res.valid) return res;
  }
  return {
    valid: false,
    data: undefined,
    errors: [{ message: "vality.enum.base", path, options, value }],
  };
});

vality.tuple = valit(
  "tuple",
  (...es) =>
    (value, options, path) => {
      if (!Array.isArray(value))
        return {
          valid: false,
          data: undefined,
          errors: [{ message: "vality.tuple.base", path, options, value }],
        };
      const data = [] as unknown as typeof es;
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
vality.readonly = valit("readonly", (e) => (val, _options, path) => {
  if (val === undefined)
    return { valid: true, data: undefined as unknown as typeof e, errors: [] };
  return {
    valid: false,
    data: undefined,
    errors: [
      {
        message: "vality.readonly.base",
        path,
        options: {},
        value: val,
      },
    ],
  };
});

vality.and = valit(
  "and",
  (...es) =>
    (value, options, path, parent) => {
      if (typeof value !== "object" || value === null)
        return {
          valid: false,
          data: undefined,
          errors: [{ message: "vality.and.base", path, options, value }],
        };

      const data = {} as typeof es;
      const errors: Error[] = [];

      const handleEs = (ess: typeof es) => {
        for (let i = 0; i < ess.length; i++) {
          const eGuard = enyToGuard(ess[i]);
          const typeOfGuard = eGuard[_name] as string;
          let res = undefined as undefined | ValidationResult<any>;

          switch (typeOfGuard) {
            case "object": {
              const objectValue = {};
              // @ts-expect-error -- Undocumented type
              for (const k in eGuard[_validate][_type][0]) {
                Object.assign(objectValue, {
                  [k]: value[k as keyof typeof value],
                });
              }

              res = eGuard[_validate](objectValue, path, parent);
              break;
            }
            case "enum":
              // @ts-expect-error -- Again, undocumented type. We make sure that this access is sound with unit tests
              for (const e of eGuard[_validate][_type]) {
                const enumMemberGuardFn = enyToGuardFn(e);

                const enumMemberValue = {};
                // @ts-expect-error -- Again
                for (const k in enumMemberGuardFn[_type][0]) {
                  Object.assign(enumMemberValue, {
                    [k]: value[k as keyof typeof value],
                  });
                }

                res = enumMemberGuardFn(enumMemberValue, path, parent);
                if (res.valid) break;
              }
              if (!res)
                res = {
                  valid: false,
                  data: undefined,
                  errors: [
                    { message: "vality.enum.base", path, options, value },
                  ],
                };
              break;
            case "and":
              // @ts-expect-error -- This should look familiar by now
              handleEs(eGuard[_validate][_type]);
              break;
            default:
              throw new Error(
                "vality.and: Unexpected type of guard: " + typeOfGuard
              );
          }

          if (!res) continue;
          if (!res.valid) {
            errors.push(...res.errors);
            if (options.bail) break;
          } else {
            Object.assign(data, res.data);
          }
        }
      };

      handleEs(es);

      if (errors.length !== 0) return { valid: false, data: undefined, errors };

      const gotKeys = Object.keys(data).length;
      const expectedKeys = Object.keys(value).length;
      if (gotKeys < expectedKeys) {
        return {
          valid: false,
          data: undefined,
          errors: [
            { message: "vality.and.extraProperties", path, options, value },
          ],
        };
      } else if (gotKeys > expectedKeys) {
        throw new Error("This can't happen");
      }

      return { valid: true, data, errors: [] };
    },
  {},
  {
    bail: false,
  }
);

vality.dict = valit(
  "dict",
  (k, v) => (value, options, path, parent) => {
    if (typeof value !== "object" || value === null)
      return {
        valid: false,
        data: undefined,
        errors: [{ message: "vality.dict.base", path, options, value }],
      };

    const keyGuard = enyToGuard(k) as unknown as
      | Guard<any, string | number>
      | Valit<any, string | number>;
    const typeOfKey = keyGuard[_name];

    // If we only pass a single value, we pretend we've got an enum with only that value to prevent duplicate code
    if (
      typeOfKey === "literal" ||
      typeOfKey === "string" ||
      typeOfKey === "number"
    ) {
      // No need to pass options as they're already applied to this instance
      // (Possibility to optimise here)
      return vality
        .dict(
          vality.enum(keyGuard), // This asserion is ok because we've already established that we're dealing with these types or literal versions
          v
        )(options as { bail: boolean })
        [_validate](value, path, parent);
    }

    // @ts-expect-error -- [_type] is not documented
    const keysGuards = keyGuard[_validate][_type].map(enyToGuard);

    // These are the keys that must be set
    const literalKeys = keysGuards.filter(
      (g: { [_name]: string }) => g[_name] === "literal"
    );

    // First we we make sure that all keys are valid
    const errors: Error[] = [];
    for (const key in value) {
      if (!keyGuard[_validate](key, [...path, key], value).valid) {
        errors.push({
          message: "vality.dict.invalidProperty",
          path: [...path, key],
          options,
          value: key,
        });
        if (options.bail) break;
      }
    }
    if (errors.length) return { valid: false, data: undefined, errors };

    // Then we make sure that all required (literal) keys are set
    for (const literalKeyGuard of literalKeys) {
      if (
        !Object.keys(value).some(
          (k) => literalKeyGuard[_validate](k, [...path, k], value).valid
        )
      ) {
        if (!literalKeyGuard[_validate](k, path, value).valid) {
          errors.push({
            message: "vality.dict.missingProperty",
            path: [
              ...path,
              (
                literalKeyGuard[_validate] as unknown as {
                  [_type]: { [_type]: string }[];
                }
              )[_type][0][_type],
            ],
            options,
            value: undefined,
          });
          if (options.bail) break;
        }
      }
    }
    if (errors.length) return { valid: false, data: undefined, errors };

    // And lastly, we make sure that all values are valid
    const valueGuardFn = enyToGuardFn(v);
    // We cheat with the type here, which is why its easiest to just say this is RSA
    const data = {} as any;
    for (const key in value) {
      const res = valueGuardFn(
        value[key as keyof typeof value],
        [...path, key],
        value
      );
      if (!res.valid) {
        errors.push(...res.errors);
        if (options.bail) break;
      } else {
        data[key as keyof typeof value] = res.data;
      }
    }
    if (errors.length) return { valid: false, data: undefined, errors };
    return { valid: true, data, errors: [] };
  },
  {},
  {
    bail: false,
  }
);
