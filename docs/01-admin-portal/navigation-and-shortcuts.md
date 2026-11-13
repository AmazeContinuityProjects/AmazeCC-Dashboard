---
title: "Navigation and shortcuts"
description: "Find the sidebar groups, mobile navigation behavior, active workspace state, command palette, and upload action."
---

> **In one line:** `AdminLayout` renders the navigation shell, while `Main` owns the selected workspace and chooses its content.

## Sidebar groups

`src/components/custom/admin/AdminLayout.tsx` defines the navigation list.
Its current groups are Overview, Content, GoRoBo Store, and System. Some
entries have nested sub-tabs, such as the QBank queue/courses and the GoRobo
inventory, orders, wallet, bundles, and analytics views.

The layout filters role-protected items before rendering them. On smaller
screens it uses an overlay and a reduced set of mobile navigation entries.
When a menu item is selected, the layout calls `setActiveTab`; `Main.tsx` then
renders the matching component.

## Command palette

The layout listens for **Ctrl+K** or **Cmd+K** and toggles the command palette.
The palette is intended for quick navigation/actions; its options are
implemented in `src/components/custom/admin/CommandPalette.tsx`. If you add a
workspace, check whether the command palette needs the same destination.

## Upload action

The shared shell includes an upload-paper action using
`src/components/custom/qbank/UploadPaperModal.tsx`. This can be available
without opening the QBank workspace, so check both the shell and the QBank
pages when changing upload behavior.

## Add or rename a navigation item

Update the `navGroups` definition and the corresponding `activeTab` render
branch in `Main.tsx`. Search all uses of the old tab ID, including command
palette actions and deep links. The selected item is React state, not
automatically a durable URL; do not promise that a browser refresh restores a
specific tab unless the implementation explicitly persists it.

## Where to next

- [Admin portal overview](./index.md)
- [Component and state model](../02-frontend-architecture/component-and-state-model.md)
- [Repository map](../05-reference/repository-map.md)
