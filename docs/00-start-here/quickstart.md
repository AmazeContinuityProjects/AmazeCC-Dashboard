---
title: "Run the admin portal locally"
description: "Install the dashboard, configure its API address, start the HTTPS development server, and understand common setup failures."
---

> **In one line:** install Node and pnpm, install dependencies, point the frontend at an API server, then run `pnpm dev` on port 3002.

## What you need

- Node.js 22 (the CI workflow uses Node 22).
- pnpm, matching the `packageManager` version in `package.json`.
- Access to a working AmazeCC API instance and an admin account if you want
  to use protected workspaces.
- A terminal and a browser that trusts the local development certificate.

## Install and start

<Steps>
  <Step title="Clone the repository">

```bash
git clone https://github.com/AmazeContinuityProjects/AmazeCC-Dashboard.git
cd AmazeCC-Dashboard
```
  </Step>
  <Step title="Install dependencies">

```bash
pnpm install
```
  </Step>
  <Step title="Configure the API address">

Copy `.env.example` to `.env.local` (or `.env`) and set the API base URL. The
example points to `http://localhost:3005`; change it to the address where your
API is actually running. The production fallback in `src/lib/api.ts` is
`https://api.amazecc.com`.

<CodeGroup>

```env local
NEXT_PUBLIC_API_BASE=http://localhost:3005
```

```env production
NEXT_PUBLIC_API_BASE=https://api.amazecc.com
```

</CodeGroup>
  </Step>
  <Step title="Start the development server">

Then start the development server:

```bash
pnpm dev
```

The script uses Next.js with experimental HTTPS on port **3002**. Open
`https://localhost:3002`. Your browser may show a local certificate warning;
that is because the development certificate is not a public website
certificate.
  </Step>
</Steps>

## Make your first read-only check

The application opens at its admin sign-in page. You need a valid admin
account to see protected workspaces. If you only want to confirm the frontend
starts, the sign-in page is enough; do not put real credentials in a code
example, terminal transcript, or commit.

The browser's Network panel (DevTools → **Network**) shows requests the page
makes. Select a request to inspect its URL, method, status, request headers,
and JSON response. Never share a screenshot containing a bearer token.

## Useful scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Runs the local HTTPS development server on port 3002 |
| `pnpm lint` | Runs ESLint over the project |
| `pnpm typecheck` | Checks TypeScript types without producing output files |
| `pnpm test` | Runs the Vitest unit tests |
| `pnpm build` | Builds the static export into `out/` |

## If something goes wrong

| Symptom | What to check |
|---|---|
| The page loads, but sign-in says it cannot connect | Check `NEXT_PUBLIC_API_BASE`, API availability, HTTPS/HTTP compatibility, and browser CORS errors |
| Sign-in is rejected | The API owns admin credentials and role policy; confirm the account with the API maintainer |
| A page shows 401/403 after sign-in | The saved token may be expired, or the role may lack that permission; sign out and sign in again, then ask the API maintainer about access |
| `pnpm dev` cannot start | Confirm Node and pnpm versions, then finish `pnpm install` |
| A request goes to the wrong host | `NEXT_PUBLIC_API_BASE` is compiled into the client bundle; restart the dev server after changing it |

## Where to next

- [Follow a request from click to screen](./request-to-screen.md)
- [Understand login and token storage](../01-admin-portal/login-and-session.md)
- [Read the repository map](../05-reference/repository-map.md)
