import { flag, Flagged } from "./flag";
import { Eny, enyToGuardFn } from "./utils";
import { mergeOptions } from "./validate";
import { vality } from "./vality";

declare global {
  namespace vality {
    interface flags {
      optional: <E extends Eny>(e: E) => Flagged<E, "optional", true>;
      from: <F extends string>(
        key: F
      ) => <E extends Eny>(e: E) => Flagged<E, "from", F>;
      readonly: <E extends Eny>(e: E) => Flagged<E, "readonly", true>;
    }
  }
}

vality.from = (key) =>
  flag(
    "from",
    key,
    (e) => (val, _options, context, path, parent) =>
      enyToGuardFn(e)(val, context, path, parent)
  );

vality.optional = flag(
  "optional",
  true,
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

// We still provide an implementation as a flagged Guard may still be called directly, and we also want to handle those cases
// If we ever encounter 'vality.readonly.base' in tests, it means that we handle readonly keys incorrectly somewhere
vality.readonly = flag(
  "readonly",
  true,
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
