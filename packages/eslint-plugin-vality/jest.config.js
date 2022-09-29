// @ts-check

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  coverageReporters: ["lcov", "json-summary", "text-summary"],
  verbose: true,
  transform: {
    "^.+\\.ts?$": "@swc/jest",
  }
};
