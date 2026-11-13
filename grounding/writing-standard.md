# Writing standard — AmazeCC Dashboard handbook

## Reader

The reader can read HTML but may never have built a web app. Do not assume
they know React, TypeScript, terminals, HTTP, JSON, browser storage, or APIs.
Define each term at the moment the reader needs it, then use the term normally.

## Voice and structure

- Use direct second person and active voice.
- Explain what a thing is, why this app needs it, how it works here, and where
  to find its code.
- Use short examples with realistic but fake values. Explain every command
  flag and every important line.
- Separate browser behavior from API-server behavior.
- State uncertainty when implementation evidence is incomplete.
- Use sentence-case headings and link to the next practical page.

## Concept page shape

1. Mintlify frontmatter with a useful `title` and one-sentence `description`.
2. A short `In one line` summary.
3. Start with the user or developer problem.
4. Give a simple mental model, then show this repo's actual implementation.
5. Explain failure states and common mistakes.
6. Link to the relevant files and the next handbook page.

## Code and API examples

- Verify route names, methods, field names, and response handling against the
  frontend caller and the API repository's route reference.
- Use placeholders, never real tokens, passwords, VTOP cookies, or user data.
- Explain what the browser sends, what the API returns, and how the UI uses it.
- Note that `apiFetch` only attaches a bearer token if one is stored. Some
  components bypass it; describe those differences only after checking code.
- Don't present a hidden/disabled UI control as an authorization boundary.

## Before adding a page

- [ ] Read `grounding/agent-playbook.md` and the source files for the behavior.
- [ ] Confirm the page reflects the current admin portal, not the historic
  student-facing README overview.
- [ ] Add frontmatter and a navigation entry in `docs/docs.json`.
- [ ] Check links, code fences, terminology, and MDX-safe angle brackets.
- [ ] Keep secrets and live user information out of the diff.
