---
sidebar_position: 3
title: Enys
---

Enys are the core of Vality. Everything that Vality can use to validate aginst is an eny.

In addition to guards and valits, there are some enys that come as "short hands" for certain guards and valits, which will be explained on this page:

```ts twoslash
// @noErrors
import { vality } from "vality";

[vality.string] // Array of strings
7; // The literal value 7
["a", "b", "c"] // Either "a", "b", "c"
{
  name: vality.string,
  age: vality.number,
  address: {
    ...
  }
}
```

## Available enys

Unlike guards and valits, enys are best explained here.

:::note
Valits and guards are enys, too.
:::

### Object

This is arguably the most important, but also the simplest eny. It is used to match against objects, and that's exactly how it's written.

```ts twoslash
// @noErrors
import { vality } from "vality";
// ---cut---
{
  name: vality.string,
  age: vality.number,
  address: {
    street: vality.string,
    city: vality.string,
    country: vality.string,
  },
};
// is short for
vality.object({
  name: vality.string,
  age: vality.number,
  address: vality.object({
    street: vality.string,
    city: vality.string,
    country: vality.string,
  }),
});
```

### Array

An array with one eny `E` is considered an array of `E` (is thus typed appropriately as `E[]`).

```ts twoslash
import { vality } from "vality";
// ---cut---
[vality.string];
// is short for
vality.array(vality.string);
// and matches against arrays of strings
```

### Enum

Arrays with more than one eny in turn, are treated as an enum of the passed enys (matching any of the passed).

```ts twoslash
// @noErrors
import { vality } from "vality";
// ---cut---
["a", "b", "c"];
// is short for
vality.enum(vality.literal("a"), vality.literal("b"), vality.literal("c"));
// and matches against either "a", "b" or "c"
```

:::info
Empty arrays are not valid enys.
:::

### Literal

Literal values are short for `vality.literal(value)` and only match against the given value.

```ts twoslash
import { vality } from "vality";
// ---cut---
"a";
// is short for
vality.literal("a");
// and matches against "a" only
```

:::tip
`vality.literal(value)` also accepts `null` and can therefore test for null.
:::

## Composability

Enys (and valits) are build in a composable way, meaning you can nest enys arbitrarily deeply.

```ts twoslash
import { vality, Parse } from "vality";

const NeedAGoodExample = () =>
  ({
    a: [["a", "b", "c"]], // Resolves to vality.array(vality.enum("a", "b", "c"))
    b: {
      c: vality.array(vality.number({ min: 5 }))({ maxLength: 10 }), // An array of at most 10 numbers that are greater than or equal to 5
    },
  } as const);

type StillNeedOne = Parse<typeof NeedAGoodExample>;
//   ^?
```

Another good example is the following:

```ts twoslash
import { vality, Parse } from "vality";

const Cart = () =>
  ({
    voucher: [
      {
        type: "percentage",
        value: vality.number({ min: 0, max: 100 }),
      },
      {
        type: "fixed",
        value: vality.number({ min: 0 }),
      },
    ],
  } as const);

type Cart = Parse<typeof Cart>;
//   ^?
```
