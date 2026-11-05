# Migration to 1.0

## Latest Expo target

As checked on 2026-11-05, npm's stable Expo tag is 58.0.23. The matching template
uses React 19.3.0 and React Native 0.88.1. The SDK 58 example uses TypeScript 6.0.3
and expo-dev-client 58.0.18, matching Expo's bundled version map.

The library continues to support the explicitly checked SDK 54.0.37 / RN 0.81.5
combination; upgrading the library does not itself upgrade your application SDK.
SDK 55–57 and SDK 59 are not claimed as tested. Pair Expo with its matching RN /
React versions, rather than mixing independently allowed peer versions.

Use Node 24.12.0 (`nvm use`) for this repository. Expo 58 requires Node ^22.13.0,
^24.3.0, ^26.0.0 or >=27.0.0. A Node 20 setup previously used with SDK 54 needs an
upgrade for the new repository development toolchain.

## Binding and API

Install the new library tarball with **expo-libvlc-player 4.0.5**. Do not replace
the native binding with its `latest` tag: 58.0.5 uses a changed JS/native API and
VLC 4 alpha/EAP binaries, and is not the API this adapter targets.

`source`, `active`, `paused`, `muted`, `contentFit`, `vlcOptions`, timing options,
status/video/progress callbacks and `retry()` keep their existing meanings.
`playInBackground` remains false by default. The library owns no navigation or
styling; supply `active={screenIsFocused}` and your own overlay.

Background audio requires `supportsBackgroundPlayback: true` in the config plugin
and an actual native rebuild. The option updates iOS UIBackgroundModes audio.
Android background execution/audio focus and long-running service behavior need
validation in the consuming app; a JS retention test does not certify OS behavior.
Pausing or `active={false}` always releases the view even when background audio
is enabled. Never use an OTA update to add the native binding to an old binary.

## Config plugin change

Use the `expo-live-flv` plugin instead of an upstream-only plugin entry. SDK 58
Android needs a generated Java exception shim for the pinned VLC 3 binding. The
plugin wires app-owned source into only that module, without changing installed
dependencies. SDK 54 gets no shim. The SDK 58 generated Groovy Gradle layout is
required. Re-run prebuild and rebuild the native binary; JS-only updates cannot
apply this fix.

## Native builds

Generate native projects only in a clean example/disposable checkout. SDK 58's
current template targets iOS 16.4 and Android minSdk 24 / compileSdk 37 / targetSdk
36, using Gradle 9.4.1 and NDK 27.1.12297006. Install the required SDK components
rather than forcing the latest SDK to compile against an older platform.

Keep matching OTA runtimes and channels in the consuming app. The library plugin
does not choose an application runtime or enable cleartext networking.

## Existing size data

The 53.40/94.77 MiB A/B benchmark was performed with SDK 54 and a fixed alpha.1
consumer snapshot. It isolates that snapshot's native VLC cost. It is not the
size of this release's demo, an AAB download estimate, or proof that the engine
has become smaller. Native engine reduction is still a separate project.

Primary references:
- https://registry.npmjs.org/expo/latest
- https://docs.expo.dev/versions/latest/
- https://github.com/expo/expo/tree/main/templates/expo-template-blank
- https://github.com/cornejobarraza/expo-libvlc-player
