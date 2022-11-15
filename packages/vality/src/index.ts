import "./config";

// Import inbuilt guards and valits
import "./compounds";
import "./flags";
import "./scalars";

// Export vality
export * from "./parse";
export { extendScalar, Scalar, ScalarFn } from "./scalar";
export * from "./validate";
export * from "./vality";
