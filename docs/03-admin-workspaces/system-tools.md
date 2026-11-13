---
title: "System tools"
description: "Find the dashboard's user, storage, push, club, cabshare, audit-log, settings, faculty, and fresher-resource screens."
---

> **In one line:** the System group gathers administrative screens that manage accounts, stored content, notifications, and shared platform data.

The `AdminLayout.tsx` navigation and `Main.tsx` render map are the best index
of currently wired workspaces. Components include:

| Tool | Component |
|---|---|
| User management | `AdminUsersTab.tsx` |
| Storage browser | `StorageManager.tsx` |
| Push broadcast | `PushBroadcastTab.tsx` |
| Club management | `ClubsManagementTab.tsx` |
| Cabshare administration | `CabShareAdminTab.tsx` |
| Audit logs | `AuditLogsManager.tsx` |
| Global settings | `SettingsTab.tsx` |
| Faculty directories | `FacultyDirectoriesTab.tsx` |
| Fresher resources | `FresherResourcesTab.tsx` |
| Diagrams | `DiagramsManager.tsx` |

## Handle destructive and broad actions carefully

Deleting stored content, changing user access, or broadcasting a notification
affects other people. Read the full click handler and backend route. Confirm
that the UI makes scope clear, handles an API failure, and refreshes affected
data after success. The browser is not authoritative for whether the action
was accepted.

## Direct API calls

Some older or specialized screens build their own `fetch()` URL instead of
using `apiFetch`. Before assuming a request uses the configured base or bearer
header, inspect that component's request code. If you consolidate it, preserve
its method, headers, body, and error behavior and check for environment-specific
hostnames.

## Where to next

- [API client and data loading](../02-frontend-architecture/api-client-and-data-loading.md)
- [Offline behavior and notifications](../04-engineering/offline-and-notifications.md)
- [Deployment and environments](../04-engineering/deployment-and-environments.md)
