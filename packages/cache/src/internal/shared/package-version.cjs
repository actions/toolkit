// This file exists as a CommonJS module to read the version from package.json.
// In an ESM package, using `require()` directly in .ts files requires disabling
// ESLint rules and doesn't work reliably across all Node.js versions.
// By keeping this as a .cjs file, we can use require() naturally and export
// the version for the ESM modules to import.
const packageJson = require('../../../package.json')
module.exports = { version: packageJson.version }
