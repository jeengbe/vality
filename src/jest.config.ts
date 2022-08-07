import type { Config } from "jest";

const config: Config = {
  coverageReporters: ["lcov", "json-summary", "text-summary"],
  verbose: true,
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  setupFilesAfterEnv: ["./tests/machers.ts"],
  globals: {
    "ts-jest": {
      tsconfig: "./tests/tsconfig.json",
    },
  },
};
export default config;
