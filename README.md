# @gocfun/expo-live-flv

Unstyled native HTTP-FLV playback for Expo, with bounded reconnect, lifecycle
handling and an app-owned overlay. No paid playback SDK or hosted service is
required. Supply your own authorized HTTPS stream, including an SRS Edge URL.
The package does not select edges, fetch credentials or contact a backend.

Version **1.0.0 is prepared locally; it has not been published**. The latest stable
Expo version checked on 2026-11-05 is **58.0.23**. The primary development target
is Expo 58 / React Native 0.88.1 / React 19.3.0, Hermes and New Architecture.
A separate SDK 54.0.37 / RN 0.81.5 / React 19.1 fixture checks the legacy JS/API
contract. SDK 55–57 and 59 are not claimed as tested. See VALIDATION.md for the
exact distinction between native builds, mocked tests and device playback.

## Install

Use Node 24.12.0 for this repository (`nvm use`), with pnpm 10.28.2:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm pack
# In a consuming Expo app, install the generated tarball and the pinned binding:
pnpm add /absolute/path/gocfun-expo-live-flv-1.0.0.tgz expo-libvlc-player@4.0.5
npx expo install expo-dev-client
```

Add this package's plugin once; replace an existing `expo-libvlc-player` plugin
entry instead of keeping both:

```json
{
  "expo": {
    "plugins": [["@gocfun/expo-live-flv", { "supportsBackgroundPlayback": true }]]
  }
}
```

Omit `supportsBackgroundPlayback` when background audio is not needed. It enables
iOS `UIBackgroundModes: audio`; the component also needs `playInBackground`.
Rebuild native projects with `npx expo run:android` / `npx expo run:ios`, or use an
EAS development build. Review native changes before prebuilding an existing app.
Expo Go and web report `unsupported`; an OTA update cannot add a native module.

On SDK 58 Android, the plugin generates one compatibility exception class inside
the app's native project and adds it only to the pinned VLC module's source set.
Expo 58 removed that class from Expo Core. The plugin does not edit node_modules;
repeated prebuilds are idempotent. SDK 54 does not receive this shim. The generated
Groovy Gradle layout is required on SDK 58. Using only the upstream plugin on
SDK 58 Android is insufficient. Bare apps must apply/review these prebuild changes.

The binding remains **expo-libvlc-player 4.0.5**, using Android LibVLC 3.6.5 and
iOS MobileVLCKit 3.7.3. The newer binding's VLC 4 alpha/EAP engine and changed
API are outside this release's compatibility contract. Do not substitute `latest`.

## Use

```tsx
import { LiveFlvPlayer } from '@gocfun/expo-live-flv'

<LiveFlvPlayer
  source={authorizedHttpsFlvUrl}
  style={{ width: '100%', aspectRatio: 16 / 9 }}
  active={screenIsFocused}
  muted={false}
  contentFit="contain"
  onStatusChange={setPlaybackState}
/>
```

`source` is `string | null`. HTTPS URLs are required; user/password credentials
and surrounding whitespace are rejected. Signed query strings pass unchanged.
Change `source` when a token expires or an edge changes. Keep tokens out of logs.

A ref exposes `retry()`. `renderOverlay(state, retry)` lets the app supply loading,
error and retry UI. There are no navigation, styling or GocFun API dependencies.

| Option | Default / behavior |
| --- | --- |
| `active`, `paused`, `muted` | true, false, false |
| `playInBackground` | false; opt-in retention during background / lock |
| `contentFit` | contain; cover also supported, measured container dimensions |
| `networkCachingMs` | 700; clamped to 100–10000 |
| `progressIntervalMs` | 500; minimum 100 |
| `retryDelaysMs` | 1000, 2000, 4000, 8000, 8000; bounded retry budget |
| `stallTimeoutMs`, `healthyResetMs` | 20000, 30000; minimum 1000 |
| `vlcOptions` | optional app-owned engine flags |

Callbacks are `onStatusChange`, `onVideoSize({width, height})` and
`onProgress({timeSeconds})`. Status values are idle/loading/playing/reconnecting/
failed/unsupported. Errors expose stable codes instead of native messages.

By default, app background, pause, `active={false}` and unmount release the native
view and cancel timers. Foreground starts a fresh live connection. With
`playInBackground`, background retains playback, while pause and inactive screens
still release it. Android audio focus/background service behavior and iOS lock
screen audio must be checked in the consuming app on real devices.

Duplicate errors/end events are coalesced. Thirty seconds of advancing media time
resets retries; a brief playing event does not. The watchdog detects no-time-
advancement stalls. HTTP-FLV is non-seekable at rate 1; media time is not actual
end-to-end latency. There is no HLS fallback or PiP. The wrapper does not log
source/native errors; review upstream native logs before distribution.

## Size and performance

The npm wrapper is small; it still links the full native VLC distribution. It
has no custom slim engine. A historical SDK 54 consumer A/B release measurement
was **53.40 MiB without VLC / 94.77 MiB with VLC**, a **41.37 MiB** increase
with identical JS/signing and arm64/R8/resource shrinking. These are raw APK
sizes, not store download sizes or SDK 58 measurements. See benchmarks/RESULTS.md.
CPU, RAM, battery, latency and hardware decoding require controlled device tests.
No binary-size reduction or fixed latency is promised.

## Develop and release

```sh
pnpm test
pnpm --dir example install --frozen-lockfile
pnpm --dir example typecheck
pnpm --dir example exec expo install --check
pnpm test:package
pnpm release:check
```

The standalone example accepts a user-supplied stream and contains no production
endpoint or credentials. See CONTRIBUTING.md, MIGRATION.md, VALIDATION.md and
RELEASE.md. This repository's own code is MIT. Native third-party obligations
remain applicable; see NOTICE.md. GitHub repository: https://github.com/gocfun/expo-live-flv. npm publication is
a separate action; this preparation does not publish a release.

Maintainer-reported historical iOS consumer playback is recorded in DEVICE_TESTING.md;
it does not establish device coverage for the SDK 58 release candidate.
