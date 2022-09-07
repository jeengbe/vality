import { diff } from "jest-diff";
import type { Error } from "../lib/validate";

expect.extend({
  callback(received: unknown, callback: (val: unknown) => boolean) {
    const pass = callback(received);
    if (pass) {
      return {
        pass: true,
        message: () => `all good`,
      };
    } else {
      return {
        pass: false,
        message: () => `nay ${this.utils.printReceived(received)}`,
      };
    }
  },
  toBeValid(received: unknown, data?: unknown) {
    const expected = {
      valid: true,
      data: data === undefined ? expect.callback(() => true) : data,
      errors: []
    };

    const pass = this.equals(received, expected);

    if (pass) {
      return {
        pass,
        message: () => "all good",
      };
    } else {
      return {
        pass,
        message: () => {
          const diffString = diff(expected, received, {
            expand: this.expand,
          });
          return (
            this.utils.matcherHint('toBeValid', undefined, undefined) +
            '\n\n' +
            (diffString && diffString.includes('- Expect')
              ? `Difference:\n\n${diffString}`
              : `Expected: ${this.utils.printExpected(expected)}\n` +
              `Received: ${this.utils.printReceived(received)}`)
          );
        },
        actual: received
      };
    }
  },
  toBeInvalid(received, ...errors: Error[]) {
    const expected = {
      valid: false,
      data: undefined,
      errors
    };

    const pass = this.equals(received, expected);

    if (pass) {
      return {
        pass,
        message: () => "all good",
      };
    } else {
      return {
        pass,
        message: () => {
          const diffString = diff(expected, received, {
            expand: this.expand,
          });
          return (
            this.utils.matcherHint('toBeInvalid', undefined, undefined) +
            '\n\n' +
            (diffString && diffString.includes('- Expect')
              ? `Difference:\n\n${diffString}`
              : `Expected: ${this.utils.printExpected(expected)}\n` +
              `Received: ${this.utils.printReceived(received)}`)
          );
        },
        actual: received
      };
    }
  }
});

interface CustomMatchers<R = unknown> {
  callback(callback: (val: unknown) => boolean): unknown;
  toBeValid(data?: unknown): unknown;
  toBeInvalid(...errors: Error[]): unknown;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers { }
    interface Matchers<R> extends CustomMatchers<R> { }
    interface InverseAsymmetricMatchers extends CustomMatchers { }
  }
}

export { };
