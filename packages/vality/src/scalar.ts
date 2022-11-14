import { CompoundFn } from "./compound";
import { _guard } from "./symbols";
import { types } from "./types";
import { getName } from "./typeUtils";
import { RSA } from "./utils";
import { FnArgs, Guard, makeValit, Valit, ValitParameters } from "./valit";

export type Scalar<Name, Type, Options extends RSA = never> = Valit<
  Name,
  Type,
  Options,
  false
>;

type GetScalarOptions<
  Name extends keyof vality.scalars,
  P = vality.scalars[Name]
> = P extends Scalar<any, infer Type, infer Options>
  ? [Type, Options]
  : P extends (...args: any[]) => Scalar<any, infer Type, infer Options>
  ? [Type, Options]
  : never;

export interface ScalarFn<
  BaseType,
  Options,
  ValueType = unknown,
  NewType = BaseType
> {
  (...args: FnArgs<NewType, Options, ValueType>): NewType | undefined;
}

export function scalar<
  Name extends keyof vality.scalars,
  Type extends GetScalarOptions<Name>[0],
  Options extends GetScalarOptions<Name>[1]
>(
  ...[name, scalarFn, handleOptions, defaultOptions]: ValitParameters<
    Name,
    Type,
    Options,
    ScalarFn<Type, Options>
  >
): Valit<Name, Type, Options, false> {
  return makeValit<Name, [ScalarFn<Type, Options>], Type, Options, false>(
    name,
    (fn: ScalarFn<Type, Options>): CompoundFn<Type, Options> =>
      (value, options, context, path, parent) => {
        const res = fn(value, options, context, path, parent);
        if (res !== undefined) {
          return {
            valid: true,
            data: res,
            errors: [],
          };
        }

        return {
          valid: false,
          data: undefined,
          errors: [
            {
              message: `vality.${name}.base`,
              path,
              options,
              value,
            },
          ],
        };
      },
    handleOptions,
    defaultOptions
  )(scalarFn);
}

type GetScalars<S> = S extends (...args: any[]) => infer R ? R : S;

export function extendScalar<
  Base extends GetScalars<vality.scalars[keyof vality.scalars]>,
  BaseType extends Base extends Guard<any, infer Type, any> ? Type : never
>(base: Base) {
  return function extendedScalar<
    Name extends keyof vality.scalars,
    Type extends GetScalarOptions<Name>[0],
    Options extends GetScalarOptions<Name>[1]
  >(
    ...[name, scalarFn, handleOptions, defaultOptions]: ValitParameters<
      Name,
      Type,
      Options,
      ScalarFn<BaseType, Options, BaseType, Type>
    >
  ): Valit<Name, Type, Options, false> {
    types.set(name, getName(base));
    return scalar<Name, Type, Options>(
      name,
      (val, options, context, path, parent) => {
        const res = base[_guard](val, context, path, parent);
        if (!res.valid) return undefined;
        return scalarFn(res.data as BaseType, options, context, path, parent);
      },
      handleOptions,
      defaultOptions
    );
  };
}
