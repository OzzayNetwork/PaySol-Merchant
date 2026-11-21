import { tenantClient } from "./index";

/**
 * The business's staff (StaffController, /api/v1/tenant/staff). Owner and manager only
 * (tenant.role:owner,manager); everyone else gets 403.
 *
 *   list(params)       GET    /staff   role, status (active|invited|suspended), user_status,
 *                                       search, sort_by (name|role|status|joined|last_seen),
 *                                       sort_order, page, per_page (≤100)
 *                      -> { data: [person], meta: { total, per_page, current_page, last_page,
 *                           counts: { total, active, invited, suspended, by_role: {owner, manager, cashier, waiter} } } }
 *   get(id)            GET    /staff/{id}
 *   create(body)       POST   /staff   { name, phone, email?, role (manager|cashier|waiter),
 *                                       branch_scope?: [branchId], pin? (4-6 digits) }
 *                                       With a PIN the person is active at once; without, "invited".
 *   update(id, body)   PATCH  /staff/{id}  { name?, email?, role?, branch_scope?, pin? }
 *                                       (the owner's role can't change)
 *   suspend(id)        POST   /staff/{id}/suspend     (not the owner)
 *   reactivate(id)     POST   /staff/{id}/reactivate
 *   remove(id)         DELETE /staff/{id}             (not the owner)
 *
 * person = { id (membership), user_id, name, phone, email, role, role_label, branch_scope,
 *            membership_status, membership_status_label, user_status, user_status_label,
 *            can_use_pin, last_seen_at, joined_at }
 */
export default {
  list(params = {}) {
    return tenantClient.get("/staff", { params });
  },
  get(id) {
    return tenantClient.get(`/staff/${id}`);
  },
  create(body) {
    return tenantClient.post("/staff", body);
  },
  update(id, body) {
    return tenantClient.patch(`/staff/${id}`, body);
  },
  suspend(id) {
    return tenantClient.post(`/staff/${id}/suspend`);
  },
  reactivate(id) {
    return tenantClient.post(`/staff/${id}/reactivate`);
  },
  remove(id) {
    return tenantClient.delete(`/staff/${id}`);
  },
};
