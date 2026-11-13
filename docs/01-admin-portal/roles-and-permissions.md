---
title: "Roles and permissions"
description: "Understand the superadmin/admin roles, permission-filtered navigation, and why the backend must enforce every protected action."
---

> **In one line:** the frontend uses a role and permission list to decide which workspaces to show; only the API can enforce access to data and operations.

After successful sign-in, `Main.tsx` saves a role and permission list and passes
them to `AdminLayout`. The current role names in the UI are `superadmin` and
`admin`. `AdminLayout.tsx` uses them to filter entries in its `navGroups` list.

## Permission-filtered navigation

Some menu items have a `requiredPermission`, such as `transport`, `gorobo`, or
`manage_users`. Superadmins see those items. Other admins see them only when
the permission list includes the required value. Faculty directories also
accept the older alias `faculty-directory` alongside `faculty-directories`.

Other navigation entries currently use `requiredPermission: null`; they are
shown to every signed-in role in this UI. That display choice is not proof that
the backend operation is public or safe. The API route must perform its own
role and permission checks.

## Add a permission-gated workspace

If you add a new protected workspace:

1. Find the permission string expected by the API. Do not invent a new spelling.
2. Add a `requiredPermission` to the matching item in `AdminLayout.tsx`.
3. Check that `Main.tsx` renders the correct component for its tab ID.
4. Ensure the API protects every data operation even if a user manually types
   a request or changes browser state.
5. Document the permission and the owning backend route.

The UI is useful for discoverability. It is not the security boundary.

## Where to next

- [Navigation and shortcuts](./navigation-and-shortcuts.md)
- [Admin login and session](./login-and-session.md)
- [API admin authentication](https://docs.amazecc.com/amazecc-api/01-authentication/admin-auth)
