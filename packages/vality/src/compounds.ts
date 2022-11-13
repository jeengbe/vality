import { Compound, compound } from "./compound";
import { Parse } from "./parse";
import { _guard, _type } from "./symbols";
import { getName, intersect, simplifyEnum } from "./typeUtils";
import {
  Eny,
  enyToGuard,
  enyToGuardFn,
  getFlags,
  OneOrEnumOfTOrGuard,
  RSE
} from "./utils";
import { Error, mergeOptions } from "./validate";
import { vality } from "./vality";

declare global {
  namespace vality {
    interface compounds {
      array: <E extends Eny>(
        e: E
      ) => Compound<
        "array",
        E[],
        {
          minLength: number;
          maxLength: number;
        }
      >;
      tuple: <E extends Eny[]>(...es: E) => Compound<"tuple", E>;
      object: <O extends RSE>(
        o: O
      ) => Compound<
        "object",
        O,
        {
          allowExtraProperties: boolean;
        }
      >;
      dict: <K extends OneOrEnumOfTOrGuard<string | number>, V extends Eny>(
        k: K,
        v: V
      ) => Compound<
        "dict",
        [typeof k, typeof v],
        {
          allowExtraProperties: boolean;
        }
      >;
      enum: <E extends Eny[]>(...es: E) => Compound<"enum", E[number]>;
      and: <E extends OneOrEnumOfTOrGuard<RSE | RSE[]>[]>(
        ...es: E
      ) => Compound<
        "and",
        typeof es,
        {
          transform: (
            val: Parse<Compound<"and", E>>
          ) => Parse<Compound<"and", E>>;
        }
      >;
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

vality.tuple = compound("tuple", (...es) => (value, options, context, path) => {
  if (!Array.isArray(value))
    return {
      valid: false,
      data: undefined,
      errors: [{ message: "vality.tuple.base", path, options, value }],
    };

  const { bail } = mergeOptions(options, context);

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

  if (errors.length) return { valid: false, data: undefined, errors };
  return { valid: true, data, errors: [] };
});

vality.object = compound(
  "object",
  (o) => (value, options, context, path, flags) => {
    if (typeof value !== "object" || value === null || Array.isArray(value))
      return {
        valid: false,
        data: undefined,
        errors: [{ message: "vality.object.base", path, options, value }],
      };

    const { strict, bail, allowExtraProperties } = mergeOptions(
      options,
      context
    );

    const data: any = {};
    const errors: Error[] = [];

    // We iterate the passed object (the model) first
    for (const objectKey in o) {
      let valueKey: string = objectKey;
      const objectKeyEny: Eny = o[objectKey];

      if (getFlags(objectKeyEny).has("readonly")) {
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

      if (getFlags(objectKeyEny).has("from")) {
        valueKey = getFlags(objectKeyEny).get("from") as string;
        // @ts-expect-error Expected since we want to check if it's there
        if (value[valueKey] === undefined) {
          if (!strict) {
            valueKey = objectKey;
          }
        }
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
      for (const valueKey in value) {
        const optionsValueEny = o[valueKey];

        // If we get 'key[]', allow if 'key' is not set, but expected to be an array
        // Holy cow, this seems expensive
        // TODO: Optimize
        if (optionsValueEny === undefined) {
          if (valueKey.endsWith("[]")) {
            const valueKeySliced = valueKey.slice(0, -2);
            if (
              // @ts-expect-error
              value[valueKeySliced] === undefined &&
              o[valueKeySliced] !== undefined
            ) {
              if (getName(o[valueKeySliced]) === "array") continue;
            }
          }
        }

        // If there is no eny for this key, or if it's readonly
        if (
          optionsValueEny === undefined ||
          getFlags(optionsValueEny).has("readonly")
        ) {
          errors.push({
            message: "vality.object.extraProperty",
            path: [...path, valueKey],
            options,
            // @ts-expect-error If it is undefined, then we'll just take that
            value: value[valueKey],
          });
          if (bail) break;
        }
      }
    }

    if (errors.length) return { valid: false, data: undefined, errors };
    return { valid: true, data, errors: [] };
  }
);

vality.dict = compound("dict", (k, v) => (value, options, context, path) => {
  if (typeof value !== "object" || value === null) {
    return {
      valid: false,
      data: undefined,
      errors: [{ message: "vality.dict.base", path, options, value }],
    };
  }

  if (getFlags(v).has("readonly")) {
    // If the key is readonly, we don't expect it to be set
    return { valid: true, data: undefined, errors: [] };
  }

  const { bail, allowExtraProperties } = mergeOptions(options, context);

  // First, we resolve the key
  const type = getName(k);

  let literalKeys: any[];
  let typeKeys: any[];

  switch (type) {
    case "literal":
      literalKeys = [k];
      typeKeys = [];
      break;
    case "enum":
      // @ts-expect-error
      const simpleKeyGuard = simplifyEnum(k[_type]);

      [literalKeys, typeKeys] = simpleKeyGuard.reduce(
        (acc, key) => {
          const guard = enyToGuard(key);
          // No need to simplify here, as simplify flattens out nested enums
          const type = getName(guard);
          if (type === "literal") {
            // @ts-expect-error
            acc[0].push(guard);
          } else {
            // @ts-expect-error
            acc[1].push(guard);
          }
          return acc;
        },
        [[], []]
      );
      break;
    default:
      literalKeys = [];
      typeKeys = [k];
      break;
  }

  const valueGuard = enyToGuard(v);

  // We check all literal keys first
  const data: any = {};
  const errors: Error[] = [];

  const seenKeys = new Set();

  for (const literal of literalKeys) {
    const literalGuard = enyToGuard(literal);
    const literalValue = literalGuard[_type][0][_type];

    const res = valueGuard[_guard](
      // @ts-expect-error
      value[literalValue],
      context,
      [...path, literalValue],
      value
    );

    if (!res.valid) {
      errors.push(...res.errors);
      if (bail) break;
    } else {
      seenKeys.add(literalValue);
      data[literalValue] = res.data;
    }
  }

  if (bail && errors.length) return { valid: false, data: undefined, errors };

  // Check remaining properties to fulfil type key requirements
  // Because of potential key remapping, we can't already !allowExtraProperties and skip this step entirely here :(
  for (const valueKey in value) {
    if (seenKeys.has(valueKey)) continue;

    let remappedKey;

    for (const typeKey of typeKeys) {
      const res = typeKey[_guard](
        valueKey,
        context,
        [...path, valueKey],
        value
      );

      if (res.valid) {
        remappedKey = res.data;
        break;
      }
    }

    if (remappedKey === undefined) {
      if (!allowExtraProperties) {
        errors.push({
          message: "vality.dict.extraProperty",
          path: [...path, valueKey],
          options,
          // @ts-expect-error
          value: value[valueKey],
        });
        if (bail) break;
      }
    } else {
      const res = valueGuard[_guard](
        // @ts-expect-error
        value[valueKey],
        context,
        [...path, valueKey],
        value
      );

      if (!res.valid) {
        errors.push(...res.errors);
        if (bail) break;
      } else {
        data[remappedKey] = res.data;
      }
    }
  }

  if (errors.length) return { valid: false, data: undefined, errors };
  return { valid: true, data, errors: [] };
});

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

// @ts-expect-error 'IntersectItems<RSE[]>' gives 'never'
vality.and = compound(
  "and",
  (...es) =>
    (value, options, context, path, parent) => {
      if (typeof value !== "object" || value === null)
        return {
          valid: false,
          data: undefined,
          errors: [{ message: "vality.and.base", path, options, value }],
        };

      const { bail } = mergeOptions(options, context);

      const data: any = {};
      const errors: Error[] = [];

      for (const e of intersect(es)) {
        const res = enyToGuardFn(e)(value, context, path, parent);
        if (!res.valid) {
          errors.push(...res.errors);
          if (bail) break;
        } else {
          Object.assign(data, res.data);
        }
      }

      if (errors.length) return { valid: false, data: undefined, errors };
      return { valid: true, data, errors: [] };
    }
);
