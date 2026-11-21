<template>
  <div>
    <div class="container-fluid p-0">
      <div class="row g-0">
        <!-- Left: the background panel (hidden on phones) -->
        <div class="col-xl-8 col-lg-7 col-md-6 d-sm-none d-none d-md-block">
          <div class="auth-full-bg pt-lg-5 p-4">
            <div class="w-100">
              <div class="bg-overlay"></div>
              <div class="d-flex h-100 flex-column"></div>
            </div>
          </div>
        </div>
        <!-- end col -->

        <!-- Right: the sign-in form -->
        <div class="col-xl-4 col-md-6 col-lg-5">
          <div class="auth-full-page-content p-md-5 p-5 bg-white">
            <div class="w-100">
              <div class="d-flex flex-column h-100 p-3">
                <AuthHeader />

                <div class="my-auto">
                  <!-- Title -->
                  <div>
                    <h5 class="text-uppercase fs-12">PaySol Business</h5>
                    <h3 class="fs-20 fw-bolder mb-4 mt-0 pt-0">Sign in to your business</h3>
                    <p class="fw-bold mb-1">Welcome back, boss</p>
                    <p class="text-muted fs-12 mb-2">
                      Use the phone number or email your business was set up with.
                    </p>
                  </div>

                  <div class="mt-4">
                    <!-- Session Notice Banner (e.g. Inactivity Auto-Logout, Session Expired) -->
                    <div
                      v-if="sessionNotice && !dismissedNotice"
                      class="alert alert-dismissible fade show py-2 fs-13 d-flex align-items-center gap-2 mb-3"
                      :class="sessionNotice.tone === 'info' ? 'alert-info' : 'alert-warning'"
                      role="alert"
                    >
                      <Icon :icon="sessionNotice.icon" class="fs-4 flex-shrink-0" />
                      <div class="flex-grow-1">
                        <strong>{{ sessionNotice.title }}:</strong> {{ sessionNotice.message }}
                      </div>
                      <button
                        type="button"
                        class="btn-close pb-2"
                        @click="dismissedNotice = true"
                        aria-label="Close"
                      ></button>
                    </div>

                    <form @submit.prevent="handleLogin" novalidate>
                      <!-- Phone or email: the backend reads an @ as an email, anything else as a phone -->
                      <div class="mb-4">
                        <label for="login" class="form-label">Phone number or email</label>
                        <input
                          type="text"
                          class="form-control"
                          :class="{ 'is-invalid': err('login') }"
                          id="login"
                          v-model.trim="login"
                          placeholder="0712 345 678 or you@example.com"
                          autocomplete="username"
                          required
                          autofocus
                        >
                        <div v-if="err('login')" class="text-danger small mt-1">{{ err('login') }}</div>
                      </div>

                      <!-- Password, with show / hide -->
                      <div class="mb-4">
                        <label for="password" class="form-label">Password</label>
                        <div class="input-group auth-pass-inputgroup">
                          <input
                            :type="showPassword ? 'text' : 'password'"
                            class="form-control"
                            :class="{ 'is-invalid': err('password') }"
                            id="password"
                            v-model="password"
                            placeholder="Enter password"
                            autocomplete="current-password"
                            aria-describedby="password-addon"
                            required
                          >
                          <button
                            class="btn btn-light"
                            type="button"
                            id="password-addon"
                            @click="togglePasswordVisibility"
                            :aria-label="showPassword ? 'Hide password' : 'Show password'"
                          >
                            <i :class="showPassword ? 'mdi mdi-eye-off-outline' : 'mdi mdi-eye-outline'"></i>
                          </button>
                        </div>
                        <div v-if="err('password')" class="text-danger small mt-1">{{ err('password') }}</div>
                      </div>

                      <!-- Keep me signed in: localStorage vs sessionStorage -->
                      <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" id="remember-check" v-model="rememberMe">
                        <label class="form-check-label" for="remember-check">
                          Keep me signed in on this device
                        </label>
                      </div>

                      <!-- Locked out: the wait the API gave (429 retry_after) -->
                      <div v-if="lockedUntil" class="alert alert-warning py-2 fs-13 d-flex align-items-center gap-2" role="alert">
                        <Icon icon="ri:lock-line" class="fs-5 flex-shrink-0" />
                        <span>Too many wrong tries. You can try again at {{ lockedUntil }}.</span>
                      </div>

                      <!-- Submit: a spinner only on the button running its own action -->
                      <div class="mt-3 d-grid">
                        <button
                          class="btn btn-primary waves-effect waves-light d-flex align-items-center justify-content-center btn-lg text-capitalize fw-bold"
                          type="submit"
                          :disabled="loading"
                        >
                          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          {{ loading ? 'Signing in...' : 'Sign In' }}
                        </button>
                      </div>
                    </form>

                    <!-- New owners and staff activate with the code in their welcome SMS / email -->
                    <div class="mt-5 text-muted">
                      <span>First time here? </span>
                      <router-link :to="{ path: '/activate', query: login ? { login } : undefined }" class="fw-bold d-inline-flex align-items-center">
                        <Icon icon="ri:key-2-line" class="me-1" /> Activate your account
                      </router-link>
                    </div>
                  </div>
                </div>
                <AuthFooter />
                <ImageToast
                  :status="toastStatus"
                  :title="toastTitle"
                  :message="toastMessage"
                  :image="toastImage"
                  :imageHeight="70"
                  @hide="toastStatus = null"
                />
              </div>
            </div>
          </div>
        </div>
        <!-- end col -->
      </div>
      <!-- end row -->
    </div>
    <!-- end container-fluid -->
  </div>
</template>

<script setup>
// ---------------------------------------------------------------
// Business sign-in (/login). Modelled on the admin console's Auth.login.vue.
//
// Writes POST /api/v1/auth/login { login, password } (public):
//   - one business            -> { data: { user, tenant, token } }: signed in
//   - several businesses      -> { requires_tenant_selection, data: { picker_token,
//                                businesses } }: on to /choose-business
//   - 422 status pending_setup -> the person must activate first (/activate)
//   - 422 errors.login        -> wrong phone/email or password
//   - 429 retry_after         -> locked after 5 wrong tries in 15 minutes
//   - 403                     -> suspended person, business or membership
// Counter staff sign in with a PIN on a registered device (later; README §4).
// ---------------------------------------------------------------

// Vue
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import NProgress from "nprogress";

// API
import authApi from "@/api/auth";

// Components
import AuthFooter from "./Auth.Footer.vue";
import AuthHeader from "./Auth.Header.vue";
import ImageToast from "@/components/ImageToast.vue";

// Utils
import { useSessionStart, safeRedirect } from "@/composables/useSessionStart";
import successImage from "../../assets/images/icons/check.png";
import errorImage from "../../assets/images/icons/error.png";

// Page state
const route = useRoute();
const router = useRouter();
const { startSession } = useSessionStart();

// Session notice (?reason=inactivity | expired | logged_out)
const dismissedNotice = ref(false);
const sessionNotice = computed(() => {
  const reason = route.query.reason;
  if (reason === "inactivity") {
    return {
      title: "Signed out due to inactivity",
      message: "You were automatically signed out to protect your registers and sales records.",
      icon: "ri:timer-line",
      tone: "warning",
    };
  }
  if (reason === "expired") {
    return {
      title: "Session expired",
      message: "Your sign-in session has expired. Please sign in again to continue.",
      icon: "ri:shield-keyhole-line",
      tone: "warning",
    };
  }
  if (reason === "logged_out") {
    return {
      title: "Signed out",
      message: "You have signed out successfully.",
      icon: "ri:logout-box-r-line",
      tone: "info",
    };
  }
  return null;
});

// Form
const login = ref(String(route.query.login || "")); // phone or email
const password = ref("");
const rememberMe = ref(true);       // keep the session across browser restarts
const showPassword = ref(false);
const loading = ref(false);
const errors = ref({});             // 422 field errors from the API
const lockedUntil = ref("");        // "14:32" while a lockout lasts

// Toast
const toastStatus = ref(null);
const toastTitle = ref("");
const toastMessage = ref("");
const toastImage = ref(null);

// First message for a field, or ''
const err = (key) => errors.value[key]?.[0] || "";

// ---- Form helpers ----
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// ---- Toast helpers ----
function showToast(status, title, message) {
  toastStatus.value = status;
  toastTitle.value = title;
  toastMessage.value = message;
  toastImage.value = status === "success" ? successImage : null;
}
function showError(title, message) {
  toastStatus.value = "error";
  toastTitle.value = title;
  toastMessage.value = message;
  toastImage.value = errorImage;
}

// ---- Sign in ----
async function handleLogin() {
  errors.value = {};

  // Both boxes are needed before we ask the API
  if (!login.value || !password.value) {
    errors.value = {
      ...(login.value ? {} : { login: ["Enter your phone number or email."] }),
      ...(password.value ? {} : { password: ["Enter your password."] }),
    };
    return;
  }

  NProgress.start();
  loading.value = true;
  lockedUntil.value = "";

  try {
    const response = await authApi.login({ login: login.value, password: password.value });
    const body = response.data;

    // Several businesses: choose one with the picker token (15 minutes)
    if (body?.requires_tenant_selection) {
      await router.push({
        path: "/choose-business",
        query: route.query.redirect ? { redirect: route.query.redirect } : undefined,
        state: {
          pickerToken: body.data.picker_token,
          businesses: JSON.parse(JSON.stringify(body.data.businesses || [])),
          personName: body.data.user?.name || "",
          remember: rememberMe.value,
        },
      });
      return;
    }

    // One business: signed in
    await startSession(body.data, { remember: rememberMe.value });
    showToast("success", "Signed in", `Welcome to ${body.data?.tenant?.name || "your business"}.`);
    setTimeout(() => router.push(safeRedirect(route.query.redirect)), 500);
  } catch (error) {
    console.error("Error signing in:", error.response?.data || error.message);
    const status = error.response?.status;
    const data = error.response?.data || {};

    if (status === 422 && data.status === "pending_setup") {
      // Not activated yet: send them to activation with their phone / email filled in
      showError("Activate your account first", data.message || "Use the code in your welcome SMS or email.");
      setTimeout(() => router.push({ path: "/activate", query: { login: login.value } }), 1200);
    } else if (status === 422) {
      errors.value = data.errors || {};
      if (!data.errors) showError("Could not sign in", data.message || "Please check your details.");
    } else if (status === 429) {
      // Locked: show the time it lifts, from retry_after (seconds)
      const at = new Date(Date.now() + (Number(data.retry_after) || 900) * 1000);
      lockedUntil.value = at.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
      showError("Locked for now", data.message || "Too many wrong tries.");
    } else if (status === 403) {
      showError("Can't sign in", data.message || "Your access to this business is not active.");
    } else {
      showError("Could not sign in", data.message || "Please check your connection and try again.");
    }
  } finally {
    NProgress.done();
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
</style>
