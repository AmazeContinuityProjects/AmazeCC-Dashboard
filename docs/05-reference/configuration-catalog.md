---
title: "Configuration catalog"
description: "Documented build-time environment variables and their source files, including which values are public in the browser."
---

> **In one line:** the frontend reads a small set of public build-time variables; anything prefixed with `NEXT_PUBLIC_` can appear in the browser bundle.

| Variable | Used by | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | `src/lib/api.ts` | Preferred base URL for AmazeCC API requests |
| `NEXT_PUBLIC_API_URL` | `src/lib/api.ts`, one specialized screen | Fallback API URL; a few components may build URLs directly |
| `NEXT_PUBLIC_BASE_PATH` | `next.config.mjs` | Optional path prefix for static hosting |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `src/app/pushNotificationManager.tsx` | Public key used by the browser to subscribe to web push |

`src/lib/api.ts` defaults to `https://api.amazecc.com` if neither API base
variable is set. The checked-in `.env.example` also contains legacy names;
verify a variable's usage in source before assuming it affects the current app.

## Public versus private values

Next.js exposes `NEXT_PUBLIC_` values to browser JavaScript. Safe examples
include a public website URL or a public push subscription key. Unsafe examples
include a database password, private VAPID key, admin credential, or server
token. Keep secrets in the backend's environment or a protected CI secret.

## After changing configuration

For local development, restart `pnpm dev` after changing a value. For a static
deployment, rebuild and redeploy so the new public value is included in the
generated files. Verify the browser request's URL in DevTools.

## Where to next

- [Deployment and environments](../04-engineering/deployment-and-environments.md)
- [API client and data loading](../02-frontend-architecture/api-client-and-data-loading.md)
- [Quickstart](../00-start-here/quickstart.md)
