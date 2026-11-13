---
title: "Static export and routing"
description: "Understand the two Next.js pages, static output, client-side navigation, base paths, and why API calls go to another service."
---

> **In one line:** Next.js organizes the dashboard pages and produces static files; the separate API service handles protected data requests.

## The two app pages

The App Router maps files under `src/app/` to URLs:

| File | URL | What it renders |
|---|---|---|
| `src/app/page.tsx` | `/` | `Main`, the admin portal |
| `src/app/admin/page.tsx` | `/admin` | Also renders `Main` |
| `src/app/upload/page.tsx` | `/upload` | Upload experience |

These route files are small entry points. They import the actual screen
components from `src/components/`.

## Static export

`next.config.mjs` sets `output: "export"`. A production build writes static
files into `out/`, which a static host can serve. The browser executes the
interactive React code after loading those files. There is no private Next.js
server runtime in this deployed artifact to hold database credentials.

When you add a page, check whether the static host can serve its generated
path and whether a `basePath` is configured. `NEXT_PUBLIC_BASE_PATH` is read
by the Next config for deployments that serve the site below a URL prefix.

## Why `/api/...` is not a dashboard route

In component code, `/api/admin/stats` is passed to `apiFetch`, which prefixes
`API_BASE`. It means “call the backend API's admin stats endpoint,” not “run a
Next.js route inside this static website.” Keep frontend and backend URLs
distinct in your mental model.

## Where to next

- [Repository map](../05-reference/repository-map.md)
- [API client and data loading](./api-client-and-data-loading.md)
- [Deployment and environments](../04-engineering/deployment-and-environments.md)
