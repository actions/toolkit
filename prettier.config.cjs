const config = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  trailingComma: 'none',
  bracketSpacing: false,
  arrowParens: 'avoid',
  plugins: [require.resolve('@ianvs/prettier-plugin-sort-imports')],
  importOrder: [
    '',
    '<TYPES>',
    '',
    '<TYPES>^[.]',
    '',
    '<BUILTIN_MODULES>',
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^(@api|@app|@assets|@ui)(/.*)$',
    '',
    '@/(.*)$',
    '^[./]'
  ],
  importOrderTypeScriptVersion: '5.1.3'
}

module.exports = config
