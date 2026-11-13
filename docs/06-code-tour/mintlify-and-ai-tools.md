---
title: "Mintlify and AI documentation tools"
description: "Learn how the handbook uses Mintlify components, page navigation, Markdown exports, llms.txt, search MCP, and the separate Mintlify Admin MCP."
---

> **In one line:** Mintlify renders the handbook for people and exposes published pages in formats that documentation search tools and AI agents can retrieve.

## How this site is organized

The handbook lives under `docs/`. Its `docs.json` defines sidebar navigation and lists each visible page. Pages use Markdown or MDX with YAML frontmatter at the top. The frontmatter provides the page title and summary; MDX also lets a page render Mintlify components such as callouts, cards, steps, tabs, and accordions.

This handbook uses components when they improve navigation or make a procedure easier to scan. Code tours use cards to surface the main learning paths. Quickstarts can use numbered steps. Tabs are useful for genuinely different operating systems or shells. Callouts should identify real warnings or prerequisites, not decorate ordinary paragraphs.

<Tip>
  To find a page's Markdown source after publication, add `.md` to its page URL. For example, a page at `/amazecc-dashboard/06-code-tour/main-login-and-shell` has a Markdown representation at the same path ending in `.md`.
</Tip>

## Search MCP and Admin MCP are separate

The **Search MCP** reads published Mintlify documentation. For the Mintlify product docs, the server URL is `https://mintlify.com/docs/mcp`. For this handbook, Mintlify hosts search at the published docs site's `/mcp` endpoint once the aggregate site is deployed. It supports documentation search and filesystem-style page retrieval; it does not edit project files.

The **Admin MCP** is `https://mcp.mintlify.com`. It can manage a Mintlify project after an authorized OAuth sign-in. It is a separate server with a different purpose and permission scope. Do not use it to assume handbook content has been published: publishing still follows the docs repository's workflow and the site must be checked after deployment.

This repository's `.codex/config.toml` lists both endpoints for project-scoped Codex use. The admin connection requires OAuth sign-in. The search connection is configured with the read-only `knowledge` toolset. Agent configuration does not itself grant permission to publish or edit a Mintlify project.

## Other agent-readable formats

Mintlify also provides a root `llms.txt` index and a full-content `llms-full.txt` for published sites, plus Markdown versions of pages. These help tools retrieve the same published documentation without scraping the visual page. Mintlify generates these from published, navigable pages; unlisted pages are not part of the normal navigation-based index.

The aggregate navigation in the parent `docs` repository includes this Dashboard handbook so it can be discovered alongside AmazeCC and AmazeCC-API. A push to this repository's `main` branch that changes `docs/**` sends a `docs-updated` repository dispatch, and the aggregate workflow then rebuilds the docs site.

## Safe editing workflow

<Steps>
  <Step title="Read the source and nearby pages">
    Confirm each implementation detail in the checked-in code and match the existing handbook tone.
  </Step>
  <Step title="Write and add navigation">
    Create the Markdown or MDX page, then list its extensionless path under the correct `docs.json` group.
  </Step>
  <Step title="Validate before publishing">
    Run `mint validate` and check the generated preview. Fix broken links or invalid components before merging.
  </Step>
  <Step title="Publish through the repository workflow">
    Merge changes to the configured branch and confirm the aggregate site contains the updated page before reporting it live.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Why doesn't the page appear in search?">
    Check that its path is listed in `docs.json` navigation, that it is not hidden, and that the aggregate docs workflow has deployed the commit containing it.
  </Accordion>
  <Accordion title="Why do agent answers look stale?">
    Confirm the current page is published. MCP and generated AI indexes describe published content, so local edits and unmerged branches are not necessarily available to search.
  </Accordion>
</AccordionGroup>

## References

- [Mintlify MCP documentation](https://www.mintlify.com/docs/ai/model-context-protocol)
- [Mintlify component reference](https://mintlify.com/docs/components)
- [Mintlify multi-repository documentation](https://mintlify.com/docs/deploy/multi-repo)
