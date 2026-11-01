#!/usr/bin/env node
// Exercise the packed package in an independent Expo app, never the source tree.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const packageName = require('../package.json').name
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-live-flv-smoke-'))
const consumer = path.join(scratch, 'consumer')
const offline = process.argv.includes('--offline')
const keep = process.argv.includes('--keep')
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const env = { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1', EXPO_NO_DOTENV: '1' }

function run(args, cwd = consumer, capture = false) {
  const result = spawnSync(pnpm, args, {
    cwd, env, encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`pnpm ${args.join(' ')} failed (${result.status})`)
  return result.stdout
}

try {
  run(['pack', '--pack-destination', scratch], root)
  const archives = fs.readdirSync(scratch).filter(name => name.endsWith('.tgz'))
  assert.equal(archives.length, 1)
  fs.mkdirSync(consumer)
  for (const name of ['App.tsx', 'index.js', 'tsconfig.json', 'app.json']) {
    fs.copyFileSync(path.join(root, 'example', name), path.join(consumer, name))
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'example/package.json'), 'utf8'))
  manifest.dependencies[packageName] = `file:${path.join(scratch, archives[0])}`
  // Versions come from the installed Expo SDK's own compatibility manifest.
  const bundled = require('expo/bundledNativeModules.json')
  manifest.dependencies['react-dom'] = bundled['react-dom']
  manifest.dependencies['react-native-web'] = bundled['react-native-web']
  fs.writeFileSync(path.join(consumer, 'package.json'), JSON.stringify(manifest, null, 2))
  run(['install', '--ignore-scripts', '--no-frozen-lockfile', ...(offline ? ['--offline'] : [])])
  run(['exec', 'tsc', '--noEmit'])

  const config = JSON.parse(run(['exec', 'expo', 'config', '--type', 'introspect', '--json'], consumer, true))
  assert.ok(!config._internal.modResults.ios.infoPlist.UIBackgroundModes?.includes('audio'),
    'Default plugin must not enable background audio')
  const app = JSON.parse(fs.readFileSync(path.join(consumer, 'app.json'), 'utf8'))
  app.expo.plugins = [[packageName, { supportsBackgroundPlayback: true }]]
  fs.writeFileSync(path.join(consumer, 'app.json'), JSON.stringify(app, null, 2))
  const background = JSON.parse(run(['exec', 'expo', 'config', '--type', 'introspect', '--json'], consumer, true))
  assert.ok(background._internal.modResults.ios.infoPlist.UIBackgroundModes.includes('audio'),
    'Opt-in plugin must enable background audio')
  run(['exec', 'expo', 'export', '--platform', 'all', '--source-maps', '--output-dir', 'dist'])
  const webDir = path.join(consumer, 'dist/_expo/static/js/web')
  const maps = fs.readdirSync(webDir).filter(name => name.endsWith('.map'))
  assert.ok(maps.length > 0, 'Expected web source maps')
  const sources = maps.flatMap(name => JSON.parse(fs.readFileSync(path.join(webDir, name), 'utf8')).sources)
  assert.ok(sources.some(name => name.endsWith(`/${packageName}/build/LiveFlvPlayer.web.js`)),
    'Web bundle must resolve the unsupported web adapter')
  assert.ok(!sources.some(name => name.includes('/expo-libvlc-player/')),
    'Web bundle must not include the upstream native binding')
  console.log('Package smoke passed: tarball install, types, default/opt-in plugin, Android/iOS/web bundles.')
  console.log('Native compilation and device playback are separate checks; see DEVICE_TESTING.md.')
} finally {
  if (keep) console.log(`Smoke workspace kept at ${scratch}`)
  else fs.rmSync(scratch, { recursive: true, force: true })
}
