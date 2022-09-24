import { Error, Face, v, validate } from "vality";
import { config } from "vality/config";
import { _name } from "vality/symbols";
import { RSA } from "vality/utils";

export function testValit(name: keyof vality.valits, valit: Face<any, any, any>, {
  option,
  options,
  valid,
  invalid,
}: {
  option?: string;
  options?: RSA,
  valid: {
    value: unknown;
    expect?: unknown;
  }[];
  invalid: {
    value: unknown;
    errors?: Error[];
  }[];
}) {
  for (const v of valid) {
    expect(validate(valit, v.value)).toBeValid("expect" in v ? v.expect : v.value);
  }
  for (const v of invalid) {
    expect(validate(valit, v.value)).toBeInvalid(...v.errors ?? [{
      message: option ? `vality.${name}.options.${option}` : `vality.${name}.base`,
      path: [],
      value: v.value,
      options: options ?? {},
    }]);
  }
}

describe("vality.array", () => {
  describe("base type check", () => {
    test("strict mode", () => {
      config.strict = true;

      testValit("array", v.array(v.number), {
        valid: [
          { value: [] },
          { value: [1, 2, 3] },
        ],
        invalid: [
          { value: -1 },
          { value: 0 },
          { value: 1 },
          { value: "" },
          { value: "foo" },
          { value: "foo bar" },
          { value: true },
          { value: false },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: () => { } }
        ]
      });
    });

    test("non-strict mode", () => {
      config.strict = false;

      testValit("array", v.array(v.number), {
        valid: [
          { value: [] },
          { value: [1, 2, 3] },
          { value: -1, expect: [-1] },
          { value: 0, expect: [0] },
          { value: 1, expect: [1] },
        ],
        invalid: [
          { value: "" },
          { value: "foo" },
          { value: "foo bar" },
          { value: true },
          { value: false },
          { value: undefined },
          { value: null },
          { value: {} },
          { value: { foo: "bar" } },
          { value: () => { } }
        ]
      });
    });
  });

  test("member type check", () => {
    testValit("array", v.array(v.number), {
      valid: [
        { value: [] },
        { value: [1, 2, 3] },
      ],
      invalid: [
        { value: ["foo", 2, 3], errors: [{ message: "vality.number.base", path: [0], value: "foo", options: {} }] },
        { value: [1, "bar", 3], errors: [{ message: "vality.number.base", path: [1], value: "bar", options: {} }] },
        { value: [1, 2, "foobar"], errors: [{ message: "vality.number.base", path: [2], value: "foobar", options: {} }] },
        {
          value: [, "foo", , "bar", ,], errors: [
            { message: "vality.number.base", path: [0], value: undefined, options: {} },
            { message: "vality.number.base", path: [1], value: "foo", options: {} },
            { message: "vality.number.base", path: [2], value: undefined, options: {} },
            { message: "vality.number.base", path: [3], value: "bar", options: {} },
            { message: "vality.number.base", path: [4], value: undefined, options: {} },
          ]
        },
      ]
    });
  });

  test("nested paths", () => {
    testValit("array", v.array(v.array(v.number)), {
      valid: [
        { value: [[]] },
        { value: [[1, 2, 3]] },
        { value: [[1, 2, 3], [4, 5, 6]] },
      ],
      invalid: [
        { value: [[1, 2, 3], [4, 5, "foo"]], errors: [{ message: "vality.number.base", path: [1, 2], value: "foo", options: {} }] },
      ]
    });
  });

  describe("options", () => {
    test("minLength", () => {
      testValit("array", v.array(v.number)({ minLength: 2 }), {
        option: "minLength",
        options: {
          minLength: 2
        },
        valid: [
          { value: [1, 2] },
          { value: [1, 2, 3] },
        ],
        invalid: [
          { value: [] },
          { value: [1] },
        ]
      });
    });

    test("maxLength", () => {
      testValit("array", v.array(v.number)({ maxLength: 2 }), {
        option: "maxLength",
        options: {
          maxLength: 2
        },
        valid: [
          { value: [] },
          { value: [1] },
          { value: [1, 2] },
        ],
        invalid: [
          { value: [1, 2, 3] },
        ]
      });
    });

    test("bail", () => {
      testValit("array", v.array(v.number)({ bail: true }), {
        valid: [
          { value: [] },
          { value: [1, 2, 3] },
        ],
        invalid: [
          { value: ["foo", "bar", "foobar"], errors: [{ message: "vality.number.base", path: [0], value: "foo", options: {} }] },
          { value: [1, "bar", "foobar"], errors: [{ message: "vality.number.base", path: [1], value: "bar", options: {} }] },
        ]
      });

      testValit("array", v.array(v.number)({ bail: false }), {
        valid: [
          { value: [] },
          { value: [1, 2, 3] },
        ],
        invalid: [
          {
            value: ["foo", "bar", "foobar"], errors: [
              { message: "vality.number.base", path: [0], value: "foo", options: {} },
              { message: "vality.number.base", path: [1], value: "bar", options: {} },
              { message: "vality.number.base", path: [2], value: "foobar", options: {} }
            ]
          },
          {
            value: [1, "bar", "foobar"], errors: [
              { message: "vality.number.base", path: [1], value: "bar", options: {} },
              { message: "vality.number.base", path: [2], value: "foobar", options: {} }
            ]
          },
        ]
      });
    });
  });
});

describe("vality.object", () => {
  test("base type check", () => {
    testValit("object", v.object({ foo: v.number }), {
      valid: [
        { value: { foo: 1 } },
      ],
      invalid: [
        { value: -1 },
        { value: 0 },
        { value: 1 },
        { value: "" },
        { value: "foo" },
        { value: "foo bar" },
        { value: true },
        { value: false },
        { value: undefined },
        { value: null },
        { value: [], errors: [{ message: "vality.number.base", path: ["foo"], value: undefined, options: {} }] },
        {
          value: [1],
          errors: [
            { message: "vality.number.base", path: ["foo"], value: undefined, options: {} },
            { message: "vality.object.extraProperty", path: ["0"], value: 1, options: {} },
          ]
        },
        { value: () => { } }
      ]
    });
  });

  test("member type check", () => {
    testValit("object", v.object({ foo: v.number }), {
      valid: [
        { value: { foo: 1 } },
      ],
      invalid: [
        { value: { foo: "bar" }, errors: [{ message: "vality.number.base", path: ["foo"], value: "bar", options: {} }] },
      ]
    });
  });

  describe("extra properties check", () => {
    test("regular", () => {
      testValit("object", v.object({ foo: v.number }), {
        valid: [
          { value: { foo: 1 } },
        ],
        invalid: [
          { value: { foo: 1, bar: 2 }, errors: [{ message: "vality.object.extraProperty", path: ["bar"], value: 2, options: {} }] },
          {
            value: { foo: 1, bar: 2, baz: "foo" },
            errors: [
              { message: "vality.object.extraProperty", path: ["bar"], value: 2, options: {} },
              { message: "vality.object.extraProperty", path: ["baz"], value: "foo", options: {} }
            ]
          },
        ]
      });
    });

    test("readonly", () => {
      testValit("object", v.object({ foo: v.number, bar: v.readonly(v.number) }), {
        valid: [
          { value: { foo: 1 } },
        ],
        invalid: [
          { value: { foo: 1, bar: 2 }, errors: [{ message: "vality.readonly.base", path: ["bar"], value: 2, options: {} }] },
          {
            value: { foo: 1, bar: 2, baz: "foo" },
            errors: [
              { message: "vality.readonly.base", path: ["bar"], value: 2, options: {} },
              { message: "vality.object.extraProperty", path: ["baz"], value: "foo", options: {} }
            ]
          },
        ]
      });
    });
  });

  test("nested paths", () => {
    testValit("object", v.object({ foo: v.object({ bar: v.number }) }), {
      valid: [
        { value: { foo: { bar: 1 } } },
      ],
      invalid: [
        { value: { foo: { bar: "foobar" } }, errors: [{ message: "vality.number.base", path: ["foo", "bar"], value: "foobar", options: {} }] },
      ]
    });
  });

  describe("options", () => {
    test("bail", () => {
      testValit("object", v.object({ foo: v.number, bar: v.number })({ bail: true }), {
        valid: [
          { value: { foo: 1, bar: 2 } },
        ],
        invalid: [
          { value: { foo: "bar", bar: "foobar" }, errors: [{ message: "vality.number.base", path: ["foo"], value: "bar", options: {} }] },
          { value: { foo: 1, bar: "foobar" }, errors: [{ message: "vality.number.base", path: ["bar"], value: "foobar", options: {} }] },
        ]
      });

      testValit("object", v.object({ foo: v.number, bar: v.number })({ bail: false }), {
        valid: [
          { value: { foo: 1, bar: 2 } },
        ],
        invalid: [
          {
            value: { foo: "bar", bar: "foobar" },
            errors: [
              { message: "vality.number.base", path: ["foo"], value: "bar", options: {} },
              { message: "vality.number.base", path: ["bar"], value: "foobar", options: {} },
            ]
          },
          {
            value: { foo: 1, bar: "foobar" }, errors: [{ message: "vality.number.base", path: ["bar"], value: "foobar", options: {} },]
          },
        ]
      });

      testValit("object", v.object({ foo: v.number })({ bail: true }), {
        valid: [
          { value: { foo: 1 } },
        ],
        invalid: [
          { value: { foo: 1, bar: 2 }, errors: [{ message: "vality.object.extraProperty", path: ["bar"], value: 2, options: { bail: true } }] },
          { value: { foo: 1, bar: 2, baz: 3 }, errors: [{ message: "vality.object.extraProperty", path: ["bar"], value: 2, options: { bail: true } }] },
        ]
      });

      testValit("object", v.object({ foo: v.number })({ bail: false }), {
        valid: [
          { value: { foo: 1 } },
        ],
        invalid: [
          { value: { foo: 1, bar: 2 }, errors: [{ message: "vality.object.extraProperty", path: ["bar"], value: 2, options: { bail: false } }] },
          {
            value: { foo: 1, bar: 2, baz: 3 },
            errors: [
              { message: "vality.object.extraProperty", path: ["bar"], value: 2, options: { bail: false } },
              { message: "vality.object.extraProperty", path: ["baz"], value: 3, options: { bail: false } }
            ]
          },
        ]
      });
    });
  });
});

describe("vality.optional", () => {
  describe("base type check", () => {
    test("in strict mode", () => {
      config.strict = true;

      testValit("optional", v.optional(v.number), {
        valid: [
          { value: undefined },
          { value: 1 },
        ],
        invalid: [
          { value: null, errors: [{ message: "vality.number.base", path: [], value: null, options: {} }] },
          { value: "1", errors: [{ message: "vality.number.base", path: [], value: "1", options: {} }] },
          { value: "foo", errors: [{ message: "vality.number.base", path: [], value: "foo", options: {} }] },
        ]
      });
    });

    test("in non-strict mode", () => {
      config.strict = false;

      testValit("optional", v.optional(v.number), {
        valid: [
          { value: undefined },
          { value: null, expect: undefined },
          { value: 1 },
          { value: "1", expect: 1 },
        ],
        invalid: [
          { value: "foo", errors: [{ message: "vality.number.base", path: [], value: "foo", options: {} }] },
        ]
      });
    });
  });
});

describe("vality.enum", () => {
  test("base type check", () => {
    testValit("enum", v.enum(v.number, v.string), {
      valid: [
        { value: -1 },
        { value: 0 },
        { value: 1 },
        { value: "" },
        { value: "1", expect: 1 },
        { value: "foo" },
        { value: "foo bar" },
      ],
      invalid: [
        { value: true },
        { value: false },
        { value: undefined },
        { value: null },
        { value: {} },
        { value: [] },
        { value: () => { } }
      ]
    });
  });
});

describe("vality.tuple", () => {
  test("base type check", () => {
    testValit("tuple", v.tuple(v.number, v.string), {
      valid: [
        { value: [1, "foo"] },
      ],
      invalid: [
        { value: -1 },
        { value: 0 },
        { value: 1 },
        { value: "" },
        { value: "foo" },
        { value: "foo bar" },
        { value: true },
        { value: false },
        { value: undefined },
        { value: null },
        { value: () => { } }
      ]
    });
  });

  test("member type check", () => {
    testValit("tuple", v.tuple(v.number, v.string), {
      valid: [
        { value: [1, "foo"] },
      ],
      invalid: [
        { value: [1, []], errors: [{ message: "vality.string.base", path: [1], value: [], options: {} }] },
        { value: [1, "foo", "bar"], errors: [{ message: "vality.tuple.extraProperty", path: [2], value: "bar", options: {} }] },
      ]
    });
  });

  describe("options", () => {
    test("bail", () => {
      testValit("tuple", v.tuple(v.number, v.string)({ bail: true }), {
        valid: [
          { value: [1, "foo"] },
        ],
        invalid: [
          { value: [1, []], errors: [{ message: "vality.string.base", path: [1], value: [], options: {} }] },
          { value: [1, "foo", 3], errors: [{ message: "vality.tuple.extraProperty", path: [2], value: 3, options: { bail: true } }] },
        ]
      });

      testValit("tuple", v.tuple(v.number, v.string)({ bail: false }), {
        valid: [
          { value: [1, "foo"] },
        ],
        invalid: [
          { value: [1, []], errors: [{ message: "vality.string.base", path: [1], value: [], options: {} },] },
          {
            value: [1, [], 3],
            errors: [
              { message: "vality.string.base", path: [1], value: [], options: {} },
              { message: "vality.tuple.extraProperty", path: [2], value: 3, options: { bail: false } },
            ]
          },
        ]
      });
    });
  });
});

describe("vality.readonly", () => {
  test("base type check", () => {
    testValit("readonly", v.readonly(v.number), {
      valid: [
        { value: undefined },
      ],
      invalid: [
        { value: -1 },
        { value: 0 },
        { value: 1 },
        { value: "" },
        { value: "1" },
        { value: "foo" },
        { value: "foo bar" },
        { value: true },
        { value: false },
        { value: null },
        { value: () => { } }
      ]
    });
  });

  test("symbols", () => {
    expect(v.readonly(v.string)).callback(v => typeof v === "function" && v?.[_name as unknown as keyof typeof v] === "readonly");
    expect(v.readonly(v.string)).callback(v => typeof v === "function" && v?.[_name as unknown as keyof typeof v] === "readonly");
  });
});

describe("vality.and", () => {
  test("base type check", () => {
    testValit("and", v.and({ foo: v.string }, { bar: v.string }), {
      valid: [
        { value: { foo: "bar", bar: "baz" } },
      ],
      invalid: [
        { value: { }, errors: [{ message: "vality.string.base", options: {}, path: ["foo"], value: undefined}, { message: "vality.string.base", options: {}, path: ["bar"], value: undefined}] },
        { value: { foo: "bar"}, errors: [{ message: "vality.string.base", options: {}, path: ["bar"], value: undefined}]},
        { value: { bar: "baz"}, errors: [{ message: "vality.string.base", options: {}, path: ["foo"], value: undefined}]},
        // error should be extra property
        { value: { foo: "bar", bar: "baz", baz: 1 }, errors: [{ message: expect.anything(), options: {}, path: expect.anything(), value: expect.anything()}]},
        { value: -1 },
        { value: 0 },
        { value: "" },
        { value: "foo" },
        { value: "foo bar" },
        { value: true },
        { value: false },
        { value: undefined },
        { value: null },
        { value: () => { } }
      ]
    });

    testValit("and", v.and({ foo: v.string}, {bar: v.string}, {baz: v.string}), {
      valid: [
        { value: { foo: "bar", bar: "baz", "baz": "qux" } },
      ],
      invalid: [
        { value: { }, errors: [{ message: "vality.string.base", options: {}, path: ["foo"], value: undefined}, { message: "vality.string.base", options: {}, path: ["bar"], value: undefined}, { message: "vality.string.base", options: {}, path: ["baz"], value: undefined}] },
        { value: { foo: "bar"}, errors: [{ message: "vality.string.base", options: {}, path: ["bar"], value: undefined}, { message: "vality.string.base", options: {}, path: ["baz"], value: undefined}]},
        { value: { foo: "bar", bar: "baz", baz: false }, errors: [{ message: "vality.string.base", options: {}, path: ["baz"], value: false}]},
        ]
    });
  });

  describe("composed types", () => {
    test("vality.and", () => {
      testValit("and", v.and(v.and({ foo: v.string }, { bar: v.string }), {baz: v.string}), {
        valid: [
          { value: { foo: "bar", bar: "baz", "baz": "qux" } },
        ],
        invalid: [
          { value: { }, errors: [{ message: "vality.string.base", options: {}, path: ["foo"], value: undefined}, { message: "vality.string.base", options: {}, path: ["bar"], value: undefined}, { message: "vality.string.base", options: {}, path: ["baz"], value: undefined}] },
          { value: { foo: "bar"}, errors: [{ message: "vality.string.base", options: {}, path: ["bar"], value: undefined}, { message: "vality.string.base", options: {}, path: ["baz"], value: undefined}]},
          { value: { foo: "bar", bar: "baz", baz: false }, errors: [{ message: "vality.string.base", options: {}, path: ["baz"], value: false}]},
          ]
      });
    })
  });
});

describe("vality.dict", () => {
  describe("base type check", () => {
    describe("single keys", () => {
      test("types", () => {
        testValit("dict", v.dict(v.number, v.any), {
          valid: [
            { value: {} },
            { value: { 0: "foo" } },
            { value: { 0: "foo", 1: "bar" } },
            { value: { "0": "foo" }, expect: { 0: "foo" } },
            { value: { "0": "foo", "1": "bar" }, expect: { 0: "foo", 1: "bar" } },
          ],
          invalid: [
            { value: 0 },
            { value: { "foo": "bar" }, errors: [{ message: "vality.dict.invalidProperty", path: ["foo"], value: "foo", options: {} }] },
            { value: { 0: "foo", "foo": "bar" }, errors: [{ message: "vality.dict.invalidProperty", path: ["foo"], value: "foo", options: {} }] },
          ]
        });

        testValit("dict", v.dict(v.string, v.any), {
          valid: [
            { value: {} },
            { value: { "foo": "bar" } },
            { value: { "foo": "bar", "bar": "baz" } },
            { value: { 0: "foo" }, expect: { "0": "foo", } },
            { value: { 0: "foo", "bar": "baz" }, expect: { "0": "foo", "bar": "baz" } },
          ],
          invalid: [
            { value: 0 },
          ]
        });
      });

      test("literals", () => {
        testValit("dict", v.dict("foo", v.any), {
          valid: [
            { value: { "foo": "foo" } },
          ],
          invalid: [
            { value: 0 },
            { value: {}, errors: [{ message: "vality.dict.missingProperty", path: ["foo"], value: undefined, options: {} }] },
            { value: { 0: "foo" }, errors: [{ message: "vality.dict.invalidProperty", path: ["0"], value: "0", options: {} }] },
            { value: { 0: "foo", "foo": "bar" }, errors: [{ message: "vality.dict.invalidProperty", path: ["0"], value: "0", options: {} }] },
          ]
        });

        testValit("dict", v.dict(4, v.any), {
          valid: [
            { value: { 4: "foo" } },
            { value: { "4": "foo" } },
          ],
          invalid: [
            { value: 0 },
            { value: {}, errors: [{ message: "vality.dict.missingProperty", path: [4], value: undefined, options: {} }] },
            { value: { "foo": "bar" }, errors: [{ message: "vality.dict.invalidProperty", path: ["foo"], value: "foo", options: {} }] },
            { value: { 0: "foo" }, errors: [{ message: "vality.dict.invalidProperty", path: ["0"], value: "0", options: {} }] },
          ]
        });
      });
    });

    describe("enum keys", () => {
      test("types", () => {
        testValit("dict", v.dict(v.enum(v.number, v.string), v.any), {
          valid: [
            { value: {} },
            { value: { 0: "foo" } },
            { value: { 0: "foo", 1: "bar" } },
            { value: { 0: "foo", 1: "bar", foo: "bar", bar: "baz" } },
            { value: { foo: "foo", bar: "bar" } },
          ],
          invalid: [
            { value: 0 },
          ]
        });
      });

      test("literals", () => {
        testValit("dict", v.dict(v.enum("foo", "bar"), v.any), {
          valid: [
            { value: { foo: "foo", bar: "bar" } },
          ],
          invalid: [
            { value: 0 },
            { value: {}, errors: [{ message: "vality.dict.missingProperty", path: ["foo"], value: undefined, options: {} }, { message: "vality.dict.missingProperty", path: ["bar"], value: undefined, options: {} }] },
            { value: { "foo": "bar" }, errors: [{ message: "vality.dict.missingProperty", path: ["bar"], value: undefined, options: {} }] },
            { value: { foo: "foo", bar: "bar", "baz": "qux" }, errors: [{ message: "vality.dict.invalidProperty", path: ["baz"], value: "baz", options: {} }] },
          ]
        });
      });

      test("mixed", () => {
        testValit("dict", v.dict(v.enum("foo", v.number), v.any), {
          valid: [
            { value: { "foo": "bar" } },
            { value: { foo: "foo", 0: "bar" } },
            { value: { foo: "foo", 0: "bar", 1: "baz" } },
          ],
          invalid: [
            { value: 0 },
            { value: {}, errors: [{ message: "vality.dict.missingProperty", path: ["foo"], value: undefined, options: {} }] },
            { value: { 0: "foo" }, errors: [{ message: "vality.dict.missingProperty", path: ["foo"], value: undefined, options: {} }] },
          ]
        });
      })
    });
  });

  test("member type check", () => {
    testValit("dict", v.dict(v.string, v.number), {
      valid: [
        { value: {} },
        { value: { foo: 0 } },
        { value: { foo: 0, bar: 1 } },
      ],
      invalid: [
        { value: 0 },
        { value: { foo: "bar" }, errors: [{ message: "vality.number.base", path: ["foo"], value: "bar", options: {} }] },
        { value: { foo: 0, bar: "baz" }, errors: [{ message: "vality.number.base", path: ["bar"], value: "baz", options: {} }] },
      ]
    });
  });

  describe("options", () => {
    test("bail", () => {
      testValit("dict", v.dict(v.number, v.any)({ bail: true }), {
        valid: [
          { value: {} },
          { value: { 0: "foo" } },
        ],
        invalid: [
          { value: { foo: "bar" }, errors: [{ message: "vality.dict.invalidProperty", path: ["foo"], value: "foo", options: { bail: true } }] },
          { value: { foo: "bar", bar: "baz" }, errors: [{ message: "vality.dict.invalidProperty", path: ["foo"], value: "foo", options: { bail: true } }] },
        ]
      });

      testValit("dict", v.dict(v.enum(v.literal("foo"), v.literal("bar")), v.any)({ bail: false }), {
        valid: [
          { value: { foo: "bar", bar: "baz" } },
        ],
        invalid: [
          { value: {}, errors: [{ message: "vality.dict.missingProperty", path: ["foo"], value: undefined, options: { bail: false } }, { message: "vality.dict.missingProperty", path: ["bar"], value: undefined, options: { bail: false } }] },
        ]
      });

      testValit("dict", v.dict(v.enum(v.literal("foo"), v.literal("bar")), v.any)({ bail: true }), {
        valid: [
          { value: { foo: "bar", bar: "baz" } },
        ],
        invalid: [
          { value: {}, errors: [{ message: "vality.dict.missingProperty", path: ["foo"], value: undefined, options: { bail: true } }] },
        ]
      });

      testValit("dict", v.dict(v.string, v.boolean)({ bail: false }), {
        valid: [
          { value: { foo: true } },
        ],
        invalid: [
          { value: { foo: "bar" }, errors: [{ message: "vality.boolean.base", path: ["foo"], value: "bar", options: { } }] },
          { value: { foo: "bar", bar: "baz" }, errors: [{ message: "vality.boolean.base", path: ["foo"], value: "bar", options: { } }, { message: "vality.boolean.base", path: ["bar"], value: "baz", options: { } }] },
        ]
      });

      testValit("dict", v.dict(v.string, v.boolean)({ bail: true }), {
        valid: [
          { value: { foo: true } },
        ],
        invalid: [
          { value: { foo: "bar" }, errors: [{ message: "vality.boolean.base", path: ["foo"], value: "bar", options: { } }] },
          { value: { foo: "bar", bar: "baz" }, errors: [{ message: "vality.boolean.base", path: ["foo"], value: "bar", options: { } }] },
        ]
      });
    });
  })
})

// TODO: SPLIT UP
describe("passes on the parent structure", () => {
  const options = jest.fn(() => ({}));
  afterEach(() => options.mockClear());

  test("vality.array", () => {
    validate([v.string(options)], ["foo", "bar", "baz"]);
    expect(options).toHaveBeenCalledWith(["foo", "bar", "baz"]);
    expect(options).toHaveBeenCalledTimes(1);
  });

  test("vality.object", () => {
    validate({ foo: v.string(options), bar: v.number(options) }, { foo: "bar", bar: 2 });
    expect(options).toHaveBeenCalledWith({ foo: "bar", bar: 2 });
    expect(options).toHaveBeenCalledTimes(2);
  });

  test("vality.optional", () => {
    // Passes through
    validate([v.optional(v.string(options))], ["foo", "bar", "baz"]);
    expect(options).toHaveBeenCalledWith(["foo", "bar", "baz"]);
    expect(options).toHaveBeenCalledTimes(1);
  });

  test("vality.enum", () => {
    // Passes through
    validate([[v.string(options), v.number(options)]], ["foo", 2, "baz"]);
    expect(options).toHaveBeenCalledWith(["foo", 2, "baz"]);
    expect(options).toHaveBeenCalledTimes(1); // Only 1 call because first check mathec
    options.mockClear();

    validate([[v.string(options), v.number(options)]], [true, 2, "baz"]);
    expect(options).toHaveBeenCalledWith([true, 2, "baz"]);
    expect(options).toHaveBeenCalledTimes(2); // 2 calls because first check failed
  });

  test("vality.tuple", () => {
    validate(v.tuple(v.string(options), v.number(options), v.boolean(options)), ["foo", 2, true]);
    expect(options).toHaveBeenCalledWith(["foo", 2, true]);
    expect(options).toHaveBeenCalledTimes(3);
  });
});
