import { tenantClient } from "./index";

/**
 * Tenant Payment Methods / Accounts API Client (§10.2).
 *
 *   list(params)        GET    /payment-methods?type=&category=&is_active=&branch_id=&search=
 *   options()           GET    /payment-methods/options
 *   get(id)             GET    /payment-methods/{id}
 *   create(data)        POST   /payment-methods
 *   update(id, data)    PATCH  /payment-methods/{id}
 *   setPrimary(id)      PATCH  /payment-methods/{id} with { is_primary: true }
 *   toggleActive(id, a) PATCH  /payment-methods/{id} with { is_active: a }
 *   delete(id)          DELETE /payment-methods/{id}
 */
export default {
  list(params = {}) {
    return tenantClient.get("/payment-methods", { params });
  },

  options() {
    return tenantClient.get("/payment-methods/options");
  },

  get(id) {
    return tenantClient.get(`/payment-methods/${id}`);
  },

  create(data) {
    return tenantClient.post("/payment-methods", data);
  },

  update(id, data) {
    return tenantClient.patch(`/payment-methods/${id}`, data);
  },

  setPrimary(id) {
    return tenantClient.patch(`/payment-methods/${id}`, { is_primary: true });
  },

  toggleActive(id, isActive) {
    return tenantClient.patch(`/payment-methods/${id}`, { is_active: isActive });
  },

  delete(id) {
    return tenantClient.delete(`/payment-methods/${id}`);
  },
};
