import { Compound, compound } from "./compound";
import { _guard, _name, _type } from "./symbols";
import { getName } from "./typeUtils";
import {
  Eny,
  enyToGuard,
  enyToGuardFn, RSE
} from "./utils";
import { Error, mergeOptions } from "./validate";
import { v, vality } from "./vality";

declare global {
  namespace vality {
    interface compounds {
      array: <E extends Eny>(
        e: E
      ) => Compound<
        "array",
        E,
        {
          bail: boolean;
          minLength: number;
          maxLength: number;
        }
      >;
      tuple: <E extends Eny[]>(...es: E) => Compound<"tuple", E>;
      enum: <E extends Eny[]>(...es: E) => Compound<"enum", E>;
      object: <O extends RSE>(
        o: O
      ) => Compound<
        "object",
        O,
        {
          allowExtraProperties: boolean;
          bail: boolean;
        }
        >;
      // /*
      //  * Complex
      //  */
      // dict: <K extends OneOrEnumOfTOrGuard<string | number>, V extends Eny>(
      //   k: K,
      //   v: V
      // ) => Compound<"dict", [typeof k, typeof v]>;
      // and: <E extends OneOrEnumOfTOrGuard<RSE | RSE[]>[]>(
      //   ...es: E
      // ) => Compound<
      //   "and",
      //   typeof es,
      //   {
      //     transform: (
      //       val: Parse<Compound<"and", E>>
      //     ) => Parse<Compound<"and", E>>;
      //   }
      // >;
    }

    interface flags {
      optional: <E extends Eny>(
        e: E
      ) => Flagged<E, "optional", true>;
      from: <F extends string>(
        key: F
      ) => <E extends Eny>(e: E) => Flagged<E, "from", F>;
      readonly: <E extends Eny>(e: E) => Flagged<E, "readonly", true>;
    }
  }
}

vality.array = compound(
  "array",
  (e) => (value, options, context, path) => {
    const fn = enyToGuardFn(e);

    const { strict, bail } = mergeOptions(options, context);

    if (!Array.isArray(value)) {
      if (!strict) {
        // We accept single values in non-strict mode
        const res = fn(value, context, [...path, 0], [value]);
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

    const data: typeof e[] = [];
    const errors: Error[] = [];
    for (let k = 0; k < value.length; k++) {
      const res = fn(value[k], context, [...path, k], value);
      if (!res.valid) {
        errors.push(...res.errors);
        if (bail) break;
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

vality.object = compound("object", (o) => (value, options, context, path) => {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return {
      valid: false,
      data: undefined,
      errors: [{ message: "vality.object.base", path, options, value }],
    };

  const { bail, allowExtraProperties } = mergeOptions(options, context);

  const data: any = {};
  const errors: Error[] = [];

  // We iterate the passed object (the model) first
  for (let objectKey in o) {
    let valueKey: string = objectKey;
    const objectKeyEny: Eny = o[objectKey];

    // If the eny is a Valit and its name is readonly
    if (
      ((typeof objectKeyEny === "object" && objectKeyEny !== null) ||
        typeof objectKeyEny === "function") &&
      // @ts-expect-error Is ok since if it is undefined, then that's ok too
      getName(objectKeyEny) === "readonly"
    ) {
      // If the key is readonly, we don't expect it to be set
      continue; // We'll deal with these later
    }

    const objectKeyGuard = enyToGuard(objectKeyEny);
    // Also check for 'key[]' if 'key' is an array Valit
    // See 'vality.object > member type check > allows "key[]" as "key" if value is of type array'
    if (getName(objectKeyGuard) === "array") {
      // If 'key' is not set on the value, but 'key[]' is, we'll use that one to acquire the value
      if (
        // @ts-expect-error
        value[objectKey] === undefined &&
        // @ts-expect-error
        value[`${objectKey}[]`] !== undefined
      ) {
        valueKey = `${objectKey}[]`;
      }
    }

    if (objectKeyGuard[_name] === "from") {
      valueKey = objectKeyGuard[_guard][_type][0][_type];
    }

    const res = objectKeyGuard[_guard](
      // @ts-expect-error We can do this assertion here, since in the worst case, we'll get undefined, which is what we want too (=> e.g. "Expected string, received undefined")
      value[valueKey],
      context,
      [...path, valueKey],
      value
    );
    if (!res.valid) {
      errors.push(...res.errors);
      if (bail) break;
    } else {
      data[objectKey] = res.data;
    }
  }

  if (bail && errors.length) return { valid: false, data: undefined, errors };

  // And then check for excess keys
  if (!allowExtraProperties) {
    for (const k in value) {
      const ek = o[k];

      // If we get 'key[]', allow if 'key' is not set, but expected to be an array
      // Holy cow, this seems expensive
      // TODO: Optimize
      if (ek === undefined) {
        if (k.endsWith("[]")) {
          const k2 = k.slice(0, -2);
          // @ts-expect-error
          if (value[k2] === undefined && o[k2] !== undefined) {
            if (enyToGuard(o[k2])[_name] === "array") continue;
          }
        }
      }

      // If there is no eny for this key, or if it's readonly
      if (
        ek === undefined ||
        (((typeof ek === "object" && ek !== null) ||
          typeof ek === "function") &&
          // @ts-expect-error Is ok since if it is undefined, then that's ok too
          getName(ek) === "readonly")
      ) {
        errors.push({
          message: "vality.object.extraProperty",
          path: [...path, k],
          options,
          // @ts-expect-error If it is undefined, then we'll just take that
          value: value[k],
        });
        if (bail) break;
      }
    }
  }

  if (errors.length) return { valid: false, data: undefined, errors };
  return { valid: true, data, errors: [] };
});

v.from = (key: string) => flag("from", key);

vality.optional = compound(
  "optional",
  (e) => (val, options, context, path, parent) => {
    // Here, we must first check whether the eny allows undefined (as is the case with default values)
    // If it validates, all good. Else, we allow undefined, or else return the original error the eny had returned.
    const enyVal = enyToGuardFn(e)(val, context, path, parent);
    if (enyVal.valid) return enyVal;
    if (val === undefined) return { valid: true, data: undefined, errors: [] };

    const { strict } = mergeOptions(options, context);

    // Allow `null` in non-strict mode
    if (!strict && val === null)
      return { valid: true, data: undefined, errors: [] };
    return enyVal;
  }
);

// We still attach _validate, though, as (for whatever reason) this valit may still be called directly, and we really don't want a runtime error in that situation
// If we ever encounter 'vality.readonly.base' in tests, it means that we handle readonly keys incorrectly somewhere
vality.readonly = compound(
  "readonly",
  (e) => (val, _options, _context, path) => {
    if (val === undefined)
      return {
        valid: true,
        data: undefined as unknown as typeof e,
        errors: [],
      };
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
  }
);

vality.enum = compound(
  "enum",
  (...es) =>
    (value, options, context, path, parent) => {
      for (const e of es) {
        const res = enyToGuardFn(e)(value, context, path, parent);
        if (res.valid) return res;
      }
      return {
        valid: false,
        data: undefined,
        errors: [{ message: "vality.enum.base", path, options, value }],
      };
    }
);

vality.tuple = compound("tuple", (...es) => (value, options, context, path) => {
  if (!Array.isArray(value))
    return {
      valid: false,
      data: undefined,
      errors: [{ message: "vality.tuple.base", path, options, value }],
    };

  const { bail, allowExtraProperties } = mergeOptions(options, context);

  const data: any = [];
  const errors: Error[] = [];
  for (let i = 0; i < es.length; i++) {
    const res = enyToGuardFn(es[i])(value[i], context, [...path, i], value);
    if (!res.valid) {
      errors.push(...res.errors);
      if (bail) break;
    } else {
      data[i] = res.data;
    }
  }

  if (!allowExtraProperties) {
    for (let i = es.length; i < value.length; i++) {
      errors.push({
        message: "vality.tuple.extraProperty",
        path: [...path, i],
        options,
        value: value[i],
      });
      if (bail) break;
    }
  }

  if (errors.length) return { valid: false, data: undefined, errors };
  return { valid: true, data, errors: [] };
});


// // @ts-expect-error 'IntersectItems<RSE[]>' gives 'never'
// vality.and = compound(
//   "and",
//   (...es) =>
//     (value, options, context, path, parent) => {
//       if (typeof value !== "object" || value === null)
//         return {
//           valid: false,
//           data: undefined,
//           errors: [{ message: "vality.and.base", path, options, value }],
//         };

//       // @ts-expect-error
//       return intersect(es)(options)[_guard](
//         value,
//         context,
//         path,
//         parent
//       ) as ValidationResult<typeof es>;
//     }
// );

// vality.dict = compound("dict", (k, v) => (value, options, context, path) => {
//   if (typeof value !== "object" || value === null) {
//     return {
//       valid: false,
//       data: undefined,
//       errors: [{ message: "vality.dict.base", path, options, value }],
//     };
//   }

//   const { bail, allowExtraProperties } = mergeOptions(options, context);

//   // First, we resolve the key
//   const keyGuard = enyToGuard(k);
//   const simpleKeyGuard = simplifyEnumGuard(keyGuard);
//   const type = getRootType(simpleKeyGuard);

//   let literalKeys;
//   let typeKeys;

//   switch (type) {
//     case "string":
//     case "number":
//       literalKeys = [];
//       typeKeys = [simpleKeyGuard];
//       break;
//     case "literal":
//       literalKeys = [simpleKeyGuard];
//       typeKeys = [];
//       break;
//     case "enum":
//       [literalKeys, typeKeys] = simpleKeyGuard[_type].reduce(
//         // @ts-expect-error
//         (acc, key) => {
//           const guard = enyToGuard(key);
//           // No need to simplify here, as simplify flattens out nested enums
//           const type = getRootType(guard);
//           if (type === "literal") {
//             acc[0].push(guard);
//           } else {
//             acc[1].push(guard);
//           }
//           return acc;
//         },
//         [[], []]
//       );
//       break;
//     default:
//       throw new Error(
//         "vality.dict: Unexpected type of property: " + simpleKeyGuard[_name]
//       );
//   }

//   const errors: Error[] = [];

//   // First, make sure that all literal keys are set
//   const valueKeys = Object.keys(value);
//   const newProperties: [string, string | number][] = [];
//   for (const literalKey of literalKeys) {
//     let foundProperty: [string, string | number] | undefined;
//     for (const k of valueKeys) {
//       const res = literalKey[_guard](k, path, value, context);
//       if (res.valid) {
//         foundProperty = [k, res.data];
//         break;
//       }
//     }
//     if (foundProperty) {
//       newProperties.push(foundProperty);
//     } else {
//       if (
//         ((typeof v === "object" && v !== null) || typeof v === "function") &&
//         // @ts-expect-error Is ok since if it is undefined, then that's ok too
//         v[_name] !== "optional"
//       ) {
//         errors.push({
//           message: "vality.dict.missingProperty",
//           path,
//           options,
//           value: literalKey[_type][0][_type],
//         });
//         if (bail) break;
//       }
//     }
//   }

//   if (bail && errors.length) return { valid: false, data: undefined, errors };

//   // All remaining keys must be covered by our type keys
//   const remainingProperties = valueKeys.filter(
//     (k) => !newProperties.some((nk) => nk[0] === k)
//   );
//   for (const remainingKey of remainingProperties) {
//     /**
//      * @key Actual key in the object
//      * @value Key it will be mapped to
//      */
//     let newProperty: [string, string | number] | undefined;
//     for (const typeKey of typeKeys) {
//       const res = typeKey[_guard](remainingKey, path, value, context);
//       if (res.valid) {
//         newProperty = [remainingKey, res.data];
//         break;
//       }
//     }
//     if (newProperty) {
//       newProperties.push(newProperty);
//     } else {
//       if (!allowExtraProperties) {
//         errors.push({
//           message: "vality.dict.unexpectedProperty",
//           path,
//           options,
//           value: remainingKey,
//         });
//         if (bail) break;
//       }
//     }
//   }

//   if (bail && errors.length) return { valid: false, data: undefined, errors };

//   // Construct return object
//   const data: any = {};
//   const valueGuard = enyToGuard(v);
//   for (const [oldKey, newKey] of newProperties) {
//     const res = valueGuard[_guard](
//       // @ts-expect-error
//       value[oldKey],
//       context,
//       [...path, oldKey],
//       value
//     );
//     if (res.valid) {
//       data[newKey] = res.data;
//     } else {
//       errors.push(...res.errors);
//       if (bail) break;
//     }
//   }
//   if (errors.length) return { valid: false, data: undefined, errors };
//   return { valid: true, data, errors: [] };
// });
