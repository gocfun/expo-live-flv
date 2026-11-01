# Changelog

## Unreleased

- Fix backwards media timestamps incorrectly refreshing the stall watchdog and
  restoring an exhausted retry budget. Timestamp resets now require a fresh
  sustained period of forward progress before the budget is restored.
- Add regression tests for backwards, oscillating and reset media timestamps.
- Add tarball consumer smoke checks for types, config plugins and platform bundles.
- Give the example its own entry point so pnpm's isolated Expo installation can resolve App.
- Document the API, opt-in background playback, device validation and release process.

## 0.1.0-alpha.2

- Add app-owned VLC options and opt-in background playback.

## 0.1.0-alpha.1

- Extract an app-independent HTTP-FLV adapter using expo-libvlc-player 4.0.5.
- Add bounded reconnect, lifecycle handling, watchdog and mocked component tests.
