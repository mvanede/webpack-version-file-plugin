---
title: Remediate transitive js-yaml advisories with an npm override
date: 2026-09-14
category: security-issues
module: dependency-management
problem_type: security_issue
component: tooling
symptoms:
  - "npm audit reports the high-severity js-yaml advisory GHSA-2883-xcg3-v3hh"
root_cause: vulnerable_transitive_dependency
resolution_type: dependency_update
severity: high
tags: [npm, js-yaml, dependency-security, override]
---

# Remediate transitive js-yaml advisories with an npm override

## Problem

The development dependency graph resolved `js-yaml` 4.3.1 through Mocha, which
is affected by GHSA-2883-xcg3-v3hh. The advisory's fixed range starts at
`js-yaml` 4.3.2.

## Symptoms

- `npm audit --package-lock-only --audit-level=low` reports a high-severity
  advisory for `js-yaml`.

## What Didn't Work

- Relying on Mocha's compatible `^4.1.0` transitive range left the existing
  lockfile at 4.3.1, below the advisory's patched version.

## Solution

Pin the safe transitive resolution with an npm override in `package.json`, then
regenerate the lockfile without running package scripts:

```json
{
  "overrides": {
    "js-yaml": "4.3.2"
  }
}
```

```sh
npm install --package-lock-only --ignore-scripts
npm ci --ignore-scripts
npm audit --package-lock-only --audit-level=low
```

## Why This Works

The override makes npm resolve the Mocha transitive dependency to 4.3.2 instead
of the vulnerable 4.3.1 lockfile entry. A clean install verifies that the lock
file is installable, while the lockfile audit verifies that the resolved graph
no longer contains the advisory.

## Prevention

- Run the lockfile audit before release and after changing any override.
- Use `npm ls js-yaml --all --omit=optional` to confirm the installed transitive
  version.
- Remove the override only after the parent dependency's normal resolution is
  verified to stay at or above the patched version.

## Related Issues

- GHSA-2883-xcg3-v3hh
- `docs/solutions/security-issues/maintain-security-release-checks.md`
