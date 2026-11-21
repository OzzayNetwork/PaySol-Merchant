import { tenantClient } from "./index";

/**
 * The business's own activity log (Tenant\ActivityController, 11 Nov 2026).
 * Owner or manager only (403 for other roles).
 *
 *   list(params)  GET /tenant/activity
 *       params: kind (business | products | sales | staff | payments | settings |
 *               subscription | signins | setup), actor (team | business | system |
 *               user:ID), q, from, to (YYYY-MM-DD), page, per_page (max 100)
 *       -> { data: [{ id, event_id, at, kind, key, who, who_type, who_filter,
 *                     who_role, verb, what, changes, result, reason, device,
 *                     ip_address, location, request_id }],
 *            meta: { total, per_page, current_page, last_page, all, kinds,
 *                    summary: { since, by_kind, people }, kept_months } }
 *       The PaySol team shows as "PaySol team" with no device or address.
 *
 *   get(eventId)  GET /tenant/activity/{event}
 *       -> { data: <the shared event panel's shape> } (404 outside this business)
 */
export default {
  list(params = {}) {
    return tenantClient.get("/activity", { params });
  },

  get(eventId) {
    return tenantClient.get(`/activity/${eventId}`);
  },
};
