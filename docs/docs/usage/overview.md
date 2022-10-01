---
sidebar_positon: 0
title: Usage
id: usage-overview
slug: /usage
---

:::tip

While prose is fine and all, [**examples**](../examples/overview.md) are a much better way to get a good overview of Vality.

:::

With Vality, you only have to write each model once. You can then use it for validation and get the benefits of type checking for free.

## Models

Get started with writing a model definition for your schema.

```ts twoslash
import { v } from "vality";

const User = () =>
  ({
    username: v.string,
  } as const);
```

A model is really just a function that returns an object. Don't forget to return the object `as const` or certain features of Vality will not work correctly.

You can then use this object to define how your data should look, by specifying the properties it ought to have and their respective types. For example, to make sure that a property `email` is always an email, add the following property to the object: `email: v.email`. Don't forget that objects may be nested arbitrarily deep:

```ts twoslash
import { v } from "vality";
// ---cut---
const User = () =>
  ({
    username: v.string,
    contact: {
      email: v.string,
      phone: v.number,
      discord: {
        username: v.string,
        discriminator: v.number,
      },
    },
  } as const);
```

### Type

The real beauty of Vality is that you write your validation model and type definition in one place. Use the `Parse<T>` type to extract this information and use it to define your model type definition.

All you have to do is to pass `typeof Model` to the `Parse` type and it will return a type that represents the model type definition.

```ts twoslash
import { v, Parse } from "vality";
const User = () =>
  ({
    username: v.string,
    contact: {
      email: v.string,
      phone: v.number,
      discord: {
        username: v.string,
        discriminator: v.number,
      },
    },
  } as const);
// ---cut---

type UserModel = Parse<typeof User>;
//   ^?
```

<details>

<summary>The <code>typeof</code> keyword is necessary because the model itself is written in JavaScript and needs to be converted to a type first.</summary>

```ts twoslash
// @errors: 2749
import { v } from "vality";
type Parse<T> = "Easter egg";
const Person = () => ({} as const);
// ---cut---
type PersonModel = Parse<Person>;
```

</details>

## Guards

To specify the type of a property, Vality offers a number of guards.

Guards, such as `v.string` and `v.number`, are used to check for atomar data types, and can easily be [extended](../extend/guards.md) to check for more complex data. See the [full documentation](guards.md) for a list of all built-in guards.

### Options

To further specify the type of a property, you can additionally pass options to guards, which is done by calling it with an object.

```ts twoslash
// @noErrors
import { v } from "vality";
// ---cut---
const User = () =>
  ({
    age: v.number({ min: 18 }), // Will only accept numbers that are at least 18
    realName: v.string({ m }), // We even get autocomplete!
    //                    ^|
  } as const);
```

Options have no influence on the type of the guard when processed by `Parse`.

## Valits

More complex data structures, such as objects or arrays, are represented by valits.

Similar to guards, there are a number of built-in valits (see the [full documentation](valits.md) for a complete list), and they too are [extendable](../extend/valits.md). However, unline guards, valits take arguments that determine their type. For example, `v.array` takes <span title="Actually, this is not completely true. Valits can take any eny as arguments, but as enys have not been introduced yet, this will be explained further down the page." style={{textDecoration: "underline dotted"}}>a single guard</span> and then checks for an array of the passed guard's type.

```ts twoslash
import { v, Parse } from "vality";
// ---cut---
const User = () =>
  ({
    username: v.string,
    // (additional properties omitted for brevity)

    languages: v.array(v.string),
  } as const);

type UserModel = Parse<typeof User>;
//   ^?
```

### Options

Valits can also be refined with options, which are passed by calling them with an object after specifying the guard. Basically by calling them twice (also called [currying](https://en.wikipedia.org/wiki/Currying)).

```ts twoslash
import { v } from "vality";
// ---cut---
const User = () =>
  ({
    luckyNumbers: v.array(v.number)({ minLength: 3, maxLength: 5 }),
  } as const);
```

Options have no influence on the type of the valit when processed by `Parse`.

## Shorthands (Shorts)

Another very handy feature of Vality are shorthands for certain valits. For example, an array with only one element is treated the same way as `v.array`. A list of these shorts can be found in the [full documentation](shorthands.md).

```ts twoslash
import { v, Parse } from "vality";
// ---cut---
const User = () =>
  ({
    // Same as v.array(v.enum(v.literal("de"), v.literal("en"), v.literal("sv"), v.literal("fr")))
    languages: [["de", "en", "sv", "fr"]],
  } as const);

type UserModel = Parse<typeof User>;
//   ^?
```

### Options

It is not possible to provide options to shorts. If you need to provide extra constraints, you have to pass those to the verbose version. For example, `[v.number]( ... )` is not valid, rather would you have to call `v.array(v.number)( ... )`.

## Enys

_Eny_ is a general term for everything that Vality can deal with. This includes guards, valits and shorthands, which all can be used for valits, for example. As valits take enys as arguments, and valits themselves are enys, this allows for arbitrarily deep nesting and complex data structures.

```ts twoslash
import { v, Parse } from "vality";
// ---cut---

const Person = () =>
  ({
    name: v.string,
    address: {
      street: v.optional(v.string),
      city: v.optional(v.string),
      country: v.string,
    },
  } as const);

const Manufacturer = () =>
  ({
    name: v.string,
    ceo: Person,
    cars: [Car],
  } as const);

const Car = () =>
  ({
    manufacturer: Manufacturer,
    horsepower: v.number({
      min: 1,
    }),
    fuel: ["petrol", "diesel", "electric"],
  } as const);

// Hover the types
declare type PersonModel = Parse<typeof Person>;
declare type ManufacturerModel = Parse<typeof Manufacturer>;
declare type CarModel = Parse<typeof Car>;
//           ^?
```
