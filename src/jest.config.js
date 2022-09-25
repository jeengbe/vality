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
    "^vality$": "<rootDir>/lib",
    "^vality/(.*)$": "<rootDir>/lib/$1",
  },
};

module.exports = config;
