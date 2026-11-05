const assert = require('node:assert/strict')
const fs = require('node:fs')
const crypto = require('node:crypto')

async function fetchMetadata(name) {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
    headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(15000),
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Registry HTTP ${response.status}`)
  return response.json()
}

async function verifyRelease(expected, options = {}) {
  const get = options.fetchMetadata || fetchMetadata
  const sleep = options.sleep || (ms => new Promise(resolve => setTimeout(resolve, ms)))
  const log = options.log || console.log
  const attempts = options.attempts || 60
  for (let attempt = 1; attempt <= attempts; attempt++) {
    let metadata
    try { metadata = await get(expected.name) } catch { /* transient registry/network failure */ }
    const published = metadata?.versions?.[expected.version]
    if (published) {
      assert.equal(published.name, expected.name, 'Registry package identity mismatch')
      assert.equal(published.version, expected.version, 'Registry version mismatch')
      assert.equal(published.dist?.integrity, expected.integrity, 'Published tarball differs from the tested artifact')
      if (metadata['dist-tags']?.latest === expected.version) {
        log(`Verified ${expected.name}@${expected.version}: latest and tarball integrity match`)
        return published
      }
    }
    if (attempt < attempts) {
      log(`Waiting for npm processing (${attempt}/${attempts})`)
      await sleep(options.delayMs ?? 5000)
    }
  }
  throw new Error(`Registry has not exposed ${expected.name}@${expected.version} as latest. Publish may already be accepted; check npm before rerunning publish.`)
}

module.exports = { verifyRelease }
if (require.main === module) {
  const manifest = require('../package.json')
  assert.ok(process.argv[2], 'Usage: node scripts/verify-registry.cjs ./artifact.tgz')
  const integrity = 'sha512-' + crypto.createHash('sha512').update(fs.readFileSync(process.argv[2])).digest('base64')
  verifyRelease({ name: manifest.name, version: manifest.version, integrity }).catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}
