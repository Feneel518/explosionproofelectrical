# Raw Material Inventory

## Workflow

1. Set the physical-count and inventory go-live dates under **Inventory → Go-Live Setup**.
2. Create raw materials with unit, reorder level, maximum level, rack/location and bin.
3. Save the physical opening count on each raw-material detail page, including materials counted at zero. This activates the material for issue.
4. Create company recipients under **Master → Inventory Employees**.
5. Record inward only through a GRN. Finalizing a post-go-live GRN posts an `IN` ledger movement and activates new materials automatically.
6. Record outward through **Manufacturing → Material Issues**. Only inventory-active materials appear; internal issues require an active employee and cannot exceed on-hand stock.
7. Record unused material through **Inventory → Material Returns** against the original issue.
   - Reusable material posts `RETURN_IN` and increases usable stock.
   - Damaged and scrap material remain traceable but do not increase usable stock.
8. Use adjustments only for physical-count differences, damage and corrections. A reason is mandatory.

GRNs dated before the configured go-live date are blocked from stock posting. Retain those documents as historical purchase records outside the live stock ledger so their quantities are not counted twice.

Finalized inventory documents are generally locked. A finalized GRN can be edited from its detail page; saving the update replaces that GRN's ledger postings and recalculates the affected stock balances in one transaction. Use a return or adjustment when the correction represents a separate physical stock event.

## Access control

All existing dashboard users retain inventory access until inventory-specific lists are configured. Add comma-separated emails to the deployment environment to separate duties:

```env
INVENTORY_STOREKEEPER_EMAILS=store@example.com
INVENTORY_MANAGER_EMAILS=manager@example.com,owner@example.com
```

Storekeepers can finalize GRNs, issues and returns. Managers can also post opening stock and adjustments.

## Database rollout

The schema change is in `prisma/migrations/20260716183000_raw_material_inventory_system/migration.sql`. It was applied to the database configured in this workspace on 16 July 2026 and recorded as applied in Prisma's migration metadata.

This repository's migration history still contains an older unrelated migration that is marked unapplied. Before using `prisma migrate deploy` in another environment, baseline that environment and review its migration status. Back up production data before rollout.

After the database change:

```powershell
npx prisma generate
npm run build
```

## Daily controls

- Review the reorder report daily.
- Review employee consumption weekly.
- Perform a physical count monthly.
- Never delete ledger rows or change finalized documents directly in the database. Use the GRN edit workflow, a return, or an adjustment as appropriate.
- Investigate duplicate invoices, negative balances and unexplained manual adjustments immediately.
