---
title: "Content workspaces code tour"
description: "Read the paper, question, diagram, storage, OCR queue, split review, and upload modules by state, request flow, and handler responsibility."
---

This tour covers the content modules connected to the question bank. Keep the source open while reading: UI markup is long, but data flow repeatedly follows this order: **state declarations → request functions → effects → event handlers → derived lists → JSX**.

## Shared mechanics

These modules are client components. They import React hooks, `apiFetch`, shared controls, and sometimes file or review components. `useState<Type>(initial)` stores the visible data and transient UI state. `useEffect` starts initial loading. `async` handlers use `await` for requests and JSON parsing. A `finally` block usually clears a busy flag. Controlled form fields pass `value` and `onChange`, while lists use `.map()` to produce rows.

One important difference: not every component uses the shared `fetcher`. Most call `apiFetch` directly so they can interpret the endpoint's particular response fields and refresh behavior. Check the exact `res.ok` and `json.success` conditions in each function before assuming two screens handle errors alike.

## PapersManager.tsx

**Source:** `src/components/custom/admin/PapersManager.tsx`.

The top-level interfaces describe a `Paper` and form values. State stores the paper array, loading state, search and status filters, the row currently importing or replacing a file, the paper selected for review, and metadata form fields. The type `Paper | null` means either a selected record or no selection.

`fetchPapers` loads the paper collection and stores the returned list. The mount effect invokes it. The remaining handlers divide operations by intent:

- `handleUpdateStatus(paperId, status)` changes a paper's workflow state.
- `handleSaveMetadata(paperId)` submits edited metadata.
- `handleUploadReplacement(paperId, event)` reads the chosen `File` from an input change event and uploads a replacement.
- `handleDeletePaper(paperId)` requests removal and then updates or reloads the list.
- `handleImportToStorage(paperId)` asks the API to copy/import the selected paper into storage.
- `startEditing(paper)` copies fields from a selected record into the edit form.

The list rendered at the end applies search/status filtering before `.map()` creates rows. When changing a handler, trace the busy-state setter, API body, response check, user feedback, and subsequent list update as one sequence.

## QuestionsManager.tsx

**Source:** `src/components/custom/admin/QuestionsManager.tsx`.

Its state is broader because the screen supports multi-selection, subject/type/status/diagram/year filters, sorting, inline editing, bulk actions, and image preview. `selectedIds: string[]` is a collection of selected question IDs. The `sortBy` and `sortOrder` union types prevent unsupported sort keys at compile time.

`fetchQuestions` loads question data and the effect starts it when the component mounts. `handleSelectAll` receives a typed `React.ChangeEvent<HTMLInputElement>` and uses the checkbox's `checked` property to choose whether all visible IDs or none are selected. `handleSelectOne` adds or removes a single ID. `executeBulkAction(action, val?)` branches on a string action and applies the chosen metadata operation to the selected set.

`handleSaveInline(qId)` submits the current edit fields for one question. `startEditing(q)` populates them from the record. `sortQuestions(a, b)` is a comparator: negative/zero/positive return values tell JavaScript's `.sort()` to order a before/equal/after b. The filtered and sorted result then feeds repeated row JSX.

## DiagramsManager.tsx

**Source:** `src/components/custom/admin/DiagramsManager.tsx`.

The screen stores question rows, a text search, a three-value filter union (`ALL`, `HAS_DIAGRAM`, `NO_DIAGRAM`), the ID currently uploading, and a preview URL. `fetchQuestions` retrieves the question set; an effect starts it on mount.

`handleUploadDiagram(event, questionId, replaceIdx?)` accepts an input-change event and an optional replacement index. `?` on `replaceIdx` means a caller may omit it: without an index the handler adds an image, with one it replaces a particular image. File inputs expose the selected `File` through `event.target.files`. The handler uploads it, updates the question's image references, then clears the uploading state in cleanup logic.

`handleDeleteDiagram(questionId, urlToDelete)` derives `updatedUrls` with `.filter(u => u !== urlToDelete)`. This creates a new array excluding the target URL, rather than mutating the old array. It submits the updated list and refreshes the displayed question data.

## StorageManager.tsx

**Source:** `src/components/custom/admin/StorageManager.tsx`.

Storage state includes nullable stats, loading/error values, the currently running action, a missing-file report, and a structured migration status. `fetchStats` loads storage metrics and any queue/question information the view needs. The effect kicks off the request after mount.

`runAction` accepts a union of three literal action strings: `rebuild_metadata`, `delete_orphaned`, and `find_missing`. This restricts callers to named operations. It records the active action so the UI can disable or label the matching button, calls the migration/admin endpoint, handles its result, refreshes stats, and then clears the action state. `migrateRemoteFiles` is a separate multi-step operation for moving remote file records.

`formatBytes` converts a number into a human-readable unit. Its `any` parameter means the compiler cannot guarantee that the supplied value is numeric; the function compensates with runtime conversion/checks. Prefer a `number | string | null` input when tightening this code.

## AdminQueueTab.tsx

**Source:** `src/components/custom/qbank/AdminQueueTab.tsx`.

This is the OCR queue workbench. State tracks papers, the selected paper and its questions, loading/processing IDs, status/search filters, edited metadata, expanded logs, and the chosen OCR model per paper. `Record<string, string>` means an object indexed by string IDs whose values are strings.

`fetchQueue` is wrapped in `useCallback`; that hook returns a stable function until one of its declared dependencies changes. The effect depends on `fetchQueue`, so the queue request runs on mount and again if that callback identity changes. This avoids the common effect dependency loop that can happen when an inline function is recreated on every render.

Handlers represent the queue workflow: start or reset OCR, reject or publish a paper, save paper fields, fetch questions for review, add/update/delete questions, upload/delete diagrams, and bulk import JSON. `handleReview(paper)` sets the selected paper and begins loading questions using `paper.source_id`. Read the handler body to see whether a follow-up update is awaited; starting a Promise without awaiting it lets the UI continue while the request is in flight.

`getStatusBadgeVariant(s)` returns a string union, mapping server status text to the allowed visual badge variants. This is a compile-time return restriction; an unknown server status still needs a fallback branch at runtime.

## SplitScreenReview.tsx

**Source:** `src/components/custom/admin/SplitScreenReview.tsx`.

This review screen composes a selected source paper with its extracted question list. Its long file includes loading questions, question create/update/delete, diagram upload/deletion, bulk JSON import, and publication. Treat each handler as a transaction story: identify the source record/ID, inspect payload construction, await the request, check response fields, update local state, and show status feedback.

`FormData` is used where a file must travel with other request values. Appending a `File` stores the bytes and filename in the browser's multipart request body. Do not manually set `Content-Type: multipart/form-data`; the browser must add the boundary that separates multipart fields.

## UploadPaperModal.tsx

**Source:** `src/components/custom/qbank/UploadPaperModal.tsx`.

The modal's state follows its input fields: course selection/custom course code, paper type, semester/year/title, file URL, file-versus-JSON mode, queue-now flag, OCR model, upload busy/success status, source kind, and the selected browser `File`. A union such as `"file" | "json"` ensures the mode has only those two values.

`handleInsertTemplate` fills the JSON editor with an example structure. `handleUpload(event)` prevents the browser's normal form submission, validates the chosen mode and required values, then builds the API request. In file mode it uses the selected `File` and metadata; in JSON mode it parses the text before sending. JSON parsing can throw, so the handler must catch invalid syntax and display a useful message. `isOpen`, `onClose`, `courses`, and `username` arrive as props from the parent; `isAdmin = false` supplies a default.

## Syntax reference

- **`T | null`**: the value can be a T or the explicit empty value `null`.
- **`T[]`**: an array whose elements are T.
- **`field?: T`**: an optional field/argument.
- **`Record<K, V>`**: object keys of type K and values of type V.
- **`useCallback(fn, deps)`**: memoizes a function identity for effect dependencies/child props.
- **`FormData`**: browser container for multipart form fields and file bytes.
- **`.filter()`**: returns a new array containing only elements that pass a predicate.
- **`.sort((a, b) => ...)`**: mutates the array being sorted; copy first if the original must be kept.
- **`finally`**: cleanup that runs after success or failure.
- **`event.target.files?.[0]`**: safely reads the first selected file if a file list exists.

## Continue reading

- [Question bank and OCR behavior](/03-admin-workspaces/question-bank-and-ocr)
- [API client walkthrough](/06-code-tour/api-client-line-by-line)
- [Workspace source catalog](/06-code-tour/workspace-module-catalog)
