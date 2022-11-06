import { Error, Face, validate } from "vality";
import { RSA } from "vality/utils";

export function testValit(
  name: keyof vality.valits,
  valit: Face<any, any, any>,
  {
    option,
    options,
    valid,
    invalid,
  }: {
    option?: string;
    options?: RSA;
    valid: {
      value: unknown;
      expect?: unknown;
    }[];
    invalid: {
      value: unknown;
      errors?: Error[];
    }[];
  }
) {
  for (const v of valid) {
    expect(validate(valit, v.value)).toBeValid(
      "expect" in v ? v.expect : v.value
    );
  }
  for (const v of invalid) {
    expect(validate(valit, v.value)).toBeInvalid(
      ...(v.errors ?? [
        {
          message: option
            ? `vality.${name}.options.${option}`
            : `vality.${name}.base`,
          path: [],
          value: v.value,
          options: options ?? {},
        },
      ])
    );
  }
}

describe("vality.array", () => {
  test("base type check", () => {});

  it("accepts non-array values in non-strict mode", () => {});

  describe("check items", () => {
    it("passes (value, path, context, parent) correctly", () => {});

    it("works with Shorts", () => {});

    it("fails if item fails", () => {});

    it("respects bail", () => {});
  });

  describe("options", () => {
    test("minLength", () => {});

    test("maxLength", () => {});
  });

  describe("type", () => {
    describe("Short", () => {
      test("flat", () => {});

      test("nested", () => {});
    });

    describe("Valit", () => {
      test("flat", () => {});

      test("nested", () => {});
    });
  });
});

describe("vality.object", () => {
  test("base type check", () => {});

  describe("check properties", () => {
    it("passes (value, path, context, parent) correctly to values", () => {});

    it("works with Shorts as values", () => {});

    it("fails if member fails", () => {});

    it("respects bail for member check", () => {});

    it("allows 'key[]' as 'key' if value is of type array", () => {});

    it("treats readonly properties as not set", () => {});

    it("allows extra properties", () => {});

    it("bails on extra properties", () => {});
  });

  describe("type", () => {
    describe("Short", () => {
      test("flat", () => {});

      test("nested", () => {});

      test("marks optional properties as optional", () => {});
    });

    describe("Valit", () => {
      test("flat", () => {});

      test("nested", () => {});

      test("marks optional properties as optional", () => {});
    });
  });
});

describe("vality.optional", () => {
  describe("type check", () => {
    it("passes (value, path, context, parent) correctly", () => {});

    it("passes if member passes", () => {});
  });

  it("allows 'undefined'", () => {});

  describe("allows 'null' in strict mode", () => {
    test("order of priority", () => {});
  });

  test("type", () => {});
});

describe("vality.enum", () => {
  describe("member type check", () => {
    it("passes (value, path, context, parent) correctly", () => {});

    it("works with Shorts", () => {});

    it("returns first match", () => {});

    it("fails if all members fail", () => {});
  });

  describe("type", () => {
    describe("Short", () => {
      test("flat", () => {});

      test("nested", () => {});
    });

    describe("Valit", () => {
      test("flat", () => {});

      test("nested", () => {});
    });
  });
});

describe("vality.tuple", () => {
  test("base type check", () => {});

  describe("allows non-array values in non-strict mode", () => {
    test("order of priority", () => {});
  });

  describe("check items", () => {
    it("passes (value, path, context, parent) correctly", () => {});

    it("works with Shorts", () => {});

    it("fails if member fails", () => {});
  });

  test("type", () => {});
});

test("vality.readonly", () => {});

describe("vality.and", () => {
  test("base type check", () => {});

  describe("member type check", () => {
    it("passes (value, path, context, parent) correctly to values", () => {});

    test("object + object", () => {});

    test("object + enum", () => {});

    test("object + vality.and", () => {});

    it("works with Shorts", () => {});

    it("fails if member fails", () => {});
  });

  // TODO
});

describe("vality.dict", () => {
  test("base type check", () => {});

  describe("check properties", () => {
    test("type keys", () => {});

    test("literal keys", () => {});

    test("enum keys (mixed)", () => {});

    it("uses keys' return value as properties in data", () => {});

    describe("fails if literal key missing", () => {
      it("works", () => {});

      it("ignores optional keys", () => {});

      it("respects bail", () => {});
    });

    describe("fails if remaining property not covered by type keys", () => {
      it("works", () => {});

      it("respects allowExtraProperties", () => {});

      it("respects bail", () => {});
    });
  });

  describe("return data", () => {
    it("uses keys' return value as properties in data", () => {});

    it("passes (value, path, context, parent) correctly to values", () => {});

    it("works with Shorts", () => {});

    it("fails if member fails", () => {});

    it("respects bail", () => {});
  });

  test("type", () => {});
});
