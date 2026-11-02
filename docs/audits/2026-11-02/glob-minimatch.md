# Glob and minimatch follow-up — 2026-11-02

## Findings and actual exposure

The remaining alerts were:

| Alert | Locked version | Affected range | First patched version |
| --- | --- | --- | --- |
| [#129: Glob cancellation bypass](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) | 13.0.6 | >=9.0.0, <=14.0.1 | 14.0.2 |
| [#130: minimatch pattern amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249) | 10.2.6 | <11.0.1 | 11.0.1 |

The dependency path is `@astrojs/vercel@11.0.17 -> @vercel/nft@1.11.0 -> glob -> minimatch`.
The adapter invokes NFT while bundling server functions. NFT's Glob calls derive
patterns from repository/dependency source paths to collect dynamically required
modules, assets and shared libraries. Application source does not import these
packages, and no visitor-input path to them was found. Their lockfile classification
as runtime dependencies does not mean a web request executes this build tooling.

The Glob advisory concerns work continuing after an AbortSignal cancellation.
NFT's three Glob call sites do not supply `signal`. The minimatch prerequisite
`optimizationLevel >= 2` is present: Glob sets it to 2. Nevertheless, these patterns
come from build inputs rather than HTTP requests. The realistic exposure in this
project is therefore the build environment, particularly untrusted source or
dependencies, rather than an identified public endpoint. This assessment does
not establish immunity to all resource-exhaustion issues.

## Chosen repair and compatibility boundary

At inspection, the latest stable adapter was still 11.0.17 and NFT 1.11.0 still
declared `glob: ^13.0.0`. No patched Glob 13.x or minimatch 10.x release was listed
by the official npm registry. There was no fix inside the upstream-declared
semver ranges. Downgrading the Astro adapter is not an appropriate repair.

Use an exact, scoped npm override for NFT's Glob dependency only:

```json
"@vercel/nft": {
  "glob": "14.0.3"
}
```

This resolves Glob 14.0.3, minimatch 11.0.3 and path-scurry 3.0.0. Their published
Node engine ranges support the project's Node 22 runtime. Upstream's major
upgrade includes the minimatch/path-scurry changes and retains the `glob()` API
used by NFT. This is a locally validated compatibility override, not a claim
that NFT upstream has declared support for Glob 14. Remove it when NFT releases
a compatible dependency update.

The official security fixes are
[Glob's immediate abort return](https://github.com/isaacs/node-glob/commit/4682e8c9babee1b385202ede36389634e12076d7)
and [minimatch's preprocessing limits](https://github.com/isaacs/minimatch/commit/77a0f5c4b80bdc641c3c930a1d9edf5ad2db57f8).

## Validation

Node 22.23.2 / npm 10.9.8:

- Clean `npm ci` passed without force or peer-resolution bypasses.
- Official `npm run audit:deps` and full npm audit passed with **zero findings**;
  see `npm-audit-after-glob.json`.
- A new NFT integration test passed both before and after the override. It
  verifies dynamically required modules, wildcard JSON assets, hidden assets
  and exclusion of an unrelated file from the deployment trace.
- Full `npm run ci` passed: 167 tests, Astro typecheck, production build, 61
  historical URL checks, 20 Python tests, and generated-site checks covering
  71 HTML pages and 3,827 local references.
- The existing and rebuilt server-function artifacts each contain 708 files;
  the complete relative file sets are identical, with no additions or removals.
- Existing audit/release gates, application behavior and content remain unchanged.

This records local compatibility and security verification. The PR preview,
production deployment and final alert state are checked separately when released.
