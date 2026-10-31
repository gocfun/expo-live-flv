# Android native VLC size measurement

This benchmark compares the same consumer app snapshot twice, with and without
native `expo-libvlc-player` autolinking. JS dependencies and the live-player flag
remain present in both variants. This isolates the native engine/binding cost;
it is not a comparison against an old historical store APK or a minimal demo app.

- Expo 54.0.37 / RN 0.81.5 / Hermes / New Architecture.
- `assembleRelease`, arm64-v8a only, R8 and resource shrinking enabled.
- Same existing consumer debug signing key; no production signing or publishing.
- Native `.so` packaging remains the consumer's uncompressed packaging setting.
- No dotenv files, production credentials or production signing files copied.
- Source snapshot is separate; installed dependencies and their Gradle build
  caches are shared. Build duration is warm-cache dependent and is not a runtime
  performance benchmark.
- The Metro configuration in the snapshot uses the Node crawler and watches the
  shared node_modules explicitly. The consumer's Metro config is not edited.
- Both APKs must contain identical embedded JS SHA-256 values. The script checks
  native module discovery, VLC `.so` presence/absence and arm64-only packaging.
- Raw APK bytes are not Google Play AAB device-download bytes, installed app data,
  RAM consumption, CPU consumption or iOS IPA size.

Reproduce on a disposable snapshot (the script expects this Expo native project
layout and an existing **debug-key release signing configuration**; inspect your
consumer build scripts first):

```sh
python3 scripts/benchmark-android-size.py \
  --source /absolute/path/to/consumer-app \
  --scratch /absolute/path/outside-consumer/fresh-snapshot \
  --out /absolute/path/to/benchmark-results
```

`--resume` reuses only a matching marked snapshot after a failed build. It does
not refresh consumer source files; use a fresh scratch path for new source changes.
Do not use arbitrary production signing configurations. The recorded run used
only the standard Android debug keystore. The measurement script executes the
consumer's Gradle build scripts; it is not a sandbox for untrusted projects.

Results: see android-arm64-release.json and RESULTS.md after the comparison
completes. Consumer APKs/build logs are intentionally not committed to this repo.
