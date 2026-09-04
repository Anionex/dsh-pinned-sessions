import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { isAbsolute } from 'node:path'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
const workspace = await readFile(new URL('pnpm-workspace.yaml', root), 'utf8')

test('package is a portable, prebuilt DSH Profile Bundle', async () => {
  assert.equal(pkg.name, '@anionex/dsh-pinned-sessions')
  assert.notEqual(pkg.private, true)
  assert.equal(pkg.repository?.url, 'git+https://github.com/Anionex/dsh-pinned-sessions.git')
  assert.equal(pkg.dsh?.bundle?.patch, './cordis.patch.yml')
  assert.deepEqual(pkg.dsh?.client, {
    platform: 'web',
    inject: [
      '@deepseek-ai/dsh-client-ui-renderer',
      '@deepseek-ai/dsh-client-ui-layout',
      '@deepseek-ai/dsh-client-ui-session',
      '@deepseek-ai/dsh-client-ui-workspace',
      '@deepseek-ai/dsh-client-ui-primitives',
      '@deepseek-ai/dsh-client-locale',
    ],
  })
  assert.deepEqual(pkg.dsh?.compatibility?.profiles, ['web', 'desktop'])
  assert.equal(pkg.peerDependencies?.['@deepseek-ai/dsh-client-ui-primitives'], '>=0.1.0-rc.8 <0.2.0')
  assert.equal(pkg.dshClient, undefined)
  assert.equal(pkg.main, 'lib/index.js')
  assert.equal(pkg.types, 'lib/types/index.d.ts')
  assert.ok(pkg.files.includes('assets'))
  assert.ok(pkg.files.includes('lib'))
  assert.ok(pkg.files.includes('src'))
  assert.ok(pkg.files.includes('scripts'))
  assert.ok(pkg.files.includes('cordis.patch.yml'))
  assert.equal(typeof pkg.scripts?.build, 'string')
  assert.equal(typeof pkg.scripts?.prepack, 'string')
  assert.match(workspace, /^packages:\n  - \.\n/mu)
  assert.match(workspace, /^nodeLinker: hoisted$/mu)
  assert.match(workspace, /^autoInstallPeers: false$/mu)

  await access(new URL(pkg.main, root))
  await access(new URL(pkg.types, root))
  await access(new URL(pkg.exports['./client'].default, root))
  await access(new URL(pkg.exports['./client'].types, root))
  await access(new URL(pkg.dsh.bundle.patch, root))
  const clientBundle = await readFile(new URL(pkg.exports['./client'].default, root), 'utf8')
  assert.match(
    clientBundle,
    /^window\.__ModuleLoader__\.load\(\{ id: "@anionex\/dsh-pinned-sessions"/u,
  )
  assert.doesNotMatch(clientBundle, /\bReact\.createElement\b/u)
  assert.match(clientBundle, /require\("@deepseek-ai\/dsh-client-ui-primitives"\)/u)

  for (const [name, specifier] of Object.entries(pkg.devDependencies ?? {})) {
    assert.equal(
      isAbsolute(specifier) || /^(?:file|link):/u.test(specifier) || /^[A-Za-z]:[\\/]/u.test(specifier),
      false,
      `devDependency ${name} must not use a machine-local path: ${specifier}`,
    )
  }
})
