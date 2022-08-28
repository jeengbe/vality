import { validate } from "../lib";
import { guard as _guard } from "../lib/guard";
import { identity, RSA } from "../lib/utils";

function guard(
  implementation: {
    name?: string;
    fn?: (...args: any[]) => any;
    expect?: any;
    handleOptions?: RSA;
    defaultOptions?: RSA;
  } = {},
  call: {
    value?: any;
    options?: RSA;
  } = {},
  result: {
    valid?: boolean;
    value?: any;
    errors?: {
      message?: string;
      path?: any;
      options?: any;
      value?: any;
    }[];
  } = {},
  fnCall: {
    value?: any;
    options?: RSA;
  } = {}
) {
  const {
    name = "test",
    fn: _fn = implementation.expect !== undefined ? (s: any) => (s === implementation.expect ? s : undefined) : identity,
    handleOptions,
    defaultOptions,
  } = implementation;
  const fn = jest.fn(_fn);
  const { value, options } = call;
  const { valid, value: resultValue, errors } = result;
  const { value: fnCallValue, options: fnCallOptions } = fnCall;

  let guard = _guard(name as any, fn, handleOptions, defaultOptions);
  if (options !== undefined) guard = guard(options) as any;

  const res = validate(guard, value);

  if (fnCallValue !== undefined) {
    expect(fn.mock.lastCall[0]).toEqual(fnCallValue);
  }
  if (fnCallOptions !== undefined) {
    expect(fn.mock.lastCall[1]).toEqual(fnCallOptions);
  }

  if (valid !== undefined) {
    expect(res.valid).toBe(valid);
  }
  if (resultValue !== undefined) {
    expect(res.data).toEqual(resultValue);
  }
  if (errors !== undefined) {
    expect(res.errors).toEqual(errors.map((e, i) => ({ ...e, ...res.errors[i] })));
  }
}

describe("guard()", () => {
  describe("merges options with default options", () => {
    it("called without options", () => {
      guard(
        {},
        {},
        {},
        {
          options: {},
        }
      );

      guard(
        {
          defaultOptions: {
            foo: "bar",
          },
        },
        {},
        {},
        {
          options: { foo: "bar" },
        }
      );

      guard(
        {
          defaultOptions: {
            foo: "bar",
            bar: "baz",
          },
        },
        {},
        {},
        {
          options: { foo: "bar", bar: "baz" },
        }
      );
    });

    it("called with options", () => {
      guard(
        {
          defaultOptions: { foo: "bar" },
        },
        {
          options: { foo: "bar" },
        },
        {},
        {
          options: { foo: "bar" },
        }
      );

      guard(
        {
          defaultOptions: { foo: "bar" },
        },
        {
          options: { foo: "baz" },
        },
        {},
        {
          options: { foo: "baz" },
        }
      );

      guard(
        {
          defaultOptions: { foo: "bar" },
        },
        {
          options: { bar: "baz" },
        },
        {},
        {
          options: { bar: "baz", foo: "bar" },
        }
      );
    });
  });

  describe("matches valid data", () => {
    describe("defined without options", () => {
      it("called without options", () => {
        guard(
          {
            expect: "foo",
          },
          {
            value: "foo",
          },
          {
            value: "foo",
          },
          {
            value: "foo",
          }
        );
      });

      it("called with options", () => {
        guard(
          {
            expect: "foo",
          },
          {
            value: "foo",
            options: { foo: "bar" },
          },
          {
            value: "foo",
          },
          {
            value: "foo",
            options: { foo: "bar" },
          }
        );
      });
    });

    describe("defined with options", () => {
      it("called without options", () => {
        guard(
          {
            expect: "foo",

          }
        )
      })
    })
  });

  describe("transforms data", () => {
    it("defined with transform", () => {
      guard(
        {
          handleOptions: {
            transform: (s: string) => s.toUpperCase(),
          },
        },
        {
          value: "foo",
        },
        {
          value: "FOO",
        }
      );
    });

    it("called with transform", () => {
      guard(
        {},
        {
          value: "foo",
          options: {
            transform: (s: string) => s.toUpperCase(),
          },
        },
        {
          value: "FOO",
        }
      );
    });

    it("defined and called with transform", () => {
      guard(
        {
          handleOptions: {
            transform: (s: string) => `${s}-bar`,
          },
        },
        {
          value: "foo",
          options: {
            transform: (s: string) => s.toUpperCase(),
          },
        },
        {
          value: "FOO-BAR",
        }
      );
    });
  });
});
