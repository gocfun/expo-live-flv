# Release checklist

Keep the package marked alpha until the supported-device matrix is verified.

- Run `pnpm install --frozen-lockfile --ignore-scripts`, `pnpm test` and
  `pnpm test:package` on the exact release commit. CI performs these checks.
- Record the completed `gocfun-mobile` playback results in DEVICE_TESTING.md
  with device/OS and tested revision. Test uncovered or changed scenarios before
  claiming stable support on those platforms; a duplicate standalone run is optional.
  Record native build results separately from playback results in VALIDATION.md.
- Inspect the generated tarball for entry points, types, plugin, notices and
  accidental credentials. Confirm README commands match the package version.
- Review actual VLC/native artifacts and their notices/source obligations before
  distributing an application binary; this wrapper's MIT license is not native
  dependency clearance. Preserve exact artifact/version evidence.
- Public repository and package metadata use `https://github.com/gocfun/expo-live-flv`.
  Verify the repository and issue tracker remain accessible before npm publication.
- Configure a private security reporting channel before public release; see
  SECURITY.md. Do not publish a fictitious address or enable public credential reports.
- Check npm name availability and ownership. Review the public package contents,
  update CHANGELOG.md, and select the next version/tag before publishing.
- Use an explicit prerelease tag such as `alpha`; do not point `latest` to an
  experimental release unintentionally. Publishing/tagging is a separate action.

The compatibility baseline is Expo 54 / RN 0.81 / React 19.1 with binding 4.0.5.
Expand peer ranges only after validating the new combination. CI bundle success
does not justify widening native-platform support claims.
