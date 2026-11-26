# AGENTS.md - PaySol Tenant App (Vue)

> **New here? Read `PAYSOL.md` first:** what PaySol is, who it is for, the scope we are building, and this repository's part in it.

Rules for anyone, person or AI agent, working on this app. The goal: every screen should look
and read as if Kelvin wrote it, and any agent opening this folder should know what the app is,
where it stands and what to do next without asking.

- **What the app is, where we are, what is left, which APIs exist / are used:** `README.md`
  (§2 roles, §3 status, §4 milestones, §8 implemented APIs, §9 missing APIs). Read it first.
- **Sister project:** the admin console, `../Paysol.Admin`. Same stack, same style. Its
  `AGENTS.md` is the long version of these rules; when this file is silent, follow that one.
- **Backend:** `C:\xampp\htdocs\Paysol-Laravel-Backend` (Laravel, `/api/v1`). Its `README.md`,
  `AGENTS.md` and Postman collection (`docs/postman/`) describe every endpoint.
- **Plans and decisions** live in Kelvin's Claude project "Paysol POS API" (`claude/` files:
  working agreement, decisions log, parking lot, status, `14-business-app-handoff.md`).

---

## 0. Kelvin's front-end rules (11 Nov 2026), above everything else in this file

1. **Same look and feel as the admin console** (`../Paysol.Admin`): the same theme, colours,
   fonts, cards, tables, asides, modals, buttons and icons. Not a new look.
2. **Every new component or reusable element gets a card on `/test-page`** for reference.
3. **New styles go in `src/assets/css/custom.css`** as numbered, commented sections, with
   names that say what they do (`.shift-variance`, not `.red-box`).
4. **Bootstrap (with the Skote classes) is the styling base.** Use its classes first and
   don't fight it with custom CSS.
5. **Always responsive:** every screen works on a phone (375 px), a tablet and a desktop.
6. **Always update the APIs used** in §12 of this file (and README §8) whenever a screen
   starts or stops calling an endpoint.
7. **Make components wherever possible:** anything used twice, or likely to be, becomes a
   component instead of copied markup.
8. **Write it Kelvin's way:** go through the pages he wrote in the console (the models in §1)
   and follow his development style: structure, naming, comments, patterns.
9. **The mascot** follows `MASCOT.md`: only through `MascotIllustration.vue`, never on money,
   security or counter-in-progress screens, and no made-up character before the reference exists.

## 1. Before you write anything

1. **Read `README.md` §3 and §4.** Work on the next milestone only. An idea that comes up
   mid-build goes to Kelvin as a note (parking lot), not into the code.
2. **Design before code.** Every screen is drawn first on the canvas "PaySol Business App"
   (https://claude.ai/artifact/2cp5tFETrgquzxVBXFWFyc) and approved by Kelvin. Build from the
   approved board, not from imagination.
3. **Read the page you are imitating, in full.** Until this app has its own pages, the models
   are the console's:

   | Building… | Copy the approach of (in `../Paysol.Admin/src`) |
   |---|---|
   | A list / table page | `pages/Banks/Banks.List.vue`, `pages/Team/Team.List.vue` |
   | A details panel opened from a row | `pages/Catalogue/components/ProductDetails.aside.vue`, `pages/Banks/components/BankDetails.aside.vue` |
   | An add / edit form | `pages/Banks/components/BankForm.modal.vue` (visible-ref pattern) |
   | A small add modal opened by `data-bs-target` | `pages/Products.POS/products.category.add.pos.vue` |
   | A confirm-with-reason modal | `pages/Team/DeactivateAdminModal.vue` |
   | A log / history list | `components/Data-tools/Activity.Days.vue` and `pages/ActivityLog/*` |
   | Sign-in screens | `pages/Authentication/*` |
   | The old counter screen (reference for flow only) | `pages/POSSALES/POS.mainpage.vue`, `SaveTabAside.vue` |

4. **Check the endpoint** in the backend (README / Postman / `php artisan route:list --path=api/v1/tenant`):
   envelope, filters, the role it needs. Do not invent fields or query parameters. If the API
   you need is not in `README.md` §8, it does not exist: stop and say so (it needs a brief).
5. **Kelvin edits files too.** Always work from the file on disk, never from an older copy,
   never undo a change of his. Check `git status` before you start.

---

## 2. Stack and commands

- Vue 3 `<script setup>`, Vite, Vue Router 4, Pinia, axios. Bootstrap 5 with the Skote classes.
- Icons: **Iconify** (`<Icon icon="…" />`): outline while idle, filled once selected or active;
  never the same icon for two different things on one screen. Flags are images, never emoji.
- Dates through `src/utils/dates.js` (dayjs); money through `src/utils/currency.js`. Never by hand.
- Node 18. Dev server on port 5175 (the console uses 5173).
- **No new npm package without asking Kelvin.**

```bash
npm run dev
npx vite build --outDir "$env:TEMP\paysol-tenant-build" --emptyOutDir   # check the build
```

Never build into or commit `dist/`. `.env` is never committed (`.env.example` is).

---

## 3. Where things go

```
src/
├── api/
│   ├── index.js              the ONE axios instance (base VITE_API_BASE_URL, token, 401 → sign in)
│   └── <area>.js             one module per backend area: auth.js, staff.js, stock.js,
│                             paymentMethods.js, legal.js… default export of named methods (StaffAPI.list())
├── components/               shared pieces (ported from the console where one exists, see §4)
├── composables/              useRole(), useBranch(), useDevice()…
├── layouts/
│   ├── ManageLayout.vue      BizSidebar + top bar (business switcher, branch picker, profile)
│   └── SellLayout.vue        full-screen counter shell (no sidebar)
├── nav/manageMenu.js         the Manage menu: label, to, icons (outline / filled), roles
├── pages/
│   ├── Auth/                 sign in, choose business, activation, counter PIN
│   ├── Manage/<Area>/        Home, Products, Stock, Staff, Branches, Settings, Reports…
│   │   ├── <Area>.List.vue
│   │   ├── components/       *.aside.vue, *.modal.vue only this area uses
│   │   └── helpers/          labels and rules shared by the area
│   └── Sell/                 Counter.vue, Tabs, Payment, Shift…
├── router/index.js           every route has meta { requiresAuth, mode: 'manage'|'sell', roles, title }
├── stores/                   Pinia: auth (person, business, role, branch scope), device, cart
└── utils/
```

**Naming** (same as the console): pages `Area.Action.vue` (`Staff.List.vue`), panels
`*.aside.vue`, modals `*.modal.vue`, API modules `XxxAPI`.

---

## 4. Reuse, don't rebuild

The console already has these. **Copy them into this repo once** (same name, same props), note
the source path in the file's header comment, and from then on reuse the local copy:

| Need | Console source |
|---|---|
| Loading placeholders | `components/Loaders/SkeletonLoader.vue` |
| Toast | `components/ImageToast.vue` |
| Searchable select | `components/SelectSearchBox.vue` |
| Confirm a risky action | `components/ConfirmActionModal.vue` |
| Ticked-rows bar | `components/Data-tools/Selection.Actions.bar.vue` |
| View switcher | `components/Data-tools/Data.View.Toggle.vue` |
| Date range | `components/DatePickers/datePicker.facebookstyle.vue` |
| A trail of activity | `components/Data-tools/Activity.Days.vue` |
| Number cards, bars, trend chart | `components/Data-tools/Metric.Card.vue`, `Breakdown.Bars.vue`, `Charts/Trend.Compare.chart.vue` |
| Unsaved changes guard | `components/guards/UnsavedChangesConfirm.vue` |
| Image pick + crop | `components/ImageUploader.vue` |
| Reusable CSS | `assets/css/custom.css` (the numbered "reusable pieces" sections) |
| Dates, money | `utils/dates.js`, `utils/currency.js` |

Do not import across projects with relative paths (`../../Paysol.Admin/...`): each app builds alone.

---

## 5. Look

**Manage: the admin console's look** (Kelvin, 11 Nov 2026, rule 0.1). Start from the console's
theme files and `custom.css` (copied in at scaffold time), its layout (sidebar, header, page
title box, cards), and its components. The "Evergreen" look drawn on the business-app canvas is
**not** used; the boards there are read for content and layout only. Colours come from the theme
variables, never inline.

**Sell** (to be designed, in the same look): full screen, touch first (tap targets at least
48 px), the cart always visible, the total big, one tap to the most common payment. Works on a
tablet first, then phone and desktop.

**CSS order** (console rule): Bootstrap / Skote classes → classes the project already has →
a new reusable look goes into `custom.css` as a numbered, commented section → scoped styles only
for what one component alone needs. **Bars are square** (no rounded ends).

**Buttons:** `btn btn-primary` for the one main action; `btn btn-white` for secondary actions;
`btn-sm` in table rows and modal bodies; Save and modal footer buttons regular size.

---

## 6. Code style

**Always comment** (Kelvin's standing rule): the *why* and the behaviour a reader couldn't guess.

- Top of every `<script setup>`: what the screen is, which endpoints it reads and writes, which
  roles each needs, which page it was modelled on.
- In the template: an HTML comment above every block (`<!-- Toolbar -->`, `<!-- Cart -->`…).
- Imports grouped `// API`, `// Components`, `// Utils`; state grouped and labelled
  (`// Page state`, `// Data`, `// Filters`…); functions in sections (`// ---- Fetch staff ----`).
- `ref` for state, `computed` for anything derived, `reactive` only for a form object.
- `async / await` with `try / catch / finally`; the `finally` clears the loading flag;
  `console.error('Error fetching staff:', error)` then a toast a person can understand.
- 4-space indent in `.vue` files. No commented-out dead code. Never delete Kelvin's comments.

---

## 7. Patterns

- **Loading: always the placeholder loader.** Anything waiting on the API shows `SkeletonLoader`
  shapes like what will arrive. No spinners, "Loading…" or dashes for content; a spinner only on
  a button running its own action. A failed request is never shown as a zero.
- **Lists:** title box with header buttons; toolbar (refresh, debounced search, filters that fold
  into one button on phones, Columns); "Showing X of Y"; table on tablets and up, cards on phones;
  **every table sorts by its headers** (paged lists ask the API again); empty state; load more.
- **Panels and modals:** as the console (`AGENTS.md` §6.2, §6.3). Children emit `toast` / `error`;
  the page owns the toast.
- **Errors:** 422 → the first message under each field; 403 → say what role is needed;
  429 on sign-in → show the `retry_after` wait; anything else → the API's `message`.
- **Changes that save straight away** change the screen only after the API confirms.
- **Roles:** routes carry `meta.roles`; the menu and buttons hide what the role can't use; the
  backend still decides, so a 403 is always handled. Branch-scoped people only see their branches.
- **Phone first for Manage:** owners check from their phones. Check every screen at 375 px.
- **Every new component or reusable look gets a card on `/test-page`** (sample data only, no API).

## 8. Selling and money rules (Sell mode)

- **Prices come from the server.** The till never sends its own price; a changed price is an
  override with a reason and a manager's approval.
- **Every sale carries an `Idempotency-Key`** (made once per sale on the device). A retry after a
  network error sends the same key, so the sale is never recorded twice and never lost.
- **Never do money in floating point.** Totals come from the API; display with `utils/currency.js`.
- **Voids, discounts, price changes, selling below recorded stock** need a manager's PIN on the
  spot (Proposed); the approval is recorded with both people.
- M-Pesa shows **confirmed by Safaricom** vs **entered by hand**, always distinguishable.
- Nothing but the session token and the device registration goes into browser storage; wrap
  storage reads and writes in `try / catch`.
- Offline selling: **not decided yet** (README §3). Don't build a queue until Kelvin decides.

---

## 9. Documentation: every session that changes this app

1. **`README.md`** (Kelvin: "always update the README"):
   - §3 "Where we are" and §4 milestones' status;
   - §7 "What's built": page, route, mode, file, API module, roles; shared pieces;
   - §8: tick **Used** and name the page(s) for every endpoint a screen now calls; add rows for
     any new backend endpoint; update the totals line;
   - §9: move an API to §8 once the backend has it; link its brief;
   - §10: a dated changelog entry at the top (what changed, files, endpoints).
2. **If the backend changed:** its README changelog, `docs/PROJECT-GUIDE.md` and the Postman
   collection are updated together (all three or none), per the backend's `AGENTS.md`.
3. **Kelvin's project files** (`claude/04-status.md`, `02-decisions-log.md`, `03-parking-lot.md`)
   are updated by Claude in the "Paysol POS API" project. Other agents: leave a short note at
   the end of your changelog entry saying what was decided and what was left open.

## 10. Don't

- Don't add a package, a CSS framework or another icon set without asking.
- Don't create a second axios instance or call `fetch` directly.
- Don't format dates or money by hand; don't compute money in floats.
- Don't build a screen without an approved board, or call an endpoint that isn't in README §8.
- Don't copy a block from the console and leave its old labels, ids or comments.
- Don't hide a backend refusal: if the API says no, the person sees why.
- Don't commit or push unless Kelvin asks.

## 11. Done means

- [ ] Built from the approved canvas board, modelled on the page in §1, and it looks like it.
- [ ] Comments: script header block, template block comments, labelled imports, state and functions.
- [ ] Shared components reused (§4); nothing duplicated.
- [ ] Route with `meta` (mode, roles); menu item with roles if it is a Manage page.
- [ ] Skeletons, empty state, 403 / 422 / 429 handling, toasts.
- [ ] Tables sort by their headers; works at 375 px (and on a tablet for Sell).
- [ ] A `/test-page` card for each new component or reusable look.
- [ ] `npx vite build` into a temp folder passes.
- [ ] Same look as the admin console; Bootstrap / Skote classes first; new styles in `custom.css`.
- [ ] Repeated markup turned into components.
- [ ] §12 "APIs used" below updated (and `README.md` §8 ticks and totals).
- [ ] `README.md` updated (§3, §4, §7, §8 ticks and totals, §9, §10 changelog).
- [ ] Backend docs and Postman updated if an endpoint was added or changed.

---

## 12. APIs used by this app

Every backend endpoint a screen calls. **Update this table in the same change that adds or
removes a call** (Kelvin's rule 0.6), and keep `README.md` §8 in step. The full list of what
the backend offers, used or not, is `README.md` §8; what is still missing is §9.

| Method | Endpoint | `src/api` method | Page(s) / component(s) | Roles |
|---|---|---|---|---|
| POST | `/auth/login` | `auth.login` | `Auth.login.vue` | public |
| POST | `/auth/select-tenant` | `auth.selectTenant` | `Auth.chooseBusiness.vue` | picker token |
| POST | `/auth/switch-tenant` | `auth.switchTenant` | `layouts/Sidebar.vue` (business switcher) | signed in |
| GET | `/tenant/search` | `search.search` | `layouts/Header.vue` (GlobalSearch), `pages/Search/Search.Results.vue` | any (role scoped) |
| GET | `/tenant/search/feedback/options` | `search.feedbackOptions` | `pages/Search/components/SearchFeedback.modal.vue` | any |
| POST | `/tenant/search/feedback` | `search.sendFeedback` | `pages/Search/components/SearchFeedback.modal.vue` | any |
| GET | `/auth/me` | `auth.me` | `composables/useSessionStart.js`, `pages/Home/Home.vue`, `composables/useAutoLogout.js` | signed in |
| POST | `/auth/logout` | `auth.logout` | `layouts/Header.vue`, `composables/useAutoLogout.js` | signed in |
| POST | `/auth/setup/verify-code` | `auth.verifySetupCode` | `Auth.activate.vue` | public |
| POST | `/auth/setup/set-password` | `auth.setPassword` | `Auth.activate.vue` | setup token |
| GET | `/tenant/legal/pending` | `legal.pending` | `components/legal/LegalPrompt.vue` | any |
| POST | `/tenant/legal/accept` | `legal.accept` | `components/legal/LegalPrompt.vue` | any |
| GET | `/geo/locate` | `geography.locate` | `pages/Branches/components/BranchForm.modal.vue` | public / any |
| GET | `/tenant/activity` | `activity.list` | `pages/ActivityLog/ActivityLog.List.vue` | owner, manager |
| GET | `/tenant/branches` | `branches.list` | `pages/Branches/Branches.List.vue`, Staff.List, Staff.Add, Staff.Details, Products.Add, Stock.List | any |
| GET | `/tenant/branches/{id}` | `branches.get` | `pages/Branches/components/BranchDetails.aside.vue` | any |
| POST | `/tenant/branches` | `branches.create` | `pages/Branches/components/BranchForm.modal.vue` | owner, manager |
| PATCH | `/tenant/branches/{id}` | `branches.update` | `pages/Branches/components/BranchForm.modal.vue`, `BranchDetails.aside.vue` | owner, manager |
| POST | `/tenant/branches/{id}/set-main` | `branches.setMain` | `pages/Branches/Branches.List.vue`, `BranchDetails.aside.vue` | owner, manager |
| DELETE | `/tenant/branches/{id}` | `branches.delete` | `pages/Branches/Branches.List.vue`, `BranchDetails.aside.vue` | owner, manager |
| GET | `/tenant/products` | `products.list` | `pages/Products/Products.List.vue` | any (page: owner, manager) |
| GET | `/tenant/products/{id}` | `products.get` | `Products.List.vue` (product modal) | any (page: owner, manager) |
| GET | `/tenant/products/categories` | `products.categories` | `pages/Products/Products.Add.vue` | any |
| GET | `/tenant/products/lookup` | `products.lookup` | `pages/Products/components/Barcode.Lookup.vue` | owner, manager |
| POST | `/tenant/products` | `products.create` | `Products.Add.vue` | owner, manager |
| PATCH | `/tenant/products/{id}` | `products.update` | `Products.List.vue` (Stop / Start selling) | owner, manager |
| POST | `/tenant/products/{id}/image` | `products.uploadImage` | `Products.Add.vue`, `Products.List.vue` (product modal) | owner, manager |
| GET | `/tenant/staff` | `staff.list` | `pages/Staff/Staff.List.vue` | owner, manager |
| POST | `/tenant/staff` | `staff.create` | `pages/Staff/Staff.Add.vue` | owner, manager |
| GET | `/tenant/staff/{id}` | `staff.get` | `pages/Staff/Staff.Details.vue` | owner, manager |
| PATCH | `/tenant/staff/{id}` | `staff.update` | `Staff.Details.vue` (Role & access) | owner, manager |
| POST | `/tenant/staff/{id}/suspend` · `/reactivate` | `staff.suspend`, `staff.reactivate` | `pages/Staff/components/StaffAction.modal.vue` | owner, manager |
| DELETE | `/tenant/staff/{id}` | `staff.remove` | `StaffAction.modal.vue` | owner, manager |
| GET | `/tenant/activity/{event}` | `activity.get` | `ActivityLog.List.vue` → `ActivityEvent.aside.vue` (`:fetcher`) | owner, manager |
| GET | `/tenant/stock` | `stock.list` | `pages/Stock/Stock.List.vue` | any (page: owner, manager) |
| GET | `/tenant/stock/{productId}` | `stock.get` | `pages/Stock/components/StockHistory.aside.vue` | any (page: owner, manager) |
| GET | `/tenant/stock/movements` | `stock.movements` | `pages/Stock/StockMovements.List.vue`, `StockReceive.List.vue`, `StockAdjustments.List.vue` | owner, manager |
| GET | `/tenant/stock/transfers` | `stock.transfers` | `pages/Stock/StockTransfers.List.vue` | owner, manager |
| POST | `/tenant/stock/transfers` | `stock.dispatchTransfer` | `pages/Stock/components/StockTransferDispatch.modal.vue` | owner, manager |
| POST | `/tenant/stock/transfers/{id}/receive` | `stock.receiveTransfer` | `pages/Stock/components/StockTransferReceive.modal.vue` | owner, manager |
| POST | `/tenant/stock/adjust` | `stock.adjust` | `pages/Stock/components/StockAdjust.modal.vue`, `StockAdjustments.List.vue` | owner, manager |
| POST | `/tenant/stock/receive` | `stock.receive` | `pages/Stock/components/StockReceive.modal.vue` | owner, manager |
| PATCH | `/tenant/stock/{productId}/reorder-point` | `stock.setReorderPoint` | `pages/Stock/components/ReorderPoint.modal.vue` | owner, manager |
| POST | `/tenant/stock/reorder-suggestions/accept` | `stock.acceptSuggestions` | `pages/Stock/Stock.List.vue` | owner, manager |
| POST | `/tenant/stock/reorder-suggestions/refresh` | `stock.refreshSuggestions` | `pages/Stock/Stock.List.vue` | owner, manager |
| GET | `/tenant/suppliers` | `suppliers.list` | `pages/Suppliers/Suppliers.List.vue`, `StockReceive.modal.vue` | any (page: owner, manager) |
| POST | `/tenant/suppliers` | `suppliers.create` | `pages/Suppliers/components/SupplierForm.modal.vue` | owner, manager |
| GET | `/tenant/suppliers/{id}` | `suppliers.get` | `pages/Suppliers/components/SupplierDetails.aside.vue` | any (page: owner, manager) |
| PATCH | `/tenant/suppliers/{id}` | `suppliers.update` | `pages/Suppliers/components/SupplierForm.modal.vue` | owner, manager |
| DELETE | `/tenant/suppliers/{id}` | `suppliers.remove` | `pages/Suppliers/Suppliers.List.vue` | owner, manager |
| GET | `/tenant/shifts/current` | `shifts.current` | `components/Shifts/HeaderShiftWidget.vue`, `components/Shifts/ShiftActionModal.vue` | any |
| POST | `/tenant/shifts/open` | `shifts.open` | `components/Shifts/ShiftActionModal.vue` | any |
| POST | `/tenant/shifts/{id}/join` | `shifts.join` | `components/Shifts/ShiftActionModal.vue` | any |
| GET | `/tenant/shifts` | `shifts.list` | `pages/Shifts/Shifts.List.vue` | any |
| GET | `/tenant/shifts/{id}` | `shifts.get` | `components/Shifts/ShiftActionModal.vue`, `pages/Shifts/Shifts.List.vue` | any |
| GET | `/tenant/tabs` | `tabs.list` | `pages/Sell/Tabs.List.vue`, `pages/Sell/components/SaveTabAside.vue` | owner, manager, cashier, waiter |
| POST | `/tenant/tabs` | `tabs.open` | `pages/Sell/components/SaveTabAside.vue` | owner, manager, cashier, waiter |
| POST | `/tenant/tabs/{id}/items` | `tabs.addItems` | `pages/Sell/components/SaveTabAside.vue` | owner, manager, cashier, waiter |
| POST | `/tenant/tabs/{id}/payments` | `tabs.recordPayment` | `pages/Sell/Tabs.List.vue` | owner, manager, cashier, waiter |
| POST | `/tenant/tabs/{id}/split` | `tabs.split` | `pages/Sell/Tabs.List.vue` | owner, manager, cashier, waiter |
| POST | `/tenant/tabs/{id}/merge` | `tabs.merge` | `pages/Sell/Tabs.List.vue` | owner, manager, cashier, waiter |

## 13. `_admin_leftovers/` (11 Nov 2026)

The admin console was copied in and converted. Everything admin-only (pages, `src/api` modules,
the admin menu, global search, notifications, geography selects, old layouts and docs) was moved
to `_admin_leftovers/` with the same folder structure. It is git-ignored and never imported.
Use it to look up how the console did something; when a piece is needed here, move it back into
`src/`, point it at a tenant endpoint, and give it a Test Page card. Delete the folder once Kelvin agrees.
