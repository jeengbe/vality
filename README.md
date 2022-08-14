<h1 align="center">vality</h1>
<div align="center">

A TypeScript schema descriptor library with zero dependencies.

[![License](https://img.shields.io/npm/l/vality)](https://github.com/jeengbe/vality)
[![Version](https://img.shields.io/npm/v/vality)](https://www.npmjs.com/package/vality)
[![Build Status](https://img.shields.io/github/workflow/status/jeengbe/vality/publish)](https://github.com/jeengbe/vality)

</div>

### Before you read this readme
While a readme is fine and all, it is missing [one very cool and important feature](https://shikijs.github.io/twoslash/playground) on GitHub, which is why I have put together a documentation with interactive code examples. Vality is best explained with examples. I even registered a custom domain for Vality, this must be serious!\
[https://ts-vality.io/getting-started](https://ts-vality.io/getting-started)


<h2 id="getting-started">Getting Started</h2>
vality offers a simple and compact way to describe your schema:

<div id="getting-started-model"></div>

```ts
import { v, validate, Parse } from "vality";

// Models are defined like this:
const Person = () => ({
  name: v.string,
  age: v.number,
  address: {
    street: v.string,
    city: v.string,
    country: v.string,
  },
});
```

<div id="getting-started-type"></div>

```ts
// And can easily be converted into a type:
type PersonModel = Parse<typeof Person>;
//   ^ {
//     name: string;
//     age: number;
//     address: {
//       street: string;
//       city: string;
//       country: string;
//     };
//   }
```

<div id="getting-started-validate"></div>

```ts
// Or used directly in a validation function:
result = validate(Person, {
  name: "Max",
  age: "look ma no number",
  address: {
    street: "Main Street",
    // city: "Dummytown",
    country: "USA",
  },
});

// Which yields the following result:
result = {
  valid: false,
  errors: [{
    message: "vality.number.type",
    path: ["age"],
    value: "look ma no number",
    meta: { ... }
  }, {
    message: "vality.string.type",
    path: ["address", "city"],
    value: undefined,
    meta: { ... }
  }]
}
```

<h2 id="usage">Usage</h2>

_Note: While prose is fine and all, [examples](#examples) are a much better way to get an overview of vality._

_Note 2: All examples assume the following values are imported:_

`{ v }` is an alias for `{ vality }` and both may be used interchangeably.

```ts
import { vality, validate, Parse } from "vality";
```

<h3 id="usage-guards">Guards</h3>

Guards are the most basic way to match against an atomic value. These include built-in Guards (e.g. `vality.string`, `vality.boolean`), but can be easily [extended](#extending-guards) to check for more specific types such as emails or telephone numbers.

```ts
vality.string;
```

[List of all built-in guards](#built-in-guards)

Guards also accept arguments, to further constrain the type of the value. These are passed by calling the guard.

```ts
vality.string({ minLength: 3 }); // String with at least 3 characters
vality.string({ minLength: 3, maxLength: 8 }); // String with at least 3 and at most 8 characters
```

<h3 id="usage-valits">Valit</h3>

While guards are used to check for atomic values, Valits are used to match against structured data.

```ts
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

[List of all built-in Valits](#built-in-valits)

Similarly to guards, Valits can also accept arguments, which are passed by calling the Valit after providing the guard(s).

```ts
vality.array(vality.string)({ minLength: 3 }); // Array of strings with at least 3 elements
vality.array(vality.string)({ minLength: 3, maxLength: 8 }); // Array of strings with at least 3 and at most 8 elements
```

<h3 id="usage-enys">Enys</h3>

Enys are the best part of vality. An eny is used as a shorthand for a Valit or guard, and can be used anywhere where either of the prior is expected.

```ts
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

[List of all enys](#built-in-enys)

<h3 id="usage-validate">Validate</h3>

Any eny can be used to validate a value.

```ts
validate(vality.string, "Hi"); // Checks if "Hi" is a string
validate([["a", "b", "c"]], ["a", "x", "a"]); // Checks if ["a", "x", "a"] is an array of either "a", "b" or "c"
```

<h3 id="usage-models">Models</h3>

Models are a way to describe reusable.. well.. models. Models need to be defined as a function, and models that use enys for literals or arrays must return the object `as const`. ([See explanation](#note-1))

```ts
const Person = () => ({ // Eny for vality.object({ name: vality.string, ... })
  name: vality.string,
  age: vality.number,
  gender: ["m", "f", "nb"], // Eny for vality.enum("m", "f", "nb")
  address: { // Eny for vality.object({ ... })
    ...
  },
});
```

<h2 id="built-in">Built-ins</h2>
<h3 id="built-in-guards">Guards</h3>

The generic type `Guard<T, O extends Record<string, any>>` denotes a Guard that matches against a value of type `T` and accepts arguments in `O`. All available Guards lay in the global interface `vality.guards`.

See [lib/guards.ts](lib/guards.ts) for an up-to-date list of built-in Guards.

<h3 id="built-in-valits">Valits</h3>

Valits are slightly more complicated than Guards. They are defined in `vality.valits` as functions that accept enys in a specific format (tuples accept `eny[]`, objects accept `Record<string, Eny>` etc.). The `Valit<E extends Eny, O extends Record<string, any>>` type denotes is returned and describes a Valit with arguments `O`.

See [lib/valits.ts](lib/valits.ts) for an up-to-date list of built-in Valits.

<h3 id="built-in-enys">Enys</h3>

Enys in turn are even more complicated:

- `[E]` where `E` is any eny, describes an array of `E`, and can be seen as a shorthand for `vality.array(E)`
- `[E, F, G, ...H]`, where `E`, `F` and `G` are enys, describes an enum type of `E`, `F` and `G`. This can be seen as a shorthand for `vality.enum(E, F, G, ...H)`
- An empty array is not a valid eny

- Every Guard and Valit can be used as an eny
- Literal values are short for `vality.literal( ... )`
- `{ ... }` is short for `vality.object({ ... })`
- `M` where M is a model is short for `vality.relation(M)`

Enys and Valits may be nested arbitrarily deep.

<h2 id="extending">Extending</h2>
vality is build to be easily extensible.

<h3 id="extending-guards">Guards</h3>
To define a Guard, you have to do two things:

- Define the signature of the Guard in `valiy.guards`:
- Extends the `vality` object with the new Guard

```ts
import { vality } from "vality";
import { guard, Guard } from "vality/guard";

declare global {
  namespace vality {
    interface guards: {
      /**
       * Check if a value is a valid email
       */
      email: Guard<string, {
        /**
         * Only allow emails from a specific provider
         *
         * @example "gmail.com"
         */
        provider?: string;
       }>;
    }
  }
}

// Bear in mind that this is a very crude RegEx solely for demonstration purposes and should not be used in production.
const emailRegex = /^[a-z0-9_-]+@[a-z0-9.]+$/i;

vality.email = guard("email", val => typeof val === "string" && emailRegex.test(val), {
  provider: (val, o) => o.split("@")[1] === o,
});
```

<h3 id="extending-valits">Valits</h3>
TODO

<h2 id="examples">Examples</h2>
TODO

<h2 id="notes">Notes</h2>
<h3 id="note-1">Note 1</h3>
Models have to be defined as functions for a number of reasons:

- To distinguish between a relation to a model and a sub-object.

```ts
const Person = {
  name: vality.string,
};

const Pet = {
  belongsTo: Person, // Should this be a relation to a Person (separate object) or a sub-object with the same properties?
};
```

- To enable recursive structures, as those would throw errors if not used in a function.

```ts
const Person = {
  friends: [Person], // Error: Person is not defined
};
```

Models that use enys for literals or arrays must return the object `as const` as TypeScript would elsewise extend the tuple to an array, and literals to their type. Whilst that is the desired behaviour in most cases, here, we need to retain this exact structure.

```ts
const Person = () => ({
  gender: ["m", "f", "nb"], // Becomes string[], instead of ["m", "f", "nb"]
});
```
