# PaySol

> **Read this first.** What PaySol is, what it is for, how the projects fit together,
> and what this repository's part is. Last updated: 11 Nov 2026.

## This repository: the business app (Vue)

The app a business uses every day: **Sell** (the counter: registers, PIN sign-in,
sessions and shifts, sales, tabs, payments, receipts, closing) and **Manage** (the owner's
trust view, products and prices, stock, purchases, expenses, customers, staff, reports,
settings). One Vue project, two modes; each person's role decides what they see. §6 below
is the scope.

- **Stage (11 Nov 2026):** planning; no code yet. Boards on the canvas, awaiting review.
- **Rules:** `AGENTS.md`; status, milestones and API coverage in `README.md`.

---

## 1. What PaySol is

**Know your business without having to be there.**

PaySol is a cloud point-of-sale and business-control platform for Kenyan small and
medium businesses whose owners are not always at the counter. It starts with **bars and
wines & spirits**, then kinyozi and spa, supermarkets, pharmacies, restaurants, electronics
shops, butcheries, car washes and others.

It is **multi-tenant SaaS**: every business is a *tenant* with its own branches, staff,
products, stock and money. **Field agents** find businesses, onboard them and help them
go live. The PaySol team runs the platform from an admin console.

## 2. The problem (from the field)

Kelvin and his market partner spoke to owners, managers and staff. What they found:

1. **Owners don't have a system they trust.** When the owner is away, staff can sell
   their own stock on the premises and report no sales.
2. **Staff are blamed for "shorts"** when the owner can't confirm a payment (usually
   M-Pesa), so trust breaks on both sides.
3. **Existing systems are offline,** stuck on one shop computer. The owner has to be
   there to see anything.
4. **Some businesses want proper receipts.**
5. **Owners fear KRA tracking.** PaySol will not be built to hide sales; eTIMS is a
   per-business setting and compliance is sold as a benefit.

## 3. The wedge: a neutral record of trust

PaySol sits between an absent owner and the staff:

- **Payments confirmed by the system** (Safaricom's confirmation, not an SMS screenshot or
  a typed code) protect honest staff from unfair shorts, so staff want to use it.
- **Live numbers on the owner's phone** protect the owner.
- **Every shift, count, void, discount, price change and stock movement is tied to a
  person** (and an approver), so off-book selling shows up in the numbers.

**Competition.** About 20 SME POS products on KRA's eTIMS integrator list, and
MyAccurate Books (RWK Africa, KES 500 / 800 a month), an accounting-first product with a
capable POS: registers, devices, staff PINs, sessions with floats, shifts, blind closing,
variance approval, hold / resume, cash in / out. PaySol must match that and win on:

- **Tabs** (open bills, rounds, waiter handover, walkouts): how bars actually run;
- **the owner's trust view**: one place for money expected vs counted, confirmed vs typed
  M-Pesa, voids, variances and stock gaps, with alerts;
- **the shared barcode catalogue**: scan once and the product fills itself in (crates,
  bottles, tots);
- **a real audit trail** and an experience built for a phone and a busy counter.

## 4. The projects

| Project | Folder (Kelvin's machine) | GitHub | Who uses it | Address (planned) |
|---|---|---|---|---|
| **Backend API** (Laravel 12) | `C:\xampp\htdocs\Paysol-Laravel-Backend` | `OzzayNetwork/paysol-laravel-backend` | Every app below | `api.paysol.com/api/v1` |
| **Admin console** (Vue 3) | `…\Paysol Project\Paysol.Admin` | `OzzayNetwork/PaySol-Admin-Dashboard` | The PaySol team and field agents | `admin.paysol.com` |
| **Business app** (Vue 3) | `…\Paysol Project\PaySol.Tenant` | not created yet | A business's owner, managers, cashiers, waiters | `<shortname>.paysol.com` |
| **Public website** | `…\Paysol Project\PaySol.website` | not created yet | Anyone: prospects, customers | `paysol.com` |
| Android app | — | — | Counter and owner on Android | last milestone |
| Old POS API (plain PHP) | `C:\xampp\htdocs\pos-api` | `OzzayNetwork/Paysol-POS-APIs` | **Reference only** (how tabs, payments, loyalty and risk worked) | — |

`…` = `C:\My Projects\Levetot\Vue projects`.
**Local ports (fixed; every agent uses these):**

| Port | What | Set in |
|---|---|---|
| 8000 | Backend API (`php artisan serve`) | backend `APP_URL` |
| 5173 | Admin console (`npm run dev`) | Vite default; backend `ADMIN_CONSOLE_URL` |
| 5174 | Temporary preview proxy for browser testing (removed after each test) | `vite.tmp-preview.config.js` |
| 5175 | Business app (`npm run dev`, `strictPort`: fails if busy, never moves) | its `vite.config.js`; backend `TENANT_APP_URL` |
| 5176 | Public website (when it starts) | its `vite.config.js` |

## 5. How it fits together

- **One database, a tenant ID on every record,** isolation enforced in code and tests.
- **One person, one login, many businesses.** A person has memberships (business + role);
  with several businesses they pick one, and the token is issued for that business only.
- **Branches** of one business share products, staff and one dashboard; different
  businesses are separate tenants.
- **Counter devices are registered to a branch;** cashiers sign in there with a PIN.
- **Business roles:** owner, manager, cashier, waiter (stock keeper and accountant
  proposed). **Platform roles:** super admin, onboarding, support, finance, field agent.
- **Locations are structured** (county → constituency → ward → area) with GPS, for
  regional reports.
- **A shared product catalogue** (barcode, name, brand, category, size, photo) that every
  business's own products link to; the business sets price, tax and stock.
- **Plans:** Free (1 user, 1 branch), Standard and Gold (KES 500 / 800 a month, 30-day
  trial), Enterprise quoted. Prices VAT-inclusive.
- **Every log follows one audit standard:** who, what (before / after), when, where from,
  which request, result; kept 12 months.

## 6. What the business app does (the scope we are building)

**V1** = needed for the first paying bars. **V1.1** = right after. **Later** = planned, not now.

### Sell (the counter)
- **V1** Activate a device to a **register**; staff tap their name and enter a **PIN**.
- **V1** **Open a session** with an opening float, then a **shift**; selling stays locked until both are open.
- **V1** Product grid by category, search, **barcode scan**; cart; quantities; **tots / portions**.
- **V1** **Cash** (change due), **M-Pesa STK prompt confirmed by Safaricom**, **match an M-Pesa payment already received**, card / reference payment, **split payments**.
- **V1** **Tabs:** open by name or table, **add rounds**, split the bill, part-pay, **hand over to another waiter**, close; **walkout** written off with approval; payment deadline.
- **V1** **Hold and resume** a sale; **returns**; **voids, discounts and price changes need a manager's PIN** (both names recorded).
- **V1** **Cash in / out / drops**; petty cash paid from the till.
- **V1** **Receipts:** print (80 / 58 mm), reprint; **SMS / WhatsApp receipt link** (V1.1).
- **V1** **Close:** end shift, **blind cash count**, variance; beyond the tolerance it waits for a manager; **Z-report**.
- **V1** Every sale carries an idempotency key: never recorded twice, never lost; a stuck checkout can be recovered.
- **Later** Offline selling with a queue; Android counter app; kitchen / bar order tickets.

### Home (the owner's trust view)
- **V1** Today at a glance: sales, collected by method, **expected vs counted per shift**, **M-Pesa confirmed by Safaricom vs typed in**, open tabs, who is on shift.
- **V1** **"Needs a look":** unconfirmed payments, variances, voids and discounts, low stock, stock-take gaps, walkouts.
- **V1** Sales by hour, top sellers, branch picker; works on a phone.
- **V1.1** Alerts by push / SMS / email (a big variance, a void spree, a quiet night); a nightly digest; insights in plain words.
- **Later** Neighbourhood comparisons (aggregates only); an "ask your business" assistant.

### Products and prices
- **V1** Scan a barcode → filled in from the PaySol catalogue; own products; categories and the till's layout.
- **V1** Selling price (VAT-inclusive), **tax type with eTIMS codes** (A exempt, B 16%, C zero-rated, D non-VAT, E 8%), cost price.
- **V1** **Crate → bottle**, **tots / portions** with their own price; hide from the counter.
- **V1.1** Prices per branch; import / export (Excel); product photos; happy-hour prices.

### Stock
- **V1** Levels per branch; **receive goods** (with cost); **adjust with a reason**; movement ledger.
- **V1** **Staff drinks, breakages and waste** as recorded consumption, not zero-value sales.
- **V1** **Stock takes with blind counts** and variance per person / shift; low-stock levels.
- **V1.1** Transfers between branches as **requests with approval**; stock locations (counter vs store).

### Purchases and suppliers
- **V1.1** Suppliers; purchase orders; record a purchase (bill); pay a supplier; unpaid bills.
- **Later** Requests for quotation, debit notes.

### Expenses
- **V1** Expenses with categories and a receipt photo; petty cash from the till on the shift.
- **V1.1** Recurring expenses.

### Customers and credit
- **V1.1** Customers, categories, **credit for regulars with a limit**, balances, statements, collections, SMS reminders.
- **Later** Loyalty points; customer wallet.

### Money
- **V1** Payment accounts (M-Pesa till / paybill, cash, bank, card) with a default; all transactions by method.
- **V1.1** **M-Pesa statement reconciliation:** every payment matched to a sale or flagged.

### Staff and roles
- **V1** Add staff (role, branches, PIN by SMS), suspend, reactivate; extra permissions per person.
- **V1** Each person's activity (sales, voids, variances, approvals).
- **Later** Commissions (rates, tiers, payouts) for salons, spas and car washes; attendance.

### Reports
- **V1** Daily summary, **Z-report**, sales by item / hour / staff / branch, **voids, discounts and variances by person**, stock valuation and movements; export PDF / Excel / CSV.
- **V1.1** Profit and loss, debtors, cash flow, supplier balances.
- **Later** Full accounting (chart of accounts, journals, trial balance, balance sheet) as a Gold feature.

### Settings
- **V1** Business details (name, logo, KRA PIN, receipt header and footer); branches; **registers** (printer, paper width, copies, cash drawer, blind closing, variance tolerance, approvals); devices; tax types; payment accounts; legal terms; activity log.
- **V1.1** SMS sender (PaySol's or the business's own) and SMS credit; plan and billing; data export; account deletion request.

### Help
- **V1** Help on every page, WhatsApp support, a first-run checklist (add products → add staff → set up a register → first sale).
- **V1.1** Page tour; notices (product updates).

### Later, for other business types and growth
- **eTIMS** (become an approved integrator or partner; a setup fee per KRA PIN like the market), quotations and invoices, sales orders and deliveries, bookings and queues for salons and spas, an online storefront, the Android app.

## 7. Principles

- **Trust over features:** every money or stock change has a person, a reason and a trail.
- **Simple on the surface:** a business only sees what its type needs.
- **Design before code:** decisions are drawn on a canvas and agreed with Kelvin first.
- **Phone first for owners, touch first at the counter.**
- **Never a made-up number:** a value that isn't real yet says so.
- **Kelvin's style everywhere:** always comment code, reuse existing components, Iconify
  icons (outline idle, filled active), skeleton loaders, Bootstrap / Skote classes first.

## 8. Where the knowledge lives

- **Each repo's `README.md`** is the truth for what that repo has built; **`AGENTS.md`** says
  how to work in it. The backend's `docs/PROJECT-GUIDE.md` is the detailed design.
- **Kelvin's Claude project "Paysol POS API"** (`claude/` files) holds the working agreement,
  decisions log, parking lot, status, competitor notes and briefs.
- **Design canvases:** admin console https://claude.ai/artifact/BfWjM8MFg8YKcFqcRh6GoG and
  https://claude.ai/artifact/CQ3bmbQgvqDuRHHmVK6jAb; business app
  https://claude.ai/artifact/2cp5tFETrgquzxVBXFWFyc.
- **Brand mascot:** `MASCOT.md` (same file in every repo): Kelvin's creative brief (one character, 3D and 2D) and how it applies here: where it never appears (money and security screens), where it goes first, one `MascotIllustration` component, formats, and **no invented character until the reference artwork exists**.
- **This file is the same in every repo** except "This repository" at the top. Change §1–§8
  in all copies together.
