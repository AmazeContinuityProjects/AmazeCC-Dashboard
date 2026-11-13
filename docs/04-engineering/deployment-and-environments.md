---
title: "Deployment and environments"
description: "Understand public frontend configuration, build-time values, static output, and the dashboard's GitHub Pages workflow."
---

> **In one line:** CI builds the Next.js static export, then the deployment workflow publishes `out/`; the frontend still calls the API host configured into that build.

## Build-time configuration

Next.js replaces references to public environment variables while building
the frontend. This makes values such as the API base URL and public VAPID key
available to browser code. If you change a public variable, rebuild and
redeploy; changing a server environment after the static files were generated
does not rewrite the JavaScript bundle.

The key currently used by `src/lib/api.ts` is `NEXT_PUBLIC_API_BASE`, with
`NEXT_PUBLIC_API_URL` as a fallback. `next.config.mjs` also reads
`NEXT_PUBLIC_BASE_PATH`. Push subscription UI reads
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`. Consult `.env.example` and the source before
adding a new configuration variable.

Never put a private VAPID key, database URL, API secret, or password in a
`NEXT_PUBLIC_` variable. Browser code is inspectable by every site visitor.

## GitHub Pages workflow

`.github/workflows/nextjs.yml` runs on pushes to `main` and manual dispatch.
It installs dependencies, runs `pnpm build`, uploads `out/`, and deploys that
artifact to GitHub Pages. The app can also have configuration for other hosts;
read the target host's actual deployment file before describing its behavior.

## Base path

`next.config.mjs` reads `NEXT_PUBLIC_BASE_PATH` into Next's `basePath`. This
supports serving the app below a path prefix. A base path affects asset and
route URLs; when changing it, check images, links, the service worker path, and
API calls independently.

## Where to next

- [Testing and build](./testing-and-build.md)
- [Static export and routing](../02-frontend-architecture/static-export-and-routing.md)
- [Environment variable catalog](../05-reference/configuration-catalog.md)
