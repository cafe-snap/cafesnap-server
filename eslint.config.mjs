import globals from "globals";
import pluginJs from "@eslint/js";


/** @type {import('eslint').Linter.Config[]} */
export default [
  pluginJs.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 2021,
      sourceType: "commonjs",
    },
    rules: {
      "semi": ["error", "always"],
      "quotes": ["warn", "double"],
      "indent": ["warn", 2],
      "prefer-arrow-callback": "warn",
      "curly": ["warn", "all"],
      "eol-last": ["error", "always"],
    },
  },
];
