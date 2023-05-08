/** @type {import("prettier").Config} */
module.exports = {
  bracketSpacing: true,
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',

  pluginSearchDirs: ['.'],
  plugins: [
    require('@trivago/prettier-plugin-sort-imports'),
    require('prettier-plugin-tailwindcss'),
  ],

  // Import plugin
  importOrder: ['^node:', '<THIRD_PARTY_MODULES>', '^~', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
}
