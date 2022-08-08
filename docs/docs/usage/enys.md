---
sidebar_position: 3
title: Enys
---

Enys are the core of Vality. Everything that Vality can use to validate aginst is an Eny.

In addition to Guards and Valits, there are some Enys that come as "short hands" for certain Guards and Valits, which will be explained on this page:

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

## Available Enys

Unlike Guards and Valits, Enys are best explained here.

:::note
Valits and Guards are Enys, too.
:::

### Object

This is arguably the most important, but also the simplest Eny. It is used to match against objects, and that's exactly how it's written.

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

An array with one Eny `E` is considered an array of `E` (is thus typed appropriately as `E[]`).

```ts twoslash
import { vality } from "vality";
// ---cut---
[vality.string];
// is short for
vality.array(vality.string);
// and matches against arrays of strings
```

### Enum

Arrays with more than one Eny in turn, are treated as an enum of the passed Enys (matching any of the passed).

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
Empty arrays are not valid Enys.
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

:::info TIP
`vality.literal(value)` also accepts `null` and can therefore test for null.
:::

### Relation

When another Model is used as an Eny, it is treated as a relation to that model. Specifically, this means that you can model recursive (and self-referential) structures.

```ts twoslash
import { vality, Parse } from "vality";
// ---cut---
const Person = () =>
  ({
    name: vality.string,
    pets: [Pet],
  } as const);

const Pet = () => ({
  owner: Person,
});

type Person = Parse<typeof Person>;
//   ^?
```

:::info
Here, a distinction is made between "ingoing" and "outgoing" schema relations. When data comes _from_ an api/database, it is said to be "outgoing", and that is when relations are recursively expanded. "Ingoing" data in turn, requires relations to be defined in a specific way (`string` for ArangoDB, `number` for SQL, `{ id: number }` for Directus etc.). This difference is accounted for in specific implementations for each "direction" of dataflow. See more on `ParseIn<T>` [here](todo), and how this can be customized [here](../config#relations)
TODO
:::

## Composability

Enys (and Valits) are build in a composable way, meaning you can nest Enys arbitrarily deeply.

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
