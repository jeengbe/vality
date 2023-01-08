/**
 * @type {import('jest').Config}
 */
const config = {
  coverageReporters: ["lcov"],
  verbose: true,
  transform: {
    "^.+\\.ts?$": "@swc/jest",
  },
  setupFilesAfterEnv: ["./tests/_matchers.ts"],
  moduleNameMapper: {
    "^vality-env$": "<rootDir>/src",
    "^vality-env/(.*)$": "<rootDir>/src/$1",
  },
};

module.exports = config;
