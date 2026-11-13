---
title: "Transport and dayscholars"
description: "Understand the admin transport manager and how it differs from the student-facing bus finder described in older project material."
---

> **In one line:** the current dashboard contains an admin transport manager; do not assume this repository also contains the historical student bus-finder UI.

The admin transport screen is `src/components/custom/admin/TransportManager.tsx`.
`AdminLayout.tsx` associates it with the `transport` permission, and `Main.tsx`
renders it for the `buses` tab. Its job is administrative management, not a
student route search experience.

The root README describes student features from an earlier app shape. The
directory `src/components/custom/dayscholar/` currently includes an
`AdminDashboard.tsx`; verify the actual call sites before documenting any
student-facing feature as present in this repo.

## Trace a transport change

When changing a form or route list, inspect the request method, fields, and
response in `TransportManager.tsx`, then check the backend transport
documentation. The backend validates and persists the data; the frontend's
permission filter only changes what is visible in navigation.

## Where to next

- [Roles and permissions](../01-admin-portal/roles-and-permissions.md)
- [System tools](./system-tools.md)
- [Transport API reference](https://docs.amazecc.com/amazecc-api/03-api-reference/admin/)
