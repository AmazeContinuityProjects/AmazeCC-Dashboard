---
title: "Frontend architecture"
description: "Understand the Next.js app shell, React state, API client, browser storage, and static export used by the admin portal."
---

> **In one line:** Next.js builds the browser app, React components own visible UI state, and `src/lib/api.ts` connects those components to a separately deployed backend.

This project is a browser-first frontend. It uses Next.js App Router to
organize pages and build output, React to compose interactive screens, and
TypeScript to document expected value shapes. The API server is a different
repository and process.

## The important layers

| Layer | Responsibility | Code |
|---|---|---|
| App route | Select the top-level page for a URL | `src/app/page.tsx`, `src/app/admin/page.tsx` |
| Main client component | Login, active workspace, auth state, overview metrics | `src/components/custom/Main.tsx` |
| Shared admin shell | Sidebar, command palette, mobile layout, common actions | `src/components/custom/admin/AdminLayout.tsx` |
| Workspace | A focused admin task | `src/components/custom/admin/`, `src/components/custom/qbank/` |
| API helper | Base URL, bearer header, JSON parsing/error behavior | `src/lib/api.ts` |
| Design primitives | Buttons, fields, dialogs, shared visual language | `src/components/custom/admin/AdminUI.tsx`, `src/components/ui/` |

## Browser code versus server code

Files with `'use client'` run as interactive browser components. They can use
React state, event handlers, local storage, and browser APIs. The separate
AmazeCC API runs on a server and owns database credentials and protected
operations. Because `next.config.mjs` sets `output: "export"`, the deployed
dashboard is a static bundle; it does not become a private server just because
it was built with Next.js.

## A safe way to change the architecture

Start with one user-visible behavior. Find the page, trace the component that
renders it, locate its data request, and identify where state changes. Keep
server-only credentials on the API. If a change affects routes or user
permissions, review the API contract as well as this frontend.

## Pages in this section

- [Component and state model](./component-and-state-model.md)
- [API client and data loading](./api-client-and-data-loading.md)
- [Browser storage](./browser-storage.md)
- [Static export and routing](./static-export-and-routing.md)
