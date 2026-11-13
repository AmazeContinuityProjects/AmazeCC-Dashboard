---
title: "Overview data flow"
description: "Read AdminLandingPage.tsx from its response interface through polling, loading and error branches, derived metrics, and dashboard actions."
---

> **Source:** `src/components/custom/admin/AdminLandingPage.tsx`.

This screen requests overview statistics itself. That is separate from the SWR request in `Main.tsx`: both currently request `/api/admin/stats`, so the shell and this screen can each make a request. When debugging duplicate traffic, inspect both call sites.

## Imports and response shape

`'use client'` is required because this module uses hooks and click handlers. React supplies state/effects; Lucide supplies icons; `apiFetch` sends the request; Framer Motion supplies animated elements; `AdminUI` provides shared visual components; `UploadPaperModal` provides the paper upload workflow.

`StatsData` is an interface describing the JSON shape the author expects: paper counts, question counts, route/user counts, storage counts, and analytics arrays. Interfaces disappear from the JavaScript output. They help the editor catch mistakes while writing, but they do not validate the server response at runtime. The backend route is the source of truth for actual field meaning.

`AdminLandingPageProps` requires two callbacks. Each accepts a tab string and returns `void` (no useful return value). The component receives these callbacks so action buttons can navigate through the parent layout without owning navigation state.

## State and request function

`stats` begins as `null`, signaling that no successful response has been stored. `loading` begins true, `error` begins as an empty string, and `isUploadModalOpen` begins false.

`fetchStats` is an `async` function. It marks loading, requests `/api/admin/stats`, and parses the response as JSON. If `success` and `data` are both truthy, it stores `data`; otherwise it stores the API message or a fallback. A rejected request or parse error enters `catch`, where `err: any` allows reading `message` without type checking. `finally` always clears loading.

Notice that this function does not check `res.ok` before parsing JSON. Therefore HTTP errors with JSON bodies may be handled through the response's `success` or `error` fields, while an invalid or empty body reaches `catch`. This differs from the shared `fetcher` helper, which checks HTTP status first.

## Polling effect and early returns

The effect invokes `fetchStats()` once after mount and starts a 30-second interval. It returns `clearInterval(interval)` as cleanup so the timer stops when the screen unmounts. Without cleanup, old screens could continue requesting data after navigation.

Before the main JSX, two early returns model loading and failure. With neither data nor an error, a spinner appears. With an error and no prior stats, an error card appears with a retry button bound to `fetchStats`. If prior stats exist while a later request fails, the screen keeps showing the saved data rather than replacing it with a full error screen.

## Defaults and calculations

`const s = stats || ({} as any)` chooses the stats object or an empty object forced to `any`. Then each nested category uses `||` to supply default values. This protects many render expressions from missing categories, but `any` removes compiler guarantees and does not prove that values have the expected types.

`formatBytes` converts the input to a number, rejects invalid/nonpositive values, chooses a unit by logarithm base 1024, and rounds to the requested decimal count. `Math.max(...array.map(...), 1)` spreads each mapped count as a function argument and enforces a minimum chart scale of one. Optional chaining on entries (`w?.count`) avoids an exception for a nullish array item.

The three `has...` booleans turn counts into named conditions for the triage panel. The rest of the component uses those values to decide whether action-required content is rendered.

## JSX patterns in the overview

`SectionHeader` receives strings, an array of breadcrumb objects, and an `action` prop containing JSX. This is a common React pattern: pass a visual subtree as a value so the shared header can position it. Buttons call setters using arrow functions, for example `() => setIsUploadModalOpen(true)`, so the state change happens on click rather than during render.

`{condition && (...)}` conditionally shows the triage center. Long metric sections repeat the same structure: a card, label, value, icon, and optional status badge. Their Tailwind classes define responsive layout, spacing, borders, colors, and typography; the data expressions inside those elements determine the values.

At the end, the modal is conditionally mounted and receives the open state plus a callback to close it. The `setActiveTab` and `setActiveSubTab` props are used by action links to take the admin directly to the relevant queue or workspace.

## Code-quality observations for future edits

- The `loading` state is set during refresh, but the early loading branch only appears before the first successful response.
- The component uses `any` for caught errors, byte inputs, chart items, and fallback stats. Prefer `unknown` plus checks, or a runtime schema, when tightening types.
- The effect captures `fetchStats` while using an empty dependency list. If the function later depends on props or state, make it stable with `useCallback` or update the dependencies.
- `stats` is trusted after JSON parsing; a type assertion or interface does not validate data received over HTTP.

## Next reads

- [API client walkthrough](/06-code-tour/api-client-line-by-line)
- [Shared admin UI wrappers](/06-code-tour/shared-admin-ui)
- [Question bank and OCR workflow](/03-admin-workspaces/question-bank-and-ocr)
