import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {mkdtempSync, readFileSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

const packageDirectory = fileURLToPath(new URL('../', import.meta.url))
const npm = process.env.npm_execpath
assert.ok(npm, 'Run this check with npm run test:package')

const consumer = mkdtempSync(join(tmpdir(), 'artifact-package-'))
const env = {...process.env}
delete env.NODE_PATH

function runNpm(args, cwd) {
  return execFileSync(process.execPath, [npm, ...args], {
    cwd,
    env,
    encoding: 'utf8'
  })
}

try {
  const [{filename}] = JSON.parse(
    runNpm(
      ['pack', '--json', '--ignore-scripts', '--pack-destination', consumer],
      packageDirectory
    )
  )
  runNpm(
    [
      'install',
      '--omit=dev',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--package-lock=false',
      join(consumer, filename)
    ],
    consumer
  )

  const manifest = JSON.parse(
    readFileSync(
      join(consumer, 'node_modules/@actions/artifact/package.json'),
      'utf8'
    )
  )
  assert.equal(manifest.dependencies['@protobuf-ts/runtime-rpc'], '^2.11.1')
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `
        import assert from 'node:assert/strict'
        import {createRequire} from 'node:module'
        import client, {DefaultArtifactClient} from '@actions/artifact'
        import {ServiceType} from '@protobuf-ts/runtime-rpc'

        assert.ok(client instanceof DefaultArtifactClient)
        assert.equal(typeof ServiceType, 'function')
        const require = createRequire(import.meta.url)
        assert.throws(() => require.resolve('@protobuf-ts/plugin'), {
          code: 'MODULE_NOT_FOUND'
        })
      `
    ],
    {cwd: consumer, env, stdio: 'inherit'}
  )
  console.log(
    'Packed artifact imports successfully with production dependencies'
  )
} finally {
  rmSync(consumer, {recursive: true, force: true})
}
