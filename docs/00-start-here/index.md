---
title: "AmazeCC Dashboard: start here"
description: "Understand what this repository runs, how the browser talks to the AmazeCC API, and where a new developer should begin."
---

> **In one line:** this repository builds the browser interface administrators use to manage AmazeCC content and services; the separate AmazeCC API performs the protected data operations.

The name “Dashboard” can make this repo sound like the student timetable and
attendance app. The code currently in this repository is the **AmazeCC Admin
Portal**. It provides an admin sign-in screen and workspaces for moderation,
operations, and system management. The student-facing product and the API are
separate projects.

## How to read this handbook

You only need to know HTML to start. The [five-minute web app guide](./web-app-in-five-minutes.md)
explains the browser/server split, JavaScript, React, HTTP, and JSON. Then use
the [quickstart](./quickstart.md) to run this app and the [request-to-screen
tour](./request-to-screen.md) to follow one real request through the code.

| If you want to… | Start with… |
|---|---|
| Run the admin portal locally | [Quickstart](./quickstart.md) |
| Understand sign-in and access | [Login and session](../01-admin-portal/login-and-session.md) |
| Find where an API call is made | [API client and data loading](../02-frontend-architecture/api-client-and-data-loading.md) |
| Change a screen or its navigation | [Component and state model](../02-frontend-architecture/component-and-state-model.md) |
| Work on QBank or OCR review | [Question bank and OCR](../03-admin-workspaces/question-bank-and-ocr.md) |
| Locate code quickly | [Repository map](../05-reference/repository-map.md) |

## The app at a glance

```text
Browser
  ├─ Next.js page: src/app/page.tsx
  ├─ Admin application: src/components/custom/Main.tsx
  ├─ Workspace components: src/components/custom/admin/ and qbank/
  └─ HTTPS/JSON request through src/lib/api.ts
          ↓
Separate AmazeCC API service
  ├─ Checks the admin bearer token and permissions
  ├─ Reads or changes database/storage records
  └─ Returns JSON for the browser to display
```

The browser app is built as a static export. That means the deployed files
contain the interface, while protected data and authorization belong to the
backend API. A hidden menu button is not a security boundary: the API must
check permission on every protected operation.

## What is authoritative?

This handbook follows the implementation. Start at `src/app/page.tsx`, then
trace into `Main.tsx`, `AdminLayout.tsx`, and `src/lib/api.ts`. Some root README
sections still describe an earlier student-facing app and an older backend;
use those sections as historical context only when the code confirms them.

## Next steps

- [Learn the web app mental model](./web-app-in-five-minutes.md)
- [Run the portal locally](./quickstart.md)
- [See a request become a screen](./request-to-screen.md)
