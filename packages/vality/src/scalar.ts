import { CompoundFn } from "./compound";
import { RSA } from "./utils";
import { FnArgs, makeValit, Valit, ValitParameters } from "./valit";

export interface Scalar<Name, Type, Options extends RSA = never>
  extends Valit<Name, Type, Options, false> {}

type GetScalarOptions<
  Name extends keyof vality.scalars,
  P = vality.scalars[Name]
> = P extends Scalar<any, infer Type, infer Options>
  ? [Type, Options]
  : P extends (...args: any[]) => Scalar<any, infer Type, infer Options>
  ? [Type, Options]
  : never;

export interface ScalarFn<Type, Options> {
  (...args: FnArgs<Type, Options>): Type | undefined;
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
    (fn: ScalarFn<Type, Options>): CompoundFn<Type, Options> => {
      const compoundFn: CompoundFn<Type, Options> = (
        value,
        options,
        context,
        path,
        parent
      ) => {
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
      };

      return compoundFn;
    },
    handleOptions,
    defaultOptions
  )(scalarFn);
}
