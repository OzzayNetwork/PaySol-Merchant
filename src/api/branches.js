import { tenantClient } from "./index";

/**
 * Tenant Branches API Client (§5.2).
 *
 *   list(params)        GET    /branches?include_inactive=&search=
 *   get(id)             GET    /branches/{id}
 *   create(data)        POST   /branches
 *   update(id, data)    PATCH  /branches/{id}
 *   setMain(id)         POST   /branches/{id}/set-main
 *   delete(id)          DELETE /branches/{id}
 */
export default {
  list(params = {}) {
    return tenantClient.get("/branches", { params });
  },

  get(id) {
    return tenantClient.get(`/branches/${id}`);
  },

  create(data) {
    return tenantClient.post("/branches", data);
  },

  update(id, data) {
    return tenantClient.patch(`/branches/${id}`, data);
  },

  setMain(id) {
    return tenantClient.post(`/branches/${id}/set-main`);
  },

  delete(id) {
    return tenantClient.delete(`/branches/${id}`);
  },
};
