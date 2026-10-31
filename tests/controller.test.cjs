const { test } = require('node:test')
const assert = require('node:assert/strict')
const { PlaybackController, isSecureLiveSource, resolveAspectRatio } = require('../build/core')
function fixture(options = {}) {
  let now = 0, id = 0
  const timers = new Map(), states = [], restarts = []
  const clock = {
    now: () => now,
    schedule: (callback, delay) => { const key = ++id; timers.set(key, { at: now + delay, callback }); return key },
    cancel: key => timers.delete(key),
  }
  const advance = ms => {
    const target = now + ms
    while (true) {
      const next = [...timers.entries()].filter(([, v]) => v.at <= target).sort((a, b) => a[1].at - b[1].at)[0]
      if (!next) break
      timers.delete(next[0]); now = next[1].at; next[1].callback()
    }
    now = target
  }
  const controller = new PlaybackController({ clock, ...options,
    onState: s => states.push(s), onRestart: g => restarts.push(g) })
  controller.start()
  return { controller, advance, states, restarts, timers }
}
test('signed HTTPS input is preserved; insecure, credential and whitespace input is rejected', () => {
  const signed = 'https://edge.example.test/live/test.flv?token=a%2Fb&expires=123'
  assert.equal(isSecureLiveSource(signed), true)
  for (const bad of [null, undefined, '', 'https://', 'http://edge.test/a.flv', 'file:///a.flv',
    'https://user:secret@edge.test/a.flv', ' https://edge.test/a.flv', 'bad']) assert.equal(isSecureLiveSource(bad), false)
})
test('repeated and duplicate errors consume exactly five retries and terminate', () => {
  const f = fixture()
  const delays = [1000, 2000, 4000, 8000, 8000]
  delays.forEach((delay, g) => {
    f.controller.fail('native-error', g)
    f.controller.fail('ended', g)
    f.advance(delay - 1); assert.equal(f.restarts.at(-1), g)
    f.advance(1); assert.equal(f.restarts.at(-1), g + 1)
  })
  f.controller.fail('native-error', 5)
  assert.equal(f.states.at(-1).status, 'failed')
  f.advance(60000)
  assert.equal(f.restarts.length, 6)
  assert.equal(f.timers.size, 0)
})
test('playing/buffering without time advancement still triggers watchdog', () => {
  const f = fixture()
  f.controller.playing(0)
  f.controller.progress(0, 0)
  f.advance(10000); f.controller.progress(0, 0)
  f.advance(10000)
  assert.equal(f.states.at(-1).reason, 'stalled')
  assert.equal(f.states.at(-1).status, 'reconnecting')
})
test('progress extends watchdog without allocating a timer per progress event', () => {
  const f = fixture()
  f.advance(19000); f.controller.progress(1000, 0)
  f.advance(1000); assert.equal(f.states.at(-1).status, 'playing')
  for (let i = 2; i < 100; i++) f.controller.progress(i * 1000, 0)
  assert.equal(f.timers.size, 1)
  f.advance(20000); assert.equal(f.states.at(-1).reason, 'stalled')
})
test('stale events from an old attempt cannot interrupt or heal the new connection', () => {
  const f = fixture()
  f.controller.fail('native-error', 0); f.advance(1000)
  const before = f.states.length
  f.controller.progress(1000, 0); f.controller.playing(0); f.controller.fail('ended', 0)
  assert.equal(f.states.length, before)
  f.controller.progress(1000, 1)
  assert.equal(f.states.at(-1).status, 'playing')
})
test('brief playback does not heal retry budget; sustained progress does', () => {
  const f = fixture({ retryDelaysMs: [1000] })
  f.controller.fail('native-error', 0); f.advance(1000)
  f.controller.progress(1, 1)
  f.advance(10000); f.controller.progress(2, 1)
  f.advance(10000); f.controller.progress(3, 1)
  f.advance(10000); f.controller.progress(4, 1)
  f.controller.fail('ended', 1)
  assert.equal(f.states.at(-1).status, 'reconnecting')
  f.advance(1000); f.controller.progress(1, 2)
  f.advance(5000); f.controller.progress(2, 2)
  f.controller.fail('ended', 2)
  assert.equal(f.states.at(-1).status, 'failed')
})
test('dispose during reconnect cancels all timers and ignores native callbacks', () => {
  const f = fixture(); f.controller.fail('ended', 0)
  f.controller.dispose(); const n = f.states.length
  f.advance(60000); f.controller.progress(2, 0); f.controller.playing(0)
  assert.equal(f.timers.size, 0); assert.equal(f.restarts.length, 1); assert.equal(f.states.length, n)
})
test('dispose while playing cancels watchdog; a remounted controller starts clean', () => {
  const f = fixture(); f.controller.progress(1, 0); f.controller.dispose(); f.advance(60000)
  assert.equal(f.timers.size, 0)
  const next = fixture(); assert.deepEqual(next.restarts, [0]); next.controller.dispose()
})
test('invalid policy fails early and aspect ratio ignores non-finite dimensions', () => {
  for (const options of [{ stallTimeoutMs: 0 }, { retryDelaysMs: [-1] }, { healthyResetMs: NaN }]) {
    assert.throws(() => fixture(options), /Invalid playback timing policy/)
  }
  assert.equal(resolveAspectRatio(390, 844, 16/9), 390/844)
  assert.equal(resolveAspectRatio(Infinity, 10, 9/16), 9/16)
  assert.equal(resolveAspectRatio(0, 0, NaN), 16/9)
})
