// ---------------------------------------------------------------
// useSessionStart: the one way a sign-in finishes in the business app.
//
// Every route into a session (login, choosing a business, activation,
// switching business) ends with a { user, tenant, token } answer. This saves
// it, fills in the rest from GET /auth/me (status, setup progress, the other
// businesses for "Switch business"), and goes to where the person was headed.
// The legal-terms prompt (components/legal/LegalPrompt.vue) runs by itself
// once the signed-in layout mounts.
// ---------------------------------------------------------------

// API
import authApi from "@/api/auth";
// Stores
import { useAuthStore } from "@/stores/auth";

/** Only internal paths are allowed as a redirect ("//evil.com" is not). */
export function safeRedirect(raw) {
  const value = String(raw || "/");
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function useSessionStart() {
  const authStore = useAuthStore();

  /**
   * @param {object} data      the sign-in answer's `data` ({ user, tenant, token })
   * @param {object} options   { remember: boolean }
   */
  async function startSession(data, { remember = true } = {}) {
    authStore.setSession(data, { remember });

    // /auth/me adds what sign-in does not return; a failure here is not fatal
    // (the session is valid), the menu simply works from the sign-in answer
    try {
      const me = await authApi.me();
      authStore.applyMe(me.data?.data ?? {});
    } catch (error) {
      console.error("Error loading the session details:", error);
    }
  }

  return { startSession };
}
