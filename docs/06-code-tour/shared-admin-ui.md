---
title: "Shared admin UI components"
description: "Understand the AdminUI.tsx barrel, Button typing and ref forwarding, compatibility wrappers, prop spreading, and AmazeUI re-exports."
---

> **Source:** `src/components/custom/admin/AdminUI.tsx`.

This module is a local adapter around `@amazecontinuityprojects/amazeui`. Workspace files import from this one place so the dashboard can keep shared styling and preserve older component names.

## Client directive and package imports

The `'use client'` directive makes this module part of the client component graph. The large named import from AmazeUI brings in buttons, cards, form controls, dialogs, tables, tabs, badges, layout pieces, loading indicators, and the `cn` class-name helper. Named imports use braces because the package exports these names individually.

The `as` syntax renames an import locally. For example, `SectionHeader as AmazeSectionHeader` prevents a name clash with this file's own wrapper. `EmptyState as AmazeEmptyState` and `LoadingSpinner as AmazeLoadingSpinner` do the same.

## ButtonProps and ref forwarding

`ButtonProps extends React.ComponentPropsWithoutRef<typeof AmazeButton>` starts with the props accepted by AmazeUI's Button, then adds or narrows dashboard-specific fields. `typeof AmazeButton` asks TypeScript for the component's type; `ComponentPropsWithoutRef` extracts its props without the special `ref` field. The `[key: string]: any` index signature permits additional named props but weakens typo detection.

`React.forwardRef<any, ButtonProps>(...)` creates a component that can pass a ref through to the underlying button. The generic arguments specify the ref target type and the props type; here the ref is `any`, so it is not strongly checked.

The function destructures `className`, `children`, and `...props`. It checks whether the supplied classes include `flex-col`. `cn(...)` merges the default horizontal alignment classes (unless a column layout was requested) with the caller's classes. The `!` prefix in utility class strings marks important Tailwind rules.

Inside JSX, `ref={ref}` forwards the ref, `className={...}` passes the merged classes, and `{...props}` forwards remaining attributes. Children between `<AmazeButton>` and `</AmazeButton>` become the rendered button content. `displayName` gives the wrapper a useful name in React DevTools.

## Re-exported controls

The `export { ... }` block makes selected AmazeUI controls available to every dashboard module through `AdminUI`. The separate `export { Table, ... } from '@/components/ui/table'` forwards the local table primitives without importing them into this file first. These are barrel exports: a single module gives consumers a stable import location.

## Compatibility wrappers

`GlassCard` accepts children and optional visual props, then renders AmazeUI's `Card`. Defaults such as `className = ''` and `padding = 'p-5'` apply if the caller omits those props. The template string combines standard glass styling, optional hover styling, optional inner-glow styling, and caller classes. `...props` forwards other accepted values to `Card`.

`GlassButton` preserves a legacy API. It maps the old `danger` variant to AmazeUI's `destructive`, and the old `md` size to `default`. It uses type assertions (`as any`) for mapped values because the local union types do not line up exactly with the package's exported prop types. The wrapper then forwards the remaining values to the shared `Button`.

`GlassInput`, `GlassTextarea`, and `GlassSelect` are aliases, not new components: each exported name points directly to an imported control.

## Small layout wrappers

`SectionHeader` accepts title, optional description, optional action content, breadcrumbs, and an icon. It conditionally renders each optional section with `{value && (...)}`. Breadcrumbs are typed as an array of objects with required labels and optional `href` and `active` fields.

`EmptyState` and `LoadingSpinner` adapt the same-named AmazeUI components. The spinner wrapper supplies a default size and asserts its class name to `any`; this exists to work around a type mismatch, not to transform the value.

## When to change this file

Change this adapter when you need a consistent dashboard-wide control, must preserve a legacy prop convention, or need to expose another shared AmazeUI primitive. Before adding an export, search current imports to avoid creating a duplicate wrapper. For a one-off layout, keep the code in the workspace that owns it.

## Related guides

- [Design system and accessibility](/04-engineering/design-system-and-accessibility)
- [Overview data flow](/06-code-tour/admin-overview-data-flow)
- [Repository map](/05-reference/repository-map)
