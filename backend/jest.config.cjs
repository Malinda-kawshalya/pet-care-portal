module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFiles: ["<rootDir>/tests/setup-env.js"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/utils/**/*.js",
    "src/middleware/sanitize.middleware.js",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
};
