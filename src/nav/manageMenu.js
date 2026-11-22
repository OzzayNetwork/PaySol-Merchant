/**
 * The business app's sidebar: the single source of truth for the menu.
 *
 * SHAPE OF AN ENTRY (same as the admin console's adminMenu.js)
 *
 *   Leaf    { label, to, icon, iconActive, roles, soon?, otherLinks? }
 *   Group   { label, icon, iconActive, roles, children: [{ label, to, roles, soon? }] }
 *   Heading { heading: true, label, roles? }   → a menu-title divider
 *   Rule    { divider: true }
 *
 * `roles` is ANY-OF over the business roles: owner, manager, cashier, waiter.
 * It mirrors the backend's EnsureTenantRole on the endpoints the page calls,
 * so the menu never offers a page the API refuses. `roles: null` = any
 * signed-in person at this business. Roles for planned pages follow
 * README.md §2 (Proposed).
 *
 * `soon: true` (Kelvin, 12 Nov 2026: "Put all the possible links for now"):
 * the page is planned but not built. It shows greyed with a "Soon" tag and
 * does not navigate; `to` is the address it will have. Remove `soon` in the
 * same change that adds the route. Order follows README.md §4.
 *
 * Icons: Iconify, outline idle / filled when active, never one icon for two
 * meanings on the same screen.
 */

// Who sees what (README.md §2)
const EVERYONE = null
const SELLERS = ['owner', 'manager', 'cashier', 'waiter']
const SHIFT_TAKERS = ['owner', 'manager', 'cashier']
const MANAGERS = ['owner', 'manager']
const OWNER = ['owner']

export default [

  // ── Your business ───────────────────────────────────────────────────────

  { heading: true, label: 'Your business' },

  // Home: a welcome and setup progress today (GET /auth/me); the owner's
  // trust view (money check, needs a look, sales by hour) in milestone 12
  {
    label: 'Home',
    to: '/',
    icon: 'ri:home-5-line',
    iconActive: 'ri:home-5-fill',
    roles: EVERYONE,
  },

  // ── Selling (Sell mode, milestones 9–12) ────────────────────────────────

  { heading: true, label: 'Selling', roles: SELLERS },

  // The till: product grid, cart, payment (checkout S1)
  { label: 'Counter', to: '/sell', icon: 'ri:shopping-cart-2-line', iconActive: 'ri:shopping-cart-2-fill', roles: SELLERS, otherLinks: ['/sell'] },

  // Open bills: rounds, split and partial payments, handover (checkout S3)
  { label: 'Open Tabs', to: '/sell/tabs', icon: 'ri:file-list-3-line', iconActive: 'ri:file-list-3-fill', roles: SELLERS, soon: true },

  // Find and reprint a receipt
  { label: 'Receipts', to: '/sell/receipts', icon: 'ri:bill-line', iconActive: 'ri:bill-fill', roles: SELLERS, soon: true },

  // Counter shifts & cash sessions history (22 Nov 2026)
  { label: 'Counter Shifts', to: '/shifts', icon: 'ri:time-line', iconActive: 'ri:time-fill', roles: SHIFT_TAKERS, otherLinks: ['/shifts'] },

  // ── Money ───────────────────────────────────────────────────────────────

  { heading: true, label: 'Money', roles: MANAGERS },

  // Expected vs counted per shift; voids and overrides with who approved them
  { label: 'Money Check', to: '/money-check', icon: 'ri:scales-3-line', iconActive: 'ri:scales-3-fill', roles: MANAGERS, soon: true },

  // M-Pesa confirmed by Safaricom vs typed in by hand (checkout S4)
  { label: 'M-Pesa Payments', to: '/mpesa', icon: 'ri:smartphone-line', iconActive: 'ri:smartphone-fill', roles: MANAGERS, soon: true },

  // "How you get paid": tills, paybills, bank (API exists: /tenant/payment-methods)
  { label: 'How You Get Paid', to: '/payment-methods', icon: 'ri:bank-card-line', iconActive: 'ri:bank-card-fill', roles: MANAGERS },

  // ── Products & stock ────────────────────────────────────────────────────

  { heading: true, label: 'Products & stock', roles: MANAGERS },

  // The business's own list (12 Nov 2026): list, barcode-first add, packs, photo,
  // stop/start selling (/tenant/products). Lit on /products/add too.
  { label: 'Products & Prices', to: '/products', icon: 'ri:price-tag-3-line', iconActive: 'ri:price-tag-3-fill', roles: MANAGERS, otherLinks: ['/products'] },

  // Stock (API exists: /tenant/stock) - Activated 18 Nov 2026
  {
    label: 'Stock',
    icon: 'ri:archive-2-line',
    iconActive: 'ri:archive-2-fill',
    roles: MANAGERS,
    children: [
      { label: 'Stock Levels', to: '/stock', roles: MANAGERS },
      { label: 'Movements', to: '/stock/movements', roles: MANAGERS },
      { label: 'Receive Goods', to: '/stock/receive', roles: MANAGERS },
      { label: 'Counts & Adjustments', to: '/stock/adjust', roles: MANAGERS },
      { label: 'Transfers', to: '/stock/transfers', roles: MANAGERS },
    ],
  },

  // Suppliers (18 Nov 2026): vendor directory, delivery history, contact, payment terms
  { label: 'Suppliers', to: '/suppliers', icon: 'ri:truck-line', iconActive: 'ri:truck-fill', roles: MANAGERS, otherLinks: ['/suppliers'] },

  // ── People ──────────────────────────────────────────────────────────────

  { heading: true, label: 'People', roles: MANAGERS },

  // Staff (12 Nov 2026): list, add with role / branches / PIN, edit, suspend, reactivate,
  // remove (/tenant/staff, tenant.role:owner,manager). Lit on /staff/add and /staff/:id too.
  { label: 'Staff', to: '/staff', icon: 'ri:team-line', iconActive: 'ri:team-fill', roles: MANAGERS, otherLinks: ['/staff'] },

  // Counter devices registered to a branch, for PIN sign-in (API missing)
  { label: 'Counter Devices', to: '/devices', icon: 'ri:computer-line', iconActive: 'ri:computer-fill', roles: MANAGERS, soon: true },

  // ── Reports ─────────────────────────────────────────────────────────────

  { heading: true, label: 'Reports', roles: MANAGERS },

  {
    label: 'Reports',
    icon: 'ri:bar-chart-box-line',
    iconActive: 'ri:bar-chart-box-fill',
    roles: MANAGERS,
    children: [
      { label: 'Sales', to: '/reports/sales', roles: MANAGERS, soon: true },
      { label: 'Products', to: '/reports/products', roles: MANAGERS, soon: true },
      { label: 'Staff Performance', to: '/reports/staff', roles: MANAGERS, soon: true },
      { label: 'Z-Reports', to: '/reports/z', roles: MANAGERS, soon: true },
    ],
  },

  // ── Oversight ───────────────────────────────────────────────────────────

  { heading: true, label: 'Oversight', roles: MANAGERS },

  // Activity Log (11 Nov 2026): who did what in this business, from
  // GET /tenant/activity (tenant.role:owner,manager)
  {
    label: 'Activity Log',
    to: '/activity-log',
    icon: 'ri:history-line',
    iconActive: 'ri:history-fill',
    roles: MANAGERS,
  },

  // ── Business settings ───────────────────────────────────────────────────

  { heading: true, label: 'Business', roles: MANAGERS },

  // Branches (§5.2): physical outlets, counters & warehouses with independent stock
  { label: 'Branches', to: '/branches', icon: 'ri:store-2-line', iconActive: 'ri:store-2-fill', roles: MANAGERS, otherLinks: ['/branches'] },

  // Name, logo, KRA PIN, receipt header (§5.1)
  { label: 'Business Details', to: '/business', icon: 'ri:building-2-line', iconActive: 'ri:building-2-fill', roles: MANAGERS, otherLinks: ['/business'] },

  // The owner's plan and billing (API missing)
  { label: 'Plan & Billing', to: '/billing', icon: 'ri:vip-crown-2-line', iconActive: 'ri:vip-crown-2-fill', roles: OWNER, soon: true },

  { divider: true },

  // ── Development ─────────────────────────────────────────────────────────

  // The component reference page (AGENTS.md §7: every new component gets a card)
  {
    label: 'Test Page',
    to: '/test-page',
    icon: 'ri:flask-line',
    iconActive: 'ri:flask-fill',
    roles: MANAGERS,
  },

];
