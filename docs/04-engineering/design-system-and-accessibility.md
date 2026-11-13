---
title: "Design system and accessibility"
description: "Use the existing AmazeCC tokens and components, preserve keyboard and screen-reader access, and find the UI design references."
---

> **In one line:** reuse the project's design tokens and components so new controls feel consistent and stay usable with a keyboard and assistive technology.

The repository's `design/` folder contains contributor guidance for colors,
typography, components, navigation, and the overall design language. The admin
portal also has shared UI building blocks in
`src/components/custom/admin/AdminUI.tsx` and
`src/components/ui/`. Prefer those before inventing a new button, card, input,
spacing scale, or shadow.

## Start with the existing component

Before styling a new control, find a screen with a similar interaction. Reuse
its component and semantic variants. Shared primitives reduce the chance that
one page uses a different disabled, error, or focus state from another.

## Accessibility basics

- Use a real `<button>` for actions and a link for navigation.
- Associate each form label with its input; placeholder text is not a label.
- Keep every keyboard action reachable and make focus visible.
- Give icon-only controls an accessible name.
- Use headings in a meaningful order and provide useful text for errors.
- Do not encode status using color alone.

Check mobile behavior too. The admin layout has a compact navigation mode and
overlay, so a wider-screen-only change can hide or block controls on phones.

## Where to next

- `design/AI_CONTRIBUTOR_GUIDE.md`
- `design/COMPONENTS.md`
- `design/NAVIGATION.md`
- [Navigation and shortcuts](../01-admin-portal/navigation-and-shortcuts.md)
