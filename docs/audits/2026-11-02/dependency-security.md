# Dependency security repair — 2026-11-02

## Confirmed finding

Dependabot alert [#128](https://github.com/toolazytoname/toolazytoname.github.io/security/dependabot/128)
is [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
(CVE-2023-54404): excessive memory consumption during Zod collection validation.
The advisory marks versions below 4.6.6 as affected. The alert specifically names
the transitive Zod 4.1.11 instance, not only the 4.6.5 instances updated by PR #38.

The original PR commit `9ecd51784cfb4b59c6c3ae1aee92b912eec1b2b6` still audited
with 9 high and 11 moderate package results. Its remaining Zod versions included
4.1.11 and a 3.x instance pulled by the old OpenAI SDK's optional peer dependency.

In application source, Zod validates trusted repository Markdown frontmatter
through `astro/zod` during content synchronization. The public chat API uses a
separate validator, limits actual request bytes to 32,768 before JSON parsing,
and allows at most 20 messages of 4,000 characters each. No directly reachable
chat-to-Zod collection-validation path was found. This is a source assessment,
not evidence that the production deployment has never been exploited.

## Repair

- Converge every Zod instance on 4.6.7 using an npm override.
- Move the OpenAI SDK from 4.104.0 to 6.49.0, whose published peer range supports
  Zod 4. Existing request, timeout, error and fallback contracts pass against the
  real SDK with a mocked transport. No model/provider configuration was changed.
- Update Astro to 7.3.8 and use one Vite 8.3.5 instance for Astro, plugin-react and
  the project. Update the Vercel adapter to 11.0.17 and Vitest to 4.1.12.
- Resolve Undici 8.12.3, Sharp 0.35.5, source-map-js 1.2.2, fast-uri 3.1.9,
  Satori 0.33.5 and fflate 0.7.5. The explicit overrides keep the relevant
  transitive security floors reproducible.
- Preserve the existing audit threshold and release command. No checks were
  disabled and no `--force` or `--legacy-peer-deps` install was used.

Official SDK compatibility references:
[v5 migration](https://github.com/openai/openai-node/blob/v5.0.0/MIGRATION.md),
[v6.0 release](https://github.com/openai/openai-node/releases/tag/v6.0.0).

## Verification

Environment: Node 22.23.2, npm 10.9.8, macOS arm64.

- `npm ci --registry=https://registry.npmjs.org`: passed, including dependency
  installation scripts. npm 10's update/peer-resolution path initially crashed
  with `edgesOut`; a temporary npm 11.6.2 resolver was used, then npm 10 normalized
  the lockfile and performed the final clean install successfully.
- `npm run audit:deps`: passed. Official npm audit reports **0 critical, 0 high,
  4 moderate** results; see `npm-audit.json`.
- `npm run ci`: passed: 166 tests in 17 files, Astro diagnostics for 80 files
  with zero errors/warnings/hints, production build, all 61 historical post URLs,
  20 Python tests, 71 generated HTML pages and 3,827 local references.
  Generated JavaScript gzip total: 65,311 bytes, within the 150 KiB budget.
- `npm run verify:guard`: passed against an isolated temporary Redis Unix socket,
  including concurrent admissions, daily/monthly/IP caps, release and expiry.
  The first sandboxed attempt could not start Redis; the same isolated test
  passed with local socket access. No production Redis or model API was used.
- A bounded Zod array with 1,000 elements and `.max(2)` returned one size issue
  and visited zero elements. The final lockfile contains only Zod 4.6.7.
- The build completed without any OG-image rendering fallback error. Astro emits
  CSP/Shiki configuration notices; the existing generated CSP/HTML checks pass.

## Remaining items and deployment boundary

The initial repair left the moderate findings below. A subsequent, separately
validated scoped override resolves them; see [the follow-up assessment](glob-minimatch.md).

The remaining moderate results are two underlying advisories in the build-time
`@astrojs/vercel -> @vercel/nft -> glob -> minimatch` chain:
[Glob cancellation](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) and
[minimatch amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249).
The latest compatible adapter still uses the affected dependency range. npm's
automatic proposal downgrades the adapter to 8.1.0; that is not a compatible
repair for this Astro 7 project. No unsupported major override was forced.

At initial inspection, the still-open alert [#104](https://github.com/toolazytoname/toolazytoname.github.io/security/dependabot/104)
names [GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp).
GitHub's advisory explicitly withdrew it on 2026-10-28 as not a valid
vulnerability. It was not silently dismissed or described as a patched issue.
After the initial repair merged, GitHub marked it fixed automatically on
2026-11-02 at 00:30:12 UTC; no manual dismissal was submitted.

PR #38 originally has a failed Vercel status for deployment
`dpl_4LNbJDA8J249rwhGYeTZHq6ft8oe`. The repository's configured build command
starts with the dependency audit, so its original lockfile demonstrably fails
that gate. This reproduces a release blocker; it does not establish the complete
remote failure cause without logs. The Vercel connection was denied deployment
access (403; details 404); no alternate credentials, CLI or browser route was
used to obtain those logs. GitHub Actions is disabled for this repository, so
there is no project CI run for that original PR commit.

Local validation does not establish that production is running this repair.
Remote checks and deployment state must be recorded separately after syncing.
