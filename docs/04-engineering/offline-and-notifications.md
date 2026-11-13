---
title: "Offline behavior and notifications"
description: "Understand the Serwist service worker, cache exclusions for API requests, browser push subscription, and notification flows."
---

> **In one line:** the app has a service worker for static resources and push events, while protected API data is intentionally excluded from its default runtime cache.

## Service worker

`next.config.mjs` configures `@serwist/next` with `src/app/sw.ts` as the
worker source and writes the generated worker to `public/sw.js`. The worker
uses Serwist's default cache rules after filtering out matchers whose
representation contains `/api/` or `api.amazecc`.

The worker also contains a narrowly scoped background-sync path for a same
origin `POST /legacy-post`. Do not describe all API mutations as queued
offline: this handler checks a specific URL, and the normal API cache entries
are filtered out.

## Push subscription flow

`src/app/pushNotificationManager.tsx` checks for Service Worker and Push API
support, registers `/sw.js`, and reads an existing subscription. When the
user enables push, the browser requests notification permission, uses the
public VAPID key, creates a subscription, and sends the subscription data to
the API. The service worker displays incoming push payloads and opens the app
when a notification is clicked.

The VAPID **public** key is safe to expose as `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
The matching private key must remain in the backend environment; it must never
be added to this frontend.

## Debug push

1. Check whether the browser supports Service Workers and Push API.
2. Check notification permission in browser site settings.
3. Confirm the public key is present in the frontend build environment.
4. Inspect the subscribe request and response in DevTools.
5. Ask the API operator to check subscription storage and delivery logs.

Push requires a secure context in production (HTTPS). Browser permission,
device support, and platform rules can also prevent delivery.

## Where to next

- [Deployment and environments](./deployment-and-environments.md)
- [Browser storage](../02-frontend-architecture/browser-storage.md)
- [System tools](../03-admin-workspaces/system-tools.md)
