---
title: "GoRobo Store workspace"
description: "Map the GoRobo admin screen to inventory, orders, billing, wallet, bundles, analytics, and its dedicated API helper."
---

> **In one line:** the GoRobo admin UI is a set of store operations screens backed by a dedicated typed API helper and permission-gated routes.

The workspace lives under `src/components/custom/admin/gorobo/`. `GoRoboAdmin.tsx`
hosts the subviews; `gorobo-api.ts` holds data shapes, query-string construction,
response handling, and the `goroboApi` methods used by those views.

| Screen | Component |
|---|---|
| Inventory and stock | `GoRoboInventory.tsx` |
| Bundles / project kits | `GoRoboBundles.tsx` |
| Orders and bill processing | `GoRoboBillProcessor.tsx` |
| Wallet | `AmazeWallet.tsx` |
| Analytics | `GoRoboAnalytics.tsx` |
| Host and tab selection | `GoRoboAdmin.tsx` |

## Follow an operation

For a stock adjustment, trace the inventory control into
`goroboApi.adjustStock`, then inspect how the component refreshes or patches
the displayed item. The API helper throws when the HTTP response is not OK or
when its JSON body has `success: false`. The UI should turn that failure into
visible feedback instead of presenting a failed change as saved.

Store permissions are filtered in the sidebar, and protected API operations
must enforce the same permission server-side. The [GoRobo API reference](https://docs.amazecc.com/amazecc-api/03-api-reference/gorobo/)
documents the backend routes and contracts.

## Money and stock values

Treat prices and inventory updates as high-impact data. Preserve the API's
units and validation, display errors, and avoid client-only calculations as a
source of truth. `formatINR` formats a numeric value for display; it does not
validate or persist a payment.

## Where to next

- [Question bank and OCR review](./question-bank-and-ocr.md)
- [Roles and permissions](../01-admin-portal/roles-and-permissions.md)
- [GoRobo API reference](https://docs.amazecc.com/amazecc-api/03-api-reference/gorobo/)
