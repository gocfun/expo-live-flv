# Contributing

This is an alpha extracted from an Expo 54 integration. Keep playback policy free
of app APIs, auth, navigation and styling frameworks. Put new state-machine tests
in tests/controller.test.cjs and component boundary tests in tests/component.test.cjs.
The native view is mocked in component tests; report device tests separately.

Before a PR: `pnpm test`, `pnpm test:package`, and describe tested Expo/RN/OS versions.
The package smoke test installs a tarball into a temporary standalone Expo app,
checks types and default/opt-in config plugins, then bundles Android, iOS and web.
It requires registry access (or `pnpm test:package --offline` with a complete pnpm
cache). `--keep` retains the temporary app for debugging. Device checks are tracked
in DEVICE_TESTING.md; release requirements are in RELEASING.md.
Do not include .env files, credentials, signed stream URLs, native signing keys or
application source from a consumer app. Redact URL queries and native messages
before submitting logs. Error reports should include stable reason codes and
repro steps using a non-sensitive test stream.

Changes to native dependencies require comparing release builds under identical
ABI, R8, resource shrinking, packaging and signing settings. scripts/benchmark-android-size.py
creates a disposable snapshot of a consumer project and checks both native module
inclusion and identical embedded JS before reporting a size delta. It shares
installed dependencies/build caches with the source project. Never use production
signing material or publish the generated benchmarking APKs as app releases.

CPU/RAM/latency claims require actual devices and a controlled stream. Do not infer
performance or LGPL distribution clearance from TypeScript/unit/build success.
Keep upstream versions pinned until a new compatibility matrix is validated.
