<h1 align="center">Vality</h1>
<div align="center">

A TypeScript schema descriptor library with zero dependencies.

See https://ts-vality.io for more information.

</div>

## [Vality](https://npmjs.com/package/vality)
[![License](https://img.shields.io/npm/l/vality)](https://github.com/jeengbe/vality/blob/master/packages/vality/LICENSE.md)
[![Version](https://img.shields.io/npm/v/vality)](https://www.npmjs.com/package/vality)
[![Coverage Status](https://img.shields.io/codecov/c/github/jeengbe/vality/master?flag=vality&token=L0QZW59UTU)](https://app.codecov.io/gh/jeengbe/vality/tree/master/packages/vality)
[![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://github.com/jeengbe/vality/network/dependencies#packages%2Fvality%2Fpackage.json)


Vality is the heart of this repository. It is a declarative **schema description library** with the most **intuitive syntax** and allows for validation and transformation of data. Then extract the types from your schema for **100% type safety**. And all with **0 runtime dependencies**.

Find all of this and much more on https://ts-vality.io/vality.

```ts
import { v, Parse } from "vality";

const Person = {
  name: v.string,
  age: v.number({ min: 6 }),
  email: v.email,
  referral: ["friends", "ad", "media", null],
  languages: [["de", "en", "fr", "se"]],
} as const;

type Person = Parse<typeof Person>;
/* {
  name: string;
  age: number;
  email: Email;
  referral: "friends" | "ad" | "media" | null;
  languages: ("de" | "en" | "fr" | "se")[];
} */
```

Now that I have your attention, head over to https://ts-vality.io/vality to find out what's going on here. You won't regret it ;) Or check out [packages/vality](packages/vality).

Or continue scrolling down to see what else is in this repository.

## [Vality ESLint Plugin](https://npmjs.com/package/eslint-plugin-vality)
[![License](https://img.shields.io/npm/l/eslint-plugin-vality)](https://github.com/jeengbe/vality/blob/master/packages/eslint-plugin-vality/LICENSE.md)
[![Version](https://img.shields.io/npm/v/eslint-plugin-vality)](https://www.npmjs.com/package/eslint-plugin-vality)
[![Coverage Status](https://img.shields.io/codecov/c/github/jeengbe/vality/master?flag=eslint-plugin-vality&token=L0QZW59UTU)](https://app.codecov.io/gh/jeengbe/vality/tree/master/packages/eslint-plugin-vality)


```ts
const Brand = {
  logo: v.dict([64, 128, 256], v.url),
};

type Brand = Parse<typeof Brand>;
/* {
  logo: {
    [x: number]: URL; // Where are the literal values???
  };
} */
```

Can you spot what's wrong with this model? Correct, it's missing the literal types for the keys. This is a common mistake when using Array or Enum Shorts and can be easily fixed by adding `as const`. (Find more information on this mistake [here](https://ts-vality.io/vality/as-const)).

```ts
const Brand = {
  logo: v.dict([64, 128, 256] as const, v.url),
};

type Brand = Parse<typeof Brand>;
/* {
  logo: {
    64: URL;
    128: URL;
    256: URL;
  };
} */
```

Forgetting this sucks and can quickly become a source of frustration when suddenly types are weird. ESLint to the rescue! It will warn you when you forget to add `as const` in places where is may backfire and adds it automatically for you.

Find more information on https://ts-vality.io/eslint-plugin-vality or check out [packages/eslint-plugin-vality](packages/eslint-plugin-vality).
