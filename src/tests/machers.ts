expect.extend({
  toBeValid(received: unknown) {
    // @ts-ignore
    const pass = typeof received === "object" && received !== null && "valid" in received && received.valid;

    if (pass) {
      return {
        pass: true,
        message: () => `yay`,
      };
    } else {
      return {
        pass: false,
        message: () => `nay ${this.utils.printReceived(received)}`,
      };
    }
  },
  toBeInvalid(received, ...errors: string[]) {
    // @ts-ignore
    let pass = typeof received === "object" && received !== null && !received.valid;

    if(errors.length > 0) pass &&= received.errors.length === errors.length;
    if (pass) {
      for (let i = 0; i < errors.length; i++) {
        if(received.errors[i].message !== errors[i]) {
          pass = false;
          break;
        }
      }
    }

    if (pass) {
      return {
        pass: true,
        message: () => `yay`,
      };
    } else {
      return {
        pass: false,
        message: () => `nay ${this.utils.printReceived(received)}`,
      };
    }
  },
});

interface CustomMatchers<R = unknown> {
  toBeValid(): unknown;
  toBeInvalid(...errors: string[]): unknown;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}

export { };
