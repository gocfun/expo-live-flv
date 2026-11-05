const fs = require('node:fs/promises')
const path = require('node:path')
const { withProjectBuildGradle, withDangerousMod } = require('expo/config-plugins')
const upstream = require('expo-libvlc-player/app.plugin.js')
const { needsShim, patchGradle, JAVA_RELATIVE_PATH, JAVA_SOURCE } = require('./plugin/compat.cjs')

// Consumer-owned native changes. Never edit dependency files or OTA runtimes.
module.exports = (config, options = {}) => {
  const projectRoot = config._internal?.projectRoot || process.cwd()
  const installed = name => require(require.resolve(`${name}/package.json`, { paths: [projectRoot] })).version
  const binding = installed('expo-libvlc-player')
  if (binding !== '4.0.5') throw new Error('expo-live-flv 1.x requires expo-libvlc-player 4.0.5')
  const enabled = needsShim(installed('expo'), binding)
  config = (upstream.default || upstream)(config, options)
  config = withProjectBuildGradle(config, mod => {
    if (enabled && mod.modResults.language !== 'groovy') {
      throw new Error('SDK 58 compatibility requires the generated Groovy build.gradle layout')
    }
    mod.modResults.contents = patchGradle(mod.modResults.contents, enabled)
    return mod
  })
  return withDangerousMod(config, ['android', async mod => {
    const java = path.join(mod.modRequest.platformProjectRoot, JAVA_RELATIVE_PATH)
    if (enabled) {
      await fs.mkdir(path.dirname(java), { recursive: true })
      await fs.writeFile(java, JAVA_SOURCE)
    } else {
      await fs.rm(java, { force: true })
    }
    return mod
  }])
}
