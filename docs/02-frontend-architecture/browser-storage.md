---
title: "Browser storage and persistence"
description: "Learn what this app stores in localStorage, how those values survive reloads, and how to handle browser storage safely."
---

> **In one line:** React state disappears when the page reloads; browser local storage survives reloads, but it is visible to JavaScript on the same site.

## React state is temporary

A `useState` value exists while its component is mounted. It is ideal for
current form input, open/closed dialogs, and the active tab. A browser refresh
recreates the component and resets that state unless the app saves it
somewhere else.

## Local storage survives reloads

`localStorage` is a browser key/value store scoped to a website origin. This
app reads and writes values such as `admin_token`, `admin_role`, and
`admin_permissions` in `Main.tsx`, and `apiFetch` reads the token before
requests. Other features keep preferences and state in local storage too;
search for the exact key before changing its behavior.

Local storage is not encrypted storage. Any script running on the same origin
can read it. Keep private credentials out of it when possible, minimize token
lifetime on the backend, and never log token values.

## Server rendering and static export

Browser APIs such as `window` and `localStorage` do not exist during a
server-side render. Use them inside client-side effects or guard access with
`typeof window !== "undefined"`. This repo statically exports its pages, but
components still need to avoid browser-only work at module initialization if
the build evaluates that code in Node.

## Safe persistence checklist

- Is the value needed after reload?
- Does it contain a credential or personal data?
- Is the data shape checked before parsing JSON?
- What happens if the stored value is missing or corrupted?
- Is there a clear deletion path on logout or when the feature resets?

## Where to next

- [Admin login and session](../01-admin-portal/login-and-session.md)
- [Static export and routing](./static-export-and-routing.md)
- [Offline behavior](../04-engineering/offline-and-notifications.md)
