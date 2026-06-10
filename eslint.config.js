const globals = require("globals");

module.exports = [
  {
    files: ["js/**/*.js", "sw.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
        LQ: "readonly",
        LQ_DATA: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none" }],
      "eqeqeq": ["error", "smart"],
      "no-var": "error",
      "prefer-const": "warn",
      "no-implicit-globals": "error",
    },
  },
  {
    files: ["js/data/*.js"],
    rules: { "no-unused-vars": "off" },
  },
];
