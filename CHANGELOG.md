# Changelog

## 1.0.0 — prepared 2026-11-05 (not published)

- Target Expo SDK 58.0.23, React Native 0.88.1 and React 19.3.0 in the standalone example and development toolchain.
- Preserve the Expo SDK 54.0.37 / RN 0.81.5 consumer contract through a separate compatibility fixture.
- Resolve generated RN 0.88 types using package exports (`Node16` resolution) and use Expo's recommended TypeScript 6.0.3 in the SDK 58 example.
- Retain the pinned expo-libvlc-player 4.0.5 binding and VLC 3 engines, validated with native example builds, rather than switching implicitly to VLC 4 alpha/EAP artifacts.
- Generate a scoped Android exception compatibility shim for Expo 58 through the config plugin, without editing dependency files.
- Keep the previously added opt-in `playInBackground` behavior and app-owned `vlcOptions`. Background audio still requires native configuration and device validation.
- Add reproducible package checks, consumer type tests, a CI SDK matrix, release notes and migration instructions.
- Preserve the historical SDK 54 native-size benchmark; it is not a size measurement for the new SDK 58 example.

The version is prepared locally. Publication, physical-device playback and long-running background/network/latency checks are separate release decisions.

## 0.1.0-alpha.2

Extract the unstyled player, reconnect controller, custom engine options, example and SDK 54 size measurement into a standalone local repository.
