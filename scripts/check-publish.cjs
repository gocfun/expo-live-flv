const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

function releaseMetadata(manifest, ref, repository) {
  assert.equal(repository, 'gocfun/expo-live-flv', 'Publish only from the canonical repository')
  assert.equal(manifest.name, '@gocfun/expo-live-flv', 'Unexpected npm package')
  assert.match(manifest.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, 'Only stable releases may use latest')
  assert.equal(ref, `refs/tags/v${manifest.version}`, 'Run from a release tag matching package.json')
  return { archive: `gocfun-expo-live-flv-${manifest.version}.tgz` }
}

module.exports = { releaseMetadata }
if (require.main === module) {
  const manifest = require(path.resolve(__dirname, '../package.json'))
  const result = releaseMetadata(manifest, process.env.GITHUB_REF, process.env.GITHUB_REPOSITORY)
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `archive=${result.archive}\n`)
  console.log(JSON.stringify({ name: manifest.name, version: manifest.version, ...result }))
}
