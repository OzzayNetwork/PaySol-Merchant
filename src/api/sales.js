import { tenantClient } from "./index";

/**
 * Tenant Sales Orders & Checkout API Client (22 Nov 2026).
 *
 *   create(data)        POST   /sales/orders
 *   list(params)        GET    /sales/orders
 *   get(id)             GET    /sales/orders/{id}
 */
export default {
  create(data) {
    return tenantClient.post("/sales/orders", data);
  },

  list(params = {}) {
    return tenantClient.get("/sales/orders", { params });
  },

  get(id) {
    return tenantClient.get(`/sales/orders/${id}`);
  },

  update(id, data) {
    return tenantClient.patch(`/sales/orders/${id}`, data);
  },
};
