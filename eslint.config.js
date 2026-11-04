// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'dist-native/*'],
  },
  {
    // i18next's documented API is the default instance (`i18n.use(...).init(...)`).
    files: ['src/core/i18n/**'],
    rules: { 'import/no-named-as-default-member': 'off' },
  },
]);
