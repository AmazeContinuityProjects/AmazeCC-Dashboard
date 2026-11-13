# AmazeCC Dashboard documentation grounding

This directory is the editorial and operational source for the Mintlify
handbook in `docs/`. Read the agent playbook before changing the handbook or
describing runtime behavior.

## Audience and purpose

Write for a junior developer who knows HTML but may not know JavaScript,
React, browsers, HTTP, APIs, databases, or terminals. Explain the words and
the data path before asking the reader to edit code. Keep the examples tied to
this repository, and say when the UI depends on the separate API service.

This repository currently runs the AmazeCC Admin Portal: a Next.js client UI
for administrators. The main entry is `src/app/page.tsx` ->
`src/components/custom/Main.tsx`. Do not assume that feature descriptions in
the root README describe code that currently exists. The API backend lives in
`AmazeCC-API` and has its own handbook.

## Grounding files

| File | Purpose |
|---|---|
| `agent-playbook.md` | Source-of-truth order, safe research, content boundaries, and publishing flow for future agents. |
| `writing-standard.md` | Audience, page structures, tone, and editorial checklist. |

## Handbook layout

`docs/docs.json` is the child navigation manifest Mintlify reads when it
aggregates this repository. Handwritten pages live in `docs/`; edit those
files here. Never edit the generated copy under the Mintlify site repository's
`amazecc-dashboard/` destination.

The initial handbook is organized around:

- **Start here:** web concepts, local setup, and the request-to-screen path.
- **Admin portal:** login, permissions, shell/navigation, and data loading.
- **Admin workspaces:** question bank, GoRobo, transport, and other admin tools.
- **Engineering:** styling, state, offline behavior, operations, and code map.

## Publishing path

1. Dashboard docs are authored under `docs/` in this repository.
2. On a push to `main` that changes `docs/**`, `.github/workflows/notify-docs.yml`
   sends the `docs-updated` repository event using `DOCS_DISPATCH_TOKEN`.
3. `AmazeContinuityProjects/docs` listens for `docs-updated` and runs
   `mintlify/multirepo-action@v1`.
4. The aggregator copies this repo's `docs/` into `amazecc-dashboard/` and merges
   the child navigation into the dashboard tab; Mintlify deploys the parent
   docs repo.

The docs repository must list `AmazeCC-Dashboard` as a source in
`.github/mintlify-multirepo.yml` and include a `sourceRef` in `docs.base.json`.
If either is missing, a dispatch can succeed while the dashboard pages remain
absent from the site.
