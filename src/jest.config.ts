import type { Config } from "jest";

const config: Config = {
  coverageReporters: ["lcov", "json-summary", "text-summary"],
  verbose: true,
  transform: {
    "^.+\\.ts?$": [
      "ts-jest",
      {
        tsconfig: "./tests/tsconfig.json",
      }
    ],
  },
  setupFilesAfterEnv: ["./tests/_matchers.ts"],
  moduleNameMapper: {
    "^vality$": "<rootDir>/lib",
    "^vality/(.*)$": "<rootDir>/lib/$1",
  },
};
export default config;
