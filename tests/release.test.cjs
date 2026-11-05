const { test } = require('node:test')
const assert = require('node:assert/strict')
const { releaseMetadata } = require('../scripts/check-publish.cjs')
const manifest = { name: '@gocfun/expo-live-flv', version: '1.0.0' }
const repository = 'gocfun/expo-live-flv'
test('release tag selects the scoped tarball checked by CI', () => {
  assert.deepEqual(releaseMetadata(manifest, 'refs/tags/v1.0.0', repository), { archive: 'gocfun-expo-live-flv-1.0.0.tgz' })
})
test('a branch or mismatched release tag cannot publish', () => {
  for (const ref of ['refs/heads/main', 'refs/tags/v1.0.1', 'refs/tags/1.0.0']) {
    assert.throws(() => releaseMetadata(manifest, ref, repository))
  }
})
test('prerelease and invalid versions cannot be published with latest', () => {
  for (const version of ['1.0.0-alpha.1', '01.0.0', '1.0', '1.0.0;echo']) {
    assert.throws(() => releaseMetadata({ ...manifest, version }, `refs/tags/v${version}`, repository))
  }
})
test('forks and renamed npm packages cannot use the canonical publisher', () => {
  assert.throws(() => releaseMetadata(manifest, 'refs/tags/v1.0.0', 'someone/expo-live-flv'))
  assert.throws(() => releaseMetadata({ ...manifest, name: 'expo-live-flv' }, 'refs/tags/v1.0.0', repository))
})
