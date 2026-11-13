---
title: "Code tours"
description: "Read the dashboard source from top to bottom, with explanations of the TypeScript, React, JSX, browser, and HTTP syntax used in each module."
---

> **In one line:** these pages translate the repository's important source modules into plain language, then teach the syntax those modules use.

The first handbook pass explained what the app does. This section explains
how to read the implementation. It starts with the central app shell and
follows the data into the API helper and workspace screens. Each tour names
the source file and explains code in execution order so you can keep the
editor open beside the docs.

## How to use a code tour

1. Open the named source file in your editor.
2. Read the section headings in order; they follow the file's import,
   declarations, handlers, and render structure.
3. Match a syntax example to the real source expression.
4. Follow cross-links when an imported helper or child component owns the next
   part of the behavior.

The core tours follow each declaration and behavior section in source order.
Repeated JSX and Tailwind utilities are grouped by pattern, with the source
file as the authority when exact spacing or wording matters. The [syntax
guide](./typescript-react-syntax.md) explains the language constructs used
throughout the modules. The [module catalog](./workspace-module-catalog.md)
indexes every workspace file and its behavior. Treat source as authoritative:
these explanations describe the current checked-in version and must be
updated when code changes.

## Tour order

- [TypeScript and React syntax](./typescript-react-syntax.md)
- [Main login and shell](./main-login-and-shell.md)
- [Admin layout, line by line](./admin-layout-line-by-line.md)
- [API client, line by line](./api-client-line-by-line.md)
- [Overview data flow](./admin-overview-data-flow.md)
- [Shared admin UI](./shared-admin-ui.md)
- [Content workspaces code tour](./content-workspaces-code-tour.md)
- [GoRobo code tour](./gorobo-code-tour.md)
- [Operations workspaces code tour](./operations-code-tour.md)
- [Workspace module catalog](./workspace-module-catalog.md)

<Columns cols={2}>
  <Card title="Start with the app shell" icon="panels-top-left" href="/06-code-tour/main-login-and-shell">
    Follow authentication state, login requests, and tab-to-screen rendering.
  </Card>
  <Card title="Trace API requests" icon="network" href="/06-code-tour/api-client-line-by-line">
    Learn how URL selection, bearer headers, fetch, and errors fit together.
  </Card>
  <Card title="Learn the syntax" icon="braces" href="/06-code-tour/typescript-react-syntax">
    Decode the TypeScript, React hooks, JSX, and async syntax used throughout.
  </Card>
  <Card title="Find a workspace module" icon="folder-tree" href="/06-code-tour/workspace-module-catalog">
    Browse module ownership, data flows, and links to the feature walkthroughs.
  </Card>
</Columns>
