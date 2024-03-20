module.exports = {
  root: true,

  extends: ["@inker/eslint-config-typescript", "prettier"],

  parser: "@typescript-eslint/parser",

  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"],
  },

  env: {
    node: true,
  },

  settings: {
    "import/resolver": {
      node: {
        paths: ["src"],
      },
    },
  },

  rules: {
    "unicorn/filename-case": 0,
  },
};
