const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { execFileSync } = require('node:child_process')
const root = path.resolve(__dirname, '..')
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))
const p = read('package.json'), example = read('example/package.json'), targets = read('release-targets.json')
assert.match(p.version, /^\d+\.\d+\.\d+$/, 'Release version must be stable SemVer')
assert.equal(p.private, undefined, 'Library must be packable')
assert.equal(p.publishConfig.access, 'public')
assert.equal(example.version, p.version)
assert.equal(p.name, '@gocfun/expo-live-flv')
assert.equal(example.dependencies[p.name], 'file:..')
assert.equal(p.repository.url, 'git+https://github.com/gocfun/expo-live-flv.git')
for (const [key, value] of Object.entries({ expo: targets.primary.expo, react: targets.primary.react, 'react-native': targets.primary.reactNative })) {
  assert.equal(p.devDependencies[key], value)
  assert.equal(example.dependencies[key], value)
}
assert.equal(p.devDependencies.typescript, targets.primary.typescript)
assert.equal(example.devDependencies.typescript, targets.primary.typescript)
assert.equal(example.dependencies['expo-dev-client'], targets.primary.devClient)
assert.equal(p.peerDependencies['expo-libvlc-player'], targets.binding)
assert.equal(example.dependencies['expo-libvlc-player'], targets.binding)
assert.ok(p.peerDependencies.expo.includes(targets.primary.expo))
const legacy = read('compat/sdk54/package.json')
assert.equal(legacy.dependencies[p.name], 'file:../..')
assert.equal(legacy.dependencies.expo, targets.legacy.expo)
assert.equal(legacy.dependencies['react-native'], targets.legacy.reactNative)
for (const file of ['build/index.js','build/index.d.ts','build/LiveFlvPlayer.web.js','LICENSE','NOTICE.md','README.md','CHANGELOG.md','MIGRATION.md','app.plugin.js','plugin/compat.cjs']) {
  assert.ok(fs.existsSync(path.join(root, file)), `Missing release file: ${file}`)
}
for (const file of fs.readdirSync(path.join(root, 'build')).filter(f => f.endsWith('.js'))) {
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'build', file), 'utf8'), /\bconsole\.(log|warn|error|debug)\s*\(/, 'Runtime must not log source/error data')
}
const cache = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-live-flv-release-'))
try {
  const packed = JSON.parse(execFileSync('npm', ['pack','--dry-run','--json','--ignore-scripts'], {
    cwd: root, env: { ...process.env, npm_config_cache: cache }, encoding: 'utf8', stdio: ['ignore','pipe','pipe'],
  }))[0]
  for (const entry of packed.files) {
    assert.doesNotMatch(entry.path, /(^|\/)(node_modules|\.git|\.env[^/]*)(\/|$)|\.(apk|aab|jks|keystore|so|dylib)$/i, `Unexpected packed file: ${entry.path}`)
  }
  for (const required of ['app.plugin.js', 'plugin/compat.cjs', 'build/index.js', 'build/index.d.ts', 'build/LiveFlvPlayer.web.js']) {
    assert.ok(packed.files.some(file => file.path === required), `Missing packed entry: ${required}`)
  }
  assert.equal(packed.version, p.version)
  console.log(JSON.stringify({ version: p.version, expo: targets.primary.expo, binding: targets.binding,
    files: packed.files.length, packedBytes: packed.size, status: 'package-checks-passed' }, null, 2))
} finally { fs.rmSync(cache, { recursive: true, force: true }) }
