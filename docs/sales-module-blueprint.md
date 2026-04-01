# Sales Module Blueprint

This project already follows a strong repeatable structure for sales modules.
Use this blueprint to add any new module (for example: `returns`, `proformas`, `credit-notes`) in the same style.

## 1) Naming Convention

- Route folder (plural, kebab-case):
  - `src/app/dashboard/sales/<module-plural>/...`
- Components folder (mostly singular):
  - `src/components/dashboard/sales/<module-singular>/...`
- Actions folder (singular):
  - `src/lib/actions/dashboard/sales/<module-singular>/...`
- Search params (singular):
  - `src/lib/searchParams/dashboard/sales/<module-singular>/...`
- Validator (module-based):
  - `src/lib/validators/dashboard/sales/<module-plural-or-singular>/...`
- Repo helper:
  - `src/lib/helpers/RepoHelpers/<ModuleRepo>.ts`

Match existing style exactly:
- `quotations` -> `quotation`
- `orders` -> `order`
- `invoices` -> `invoice`
- `delivery-challans` -> `delivery-challan`

## 2) Standard File Layout

Create this base layout first:

```text
src/app/dashboard/sales/<module-plural>/page.tsx
src/app/dashboard/sales/<module-plural>/new/page.tsx
src/app/dashboard/sales/<module-plural>/[id]/page.tsx
src/app/dashboard/sales/<module-plural>/[id]/edit/page.tsx
src/app/dashboard/sales/<module-plural>/analytics/page.tsx

src/components/dashboard/sales/<module-singular>/<Module>Table.tsx
src/components/dashboard/sales/<module-singular>/<Module>Toolbar.tsx
src/components/dashboard/sales/<module-singular>/<Module>Action.tsx
src/components/dashboard/sales/<module-singular>/<Module>FormNew.tsx
src/components/dashboard/sales/<module-singular>/<Module>DetailView.tsx
src/components/dashboard/sales/<module-singular>/analytics/*.tsx

src/lib/actions/dashboard/sales/<module-singular>/createDraft<Module>Action.ts
src/lib/actions/dashboard/sales/<module-singular>/get<Module>DraftAction.ts
src/lib/actions/dashboard/sales/<module-singular>/save<Module>DraftSnapshotAction.ts
src/lib/actions/dashboard/sales/<module-singular>/finalize<Module>Action.ts
src/lib/actions/dashboard/sales/<module-singular>/reopen<Module>AsDraftAction.ts
src/lib/actions/dashboard/sales/<module-singular>/get<Module>ByIdAction.ts
src/lib/actions/dashboard/sales/<module-singular>/analytics/get<Module>DashboardAnalytics.ts

src/lib/searchParams/dashboard/sales/<module-singular>/<Module>SearchParams.ts
src/lib/helpers/RepoHelpers/<moduleRepo>.ts
src/lib/validators/dashboard/sales/<module-dir>/<Module>Validator.ts
src/lib/types/<Module>Types.ts
```

## 3) Implementation Order (Recommended)

1. Prisma schema model + migration.
2. Types + zod validator.
3. Repo helper (`build...Where`, `build...OrderBy`).
4. Search params parser/cache.
5. Draft lifecycle server actions.
6. List page + table + toolbar.
7. New/edit/detail pages + form.
8. Analytics page + cards/charts.
9. Optional customer copy pages.

## 4) Parity Checklist Before You Consider It Done

- Pagination limits match existing pages (`page` minimum `1`, `pageSize` clamped).
- List pages use:
  - `<module>SearchParamsCache.parse(await searchParams)`
  - `build<Module>Where(...)`
  - `build<Module>OrderBy(...)`
  - `Promise.all([findMany, count])`
- Draft flow exists end-to-end:
  - create -> autosave snapshot -> finalize -> reopen.
- All server actions use `requireAuth()` where needed.
- Paths and naming are consistent with existing route/component/action conventions.

## 5) Current Consistency Notes

These are minor naming inconsistencies already present in the repo. Keep in mind when extending:
- `orderRepo.ts` uses lowercase initial while others use PascalCase style.
- `loginValifdator.ts` appears to be a typo in filename.
- Some action/validator files are `.tsx` and others `.ts` for similar server-only patterns.

No urgent blocker, but avoid adding new naming drift.
