import "./config";

// Import inbuilt Guards and Valits
import "./compounds";
import "./flags";
import "./scalars";

// Export Vality
export * from "./parse";
export * from "./validate";
export * from "./vality";

// Stuff for extending Vality
export * from "./utils";
export * from "./typeUtils";
export { scalar, extendScalar, Scalar, ScalarFn } from "./scalar";
export { compound, Compound, CompoundFn } from "./compound";
