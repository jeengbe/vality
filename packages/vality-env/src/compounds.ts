import { enyToGuardFn, v, compound, Eny, Compound } from "vality";

declare global {
  namespace vality {
    interface compounds {
      env: <Env extends string, E extends Eny>(
        env: Env,
        e: E
      ) => Compound<"env", E>;
    }
  }
}

v.env = compound("env", (env, e) => (value, _, context, path) => {
  return enyToGuardFn(e)(process.env[env], context, path, value);
});
