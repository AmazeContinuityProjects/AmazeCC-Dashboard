---
title: "Repository map"
description: "A practical directory guide to the Next.js app, admin workspaces, API client, design references, and CI workflows."
---

> **In one line:** start in `src/app/` for URLs, `src/components/custom/` for admin screens, and `src/lib/` for shared browser helpers.

| Path | What belongs there |
|---|---|
| `src/app/` | Next.js route entry points, global CSS, service worker source, push manager, demo data |
| `src/app/page.tsx` | Root page; renders the admin app |
| `src/app/admin/page.tsx` | `/admin`; also renders the admin app |
| `src/app/upload/page.tsx` | File upload experience |
| `src/components/custom/Main.tsx` | Admin login, auth restoration, active workspace, and overview stats |
| `src/components/custom/admin/` | Shared admin shell, system screens, and GoRobo tools |
| `src/components/custom/qbank/` | QBank upload and review UI |
| `src/components/ui/` | Shared primitives and calendar/dropzone pieces |
| `src/lib/api.ts` | API base URL, bearer token helper, shared JSON fetcher |
| `src/lib/auth.ts` | Server-side cookie helper used by app code where applicable |
| `src/hooks/` | Reusable React hooks such as safe local storage |
| `src/types/` | Global and custom TypeScript declarations |
| `design/` | Contributor-facing visual and navigation guidelines |
| `docs/` | Mintlify handbook source and child `docs.json` |
| `grounding/` | Handbook source-of-truth and agent writing instructions |
| `.github/workflows/` | CI, static build/deployment, and docs notification workflows |

## Trace a screen

Start from `src/app/page.tsx`, find the component it returns, then search for
the visible title or API path inside that component tree. This is often faster
than browsing the directory by name alone.

The root `README.md` contains older project structure references; verify each
directory exists before relying on them.

## Where to next

- [Component and state model](../02-frontend-architecture/component-and-state-model.md)
- [Configuration catalog](./configuration-catalog.md)
- [Glossary](./glossary.md)
