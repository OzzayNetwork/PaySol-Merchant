/**
 * Stock & Inventory API client (18 Nov 2026)
 *
 * Calls the backend's /api/v1/tenant/stock routes (EnsureTenantScope + EnsureTenantRole).
 * Roles: owner, manager (some list views open to cashier/waiter on counter).
 */
import { tenantClient } from "./index";

const StockAPI = {
  /**
   * List inventory balances per branch or overall.
   * When branch_id is passed, returns detailed branch stock rows with reorder points and suggestions.
   * Params: { branch_id, status, suggested, search, category_id, sort_by, sort_order, page, per_page }
   */
  list(params = {}) {
    return tenantClient.get("/stock", { params });
  },

  /**
   * One product: stock balances across all branches and latest 20 movements.
   */
  get(productId) {
    return tenantClient.get(`/stock/${productId}`);
  },

  /**
   * Immutable stock movements ledger.
   * Params: { branch_id, tenant_product_id, movement_type, date_from, date_to, page, per_page }
   */
  movements(params = {}) {
    return tenantClient.get("/stock/movements", { params });
  },

  /**
   * Inter-branch transfers list.
   * Params: { status, page, per_page }
   */
  transfers(params = {}) {
    return tenantClient.get("/stock/transfers", { params });
  },

  /**
   * Receive delivery from supplier.
   * Body: { branch_id, supplier_name, invoice_number, notes, items: [{ tenant_product_id, quantity, bonus_quantity, unit_cost, new_selling_price }] }
   */
  receive(payload) {
    return tenantClient.post("/stock/receive", payload);
  },

  /**
   * Quick stock adjustment (audit count, waste/spoilage, staff consumption).
   * Body: { branch_id, tenant_product_id, reason, quantity, is_physical_count, notes }
   */
  adjust(payload) {
    return tenantClient.post("/stock/adjust", payload);
  },

  /**
   * Batch stock adjustment for multiple products at a branch.
   * Body: { branch_id, reason, notes, items: [{ tenant_product_id, quantity, is_physical_count, reason, notes }] }
   */
  adjustBatch(payload) {
    return tenantClient.post("/stock/adjust-batch", payload);
  },

  /**
   * Get stock audit count sheet for all trackable products at a branch.
   * Params: { branch_id }
   */
  countSheet(params = {}) {
    return tenantClient.get("/stock/count-sheet", { params });
  },

  /**
   * Dispatch an inter-branch transfer.
   * Body: { source_branch_id, destination_branch_id, items: [{ tenant_product_id, quantity }], notes }
   */
  dispatchTransfer(payload) {
    return tenantClient.post("/stock/transfers", payload);
  },

  /**
   * Receive and complete an incoming transfer.
   * Body: { notes, received_items: { [productId]: quantity } }
   */
  receiveTransfer(id, payload = {}) {
    return tenantClient.post(`/stock/transfers/${id}/receive`, payload);
  },

  /**
   * Set (or clear with null) a product's reorder point at one branch.
   * Body: { branch_id, reorder_point }
   */
  setReorderPoint(productId, payload) {
    return tenantClient.patch(`/stock/${productId}/reorder-point`, payload);
  },

  /**
   * Accept the suggested reorder point for selected products at one branch.
   * Body: { branch_id, product_ids: string[] }
   */
  acceptSuggestions(payload) {
    return tenantClient.post("/stock/reorder-suggestions/accept", payload);
  },

  /**
   * Recalculate reorder suggestions now instead of waiting for nightly job.
   */
  refreshSuggestions() {
    return tenantClient.post("/stock/reorder-suggestions/refresh");
  },
};

export default StockAPI;
