# Preparing and publishing 1.0.0

Current state: local release preparation only. No npm publish, GitHub remote,
public repository, tag or deployment has been performed. The npm name returned
404 when checked on 2026-11-05; that check does not reserve it. Configure the
actual repository URL and npm ownership before a public release.

## Reproduce local checks

Use `.nvmrc` (Node 24.12.0) and pnpm 10.28.2.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm --dir example install --frozen-lockfile --ignore-scripts
pnpm --dir example typecheck
pnpm --dir example exec expo install --check
pnpm --dir compat/sdk54 install --frozen-lockfile --ignore-scripts
pnpm --dir compat/sdk54 typecheck
FLV_TEST_DEPENDENCY_ROOT="$PWD/compat/sdk54" node --test tests/*.test.cjs
pnpm release:check
pnpm pack --pack-destination artifacts
```

The CI workflow runs those JS/package checks on SDK 58 and 54. A configured
workflow is not evidence of a completed GitHub Actions run. Native builds require
macOS/Xcode/CocoaPods or Android SDK/JDK 17 and are recorded in VALIDATION.md.
The package audit verifies version pins, built files, the shipped config plugin
helper and the absence of private/native build artifacts in the tarball.

## Device acceptance before distribution

Install a development build on iPhone and Android with a dev/staging HTTPS SRS
Edge stream supplied by the app owner. Do not commit signed stream URLs.

- Confirm first frame, audio, mute/pause/resume and portrait/landscape contain/cover.
- Turn background audio off: background/lock, return, navigate away and remount;
  confirm audio and native view are released as intended.
- Turn background audio on: background/lock and resume; verify iOS audio session,
  Android audio focus, competing audio, OS background limits and battery behavior.
- Switch Wi-Fi/cellular, disable networking, restart the stream and expire its token.
  Check bounded reconnect, terminal failure, manual retry and a new source token.
- Leave a stream running for at least 30 minutes; inspect A/V sync, stalls, RAM,
  CPU, battery and temperature. Measure end-to-end latency with a controlled clock.
- Build consuming release binaries; verify signing, native ABI/page-size/store
  requirements and the licenses/notices/source/relinking obligations of the
  actual shipped VLC/codec artifacts. Historical APK alignment evidence does not
  certify every new build or distribution channel.

Record device model, OS, network, codec/resolution, build configuration and results.
No physical-device playback run is recorded in this preparation.

## Public release steps (not executed)

1. Set the real repository/homepage/issues metadata and push the reviewed source
   to the chosen public repository. Confirm the selected namespace is owned.
2. Complete the device acceptance record and review the packed file list/license
   materials. Rebuild and repack if any source or metadata changes.
3. Publish the inspected tarball using the account's required npm authentication
   and provenance workflow. Create a matching v1.0.0 Git tag/release, attaching
   changelog and validated platform/engine versions.
4. Install the published package into a fresh Expo 58 consumer and rebuild both
   platforms. Do not deliver this native change solely through OTA.

A slim VLC engine is a separate effort. Publishing the wrapper does not reduce
the native size measured in the SDK 54 benchmark.
