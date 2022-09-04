import { Path, v, validate, ValidationResult } from "vality";
import { _validate } from "vality/symbols";
import { Eny, RSA } from "vality/utils";
import { valit } from "vality/valit";

function mockValit(implementation: {
  name?: string;
  fn?: (...es: Eny[]) => (value: unknown, options: unknown, path: Path,) => ValidationResult<any>;
  handleOptions?: RSA;
  defaultOptions?: RSA;
  inner?: Eny[];
},
  call: {
    value?: any;
    options?: RSA;
  }) {
  let {
    name = "__test__valit__",
    fn: _fn,
    handleOptions,
    defaultOptions,
    inner = []
  } = implementation;
  let ifn: ((value: unknown, options: unknown, path: Path) => ValidationResult<any>) | undefined = undefined;
  if (!_fn) {
    ifn = jest.fn((v: unknown) => ({ valid: true, data: v, errors: [] }));
    _fn = () => ifn!;
  }
  const fn = jest.fn(_fn);
  let v = valit(name as keyof vality.valits, fn, handleOptions, defaultOptions)(...inner);

  const {
    value,
    options
  } = call;

  if (options) v = v(options) as any;

  const res = validate(v, value);

  return { name, res, fn, ifn };
}

describe("valit()", () => {
  it("passes if fn passes", () => {
    const { res } = mockValit({
      fn: () => () => ({ valid: true, data: "foo", errors: [] })
    }, {});

    expect(res).toBeValid("foo");
  });

  it("fails if fn fails", () => {
    const { res } = mockValit({
      fn: () => () => ({
        valid: false, data: undefined, errors: [
          {
            message: "vality.__test__valit.base",
            path: [],
            value: "foo",
            options: {}
          }
        ]
      })
    }, {
      value: "foo"
    });

    expect(res).toBeInvalid({
      message: "vality.__test__valit.base",
      path: [],
      value: "foo",
      options: {}
    });
  });

  describe("options handler", () => {
    it("passes if all return true", () => {
      const { res } = mockValit({
        handleOptions: {
          foo: () => true,
          bar: () => true
        }
      }, {});

      expect(res).toBeValid(undefined);
    });

    it("fails if any return false", () => {
      const { name, res } = mockValit({
        handleOptions: {
          foo: () => true,
          bar: () => false
        }
      }, {
        options: {
          foo: "bar",
          bar: "baz"
        }
      });

      expect(res).toBeInvalid({
        message: `vality.${name}.options.bar`,
        path: [],
        value: undefined,
        options: {
          foo: "bar",
          bar: "baz"
        }
      });
    });

    it("doesn't bail on first failure", () => {
      const { name, res } = mockValit({
        handleOptions: {
          foo: () => false,
          bar: () => false
        }
      }, {
        options: {
          foo: "bar",
          bar: "baz"
        }
      });

      expect(res).toBeInvalid({
        message: `vality.${name}.options.foo`,
        path: [],
        value: undefined,
        options: {
          foo: "bar",
          bar: "baz"
        }
      }, {
        message: `vality.${name}.options.bar`,
        path: [],
        value: undefined,
        options: {
          foo: "bar",
          bar: "baz"
        }
      });
    });

    it("marks errors as base message if specifies by default value", () => {
      const { name, res } = mockValit({
        handleOptions: {
          foo: () => false,
          bar: () => false
        },
        defaultOptions: {
          foo: "bar",
        }
      }, {
        options: {
          bar: "baz"
        }
      });

      expect(res).toBeInvalid({
        message: `vality.${name}.base`,
        path: [],
        value: undefined,
        options: {
          bar: "baz"
        }
      }, {
        message: `vality.${name}.options.bar`,
        path: [],
        value: undefined,
        options: {
          bar: "baz"
        }
      });
    });
  });

  describe("options", () => {
    it("forwards options and value to ifn", () => {
      const { ifn } = mockValit({}, {
        value: "foo",
        options: {
          bar: "baz",
          baz: "qux"
        }
      });

      expect(ifn).toHaveBeenCalledWith("foo", {
        bar: "baz",
        baz: "qux"
      }, [], undefined);
    });

    it("calls all option handlers with value and options", () => {
      const bar = jest.fn(() => true);
      const baz = jest.fn(() => true);

      mockValit({
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

      mockValit({
        handleOptions: {
          bar,
          baz
        }
      }, {
        value: "foo",
        options: {
          bar: "baz",
        }
      });

      expect(bar).toHaveBeenCalledWith("foo", "baz", {
        bar: "baz",
      });
      expect(baz).not.toHaveBeenCalled();
      bar.mockClear(); baz.mockClear();
    });

    it("calls the options callback with the parent structure", () => {
      const options = jest.fn(() => ({}));

      v.array(v.string)(options)[_validate]("foo", [], {
        bar: "baz",
      });

      expect(options).toHaveBeenCalledWith({
        bar: "baz",
      });
    });
  });

  describe("default options", () => {
    it("doesn't forward default options to ifn", () => {
      const { ifn } = mockValit({
        defaultOptions: {
          foo: "bar"
        }
      }, {
        value: "foo"
      });

      expect(ifn).toHaveBeenCalledWith("foo", {}, [], undefined);
    });

    it("calls all option handlers with value but without default options", () => {
      const bar = jest.fn(() => true);
      const baz = jest.fn(() => true);

      mockValit({
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

      mockValit({
        handleOptions: {
          bar,
          baz
        },
        defaultOptions: {
          bar: "baz",
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
      const { ifn } = mockValit({
        defaultOptions: {
          bar: "baz"
        }
      }, {
        value: "foo",
        options: {
          baz: "qux"
        }
      });

      expect(ifn).toHaveBeenCalledWith("foo", {
        baz: "qux"
      }, [], undefined);
    });

    it("overrides default options with options", () => {
      const { ifn } = mockValit({
        defaultOptions: {
          bar: "baz"
        }
      }, {
        value: "foo",
        options: {
          bar: "qux"
        }
      });

      expect(ifn).toHaveBeenCalledWith("foo", {
        bar: "qux"
      }, [], undefined);
    });

    it("calls all option handlers with value but only options", () => {
      const bar = jest.fn(() => true);
      const baz = jest.fn(() => true);

      mockValit({
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

      mockValit({
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
});
