<h1 align="center">Vality</h1>
<div align="center">

A TypeScript schema descriptor library with zero dependencies.

[![License](https://img.shields.io/npm/l/vality)](https://github.com/jeengbe/vality/blob/master/packages/vality/LICENSE.md)
[![Version](https://img.shields.io/npm/v/vality)](https://www.npmjs.com/package/vality)
[![Build Status](https://img.shields.io/github/workflow/status/jeengbe/vality/Publish)](https://github.com/jeengbe/vality)
[![Coverage Status](https://img.shields.io/codecov/c/github/jeengbe/vality/master?flag=vality&token=L0QZW59UTU)](https://app.codecov.io/gh/jeengbe/vality/tree/master/packages/vality)

[![Snyk](https://img.shields.io/snyk/vulnerabilities/github/jeengbe/vality)](https://snyk.io/test/github/jeengbe/vality)
[![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://github.com/jeengbe/vality/network/dependencies)
[![Bundlephobia](https://img.shields.io/bundlephobia/minzip/vality)](https://bundlephobia.com/package/vality)

See https://ts-vality.io for more information.

</div>

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

Now that I have your attention, head over to https://ts-vality.io/vality to find out what's going on here. You won't regret it ;)

Or head to [GitHub](https://github.com/jeengbe/vality) to find more useful packages (such as [Vality ESLint Plugin](https://github.com/jeengbe/vality/tree/master/packages/eslint-plugin-vality)).
