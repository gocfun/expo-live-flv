# Release process

The canonical 1.0.0 checklist is [RELEASE.md](RELEASE.md). Compatibility/build
results are in [VALIDATION.md](VALIDATION.md); device coverage is recorded in
[DEVICE_TESTING.md](DEVICE_TESTING.md).

Package: `@gocfun/expo-live-flv`. Repository: https://github.com/gocfun/expo-live-flv.
The 1.0.0 release is driven by the matching version tag and publish.yml workflow.
Verify npm organization permissions, complete device acceptance, inspect the
packed files and deliberately choose the dist-tag before publishing. Main pushes run CI; matching stable version tags run the npm CD workflow after
CI passes. Configure the npm Trusted Publisher as described in RELEASE.md.
