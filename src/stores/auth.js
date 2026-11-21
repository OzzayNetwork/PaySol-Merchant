// src/stores/auth.js
// The business app's session: the Bearer token, the person, the business the
// token was issued for, and their role there. One token = one business
// (the backend's EnsureTenantScope); switching business swaps the token.
//
// Persists to localStorage ("Keep me signed in") or sessionStorage, keeps the
// axios Authorization header in sync, and exposes `hasRole(roles)` for the
// router and the menu (the backend's EnsureTenantRole is still the authority).

import { defineStore } from "pinia";
import { setAuthToken } from "@/api/index";

// Storage keys (separate from the admin console's, which uses authToken/authUser)
const TOKEN_KEY = "psBizToken";
const SESSION_KEY = "psBizSession";
const LAST_ACTIVITY_KEY = "psBizLastActivity";

export const useAuthStore = defineStore("auth", {
  // -------------------
  // STATE
  // -------------------
  state: () => ({
    token: null,          // Sanctum token, scoped to ONE business
    user: null,           // { id, name, phone, email, status, can_use_pin, last_seen_at }
    tenant: null,         // { id, name, short_name, human_code, business_type, plan, status?, setup_progress? }
    membership: null,     // { role, role_label, branch_scope }
    otherBusinesses: [],  // [{ tenant_id, name, short_name, human_code, role }] for "Switch business"
  }),

  // -------------------
  // GETTERS
  // -------------------
  getters: {
    isAuthenticated: (state) => !!state.token,
    role: (state) => state.membership?.role ?? null,
    roleLabel: (state) => state.membership?.role_label ?? state.membership?.role ?? "",
    // Owners see every branch; others only their branch_scope (null = all)
    branchScope: (state) => state.membership?.branch_scope ?? null,
  },

  // -------------------
  // ACTIONS
  // -------------------
  actions: {
    /**
     * Save a session from a sign-in answer (login, select-tenant, switch-tenant
     * or set-password): `data` = { user, tenant, token }. The role arrives on
     * `tenant` there and is moved into `membership`.
     */
    setSession(data, { remember = true } = {}) {
      const { token, user, tenant } = data;
      this.token = token;
      this.user = user ?? null;
      this.tenant = tenant ? { ...tenant } : null;
      this.membership = tenant
        ? { role: tenant.role, role_label: tenant.role_label ?? null, branch_scope: tenant.branch_scope ?? null }
        : null;
      this.persist(remember);
      setAuthToken(token);
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      } catch (e) {}
    },

    /**
     * Fill in the rest from GET /auth/me (status, setup progress, other
     * businesses). Called after sign-in and on a refresh.
     */
    applyMe(me) {
      if (me.user) this.user = { ...this.user, ...me.user };
      if (me.tenant) this.tenant = { ...this.tenant, ...me.tenant };
      if (me.membership) this.membership = { ...me.membership };
      this.otherBusinesses = me.other_businesses ?? [];
      this.persist(!!localStorage.getItem(TOKEN_KEY));
    },

    /** Write token + session to the chosen storage, clearing the other one. */
    persist(remember) {
      [localStorage, sessionStorage].forEach((s) => {
        s.removeItem(TOKEN_KEY);
        s.removeItem(SESSION_KEY);
      });
      if (!this.token) return;
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(TOKEN_KEY, this.token);
      storage.setItem(SESSION_KEY, JSON.stringify({
        user: this.user, tenant: this.tenant, membership: this.membership, otherBusinesses: this.otherBusinesses,
      }));
    },

    /** Clear everything: state, both storages and the axios header. */
    clearAuth() {
      this.token = null;
      this.user = null;
      this.tenant = null;
      this.membership = null;
      this.otherBusinesses = [];
      this.persist(true);
      setAuthToken(null);
      // The legal prompt's "Remind me later" lasts one sign-in only
      sessionStorage.removeItem("psLegalLater");
      try {
        localStorage.removeItem(LAST_ACTIVITY_KEY);
      } catch (e) {}
    },

    /** Alias so `auth.logout()` callers clear state reliably. */
    logout() {
      this.clearAuth();
    },

    /**
     * Does the signed-in person hold one of these roles here? Empty or null
     * means any signed-in role. ANY-OF, like the backend's EnsureTenantRole.
     */
    hasRole(roles) {
      if (!roles || roles.length === 0) return true;
      return roles.includes(this.role);
    },

    /**
     * Restore the session on boot (`main.js`) and before each navigation.
     * No token = signed out, whatever else is stored.
     */
    initFromLocalStorage() {
      const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
      const json = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      if (!token) {
        this.clearAuth();
        return;
      }
      this.token = token;
      setAuthToken(token);
      try {
        const s = json ? JSON.parse(json) : {};
        this.user = s.user ?? null;
        this.tenant = s.tenant ?? null;
        this.membership = s.membership ?? null;
        this.otherBusinesses = s.otherBusinesses ?? [];
      } catch {
        // A damaged session copy: keep the token, /auth/me fills the rest
      }
    },
  },
});
