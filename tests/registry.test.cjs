const { test } = require('node:test')
const assert = require('node:assert/strict')
const { verifyRelease } = require('../scripts/verify-registry.cjs')
const expected = { name: '@gocfun/expo-live-flv', version: '1.0.0', integrity: 'sha512-tested' }
function metadata(integrity = expected.integrity, latest = expected.version) {
  return { 'dist-tags': { latest }, versions: { '1.0.0': { name: expected.name, version: expected.version, dist: { integrity } } } }
}
test('registry verification waits for accepted releases to become visible', async () => {
  let requests = 0, waits = 0
  const released = await verifyRelease(expected, { attempts: 3, log() {}, sleep: async () => { waits++ }, fetchMetadata: async () => ++requests === 3 ? metadata() : null })
  assert.equal(released.version, expected.version)
  assert.equal(waits, 2)
})
test('registry verification retries transient fetch failures and delayed latest tag', async () => {
  let requests = 0
  await verifyRelease(expected, { attempts: 3, log() {}, sleep: async () => {}, fetchMetadata: async () => {
    requests++
    if (requests === 1) throw Error('Temporary network failure')
    return metadata(expected.integrity, requests === 2 ? '0.1.0-alpha.2' : '1.0.0')
  } })
  assert.equal(requests, 3)
})
test('a different published tarball fails verification immediately', async () => {
  let waits = 0
  await assert.rejects(verifyRelease(expected, { attempts: 3, log() {}, sleep: async () => { waits++ }, fetchMetadata: async () => metadata('sha512-other') }), /tarball differs/)
  assert.equal(waits, 0)
})
test('registry verification exhausts a bounded wait and warns against blind republish', async () => {
  let requests = 0
  await assert.rejects(verifyRelease(expected, { attempts: 2, log() {}, sleep: async () => {}, fetchMetadata: async () => { requests++; return null } }), /Publish may already be accepted/)
  assert.equal(requests, 2)
})
