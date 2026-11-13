---
title: "Workspace module catalog"
description: "A source-file index for each admin workspace, the data and interactions it owns, recurring syntax patterns, and where to continue reading."
---

> **Source of truth:** the `src/components/custom/admin/` and `src/components/custom/qbank/` directories. This catalog maps modules by responsibility; follow the feature page and source file for the current exact behavior.

## How to read a workspace component

Start at the imports, then locate `useState` declarations, request functions, effects, event handlers, and the final return. In most modules, `apiFetch` is the network boundary; local state stores form/filter/modal state; JSX maps arrays into rows or cards. The [syntax guide](/06-code-tour/typescript-react-syntax) explains `useState`, `useEffect`, callbacks, generics, JSX, array methods, `async`/`await`, and error handling used across these files.

## Shared shell and overview

| Source file | Responsibility and patterns |
|---|---|
| `src/components/custom/Main.tsx` | Session restoration, login/logout, SWR stats, tab selection, lazy imports. See [Main walkthrough](/06-code-tour/main-login-and-shell). |
| `src/components/custom/admin/AdminLayout.tsx` | Permission-filtered sidebar, responsive state, keyboard shortcut, command palette and upload modal. See [layout walkthrough](/06-code-tour/admin-layout-line-by-line). |
| `src/components/custom/admin/AdminLandingPage.tsx` | Stats request/polling, derived chart values, triage cards and upload entry point. See [overview walkthrough](/06-code-tour/admin-overview-data-flow). |
| `src/components/custom/admin/AdminUI.tsx` | AmazeUI re-exports and compatibility wrappers. See [shared UI walkthrough](/06-code-tour/shared-admin-ui). |
| `src/components/custom/admin/CommandPalette.tsx` | Searchable keyboard-driven navigation. Read state/effect setup, normalized search text, filtered items, selected index, and key handling. |
| `src/components/custom/qbank/UploadPaperModal.tsx` | Paper metadata and file/JSON inputs, request submission, and queue handoff. Follow its form state into submit and upload handlers. |

## Content and question bank

| Source file | What it owns |
|---|---|
| `src/components/custom/admin/PapersManager.tsx` | Paper list, metadata/status edits, replacement/import actions. |
| `src/components/custom/admin/QuestionsManager.tsx` | Question list, filters, inline edits, and bulk actions. |
| `src/components/custom/admin/DiagramsManager.tsx` | Diagram list and image upload/update flows tied to questions. |
| `src/components/custom/admin/StorageManager.tsx` | Storage metrics, file operations, and question-bank imports. |
| `src/components/custom/qbank/AdminQueueTab.tsx` | OCR queue review, edit, reject/publish, question editing, diagram upload, and bulk import. |
| `src/components/custom/qbank/SplitScreenReview.tsx` | Side-by-side paper/question review, question CRUD, diagrams, bulk import, and publish actions. |

These screens often combine an initial list request with detail requests after selection. Check whether a handler updates local state optimistically or waits for the server response; that distinction controls what the operator sees after a failed request. The [question bank and OCR guide](/03-admin-workspaces/question-bank-and-ocr) explains the broader workflow.

## Store and billing

| Source file | What it owns |
|---|---|
| `src/components/custom/admin/gorobo/GoRoboAdmin.tsx` | Store tab shell and initial sub-tab selection. |
| `src/components/custom/admin/gorobo/GoRoboAnalytics.tsx` | Store metrics and analytics views. |
| `src/components/custom/admin/gorobo/GoRoboInventory.tsx` | Inventory, stock adjustments, and product operations. |
| `src/components/custom/admin/gorobo/GoRoboBillProcessor.tsx` | Order/billing workflow. This is one of the largest modules; trace each action handler and its API helper call separately. |
| `src/components/custom/admin/gorobo/GoRoboBundles.tsx` | Bundle/project-kit management. |
| `src/components/custom/admin/gorobo/AmazeWallet.tsx` | Wallet operations and balance-related views. |
| `src/components/custom/admin/gorobo/gorobo-api.ts` | Store API base, typed payloads, query-string construction, response handling, and exported request functions. |

The GoRobo code uses shared API wrappers and formatting helpers. Read `gorobo-api.ts` before following a screen request; it can translate UI options into URLs and normalize responses. Continue with the [GoRobo feature guide](/03-admin-workspaces/gorobo-store).

## Operations and user management

| Source file | What it owns |
|---|---|
| `src/components/custom/admin/TransportManager.tsx` | Transport routes and related configuration; large multi-section workspace. |
| `src/components/custom/admin/CabShareAdminTab.tsx` | Cab-share hubs and settings; inspect its direct fetch host as well as shared API requests. |
| `src/components/custom/admin/PushBroadcastTab.tsx` | Push notification composition and send request. |
| `src/components/custom/admin/AdminUsersTab.tsx` | User list, filters, role/permission actions. |
| `src/components/custom/admin/AuditLogsManager.tsx` | Audit log request, filters, and event display. |
| `src/components/custom/admin/SettingsTab.tsx` | Admin settings forms and persistence actions. |
| `src/components/custom/admin/ClubsManagementTab.tsx` | Club and chapter management. |
| `src/components/custom/admin/FacultyDirectoriesTab.tsx` | Faculty directory data and editing. |
| `src/components/custom/admin/FresherResourcesTab.tsx` | Resource list and content management. |

For every write operation, follow the click handler through request construction, response parsing, success/error UI, and any list refresh. A hidden navigation item is not server authorization. The backend must independently check the token and permission. The [system tools guide](/03-admin-workspaces/system-tools) summarizes these workspaces.

## Recurring syntax and code-reading checklist

- **State:** `useState<T>(initial)` gives a value and setter. Search for every setter to find user actions that change it.
- **Effects:** `useEffect(callback, dependencies)` runs browser work; a returned function cleans up timers/listeners. Check dependencies against values read inside the effect.
- **Network calls:** `await apiFetch(path, options)` sends a request. Read the body handling and check both HTTP status and application `success` fields where applicable.
- **Forms:** `onSubmit` handlers usually call `preventDefault`; controlled inputs use `value` and `onChange`.
- **Collections:** `.map` builds repeated UI, `.filter` narrows it, `.find` picks one item, and `.some`/`.includes` check membership.
- **Type assertions:** `as SomeType` and `as any` affect compile-time checking only. They do not parse, convert, or validate a value.
- **Conditional JSX:** `condition && <Panel />` renders a panel only when the condition passes; ternaries choose one of two render values.
- **Callbacks:** `onClick={() => save(item)}` defers the call until the event. `onClick={save}` passes an existing function.
- **File uploads:** `FormData` carries file values; browser code should let the browser set the multipart boundary instead of manually setting a multipart content type.
- **Large modules:** use editor symbol search for the named handler and then read the complete function. A line range alone can omit state or helper behavior defined elsewhere in the file.

This catalog intentionally names each workspace module and describes its responsibility. It is an index, not a substitute for reading the complete module: when a feature changes, update its owning guide and this table together.
