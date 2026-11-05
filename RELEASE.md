# Preparing and publishing 1.0.0

Package: `@gocfun/expo-live-flv`. Repository:
https://github.com/gocfun/expo-live-flv. Stable releases are published by the
`publish.yml` GitHub Actions workflow from matching version tags. Check the npm
registry and workflow run for the actual publication result; a tag alone does
not prove a successful publish. GitHub access does not establish npm permissions.

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
pnpm test:package
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

## Public release steps

1. Review the configured repository/homepage/issues metadata and push the reviewed
   source when authorized. Confirm npm organization membership and scoped-name ownership.
2. Complete the device acceptance record and review the packed file list/license
   materials. Rebuild and repack if any source or metadata changes.
3. Publish the inspected tarball using the account's required npm authentication
   and provenance workflow. Create a matching v1.0.0 Git tag/release, attaching
   changelog and validated platform/engine versions.
4. Install the published package into a fresh Expo 58 consumer and rebuild both
   platforms. Do not deliver this native change solely through OTA.

A slim VLC engine is a separate effort. Publishing the wrapper does not reduce
the native size measured in the SDK 54 benchmark.

## GitHub Actions npm CD

`.github/workflows/publish.yml` runs on a `v*` tag push (or a manual dispatch
whose ref is that release tag). The tag must equal `v` plus the stable version
in package.json. Pushes to main run CI without publishing. The reusable CI must
pass both SDK 58 and SDK 54 jobs before the publish job can run. The publish job
uses the exact tarball uploaded by CI, verifies its name/version, publishes it
publicly with provenance and the latest dist-tag, then checks the registry.
Prerelease versions require a separate dist-tag policy and are rejected here.

Configure npm Trusted Publishing for the existing scoped package before the
first CD release. In npm package Settings → Trusted Publisher, select GitHub
Actions and enter organization `gocfun`, repository `expo-live-flv`, workflow
filename `publish.yml`, no environment name. Permit `npm publish` (direct
publishing); stage-only permission will not authorize this workflow. The GitHub
job has `id-token: write` and uses Node 24.12.0 / npm >=11.5.1. No NPM_TOKEN secret
is used. Configure the publisher near the first release because unused publisher
configurations can expire; see the current npm documentation.

After pushing the release commit and checking CI, create and push its tag:

```sh
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

A successful npm publication cannot reuse the same package version. For a failed
run before publication, retry that workflow after fixing authentication; check
npm before retrying if a publish may already have succeeded.

References: https://docs.npmjs.com/trusted-publishers/ and
https://docs.github.com/en/actions/tutorials/publish-packages/publish-nodejs-packages
