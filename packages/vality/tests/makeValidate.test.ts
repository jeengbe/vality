import { makeValit } from "vality/makeValidate";
import { _name, _type, _validate } from "vality/symbols";

function testValit({
  name = "__valit",
  inner = jest.fn((value, options, path) =>
    value
      ? ({ valid: true, data: value, errors: [] } as const)
      : ({
          valid: false,
          data: undefined,
          errors: [
            {
              message: "test.invalid",
              path,
              options,
              value,
            },
          ],
        } as const)
  ),
  fn = jest.fn(() => inner),
  handleOptions,
  defaultOptions,
  options,
  args = [],
  path = [],
  parent,
  context = {},
  ...rest
}: {
  name?: any;
  inner?: any;
  fn?: any;
  handleOptions?: any;
  defaultOptions?: any;
  options?: any;
  args?: any[];
  path?: any;
  parent?: any;
  value?: any;
  context?: any;
} = {}) {
  const value = "value" in rest ? rest.value : "foo";

  let valit = makeValit(
    // The reason this is never is that we never import the actual guards/valits definitions in this file, which is why they are not present in the interface and in turn, keyof them is never
    name as never,
    fn,
    handleOptions,
    defaultOptions
  )(...args) as any;

  if (options) valit = valit(options);
  // We set this here, so that when we don't pass options (ie undefined), we can still get the correct value from the return object
  else options = {};

  const res = valit[_validate](value, path, context, parent);

  return {
    name,
    inner,
    fn,
    handleOptions,
    defaultOptions,
    options,
    args,
    path,
    parent,
    value,
    valit,
    res,
    context,
  };
}

describe("testValit", () => {
  it("returns all values correctly", () => {
    {
      const {
        name,
        inner,
        fn,
        handleOptions,
        defaultOptions,
        options,
        args,
        path,
        parent,
        value,
        valit,
        res,
        context,
      } = testValit();

      expect(name).toBe("__valit");
      expect(inner).toEqual(expect.any(Function));
      expect(fn).toEqual(expect.any(Function));
      expect(handleOptions).toBeUndefined();
      expect(defaultOptions).toBeUndefined();
      expect(options).toEqual({});
      expect(args).toEqual([]);
      expect(path).toEqual([]);
      expect(parent).toBeUndefined();
      expect(value).toBe("foo");
      expect(valit).toEqual(expect.any(Function));
      expect(res).toBeValid("foo");
      expect(context).toEqual({});
    }
    {
      const name = "test";
      const inner = jest.fn((value) => ({
        valid: true,
        data: value + "bar",
        errors: [],
      }));
      const fn = jest.fn(() => inner);
      const handleOptions = {};
      const defaultOptions = {};
      const options = {};
      const args = ["foo", "bar"];
      const path = ["foo", "bar"];
      const parent = {};
      const value = "baz";
      const context = { foo: "bar" };

      const got = testValit({
        name,
        inner,
        fn,
        handleOptions,
        defaultOptions,
        options,
        args,
        path,
        parent,
        value,
        context,
      });
      expect(got).toEqual({
        name,
        inner,
        fn,
        handleOptions,
        defaultOptions,
        options,
        args,
        path,
        parent,
        value,
        valit: expect.any(Object),
        res: {
          valid: true,
          data: "bazbar",
          errors: [],
        },
        context,
      });
    }
  });
});

describe("valit", () => {
  describe("options", () => {
    it("works with no options", () => {
      const { inner, value, path, parent, context } = testValit();
      expect(inner).toHaveBeenCalledWith(value, {}, path, context, parent);
    });

    it("works with an options object", () => {
      const { inner, options, value, path, parent, context } = testValit({
        options: { foo: "bar" },
      });
      expect(inner).toHaveBeenCalledWith(value, options, path, context, parent);
    });

    describe("options function", () => {
      it("works", () => {
        const options = { foo: "bar" };
        const { inner, value, path, parent, context } = testValit({
          options: () => options,
        });
        expect(inner).toHaveBeenCalledWith(
          value,
          options,
          path,
          context,
          parent
        );
      });

      it("receives the parent object", () => {
        {
          const fn = jest.fn(() => ({}));
          const { parent, context } = testValit({ options: fn });
          expect(fn).toHaveBeenCalledWith(parent, context);
        }
        {
          const fn = jest.fn(() => ({}));
          const { parent, context } = testValit({
            options: fn,
            parent: { bar: "baz" },
          });
          expect(fn).toHaveBeenCalledWith(parent, context);
        }
      });

      it("receives the context object", () => {
        {
          const fn = jest.fn(() => ({}));
          const { parent, context } = testValit({ options: fn });
          expect(fn).toHaveBeenCalledWith(parent, context);
        }
        {
          const fn = jest.fn(() => ({}));
          const { parent, context } = testValit({
            options: fn,
            context: { bar: "baz" },
          });
          expect(fn).toHaveBeenCalledWith(parent, context);
        }
      });
    });
  });

  describe("symbols", () => {
    describe("no options", () => {
      it("attaches [_validate]", () => {
        const { valit } = testValit();
        expect(valit[_validate]).toEqual(expect.any(Function));
      });

      it("attaches [_type]", () => {
        {
          const { valit, args } = testValit();
          expect(valit[_type]).toEqual(args);
        }
        {
          const { valit, args } = testValit({ args: ["foo"] });
          expect(valit[_type]).toEqual(args);
        }
      });

      it("attaches [_name]", () => {
        {
          const { valit, name } = testValit();
          expect(valit[_name]).toEqual(name);
        }
        {
          const { valit, name } = testValit({ name: "foo" });
          expect(valit[_name]).toEqual(name);
        }
      });
    });

    describe("options object", () => {
      it("attaches [_validate]", () => {
        const { valit } = testValit({ options: { foo: "bar" } });
        expect(valit[_validate]).toEqual(expect.any(Function));
      });

      it("attaches [_type]", () => {
        {
          const { valit, args } = testValit({ options: { foo: "bar" } });
          expect(valit[_type]).toEqual(args);
        }
        {
          const { valit, args } = testValit({
            args: ["foo"],
            options: { foo: "bar" },
          });
          expect(valit[_type]).toEqual(args);
        }
      });

      it("attaches [_name]", () => {
        {
          const { valit, name } = testValit({ options: { foo: "bar" } });
          expect(valit[_name]).toEqual(name);
        }
        {
          const { valit, name } = testValit({
            name: "foo",
            options: { foo: "bar" },
          });
          expect(valit[_name]).toEqual(name);
        }
      });
    });

    describe("options function", () => {
      it("attaches [_validate]", () => {
        const { valit } = testValit({ options: () => ({ foo: "bar" }) });
        expect(valit[_validate]).toEqual(expect.any(Function));
      });

      it("attaches [_type]", () => {
        {
          const { valit, args } = testValit({
            options: () => ({ foo: "bar" }),
          });
          expect(valit[_type]).toEqual(args);
        }
        {
          const { valit, args } = testValit({
            args: ["foo"],
            options: () => ({ foo: "bar" }),
          });
          expect(valit[_type]).toEqual(args);
        }
      });

      it("attaches [_name]", () => {
        {
          const { valit, name } = testValit({
            options: () => ({ foo: "bar" }),
          });
          expect(valit[_name]).toEqual(name);
        }
        {
          const { valit, name } = testValit({
            name: "foo",
            options: () => ({ foo: "bar" }),
          });
          expect(valit[_name]).toEqual(name);
        }
      });
    });
  });

  describe("flow", () => {
    describe("default", () => {
      it("works from options", () => {
        {
          const { res } = testValit({
            options: { default: "foo" },
            value: undefined,
          });
          expect(res).toBeValid("foo");
        }
        {
          const { res } = testValit({
            options: { default: "bar" },
            value: "foo",
          });
          expect(res).toBeValid("foo");
        }
      });

      it("doesn't work from default options", () => {
        {
          const { res, options, path, value } = testValit({
            defaultOptions: { default: "foo" },
            value: undefined,
          });
          expect(res).toBeInvalid({
            message: "test.invalid",
            options,
            path,
            value,
          });
        }
        {
          const { res } = testValit({
            defaultOptions: { default: "bar" },
            value: "foo",
          });
          expect(res).toBeValid("foo");
        }
      });
    });

    describe("preprocess", () => {
      it("works from options", () => {
        const { res, inner, value, options, path, parent, context } = testValit(
          {
            options: { preprocess: (v: string) => v + "bar" },
          }
        );
        expect(inner).toHaveBeenCalledWith(
          value + "bar",
          options,
          path,
          context,
          parent
        );
        expect(res.data).toEqual(value + "bar");
      });

      it("doesn't work from default options", () => {
        const { res, inner, value, options, path, parent, context } = testValit(
          {
            defaultOptions: { preprocess: (v: string) => v + "bar" },
          }
        );
        expect(inner).toHaveBeenCalledWith(
          value,
          options,
          path,
          context,
          parent
        );
        expect(res.data).toEqual(value);
      });
    });

    describe("fn", () => {
      test("its return value is considered", () => {
        const { res } = testValit({
          inner: (v: string) => ({ valid: true, data: v + "bar", errors: [] }),
        });
        expect(res.data).toEqual("foobar");
      });

      it("is called with args", () => {
        {
          const { fn, args } = testValit();
          expect(fn).toHaveBeenCalledWith(...args);
        }
        {
          const { fn, args } = testValit({ args: ["foo"] });
          expect(fn).toHaveBeenCalledWith(...args);
        }
      });

      it("inner is called with (value, options, path, context, parent)", () => {
        {
          const { inner, value, options, path, parent, context } = testValit();
          expect(inner).toHaveBeenCalledWith(
            value,
            options,
            path,
            context,
            parent
          );
        }
        {
          const { inner, value, options, path, parent, context } = testValit({
            value: "bar",
            options: {
              foo: "bar",
            },
            path: ["foo"],
            parent: { bar: "baz" },
            context: { foo: "bar" },
          });
          expect(inner).toHaveBeenCalledWith(
            value,
            options,
            path,
            context,
            parent
          );
        }
      });

      it("exists flow early if invalid", () => {
        const fn = jest.fn();
        const { res, path, options, value } = testValit({
          value: undefined,
          options: {
            transform: fn,
          },
        });
        expect(fn).not.toHaveBeenCalled();
        expect(res).toBeInvalid({
          message: "test.invalid",
          options,
          path,
          value,
        });
      });
    });

    describe("custom validate", () => {
      it("is called with (fn result, options, path, parent)", () => {
        const validate = jest.fn();
        const { value, options, path, parent, context } = testValit({
          options: {
            validate,
          },
        });
        expect(validate).toHaveBeenCalledWith(
          value,
          options,
          path,
          context,
          parent
        );
      });

      it("exists flow early if invalid", () => {
        const fn = jest.fn();
        const { res, name, path, options, value } = testValit({
          options: {
            validate: () => false,
            transform: fn,
          },
        });
        expect(fn).not.toHaveBeenCalled();
        expect(res).toBeInvalid({
          message: `vality.${name}.custom`,
          options,
          path,
          value,
        });
      });
    });

    describe("transform", () => {
      it("works from options", () => {
        const { res, inner, value, options, path, parent, context } = testValit(
          {
            options: { transform: (v: string) => v + "bar" },
          }
        );
        expect(inner).toHaveBeenCalledWith(
          value,
          options,
          path,
          context,
          parent
        );
        expect(res.data).toEqual(value + "bar");
      });

      it("doesn't work from default options", () => {
        const { res, inner, value, options, path, parent, context } = testValit(
          {
            defaultOptions: { transform: (v: string) => v + "bar" },
          }
        );
        expect(inner).toHaveBeenCalledWith(
          value,
          options,
          path,
          context,
          parent
        );
        expect(res.data).toEqual(value);
      });
    });

    describe("handlers", () => {
      test("are called with the preprocessed value", () => {
        const { handleOptions, value, options, context } = testValit({
          options: {
            preprocess: (v: string) => v + "bar",
            foo: true,
          },
          handleOptions: {
            foo: jest.fn(),
          },
        });
        expect(handleOptions.foo).toHaveBeenCalledWith(
          value + "bar",
          true,
          options,
          context
        );
      });

      test("are called with the un-transformed value", () => {
        const { handleOptions, value, options, context } = testValit({
          handleOptions: {
            foo: jest.fn(),
          },
          options: {
            transform: (v: string) => v + "bar",
            foo: true,
          },
        });
        expect(handleOptions.foo).toHaveBeenCalledWith(
          value,
          true,
          options,
          context
        );
      });

      test("work from options", () => {
        const { handleOptions, value, options, context } = testValit({
          handleOptions: {
            foo: jest.fn(),
          },
          options: {
            foo: true,
          },
        });
        expect(handleOptions.foo).toHaveBeenCalledWith(
          value,
          true,
          options,
          context
        );
      });

      test("work from default options", () => {
        const { handleOptions, value, options, context } = testValit({
          handleOptions: {
            foo: jest.fn(),
          },
          defaultOptions: {
            foo: true,
          },
        });
        expect(handleOptions.foo).toHaveBeenCalledWith(
          value,
          true,
          options,
          context
        );
      });

      it("overrides default options", () => {
        const { handleOptions, value, options, context } = testValit({
          handleOptions: {
            foo: jest.fn(),
          },
          defaultOptions: {
            foo: false,
          },
          options: {
            foo: true,
          },
        });
        expect(handleOptions.foo).toHaveBeenCalledWith(
          value,
          true,
          options,
          context
        );
      });

      it("errors if fails", () => {
        const { res, name, handleOptions, value, path, options, context } =
          testValit({
            handleOptions: {
              foo: jest.fn(() => false),
              bar: jest.fn(() => false),
            },
            options: {
              foo: true,
              bar: false,
            },
          });
        expect(handleOptions.foo).toHaveBeenCalledWith(
          value,
          true,
          options,
          context
        );
        expect(handleOptions.bar).toHaveBeenCalledWith(
          value,
          false,
          options,
          context
        );
        expect(res).toBeInvalid(
          {
            message: `vality.${name}.options.foo`,
            options,
            path,
            value,
          },
          {
            message: `vality.${name}.options.bar`,
            options,
            path,
            value,
          }
        );
      });

      it("masks as base fail if only in default options", () => {
        const { res, name, value, path, options } = testValit({
          handleOptions: {
            foo: jest.fn(() => false),
          },
          defaultOptions: {
            foo: true,
          },
        });
        expect(res).toBeInvalid({
          message: `vality.${name}.base`,
          options,
          path,
          value,
        });
      });

      it("bails early if bail is true (options)", () => {
        const { res, name, handleOptions, value, path, options, context } =
          testValit({
            handleOptions: {
              foo: jest.fn(() => false),
              bar: jest.fn(() => false),
            },
            options: {
              foo: true,
              bar: true,
              bail: true,
            },
          });
        expect(handleOptions.foo).toHaveBeenCalledWith(
          value,
          true,
          options,
          context
        );
        expect(handleOptions.bar).not.toHaveBeenCalled();
        expect(res).toBeInvalid({
          message: `vality.${name}.options.foo`,
          options,
          path,
          value,
        });
      });

      it("doesn't bail early if bail is true (default options)", () => {
        const { res, name, handleOptions, value, path, options, context } =
          testValit({
            handleOptions: {
              foo: jest.fn(() => false),
              bar: jest.fn(() => false),
            },
            options: {
              foo: true,
              bar: false,
            },
            defaultOptions: {
              bail: true,
            },
          });
        expect(handleOptions.foo).toHaveBeenCalledWith(
          value,
          true,
          options,
          context
        );
        expect(handleOptions.bar).toHaveBeenCalledWith(
          value,
          false,
          options,
          context
        );
        expect(res).toBeInvalid(
          {
            message: `vality.${name}.options.foo`,
            options,
            path,
            value,
          },
          {
            message: `vality.${name}.options.bar`,
            options,
            path,
            value,
          }
        );
      });
    });
  });
});
