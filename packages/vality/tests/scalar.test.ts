import { expectType } from "ts-expect";
import { vality } from "vality";
import { extendScalar, Scalar } from "vality/scalar";
import { types } from "vality/types";
import { testScalar } from "./scalars.test";

type UUID = string & { __uuid: true };
declare global {
  namespace vality {
    interface scalars {
      uuid: Scalar<"uuid", UUID>;
    }
  }
}
test("extendScalar()", () => {
  const uuidRegex = /meh/;

  vality.uuid = extendScalar(vality.string)("uuid", (x) => {
    expectType<string>(x);

    if (!uuidRegex.test(x)) return undefined;
    return x as UUID;
  });

  expect(types.get("uuid")).toBe("string");
  testScalar("uuid", vality.uuid, {
    valid: [{ value: "meh" }],
    invalid: [{ value: "foo" }],
  });
});
