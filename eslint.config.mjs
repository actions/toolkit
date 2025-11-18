import { defineConfig } from "eslint/config";
import jest from "eslint-plugin-jest";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier";
import github from "eslint-plugin-github";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
{
    ignores: [
        "packages/glob/__tests__/_temp/**/*",
        "packages/*/src/generated/**",
        "**/lib/**",
        "**/node_modules/**",
        ".nx/**"
    ]
},
js.configs.recommended,
...tseslint.configs.recommended,
{
    plugins: {
        jest,
        prettier,
        github,
    },

    languageOptions: {
        globals: {
            ...globals.node,
            ...jest.environments.globals.globals,
        },

        parser: tseslint.parser,
        ecmaVersion: 9,
        sourceType: "module",
    },

    rules: {
        "prettier/prettier": ["error", {
            endOfLine: "auto",
        }],

        "eslint-comments/no-use": "off",

        "no-constant-condition": ["error", {
            checkLoops: false,
        }],

        "github/no-then": "off",
        "import/no-namespace": "off",
        "import/first": "off",
        "import/extensions": "off",
        "no-shadow": "off",
        "no-unused-vars": "off",
        "i18n-text/no-en": "off",
        "filenames/match-regex": "off",
        "import/no-commonjs": "off",
        "import/named": "off",
        "no-sequences": "off",
        "import/no-unresolved": "off",
        "no-undef": "off",
        "no-only-tests/no-only-tests": "off",
        "no-async-promise-executor": "warn",
        "no-prototype-builtins": "warn",
        "@typescript-eslint/no-unsafe-function-type": "warn",
        "@typescript-eslint/no-unused-vars": ["warn", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_|^err$"
        }],

        "@typescript-eslint/explicit-member-accessibility": ["error", {
            accessibility: "no-public",
        }],

        "@typescript-eslint/no-require-imports": "error",
        "@typescript-eslint/array-type": "error",
        "@typescript-eslint/ban-ts-comment": "error",
        camelcase: "off",
        "@typescript-eslint/consistent-type-assertions": "off",

        "@typescript-eslint/explicit-function-return-type": ["error", {
            allowExpressions: true,
        }],

        "@typescript-eslint/naming-convention": ["error", {
            format: null,

            filter: {
                regex: "^[A-Z][A-Za-z]*$",
                match: true,
            },

            selector: "memberLike",
        }],

        "@typescript-eslint/no-array-constructor": "error",
        "@typescript-eslint/no-empty-interface": "error",
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-extraneous-class": "error",
        "@typescript-eslint/no-inferrable-types": "error",
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-namespace": "error",
        "@typescript-eslint/no-non-null-assertion": "warn",
        "@typescript-eslint/no-useless-constructor": "error",
        "@typescript-eslint/no-var-requires": "error",
        "@typescript-eslint/prefer-for-of": "warn",
        "@typescript-eslint/prefer-function-type": "warn",
    },
}]);