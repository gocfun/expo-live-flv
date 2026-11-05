# Validation — 2026-11-05

Release preparation: expo-live-flv 1.0.0, local only. No live stream or physical
device playback is included in these results.

## Primary target: Expo SDK 58

| Check | Result |
| --- | --- |
| Versions | Expo 58.0.23, RN 0.88.1, React 19.3.0, TypeScript 6.0.3, dev-client 58.0.18 |
| Toolchain | Node 24.12.0, pnpm 10.28.2, JDK 17, Xcode 27.1 |
| Library TypeScript and controller/component/plugin tests | Pass, 21/21 |
| Independent example typecheck | Pass |
| Online `expo install --check` | Pass; dependencies up to date |
| Hermes export, iOS and Android | Pass, final example including background toggle |
| Fresh Expo native prebuild with own plugin | Pass |
| iOS generic arm64 Simulator Debug build, unsigned | Pass (`BUILD SUCCEEDED`) |
| iOS embedded engine / background config | MobileVLCKit.framework present; UIBackgroundModes contains audio |
| Android pinned binding Kotlin compile with SDK 58 shim | Pass (`BUILD SUCCESSFUL`) |
| Android full arm64 development APK | Pass (`BUILD SUCCESSFUL`, 332 tasks; arm64-v8a only) |
| Package release audit / tarball smoke check | Pass; release audit and extracted-tarball plugin load |

The development APK is 106,626,206 bytes (101.69 MiB), containing only arm64
native libraries including libvlc.so and libvlcjni.so. It is a Debug/dev-client
artifact requiring Metro, not a store download or an R8 release comparison.

Native templates use iOS 16.4, Android minSdk 24 / compileSdk 37 / targetSdk 36,
Gradle 9.4.1 and NDK 27.1.12297006. The Android build uses the SDK 58 template's
AGP 9 compatibility opt-outs (`android.builtInKotlin=false`, `android.newDsl=false`).
These successful checks do not certify future AGP 10 or future Expo versions.

The initial Android binding compile failed because Expo 58 removed
`expo.modules.core.errors.CurrentActivityNotFoundException`. The package plugin
now generates an app-owned compatibility exception subclass of Kotlin
`CodedException`, scoped to the pinned VLC module. The patched module compiles;
source generation and Gradle idempotence have automated tests. No node_modules
source file was edited. The iOS binding compiled without a compatibility shim.

Reproduction (from example after install):

```sh
npx expo prebuild --no-install
# Set JAVA_HOME to JDK 17 and ANDROID_HOME to the installed Android SDK.
cd android
./gradlew :expo-libvlc-player:compileDebugKotlin --max-workers=2 --no-parallel
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --max-workers=2 --no-parallel
```

For iOS, install pods then build the generated LiveFLVExample workspace with:

```sh
xcodebuild -workspace ios/LiveFLVExample.xcworkspace -scheme LiveFLVExample \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' -jobs 2 \
  CODE_SIGNING_ALLOWED=NO ARCHS=arm64 build
```

The recorded iOS build preceded the Android-only shim and final JS background
button. The native iOS dependencies/configuration did not change. Final JS was
separately typechecked and exported for both platforms. No Simulator launch,
signed iOS device/archive build or App Store build has been performed.

## Legacy target: Expo SDK 54

The compatibility fixture uses Expo 54.0.37 / RN 0.81.5 / React 19.1 / TypeScript
5.9.3. Public consumer typecheck, plugin config evaluation and 21/21 controller,
mocked-component and plugin tests pass. SDK 54 does not receive the Android shim.
This turn did not repeat SDK 54 native builds; see the historical benchmark.
Mocked tests exercise React lifecycle boundaries, not native decoding or OS audio.
`react-test-renderer` prints its upstream deprecation notice; assertions pass.

## Size, distribution and outstanding checks

The binding remains expo-libvlc-player 4.0.5 with Android LibVLC 3.6.5 and iOS
MobileVLCKit 3.7.3. This release does not build a slim VLC engine. The SDK 54
arm64 release A/B benchmark (53.40 versus 94.77 MiB; +41.37 MiB) belongs to a
fixed alpha.1 consumer snapshot, not to this SDK 58 demo. See benchmarks/.

No SDK 58 physical-device HTTPS SRS playback, token expiration, Wi-Fi/cellular switching,
OS background audio, long-run A/V synchronization, latency, CPU/RAM/battery or
thermal measurement is recorded. The app owner will perform those checks later;
RELEASE.md lists concrete cases. No SDK 58 release-mode R8/APK/AAB or signed iOS
distribution build is claimed. Review the actual native artifacts' licenses and
platform requirements before shipping a consuming app.

The checks above were recorded before the first GitHub CI run; see the dated
CI/CD entry below for subsequent workflow results. No new npm/GitHub
publication, production backend change, GocFun application change or deployment
was performed during this release preparation.

## Repository consolidation — 2026-11-06

The canonical checkout is `/Users/windy/tmf/expo-live-flv`, with existing origin
https://github.com/gocfun/expo-live-flv and package name `@gocfun/expo-live-flv`.
The SDK 58 preparation was merged with existing watchdog regression fixes and
scoped-package smoke checks. The native builds above were performed in the
standalone preparation checkout, before this consolidation; they have not been
repeated here. Current JS/package checks are recorded separately after the merge.

Historical maintainer confirmation of consumer playback on iPhone 12 Pro Max /
iOS 26.7.2 is preserved in DEVICE_TESTING.md. The exact tested revision and
scenario results are not recorded; this is not SDK 58 device acceptance.

Consolidated checkout checks on 2026-11-06:

- Root TypeScript build and 24/24 controller/component/plugin tests pass.
- SDK 54 consumer typecheck and 24/24 tests pass; SDK 58 example typecheck passes.
- Scoped tarball installs into an independent Expo 58 consumer; consumer types,
  default/opt-in background plugin and Android/iOS/web bundle exports pass.
- The web source-map check handles SDK 58 indexed maps and confirms that the web
  adapter is bundled without expo-libvlc-player.
- Lockfiles, SDK 54 plugin config evaluation and package audit are checked before
  the consolidation commit. No native rebuild or new device playback is claimed.

## GitHub CI/CD — 2026-11-06

The package-checks run for commit ebfb7c5 passed on GitHub:
https://github.com/gocfun/expo-live-flv/actions/runs/42080092363.
Both SDK 58 and SDK 54 jobs passed, including 28/28 tests per dependency set,
consumer typechecks, the SDK 58 tarball smoke/export checks and package audit.
The four new release guard tests reject wrong tags, branches, forks and
prerelease versions for the stable publisher. Native/device checks above were
not repeated by this workflow.

The tag-triggered publish.yml workflow reuses both CI jobs and publishes their
exact tarball via npm OIDC only after successful checks. A successful registry
verification step is required to confirm publication.

## npm publication — 2026-11-06

`@gocfun/expo-live-flv@1.0.0` was accepted by npm through the saved GitHub
Trusted Publisher and is exposed as `latest`. The registry tarball SHA-512
matches the original npm-package artifact from run 42081621687 exactly.
The artifact SHA-1 is `8e2e76b6a1de8683f714bdd40c9838bd3bba8e8b`.
Provenance was signed and logged at
https://search.sigstore.dev/?logIndex=3697968028.

The original publish job accepted the release, but its immediate registry check
ran before npm finished processing and reported a false failure. Registry
availability and integrity were subsequently verified independently. The
follow-up workflow change adds a bounded processing wait and checks the latest
tag and exact tarball integrity. Four regression tests cover delayed visibility,
network/tag propagation, wrong integrity and timeout; local tests total 32/32.
The published v1.0.0 tag is retained; no duplicate publish is attempted.
