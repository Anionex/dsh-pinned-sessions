# Contributing

Thanks for improving DSH Pinned Sessions. Keep changes focused on reliable Session pinning in supported DeepSeek Harness profiles.

## Set Up

You need Node.js `^22.19.0` or `>=24.0.0` and Corepack.

```bash
git clone https://github.com/Anionex/dsh-pinned-sessions.git
cd dsh-pinned-sessions
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

## Make a Change

1. Create a branch from `main`.
2. Preserve exact Session ID capture. Do not match Sessions by title or list position.
3. Use stable DSH slots, ARIA roles, and official client services. Do not depend on generated CSS Module class names.
4. Add focused tests for behavior changes.
5. Run `pnpm run check` before opening a pull request.

UI changes should also be exercised in real Web and Desktop profiles. Include the tested DSH version, profile, and observed menu order in the pull request.

## Pull Requests

Describe the user-facing behavior, implementation boundaries, and verification evidence. Keep generated `lib/` artifacts in sync with `src/`, because DSH profiles load the committed bundle.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
