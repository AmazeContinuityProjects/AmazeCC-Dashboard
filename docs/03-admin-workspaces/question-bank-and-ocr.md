---
title: "Question bank and OCR review"
description: "Understand the admin interfaces for papers, OCR processing, extracted questions, and publication review."
---

> **In one line:** admins use the QBank screens to manage paper records, review OCR output, edit questions, and publish approved content through the API.

The dashboard has several related screens rather than one monolithic QBank
component:

- `UploadPaperModal.tsx` starts uploads from the shared shell or a workspace.
- `AdminQueueTab.tsx` handles queue-oriented review and the Queue/Courses
  sub-tabs.
- `PapersManager.tsx` manages paper records.
- `QuestionsManager.tsx` manages extracted question records.
- `SplitScreenReview.tsx` supports a side-by-side paper review flow.

## How to follow the review flow

Start at the button that triggers an action, then follow the request payload
and the response state. QBank can involve file storage, OCR processing, admin
review, question editing, and final publication. These operations may be
handled by different API routes and can take place asynchronously; a browser
request returning successfully does not necessarily mean OCR has finished.

The backend owns paper status transitions, OCR queueing, storage, and
authorization. Use the [QBank API reference](https://docs.amazecc.com/amazecc-api/03-api-reference/qbank/)
for exact route semantics before changing forms or status labels.

## Practical debugging steps

1. Identify the paper ID and current state shown by the UI (use fake data in
   shared examples).
2. Inspect the request and response in the browser Network panel.
3. Find the component handler and identify which state is updated on success.
4. If processing is queued, inspect the API's queue/worker status rather than
   repeatedly resubmitting the paper.
5. Check permission failures separately from parsing or OCR failures.

## Where to next

- [GoRobo Store](./gorobo-store.md)
- [API client and data loading](../02-frontend-architecture/api-client-and-data-loading.md)
- [QBank API reference](https://docs.amazecc.com/amazecc-api/03-api-reference/qbank/)
