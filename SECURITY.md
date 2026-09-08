# Security maintenance

## Repository protections

GitHub Dependabot security updates, secret scanning, and secret-scanning push
protection are enabled for this repository. Review alerts against the committed
`package-lock.json` before changing dependencies.

## Dependency validation

Before releasing, run the full lockfile audit and test suite:

```sh
npm audit --package-lock-only --audit-level=low
npm test
```

When an advisory affects a transitive dependency, verify the installed paths
with `npm ls <package> --all --omit=optional`; use an `overrides` entry only
when the resolved version needs to be constrained.

## Trust boundary

EJS templates execute during the build and are trusted code. Do not allow
untrusted contributors to supply templates or provide build jobs for
untrusted changes with secrets.
