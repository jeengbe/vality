---
sidebar_position: 3
title: Valits
---

While guards are used to check for atomic values, valits are used to match against structured data.

```ts twoslash
// @noErrors
import { vality } from "vality";

vality.array(vality.string); // Array of strings
vality.enum(vality.literal("a"), vality.literal("b"), vality.literal("c")); // Either "a", "b" or "c"
vality.object({
  name: vality.string,
  age: vality.number,
  address: vality.object({
    ...
  }),
});
```

<details>
  <summary>List of all built-in valits</summary>
  <div>

Valits are slightly more complicated than guards. They are defined in `vality.valits` as functions that accept enys (don't worry, these will be explained on the next page) in a specific format (tuples accept `Eny[]`, objects accept `Record<string, Eny>` etc.). The `Valit<E extends Eny, O extends Record<string, any>>` type denotes is returned and describes a valit with arguments `O`.

See [lib/valits.ts](https://github.com/jeengbe/vality/blob/master/src/lib/valits.ts#L8) for an up-to-date list of built-in valits.

We know it's not cool simply referring to the source code, but it really is the best way of ensuring an updated list. But check it out, it really contains all you need to know!

  </div>
</details>

## Arguments

Similarly to guards, valits can also accept arguments, which are passed by calling the valit after providing the eny(s).

```ts twoslash
import { vality } from "vality";
// ---cut---
vality.array(vality.string)({ minLength: 3 }); // Array of strings with at least 3 elements
vality.array(vality.string)({ minLength: 3, maxLength: 8 }); // Array of strings with at least 3 and at most 8 elements
```
