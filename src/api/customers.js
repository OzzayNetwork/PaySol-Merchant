import { tenantClient } from "./index";

/**
 * Tenant Customers API Client (22 Nov 2026).
 *
 *   list(params)        GET    /customers?search=&risk_tier=
 *   create(data)        POST   /customers
 *   get(id)             GET    /customers/{id}
 */
export default {
  list(params = {}) {
    return tenantClient.get("/customers", { params });
  },

  create(data) {
    return tenantClient.post("/customers", data);
  },

  get(id) {
    return tenantClient.get(`/customers/${id}`);
  },
};
