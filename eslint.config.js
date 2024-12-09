import stylistic from '@stylistic/eslint-plugin';
import parserTs from '@typescript-eslint/parser';
import unusedImports from "eslint-plugin-unused-imports";

/** @type {import('eslint').Linter.Config} */
export default [
    {
        ...stylistic.configs.customize({
            // the following options are the default values
            indent: 4,
            quotes: 'single',
            semi: true,
            jsx: true,
            arrowParens: true,
        }),
        plugins: {
            "unused-imports": unusedImports,
        },
        rules: {
            "unused-imports/no-unused-imports": "error",
        },
        languageOptions: {
            parser: parserTs,
        },
        files: [
            'data/src/**/*.ts',
            'extraction/src/**/*.ts',
            'extraction/src/**/*.tsx',
        ],
    },
    {
        ignores: [
            '.venv/*',
            'node_modules/*',
            '**/*.js',
        ],
    }
];
