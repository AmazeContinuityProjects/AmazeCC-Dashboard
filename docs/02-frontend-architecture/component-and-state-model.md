---
title: "Components and state"
description: "Learn how Main, AdminLayout, and workspace components divide responsibilities and how state changes update the visible screen."
---

> **In one line:** a React component returns part of the interface, and state is the remembered value that tells React when that interface needs to change.

## Component: a reusable UI function

A React component is usually a TypeScript function that returns JSX. JSX looks
similar to HTML, but it is written inside JavaScript and can include values,
conditions, and other components. For example, `src/app/page.tsx` returns the
`Main` component; `Main` returns a sign-in form or the admin layout.

This separation keeps the page entry small and lets each workspace focus on
its own task. Many workspaces are dynamically imported from `Main.tsx`, so the
browser can load them on demand.

## State: values that change while the app runs

`Main` uses React's `useState` for values such as whether the admin is signed
in, which tab is selected, and whether a request is loading. When a state
setter runs, React renders the component again so the page reflects the new
value.

State should live near the components that need it. The selected top-level
workspace lives in `Main`; a form's unsaved input usually belongs in that
workspace. Persist data only when a refresh should preserve it, and choose
storage deliberately.

## Props: values passed down

Props are inputs a parent passes to a child. `Main` passes `activeTab`, setter
functions, role, permissions, and summary counts to `AdminLayout`. The layout
uses those props to render selected navigation and its children. This is the
normal way these components coordinate; avoid reaching into a parent
component's private state.

## Effects: work tied to a screen lifecycle

`useEffect` runs browser-side work after a component renders. The app uses it
to read saved auth data, install keyboard listeners, and refresh data. Effects
that register timers or listeners should clean them up when the component is
removed, or repeated mounts can create duplicate work.

## Loading, success, and failure

An API-backed screen generally needs three visible states:

1. **Loading:** the request has not finished.
2. **Success:** usable data arrived; render the workspace.
3. **Failure:** show a useful error and, when appropriate, a retry action.

Do not silently turn every failure into an empty list. An empty result and a
failed request mean different things to an administrator.

## Where to next

- [API client and data loading](./api-client-and-data-loading.md)
- [Browser storage](./browser-storage.md)
- [Admin shell and navigation](../01-admin-portal/navigation-and-shortcuts.md)
