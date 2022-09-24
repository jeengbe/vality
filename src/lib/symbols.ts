// All guards must contain this symbol
// It is called when validating
export const _validate = Symbol("validate");

export const _type = Symbol("type");
export const _name = Symbol("name");
export const _options = Symbol("options");

// This symbol is used to distingush between a guard and a valit
export const _valit = Symbol("valit");
// Used to mark valits that require special Parse treatment
export const _specialValit = Symbol("specialValit");
