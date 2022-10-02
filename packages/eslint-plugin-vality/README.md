<h1 align="center">ESLint Plugin Vality</h1>
<div align="center">

A TypeScript schema descriptor library with zero dependencies.

[![License](https://img.shields.io/npm/l/eslint-plugin-vality)](https://github.com/jeengbe/vality/blob/master/packages/eslint-plugin-vality/LICENSE.md)
[![Version](https://img.shields.io/npm/v/eslint-plugin-vality)](https://www.npmjs.com/package/eslint-plugin-vality)
[![Build Status](https://img.shields.io/github/workflow/status/jeengbe/vality/Publish)](https://github.com/jeengbe/vality)
[![Coverage Status](https://img.shields.io/codecov/c/github/jeengbe/vality/master?flag=eslint-plugin-vality&token=L0QZW59UTU)](https://app.codecov.io/gh/jeengbe/vality/tree/master/packages/eslint-plugin-vality)

[![Snyk](https://img.shields.io/snyk/vulnerabilities/github/jeengbe/vality)](https://snyk.io/test/github/jeengbe/vality)

See https://ts-vality.io/eslint-plugin-vality for more information.

This page also assumes that you are somewhat familiar with [Vality](https://ts-vality.io/vality). If not, check that out first.

</div>

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

Can you spot what's wrong with this model? Correct, it's missing the literal types for the keys. This is a common mistake when using Array or Enum Shorts and can be easily fixed by adding `as const`. (Find more information on this mistake [here](https://ts-vality.io/vality/pitfalls/as-const)).

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

Now that you are interested, check out the [full documentation](https://ts-vality.io/eslint-plugin-vality) for more information.
