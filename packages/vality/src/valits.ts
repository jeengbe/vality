import { config } from "./config";
import { _name, _type, _validate } from "./symbols";
import {
  Eny,
  enyToGuard,
  enyToGuardFn,
  getRootType,
  OneOrEnumOfTOrFace,
  RSE,
  simplifyEnumGuard
} from "./utils";
import { Error, ValidationResult } from "./validate";
import { SpecialValit, valit, Valit } from "./valit";
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
        }
      >;
      tuple: <E extends Eny[]>(...es: E) => SpecialValit<"tuple", E>;
      optional: <E extends Eny>(e: E) => Valit<undefined | E>;
      enum: <E extends Eny[]>(...es: E) => Valit<E[number]>;
      object: <E extends RSE>(v: E) => Valit<E>;
      /**
       * This valit wraps the passed eny so that it is ignored by ParseIn
       */
      readonly: <E extends Eny>(e: E) => SpecialValit<"readonly", E>;
      // v.and() only accepts objects, enums of only objects or valits that resolve to objects (object/enum) and enums
      and: <E extends OneOrEnumOfTOrFace<RSE | Valit<RSE[], any>>[]>(
        ...es: E
      ) => SpecialValit<"and", E>;
      /**
       * Mapped object type
       */
      dict: <K extends OneOrEnumOfTOrFace<string | number>, V extends Eny>(
        k: K,
        v: V
      ) => SpecialValit<"dict", [K, V]>;
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
        ek?.[_name as keyof typeof ek] === "readonly"
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
          ek?.[_name as keyof typeof ek] === "readonly")
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
  }
);

vality.optional = valit("optional", (e) => (val, _options, path, parent) => {
  // Here, we must first check whether the eny allows undefined (as is the case with default values)
  // If it validates, all good. Else, we allow undefined, or else return the original error the eny had returned.
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

// @ts-ignore
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

// @ts-ignore
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
          // @ts-ignore
          const typeOfGuard = eGuard[_name] as string;
          let res = undefined as undefined | ValidationResult<any>;

          switch (typeOfGuard) {
            case "object": {
              const objectValue = {};
              // @ts-ignore
              for (const k in eGuard[_name][0]) {
                Object.assign(objectValue, {
                  [k]: value[k as keyof typeof value],
                });
              }

              res = eGuard[_validate](objectValue, path, parent);
              break;
            }
            case "enum":
              // @ts-ignore
              for (const e of eGuard[_name]) {
                const enumMemberGuardFn = enyToGuardFn(e);

                const enumMemberValue = {};
                // @ts-expect-error -- Undocumented
                for (const k in enumMemberGuardFn[_name][0]) {
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
              handleEs(eGuard[_validate][_name]);
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
  }
);

vality.dict = valit(
  "dict",
  (k, v) => (value, options, path) => {
    if (typeof value !== "object" || value === null) {
      return {
        valid: false,
        data: undefined,
        errors: [{ message: "vality.dict.base", path, options, value }],
      };
    }

    // First, we resolve the key
    const keyGuard = enyToGuard(k);
    const simpleKeyGuard = simplifyEnumGuard(keyGuard);
    const type = getRootType(simpleKeyGuard);

    let literalKeys;
    let typeKeys;

    switch (type) {
      case "string":
      case "number":
        literalKeys = [];
        typeKeys = [simpleKeyGuard];
        break;
      case "literal":
        literalKeys = [simpleKeyGuard];
        typeKeys = [];
        break;
      case "enum":
        // @ts-ignore
        [literalKeys, typeKeys] = simpleKeyGuard[_type].reduce(
          (acc, key) => {
            const guard = enyToGuard(key);
            // No need to simplify here, as simplify flattens out nested enums
            const type = getRootType(guard);
            if (type === "literal") {
              acc[0].push(guard);
            } else {
              acc[1].push(guard);
            }
            return acc;
          },
          [[], []]
        );
        break;
      default:
        // @ts-ignore
        throw new Error(
          "vality.dict: Unexpected type of property: " + simpleKeyGuard[_name]
        );
    }

    const errors: Error[] = [];

    // First, make sure that all literal keys are set
    const valueKeys = Object.keys(value);
    const newKeys: [string, string | number][] = [];
    for (const literalKey of literalKeys) {
      let foundKey: [string, string | number] | undefined;
      for (const k of valueKeys) {
        const res = literalKey[_validate](k, path, value);
        if (res.valid) {
          foundKey = [k, res.data];
          break;
        }
      }
      if (foundKey) {
        newKeys.push(foundKey);
      } else {
        errors.push({
          message: "vality.dict.missingProperty",
          path,
          options,
          value: literalKey[_type][0][_type],
        });
        if (options.bail) break;
      }
    }

    if (options.bail && errors.length)
      return { valid: false, data: undefined, errors };

    // All remaining keys must be covered by our type keys
    const remainingKeys = valueKeys.filter(
      (k) => !newKeys.some((nk) => nk[0] === k)
    );
    for (const remainingKey of remainingKeys) {
      let newKey: [string, string | number] | undefined;
      for (const typeKey of typeKeys) {
        const res = typeKey[_validate](remainingKey, path, value);
        if (res.valid) {
          newKey = [remainingKey, res.data];
          break;
        }
      }
      if (newKey) {
        newKeys.push(newKey);
      } else {
        errors.push({
          message: "vality.dict.unexpectedProperty",
          path,
          options,
          value: remainingKey,
        });
        if (options.bail) break;
      }
    }

    if (options.bail && errors.length)
      return { valid: false, data: undefined, errors };

    // Construct return object
    const data = {} as [typeof k, typeof v];
    const valueGuard = enyToGuard(v);
    for (const [oldKey, newKey] of newKeys) {
      // @ts-ignore
      const res = valueGuard[_validate](
        value[oldKey],
        [...path, oldKey],
        value
      );
      if (res.valid) {
        // @ts-ignore
        data[newKey] = res.data;
      } else {
        errors.push(...res.errors);
        if (options.bail) break;
      }
    }
    if (errors.length) return { valid: false, data: undefined, errors };
    return { valid: true, data, errors: [] };
  },
  {},
  {
  }
);
