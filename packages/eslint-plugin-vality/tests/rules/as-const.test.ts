import {
  InvalidTestCase,
  ValidTestCase,
} from "@typescript-eslint/utils/dist/ts-eslint";
import rule from "../../src/rules/as-const";
import { ruleTester } from "./tester";

describe("as-const", () => {
  ruleTester.run("triggers (only) on 'v' and 'vality'", rule, {
    valid: [
      `
const x = {
  foo: horst.string,
  bar: 0,
};
      `,
    ].map(mapEntry),
    invalid: [
      {
        code: `
const x = {
  foo: v.string,
  bar: 0,
};
        `,
        output: `
const x = {
  foo: v.string,
  bar: 0,
} as const;
        `,
      },
      {
        code: `
const x = {
  foo: vality.string,
  bar: 0,
};
        `,
        output: `
const x = {
  foo: vality.string,
  bar: 0,
} as const;
        `,
      },
    ].map(mapInvalidEntry),
  });

  ruleTester.run("triggers on the outermost possible short", rule, {
    valid: [
      `
const x = {
  foo: v.string,
  bar: 0,
} as const;
      `,
      `
const x = {
  foo: {
    bar: v.string,
    baz: 0,
  },
} as const;
      `,
      `
const x = [
  v.string,
  0,
] as const;
      `,
      `
const x = [
  [
    v.string,
    0,
  ],
] as const;
      `,
      `
const x = [
  {
    bar: v.string,
    baz: 0,
  },
] as const;
      `,
      `
const x = {
  foo: [
     v.string,
     0,
  ],
} as const;
      `,
    ].map(mapEntry),
    invalid: [
      {
        code: `
const x = {
  foo: v.string,
  bar: 0,
};
        `,
        output: `
const x = {
  foo: v.string,
  bar: 0,
} as const;
        `,
      },
      {
        code: `
const x = {
  foo: {
    bar: v.string,
    baz: 0,
  },
};
        `,
        output: `
const x = {
  foo: {
    bar: v.string,
    baz: 0,
  },
} as const;
        `,
      },
      {
        code: `
const x = [
  v.string,
  0,
];
        `,
        output: `
const x = [
  v.string,
  0,
] as const;
        `,
      },
      {
        code: `
const x = [
  [
    v.string,
    0,
  ],
];
        `,
        output: `
const x = [
  [
    v.string,
    0,
  ],
] as const;
        `,
      },
      {
        code: `
const x = [
  {
    bar: v.string,
    baz: 0,
  },
];
        `,
        output: `
const x = [
  {
    bar: v.string,
    baz: 0,
  },
] as const;
        `,
      },
      {
        code: `
const x = {
  foo: [
    v.string,
    0,
  ],
  bar: [
    0,
  ],
};
        `,
        output: `
const x = {
  foo: [
    v.string,
    0,
  ],
  bar: [
    0,
  ],
} as const;
        `,
      },
    ].map(mapInvalidEntry),
  });

  ruleTester.run("ignores shorts without triggers", rule, {
    valid: [
      `
const x = {
  foo: "foo",
  bar: 0,
};
      `,
      `
const x = {
  foo: {
    bar: "foo",
    baz: 0,
  },
};
      `,
      `
const x = [
  "foo",
  0,
];
      `,
      `
const x = [
  [
    "foo",
    0,
  ],
];
      `,
      `
const x = [
  {
    bar: "foo",
    baz: 0,
  },
];
      `,
      `
const x = {
  foo: [
    "foo",
    0,
  ],
};
      `,
    ].map(mapEntry),
    invalid: [].map(mapInvalidEntry),
  });

  ruleTester.run("triggers on Guards and Valits", rule, {
    valid: [].map(mapEntry),
    invalid: [
      {
        code: `
const x = {
  foo: v.string,
  bar: 0,
};
        `,
        output: `
const x = {
  foo: v.string,
  bar: 0,
} as const;
        `,
      },
      {
        code: `
const x = {
  foo: v.string(),
  bar: 0,
};
        `,
        output: `
const x = {
  foo: v.string(),
  bar: 0,
} as const;
        `,
      },
      {
        code: `
const x = {
  foo: v.string()(),
  bar: 0,
};
        `,
        output: `
const x = {
  foo: v.string()(),
  bar: 0,
} as const;
        `,
      },
    ].map(mapInvalidEntry),
  });

  ruleTester.run("doesn't trigger on triggers-only objects", rule, {
    valid: [
      `
const x = {
  foo: v.string,
  bar: v.number,
};
      `,
      `
const x = {
  foo: {
    bar: v.string,
    baz: v.number,
  },
};
      `,
    ].map(mapEntry),
    invalid: [
      {
        code: `
const x = [
  v.string,
  v.number,
];
      `,
        output: `
const x = [
  v.string,
  v.number,
] as const;
      `,
      },
      {
        code: `
const x = [
  [
    v.string,
    v.number,
  ],
];
      `,
        output: `
const x = [
  [
    v.string,
    v.number,
  ],
] as const;
      `,
      },
      {
        code: `
const x = [
  {
    bar: v.string,
    baz: v.number,
  },
];
      `,
        output: `
const x = [
  {
    bar: v.string,
    baz: v.number,
  },
] as const;
      `,
      },
      {
        code: `
const x = {
  foo: [
      v.string,
      v.number,
  ],
};
      `,
        output: `
const x = {
  foo: [
      v.string,
      v.number,
  ],
} as const;
      `,
      },
    ].map(mapInvalidEntry),
  });
});

// ruleTester.run("as-const", rule, {
//   valid: [
//     `
// const x = [
//   {
//     bar: "foo",
//     baz: 0,
//   },
// ];
//     `,
//   ].map(mapEntry),
//   invalid: [ ].map(mapInvalidEntry),
// });

function mapEntry(entry: string | { code: string }): ValidTestCase<[]> {
  if (typeof entry === "string") {
    return {
      code: entry,
    };
  }
  return {
    code: entry.code,
  };
}

function mapInvalidEntry(entry: {
  code: string;
  output: string;
}): InvalidTestCase<"asConst", []> {
  return {
    code: entry.code,
    output: entry.output,
    errors: [
      {
        messageId: "asConst",
      },
    ],
  };
}
