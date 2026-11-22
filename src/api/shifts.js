import { tenantClient } from "./index";

/**
 * Tenant POS Shifts & Team Cash Sessions API Client (22 Nov 2026).
 *
 *   current(params)     GET    /shifts/current?branch_id=
 *   open(data)          POST   /shifts/open
 *   join(id)            POST   /shifts/{id}/join
 *   list(params)        GET    /shifts?branch_id=&status=&date_from=&date_to=
 *   get(id)             GET    /shifts/{id}
 */
export default {
  current(params = {}) {
    return tenantClient.get("/shifts/current", { params });
  },

  open(data) {
    return tenantClient.post("/shifts/open", data);
  },

  join(id) {
    return tenantClient.post(`/shifts/${id}/join`);
  },

  leave(id, data = {}) {
    return tenantClient.post(`/shifts/${id}/leave`, data);
  },

  close(id, data = {}) {
    return tenantClient.post(`/shifts/${id}/close`, data);
  },

  list(params = {}) {
    return tenantClient.get("/shifts", { params });
  },

  get(id) {
    return tenantClient.get(`/shifts/${id}`);
  },
};
