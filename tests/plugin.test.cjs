const { test } = require('node:test')
const assert = require('node:assert/strict')
const { needsShim, patchGradle, JAVA_SOURCE } = require('../plugin/compat.cjs')
test('compatibility shim applies only to SDK 58 and the pinned binding', () => {
  assert.equal(needsShim('58.0.23', '4.0.5'), true)
  assert.equal(needsShim('54.0.37', '4.0.5'), false)
  assert.equal(needsShim('59.0.0', '4.0.5'), false)
  assert.equal(needsShim('58.0.23', '58.0.5'), false)
})
test('repeated prebuilds do not duplicate Gradle source wiring', () => {
  const original = 'buildscript { /* user-owned settings */ }\n'
  const first = patchGradle(original, true)
  assert.equal(patchGradle(first, true), first)
  assert.equal((first.match(/@generated begin/g) || []).length, 1)
  assert.match(first, /candidate.name == "expo-libvlc-player"/)
  assert.equal(patchGradle(first, false), original)
})
test('SDK 54 source is unchanged and consumer edits around generated block survive', () => {
  const original = 'plugins {}\n// existing settings\n'
  assert.equal(patchGradle(original, false), original)
  const extra = patchGradle(original, true) + '// later consumer edit\n'
  assert.equal(patchGradle(extra, false), original + '// later consumer edit\n')
})
test('generated exception preserves the error code after obfuscation', () => {
  assert.match(JAVA_SOURCE, /extends expo.modules.kotlin.exception.CodedException/)
  assert.match(JAVA_SOURCE, /super\("ERR_CURRENT_ACTIVITY_NOT_FOUND"/)
  assert.doesNotMatch(JAVA_SOURCE, /getSimpleName|console|https?:/)
})
