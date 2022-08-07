---
sidebar_position: 1
title: Guards
---

Guards are the most basic way to match against an atomic value (string, number, or more specifically emails or telephone numbers). These include built-in Guards (e.g. `vality.string`, `vality.boolean`), but can be easily [extended](../extend/guards.md) to check for more specific types such as valid addresses or bank details.

```ts twoslash
import { vality } from "vality";

vality.string;
//     ^?
```

<details>
  <summary>List of all built-in Guards</summary>
  <div>

The generic type `Guard<T, O extends Record<string, any>>` denotes a Guard that matches against a value of type `T` and accepts arguments in `O`. All available Guards lay in the global interface `vality.guards`.


See [lib/guards.ts](https://github.com/jeengbe/vality/blob/master/src/lib/guards.ts#L7) for an up-to-date list of built-in Guards.

We know it's not cool simply referring to the source code, but it really is the best way of ensuring an updated list. But check it out, it really contains all you need to know!

---

Nevertheless, `vality.literal` and `vality.realtion` require some further explanation:<br />
These are not directly defined as Guards, but rather Guard factories, as they each accept arguments.
For example, the literal `vality.literal("a")` returns a Guard that is tailored to the literal string `"a"`.

  </div>
</details>

## Arguments

Guards also accept arguments to further constrain the type of the value they match against. These are passed by calling the Guard with the arguments as parameter.

```ts twoslash
import { vality } from "vality";
// ---cut---
vality.string({ minLength: 3 }); // String with at least 3 characters
vality.string({ minLength: 3, maxLength: 8 }); // String with at least 3 and at most 8 characters
// @noErrors
vality.number({ m }); // We even get autocomplete here!
//               ^|
```
