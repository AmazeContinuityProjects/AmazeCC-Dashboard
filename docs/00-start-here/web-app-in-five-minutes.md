---
title: "A web app in five minutes"
description: "A beginner-friendly bridge from HTML to browsers, servers, React, HTTP requests, JSON, and TypeScript in this repository."
---

> **In one line:** HTML is the page structure; JavaScript makes it interactive; a server answers requests; React updates the page when data changes.

You already know HTML. Think of a web app as two programs cooperating: one
runs in the **browser** on the user's device, and another runs on a **server**
somewhere else. This repo mostly builds the browser program. AmazeCC-API is a
separate server program.

## From HTML to an interactive screen

HTML describes structure such as headings, buttons, and forms. CSS controls
appearance. JavaScript can react when someone clicks a button or when new data
arrives. React is a JavaScript library used here to build the screen out of
reusable **components**: small functions that return interface elements.

For example, `AdminLandingPage` is a component. It requests summary numbers,
keeps them in state, and returns cards and charts that show those numbers.
When the state changes, React renders the component again with the new values.

## The browser and server exchange HTTP messages

HTTP is the message format used when a browser talks to a server. A request
contains a method and a URL, and may contain headers and a body. The server
responds with a status code, headers, and a body.

| Term | Meaning | Example here |
|---|---|---|
| URL | The address being contacted | `/api/admin/stats` |
| Method | The kind of operation | `GET` reads; `POST` usually sends or creates data |
| Header | A label or credential attached to a request | `Authorization: Bearer …` |
| JSON | Text representation of objects and lists | `{"success":true,"count":12}` |
| Response | What the server sends back | Status `200` and a JSON body |

The frontend's `fetch()` call sends these messages. `src/lib/api.ts` wraps
`fetch()` so components can use one API base URL and automatically attach an
admin bearer token when one is saved.

## Follow a click

When an admin loads the overview, `Main.tsx` renders `AdminLandingPage`. That
component calls `apiFetch('/api/admin/stats')`. The API responds with JSON. The
component stores the useful fields in React state, and React renders the
metrics. The API does not send HTML for the admin portal; it sends data, and
the browser turns that data into HTML elements.

The same loop applies to a save button:

1. A click handler reads values from the form.
2. It builds a request, often with `JSON.stringify(...)` for the body.
3. `apiFetch` sends the request to the configured API server.
4. The component checks the response and updates its state.
5. React redraws the affected part of the page.

## JavaScript and TypeScript

JavaScript is the language that runs in the browser. TypeScript is JavaScript
with extra type information that helps catch mismatched values while editing
and building. This project uses `.tsx` files for TypeScript components that
include UI markup. The browser receives compiled JavaScript, not `.tsx` source.

An `interface` such as `StatsData` describes the shape a component expects.
It helps developers and tools, but it does not validate untrusted data at
runtime by itself. Code still needs to handle missing fields and failed
requests.

## What HTML knowledge does not cover yet

- A **terminal** is a text window where you run commands such as `pnpm dev`.
- A **package manager** such as pnpm downloads the libraries this project uses.
- A **build** converts TypeScript, JSX, and styles into browser-ready files.
- **Environment variables** provide configuration at build or run time. A
  name starting with `NEXT_PUBLIC_` can be included in browser-visible code;
  never put a private key there.
- **Local storage** is a small browser-owned key/value store. This app uses it
  for the admin token and preferences, so it is not a server-side session.

## Next steps

- [Run the project](./quickstart.md)
- [Trace a request into the screen](./request-to-screen.md)
- [Understand the API client](../02-frontend-architecture/api-client-and-data-loading.md)
