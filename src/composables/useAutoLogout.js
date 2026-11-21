// ---------------------------------------------------------------
// useAutoLogout.js — Inactivity Auto-Logout & Session Guardian
//
// Automatically warns the tenant user and signs them out after a period
// of inactivity to protect sensitive counter, stock, and business sales data.
//
// Features:
// 1. Inactivity tracking: Detects mouse, keyboard, touch, and scroll events.
// 2. Throttled updates: Updates last activity at most once every 3 seconds.
// 3. Multi-tab synchronization: Listens to window 'storage' events so activity
//    in any open tab keeps all tabs alive; logging out in one logs out all.
// 4. Grace period & countdown: Shows an interactive warning modal 60 seconds
//    before logout, giving the user a chance to stay signed in.
// 5. Explicit keep-alive: "Stay Signed In" pings /api/v1/auth/me to refresh
//    the backend session and reset the activity timer.
// 6. Graceful logout: Calls POST /auth/logout, clears local auth credentials,
//    and redirects to /login?reason=inactivity.
// ---------------------------------------------------------------

import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import authApi from "@/api/auth";

// Storage keys
export const LAST_ACTIVITY_KEY = "psBizLastActivity";

// Default settings: 15 minutes total inactivity, 60 seconds warning
export const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const WARNING_WINDOW_MS = 60 * 1000;
export const THROTTLE_MS = 3000;

// Shared reactive state across components
const isWarningVisible = ref(false);
const secondsRemaining = ref(60);
const isRefreshing = ref(false);
const isLoggingOut = ref(false);
const isWatcherRunning = ref(false);

let checkIntervalId = null;
let lastThrottledWrite = 0;

export function useAutoLogout() {
  const router = useRouter();
  const authStore = useAuthStore();

  /**
   * Determine total idle timeout: check user/tenant custom setting,
   * otherwise fall back to 15 minutes.
   */
  const idleTimeoutMs = computed(() => {
    const customMinutes =
      authStore.user?.security?.automatic_logout_minutes ||
      authStore.user?.idle_logout_minutes ||
      authStore.tenant?.settings?.idle_logout_minutes;

    if (customMinutes && Number(customMinutes) > 0) {
      return Number(customMinutes) * 60 * 1000;
    }
    return DEFAULT_IDLE_TIMEOUT_MS;
  });

  /**
   * Read last activity timestamp from localStorage.
   */
  function getLastActivity() {
    try {
      const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch (e) {
      // Storage access blocked or unavailable
    }
    return Date.now();
  }

  /**
   * Update the last activity timestamp (throttled).
   */
  function recordActivity(force = false) {
    if (!authStore.isAuthenticated) return;
    // When the warning modal is up, passive mouse movement must not dismiss it.
    // The user must explicitly click "Stay signed in" or interact with the dialog.
    if (isWarningVisible.value && !force) return;

    const now = Date.now();
    if (force || now - lastThrottledWrite >= THROTTLE_MS) {
      lastThrottledWrite = now;
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      } catch (e) {
        // Fallback if localStorage quota or privacy mode fails
      }
      if (isWarningVisible.value && force) {
        isWarningVisible.value = false;
      }
    }
  }

  /**
   * Cross-tab storage listener.
   */
  function handleStorageEvent(event) {
    if (event.key === LAST_ACTIVITY_KEY && event.newValue) {
      const remoteActivity = parseInt(event.newValue, 10);
      if (!isNaN(remoteActivity) && isWarningVisible.value) {
        const elapsed = Date.now() - remoteActivity;
        const totalTimeout = idleTimeoutMs.value;
        const warningStart = totalTimeout - WARNING_WINDOW_MS;
        if (elapsed < warningStart) {
          // User was active in another tab; close the warning here
          isWarningVisible.value = false;
        }
      }
    } else if (event.key === "psBizToken" && !event.newValue) {
      // User signed out in another tab
      if (authStore.isAuthenticated) {
        authStore.clearAuth();
        isWarningVisible.value = false;
        router.push({ path: "/login", query: { reason: "logged_out" } });
      }
    }
  }

  /**
   * Periodic tick to check remaining idle time and update the countdown.
   */
  function checkIdleStatus() {
    if (!authStore.isAuthenticated) {
      stopWatcher();
      return;
    }

    const now = Date.now();
    const last = getLastActivity();
    const elapsed = now - last;
    const totalTimeout = idleTimeoutMs.value;
    const remainingMs = totalTimeout - elapsed;

    if (remainingMs <= 0) {
      // Inactivity timeout reached -> execute auto logout
      executeAutoLogout();
    } else if (remainingMs <= WARNING_WINDOW_MS) {
      // In the warning window -> show modal and tick seconds
      isWarningVisible.value = true;
      secondsRemaining.value = Math.max(1, Math.ceil(remainingMs / 1000));
    } else {
      // Still active
      if (isWarningVisible.value) {
        isWarningVisible.value = false;
      }
    }
  }

  /**
   * Perform automatic logout gracefully.
   */
  async function executeAutoLogout() {
    if (isLoggingOut.value) return;
    isLoggingOut.value = true;
    isWarningVisible.value = false;
    stopWatcher();

    // Call server to revoke the current token (fire-and-forget; ignore network failure)
    try {
      await authApi.logout();
    } catch (err) {
      console.warn("Auto-logout server signout skipped or already expired:", err?.message || err);
    } finally {
      const current = router.currentRoute.value;
      const redirectPath =
        current?.fullPath && current.fullPath !== "/" && current.path !== "/login"
          ? current.fullPath
          : undefined;

      authStore.clearAuth();
      isLoggingOut.value = false;

      router.push({
        path: "/login",
        query: {
          ...(redirectPath ? { redirect: redirectPath } : {}),
          reason: "inactivity",
        },
      });
    }
  }

  /**
   * User clicked "Stay signed in":
   * 1. Pings backend /auth/me to refresh Sanctum token session and activity log.
   * 2. Resets the idle timer and dismisses the warning modal.
   */
  async function staySignedIn() {
    isRefreshing.value = true;
    try {
      await authApi.me();
    } catch (err) {
      console.warn("Session refresh ping warning:", err?.message || err);
    } finally {
      recordActivity(true);
      isRefreshing.value = false;
      isWarningVisible.value = false;
    }
  }

  /**
   * User clicked "Sign out now" from the warning modal.
   */
  async function logoutNow() {
    isLoggingOut.value = true;
    isWarningVisible.value = false;
    stopWatcher();

    try {
      await authApi.logout();
    } catch (err) {
      console.warn("Manual signout error:", err?.message || err);
    } finally {
      authStore.clearAuth();
      isLoggingOut.value = false;
      router.push({ path: "/login", query: { reason: "logged_out" } });
    }
  }

  // Activity event listener callback
  function onUserInteraction() {
    recordActivity(false);
  }

  const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

  /**
   * Start watching user activity and session ticks.
   */
  function startWatcher() {
    if (isWatcherRunning.value) return;
    if (!authStore.isAuthenticated) return;

    isWatcherRunning.value = true;
    recordActivity(true);

    // Register interaction listeners
    ACTIVITY_EVENTS.forEach((evt) => {
      window.addEventListener(evt, onUserInteraction, { passive: true });
    });

    // Register storage sync listener
    window.addEventListener("storage", handleStorageEvent);

    // Check status every second
    if (checkIntervalId) clearInterval(checkIntervalId);
    checkIntervalId = setInterval(checkIdleStatus, 1000);
  }

  /**
   * Stop watching (when signing out or component destroyed).
   */
  function stopWatcher() {
    isWatcherRunning.value = false;
    if (checkIntervalId) {
      clearInterval(checkIntervalId);
      checkIntervalId = null;
    }

    ACTIVITY_EVENTS.forEach((evt) => {
      window.removeEventListener(evt, onUserInteraction);
    });

    window.removeEventListener("storage", handleStorageEvent);
  }

  return {
    isWarningVisible,
    secondsRemaining,
    isRefreshing,
    isLoggingOut,
    isWatcherRunning,
    idleTimeoutMs,
    staySignedIn,
    logoutNow,
    recordActivity,
    startWatcher,
    stopWatcher,
  };
}
