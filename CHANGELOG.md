# Changelog

## 1.0.0 — prepared 2026-11-05 (not published)

Changelog updated 2026-11-06. This version is prepared locally; no npm or GitHub
release has been published.

### Added

- GitHub Actions npm CD for matching stable version tags. Publishing waits for
  both SDK checks, uses the tested tarball, verifies package identity and supports
  npm Trusted Publishing with provenance. Main-branch pushes only run CI.
- Release guard tests reject branches, mismatched tags, prereleases and forks.

- Separate Expo SDK 54 compatibility fixture covering the public consumer types,
  plugin configuration and mocked lifecycle/reconnect behavior.
- SDK 58 / SDK 54 CI checks, release package audit and extracted-tarball plugin
  smoke check. The GitHub workflow is configured but has not run remotely.
- Background-audio toggle in the standalone example for device testing.
- Migration guide, release checklist and a validation report distinguishing
  automated checks, native builds and pending device playback tests.

### Changed

- Use the existing public package name `@gocfun/expo-live-flv` and repository
  https://github.com/gocfun/expo-live-flv; preserve author metadata and package smoke checks.

- Target Expo 58.0.23, React Native 0.88.1 and React 19.3.0 in the development
  toolchain and standalone example; use expo-dev-client 58.0.18 and TypeScript 6.0.3.
- Use Node 24.12.0 for repository development and update dependency lockfiles.
- Resolve RN 0.88 generated types through package exports with Node16 module
  resolution; register the example through its explicit index.js entry point.
- Declare the checked SDK 54.0.37 / RN 0.81.5 and SDK 58.0.23 / RN 0.88.1 peer
  combinations. SDK 55–57 and SDK 59 are not claimed as tested.

### Fixed

- Handle SDK 58 indexed web source maps in the tarball consumer smoke check,
  while continuing to verify that web excludes the native VLC binding.

- Preserve the consumer fix for backward/oscillating media timestamps: they do
  not refresh the stall watchdog or restore retries. Timestamp resets require
  a new sustained period of forward progress; regression tests cover each case.

- Restore Android compilation on SDK 58 with the pinned expo-libvlc-player 4.0.5
  binding: Expo Core removed CurrentActivityNotFoundException, so the config
  plugin generates an app-owned compatibility class and adds its source only to
  the VLC module. It does not edit node_modules or inject the class on SDK 54.
- Make repeated prebuilds keep a single generated Gradle block and preserve
  surrounding consumer settings. SDK 58 Android requires this package's plugin
  and the generated Groovy Gradle layout; an upstream-only plugin is insufficient.

### Compatibility and retained behavior

- Keep expo-libvlc-player 4.0.5, Android LibVLC 3.6.5 and iOS MobileVLCKit 3.7.3.
  The newer binding's VLC 4 alpha/EAP artifacts and changed API are outside this
  release's compatibility contract.
- Preserve opt-in playInBackground (false by default), app-owned vlcOptions,
  bounded reconnect, stall detection, throttled progress and native view cleanup.
  Background audio requires native configuration and a native rebuild.
- Preserve the historical SDK 54 size benchmark. No slim VLC engine or native
  size reduction is included; those results are not SDK 58 size measurements.

### Validated during release preparation

- TypeScript build and 24/24 controller/component/plugin tests pass with the
  SDK 58 dependency set; the SDK 54 fixture also passes typecheck and 24/24 tests.
- Standalone example typecheck, online Expo dependency check and final Hermes
  bundle exports for iOS and Android pass.
- Unsigned generic arm64 iOS Simulator Debug build succeeds with MobileVLCKit
  embedded and UIBackgroundModes audio configured.
- Android VLC Kotlin/Java compilation and the full arm64-v8a Debug APK build
  succeed. The development APK is 101.69 MiB and requires Metro; this is not a
  release/store download size comparison.
- Package audit and plugin loading from the extracted 1.0.0 tarball pass.

Physical-device SRS playback, network switching, expired tokens, background/lock
screen audio, long-running A/V sync and performance remain to verify. SDK 58
release-mode Android and signed iOS distribution builds have not been validated.
See VALIDATION.md and RELEASE.md for scope and acceptance steps.

## 0.1.0-alpha.2

- Add app-owned VLC options and opt-in background playback.

## 0.1.0-alpha.1

- Extract an app-independent HTTP-FLV adapter using expo-libvlc-player 4.0.5.
- Add bounded reconnect, lifecycle handling, watchdog and mocked component tests.
