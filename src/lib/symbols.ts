// All guards must contain this symbol
// It is called when validating
export const _validate = Symbol("validate");

// These symbols are used to infer the resolved type of a guard/valit
export const _type = Symbol("type");
// Undefined needs its extra symbol as [_type]? may always be undefined we thus cannot differentiate between not set and T | undefined
// This simply contains a boolean value on whether to include undefined in the type
export const _undefined = Symbol("valit");

// This symbol is used to distingush between a guard and a valit
export const _valit = Symbol("valit");
