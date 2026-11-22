import { tenantClient } from "./index";

/**
 * Tenant POS Tabs & Running Orders API Client (22 Nov 2026).
 */
export default {
  list(params = {}) {
    return tenantClient.get("/tabs", { params });
  },

  get(id) {
    return tenantClient.get(`/tabs/${id}`);
  },

  open(data) {
    return tenantClient.post("/tabs", data);
  },

  addItems(id, items) {
    return tenantClient.post(`/tabs/${id}/items`, { items });
  },

  voidItem(id, itemId, reason = null) {
    return tenantClient.delete(`/tabs/${id}/items/${itemId}`, {
      data: { reason },
    });
  },

  recordPayment(id, data) {
    return tenantClient.post(`/tabs/${id}/payments`, data);
  },

  settle(id, data = {}) {
    return tenantClient.post(`/tabs/${id}/settle`, data);
  },

  split(id, itemIds, newTabName = null) {
    return tenantClient.post(`/tabs/${id}/split`, {
      item_ids: itemIds,
      new_tab_name: newTabName,
    });
  },

  merge(id, targetTabId) {
    return tenantClient.post(`/tabs/${id}/merge`, {
      target_tab_id: targetTabId,
    });
  },
};
