---
title: "Admin workspaces"
description: "Map the admin portal's content, operations, GoRobo, and system workspaces to their components and backend responsibilities."
---

> **In one line:** each workspace is a focused admin tool rendered inside the shared shell; the shell handles navigation while the workspace owns its task-specific UI and requests.

The current workspace map comes from `Main.tsx` (which selects components)
and `AdminLayout.tsx` (which lists navigation items). Each area is a frontend
for operations ultimately performed by the separate API.

| Workspace | Main purpose | Starting point |
|---|---|---|
| Overview | Service counts, queue health, and shortcuts | `AdminLandingPage.tsx` |
| OCR Queue | Review papers moving through OCR and question approval | `src/components/custom/qbank/AdminQueueTab.tsx` |
| Papers and Questions | Manage paper records and extracted questions | `PapersManager.tsx`, `QuestionsManager.tsx` |
| GoRobo | Store inventory, order processing, wallet, bundles, and analytics | `src/components/custom/admin/gorobo/GoRoboAdmin.tsx` |
| Transport | Manage bus routes and student assignments | `TransportManager.tsx` |
| System tools | Users, storage, push, clubs, cabshare, logs, and settings | `src/components/custom/admin/` |

## A useful way to learn a workspace

Pick one action, such as changing a stock quantity. Find the component that
renders the button, follow its click handler, locate the request helper, and
then check how the response updates the screen. The API handbook is the source
for backend validation, permission checks, database changes, and exact route
contracts.

## Pages in this section

- [Question bank and OCR](./question-bank-and-ocr.md)
- [GoRobo Store](./gorobo-store.md)
- [Transport and dayscholars](./transport-and-dayscholars.md)
- [System tools](./system-tools.md)
