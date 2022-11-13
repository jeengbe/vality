import { v } from "vality";
import { getName } from "vality/typeUtils";

describe("flag()", () => {
  describe("options", () => {
    it("works with no options", () => {});

    it("works with an options object", () => {});
  });

  describe("options function", () => {
    it("works", () => {});

    it("receives the parent object", () => {});

    it("receives the context object", () => {});
  });

  describe("symbols (copied flagged Short)", () => {
    describe("no options", () => {
      it("attaches [_guard] (proxied)", () => {});

      it("attaches [_type]", () => {});

      it("attaches [_name]", () => {});
    });

    describe("options object", () => {
      it("attaches [_guard] (proxied)", () => {});

      it("attaches [_type]", () => {});

      it("attaches [_name]", () => {});
    });

    describe("options function", () => {
      it("attaches [_guard] (proxied)", () => {});

      it("attaches [_type]", () => {});

      it("attaches [_name]", () => {});
    });
  });

  it("receives the flagged Guard", () => {});

  it("proxies the flagged Guard's implementation", () => {});

  it("doesn't affect getName", () => {
    expect(getName(v.optional(v.string))).toBe("string");
    expect(getName(v.optional(v.string({})))).toBe("string");
  });
});
