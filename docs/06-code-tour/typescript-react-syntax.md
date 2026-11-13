---
title: "TypeScript and React syntax used here"
description: "A plain-language reference for imports, types, hooks, JSX, async functions, object spread, optional chaining, and other syntax found across dashboard modules."
---

> **In one line:** TypeScript describes values, React components turn values into UI, and JavaScript syntax connects events, requests, and state updates.

This is a repo-specific syntax reference, not a complete JavaScript course.
Examples use patterns you will find in `Main.tsx`, `AdminLayout.tsx`,
`AdminLandingPage.tsx`, `api.ts`, and the GoRobo modules.

## Imports and the `@/` alias

```ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import AdminLayout from "@/components/custom/admin/AdminLayout";
```

`import` makes code from another module available in this file. Braces mean
named imports: the exporting file chose those names. An import without braces
is a default import. `@/` is a path alias configured in TypeScript/build
configuration; it points into `src/`, so `@/lib/api` means `src/lib/api.ts`.

`import type { StatsData } ...` imports a type only. TypeScript removes type
information when it builds JavaScript, so a type import does not create a
runtime dependency.

## Variables, constants, and inference

```ts
const [isLoading, setIsLoading] = useState(false);
const token = localStorage.getItem("admin_token");
```

`const` names a binding that cannot be reassigned. The object it refers to
could still be mutable. TypeScript infers `isLoading` as a boolean from
`false`, and infers `token` as `string | null` from the browser API.

## Objects, arrays, interfaces, and union types

```ts
interface AdminLayoutProps {
  userRole?: "superadmin" | "admin";
  userPermissions?: string[];
}
```

An `interface` describes an object's expected fields. `?` means the field may
be missing. `string[]` means a list of strings. The vertical bar inside a type
means “one of these alternatives”; `userRole` can be exactly `superadmin` or
`admin`.

An object literal uses `{ key: value }`; an array uses `[first, second]`.
`Array<T>` is an alternate type spelling for `T[]`.

## Generics and hook tuples

```ts
const [userPermissions, setUserPermissions] = useState<string[]>([]);
```

`useState<T>` calls a generic function. The type parameter `<string[]>` says
the state value is a list of strings. The hook returns a pair: current value
and setter. Square brackets on the left destructure that pair into two names.

## Arrow functions and callbacks

```ts
const handleLogout = () => {
  setIsAuthenticated(false);
};
```

`() => { ... }` is an arrow function with no parameters. `handleLogout` stores
the function so a button can call it later. Arrow functions are also used as
callbacks, for example `.map(item => ...)`, where the function runs once for
each item.

## JSX: HTML-like syntax inside JavaScript

```tsx
<Button onClick={handleLogout} disabled={isLoading}>
  {isLoading ? "Working…" : "Logout"}
</Button>
```

JSX resembles HTML but is compiled into JavaScript calls. Capitalized tags
such as `<Button>` refer to imported React components. Lowercase tags such as
`<button>` refer to browser HTML elements. Curly braces insert a JavaScript
expression. The ternary `condition ? A : B` chooses one of two values. Props
such as `onClick` and `disabled` pass values to a component.

## Conditional rendering

```tsx
{error && <p role="alert">{error}</p>}
```

`&&` means logical AND. In JSX, this common pattern displays the right side
only when `error` is truthy. `if (...) return ...` is used when an entire
component should stop and return an alternate screen, such as the loading
screen before the admin interface is ready.

## Array methods and `key`

```tsx
{items.map(item => <button key={item.id}>{item.label}</button>)}
```

`.map()` transforms each array item into a UI element. React's `key` helps it
match the element across renders when items are added or removed. Use a stable
ID when available; an array index can lead to incorrect focus or state when
the list changes.

`.filter()` keeps elements for which its callback returns `true`.
`.find()` returns the first matching element or `undefined`.
`.includes(value)` checks whether an array contains a value.
`.concat()` makes a combined array without mutating the inputs.

## Destructuring, defaults, spread, and rest

```ts
function AdminLayout({ children, userRole = "admin", ...otherProps }: Props) {}
const headers = new Headers(init.headers);
return fetch(url, { ...init, headers });
```

Destructuring pulls fields out of an object. `userRole = "admin"` supplies a
default only when the value is `undefined`. `...otherProps` collects the
remaining fields (rest syntax). In an object literal, `...init` copies the
existing properties (spread syntax); later properties override earlier ones,
which is why the new `headers` wins here.

## Optional chaining and fallback operators

```ts
const label = statsData?.data?.papers?.total ?? 0;
```

`?.` stops property access and returns `undefined` when the value to its left
is `null` or `undefined`. `??` supplies `0` only for a nullish value. `||`
also falls back for other falsy values such as `0` or an empty string. Choose
between them based on whether zero or an empty string is valid data.

## Async functions and promises

```ts
const handleLogin = async () => {
  const response = await apiFetch("/api/admin/auth");
  const data = await response.json();
};
```

An `async` function returns a Promise, a value that may become available
later. `await` pauses that function until the Promise settles; it does not
freeze the browser. Network requests and JSON parsing are asynchronous.

`try` / `catch` handles thrown errors. `finally` runs whether the request
succeeded or failed, which is why loading flags are often cleared there.

## HTTP headers and JSON request bodies

```ts
apiFetch("/api/admin/items", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Example" }),
});
```

The options object tells `fetch` which HTTP method to use, labels the body as
JSON, and converts the JavaScript object into JSON text. The server must parse
and validate that input. A browser request body is not trusted merely because
TypeScript says it has a particular type.

## Type assertions and `any`

`value as SomeType` tells TypeScript to treat a value as that type without
checking the real value. It is an assertion, not a conversion. `any` disables
many checks. Both can make code easier to connect to loosely typed JSON, but
they move mistakes to runtime; add validation where data crosses a network or
storage boundary.

## Template strings and utility classes

```tsx
className={`text-sm ${isActive ? "text-primary" : "text-muted"}`}
```

Backticks create a template string. `${...}` inserts an expression. In this
project the result is often a list of Tailwind CSS utility classes; each class
sets one styling rule. Use existing design tokens and patterns rather than
inventing new colors.

## Events and event types

`onClick={handleLogout}` passes a function to run after a click. It does not
call the function during render. A form uses `onSubmit`; its handler often
calls `event.preventDefault()` so the browser does not navigate away and reload
the page. `React.FormEvent` is a TypeScript type for a form event.

## Where to next

- [Main login and shell](./main-login-and-shell.md)
- [Admin layout](./admin-layout-line-by-line.md)
- [API client](./api-client-line-by-line.md)
