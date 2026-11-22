// ---------------------------------------------------------------
// PaySol Business routes (11 Nov 2026).
//
// meta.requiresAuth  signed in to a business (a token scoped to one tenant)
// meta.roles         ANY-OF owner | manager | cashier | waiter; leave it out
//                    for every role. Mirrors src/nav/manageMenu.js; the
//                    backend's EnsureTenantRole is still the authority.
// meta.layout 'none' a bare page (sign-in, activation, choose business)
// ---------------------------------------------------------------
import { createRouter, createWebHistory } from "vue-router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useAuthStore } from "@/stores/auth";

// Login stays eager so the sign-in screen paints at once on a cold start;
// every other page is lazy-loaded so Vite splits them into chunks.
import Login from "@/pages/Authentication/Auth.login.vue";

// Signing in
const ChooseBusiness = () => import("@/pages/Authentication/Auth.chooseBusiness.vue");
const Activate = () => import("@/pages/Authentication/Auth.activate.vue");

// Pages
const Home = () => import("@/pages/Home/Home.vue");
const ActivityLogList = () => import("@/pages/ActivityLog/ActivityLog.List.vue");
const TestPage = () => import("@/components/testing.vue");
// People › Staff (12 Nov 2026)
const StaffList = () => import("@/pages/Staff/Staff.List.vue");
const StaffAdd = () => import("@/pages/Staff/Staff.Add.vue");
const StaffDetails = () => import("@/pages/Staff/Staff.Details.vue");
// Products & stock › Products & Prices (12 Nov 2026)
const ProductsList = () => import("@/pages/Products/Products.List.vue");
const ProductsAdd = () => import("@/pages/Products/Products.Add.vue");
// Products & stock › Stock & Inventory (18 Nov 2026)
const StockList = () => import("@/pages/Stock/Stock.List.vue");
const StockMovementsList = () => import("@/pages/Stock/StockMovements.List.vue");
const StockTransfersList = () => import("@/pages/Stock/StockTransfers.List.vue");
const StockAdjustmentsList = () => import("@/pages/Stock/StockAdjustments.List.vue");
const StockReceiveList = () => import("@/pages/Stock/StockReceive.List.vue");
// Products & stock › Suppliers (18 Nov 2026)
const SuppliersList = () => import("@/pages/Suppliers/Suppliers.List.vue");
// Business › Branches (§5.2)
const BranchesList = () => import("@/pages/Branches/Branches.List.vue");
// Business › Business Details (§5.1)
const BusinessDetails = () => import("@/pages/Business/Business.Details.vue");
// Money › How You Get Paid (§10.2)
const PaymentMethodsList = () => import("@/pages/PaymentMethods/PaymentMethods.List.vue");
// Selling › Register Shifts & History (22 Nov 2026)
const ShiftsList = () => import("@/pages/Shifts/Shifts.List.vue");

// Error pages
const SearchResults = () => import("@/pages/Search/Search.Results.vue");
const NotFound404 = () => import("@/pages/ErrorPages/NotFound404.vue");
const Forbidden403 = () => import("@/pages/ErrorPages/Forbidden403.vue");

// Pages that make sense only while signed out
const SIGNED_OUT_ONLY = ["/login", "/choose-business", "/activate", "/setup"];

const routes = [
  // ---- Signing in ----
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { layout: "none", title: "Sign in" },
  },
  // More than one business: pick one (the picker token travels in history.state, never the URL)
  {
    path: "/choose-business",
    name: "ChooseBusiness",
    component: ChooseBusiness,
    meta: { layout: "none", title: "Choose a business" },
  },
  // First time: the code PaySol sent, then a password (and an optional PIN). ?login= pre-fills
  {
    path: "/activate",
    name: "Activate",
    component: Activate,
    meta: { layout: "none", title: "Activate your account" },
  },

  // The backend's setup SMS and email link to /setup?phone=… (TENANT_APP_URL/setup); same page
  { path: "/setup", redirect: (to) => ({ path: "/activate", query: to.query }) },

  // ---- Your business ----
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: { requiresAuth: true, title: "Home" },
  },

  // ---- Selling (owner, manager, cashier) › Register Shifts & History ----
  {
    path: "/shifts",
    name: "ShiftsList",
    component: ShiftsList,
    meta: { requiresAuth: true, roles: ["owner", "manager", "cashier"], title: "Register Shifts" },
  },

  // ---- People (owner, manager): /tenant/staff is tenant.role:owner,manager ----
  {
    path: "/staff",
    name: "StaffList",
    component: StaffList,
    meta: { requiresAuth: true, roles: ["owner", "manager"], title: "Staff" },
  },
  // Order /staff/add before /staff/:id
  {
    path: "/staff/add",
    name: "StaffAdd",
    component: StaffAdd,
    meta: { requiresAuth: true, roles: ["owner", "manager"], title: "Add Staff" },
  },
  // One person; ?do=edit opens the form
  {
    path: "/staff/:id(\\d+)",
    name: "StaffDetails",
    component: StaffDetails,
    meta: { requiresAuth: true, roles: ["owner", "manager"], title: "Staff Member" },
  },

  // ---- Products & stock (owner, manager) ----
  // Reading /tenant/products is open to any role (the counter needs it), but the
  // page is a management page, so it follows the menu. Adding is owner/manager in the API.
  {
    path: "/products",
    name: "ProductsList",
    component: ProductsList,
    meta: { requiresAuth: true, roles: ["owner", "manager"], title: "Products & Prices" },
  },
  {
    path: "/products/add",
    name: "ProductsAdd",
    component: ProductsAdd,
    meta: { requiresAuth: true, roles: ["owner", "manager"], title: "Add Product" },
  },
  // Stock & Inventory (18 Nov 2026): GET /tenant/stock
  {
    path: "/stock",
    name: "StockList",
    component: StockList,
    meta: { requiresAuth: true, roles: ["owner", "manager"], title: "Stock & Inventory" },
  },
  {
    path: "/stock/movements",
    name: "StockMovementsList",
    component: StockMovementsList,
    meta: { requiresAuth: true, roles: ["owner", "manager"], title: "Stock Movements" },
  },
  {
    path: "/stock/receive",
    name: "StockReceiveList",
    component: StockReceiveList,
    meta: { requiresAuth: true, roles: ["owner", "manager"], title: "Receive Deliveries" },
  },
  {
    path: "/stock/adjust",
    name: "StockAdjustmentsList",
    component: StockAdjustmentsList,
    meta: { requiresAuth: true, roles: ["owner", "manager"], title: "Counts & Adjustments" },
  },
  {
    path: "/stock/transfers",
    name: "StockTransfersList",
    component: StockTransfersList,
    meta: { requiresAuth: true, roles: ["owner", "manager"], title: "Stock Transfers" },
  },
  {
    path: "/suppliers",
    name: "SuppliersList",
    component: SuppliersList,
    meta: { requiresAuth: true, roles: ["owner", "manager"], title: "Suppliers" },
  },
  // ---- Business › Branches (§5.2) ----
  {
    path: "/branches",
    name: "BranchesList",
    component: BranchesList,
    meta: { requiresAuth: true, roles: ["owner", "manager"], title: "Branches" },
  },
  // ---- Business › Details (§5.1) ----
  {
    path: "/business",
    name: "BusinessDetails",
    component: BusinessDetails,
    meta: { requiresAuth: true, roles: ["owner", "manager"], title: "Business Details" },
  },
  // ---- Money › How You Get Paid (§10.2) ----
  {
    path: "/payment-methods",
    name: "PaymentMethodsList",
    component: PaymentMethodsList,
    meta: { requiresAuth: true, roles: ["owner", "manager"], title: "How You Get Paid" },
  },

  // ---- Invoices Templates (§6) ----
  {
    path: "/invoice/:id?",
    name: "InvoiceTemplatesContainer",
    component: () => import("@/pages/Invoices/sigleInvoicesTemplates/Invoices.Templates.container.vue"),
    meta: { layout: "none", requiresAuth: false, title: "Invoice Preview & Templates" },
  },
  {
    path: "/invoices/templates",
    name: "InvoiceTemplatesGallery",
    component: () => import("@/pages/Invoices/sigleInvoicesTemplates/Invoices.Templates.container.vue"),
    meta: { layout: "none", requiresAuth: false, title: "Invoice Templates Gallery" },
  },

  // ---- Oversight (owner, manager) ----
  // Everything that happened in the business: GET /tenant/activity
  {
    path: "/activity-log",
    name: "ActivityLog",
    component: ActivityLogList,
    meta: { requiresAuth: true, roles: ["owner", "manager"], title: "Activity Log" },
  },
  // Every reusable component, for reference (front-end rule 2)
  {
    path: "/test-page",
    name: "TestPage",
    component: TestPage,
    meta: { requiresAuth: true, roles: ["owner", "manager"], title: "Component Reference" },
  },

  // Universal search results across products, staff and activity (18 Nov 2026)
  {
    path: "/search",
    name: "SearchResults",
    component: SearchResults,
    meta: { requiresAuth: true, title: "Search Results" },
  },

  // ---- Errors ----
  {
    path: "/403",
    name: "Forbidden",
    component: Forbidden403,
    meta: { requiresAuth: true, title: "Not allowed" },
  },
  // Catch-all, must be last
  {
    path: "/:catchAll(.*)",
    name: "NotFound",
    component: NotFound404,
    meta: { title: "Page not found" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// The one navigation guard
router.beforeEach((to) => {
  NProgress.start();

  const authStore = useAuthStore();
  if (!authStore.isAuthenticated) {
    authStore.initFromLocalStorage();
  }

  // Signed out: to the sign-in page, coming back here afterwards
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      path: "/login",
      query: to.fullPath && to.fullPath !== "/" ? { redirect: to.fullPath } : undefined,
    };
  }

  // Signed in: no point showing sign-in pages
  if (SIGNED_OUT_ONLY.includes(to.path) && authStore.isAuthenticated) {
    return { path: "/" };
  }

  // Role check (ANY-OF)
  if (to.meta.roles && !authStore.hasRole(to.meta.roles)) {
    return { name: "Forbidden" };
  }

  return true;
});

router.afterEach((to) => {
  NProgress.done();

  const appName = "PaySol Business";
  document.title = to.meta.title ? `${to.meta.title} | ${appName}` : appName;
});

router.onError(() => {
  NProgress.done();
});

export default router;
