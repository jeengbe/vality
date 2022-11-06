import { Parse } from "parse";
import { Valit } from "valit";
import { OneOrEnumOfTOrFace, RSE } from "./utils";

export function intersectObjects<Obj extends OneOrEnumOfTOrFace<RSE | RSE[]>[]>(
  obj: Obj
): Valit<"object", Parse<Valit<"and", Obj>>> {

}
