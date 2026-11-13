---
title: "GoRobo store code tour"
description: "Trace the GoRobo tab shell, shared API helper, inventory and bundles state, billing order workflow, wallet settlements, and analytics actions."
---

The GoRobo screens are feature-specific React components. `GoRoboAdmin.tsx` chooses which child screen to mount, while `gorobo-api.ts` centralizes API types and requests. Most screens follow a read → edit → submit → refresh cycle.

## GoRoboAdmin.tsx: child selection

**Source:** `src/components/custom/admin/gorobo/GoRoboAdmin.tsx`.

The component accepts an optional `initialTab` and renders the store workspace shell with tab content. A default value lets the parent choose a useful initial screen without requiring every caller to pass a prop. Tab IDs are strings shared with `Main.tsx`'s route-to-initialTab mapping. Each selected tab conditionally renders the corresponding child component.

## gorobo-api.ts: shared transport and types

**Source:** `src/components/custom/admin/gorobo/gorobo-api.ts`.

The first section declares TypeScript interfaces for item, order, bundle, line, and analytics payloads. These interfaces document the expected backend shape for this feature, but do not validate JSON at runtime.

`formatINR(value)` uses `Intl.NumberFormat` to format a number as Indian Rupees. `handle<T>(res)` is a generic async response helper: `<T>` lets each caller state the expected parsed response shape. It checks HTTP success, reads error information when needed, throws on failure, and parses successful JSON as T. The type assertion does not transform the JSON.

`qs(params)` accepts a `Record` whose values can be string, number, boolean, or undefined. It uses `URLSearchParams` to encode query values, skips missing entries, and returns a query string suitable for appending to a URL. This avoids hand-encoding spaces and special characters.

The exported API functions group store routes by resource. Read the URL, method, body, and return type together: the function name alone does not prove what the backend persists. Screens should call these helpers rather than reconstructing the store host/headers independently.

## GoRoboInventory.tsx

**Source:** `src/components/custom/admin/gorobo/GoRoboInventory.tsx`.

The module stores catalog items, category/search filters, loading and messages, edit-modal state, and stock adjustment state. `useCallback` stabilizes async loading/actions that are referenced by effects. `useEffect` fetches catalog data after mount. `useMemo` derives an expensive filtered/sorted list from source items and filter inputs; its dependency array must include every value used by the calculation.

Stock and product handlers set a row-specific busy ID, call the matching `gorobo-api` method, show a result message, then refresh or update the item list. Functional state updates such as `setItems(current => ...)` use the latest array value, avoiding stale closure values. Numeric form inputs arrive as strings; convert and validate them before arithmetic or JSON submission.

## GoRoboBundles.tsx

**Source:** `src/components/custom/admin/gorobo/GoRoboBundles.tsx`.

`fetchAll` loads both bundle definitions and inventory items. The effect calls it once. `openAdd` resets the form for a new bundle; `openEdit(bundle)` copies saved fields into the modal. `addLineFromItem(item)` inserts an inventory item into the bundle's `bundleLines` array. `updateLineQty(index, quantity)` and `removeLine(index)` create updated arrays based on the index.

`saveBundle` validates the form and submits a create/update payload depending on whether `editId` is null. `deleteBundle(id, kitName)` requests removal and uses the name for confirmation/user feedback. `reduce` in the render derives raw item cost: for each line it multiplies unit price by quantity and adds it to the running sum. `Number(...) || 0` converts a numeric string while falling back to zero for invalid/falsy results.

## GoRoboBillProcessor.tsx

**Source:** `src/components/custom/admin/gorobo/GoRoboBillProcessor.tsx`.

This is the largest store screen. Read it in functional blocks rather than scanning the full JSX at once:

1. **Shared catalog:** `loadCatalog` fetches items for both editing an existing quote and creating a POS order. Its callback is used by an effect.
2. **Display helpers:** `getDisplayName` turns one order line into a readable label; keep this pure (no state changes or requests).
3. **Order list:** `fetchOrders` loads the list and the effect refreshes it on mount or when its dependencies change.
4. **Quote detail:** `openDetail(id)` loads one order and initializes editable quote lines, discount, tax, shipment, margin, and notes. The `(data.order as any).overallMargin ?? ...` expression supports more than one response spelling and uses nullish coalescing to preserve a valid zero.
5. **Line editing:** `updateLineQty`, `updateLineUnitPrice`, `removeLine`, and `addLineFromCatalog` modify quote rows. They should produce a new state array so React sees a state change.
6. **Custom items:** `addCustomLine` validates a manually entered product and can also save it to the catalog.
7. **Quote save/status:** `saveQuote` serializes the edited order; `updateStatus(newStatus)` changes order lifecycle state. Both own their busy/error feedback.
8. **Customer messages:** `sendWhatsAppQuote` and `sendWhatsAppReady` construct links/messages. URL-encode user-provided text before embedding it in a URL.
9. **Point of sale:** `addPosLine` updates a second cart; `createPosOrder(statusToSet = 'confirmed')` submits a new order with its own customer, tax, shipping, margin, and delivery fields.
10. **Status presentation:** `getStatusBadge(st)` maps status text to visual UI. It does not itself change order status.

The repeated POS and quote fields are separate states because they represent two different drafts. Avoid reusing a setter across both workflows: that would make editing one flow affect the other.

## AmazeWallet.tsx and GoRoboAnalytics.tsx

**Sources:** `AmazeWallet.tsx`, `GoRoboAnalytics.tsx` in the same directory.

`AmazeWallet` initializes a typed empty summary, transaction array, loading state, feedback message, and settlement ID. `fetchWallet` is wrapped in `useCallback` and invoked from an effect. `settle(orderId, party)` uses a union (`customer` or `vendor`) so the call site must name one settlement side; it marks the order as busy, calls the endpoint, and refreshes the wallet data.

`GoRoboAnalytics` stores a nullable typed analytics response and a row ID being restocked. `fetchAnalytics` loads analytics from the common API helper. `quickRestock(itemId, addQty = 10)` submits an inventory adjustment; the default parameter applies only when the caller omits `addQty` or passes `undefined`.

## Syntax patterns in this feature

- **Generic `<T>`**: a caller-selected type parameter; useful for shared response helpers.
- **`useMemo`**: computes a derived value and reuses it until dependencies change.
- **`useCallback`**: stabilizes a function identity; it does not cache the network response.
- **`Record<string, T>`**: dictionary keyed by string IDs.
- **`Array.reduce`**: folds a list into one result, often a number or object.
- **`??`**: fallback only for `null` or `undefined`, preserving zero/empty-string values.
- **Default parameter `quantity = 10`**: used when the argument is undefined.
- **Union `'flat' | 'percent'`**: only the named modes are allowed by TypeScript.

## Related pages

- [GoRobo feature overview](/03-admin-workspaces/gorobo-store)
- [Shared admin API client](/06-code-tour/api-client-line-by-line)
- [Workspace module catalog](/06-code-tour/workspace-module-catalog)
