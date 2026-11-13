---
title: "Testing and build"
description: "Run ESLint, TypeScript checks, Vitest, and the production static build using the same package scripts used by CI."
---

> **In one line:** use lint for style and common mistakes, typecheck for TypeScript mismatches, tests for behavior, and build to catch production bundling/export issues.

## Available checks

Run these from the repository root:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

| Command | What it checks |
|---|---|
| `pnpm lint` | ESLint rules and common code issues |
| `pnpm typecheck` | TypeScript types without emitting files |
| `pnpm test` | Vitest unit tests matching `src/**/*.test.{ts,tsx}` |
| `pnpm build` | Next.js production build and static export |

Tests run in Node by default in `vitest.config.ts`. Browser-only behavior
needs a suitable mock or browser test setup; passing a unit test does not
prove a real browser permission, network, or push flow works.

## CI workflow

`.github/workflows/ci.yml` runs safety scans, dependency audit, lint,
typecheck, unit tests, and a build. Pull requests targeting `main` or `beta`
run CI; pushes to `beta` also run it. The deployment workflow separately
builds and deploys the `main` branch to GitHub Pages.

## Static output

The production Next build uses `output: "export"`; the exported site is under
`out/`. GitHub Pages CI checks that `out/index.html` exists before uploading
the artifact. For a new route, confirm it can be statically generated and
served at the expected path.

## Where to next

- [Deployment and environments](./deployment-and-environments.md)
- [Static export and routing](../02-frontend-architecture/static-export-and-routing.md)
- [Quickstart](../00-start-here/quickstart.md)
