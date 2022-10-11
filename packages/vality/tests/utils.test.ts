import { Parse, vality } from "vality";
import { enyToGuard } from "vality/utils";

const a1 = ["a", vality.enum("b", ["c", ["d", vality.literal("e")]] as const)] as const;
const a2 = enyToGuard(["a", vality.enum("b", ["c", ["d", vality.literal("e")]] as const)] as const);
type a1 = Parse<typeof a1>;
//   ^?
type a2 = Parse<typeof a2>;
//   ^?

const b1 = [[vality.literal("a"), ["b"]]] as const;
const b2 = enyToGuard([[vality.literal("a"), ["b"]]] as const);
type b1 = Parse<typeof b1>;
//   ^?
type b2 = Parse<typeof b2>;
//   ^?

const c1 = { a: "a", b: vality.enum("b", ["c", ["d", vality.literal("e")]] as const) } as const;
const c2 = enyToGuard({ a: "a", b: vality.enum("b", ["c", ["d", vality.literal("e")]] as const) } as const);
type c1 = Parse<typeof c1>;
//   ^?
type c2 = Parse<typeof c2>;
//   ^?

const d1 = ["H", ["A"]] as const;
const d2 = enyToGuard(["H", ["A"]] as const);
type d1 = Parse<typeof d1>;
//   ^?
type d2 = Parse<typeof d2>;
//   ^?

it("true", () => {
  expect(true).toBe(true);
});
