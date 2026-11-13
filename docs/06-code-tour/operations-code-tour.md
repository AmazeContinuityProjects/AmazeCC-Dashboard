---
title: "Operations workspaces code tour"
description: "Understand transport, cab share, users, audit logs, push broadcast, settings, clubs, faculty, and fresher-resource component patterns."
---

These workspaces are mounted by `Main.tsx` based on `activeTab`. Most own their data and forms locally. This tour identifies how to follow a screen's source; always verify the actual API path and payload in the named component before changing it.

## TransportManager.tsx

**Source:** `src/components/custom/admin/TransportManager.tsx`.

This is a large workspace with route and transport configuration sections. Start with its many state declarations and group them by domain (route list, selected route, stop editing, schedules, filters, modal state). Then trace each loader into the effect that invokes it. Find each save/delete handler and record its API path, method/body, success/error test, and state refresh. The module's 900-plus lines contain repeated form and table JSX; a field's `value` and `onChange` connect the visible control to state, while a save button passes a callback into the corresponding handler.

When a handler edits nested arrays, inspect whether it maps over a copy or mutates an existing object. React state should normally receive a new array/object. Route IDs and stop IDs have different meanings; follow the identifier in the request URL/body rather than assuming a display label is unique.

## CabShareAdminTab.tsx

**Source:** `src/components/custom/admin/CabShareAdminTab.tsx`.

This screen has two network boundaries: the shared `apiFetch` helper and a direct request to the CabShare service host. Read the host constant before debugging environment behavior: changing `NEXT_PUBLIC_API_BASE` does not automatically move a hard-coded absolute URL. Direct `fetch` also needs its own authorization/header setup if the endpoint requires it.

The state/effect pattern loads hubs and settings; handlers create or update hubs and persist global settings. A controlled input displays state, and its `onChange` callback stores the latest text. A submit handler should prevent the default page reload, validate values, await the request, parse the result, display feedback, and refresh the affected collection.

## AdminUsersTab.tsx

**Source:** `src/components/custom/admin/AdminUsersTab.tsx`.

The parent passes `currentUserRole` from `Main.tsx`. The component uses it to adapt which management actions are shown, alongside its list/filter/modal state. Trace the user loader first, then each role/permission mutation. The API must enforce user-management authorization; a role-based conditional in JSX only controls visibility.

Search and filter values are usually combined to derive the visible user array. `.filter` returns a new array and each row is created with `.map`. A form action typically gathers controlled fields into a payload and calls the relevant endpoint. After success, look for a refreshed list or local replacement so the table reflects saved data.

## AuditLogsManager.tsx

**Source:** `src/components/custom/admin/AuditLogsManager.tsx`.

This screen is primarily read-oriented: it loads audit events and summary counts, then filters and formats them for display. A date/string filter remains local state until used to derive the visible rows or included as request query parameters. Formatters convert stored timestamps and event metadata into readable values; they should not alter the original records.

When an event is missing optional fields, check for optional chaining (`?.`) and fallback operators (`??` or `||`). `??` preserves zero and empty strings; `||` does not. This difference matters when rendering numeric counts.

## PushBroadcastTab.tsx

**Source:** `src/components/custom/admin/PushBroadcastTab.tsx`.

The component stores message fields and a sending flag. Submission prevents the HTML form default, validates required values, creates a JSON body, and posts to the push admin endpoint. During the request, the sending flag can disable the button to prevent duplicate submissions. A successful status message means the API accepted the broadcast request; delivery semantics belong to the backend/push provider, not this component.

## SettingsTab.tsx

**Source:** `src/components/custom/admin/SettingsTab.tsx`.

Settings are loaded into local draft state, edited with controlled fields, and sent back through save handlers. Separate persisted settings from transient UI flags such as `loading`, `saving`, open accordions, and feedback messages. If a save updates only one setting group, confirm the request payload preserves other groups and the post-save refresh does not overwrite unsaved edits.

## ClubsManagementTab.tsx, FacultyDirectoriesTab.tsx, FresherResourcesTab.tsx

**Sources:** corresponding files in `src/components/custom/admin/`.

These three modules share a collection editor pattern: load records, store a filtered list, open a form for create/edit, submit a payload, then refresh or update the list. Their record shapes and permissions differ, so do not copy API paths or field names between them without checking the backend reference.

- **ClubsManagementTab:** club/chapter rows, their metadata, and management forms.
- **FacultyDirectoriesTab:** directory entries and faculty-specific permission handling.
- **FresherResourcesTab:** resource links/content and the matching access permission.

Look for the form reset function when opening “Add” and the record-copy function when opening “Edit.” Resetting prevents values from the previously selected row leaking into a new form. The `isEditing ? update : create` ternary often chooses the write path. The list may use a stable record ID for React's `key`.

## CommandPalette.tsx

**Source:** `src/components/custom/admin/CommandPalette.tsx`.

The command palette receives `isOpen` and callbacks from `AdminLayout`. Its local query state filters a set of navigation actions, while a selected index supports keyboard movement. Effects attach keyboard listeners while open and return cleanup functions to remove them. A key handler often branches on `event.key`, calls `preventDefault`, and then updates the selection or invokes the highlighted action. The `onSelect` callback returns control to the parent for tab changes and closing the dialog.

## Shared language patterns

- **`ChangeEvent<HTMLInputElement>`**: an input change event with a typed `target`.
- **`FormEvent` + `preventDefault()`**: stop a form from navigating/reloading the page.
- **`setBusyId(record.id)`**: track a request for one row so unrelated actions remain enabled.
- **`try/catch/finally`**: handle rejection and reliably reset loading state.
- **`Object spread`** (`{ ...record, name }`): copy fields and override selected values.
- **Functional setter** (`setRows(rows => rows.filter(...))`): compute from the latest state.
- **Controlled input** (`value={name}`): state is the displayed value; `onChange` writes the new value.
- **Absolute service URL**: bypasses the shared API base and may have distinct CORS/auth behavior.

## Keep the guide current

For each changed action, update the source path, endpoint description, and error/success behavior from the implementation. Do not infer delivery, persistence, permission, or business rules from button labels; those rules live in API handlers and services.

## Related pages

- [System tools overview](/03-admin-workspaces/system-tools)
- [Transport and day-scholars guide](/03-admin-workspaces/transport-and-dayscholars)
- [Roles and permissions](/01-admin-portal/roles-and-permissions)
