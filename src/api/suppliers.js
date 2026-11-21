/**
 * Suppliers API client (18 Nov 2026)
 *
 * Calls /api/v1/tenant/suppliers routes.
 * Roles: owner, manager (index/show open to tenant users).
 */
import { tenantClient } from "./index";

const SuppliersAPI = {
  /**
   * List suppliers with delivery stats and filters.
   * Params: { status: 'active'|'inactive'|'all', search, sort_by, sort_order, page, per_page }
   */
  list(params = {}) {
    return tenantClient.get("/suppliers", { params });
  },

  /**
   * One supplier profile and recent deliveries.
   */
  get(id) {
    return tenantClient.get(`/suppliers/${id}`);
  },

  /**
   * Register a new supplier.
   * Body: { name, contact_person, phone, email, address, tax_pin, payment_terms, notes }
   */
  create(payload) {
    return tenantClient.post("/suppliers", payload);
  },

  /**
   * Update supplier details or status.
   * Body: { name, contact_person, phone, email, address, tax_pin, payment_terms, notes, is_active }
   */
  update(id, payload) {
    return tenantClient.patch(`/suppliers/${id}`, payload);
  },

  /**
   * Soft-delete a supplier.
   */
  remove(id) {
    return tenantClient.delete(`/suppliers/${id}`);
  },
};

export default SuppliersAPI;
export { SuppliersAPI };
