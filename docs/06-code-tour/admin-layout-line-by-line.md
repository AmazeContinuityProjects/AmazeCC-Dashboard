---
title: "Admin layout, line by line"
description: "Understand navigation data, role filtering, keyboard shortcuts, responsive sidebar state, and overlays in AdminLayout.tsx."
---

> **Source:** `src/components/custom/admin/AdminLayout.tsx`.

`AdminLayout` is the persistent frame around each workspace. It owns sidebar behavior, navigation visibility, the command palette, the upload dialog, and the mobile menu. The selected page itself arrives through the `children` prop.

## Imports and navigation data

`'use client'` enables React state and browser event listeners. React provides `useState` and `useEffect`; Lucide provides icon components; AmazeUI provides reusable sidebar parts; local imports provide the theme switcher, command palette, and paper upload modal.

`navGroups` is a nested array of object literals. Each group has a label and items. An item records an `id` (the tab key used by `Main`), a visible label, an icon component, an optional required permission, and sometimes a list of sub-tabs. `requiredPermission: null` means the item is not hidden by this client-side permission filter. GoRobo, transport, user management, faculty directories, and fresher resources each carry permission keys.

The icon value is a component reference such as `Bus`, not a string. Later, `const Icon = item.icon` assigns it to a capitalized variable so JSX can render `<Icon />`.

## Props interface

`AdminLayoutProps` describes the component contract. `children: React.ReactNode` can hold any React-renderable child content. Setter props are function types such as `(tab: string) => void`: they accept a string and return nothing. The `?` suffix means a prop can be omitted. The role union limits role values at compile time. `stats` is an object whose named counts are numbers.

The function parameter destructures props and supplies defaults: a missing username becomes `'Admin'`, a missing role becomes `'admin'`, and missing permissions become an empty array. Defaults apply to `undefined`, not to `null`.

## Class helper functions

`navItemClass(isActive)` and `subTabClass(isActive)` return template strings. Each combines stable Tailwind utility classes with a ternary expression. When `isActive` is true, the string contains selected colors and emphasis; otherwise it contains hover and muted-state styles. The helpers keep the active-state styling consistent across repeated navigation buttons.

Tailwind names are short CSS rules: for example, `px-3` sets horizontal padding, `rounded-xl` rounds corners, and `text-muted-foreground` uses a project color token. A sequence of class names applies all those rules to the element.

## Local UI state and keyboard effect

Four `useState` calls track whether the sidebar is collapsed, the mobile drawer is open, the command palette is open, and the upload modal is open. These are local presentation states; they do not represent server data.

The effect defines `handleKeyDown`, registers it on `window`, and returns a cleanup function that removes that same listener. `(e.metaKey || e.ctrlKey) && e.key === 'k'` supports Command+K on macOS and Control+K elsewhere. `preventDefault()` stops the browser's default action. The functional setter `setIsCommandOpen(prev => !prev)` uses the previous state to invert the palette state safely. The empty dependency array means the effect installs once for this mounted layout.

## Permission filtering

`navGroups.map(...)` makes a new group object for each group using object spread (`...group`). Its `items` property is replaced with a filtered list. `filter` keeps an item when the callback returns true:

1. Items without a required permission stay visible.
2. `superadmin` sees every permission-gated item.
3. Faculty directories accepts either the newer `faculty-directories` permission or the legacy `faculty-directory` spelling.
4. Other gated items require `userPermissions.includes(item.requiredPermission)`.

The final `.filter(group => group.items.length > 0)` removes empty sections. This only controls which navigation controls the browser shows. The backend must independently authorize every API operation; hiding a button is not access control.

## Mobile navigation derivation

An immediately invoked arrow function `(() => { ... })()` computes a small set of mobile shortcuts during render. `.find` locates the Overview, Content, and System groups; optional chaining handles a missing group; `|| []` supplies an empty list. `.slice` takes only the first few entries, and `.concat` joins them into a new array without changing the source arrays.

## Rendered frame and repeating navigation

The returned JSX is a tree. The outer `<div>` sets page-wide layout classes. The ambient background divs are decorative and have `pointer-events-none`, so they do not intercept clicks.

`{isMobileOpen && (...)}` conditionally renders the dark mobile overlay. Clicking it calls a short arrow function that closes the drawer. `ReusableSidebar` receives `isOpen={!isCollapsed}` and an `onOpenChange` callback that translates the library's open state into the component's collapsed state.

`filteredNavGroups.map` creates one sidebar group per permitted section. The `key` prop gives React a stable identity for each repeated element. Within each group, `group.items.map` creates the item button. The active item test compares `activeTab` to the item's ID and includes a compatibility case for the general GoRobo ID.

Clicking an item calls `setActiveTab(item.id)`. If that item has sub-tabs and at least one exists, it selects the first one too. The sub-tab list only renders when the parent is active and the sidebar is expanded. Its active dot is selected with a ternary expression.

The `isCollapsed` checks repeatedly hide labels and reveal title text when space is limited. This is a presentation choice; it does not change the selected route key.

## Footer, children, and overlays

The footer shows username and role while expanded. The sign-out button passes the `onLogout` prop directly as its click handler. In the main content region, `{children}` inserts the workspace that `Main` selected.

The remainder of the file conditionally mounts the mobile navigation, `CommandPalette`, and `UploadPaperModal`. Their `open` and change callbacks connect their internal close actions back to this layout's state. Read the component props at each JSX call site to see which parts of state they can change.

## Related source tours

- [Main login and shell](/06-code-tour/main-login-and-shell)
- [Shared admin UI](/06-code-tour/shared-admin-ui)
- [Navigation and keyboard shortcuts](/01-admin-portal/navigation-and-shortcuts)
