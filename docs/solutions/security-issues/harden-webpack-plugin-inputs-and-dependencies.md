---
title: Harden webpack plugin inputs and dependency resolution
date: 2026-08-25
category: security-issues
module: version-file-plugin
problem_type: security_issue
component: tooling
symptoms:
  - "Dependency audit reports vulnerable production, peer, and development packages"
  - "Output asset names can be absolute or traverse out of the build output"
  - "Undocumented plugin options are visible to EJS templates"
root_cause: missing_validation
resolution_type: dependency_update
severity: high
tags: [webpack, ejs, dependency-security, path-validation]
---

# Harden webpack plugin inputs and dependency resolution

## Problem

The plugin permitted unsafe emitted asset names, passed its full configuration
object to EJS, and resolved dependency versions covered by security advisories.
Those conditions enlarged the build-time attack surface and allowed consumers to
install vulnerable webpack releases.

## Symptoms

- `npm audit --package-lock-only` reported affected dependencies.
- An `outputFile` value could be absolute or contain traversal segments.
- An EJS template could read undocumented plugin-option keys.

## What Didn't Work

- Updating only direct production dependencies left vulnerable transitive
  packages in the full audit. The lockfile also required an override for
  Mocha's development-only serializer dependency.

## Solution

- Restrict `outputFile` to a relative asset name and reject absolute paths,
  NUL bytes, and `..` segments in `index.js`.
- Pass EJS a new locals object containing only `package`, `buildTime`, and
  `extras`.
- Remove Underscore and the undeclared Chalk import, upgrade EJS and webpack's
  peer floor, and lock safe dependency resolutions in `package.json` and
  `package-lock.json`.
- Add tests for rejected asset paths and for the documented EJS-local boundary.

## Why This Works

Absolute and traversing asset paths are no longer accepted, while supported
relative asset names remain available. Template rendering no longer receives
implementation configuration as top-level locals. The peer range excludes
known-vulnerable webpack versions under normal peer-resolution enforcement, and
the lock file resolves the reviewed graph.

## Prevention

- Run the full lockfile audit, not only a production-only audit, before a
  release:

  ```sh
  npm audit --package-lock-only --audit-level=low
  ```

- Keep path-rejection and template-local tests alongside every future
  configuration or rendering change.
- Treat EJS templates as trusted build-time code; CI jobs for untrusted changes
  must not receive secrets.

## Related Issues

- `docs/solutions/best-practices/webpack-plugin-integration-test-baseline.md`
