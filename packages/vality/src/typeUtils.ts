import { Face } from "validate";
import { Guard } from "./guard";
import { _type } from "./symbols";
import { Eny, enyToGuard, RSA } from "./utils";
import { Valit } from "./valit";
import { vality } from "./vality";

export function intersect(
  ...obj: Eny[]
): Valit<"object", RSA> | Guard<"never", never> {
  if (!obj.length) return vality.never;

  const [firstFace, ...faces] = obj.map(enyToGuard);
  const commonKeys = Object.keys(firstFace[_type]).filter((k) =>
    faces.every((f) => k in f[_type])
  );

  if (!commonKeys.length) return vality.object({});

  const commonTypes: RSA = {};

  for (const k of commonKeys) {
    commonTypes[k] = intersect(
      firstFace[_type][k],
      ...faces.map((f) => f[_type][k])
    );

    // If two types are incompatible, the intersection is never and we can exit early
    if (commonTypes[k] === vality.never) return vality.never;
  }

  return vality.object(commonTypes);
}

function intersectWorker(aE: Eny, bE: Eny) {
  const a = enyToGuard(aE);
  const b = enyToGuard(bE);

  // T ∩ ∅ = ∅
  // ∅ ∩ T = ∅
  if (a[_type] === "never" || b[_type] === "never") return vality.never;

  // T ∩ T = T
  if (typesAreSame(a, b)) return a;



}

function typesAreSame(a: Face<any, any, any>, b: Face<any, any, any>) {
  if (a === b) return true;
  if (a[_type] !== b[_type]) return false;
  switch (a[_type]) {
    case "and": {

    }
  }
}
