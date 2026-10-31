const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const deps = createRequire(path.join(process.env.FLV_TEST_DEPENDENCY_ROOT || path.resolve(__dirname, '..'), 'package.json'))
const React = deps('react')
const Renderer = deps('react-test-renderer')
global.IS_REACT_ACT_ENVIRONMENT = true
const { act } = Renderer

function setup(nativeAvailable = true, web = false) {
  let now = 0, id = 0, listener = null, nativeLoads = 0
  const timers = new Map()
  const progress = [], statuses = [], sizes = []
  const ref = React.createRef()
  const module = { exports: {} }
  function NativePlayer(props) { return React.createElement('NativePlayer', props) }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, `../build/LiveFlvPlayer${web ? '.web' : ''}.js`), 'utf8'), {
    module, exports: module.exports,
    require: name => {
      if (name === 'react' || name === 'react/jsx-runtime') return deps(name)
      if (name === 'react-native') return { View: 'View', AppState: {
        currentState: 'active', addEventListener: (_, cb) => { listener = cb; return { remove: () => { listener = null } } },
      } }
      if (name === 'expo') return { requireOptionalNativeModule: () => nativeAvailable ? {} : null }
      if (name === 'expo-libvlc-player') { nativeLoads++; if (!nativeAvailable) throw Error('Should not load native binding'); return { LibVlcPlayerView: NativePlayer } }
      if (name === './core') return require('../build/core')
      throw Error(`Unexpected import: ${name}`)
    },
    Date: { now: () => now },
    setTimeout: (callback, ms) => { const key = ++id; timers.set(key, { at: now + ms, callback }); return key },
    clearTimeout: key => timers.delete(key),
  })
  const Component = module.exports.default
  let tree
  let props = {
    source: 'https://example.test/live/test.flv?token=secret', ref,
    onStatusChange: state => statuses.push(state),
    onProgress: p => progress.push(p), onVideoSize: s => sizes.push(s),
  }
  return {
    ref, progress, statuses, sizes, timers,
    get nativeLoads() { return nativeLoads },
    async mount(extra = {}) { props = { ...props, ...extra }; await act(async () => { tree = Renderer.create(React.createElement(Component, props)) }) },
    async update(extra) { props = { ...props, ...extra }; await act(async () => { tree.update(React.createElement(Component, props)) }) },
    async background(state) { await act(async () => listener(state)) },
    native() { return tree.root.findByType('NativePlayer') },
    nativeCount() { return tree.root.findAllByType('NativePlayer').length },
    async event(name, value) { await act(async () => this.native().props[name](value)) },
    async advance(ms) {
      await act(async () => {
        const target = now + ms
        while (true) {
          const next = [...timers].filter(([, t]) => t.at <= target).sort((a,b) => a[1].at-b[1].at)[0]
          if (!next) break
          timers.delete(next[0]); now = next[1].at; next[1].callback()
        }
        now = target
      })
    },
    async layout(width, height) { await act(async () => tree.root.findAllByType('View')[0].props.onLayout({ nativeEvent: { layout: { width, height } } })) },
    async dispose() { await act(async () => tree.unmount()) },
  }
}

test('component releases timers and native view on background, pause, navigation blur and unmount', async () => {
  const f = setup(); await f.mount(); assert.equal(f.nativeCount(), 1)
  const oldEvent = f.native().props.onTimeChanged
  await f.background('background'); assert.equal(f.nativeCount(), 0); assert.equal(f.timers.size, 0)
  await f.background('active'); assert.equal(f.nativeCount(), 1)
  await act(async () => oldEvent({ time: 1000 })); assert.equal(f.progress.length, 0)
  await f.update({ paused: true }); assert.equal(f.nativeCount(), 0); assert.equal(f.timers.size, 0)
  await f.update({ paused: false, active: false }); assert.equal(f.nativeCount(), 0)
  await f.update({ active: true }); assert.equal(f.nativeCount(), 1)
  await f.dispose(); assert.equal(f.timers.size, 0)
})
test('new source tears down old attempt; ref retry creates a fresh attempt after exhaustion', async () => {
  const f = setup(); await f.mount({ retryDelaysMs: [] })
  const oldEvent = f.native().props.onEncounteredError
  await f.update({ source: 'https://other.example.test/live/second.flv' })
  await act(async () => oldEvent({ error: 'secret token must be ignored' }))
  assert.equal(f.nativeCount(), 1)
  await f.event('onEncounteredError', { error: 'private native details' })
  assert.equal(f.nativeCount(), 0); assert.equal(f.statuses.at(-1).status, 'failed')
  assert.equal(JSON.stringify(f.statuses).includes('private'), false)
  await act(async () => f.ref.current.retry())
  assert.equal(f.nativeCount(), 1); assert.equal(f.statuses.at(-1).status, 'loading')
  await f.dispose()
})
test('duplicate errors unmount during backoff and restart only once; unmount cancels retry', async () => {
  const f = setup(); await f.mount({ retryDelaysMs: [1000] })
  const error = f.native().props.onEncounteredError
  await act(async () => { error({}); error({}) })
  assert.equal(f.nativeCount(), 0); assert.equal(f.timers.size, 1)
  await f.advance(1000); assert.equal(f.nativeCount(), 1)
  await f.event('onEndReached'); await f.dispose(); assert.equal(f.timers.size, 0)
})
test('progress is throttled; measured viewport and mute/contain settings reach native view', async () => {
  const f = setup(); await f.mount({ muted: true, contentFit: 'cover' })
  await f.layout(390, 844)
  assert.equal(f.native().props.aspectRatio, 390/844)
  assert.equal(f.native().props.contentFit, 'cover'); assert.equal(f.native().props.mute, true)
  await f.event('onFirstPlay', { width: 1080, height: 1920 }); assert.equal(f.sizes.length, 1)
  await f.event('onTimeChanged', { time: 1000 }); await f.advance(499)
  await f.event('onTimeChanged', { time: 1100 }); assert.equal(f.progress.length, 1)
  await f.advance(1); await f.event('onTimeChanged', { time: 1500 }); assert.equal(f.progress.length, 2)
  assert.equal(f.progress.at(-1).timeSeconds, 1.5)
  await f.dispose()
})
test('Expo Go and web report unsupported without loading upstream native binding', async () => {
  for (const web of [false, true]) {
    const f = setup(false, web); await f.mount()
    assert.equal(f.nativeCount(), 0); assert.equal(f.nativeLoads, 0)
    assert.equal(f.statuses.at(-1).status, 'unsupported'); await f.dispose()
  }
})
test('invalid URL never reaches native player and is not included in status callbacks', async () => {
  const f = setup(); await f.mount({ source: 'http://user:secret@example.test/live/test.flv' })
  assert.equal(f.nativeCount(), 0); assert.equal(f.statuses.at(-1).reason, 'invalid-source')
  assert.equal(JSON.stringify(f.statuses).includes('secret'), false); await f.dispose()
})

test('app-specific engine options are opt-in and recreate a clean session when changed', async () => {
  const f = setup(); await f.mount()
  assert.equal(f.native().props.options.includes('--http-reconnect'), false)
  const old = f.native().props.onTimeChanged
  await f.update({ vlcOptions: ['--http-reconnect'] })
  assert.equal(f.native().props.options.includes('--http-reconnect'), true)
  await act(async () => old({ time: 1000 })); assert.equal(f.progress.length, 0)
  await f.dispose()
})
