---
title: Test webpack plugins through the compiler API before changing behavior
date: 2026-08-25
category: best-practices
module: testing
problem_type: best_practice
component: testing_framework
severity: medium
applies_when:
  - Updating a webpack plugin that emits compilation assets
  - Changing template, manifest, or output-path handling
tags: [webpack, mocha, integration-testing, regression]
---

# Test webpack plugins through the compiler API before changing behavior

## Context

`VersionFilePlugin` integrates through webpack compilation hooks, so direct
method-level tests alone would not verify that an asset is emitted in a real
compilation. Before changing its security-sensitive configuration handling, a
baseline suite was added to preserve current supported behavior.

## Guidance

Use webpack's public Node API in an isolated temporary project. Create a
minimal entry module and package manifest, run the compiler, close it, then
assert the generated asset from the output directory. Keep fixture creation and
cleanup inside the test so no build output is shared between cases.

The suite in `test/version-file-plugin.test.js` covers the default asset,
inline templates with extras and nested asset paths, external EJS templates,
and constructor errors for invalid or missing manifest input. Run it with:

```sh
npm test
```

## Why This Matters

The plugin relies on webpack hook ordering, `sources.RawSource`, and asset
emission semantics that mocks can easily misrepresent. Compiler-level tests
provide a regression boundary while still keeping the assertions deterministic:
they check stable rendered content and valid UTC formatting rather than an exact
wall-clock build timestamp.

## When to Apply

- Before tightening validation for plugin options, input files, template
  locals, or emitted asset names.
- After changing supported webpack versions or rendering dependencies.
- When a new configuration mode must work through webpack rather than only in
  a direct method call.

## Examples

Prefer a real compiler lifecycle with cleanup:

```js
const compiler = webpack(configuration);
compiler.run((runError, stats) => {
  compiler.close((closeError) => {
    // Reject errors, then inspect the emitted file.
  });
});
```

Avoid asserting the exact `buildTime` value. Confirm instead that the rendered
timestamp parses and round-trips as a UTC string.
