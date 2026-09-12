import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
export default defineConfig([
  globalIgnores(['dist', 'test-results', 'playwright-report']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser, parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
  { files: ['server/**/*.js', 'scripts/**/*.js', 'tests/**/*.js', '*.config.js'], languageOptions: { globals: globals.node } },
  // Context hooks intentionally share their provider module; changes reload it.
  { files: ['src/context/*.jsx'], rules: { 'react-refresh/only-export-components': ['error', { allowExportNames: ['useAuth', 'useTheme', 'useToast', 'useUI'] }] } },
]);

