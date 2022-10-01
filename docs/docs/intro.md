---
sidebar_position: 1
title: Intro
---

```twoslash include person
import { v } from "vality";

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

Vality offers a simple and intuitive way to describe your schema:

<h3 id="model">Describe it</h3>

```ts twoslash
// @include: person
```

<h3 id="type">Type it</h3>

```ts twoslash
// @include: person
// ---cut---
import type { Parse } from "vality";

// And can easily be converted into a type:
type PersonModel = Parse<typeof Person>;
//   ^?
```

<h3 id="validate">Validate it</h3>

```ts twoslash
// @noErrors
// @include: person
let result: GuardResult;
// ---cut---
import { validate } from "vality";

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
  data: undefined,
  errors: [{
    message: "vality.number.base",
    path: ["age"],
    value: "look ma no number",
    meta: { ... }
  }, {
    message: "vality.string.base",
    path: ["address", "city"],
    value: undefined,
    meta: { ... }
  }]
};
```
