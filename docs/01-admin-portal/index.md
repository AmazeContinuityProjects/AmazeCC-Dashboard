---
title: "Admin portal overview"
description: "Learn how the dashboard authenticates administrators and organizes its overview, content, GoRobo, and system workspaces."
---

> **In one line:** the admin portal is a client-side console whose central `Main` component controls login, the selected workspace, and the data each workspace displays.

The portal has three broad layers:

1. **Sign-in and session state** in `src/components/custom/Main.tsx`.
2. **Shared shell** in `src/components/custom/admin/AdminLayout.tsx`: sidebar,
   mobile navigation, command palette, theme switcher, and common actions.
3. **Workspace content**: focused components for papers, OCR, questions,
   transport, GoRobo, storage, clubs, users, and system operations.

## How the shell selects a screen

`Main` stores an `activeTab` string. It passes that value and setters into
`AdminLayout`, then renders the matching workspace component as the layout's
children. Selecting a navigation item changes state and React renders the
corresponding component. This is an in-page switch; the selected admin tab is
not necessarily a separate browser URL.

The navigation groups are defined near the top of `AdminLayout.tsx`. The
render conditions for each workspace are in `Main.tsx`. When adding a
workspace, you usually need to update both places, and you must consider the
backend permission check too.

## Current workspace families

| Area | What it is for | Starting code |
|---|---|---|
| Overview | Counts and operational summary | `AdminLandingPage.tsx` |
| Content | QBank queue, papers, questions, diagrams, fresher resources, faculty directories | `src/components/custom/admin/` and `qbank/` |
| GoRobo Store | Inventory, orders, wallet, bundles, analytics | `src/components/custom/admin/gorobo/` |
| System | Storage, transport, cabshare, push, users, clubs, settings, audit logs | `src/components/custom/admin/` |

The sidebar hides some entries based on role and permission data. Hiding a
menu entry only changes the UI. The API must independently reject requests
that the account is not allowed to perform.

## First-day reading path

1. Read [Login and session](./login-and-session.md).
2. Read [Roles and permissions](./roles-and-permissions.md).
3. Inspect `Main.tsx` and `AdminLayout.tsx` side by side.
4. Pick one workspace and follow its API request into `src/lib/api.ts`.

## Where to next

- [Login and session](./login-and-session.md)
- [Navigation and shortcuts](./navigation-and-shortcuts.md)
- [Admin workspace map](../03-admin-workspaces/index.md)
