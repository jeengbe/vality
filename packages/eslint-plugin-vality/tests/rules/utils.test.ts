import { permute } from "./utils";

test("permute", () => {
  expect(permute`foo`).toEqual(["foo"]);
  expect(permute`foo ${[0, 1]}`).toEqual(["foo 0", "foo 1"]);

  expect(permute`[${[0, 1]}, ${[0, 1]}]`).toEqual([
    "[0, 0]",
    "[0, 1]",
    "[1, 0]",
    "[1, 1]",
  ]);
});
