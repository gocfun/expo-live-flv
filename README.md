# expo-live-flv (alpha)

Unstyled native HTTP-FLV playback for Expo, using the existing open-source
`expo-libvlc-player` binding. No SDK fee or hosted playback service is required.
This package does **not** contain a custom, smaller VLC engine.

Validated development baseline: Expo 54.0.37, React Native 0.81.5, React 19.1,
Hermes / New Architecture, expo-libvlc-player 4.0.5. Other SDK versions are not
claimed as supported. Native development builds are required; Expo Go and web
report `unsupported` without eagerly loading the native view.

## Install

This package has not been published to npm. Build and pack this repository:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm pack
# In a consuming Expo app, install the generated local tarball and peers:
pnpm add /absolute/path/expo-live-flv-0.1.0-alpha.2.tgz expo-libvlc-player@4.0.5
```

Add `expo-live-flv` to app config `plugins` (or keep the upstream
`expo-libvlc-player` plugin, but do not add both). Rebuild native projects;
CocoaPods is needed for iOS. By default, the plugin leaves background audio disabled;
it does not change your OTA runtime or cleartext permissions. Manage native runtime/channel
separation in the consuming application. Do not clean-prebuild a dirty project.

```tsx
import { LiveFlvPlayer } from 'expo-live-flv'

<LiveFlvPlayer
  source={authorizedHttpsFlvUrl}
  style={{ width: '100%', aspectRatio: 16 / 9 }}
  active={screenIsFocused}
  paused={false}
  muted={false}
  contentFit="contain"
  onStatusChange={state => setPlaybackState(state)}
  onVideoSize={({ width, height }) => setVideoRatio(width / height)}
/>
```

A ref exposes `retry()`. `renderOverlay(state, retry)` lets the application own
its loading/error UI and retry button. There is no NativeWind, React Navigation,
react-native-video, GocFun API or authentication dependency. The package does not
fetch tokens, select edges or contact a backend on its own. Supply a new `source`
when a token expires or an edge is changed. Signed queries are passed unchanged.
HTTPS is required; credentials in the URL and surrounding whitespace are rejected.

## Playback policy

- By default, app background, `active={false}`, pause and unmount release the native view and
  cancel timers. Foreground/resume opens a fresh live connection. Route focus is
  explicitly supplied by the application.
- Defaults: network/live caching 700 ms; no-time-advancement watchdog 20 s;
  five retries at 1/2/4/8/8 s. Repeated native errors/end-of-stream are coalesced.
- Thirty seconds of advancing media time resets the retry budget; brief playing
  events do not. A finite number of failures per unstable period reaches `failed`.
  A backwards timestamp resets the healthy observation window without refreshing
  the watchdog. Subsequent forward timestamps can establish a new healthy window.
- Progress callback is throttled to 500 ms by default. The JS wrapper does not log
  URLs/native errors; review upstream native VLC logs on target devices.
  These limits reduce JS work, not the upstream native event generation rate.
- HTTP-FLV is non-seekable here and runs at rate 1. Media time is not glass-to-glass
  latency. No seekable live window, HLS fallback or PiP. Background playback is opt-in.
- Content fit uses measured container dimensions. Both portrait and landscape
  streams are supported without forcing a 16:9 native viewport.

Configuration: `networkCachingMs` (100–10000), `progressIntervalMs` (>=100),
`vlcOptions` (optional app-owned engine flags), `retryDelaysMs`, `stallTimeoutMs` (>=1000), `healthyResetMs` (>=1000).
Callbacks: `onStatusChange`, `onVideoSize`, `onProgress({timeSeconds})`.
Status: idle/loading/playing/reconnecting/failed/unsupported; failures use stable
codes rather than native messages containing potentially sensitive URLs.

## API reference

| Prop | Default | Behavior |
|---|---|---|
| `source` | required | HTTPS URL or `null` to disconnect; URL credentials are rejected. |
| `active` | `true` | Set false on navigation blur to release the native player. |
| `paused` | `false` | Releases the player; resume creates a fresh live connection. |
| `muted` | `false` | Mutes audio without restarting the session. |
| `playInBackground` | `false` | Keeps the player mounted in background; see platform requirements below. |
| `contentFit` | `contain` | `contain` or `cover`. |
| `style` | none | Container style; supply width and height or aspect ratio. |
| `networkCachingMs` | `700` | Finite inputs clamp to 100–10000 ms; non-finite values use the default. |
| `vlcOptions` | `[]` | App-owned VLC initialization flags; changes restart playback. |
| `retryDelaysMs` | `[1000, 2000, 4000, 8000, 8000]` | Finite nonnegative delays; `[]` disables automatic retry. |
| `stallTimeoutMs` | `20000` | Watchdog timeout; finite and at least 1000 ms. |
| `healthyResetMs` | `30000` | Healthy observation duration before retry budget resets; finite and at least 1000 ms. |
| `progressIntervalMs` | `500` | JS callback interval; finite inputs clamp to at least 100 ms. |

Invalid retry/watchdog timing policies throw when an eligible playback session
starts. Source, retry/watchdog policy, cache options, background policy and manual
retry changes recreate the session. `attempt` starts at 0 and increments on automatic
reconnect within that session; it is not the remaining retry budget.

`onStatusChange(state)` reports lifecycle state. `onVideoSize({width, height})`
reports positive media dimensions on first play of each attempt.
`onProgress({timeSeconds})` reports native media time in seconds; it can reset or
move backwards and is not a latency measurement.
`renderOverlay(state, retry)` renders application-owned UI after the player;
use absolute positioning to place it over the video. A `LiveFlvPlayerRef` exposes
the same manual `retry()` action, which starts a new session with a fresh budget.

## Background playback

Set `playInBackground` on the component to retain playback when the app enters
background or the screen locks. `active={false}` and `paused={true}` still release
the player even with this option enabled.

For iOS, configure the delegated upstream plugin and rebuild the native app:

```json
{
  "expo": {
    "plugins": [["expo-live-flv", { "supportsBackgroundPlayback": true }]]
  }
}
```

This opt-in adds `audio` to `UIBackgroundModes`; installing the plugin without
options does not enable it. The plugin also accepts upstream
`localNetworkPermission` configuration. Use only one of this plugin or the upstream
plugin. Changing native settings requires a new native build.

On Android, this wrapper does not implement a foreground playback service or
media notification. OS background/battery restrictions still apply; retaining
the view does not guarantee uninterrupted background playback. Background/lock
behavior on either platform requires the device checks in `DEVICE_TESTING.md`.

## Size and performance

The JS package is small, but the full native VLC distribution remains an explicit
peer dependency. Merely extracting this package does not shrink VLC. Android A/B
release measurements are documented under `benchmarks/` when available. Universal
four-ABI debug APK size is not comparable with a device-specific release download.
CPU, battery, RAM, decoding behavior and latency still need physical-device tests.
No fixed latency or binary-size reduction is promised.

## Development

Use Node >=20.19.4 and pnpm 10.28.2. Run `pnpm test` for the unit/component
suite, then `pnpm test:package` to install a tarball in a temporary clean Expo
consumer, check types and plugin configuration, and bundle Android/iOS/web.
The smoke check also verifies the web bundle uses the unsupported adapter without
including the upstream native binding. Registry access is needed unless the pnpm
cache is complete (`pnpm test:package --offline`); add `--keep` to inspect the
temporary app. Release and device requirements are in RELEASING.md and
DEVICE_TESTING.md in the source repository.

`pnpm test` builds TypeScript and tests the actual reconnect controller with a fake
clock: budget exhaustion, duplicate/stale callbacks, watchdogs, sustained recovery
and disposal. Component tests mock the native view to exercise background/pause,
source changes, manual retry, viewport sizing, throttling and Expo Go/web guards.
Mocked component tests do not replace physical-device playback tests. `example/` is a separate Expo demo accepting a user-provided stream;
it does not contain credentials or a production endpoint. Native build evidence
and device-playback verification are separate; a successful build does not prove
actual playback, TLS/network behavior or thermal performance.

See LICENSE for this code and NOTICE.md for upstream obligations.
Source repository: [gocfun/expo-live-flv](https://github.com/gocfun/expo-live-flv).
The package is alpha; no npm release or application deployment is included.

The package name is provisional; npm namespace availability has not been checked.

## Run the standalone example

After the root package has been built:

```sh
pnpm --dir example install --frozen-lockfile
pnpm --dir example typecheck
pnpm --dir example android
# or: pnpm --dir example ios
```

Native SDKs, a development build and an authorized HTTPS stream are required for
playback. The demo contains no production endpoint. Device signing/provisioning
and actual playback are not exercised by the automated JS tests.

## Recorded consumer size baseline

Android arm64 release with R8/resource shrinking: **53.40 MiB without
native VLC vs 94.77 MiB with VLC**, a **41.37 MiB**
increase in this consumer app. JS and signing certificates match. These are raw
APK sizes, not store download size or an estimate for every app. See source-repo
`benchmarks/RESULTS.md` for method and machine-readable evidence. The prebuilt
VLC engine has not been reduced by extracting this JS package.

Extra native options are app-owned tuning. This package does not enable
`--http-reconnect`, `--clock-jitter=0` or `--clock-synchro=0` by default. If a consumer
uses them, validate long-running A/V sync and reconnect behavior on devices.
