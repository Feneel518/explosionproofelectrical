# Raw Material Inventory

## Workflow

1. Create raw materials with unit, reorder level, maximum level, rack/location and bin.
2. Create company recipients under **Master → Inventory Employees**.
3. Record inward only through a GRN. Finalizing a GRN posts an `IN` ledger movement.
4. Record outward through **Manufacturing → Material Issues**. Internal issues require an active employee and cannot exceed on-hand stock.
5. Record unused material through **Inventory → Material Returns** against the original issue.
   - Reusable material posts `RETURN_IN` and increases usable stock.
   - Damaged and scrap material remain traceable but do not increase usable stock.
6. Use adjustments only for opening stock, physical-count differences, damage and corrections. A reason is mandatory.

Finalized documents are locked. Corrections should be posted as a return or adjustment instead of editing historical ledger entries.

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
- Never delete ledger rows or change finalized documents directly in the database.
- Investigate duplicate invoices, negative balances and unexplained manual adjustments immediately.
