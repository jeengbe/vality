<h1 align="center">Vality Env</h1>
<div align="center">

[![License](https://img.shields.io/npm/l/vality-env)](https://github.com/jeengbe/vality/blob/master/packages/vality-env/LICENSE.md)
[![Version](https://img.shields.io/npm/v/vality-env)](https://www.npmjs.com/package/vality-env)
[![Build Status](https://img.shields.io/github/actions/workflow/status/jeengbe/vality/ci.yml?brach=master)](https://github.com/jeengbe/vality)
[![Coverage Status](https://img.shields.io/codecov/c/github/jeengbe/vality/master?flag=vality-env&token=L0QZW59UTU)](https://app.codecov.io/gh/jeengbe/vality/tree/master/packages/vality-env)

[![Snyk](https://img.shields.io/snyk/vulnerabilities/github/jeengbe/vality)](https://snyk.io/test/github/jeengbe/vality)

See https://jeengbe.github.io/vality/vality-env for more information.

This page also assumes that you are somewhat familiar with [Vality](https://jeengbe.github.io/vality/vality). If not, check that out first.

</div>
Use Vality to describe your configuration and load+validate it.

```ts
import { v } from "vality";
import { loadEnv } from "vality-env";

const config = {
  jwt: {
    privateKey: v.string,
  },
  db: {
    url: v.env("DATABASE_URL", v.string),
    databaseName: v.env("DATABASE_NAME", v.string({
      default: "service"
    })),
  },
};

export function loadConfig() {
  const validatedConfig = loadEnv(config);

  if (!validatedConfig.valid) {
    console.error(validatedConfig.errors);
    throw new Error('Invalid config');
  }

  return validatedConfig.data;
}
```

```env
DATABASE_URL=http://localhost:8259
# DATABASE_NAME=
JWT_PRIVATE_KEY=asdasdasdasd
```
