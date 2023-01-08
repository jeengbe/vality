import { RSE, validate, _guard, _name } from "vality";
import "./compounds";

export function loadEnv<E extends RSE>(config: E) {
  const values = populateConfig(config);
  return validate<E>(config, values);
}

function populateConfig(config: RSE, path: readonly string[] = []) {
  const values: Record<string, any> = {};
  for (const key in config) {
    const value = config[key];
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      _guard in value === false
    ) {
      values[key as keyof typeof values] = populateConfig(value as RSE, [
        ...path,
        ...convertToSnakeCase(key).toUpperCase().split("_"),
      ]);
      continue;
    }

    values[key as keyof typeof values] =
      process?.env?.[
        [...path, convertToSnakeCase(key).toUpperCase()].join("_")
      ];
  }
  return values;
}

function convertToSnakeCase(input: string) {
  return input.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
