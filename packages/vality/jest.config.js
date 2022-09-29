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
    "^vality$": "<rootDir>/src",
    "^vality/(.*)$": "<rootDir>/src/$1",
  },
};

module.exports = config;
