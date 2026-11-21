import { apiClient, withToken } from "./index";

/**
 * Business sign-in and activation: /api/v1/auth/* (TenantAuthController).
 *
 * Sign in
 *   1. login         POST auth/login          { login, password | pin, tenant_id?, short_name? }
 *      -> { data: { user, tenant, token } }                          one business (or one asked for)
 *      -> { requires_tenant_selection: true,
 *           data: { user, picker_token, businesses: [...] } }        several: choose one
 *      422 status 'pending_setup' -> the person must activate first
 *      429 { retry_after } -> locked after 5 wrong tries in 15 minutes
 *   2. selectTenant  POST auth/select-tenant  { tenant_id }  with the picker token
 *      -> { data: { user, tenant, token } }
 *
 * Activation (owner or staff, from the welcome SMS / email code)
 *   1. verifySetupCode POST auth/setup/verify-code { phone | email, code (6 digits) }
 *      -> { data: { user, setup_token, businesses } }
 *   2. setPassword     POST auth/setup/set-password { password, password_confirmation, pin?, tenant_id? }
 *      with the setup token -> { data: { user, tenant, token } } (signed in)
 *
 * Signed in (session token, set by the auth store)
 *   me            GET  auth/me             -> { data: { user, tenant, membership, other_businesses } }
 *   switchTenant  POST auth/switch-tenant  { tenant_id } -> a new token for that business
 *   logout        POST auth/logout
 *
 * There is no password reset for business users yet (backend gap, README §9).
 */
export default {
  /**
   * Sign in with a phone (any format: 07…, +2547…) or an email, and a password
   * or a counter PIN. `tenant_id` / `short_name` skip the business picker.
   */
  login({ login, password, pin, tenant_id, short_name }) {
    const body = { login };
    if (pin) body.pin = pin;
    else body.password = password;
    if (tenant_id) body.tenant_id = tenant_id;
    if (short_name) body.short_name = short_name;
    return apiClient.post("/auth/login", body);
  },

  /** Choose a business with the 15-minute picker token from login(). */
  selectTenant(tenantId, pickerToken) {
    return apiClient.post("/auth/select-tenant", { tenant_id: tenantId }, withToken(pickerToken));
  },

  /** Swap the session for another business this person belongs to. */
  switchTenant(tenantId) {
    return apiClient.post("/auth/switch-tenant", { tenant_id: tenantId });
  },

  /** The person, the business the token is for, their role there, and their other businesses. */
  me() {
    return apiClient.get("/auth/me");
  },

  /** Revoke the current token (written to the business's activity as a sign-out). */
  logout() {
    return apiClient.post("/auth/logout");
  },

  /**
   * Activation step 1: the 6-digit code from the welcome SMS or email.
   * Give `phone` or `email`, whichever the code was sent to.
   */
  verifySetupCode({ phone, email, code }) {
    const body = { code };
    if (phone) body.phone = phone;
    else body.email = email;
    return apiClient.post("/auth/setup/verify-code", body);
  },

  /**
   * Activation step 2: the password (min 8, confirmed), and optionally a 4–6
   * digit counter PIN, with the 30-minute setup token. Signs the person in.
   */
  setPassword({ password, password_confirmation, pin, tenant_id }, setupToken) {
    const body = { password, password_confirmation };
    if (pin) body.pin = pin;
    if (tenant_id) body.tenant_id = tenant_id;
    return apiClient.post("/auth/setup/set-password", body, withToken(setupToken));
  },
};
