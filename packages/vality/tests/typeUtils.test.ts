import { v } from "vality";
import { _guard, _name, _type } from "vality/symbols";
import { types } from "vality/types";
import { getName, intersect, simplifyEnum } from "vality/typeUtils";

describe("intersect()", () => {
  // The reason we do this weird callback stuff is because we want to test for instance equality
  it("returns global never for no members", () => {
    expect(intersect([])).callback(
      (x: any) => x.length === 1 && x[0] === v.never
    );
  });

  it("returns global any if only any passed", () => {
    expect(intersect([v.any])).callback(
      (x: any) => x.length === 1 && x[0] === v.any
    );
    expect(intersect([v.any({})])).callback(
      (x: any) => x.length === 1 && x[0] === v.any
    );
  });

  it("returns the member if only one specified", () => {
    const guard = v.string({});
    expect(intersect([guard])).callback(
      (x: any) => x.length === 1 && x[0] === guard
    );
  });

  it("returns global never if one of the members is never", () => {
    expect(intersect([v.string, v.never, v.boolean])).callback(
      (x: any) => x.length === 1 && x[0] === v.never
    );
  });

  it("flattens nested anys", () => {
    // @ts-expect-error
    expect(intersect([v.and("a", "b"), v.and("c", "d")])).callback(
      (x: any) =>
        x.length === 4 &&
        x[0][_type][0][_type] === "a" &&
        x[1][_type][0][_type] === "b" &&
        x[2][_type][0][_type] === "c" &&
        x[3][_type][0][_type] === "d"
    );
  });
});

describe("simplifyEnum()", () => {
  it("returns global never if no members", () => {
    expect(simplifyEnum([])).callback(
      (x: any) => x.length === 1 && x[0] === v.never
    );
  });

  it("returns global never if only never passed", () => {
    expect(simplifyEnum([v.never])).callback(
      (x: any) => x.length === 1 && x[0] === v.never
    );
  });

  it("returns global any if a member is any", () => {
    expect(simplifyEnum([v.any])).callback(
      (x: any) => x.length === 1 && x[0] === v.any
    );
  });

  it("returns the member if only one specified", () => {
    const guard = v.string({});
    expect(simplifyEnum([guard])).callback(
      (x: any) => x.length === 1 && x[0] === guard
    );
  });

  it("flattens nested enums", () => {
    expect(simplifyEnum([v.enum("a", "b"), v.enum("c", "d")])).callback(
      (x: any) =>
        x.length === 4 &&
        x[0][_type][0][_type] === "a" &&
        x[1][_type][0][_type] === "b" &&
        x[2][_type][0][_type] === "c" &&
        x[3][_type][0][_type] === "d"
    );
  });

  it("reduces string literals and string type to string type", () => {
    expect(simplifyEnum(["a", v.string({}), "b"])).callback(
      (x: any) => x.length === 1 && getName(x[0]) === "string"
    );
    expect(simplifyEnum(["a", v.string, "b"])).callback(
      (x: any) => x.length === 1 && getName(x[0]) === "string"
    );
  });

  it("reduces number literals and number type to number type", () => {
    expect(simplifyEnum([1, v.number({}), -1])).callback(
      (x: any) => x.length === 1 && getName(x[0]) === "number"
    );
    expect(simplifyEnum([1, v.number, -1])).callback(
      (x: any) => x.length === 1 && getName(x[0]) === "number"
    );
  });

  it("returns global string and number if both string and number types are in union", () => {
    expect(simplifyEnum([v.string, "a", "b", 0, 1, v.number])).callback(
      (x: any) => x.length === 2 && x[0] === v.string && x[1] === v.number
    );

    expect(simplifyEnum([v.string, v.number])).callback(
      (x: any) => x.length === 2 && x[0] === v.string && x[1] === v.number
    );
  });
});

describe("getName", () => {
  it("resolves the name of own scalars", () => {
    expect(getName(v.string)).toBe("string");
    expect(getName(v.string({}))).toBe("string");
    expect(getName(v.number)).toBe("number");
    expect(getName(v.number({}))).toBe("number");
    expect(getName(v.boolean)).toBe("boolean");
    expect(getName(v.boolean({}))).toBe("boolean");
    expect(getName(v.date)).toBe("date");
    expect(getName(v.date({}))).toBe("date");
    expect(getName(v.any)).toBe("any");
    expect(getName(v.any({}))).toBe("any");
    expect(getName(v.never)).toBe("never");
    expect(getName(v.never({}))).toBe("never");
    expect(getName(v.literal(5))).toBe("literal");
    expect(getName(v.literal(5)({}))).toBe("literal");
  });

  it("resolves the name of own compounds", () => {
    expect(getName(v.array(v.string))).toBe("array");
    expect(getName(v.array(v.string)({}))).toBe("array");
    expect(getName(v.tuple(v.string, v.number))).toBe("tuple");
    expect(getName(v.tuple(v.string, v.number)({}))).toBe("tuple");
    expect(getName(v.object({ foo: v.string }))).toBe("object");
    expect(getName(v.object({ foo: v.string })({}))).toBe("object");
    expect(getName(v.dict("foo", v.string))).toBe("dict");
    expect(getName(v.dict("foo", v.string)({}))).toBe("dict");
    expect(getName(v.enum("foo", "bar"))).toBe("enum");
    expect(getName(v.enum("foo", "bar")({}))).toBe("enum");
    expect(getName(v.and({ foo: v.any }, { bar: v.any }))).toBe("and");
    expect(getName(v.and({ foo: v.any }, { bar: v.any })({}))).toBe("and");
  });

  it("ignores flags", () => {
    expect(getName(v.optional(v.readonly(v.from("x")(v.string))))).toBe(
      "string"
    );
  });

  it("resolves custom types from the map", () => {
    types.set("foo", "string");
    // @ts-expect-error Our [_guard] is... questionable but required for this no to be interpreted as an object Short
    expect(getName({[_name]: "foo", [_guard]: "I'm just here"})).toBe("string");
  });

  it("throws on circular types", () => {
    types.set("foo", "bar");
    types.set("bar", "foo");
    // @ts-expect-error
    expect(() => getName({[_name]: "foo", [_guard]: "I'm just here"})).toThrow("Circular type extension");
  });
});
