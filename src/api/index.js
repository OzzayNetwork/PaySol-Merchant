import axios from "axios";

/**
 * PaySol business app: API clients.
 *
 * Two instances, one token (the business's Sanctum token from sign-in):
 *
 *   apiClient    -> {base}/api/v1          sign-in (/auth/*) and public
 *                                           reference data (plans, legal, locations)
 *   tenantClient -> {base}/api/v1/tenant   everything inside a business: staff,
 *                                           stock, payment methods, legal, activity.
 *                                           The token decides WHICH business
 *                                           (EnsureTenantScope on the backend).
 *
 * Two clients so the call site shows which half it touches; never create a
 * third (AGENTS.md §10).
 */

const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1").replace(/\/+$/, "");
const TENANT_BASE = `${BASE}/tenant`;

function build(baseURL) {
  const client = axios.create({
    baseURL,
    // NOTE: no global Content-Type. Axios sets it per request automatically:
    //   - plain object  -> application/json
    //   - FormData      -> multipart/form-data; boundary=... (needed for file uploads)
    headers: {
      Accept: "application/json",
    },
    // A request that hangs is reported instead of spinning for ever
    timeout: 30000,
  });

  // Safety net: a FormData body must never carry a JSON content type,
  // so the browser can apply the multipart boundary itself.
  client.interceptors.request.use((config) => {
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
    return config;
  });

  return client;
}

export const apiClient = build(BASE);
export const tenantClient = build(TENANT_BASE);

/** Both clients, so a token or interceptor change only has to happen once. */
const clients = [apiClient, tenantClient];

// Sign-in and activation answer 401/422 for a wrong password or code: that
// belongs to the form on screen and must never trigger "session expired".
const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/setup/verify-code",
  "/auth/setup/set-password",
  "/auth/select-tenant",
  "/auth/logout",
];

let unauthorizedHandler = null;

/**
 * Register the callback for a 401 on a signed-in call (token expired or
 * revoked). Wired once in `main.js`, so this file never imports Pinia or the
 * router (no circular imports).
 */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

clients.forEach((client) =>
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && unauthorizedHandler) {
        const reqUrl = String(error.config?.url || "");
        const isPublicAuth = PUBLIC_AUTH_PATHS.some((p) => reqUrl.includes(p));
        if (!isPublicAuth) {
          unauthorizedHandler(error);
        }
      }
      return Promise.reject(error);
    }
  )
);

/** Set (or clear, with null) the Bearer token on both clients. */
export function setAuthToken(token) {
  clients.forEach((client) => {
    if (token) {
      client.defaults.headers["Authorization"] = `Bearer ${token}`;
    } else {
      delete client.defaults.headers["Authorization"];
    }
  });
}

/**
 * A one-off Bearer header for a short-lived token that must not replace the
 * session token: the picker token (choose a business) and the setup token
 * (activation). `apiClient.post(url, body, withToken(t))`.
 */
export function withToken(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export default apiClient;
