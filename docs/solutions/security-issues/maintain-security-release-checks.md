---
title: Maintain security checks for plugin releases
date: 2026-09-08
category: security-issues
module: version-file-plugin
problem_type: best_practice
component: tooling
severity: low
applies_when:
  - Preparing a release or changing locked dependencies
tags: [npm-audit, dependency-security, release-process]
---

# Maintain security checks for plugin releases

## Context

The plugin's security-sensitive dependency and template boundaries needed a
durable release checklist. Repository-local ignore rules were also needed so
installed dependencies, coverage output, local environment files, and machine
metadata are not accidentally committed.

## Guidance

Keep the security maintenance commands in `SECURITY.md` and run both commands
before release:

```sh
npm audit --package-lock-only --audit-level=low
npm test
```

For a transitive advisory, inspect its installed paths with
`npm ls <package> --all --omit=optional` before adding an `overrides` entry.
Treat EJS templates as trusted build-time code and do not expose secrets to
untrusted templates or builds.

## Why This Matters

The lockfile audit checks the resolved dependency graph, while the integration
suite verifies the emitted version asset and input-validation behavior. The
root `.gitignore` prevents common local artifacts from becoming repository
content.

## When to Apply

- Before publishing a release.
- When updating direct dependencies, the lockfile, or an npm override.
- When changing template handling or the plugin's build environment.

## Examples

Use the documented release validation as one command sequence:

```sh
npm audit --package-lock-only --audit-level=low
npm test
```

## Related

- `SECURITY.md`
- `docs/solutions/security-issues/harden-webpack-plugin-inputs-and-dependencies.md`
