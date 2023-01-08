import { loadEnv } from "vality-env";
import { v } from "vality";

describe("loadEnv", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("joins the path and loads the environment variables", () => {
    const config = {
      foo: {
        bar: v.string,
      },
    };

    process.env.FOO_BAR = "baz";

    expect(loadEnv(config)).toBeValid({
      foo: {
        bar: "baz",
      },
    });
  });

  it("converts camel case to upper snake case", () => {
    const config = {
      fooBar: v.string,
    };

    process.env.FOO_BAR = "baz";

    expect(loadEnv(config)).toBeValid({
      fooBar: "baz",
    });
  });

  it("overrides with v.env()", () => {
    const config = {
      foo: {
        bar: v.env("BAZ", v.string),
      },
    };

    process.env.FOO_BAR = "baz";
    process.env.BAZ = "qux";

    expect(loadEnv(config)).toBeValid({
      foo: {
        bar: "qux",
      },
    });
  });

  it("applies operations like transform", () => {
    const config = {
      foo: {
        bar: v.env("BAZ", v.string({ transform: (s) => s.toUpperCase() })),
      },
    };

    process.env.BAZ = "qux";

    expect(loadEnv(config)).toBeValid({
      foo: {
        bar: "QUX",
      },
    });
  });

  it("falls back to the default value", () => {
    const config = {
      foo: {
        bar: v.env("BAZ", v.string({ default: "qux" })),
      },
    };

    expect(loadEnv(config)).toBeValid({
      foo: {
        bar: "qux",
      },
    });
  });
});
