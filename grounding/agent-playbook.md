# Agent playbook — AmazeCC Dashboard handbook

Read this before creating or editing a page in `docs/`.

## Verify before you write

Use the code as the behavioral source of truth. Check these files first:

| Question | Start with |
|---|---|
| What page starts the app? | `src/app/page.tsx`, `src/components/custom/Main.tsx` |
| How is the admin area laid out? | `src/components/custom/admin/AdminLayout.tsx` |
| How are API URLs and auth headers built? | `src/lib/api.ts` |
| How is API login performed and stored? | `src/components/custom/Main.tsx` |
| What does each admin screen call? | The screen component under `src/components/custom/admin/` or `src/components/custom/qbank/` |
| Which env values are documented for local use? | `.env.example`, `package.json`, `next.config.mjs` |
| What design constraints apply? | `design/AI_CONTRIBUTOR_GUIDE.md`, `design/COMPONENTS.md`, `design/NAVIGATION.md` |

Follow helpers called by a component when they affect what a user sees or what
the server receives. A button label does not prove that an operation succeeded;
trace its request and response handling. Avoid treating `README.md` or
`guide.md` as current behavior until source confirms it.

## Explain the web stack from the reader's level

Assume HTML knowledge only. Briefly define browser, server, URL, HTTP method,
request, response, JSON, JavaScript, TypeScript, React component, state, and
environment variable before relying on each idea. Explain how the frontend
turns JSON into visible HTML. Distinguish this static-exported browser app from
the separate AmazeCC API server.

Prefer a concrete journey: click -> component event -> `apiFetch` -> HTTP
request -> API response -> state update -> rerender. Explain which part runs in
the browser and which runs on the API server.

## Current architecture facts

- `src/app/page.tsx` renders `Main`; `/admin` also renders `Main`.
- `Main.tsx` owns admin login, the active workspace, role/permission state,
  persisted token restoration, logout, and the overview metrics polling.
- `src/lib/api.ts` chooses `NEXT_PUBLIC_API_BASE`, then
  `NEXT_PUBLIC_API_URL`, then `https://api.amazecc.com`; `apiFetch` attaches
  `Authorization: Bearer ...` when `admin_token` exists in local storage.
- `next.config.mjs` sets `output: "export"`; there is no Next server handling
  the dashboard's `/api/...` requests in production. Those go to the separate
  configured backend.
- The sidebar filters some entries by role and permissions. The API must still
  enforce access; hiding a menu item in a browser is not server authorization.
- The root README currently contains older student-app/backend descriptions.
  Document the source code that exists, and call out README drift when useful.

Recheck these statements whenever the architecture changes.

## Security and accuracy

- Never read, quote, or commit `.env` values. Use `.env.example` for variable
  names and safe placeholders for values.
- Never include real admin credentials, tokens, student identifiers, or live
  user data in prose, screenshots, or code samples.
- A `NEXT_PUBLIC_` variable is bundled into browser-visible JavaScript. Never
  describe it as a place for a private key or password.
- Do not claim that client-side role checks protect an API endpoint. Explain
  that the backend owns authorization.
- Do not invent response fields, backend routes, permission behavior, or
  deployment guarantees. Link to the API handbook for backend contracts.

## Mintlify conventions

- Pages use Markdown/MDX with YAML frontmatter (`title` and `description`).
- Every page must appear in `docs/docs.json`; adding a file alone does not put
  it in the sidebar.
- Use relative links between pages in this child repo. The multirepo action
  rewrites root-relative paths for the `amazecc-dashboard/` destination.
- Keep handbook source in this repo. The copy in the docs site repo is
  generated and will be replaced on the next aggregate run.
- Prefer plain Markdown unless an existing Mintlify component solves a clear
  reader problem. The `mint` CLI may not be installed locally; consult
  official Mintlify docs for unfamiliar syntax.
