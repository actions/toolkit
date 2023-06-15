import type {Options} from 'tsup'

import {defineConfig} from 'tsup'

// @ts-check

export default defineConfig(() => {
  const common: Options = {
    entry: ['src'],
    bundle: false,
    clean: true,
    keepNames: true,
    minify: false,
    minifyWhitespace: false,
    sourcemap: true,
    /**
     * legacyOutput outputs to different folders
     */
    // legacyOutput: true,
    splitting: false,
    treeshake: false,
    dts: false,
    platform: 'node',
    target: 'node16.20.0',
    shims: true
  }

  const esm: Options = {
    ...common,
    format: 'esm',
    outDir: './lib/esm'
  }

  const cjs: Options = {
    ...common,
    format: 'cjs',
    outDir: './lib/cjs'
  }

  return [esm, cjs]
})
