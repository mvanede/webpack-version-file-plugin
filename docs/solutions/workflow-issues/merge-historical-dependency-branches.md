---
title: Preserve current lockfile state when merging historical dependency branches
date: 2026-09-14
category: workflow-issues
module: dependency-management
problem_type: workflow_issue
component: development_workflow
severity: low
applies_when:
  - Merging a historical dependency-update branch into a branch with newer resolved dependencies
tags: [git, merge-conflict, package-lock]
---

# Preserve current lockfile state when merging historical dependency branches

## Context

A request to consolidate every repository branch can include an old dependency
update whose `package-lock.json` conflicts with a newer dependency graph already
on the target branch. Accepting the historical lockfile hunk would downgrade
packages that the target branch has subsequently upgraded.

## Guidance

Treat a lockfile conflict as a dependency-state decision, not a textual merge.
Compare the source branch's intended update with the target branch's current
manifest and lockfile. When the target already resolves a newer compatible
version, keep the target lockfile content and complete the merge so the branch
history is consolidated without regressing the resolved dependency graph.

After resolving the merge, validate both the lockfile syntax and the project
test suite:

```sh
node -e "JSON.parse(require('fs').readFileSync('package-lock.json', 'utf8'))"
npm test
```

## Why This Matters

Lockfiles record a complete dependency graph. A branch that was current when it
was created can be obsolete at merge time, so blindly taking its lockfile side
can discard later security or compatibility updates while still producing a
syntactically valid file.

## When to Apply

- Consolidating long-lived local or remote branches into the default branch.
- Resolving conflicts in `package-lock.json` from older Dependabot updates.
- Merging a branch whose dependency change has already been superseded.

## Examples

Prefer retaining the target side only after confirming it contains the newer
compatible resolved dependency, then record the merge normally:

```sh
git checkout --ours package-lock.json
git add package-lock.json
git commit --no-edit
```

Do not use this as a blanket rule: take the source side or regenerate the
lockfile when the incoming branch contains the required newer dependency state.

## Related

- `docs/solutions/security-issues/maintain-security-release-checks.md`
- `SECURITY.md`
