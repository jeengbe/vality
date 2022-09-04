import { v, validate } from "vality";
import { guard } from "vality/guard";
import { _validate } from "vality/symbols";
import { RSA } from "vality/utils";

function mockGuard(implementation: {
  name?: string;
  fn?: (value: unknown, options: unknown) => any;
  handleOptions?: RSA;
  defaultOptions?: RSA;
},
  call: {
    value?: any;
    options?: RSA & {
      transform?: (v: any) => typeof v,
      default?: any;
      validate?: (v: any, options: RSA) => boolean;
    };
  }) {
  const {
    name = "__test__guard__",
    fn: _fn = (v: any) => v,
    handleOptions,
    defaultOptions,
  } = implementation;
  const fn = jest.fn(_fn);
  let g = guard(name as keyof vality.guards, fn, handleOptions, defaultOptions);

  const {
    value,
    options
  } = call;

  if (options) g = g(options) as any;

  const res = validate(g, value);

  return { name, res, fn };
}

describe("guard()", () => {
  it("passes if fn returns anything other than undefined", () => {
    const { res } = mockGuard({
      fn: () => "foo",
    }, {});

    expect(res).toBeValid("foo");
  });

  it("fails if fn returns undefined", () => {
    const { name, res } = mockGuard({
      fn: () => undefined,
    }, {
      value: "foo"
    });

    expect(res).toBeInvalid({
      message: `vality.${name}.base`,
      value: "foo",
      options: {},
      path: []
    });
  });

  describe("option handler", () => {
    it("passes if all return true", () => {
      const { res } = mockGuard({
        handleOptions: {
          foo: () => true,
          bar: () => true,
        }
      }, {
        value: "foo",
        options: {
          foo: "bar",
          bar: "baz",
        }
      });

      expect(res).toBeValid("foo");
    });

    it("fails if any return false", () => {
      let { name, res } = mockGuard({
        handleOptions: {
          foo: () => true,
          bar: () => false,
        }
      }, {
        value: "foo",
        options: {
          foo: "bar",
          bar: "baz",
        }
      });

      expect(res).toBeInvalid({
        message: `vality.${name}.options.bar`,
        value: "foo",
        options: {
          foo: "bar",
          bar: "baz",
        },
        path: []
      });
    });

    it("doesn't bail on first failure", () => {
      const { name, res } = mockGuard({
        handleOptions: {
          foo: () => false,
          bar: () => false,
        }
      }, {
        value: "foo",
        options: {
          foo: "bar",
          bar: "baz",
        }
      });

      expect(res).toBeInvalid({
        message: `vality.${name}.options.foo`,
        value: "foo",
        options: {
          foo: "bar",
          bar: "baz",
        },
        path: []
      }, {
        message: `vality.${name}.options.bar`,
        value: "foo",
        options: {
          foo: "bar",
          bar: "baz",
        },
        path: []
      });
    });

    it("masks error as base message if specified by default value", () => {
      const { name, res } = mockGuard({
        handleOptions: {
          foo: () => false,
          bar: () => false,
        },
        defaultOptions: {
          foo: "bar",
        }
      }, {
        value: "foo",
        options: {
          bar: "baz",
        }
      });

      expect(res).toBeInvalid({
        message: `vality.${name}.base`,
        value: "foo",
        options: {
          bar: "baz",
        },
        path: []
      }, {
        message: `vality.${name}.options.bar`,
        value: "foo",
        options: {
          bar: "baz",
        },
        path: []
      });
    });
  });

  describe("options", () => {
    it("forwards options and value to fn", () => {
      const { fn } = mockGuard({}, {
        value: "foo",
        options: {
          bar: "baz",
          baz: "qux"
        }
      });

      expect(fn).toHaveBeenCalledWith("foo", {
        bar: "baz",
        baz: "qux"
      }, [], undefined);
    });

    it("calls all option handlers with value and options", () => {
      const bar = jest.fn(v => true);
      const baz = jest.fn(v => true);

      mockGuard({
        handleOptions: {
          bar,
          baz
        }
      }, {
        value: "foo",
        options: {
          bar: "baz",
          baz: 1
        }
      });

      expect(bar).toHaveBeenCalledWith("foo", "baz", {
        bar: "baz",
        baz: 1
      });
      expect(baz).toHaveBeenCalledWith("foo", 1, {
        bar: "baz",
        baz: 1
      });
      bar.mockClear(); baz.mockClear();

      mockGuard({
        handleOptions: {
          bar,
          baz
        }
      }, {
        value: "foo",
        options: { bar: "baz" }
      });

      expect(bar).toHaveBeenCalledWith("foo", "baz", { bar: "baz" });
      expect(baz).not.toHaveBeenCalled();
      bar.mockClear(); baz.mockClear();
    });

    it("calls the options callback with the parent structure", () => {
      const options = jest.fn(() => ({}));

      v.string(options)[_validate]("foo", [], {
        bar: "baz"
      });

      expect(options).toHaveBeenCalledWith({
        bar: "baz"
      });
    });
  });

  describe("default options", () => {
    it("doesn't forward default options to fn", () => {
      const { fn } = mockGuard({
        defaultOptions: {
          bar: "baz",
          baz: "qux"
        }
      }, {
        value: "foo",
      });

      expect(fn).toHaveBeenCalledWith("foo", {}, [], undefined);
    });

    it("calls all option handlers with value but without default options", () => {
      const bar = jest.fn(() => true);
      const baz = jest.fn(() => true);

      mockGuard({
        handleOptions: {
          bar,
          baz
        },
        defaultOptions: {
          bar: "baz",
          baz: 1
        }
      }, {
        value: "foo",
      });

      expect(bar).toHaveBeenCalledWith("foo", "baz", {});
      expect(baz).toHaveBeenCalledWith("foo", 1, {});
      bar.mockClear(); baz.mockClear();

      mockGuard({
        handleOptions: {
          bar,
          baz
        },
        defaultOptions: {
          bar: "baz"
        }
      }, {
        value: "foo",
      });

      expect(bar).toHaveBeenCalledWith("foo", "baz", {});
      expect(baz).not.toHaveBeenCalled();
      bar.mockClear(); baz.mockClear();
    });
  });

  describe("options & default options", () => {
    it("only forwards options", () => {
      const { fn } = mockGuard({
        defaultOptions: {
          bar: "baz",
        }
      }, {
        value: "foo",
        options: {
          baz: "qux"
        }
      });

      expect(fn).toHaveBeenCalledWith("foo", {
        baz: "qux"
      }, [], undefined);
    });

    it("overrides default options with options", () => {
      const { fn } = mockGuard({
        defaultOptions: {
          bar: "baz",
        }
      }, {
        value: "foo",
        options: {
          bar: "qux"
        }
      });

      expect(fn).toHaveBeenCalledWith("foo", {
        bar: "qux"
      }, [], undefined);
    });

    it("calls all option handlers with value but only options", () => {
      const bar = jest.fn(v => v);
      const baz = jest.fn(v => v);

      mockGuard({
        handleOptions: {
          bar,
          baz
        },
        defaultOptions: {
          bar: "baz",
        }
      }, {
        value: "foo",
        options: {
          baz: "qux"
        }
      });

      expect(bar).toHaveBeenCalledWith("foo", "baz", {
        baz: "qux"
      });
      expect(baz).toHaveBeenCalledWith("foo", "qux", {
        baz: "qux"
      });
      bar.mockClear(); baz.mockClear();

      mockGuard({
        handleOptions: {
          bar,
          baz
        },
        defaultOptions: {
          bar: "baz",
        }
      }, {
        value: "foo",
        options: {
          bar: "qux"
        }
      });

      expect(bar).toHaveBeenCalledWith("foo", "qux", {
        bar: "qux"
      });
      expect(baz).not.toHaveBeenCalled();
      bar.mockClear(); baz.mockClear();
    });
  });

  describe("fn transformation", () => {
    it("transforms the value", () => {
      const { res } = mockGuard({
        fn: v => v + "bar"
      }, {
        value: "foo",
      });

      expect(res).toBeValid("foobar");
    });

    it("passes the transfomed value to option handlers", () => {
      const bar = jest.fn(() => true);
      const baz = jest.fn(() => true);

      mockGuard({
        fn: v => v + "bar",
        handleOptions: {
          bar,
          baz
        },
      }, {
        value: "foo",
        options: {
          bar: "baz",
          baz: "qux"
        }
      });

      expect(bar).toHaveBeenCalledWith("foobar", "baz", {
        bar: "baz",
        baz: "qux"
      });
      expect(baz).toHaveBeenCalledWith("foobar", "qux", {
        bar: "baz",
        baz: "qux"
      });
    });
  });

  describe("extra options", () => {
    describe("transform", () => {
      it("transforms the value", () => {
        const { res } = mockGuard({}, {
          value: "foo",
          options: {
            transform: v => v + "bar"
          }
        });

        expect(res).toBeValid("foobar");
      });

      it("transforms the value after calling fn", () => {
        const transform = (v: string) => v + "bar";
        const { fn } = mockGuard({}, {
          value: "foo",
          options: {
            transform
          }
        });

        expect(fn).toHaveBeenCalledWith("foo", {
          transform
        }, [], undefined);
      });

      it("doesn't pass the transformed value to option handlers", () => {
        const transform = (v: string) => v + "bar";
        const bar = jest.fn(v => v);
        const baz = jest.fn(v => v);

        mockGuard({
          handleOptions: {
            bar,
            baz,
          }
        }, {
          value: "foo",
          options: {
            transform,
            bar: "baz",
            baz: 1
          }
        });

        expect(bar).toHaveBeenCalledWith("foo", "baz", {
          transform,
          bar: "baz",
          baz: 1
        });
        expect(baz).toHaveBeenCalledWith("foo", 1, {
          transform,
          bar: "baz",
          baz: 1
        });
        bar.mockClear(); baz.mockClear();
      });

      it("ignores the default options", () => {
        const transform = jest.fn((v: string) => v + "bar");
        const { res } = mockGuard({
          defaultOptions: {
            transform
          },
        }, {
          value: "foo",
          options: {}
        });

        expect(res).toBeValid("foo");
        expect(transform).not.toHaveBeenCalled();
      });
    });

    describe("default", () => {
      it("returns the default value when called with undefined", () => {
        const { res } = mockGuard({}, {
          options: {
            default: "bar"
          }
        });

        expect(res).toBeValid("bar");
      });

      it("isn't used when fn handles undefined", () => {
        const { res } = mockGuard({
          fn: () => "bar"
        }, {
          options: {
            default: "baz"
          }
        });

        expect(res).toBeValid("bar");
      });

      it("ignores additional options", () => {
        const bar = jest.fn(v => v);
        const baz = jest.fn(v => v);

        mockGuard({
          handleOptions: {
            bar,
            baz
          }
        }, {
          options: {
            default: "bar",
            bar: "baz",
            baz: 1
          }
        });

        expect(bar).not.toHaveBeenCalled();
        expect(baz).not.toHaveBeenCalled();
      });

      it("ignores the default options", () => {
        const { name, res } = mockGuard({
          defaultOptions: {
            default: "bar"
          }
        }, {
          options: {}
        });

        expect(res).toBeInvalid({
          message: `vality.${name}.base`,
          options: {},
          path: [],
          value: undefined
        });
      });
    });

    describe("validate", () => {
      it("fails if returns false", () => {
        const validate = () => false;

        const { name, res } = mockGuard({}, {
          value: "foo",
          options: {
            validate
          }
        });

        expect(res).toBeInvalid({
          message: `vality.${name}.custom`,
          options: {
            validate
          },
          path: [],
          value: "foo"
        });
      });

      it("isn't called if fn fails", () => {
        const validate = jest.fn(() => false);

        const { name, res } = mockGuard({
          fn: () => undefined
        }, {
          value: "foo",
          options: {
            validate
          }
        });

        expect(res).toBeInvalid({
          message: `vality.${name}.base`,
          options: {
            validate
          },
          path: [],
          value: "foo"
        });
        expect(validate).not.toHaveBeenCalled();
      });

      it("is called with value and options excluding default options", () => {
        const validate = jest.fn(() => true);

        mockGuard({
          defaultOptions: {
            foo: "bar"
          }
        }, {
          value: "foo",
          options: {
            validate,
            "bar": "baz"
          }
        });

        expect(validate).toHaveBeenCalledWith("foo", {
          validate,
          "bar": "baz"
        });
      });

      it("ignores the default options", () => {
        const validate = jest.fn(() => true);

        const { res } = mockGuard({
          defaultOptions: {
            validate
          }
        }, {
          value: "foo",
          options: {}
        });

        expect(res).toBeValid("foo");
        expect(validate).not.toHaveBeenCalled();
      });
    });
  });
});
