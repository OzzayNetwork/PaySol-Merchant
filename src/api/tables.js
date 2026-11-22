import { tenantClient } from "./index";

/**
 * Tenant POS Tables & Floor Management API Client (22 Nov 2026).
 */
export default {
  list(params = {}) {
    return tenantClient.get("/tables", { params });
  },

  sections(params = {}) {
    return tenantClient.get("/tables/sections", { params });
  },

  createSection(data) {
    return tenantClient.post("/tables/sections", data);
  },

  createTable(data) {
    return tenantClient.post("/tables", data);
  },

  updateTable(id, data) {
    return tenantClient.put(`/tables/${id}`, data);
  },

  updateStatus(id, status, notes = null) {
    return tenantClient.patch(`/tables/${id}/status`, { status, notes });
  },

  transfer(fromTableId, toTableId) {
    return tenantClient.post("/tables/transfer", {
      from_table_id: fromTableId,
      to_table_id: toTableId,
    });
  },
};
