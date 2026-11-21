# PaySol Tenant App (the Business App)

The app a PaySol business uses every day: **the counter where staff sell** and **the
management side where the owner runs the business**. One Vue project, two modes, and
each person's role decides which parts they see.

> **New here (person or AI agent)? Read in this order:**
> 0. `PAYSOL.md`: what PaySol is, the problem, the wedge, the projects and the full feature scope (§6).
> 1. This README: what the app is, where it stands (§3), what is left (§4), which APIs exist and which this app uses (§8, §9).
> 2. `AGENTS.md`: how to write code here so it reads like Kelvin's.
> 3. The backend's `README.md`, `AGENTS.md` and Postman collection for every endpoint's exact shape.
>
> The Paysol admin console (`../Paysol.Admin`) is the sister project. Its patterns, components and style are the model for this one.

---

## 1. What it is

PaySol is a multi-tenant cloud POS for Kenyan small businesses, bars and wines & spirits first
(then kinyozi and spa, supermarkets, pharmacies, restaurants…). Each business is a **tenant**.

| Project | Who uses it | Where |
|---|---|---|
| PaySol admin console (`Paysol.Admin`) | The PaySol team: onboarding, support, billing | `admin.paysol.com` |
| **This app (`PaySol.Tenant`)** | **A business's owner, managers, cashiers and waiters** | **`<business>.paysol.com`** (planned) |
| Backend (`C:\xampp\htdocs\Paysol-Laravel-Backend`) | Both apps, and later a native Android app | `api.paysol.com`, `/api/v1` |

The old plain-PHP repo `OzzayNetwork/Paysol-POS-APIs` is reference only (how tabs, payments,
loyalty and risk worked before), never the schema.

### Why owners will pay for it (from the field)

- Owners are often away and **don't trust the reports their staff give them**.
- Staff sell their own stock and report no sales; staff are blamed for "shorts" when a payment
  can't be confirmed.
- Existing systems are offline on one shop computer, so the owner can't see anything from home.

So the app leads with **trust**: the money check per shift (expected vs counted), M-Pesa confirmed
by Safaricom vs typed in by hand, and "Needs a look" (unconfirmed payments, low stock, voids).
Every override is recorded with who did it and who approved it. It protects honest staff as much
as it catches dishonest ones.

---

## 2. Two modes, one app

| | **Manage** | **Sell** |
|---|---|---|
| For | Owner, manager, stock keeper | Cashier, waiter (owner and manager can switch in) |
| Screens | Home (trust dashboard), products and prices, stock, staff, branches, payment methods, reports, business settings, plan and billing | Product grid and search, cart, tabs (open bills), payment (cash, M-Pesa, card), receipts, own shift open / close and cash count |
| Sign in | Phone or email + password, on any device | PIN, only on a counter device registered to a branch (planned) |
| Look | **The admin console's look** (Kelvin, 11 Nov): its theme, layout and components; works on a phone | Same look, full screen, touch-first, big tap targets, fast |

A native Android counter app may come later. It would be another client on the same API, so
nothing here should assume the browser is the only seller.

### Roles (Proposed, 11 Nov 2026; see the decisions log)

The backend's roles today are `owner`, `manager`, `cashier`, `waiter` (`App\Enums\TenantRole`),
each person limited to their branches (`branch_scope`). The backend's `EnsureTenantRole`
middleware is the authority; the app only hides what a person can't use.

| Can… | Owner | Manager | Cashier | Waiter | Stock keeper* |
|---|:-:|:-:|:-:|:-:|:-:|
| Opens into | Manage | Manage | Sell | Sell | Manage (stock) |
| Sell, open a tab, take payment | ✓ | ✓ | ✓ | Tabs; payment if allowed | |
| Open / close own shift, count cash | ✓ | ✓ | ✓ | | |
| Void, discount, change a price at the till | ✓ | ✓ | Manager PIN | Manager PIN | |
| Receive, adjust, transfer stock | ✓ | ✓ | | | ✓ |
| Products and prices | ✓ | ✓ | | | view |
| Staff | ✓ | cashiers, waiters | | | |
| Reports and money check | all branches | own branches | own shift | own tabs | stock |
| Payment methods, business details, plan and billing | ✓ | | | | |

\* Stock keeper (and a possible read-only Accountant) does not exist in the backend yet; waiting on Kelvin.

Rules proposed with it: fixed roles plus optional extra permissions per person (no custom roles in
v1); everyone but the owner is limited to their branches; a **manager's PIN on the spot** for voids,
discounts, price changes and selling below recorded stock, logged with both names; cashiers can
never open Manage.

---

## 3. Where we are (update every session)

**Stage: first Manage screens — sign-in, Activity Log, Staff, Products & Prices work against real data; no Sell screens yet.** (12 Nov 2026)

- ✅ **Converted from a copy of the admin console** (11 Nov 2026): same theme, layout and
  components; admin-only pages, APIs and menus moved to `_admin_leftovers/` (git-ignored, kept for
  reference, safe to delete once Kelvin agrees). Build passes.
- ✅ Sign-in: phone or email + password, choose a business, switch business from the top bar,
  activation (code → password + optional PIN), sign out. Session in `psBizToken` / `psBizSession`.
- ✅ Sidebar from `src/nav/manageMenu.js`, filtered by role; routes carry `meta.roles`.
- ✅ Home (welcome, role, setup checklist from `/auth/me`) and the business **Activity Log**
  (owner, manager), on the new backend endpoint `GET /tenant/activity`.
- ✅ Legal prompt after sign-in (`/tenant/legal/pending` → accept).
- ✅ Staff: list, add, profile with its own Activity log, role & access (12 Nov 2026).
- ✅ Products & Prices: the list with a product modal, and barcode-first Add Product (shop →
  PaySol catalogue → Open Food Facts, packs, photo, Add & next) (12 Nov 2026). Tried end to end
  in a browser against real data.
- ✅ Folder created (`PaySol.Tenant`), this README and `AGENTS.md` written.
- ✅ Agreed: one app holds both the counter (Sell) and management (Manage), with defined roles.
- 📐 Designed (awaiting Kelvin's review): canvas **"PaySol Business App"**
  https://claude.ai/artifact/2cp5tFETrgquzxVBXFWFyc. Boards: Home (desktop), Home on a phone,
  Sign in + choose a business, Products and stock (product panel: stock per branch, movements),
  Staff (Add staff: role, branch, permissions, PIN by SMS), Settings › How you get paid; shared
  part BizSidebar. Sample data only. No Sell boards yet.
- ✅ Look: **the same as the admin console** (Kelvin, 11 Nov 2026); the canvas's "Evergreen" look is dropped. Kelvin's eight front-end rules are `AGENTS.md` §0.
- ⏳ Being agreed with Kelvin before building (Explore mode): the roles above; offline selling;
  the checkout decisions (money storage, below-stock selling, VAT-inclusive prices, Daraja set-up,
  old pos-api data); counter hardware (screen, printer, scanner, drawer); build order; the look
  for Sell.

## 4. What is left (proposed order; each step = design board → API brief if needed → screens)

| # | Milestone | Needs from the backend | Status |
|---|---|---|---|
| 0 | Agreements above; Sell boards on the canvas | — | ⏳ |
| 1 | Scaffold: Vite + Vue 3, router, Pinia, axios client, the admin console's theme, shell (sidebar, top bar), `/test-page` | — | ✅ |
| 2 | Sign in, choose / switch business, activation (set password), legal pop-up; Activity Log | exists | ✅ (browser test against real data pending) |
| 3 | Manage › Staff (list, add with role / branch / PIN, suspend, reactivate) | exists | ✅ 12 Nov |
| 4 | Manage › Payment methods ("How you get paid") | exists | ⬜ |
| 5 | Manage › Stock (levels, movements, receive, adjust, transfers) | exists | ✅ 20 Nov |
| 6 | Manage › Products and prices (own list, barcode-first add, packs, photo, stop selling) | exists (12 Nov) | ✅ list + add 12 Nov; full edit form ⬜ |
| 7 | Manage › Branches, business details (name, logo, KRA PIN, receipt header) | **missing** | ⬜ |
| 8 | Counter devices: register a device to a branch; PIN sign-in on it | **missing** | ⬜ |
| 9 | Sell › quick cash sale, receipt | **missing** (checkout S1) | ⬜ |
| 10 | Sell › tabs: rounds, split and partial payments, handover, walkout | **missing** (checkout S3) | ⬜ |
| 11 | Sell › M-Pesa STK with Safaricom confirmation | **missing** (checkout S4) | ⬜ |
| 12 | Shifts, cash count, Z-report; Manage › Home (money check, needs a look, sales by hour) | **missing** (checkout S5, home summary) | ⬜ |
| 13 | Reports; plan and billing for the owner | **missing** | ⬜ |

The checkout stages (S0–S6) are in the backend's `docs/CHECKOUT-PLAN.md`.

---

## 5. Stack (same as the admin console)

Vue 3 (`<script setup>`), Vite, Vue Router 4, Pinia, axios, Bootstrap 5 with the Skote classes,
Iconify icons, dayjs, Highcharts. Font: Plus Jakarta Sans. Node 18. Exact packages are fixed at
scaffold time; **no package is added without asking Kelvin.**

## 6. Running it (filled in at scaffold time)

```bash
npm install
npm run dev          # dev server (proposed port 5175; the console uses 5173)
npx vite build --outDir "$env:TEMP\paysol-tenant-build" --emptyOutDir   # check the build
```

The port is fixed at **5175** in `vite.config.js` (`server: { port: 5175, strictPort: true }`): it fails with "port in use" rather than moving, because the backend's `TENANT_APP_URL` (email links) points there. Ports for every project: `PAYSOL.md` §4.

`.env`: `VITE_API_BASE_URL=http://localhost:8000/api/v1`. In development the business comes from
the sign-in (and the business picker); subdomains only matter once deployed.

## 7. What's built

Each page, route, file, API module and role gets a row here when it is built:

| Page | Route | Mode | File | API (`src/api`) | Roles |
|---|---|---|---|---|---|
| Sign in | `/login` | — | `pages/Authentication/Auth.login.vue` | `auth.login` | public |
| Choose a business | `/choose-business` | — | `pages/Authentication/Auth.chooseBusiness.vue` | `auth.selectTenant` | picker token |
| Activate your account | `/activate` | — | `pages/Authentication/Auth.activate.vue` | `auth.verifySetupCode`, `auth.setPassword` | public / setup token |
| Home | `/` | Manage | `pages/Home/Home.vue` | `auth.me` | any |
| Activity Log | `/activity-log` | Manage | `pages/ActivityLog/ActivityLog.List.vue` | `activity.list`, `activity.get` | owner, manager |
| Staff | `/staff` | Manage | `pages/Staff/Staff.List.vue` | `staff.list`, `branches.list` | owner, manager |
| Add Staff | `/staff/add` | Manage | `pages/Staff/Staff.Add.vue` | `staff.create`, `branches.list` | owner, manager |
| Staff profile | `/staff/:id` (`?tab=access`) | Manage | `pages/Staff/Staff.Details.vue` | `staff.get`, `staff.update`, `staff.suspend`, `staff.reactivate`, `staff.remove`, `activity.list`, `activity.get`, `branches.list` | owner, manager |
| Products & Prices | `/products` (`?open=id`) | Manage | `pages/Products/Products.List.vue` | `products.list`, `products.get`, `products.update`, `products.uploadImage` | owner, manager |
| Add Product | `/products/add` | Manage | `pages/Products/Products.Add.vue` | `products.lookup`, `products.categories`, `products.create`, `products.uploadImage`, `branches.list` | owner, manager |
| Component reference | `/test-page` | — | `components/testing.vue` | none (sample data) | owner, manager |
| Stock & Inventory | `/stock` | Manage | `pages/Stock/Stock.List.vue` | `stock.list`, `stock.get`, `stock.adjust`, `stock.receive`, `stock.setReorderPoint`, `stock.acceptSuggestions`, `stock.refreshSuggestions`, `branches.list` | owner, manager |
| Stock Movements | `/stock/movements` | Manage | `pages/Stock/StockMovements.List.vue` | `stock.movements`, `branches.list` | owner, manager |
| Receive Goods | `/stock/receive` | Manage | `pages/Stock/StockReceive.List.vue` | `stock.movements`, `stock.receive`, `branches.list` | owner, manager |
| Counts & Adjustments | `/stock/adjust` | Manage | `pages/Stock/StockAdjustments.List.vue` | `stock.movements`, `stock.adjust`, `branches.list` | owner, manager |
| Stock Transfers | `/stock/transfers` | Manage | `pages/Stock/StockTransfers.List.vue` | `stock.transfers`, `stock.dispatchTransfer`, `stock.receiveTransfer`, `branches.list` | owner, manager |
| Suppliers | `/suppliers` | Manage | `pages/Suppliers/Suppliers.List.vue` | `suppliers.list`, `suppliers.get`, `suppliers.create`, `suppliers.update`, `suppliers.remove` | owner, manager |
| Branches | `/branches` | Manage | `pages/Branches/Branches.List.vue` | `branches.list`, `branches.get`, `branches.create`, `branches.update`, `branches.setMain`, `branches.delete` | owner, manager |
| Not allowed / Not found | `/403`, anything else | — | `pages/ErrorPages/*` | — | — |

### Shared pieces

| Piece | What it does |
|---|---|
| `components/search/GlobalSearch.vue` | Universal omnibar search in the top bar scoped to the active tenant (Ctrl+K, recent searches, quick shortcuts) |
| `pages/Search/Search.Results.vue` | Search results page (`/search`) across products, staff and activity for the active business |
| `nav/searchDestinations.js` | Destination pages, tabs and actions available to the current role |
| `api/search.js` | `GET /tenant/search` client wrapper |
| `api/index.js` | `apiClient` (`/api/v1`) and `tenantClient` (`/api/v1/tenant`); 401 → sign in; `withToken()` for the short-lived picker / setup tokens |
| `stores/auth.js` | token, user, tenant, membership (role, branch scope), other businesses; `hasRole()` |
| `composables/useSessionStart.js` | after any sign-in: store the session, then load `/auth/me` |
| `layouts/Header.vue` | business switcher, full screen, the person's menu (role, Activity Log, sign out) |
| `layouts/Sidebar.vue` + `nav/manageMenu.js` | the menu, filtered by role |
| `components/legal/LegalPrompt.vue` | asks for new / changed terms after sign-in (blocking or "Remind me later") |
| `components/Data-tools/Role.Picker.vue` | choose one role from cards (Test Page card) |
| `components/Data-tools/Branch.Scope.Picker.vue` | "Works at": all branches or ticked ones (Test Page card) |
| `pages/Staff/components/StaffAction.modal.vue` | confirm suspend / reactivate / remove |
| `components/Data-tools/Pack.Rows.vue` | packs on one product: name chips, units, price, optional buying price and barcode, per-unit and saving line (Test Page card) |
| `pages/Products/components/Barcode.Lookup.vue` | the barcode box: your shop → PaySol catalogue → Open Food Facts, with the step line and four outcomes (mistyped, already sold, matched, not found) |
| `pages/Products/helpers/productMeta.js` | units, VAT types (and VAT inside a price), pack names and usual counts, where details came from, `money()` |
| `pages/Staff/helpers/staffMeta.js` | role and status words, icons, tints; branch names |
| `pages/ActivityLog/helpers/businessActivity.js` | the business's activity kinds, icons, tints, the Who filter |
| `components/Data-tools/Activity.Days.vue`, `pages/ActivityLog/components/ActivityEvent.aside.vue` | the day boxes and the event panel (shared with the console) |

---

## 8. APIs this app needs: implemented in the backend

Every business-side endpoint that exists today (checked with `php artisan route:list`,
11 Nov 2026). **Used** = this app calls it. Keep it current: when the backend adds an
endpoint, add a row; when a screen starts calling one, tick it and name the page.

Base `/api/v1`. "Roles" is the backend's `EnsureTenantRole`; "any" = any member of the business.
Tenant routes need a token issued for one business (`EnsureTenantScope`).

### Sign-in and account

| Method | Endpoint | Who | Used | Page(s) | Notes |
|---|---|---|:-:|---|---|
| POST | `/auth/login` | public | ✅ | Sign in | `login` (phone or email) + `password` **or** `pin`; optional `tenant_id` / `short_name`. Several businesses → `requires_tenant_selection` with a picker token. 5 wrong tries in 15 min → 429 with `retry_after` |
| POST | `/auth/select-tenant` | picker token | ✅ | Choose a business | Picks the business; returns a token for that business only |
| POST | `/auth/switch-tenant` | signed in | ✅ | Header (business switcher) | Swaps the token for another business |
| GET | `/auth/me` | signed in | ✅ | after every sign-in; Home | The person, the business, the role |
| POST | `/auth/logout` | signed in | ✅ | Header (Sign out) | |
| POST | `/auth/setup/verify-code` | public | ✅ | Activate | Activation: the code sent to a new owner / staff member |
| POST | `/auth/setup/set-password` | setup token | ✅ | Activate | Password (min 8, confirmed), optional `pin` (4–6 digits), optional `accept` for the legal terms |

### Legal

| Method | Endpoint | Who | Used | Page(s) | Notes |
|---|---|---|:-:|---|---|
| GET | `/tenant/legal/pending` | any | ✅ | LegalPrompt | Terms this person still has to accept (the sign-in pop-up) |
| POST | `/tenant/legal/accept` | any | ✅ | LegalPrompt | 20 a minute |
| GET | `/legal` | public | ⬜ | — | The published documents |
| GET | `/legal/{key}` | public | ⬜ | — | One document (terms, privacy, refund, dpa) |
| GET | `/legal/{key}/versions/{version}` | public | ⬜ | — | An older version |

### Activity (added 11 Nov 2026)

| Method | Endpoint | Who | Used | Page(s) | Notes |
|---|---|---|:-:|---|---|
| GET | `/tenant/activity` | owner, manager | ✅ | Activity Log | `kind`, `actor` (`team` / `business` / `system` / `user:ID`), `q`, `from`, `to`, `page`, `per_page` ≤ 100. `meta`: `total`, `last_page`, `all`, `kinds`, `summary` (by kind, people), `kept_months`. PaySol staff show as "PaySol team" with no device, IP or place |
| GET | `/tenant/activity/{event}` | owner, manager | ✅ | Activity Log (event panel) | The full record; another business's event is 404 |

### Universal Search (added 18 Nov 2026)

| Method | Endpoint | Who | Used | Page(s) | Notes |
|---|---|---|:-:|---|---|
| GET | `/tenant/search` | any (role scoped) | ✅ | GlobalSearch, Search Results | `q`, `category` (`all` / `products` / `staff` / `activity`), `status` (`all` / `active` / `inactive`), `limit`. Replicates Platform Admin search: returns unified DTO rows with matched highlights, badges, photos/avatars, routes, elapsed time and permissions |
| GET | `/tenant/search/feedback/options` | any | ✅ | Search Results (feedback modal) | Feedback reasons (`missing_record`, `code_no_match`, `wrong_order`, `need_filter`, `too_slow`) and `comment_max` (2000) |
| POST | `/tenant/search/feedback` | any | ✅ | Search Results (feedback modal) | Store feedback with tenant context (`tenant_id`, `tenant_name`, `user_id`, `user_name`), query, category, result count, elapsed time, found mood, reasons and comment |

### Branches (added 12 Nov 2026, expanded 20 Nov 2026)

| Method | Endpoint | Who | Used | Page(s) | Notes |
|---|---|---|:-:|---|---|
| GET | `/tenant/branches` | any | ✅ | Branches, Staff, Stock | Full list with location hierarchy, stats (tracked products, units, staff, tills). Filterable by `search` and `include_inactive` |
| GET | `/tenant/branches/{id}` | any | ✅ | Branches (Details aside) | Single branch detail with full geographic breadcrumbs and operational metrics |
| POST | `/tenant/branches` | owner, manager | ✅ | Branches (Add modal) | Create branch; validates plan limits, auto-seeds 0-balance StockLevels for tracked products |
| PATCH | `/tenant/branches/{id}` | owner, manager | ✅ | Branches (Edit modal, Details aside) | Update details or active status (prevents deactivating main branch) |
| POST | `/tenant/branches/{id}/set-main` | owner, manager | ✅ | Branches (Table, Details aside) | Atomically promote branch to main |
| DELETE | `/tenant/branches/{id}` | owner, manager | ✅ | Branches (Table, Details aside) | Safe delete unused branch with zero stock balance and no past movements |

### Staff

| Method | Endpoint | Who | Used | Page(s) | Notes |
|---|---|---|:-:|---|---|
| GET | `/tenant/staff` | owner, manager | ✅ | Staff | Filters incl. `role`, `status`, `user_status` |
| POST | `/tenant/staff` | owner, manager | ✅ | Add Staff | `role` manager / cashier / waiter, `branch_scope[]`, optional `pin` (with a PIN the person is active at once; without, invited) |
| GET | `/tenant/staff/{id}` | owner, manager | ✅ | Staff profile | |
| PATCH | `/tenant/staff/{id}` | owner, manager | ✅ | Staff profile (Role & access) | |
| DELETE | `/tenant/staff/{id}` | owner, manager | ✅ | Staff list, Staff profile (StaffAction.modal) | |
| POST | `/tenant/staff/{id}/suspend` | owner, manager | ✅ | Staff list, Staff profile (StaffAction.modal) | |
| POST | `/tenant/staff/{id}/reactivate` | owner, manager | ✅ | Staff list, Staff profile (StaffAction.modal) | |

### Products (added 12 Nov 2026)

| Method | Endpoint | Who | Used | Page(s) | Notes |
|---|---|---|:-:|---|---|
| GET | `/tenant/products` | any | ✅ | Products & Prices | `q` (name, brand, barcode, SKU), `is_active`, `category_id`, `stock` low / out, `sort_by` name / selling_price / created_at, `sort_order`, `page`, `per_page` ≤ 100. Rows carry `packs`, `total_stock`, `low_stock`, `image_url`; `meta.counts` all / active |
| GET | `/tenant/products/categories` | any | ✅ | Add Product | The catalogue's active categories with a "Parent › Child" `path` |
| GET | `/tenant/products/lookup` | owner, manager | ✅ | Add Product (Barcode.Lookup) | `barcode`. Your shop (products and packs, 8/12/13/14-digit equivalents) → PaySol catalogue → Open Food Facts family. Returns `valid`, `check_digit_ok`, `in_store_code`, `source`, `verified`, `checked[]`, `existing` or `suggestion`. In-store codes (13 digits starting 2) never leave PaySol. 60 a minute |
| POST | `/tenant/products` | owner, manager | ✅ | Add Product | `name`, `selling_price`, optional `cost_price`, `unit` piece / kg / litre / metre, `vat_type`, `category_id`, `barcode` or `generate_barcode`, `packs[]` (`name`, `units`, `selling_price`, `cost_price`, `barcode`), `opening_stock` + `branch_id`, `reorder_level`, `brand`, `size_label`, `description`, `sku`, `keywords[]`, `catalogue_product_id`, `lookup_source`. A duplicate barcode is a 422 ("You already sell this"). A real unknown barcode with a category is proposed to the catalogue (unchecked); `proposed_to_catalogue` in the answer |
| GET | `/tenant/products/{id}` | any | ✅ | Products & Prices (product modal) | The row plus description, keywords, `lookup_source`, who added it, stock per branch, latest 20 movements |
| PATCH | `/tenant/products/{id}` | owner, manager | ✅ | Products & Prices (Stop / Start selling) | Any field from POST; `packs` replaces them all; `is_active` alone logs "stopped selling" / "started selling" |
| POST | `/tenant/products/{id}/image` | owner, manager | ✅ | Add Product, product modal | `file` PNG / JPG / WebP ≤ 2 MB (multipart) |

### Stock

| Method | Endpoint | Who | Used | Page(s) | Notes |
|---|---|---|:-:|---|---|
| GET | `/tenant/stock` | any | ✅ | Stock & Inventory | Levels per branch with status breakdown, valuation, ROL suggestions |
| GET | `/tenant/stock/{productId}` | any | ✅ | Stock (History aside) | One product: stock per branch and 20 recent movements |
| GET | `/tenant/stock/movements` | any | ✅ | Stock Movements, Receive Goods, Counts & Adjustments | Immutable inventory ledger audit trail |
| POST | `/tenant/stock/receive` | owner, manager | ✅ | Stock (Receive modal), Receive Goods | Goods received delivery intake from supplier |
| POST | `/tenant/stock/adjust` | owner, manager | ✅ | Stock (Adjust modal), Counts & Adjustments | Counts, waste, staff drinks… with a reason |
| GET | `/tenant/stock/transfers` | any | ✅ | Stock Transfers | Inter-branch transfers list |
| POST | `/tenant/stock/transfers` | owner, manager | ✅ | Stock Transfers (Dispatch modal) | Send stock to another branch |
| POST | `/tenant/stock/transfers/{id}/receive` | owner, manager | ✅ | Stock Transfers (Receive modal) | Receiving it twice adds it once |
| PATCH | `/tenant/stock/{productId}/reorder-point` | owner, manager | ✅ | Stock (ROL modal) | Set or clear manual reorder point threshold |
| POST | `/tenant/stock/reorder-suggestions/accept` | owner, manager | ✅ | Stock (Accept suggestions) | Accept AI/velocity suggested reorder point |
| POST | `/tenant/stock/reorder-suggestions/refresh` | owner, manager | ✅ | Stock (Recalculate) | Recalculate sales velocity suggestions now |

### Suppliers (Vendor Directory)

| Method | Endpoint | Who | Used | Page(s) | Notes |
|---|---|---|:-:|---|---|
| GET | `/tenant/suppliers` | any | ✅ | Suppliers | List suppliers with delivery stats, search & status filters |
| POST | `/tenant/suppliers` | owner, manager | ✅ | Suppliers (Add modal) | Register a new supplier with KRA PIN, terms, contact |
| GET | `/tenant/suppliers/{id}` | any | ✅ | Suppliers (Details aside) | Supplier profile with latest 20 delivery movements |
| PATCH | `/tenant/suppliers/{id}` | owner, manager | ✅ | Suppliers (Edit modal) | Update vendor details or toggle active status |
| DELETE | `/tenant/suppliers/{id}` | owner, manager | ✅ | Suppliers (Delete action) | Soft delete a supplier, preserving delivery audit trail |

### Payment methods ("How you get paid")

| Method | Endpoint | Who | Used | Page(s) | Notes |
|---|---|---|:-:|---|---|
| GET | `/tenant/payment-methods` | any | ⬜ | — | |
| POST | `/tenant/payment-methods` | owner, manager | ⬜ | — | |
| GET | `/tenant/payment-methods/{id}` | any | ⬜ | — | |
| PATCH | `/tenant/payment-methods/{id}` | owner, manager | ⬜ | — | |
| DELETE | `/tenant/payment-methods/{id}` | owner, manager | ⬜ | — | |

### Public reference

| Method | Endpoint | Who | Used | Page(s) | Notes |
|---|---|---|:-:|---|---|
| GET | `/plans` | public | ⬜ | — | Plans and prices (cached) |
| GET | Locations (`/areas/search`, `/areas/{area}`, `/constituencies/{constituency}`…) | public | ⬜ | — | For branch addresses; the full list is in the backend README (not counted below) |

**Totals:** 43 endpoints · 30 used by this app.

## 9. APIs this app needs: not built yet

Each gets a brief in the backend (`docs/briefs/`) before it is built (usually by Antigravity),
then moves to §8.

| Area | Needed for | Brief | Status |
|---|---|---|---|
| ~~Business's own products: list, add, edit price / VAT, hide from counter~~ | Products, Sell | — | ✅ built 12 Nov 2026, now in §8 |
| The business's own categories (today only the catalogue's) | Products, Sell | — | ⬜ |
| Read a supplier's invoice photo into a product list ("Scan a list", from Kaunta POS) | Add Product | — | ⬜ parked |
| Branches: list, add, edit | Branch pickers, staff scope, stock | — | ⬜ |
| Business details: name, logo, KRA PIN, receipt header | Settings, receipts | — | ⬜ |
| Counter devices: register to a branch, list, revoke; PIN sign-in tied to the device | Sell sign-in | — | ⬜ |
| Sales: quick sale with `Idempotency-Key`, get, void (with manager approval) | Sell | `docs/CHECKOUT-PLAN.md` S1 | ⬜ |
| Tabs: open, add rounds, split / partial payments, hand over, walkout | Sell | CHECKOUT-PLAN S3 | ⬜ |
| M-Pesa STK push, callback, status; manual entries flagged | Sell, Home | CHECKOUT-PLAN S4 | ⬜ |
| Shifts: open, close, cash count, Z-report | Sell, Home | CHECKOUT-PLAN S5 | ⬜ |
| Manager approvals (PIN overrides) recorded with both people | Sell | — | ⬜ |
| Home summary: money check per shift, needs a look, sales by hour, top sellers, on shift | Home | — | ⬜ |
| Reports | Reports | — | ⬜ |
| The owner's plan and billing | Settings | — | ⬜ |
| ~~The business's activity log (who did what)~~ | Activity Log | — | ✅ built 11 Nov 2026, now in §8 |

---

## 10. Changelog

Newest first. One entry per session that changes this app; the matching backend entry has the
same date in the backend README.

### 20 Nov 2026 - Stock module alignment: Movements, Receive, Adjustments, Transfers
- Aligned all sub-pages under Stock (`/stock/movements`, `/stock/receive`, `/stock/adjust`, `/stock/transfers`) strictly to Kelvin's front-end design standard (`AGENTS.md` §0, §5, §7) and the model established in `Stock.List.vue`:
  - Standard Skote `page-title-box` with breadcrumb trail (`Home › Products & stock › ...`).
  - Standard toolbar with refresh avatar button, search form with submit button + clear icon, responsive mobile filter dropdown (`d-lg-none`), desktop columns toggle (`d-lg-flex d-none`), and active filter chips bar (`chips`).
  - Blog Articles style filter pills with status indicator dots (`mdi mdi-record`).
  - Standard Catalogue `doc-table` layout with sub-table header count (`Showing X of Y`), sortable table headers, and status badges styled with subtle tints and status dots.
  - Dual-layout 375px mobile responsiveness: full table on tablets/desktop (`d-none d-md-block`) and responsive product cards on mobile phones (`d-md-none`).
  - `ImageToast` integration at page level for copy, receive, adjust, and transfer feedback.
  - Updated `AGENTS.md` §12 and `README.md` §8 table with `/tenant/stock/movements`, `/tenant/stock/transfers`, `/tenant/stock/transfers` dispatch, and `/tenant/stock/transfers/{id}/receive`.

### 18 Nov 2026 - Suppliers & Vendor Directory Management (`/suppliers`)
- **Suppliers Backend (`C:\xampp\htdocs\Paysol-Laravel-Backend`)**:
  - Database migration `2026_11_18_230000_create_tenant_suppliers_table.php`: `tenant_suppliers` with soft deletes, ULID primary key, KRA tax PIN, contact details, payment terms, and foreign `supplier_id` on `stock_movements`.
  - Eloquent model `App\Models\TenantSupplier` with relationships to `Tenant`, creator `User`, and `StockMovement`s.
  - API Controller `App\Http\Controllers\Api\Tenant\SupplierController`: `index`, `store`, `show`, `update`, `destroy` with tenant activity logging and full delivery statistics.
  - Updated `StockController::receive` and `StockService::receiveStock` to link `supplier_id` and auto-resolve supplier name.
  - Feature test suite `tests/Feature/Tenant/TenantSupplierTest.php`: 7 tests passing covering CRUD, role checks, and delivery tracking.
- **Suppliers API Client (`src/api/suppliers.js`)**:
  - Wraps `/suppliers` endpoints for listing, details, registration, updates, and removal.
- **Suppliers List Page (`src/pages/Suppliers/Suppliers.List.vue`)**:
  - Built following Kelvin's front-end rules (`Staff.List.vue` and `Banks.List.vue` design system).
  - Summary KPI cards: Total Registered, Active Suppliers, Total Deliveries Logged.
  - Search toolbar with real-time debounce, clear button, and keyword search across company name, contact person, phone, email, and KRA PIN.
  - Status filter pills (`active`, `all`, `inactive`) and customizable column toggles.
  - Data table with vendor initials circle, KRA PIN, click-to-call/email, location, payment terms badge, delivery counts & KES spent, status badge, and action buttons.
  - Responsive mobile cards view with zero horizontal scroll.
- **Modals & Drawers (`src/pages/Suppliers/components/`)**:
  - `SupplierForm.modal.vue`: Add & Edit supplier modal with KRA Tax PIN, contact info, payment terms datalist suggestions, and active status toggle.
  - `SupplierDetails.aside.vue`: Offcanvas drawer displaying vendor profile, quick contact actions, delivery statistics, and latest 20 delivery movements with quick "Receive Goods" and "Edit Profile" CTAs.
  - `StockReceive.modal.vue`: Upgraded to link directly to registered suppliers with datalist search and auto-linking `supplier_id`.
- **Navigation & Component Reference**:
  - Registered route `/suppliers` in `src/router/index.js` and added under `Products & stock` in `src/nav/manageMenu.js`.
  - Added "Suppliers & Vendor Directory" reference card in `src/components/testing.vue` (`/test-page`).

### 18 Nov 2026 - Stock & Inventory Management UI (`/stock`)
- **Stock API Client (`src/api/stock.js`)**:
  - Full client covering `GET /tenant/stock`, `GET /tenant/stock/{id}`, `GET /tenant/stock/movements`, `GET /tenant/stock/transfers`, `POST /tenant/stock/receive`, `POST /tenant/stock/adjust`, `PATCH /tenant/stock/{id}/reorder-point`, and suggestion acceptance/refresh.
- **Stock & Inventory Page (`src/pages/Stock/Stock.List.vue`)**:
  - Reuses Kelvin's UI patterns from `Products.inventory.pos.table.vue` and `Products.List.vue`.
  - Branch dropdown switcher with multi-branch awareness.
  - Four top summary metric cards: Stock Valuation (KES), Needs Order count (out + low), Healthy In-Stock count, and AI Suggestions Waiting count with one-click "Accept All" & "Recalculate".
  - Status tabs: All Items, Needs Order, Out of Stock, Low Stock, In Stock, No ROL, Uncounted.
  - Table with product details, stock quantity and safe/low/critical progress bars, reorder point thresholds with inline suggestion actions, sales velocity days-left countdown, and action buttons.
- **Modals & Drawers (`src/pages/Stock/components/`)**:
  - `StockAdjust.modal.vue`: Quick physical count audit, waste/spoilage, or staff drink deduction.
  - `ReorderPoint.modal.vue`: Set or clear manual reorder point threshold or adopt velocity suggestion.
  - `StockReceive.modal.vue`: Full supplier goods delivery intake with line items, bonus units, and total cost calculation.
  - `StockHistory.aside.vue`: Offcanvas audit drawer displaying product branch balances and recent 20 movements.
- **Component Reference Card (`src/components/testing.vue`)**: Mounted sample stock health progress bars and status badges on `/test-page`.
- **Navigation & Routing**: Added `/stock` route in `src/router/index.js` and enabled "Stock Levels" in `src/nav/manageMenu.js`.

### 18 Nov 2026 - Circular Business Branding Avatar & Primary Color Fallback
- **Circular Business Branding (`src/layouts/Sidebar.vue` & `src/pages/Authentication/Auth.chooseBusiness.vue`)**:
  - Avatar container is strictly circular (`.sidebar-business-avatar`, `border-radius: 50% !important; overflow: hidden`).
  - Displays the business logo (`logo_url`) when present and valid.
  - Automatically falls back to bold uppercase initials (`initialsOf(name)`) if the logo is absent or fails to load (`@error`).
  - **Dynamic Primary Color Background**: Sets the background color of the initials badge to the business's own branding primary color (`branding.primary_color`, e.g. `#ED0208` for Arsenal Sports Bar, `#744214` for Cleo's Kitchen) with crisp white text.
  - Applied across the sidebar trigger button, sidebar dropdown header, the "Switch to" other businesses list, and the `/choose-business` login switcher.
- **Backend API (`TenantAuthController.php`)**:
  - Added `primary_color` to `login`, `selectTenant`, and `me` endpoints for both current tenant and all `other_businesses`.
- **Test Page Card (`/test-page`)**: Added reference card in `src/components/testing.vue` demonstrating circular logos and primary-color initials fallbacks.
- **Custom CSS (`src/assets/css/custom.css`)**: Added `.sidebar-business-avatar` rules to Section 15.

### 18 Nov 2026 - Replicated Platform Admin Search Results Page & Feedback System
- **Replicated Search Results Design & Behavior (`src/pages/Search/Search.Results.vue`)**:
  - Full replicate of `Paysol.Admin/src/pages/Search/Search.Results.vue` tailored to the tenant environment.
  - **Module Tabs on Page**: `All` with aggregated count (e.g. `10+`), `Products & Prices`, `Staff`, and `Activity Log` with active indicator and zero state styling.
  - **Header & Sorting**: "Showing results for “{q}”" with elapsed execution time and total hit count; Sort dropdown for "Newest first" and "Name, A to Z".
  - **Grouped Result Cards**:
    - Group head with module-colored icon tile (`.ps-tile`), record counts, descriptive note, and deep-link to full module ("Open {module} →").
    - Result rows (`.ps-row`) with product photo / staff avatar (error fallback to initials or module icon), breadcrumb hierarchy (`{business} > {module} > {title}`), search text match highlighting (`<mark class="ps-hit">`), status pills (`badgeTone`), matched field excerpt (`Barcode`, `SKU`, `Phone`, `Email`), and soft-primary action buttons.
    - Group footer with "Show {n} more in {module}" pagination expansion.
  - **Pages & Actions Shortcuts (`src/pages/Search/components/SearchDestinations.card.vue`)**:
    - Surfaces matching navigation paths, tabs, and actions directly above results and on empty search screens.
  - **Empty States & Guidance**:
    - Short query (< 2 characters) helper with keyboard shortcut badge (`Ctrl + K` / `⌘ + K`).
    - No-results layout with targeted search tips (name, barcode, phone), quick creation actions (Add product / Add staff), role-based hidden modules warning, and search feedback prompt.
  - **Sticky Filter Sidebar (`.ps-filters`)**:
    - Sticky card with filter counter badge, section/module scope dropdown, and status filter (`All`, `Active`, `Inactive`).
  - **Search Feedback Modal (`src/pages/Search/components/SearchFeedback.modal.vue`)**:
    - Replicated "How can we improve search?" modal featuring mood buttons ("Yes, found it" / "Could be better"), interactive reason chips loaded from backend, free-text comment with counter, sender context footer, and confirmation screen.
- **Backend Search & Feedback Integration**:
  - Enhanced `SearchController.php`: added `elapsed_ms`, `permissions`, `matched_field`, `matched_text`, `image_url` for products, and status filtering (`status=all|active|inactive`).
  - Added `GET /api/v1/tenant/search/feedback/options` and `POST /api/v1/tenant/search/feedback` storing feedback with tenant context (`tenant_id`, `tenant_name`, `user_id`, `user_name`).

### 18 Nov 2026 - Sidebar Business Identity & Switcher + Universal Omnibar Search
- **Sidebar Business Identity & Switcher (`src/layouts/Sidebar.vue`)**:
  - Moved business identity and switching from the top bar header to the top of the dark sidebar.
  - Features an avatar circle with the business logo or bold uppercase initials.
  - Line 1: Business name with single-line ellipsis truncation (`text-truncate`) and chevron.
  - Line 2: Business location / address (`address_line` or fallback) with single-line ellipsis truncation (`text-truncate`).
  - Dropdown menu displays the active business card, plan badge, code (`PS-00004`), and role.
  - Switcher list displays other businesses the user belongs to with role badges and switching spinner (`authApi.switchTenant()`).
  - "Add another business" item opens a modal with options to request a new business registration or enter an invitation activation code (`/activate`).
  - Fully responsive and styled for both expanded and collapsed sidebar states (`body.vertical-collpsed` shows centered avatar only).
- **Universal Omnibar Search (`src/components/search/GlobalSearch.vue`)**:
  - Added universal search omnibar in `Header.vue` (desktop expanding input and mobile search button) configured strictly for the active tenant.
  - Keyboard shortcut **`Ctrl + K`** (or **`⌘ + K`** on Mac) opens and focuses search anywhere.
  - Supports recent search history (localStorage), scope chips (`Everything`, `Products`, `Staff`, `Activity`), and query heuristics (detects barcodes or phone numbers).
  - Quick action suggestions matching available pages and actions (`destinationsFor(myRole)`).
- **Dedicated Search Results Page (`src/pages/Search/Search.Results.vue` & `/search` route)**:
  - Scoped to active tenant's products, staff, and activity feed.
  - Category tabs with live hit counts, sort dropdown, matching quick navigation shortcuts, and helpful search tips.
- **Backend Search API (`GET /api/v1/tenant/search`)**:
  - Added `App\Http\Controllers\Api\Tenant\SearchController.php` with role-based filtering and unified DTO output.
  - Enhanced `TenantAuthController.php` (`login`, `selectTenant`, `me`) to return `address_line`, `location`, `logo_url` for active tenant and other businesses.
- **Test Page Card (`/test-page`)**: Added interactive preview card for `GlobalSearch.vue` in `testing.vue` per Kelvin's front-end rule 2.
- **Custom CSS (`src/assets/css/custom.css`)**: Added Section 15 for Sidebar Business Identity & Switcher styling.

### 20 Nov 2026 - Branches Management: Google Maps, Device GPS & Boundary Auto-Resolution
- **Location-First Add/Edit Branch Flow (`BranchForm.modal.vue`)**:
  - Modelled on `Onboard.Location.step.vue` from `Paysol.Admin`. Moved map point & location selection directly to the top of the branch form (`01 · Map & Device Pin`).
  - **Device GPS Geolocation**: Added prominent `"I'm at this location"` (`mdi mdi-crosshairs-gps`) action that captures accurate latitude & longitude from the device.
  - **Google Maps Integration**:
    - Embedded interactive Google Map (`utils/googleMaps.js`, `VITE_GOOGLE_MAPS_API_KEY`) with click-to-pin, draggable marker (`dragend` event), and dynamic pan/zoom.
    - Integrated `GoogleLocationInput.vue` for street address and places autocomplete.
  - **Automatic Kenyan Boundary Pre-fill (`GET /api/v1/geo/locate`)**:
    - Pinning coordinates automatically invokes the backend boundary locator (`/geo/locate`), finding the exact containing ward from IEBC boundary outlines.
    - Cascades and auto-prefills County, Constituency, and Ward, and loads matching areas/estates without manual dropdown navigation.
    - Displays a confirmation banner: `Resolved boundary: [Ward Name] Ward · [Constituency], [County] (Auto-prefilled)`.
  - **Google Reverse Geocoding**:
    - Automatically reverse geocodes the street address into `address_line` when an unpinned location is pinned.
- **`src/api/geography.js`**: Added `locate({ lat, lng, limit })` calling `GET /api/v1/geo/locate`.
- **`GoogleLocationInput.vue`**: Enhanced event payload to pass `name`, `formatted_address`, and `place` object.
- **Build Verified**: Clean production build in 10.77s (`npx vite build --outDir "$env:TEMP\paysol-tenant-build" --emptyOutDir`).

### 20 Nov 2026 - Branches Management UI & Styling Refinement
- **Kelvin's Review & Refinement**: Fixed spacing in the Branch Identity cell and redesigned the Employees and Tills columns to strictly adhere to `Banks.List.vue` in `Paysol.Admin`.
- **`Branches.List.vue`**:
  - Replaced non-existent Bootstrap classes (`gap-2.5`, `gap-1.5`, `px-1.5`, `py-0.5`) with standard `gap-3`, `gap-2`, and proper badge padding. The store avatar now has generous 16px separation from the text, and the branch name has clean 8px spacing from the `Main` badge.
  - Redesigned the Employees column: eliminated awkward gray border badges (`0 staff`). Formatted with clean typography matching the Stock column: primary bold number (`font-size-13 fw-bold text-dark`) with muted count subtitle below (`employee` / `employees`), and an elegant muted dash (`—`) when no employees are assigned.
  - Replaced inline row buttons with the standard 3-dots dropdown menu (`bx bx-dots-horizontal-rounded`) from `Banks.List.vue` and `Staff.List.vue` (View Details, Edit Branch, Set as Main, Delete Branch).
  - Adopted Kelvin's signature `doc-table` header count bar (`Showing X of Y Branches`) and table skeleton rows.
- **`BranchDetails.aside.vue`**: Cleaned up title spacing and aligned KPI card terminology to "Employees".
- **Build Verified**: Clean build in 10.91s (`npx vite build --outDir "$env:TEMP\paysol-tenant-build" --emptyOutDir`).

### 18 Nov 2026 - Refined Inactivity Auto-Logout & Session Guardian
- Refined session security and auto-logout logic for PaySol Business (`PaySol.Tenant`).
- **`src/composables/useAutoLogout.js`**: Throttled interaction tracking (`mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll` throttled to 3s), configurable idle duration (defaults to 15 minutes, or user/tenant security preference), cross-tab sync via `localStorage` (`psBizLastActivity`) and `storage` event so active work in one tab resets idle timers in all tabs, and sign-out in one tab signs out all tabs.
- **`src/components/guards/SessionTimeoutModal.vue`**: Mounted globally in `App.vue`. Displays a warning modal 60 seconds before session timeout with a real-time countdown, animated progress bar, business context, "Sign out now" button, and "Stay signed in" keep-alive action (which calls `GET /auth/me` to refresh the Sanctum token). Supports demo preview on `/test-page`.
- **`src/stores/auth.js`**: Persists initial `psBizLastActivity` on sign-in and purges it on `clearAuth()`.
- **`src/main.js`**: Refined 401 interceptor with `onUnauthorized` to pass `reason: 'expired'` and the prior path as `redirect` query to `/login`.
- **`src/pages/Authentication/Auth.login.vue`**: Added responsive status banner reacting to `route.query.reason` (`inactivity` | `expired` | `logged_out`) so users understand why they were logged out, preserving their previous URL in `redirect` for seamless re-entry.
- **`/test-page` (`src/components/testing.vue`)**: Added a reference card for `SessionTimeoutModal` with preview trigger per Kelvin's front-end rule 2.
- **`src/assets/css/custom.css`**: Added section "Security & Session Timeout Guardian".

### 12 Nov 2026 - Products & Prices: barcode-first Add Product (moved from the console)
- Kelvin: "Move it to the tenant side and update the form, use the approach that was already there and remember update both API and front end to incorporate what we have learnt" (his console page `Products.POS.add.vue` plus what we learnt from Kaunta POS, project doc `claude/18-kaunta-pos.md`).
- `/products/add` (`Products.Add.vue`): Kelvin's layout kept (gradient hero, faint logo, title that turns into "New Product Registration", the pill barcode box, "OR · Add Product Without Barcode"). The lookup is now one server call: your shop → PaySol catalogue → Open Food Facts, with a step line; "You already sell this" stops a duplicate before any typing. The form is short: photo (upload or take one on a phone), name, category, Sold by chips (piece / kg / litre / metre); selling, buying (with margin) and stock now in one row; VAT chips with "price includes KSh X VAT"; packs inline; brand, size, description, barcode, SKU, reorder level, branch and search words folded under More details. A scanned crate fills the bottle as the product and the crate as its pack. No barcode → PaySol can make a printable in-store code. Summary card: details source, barcode, stock, the "shared with the PaySol catalogue" note, **Add & next** (keeps category, VAT, unit and branch; back to the barcode box; counts what was added) and **Add & view product**.
- `/products` (`Products.List.vue`, built like Staff.List): search (name, brand, barcode, SKU), Selling and Stock filters, sortable name / price / added, table on tablets, cards on phones, load more. A row opens the product modal: photo (tap to change), price, VAT, stock per branch with reorder points, packs, latest stock changes, who added it; **Stop selling / Start selling again**. `?open=id` opens one straight away.
- New: `api/products.js`, `helpers/productMeta.js`, `components/Barcode.Lookup.vue`, `Data-tools/Pack.Rows.vue` (Test Page card). custom.css: `.lookup-steps`, `.lookup-step` states, `.pack-chip`, `.pack-rows`, `.pack-row`, `.product-photo` (+ `is-small`, `is-tiny`, `-busy`), `.product-add-summary`. Menu: Products & Prices no longer "Soon".
- Fixed while testing: the whole form was disabled because `saving` starts as `''` and Vue treats `disabled=""` as on (`:disabled="!!saving"`); a photo that fails to load falls back to the icon; the lookup's alerts wrap on phones.
- Backend (same date): product, lookup, packs, photo endpoints; Open Food Facts as a monitored integration (§8 Products).
- Checked in the browser (temporary proxy, removed) as the Arsenal test owner: scanned Coca-Cola 330 ml (filled from the PaySol catalogue, Soda), priced it, added a crate of 24 and 48 in stock → saved with an opening-stock movement; scanning it again was refused; stop / start selling; a no-barcode "Nyama choma (test)" by the kilo got a PaySol code. Both test products are kept at Arsenal. The list at 375 px has no sideways scroll.
- Open: the full edit form for a product (price, packs, details) is not built; the modal only stops / starts selling and changes the photo. The business's own categories and "Scan a list" (reading an invoice photo) are parked.

### 12 Nov 2026 - Staff (user management)
- Kelvin: "could you make the users and the user management pages already", then for the profile "this page can be better similar to what we did on the user page".
- `/staff` (`Staff.List.vue`, modelled on the console's Team.List): refresh, search, Role and Status filters with counts (`meta.counts`), Columns, "Showing X of Y" with filter chips, sortable headers (name, role, status, joined, last seen), table on tablets and up, cards on phones, load more; row menu View / Edit role & access / Suspend or Reactivate / Remove. The owner and your own row have no actions.
- `/staff/add` (`Staff.Add.vue`): name, phone, email, role cards, "Works at", counter PIN with confirm; the summary says whether they start active (PIN) or invited.
- `/staff/:id` (`Staff.Details.vue`, laid out like the console's Team.Details): identity card (banner, avatar, status block, four dashed facts, contact details, Suspend / Reactivate, More Options), tabs Activity log (their own trail, `actor=user:ID`, with the Activity Log's event panel) and Role & access (name and email, role, works at, counter PIN; Save / Undo). `?tab=access` opens the second tab.
- New shared components with Test Page cards: `Role.Picker.vue`, `Branch.Scope.Picker.vue`; `StaffAction.modal.vue`; `helpers/staffMeta.js`; `api/staff.js`, `api/branches.js`. custom.css: `th.sortable`, `.staff-row`, `.staff-card`, `.detail-line`, `.role-picker*`, `.branch-scope-row`, `.access-row`, `.staff-add-summary`.
- Menu: Staff no longer "Soon". Routes `/staff`, `/staff/add`, `/staff/:id` (owner, manager).
- Backend: new read-only `GET /tenant/branches` (any role) for the branch pickers.
- Checked in the browser (temporary proxy, removed): list, Add Staff (a test cashier with a PIN at Arsenal Sports Bar, kept for testing; login in the backend's git-ignored `storage/app/dev-business-logins.txt`), suspend, reactivate, saving an email, the profile at 1366 px and the list at 375 px.
- **Filters on a person's Activity log** (Kelvin: "let the activity logs have filters"): search, Kind and the shared date range (last 30 days by default, as on the Activity Log), "Showing X of Y" with "Filters in use" chips and Clear all; the end note names the dates. Same `GET /tenant/activity` with `actor=user:ID` plus `kind`, `q`, `from`, `to`.
- Open: PaySol sends no invitation to staff added without a PIN (backend gap); managers can add other managers (the backend allows it; README §2 proposes cashiers and waiters only); no "resend invite".

### 12 Nov 2026 - First run against real data
- Ran MySQL, the API (8000) and the app (5175). Checked in the browser (through a temporary proxy, since
  removed, with a temporary owner token, since deleted): wrong sign-in shows the API's message; Home with the
  real setup checklist (Cleo's Kitchen); Activity Log with real events, PaySol staff shown as "PaySol team",
  the event panel; the Test Page and the legal prompt preview. No console errors from the app.
- `/setup?phone=…` now redirects to `/activate` (the backend's setup SMS and email link there);
  `Auth.activate.vue` also reads `?phone=` / `?email=`.
- `layouts/Footer.vue`: "© PaySol Business" and the signed-in business's name (was the admin's
  "Customer Relationship Management Dashboard" / "CS Payments").
- Still open: the sidebar logo image is the admin console's "cs payments" file (same in the console).
- **Full menu** (Kelvin: "Put all the possible links for now"): `nav/manageMenu.js` lists every planned
  page under Selling, Money, Products & stock, People, Reports, Oversight and Business, each with the
  roles from §2; pages not built carry `soon: true` and show greyed with a "Soon" tag, not clickable
  (`Sidebar.vue`; custom.css `.menu-soon`, `.menu-soon-tag`). Remove `soon` in the change that adds the route.

### 11 Nov 2026 - Converted from the admin console: sign-in, menu, Activity Log
- Kelvin copied the admin console here; converted it to the business app. Admin-only pages,
  APIs, menus, layouts and docs moved to `_admin_leftovers/` (git-ignored, not deleted).
  A few presentational pieces the Test Page shows (PlanCard, OverviewPulse, HealthMatrix,
  ActivityFilterList, legalMeta) were kept in `src/`.
- **API layer:** `api/index.js` (two clients, 401 → sign in, `withToken`), `api/auth.js`,
  `api/legal.js`, `api/activity.js`.
- **Sign-in:** `Auth.login.vue` (rewritten), new `Auth.chooseBusiness.vue` and `Auth.activate.vue`;
  `stores/auth.js` rewritten for the tenant session (`psBizToken` / `psBizSession`, role in
  `membership`, `hasRole()`); `composables/useSessionStart.js`.
- **Shell:** `Header.vue` (business switcher, person menu, sign out), `Sidebar.vue` on
  `nav/manageMenu.js` filtered by role, `App.vue` cleaned (no messenger, alert bars), router
  rewritten (7 routes, `meta.roles`, title "… | PaySol Business").
- **Pages:** `pages/Home/Home.vue` (welcome, role, setup checklist), `pages/ActivityLog/ActivityLog.List.vue`
  (built from the console's per-business Activity tab) with `helpers/businessActivity.js`.
- **Components:** `components/legal/LegalPrompt.vue` (+ Test Page card).
- **Styles:** `custom.css` section "PaySol Business (tenant app)": `.filter-dot`, `.activity-person`,
  `.setup-bar`, `.setup-step`, `.role-chip`, `.legal-prompt-item`.
- **Backend:** new `GET /tenant/activity` and `GET /tenant/activity/{event}` (owner, manager), with
  5 feature tests. §8 now 35 endpoints, 11 used.
- Port 5175 fixed (`strictPort`); `.env` keeps only the API URL and the Maps key.
- Open: an end-to-end browser test against real data (MySQL was off this session).

### 11 Nov 2026 - Project started
- Folder `PaySol.Tenant` created by Kelvin; `README.md` and `AGENTS.md` written so any agent can
  pick the project up.
- Agreed: one tenant app for both the counter (Sell) and management (Manage), with defined roles.
- Listed the 33 business-side endpoints that exist and the APIs still missing.
- `PAYSOL.md` added (what PaySol is and the full feature scope, same file in every repo).
- Kelvin's front-end rules written into `AGENTS.md` §0: the admin console's look (not
  "Evergreen"), test-page cards, `custom.css`, Bootstrap first, responsive, the "APIs used"
  table (`AGENTS.md` §12), components wherever possible, his development style.
- No code yet.
