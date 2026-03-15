import prettier from 'eslint-config-prettier'
import path from 'node:path'
import js from '@eslint/js'
import globals from 'globals'
import svelte from 'eslint-plugin-svelte'
import svelteConfig from './svelte.config.js'
import { defineConfig } from 'eslint/config'
import { fixupPluginRules, includeIgnoreFile } from '@eslint/compat'
import noCommentedCode from 'eslint-plugin-no-commented-code'
import unicorn from 'eslint-plugin-unicorn'
import ts from 'typescript-eslint'

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore')
const explicitReturnTypeRules = {
	'@typescript-eslint/explicit-function-return-type': 'error',
}

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		plugins: {
			'no-commented-code': fixupPluginRules(noCommentedCode),
			unicorn: unicorn,
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
			'no-commented-code/no-commented-code': 'warn', // or 'error'
			'unicorn/no-null': 'error',
		},
	},
	{
		files: ['**/*.ts'],
		rules: explicitReturnTypeRules,
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig,
			},
		},
		rules: explicitReturnTypeRules,
	},
)
