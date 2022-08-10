---
sidebar_position: 1
title: Validate
---

Vality exposes one validation method to rule them all: `validate(eny: Eny, value: unknown): ValidationResult`. It takes in an _eny_ (will be explained soon) and a value and returns an object that contains the result of the validation.

```ts twoslash
// @noErrors
import { ValidationRestult } from "vality/guard";
let result: ValidationResult;
// ---cut---
import { vality, validate } from "vality";

result = validate({
  name: vality.string,
  age: vality.number,
  address: {
    street: vality.string,
    city: vality.string,
    country: vality.string,
  },
}, {
  name: "Larl",
  age: 42,
  address: {
    street: "Main Street",
    city: "Dummytown",
    country: "USA",
  },
});

// Yields:
result = { valid: true, errors: [] }
```
