---
sidebar_position: 2
title: Guards
---

Guards are the most basic way to match against an atomic value (string, number, or more specifically emails or telephone numbers). These include [built-in guards](#list-of-guards) (e.g. `vality.string`, `vality.boolean`), but can be easily [extended](../extend/guards.md) to check for more specific types such as domains or ip addresses.

```ts twoslash
import { validate } from "vality";
// ---cut---
import { vality } from "vality";

validate(vality.string, "Hello There!"); // { valid: true }
```

## Casting {#casting}

By default, guards can cast certain values to the desired format.

```ts twoslash
import { vality, validate } from "vality";
// ---cut---
validate(vality.boolean, "1"); // { valid: true, data: true }
```

This behaviour can be disabled by enabling [strict mode](../config.md#strict-mode).

## Options {#options}

Guards also accept arguments to further constrain the type of the value they match against. These are passed by calling the guard with the options as only argument. You can find a list of supported options in the [list of guards](#list-of-guards).

```ts twoslash
import { vality } from "vality";
// ---cut---
vality.string({ minLength: 3 }); // String with at least 3 characters
vality.string({ minLength: 3, maxLength: 8 }); // String with at least 3 and at most 8 characters
// @noErrors
vality.number({ m }); // We even get autocomplete here!
//               ^|
```

## Extra Options {#extra-options}

In addition to above described, there are a few more extra options that can be used to fully customise how a guard behaves.

### transform {#extra-options-transform}

This option can be used to modify the value that a guard returns after all its checks have passed.

```ts twoslash
import { vality, validate } from "vality";
// ---cut---
validate(
  vality.string({
    transform: s => s.toUpperCase(),
  }),
  "Hello!"
); // { valid: true, data: "HELLO!" }
```

### default {#extra-options-default}

This option can be used to provide a default value to a guard that is used when `undefined` is validated. (`vality.optional` is useless in combination with this object).

```ts twoslash
import { vality, validate } from "vality";
// ---cut---
validate(
  {
    myNum: vality.number({
      default: -1,
    }),
  },
  {}
); // { valid: true, data: { myNum: -1 } }
```

### validate {#extra-options-validate}

This option can be used to completely customise the way a guard validates an input. Note that this option does _not replace_, but adds another condition to the original guard definition.

```ts twoslash
import { vality, validate } from "vality";
// ---cut---
validate(
  vality.number({
    validate: n => n % 3 === 0
  }),
  5
); // { valid: false }
```

## List of guards {#list-of-guards}

Vality comes with 6 guards out of the box:

### vality.string {#list-of-guards-string}

Returns the value as a string. Accepts and casts `string`, `number`.

| Option | Accepts | Default Value | Effect |
| --- | --- | --- | --- |
| `minLength` | `number` | `undefined` | Minimum length for the resulting string, inclusive (uses [`String.length`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length)) |
| `maxLength` | `number` | `undefined` | Maximum length for the resulting string, inclusive (uses [`String.length`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length)) |
| `match` | `RegExp` | `undefined` | Regular expression that needs to match the resulting string |

### vality.number {#list-of-guards-number}

Returns the value as a number. Strings are parsed with [`parseFloat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseFloat). Only accepts numbers in the [safe integer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER) range (this can be disabled with options).

| Option    | Accepts   | Default Value | Effect                                                  |
| --------- | --------- | ------------- | ------------------------------------------------------- |
| `min`     | `number`  | `undefined`   | Minimum value, inclusive                                |
| `max`     | `number`  | `undefined`   | Maximum value, inclusive                                |
| `integer` | `boolean` | `undefined`   | Whether the resulting number must be an integer         |
| `unsafe`  | `boolean` | `false`       | Whether to allow numbers outside the safe integer range |

### vality.boolean {#list-of-guards-boolean}

Returns the value as a boolean. Accepts `"1"`, `1`, `"true"` for `true`, and `"0"`, `0`, `"false"` for `false`.

No options.

### vality.date {#list-of-guards-date}

Returns the value as a `Date`. Accepts `Date`s and anything [`Date.parse()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse) can handle.

| Option   | Accepts   | Default Value | Effect                                                 |
| -------- | --------- | ------------- | ------------------------------------------------------ |
| `min`    | `Date`    | `undefined`   | Minimum value, inclusive                               |
| `max`    | `Date`    | `undefined`   | Maximum value, inclusive                               |
| `past`   | `boolean` | `undefined`   | Whether the date must lie in the past, excluding now   |
| `future` | `boolean` | `undefined`   | Whether the date must lie in the future, excluding now |

### literal => vality.literal {#list-of-guards-literal}

This guard is a little different. Other than the so far listed guards, this one is a guard factory, that creates a guard that returns and accepts only the given value.

```ts twoslash
import { validate } from "vality";
// ---cut---
import { vality } from "vality";

validate(vality.literal(5), 5); // { valid: true }
```

Options are passed by simply calling the result from the factory:

```ts twoslash
import { validate } from "vality";
// ---cut---
import { vality } from "vality";

validate(vality.literal(5)({ default: true }), undefined); // { valid: true }
```

No options.

However, the `default` option behaves differently here. As seen above, it accepts boolean values that simply indicate whether to use the literal value as the default value. (This is mainly to remove the need of writing the actual literal twice: once in the facory call, for the option.)

### model => vality.relation {#list-of-guards-relation}

This is a guard factory as well. It is intended to check for valid relations to insert into a database. The model you pass to it is not actually used for validation, insted it is only used for the TypeScript type. To compensate this, Vality provides two different parse types:

#### `Parse<T>` and `ParseIn<T>`

`Parse` (alias `ParseOut`) is used to represent a schema that is coming from the backend, an _outgoing_ data structure. Relations are expanded to the actual model in this mode.

`ParseIn` on the other hand models _ingoing_ data, where the relation is merely denoted by an identifier of the referenced model. Therefore, relations are treated as mere numbers and accordingly typed.

<details>
  <summary>Example</summary>

This example shows the difference between `ParseOut` and `ParseIn`

```ts twoslash
import { vality, ParseOut, ParseIn } from "vality";

const Person = () =>
  ({
    bestFriend: vality.relation(Person),
  } as const);

type PersonOut = ParseOut<typeof Person>;
//   ^?
type PersonIn = ParseIn<typeof Person>;
//   ^?
```

`...` stands for a circular reference. `Person["bestFriend"]` is actually just `Person`, which is represented with three dots.

</details>

#### Customisation {#customisation}

By default, relations are assumed to be non-negative integers. If, however, this does not fit your database (for example if you use ArangoDB), it is possible to entirely overwrite all related options in Vality. This can be accomplished by simply reassigning `vality.relation`, and specifying a custom relation type to be used for `ParseIn`. This is done by simplicy setting a property in the global configuration interface.

For example, if your database uses strings as keys, the following code does the correct validation:

```ts twoslash
const MyModel = () => ({});
// ---cut---
import { vality, validate, ParseIn } from "vality";
import { guard } from "vality/guard";
import type { Valit } from "vality/valit";
import type { RelationType } from "vality/parse";

declare global {
  namespace vality {
    interface Config {
      RelationType: string | null;
    }
  }
}

vality.relation = () =>
  guard("relation", val => {
    return validate(
      [
        null,
        vality.string({
          minLength: 1,
        }),
      ],
      val
    ).data as unknown as undefined;
  }) as any;

const rel = vality.relation(MyModel);
type rel = ParseIn<typeof rel>;
//   ^?
```
