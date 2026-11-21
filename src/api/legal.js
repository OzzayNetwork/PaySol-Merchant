import { tenantClient } from "./index";

/**
 * Legal terms for the signed-in person at this business (TenantLegalController).
 *
 *   pending()  GET  /tenant/legal/pending
 *              -> { data: [{ key, name, version, summary, effective_at, blocking, public_url }] }
 *              blocking: true  = in force now, must accept to go on
 *              blocking: false = a scheduled change they may accept early
 *   accept()   POST /tenant/legal/accept  { accept: [{ key, version }] }   (20 a minute)
 *              -> { message, data: <what is still pending> }
 *
 * Any signed-in role. Counters keep selling whatever this says.
 */
export default {
  pending() {
    return tenantClient.get("/legal/pending");
  },

  /** @param {Array<{key: string, version: number}>} items */
  accept(items) {
    return tenantClient.post("/legal/accept", { accept: items });
  },
};
