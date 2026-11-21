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

        <!-- Right: the two steps -->
        <div class="col-xl-4 col-md-6 col-lg-5">
          <div class="auth-full-page-content p-md-5 p-5 bg-white">
            <div class="w-100">
              <div class="d-flex flex-column h-100 p-3">
                <AuthHeader />

                <div class="my-auto">
                  <!-- Title + step marker -->
                  <div>
                    <h5 class="text-uppercase fs-12">PaySol Business · Step {{ step }} of 2</h5>
                    <h3 class="fs-20 fw-bolder mb-1 mt-0 pt-0">
                      {{ step === 1 ? 'Activate your account' : 'Set your password' }}
                    </h3>
                    <p class="text-muted fs-12 mb-4">
                      <template v-if="step === 1">Enter the 6-digit code from your PaySol welcome SMS or email.</template>
                      <template v-else>Hi {{ firstName }}, choose a password you'll use to sign in.</template>
                    </p>
                  </div>

                  <!-- Step 1: phone / email + code -->
                  <form v-if="step === 1" @submit.prevent="verifyCode" novalidate>
                    <div class="mb-4">
                      <label for="who" class="form-label">Phone number or email</label>
                      <input type="text" class="form-control" :class="{ 'is-invalid': err('phone') || err('email') }" id="who"
                        v-model.trim="who" placeholder="0712 345 678 or you@example.com" autocomplete="username" required autofocus>
                      <div v-if="err('phone') || err('email')" class="text-danger small mt-1">{{ err('phone') || err('email') }}</div>
                    </div>
                    <div class="mb-4">
                      <label for="code" class="form-label">Activation code</label>
                      <input type="text" class="form-control fs-4 text-center ls-wide" :class="{ 'is-invalid': err('code') }" id="code"
                        v-model.trim="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" required>
                      <div v-if="err('code')" class="text-danger small mt-1">{{ err('code') }}</div>
                    </div>
                    <div class="d-grid">
                      <button class="btn btn-primary btn-lg fw-bold d-flex align-items-center justify-content-center" type="submit" :disabled="loading">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {{ loading ? 'Checking...' : 'Continue' }}
                      </button>
                    </div>
                  </form>

                  <!-- Step 2: password (+ confirm), optional counter PIN, the business to open -->
                  <form v-else @submit.prevent="savePassword" novalidate>
                    <div class="mb-3">
                      <label for="password" class="form-label">Password</label>
                      <div class="input-group auth-pass-inputgroup">
                        <input :type="showPassword ? 'text' : 'password'" class="form-control" :class="{ 'is-invalid': err('password') }"
                          id="password" v-model="password" placeholder="At least 8 characters" autocomplete="new-password" required autofocus>
                        <button class="btn btn-light" type="button" @click="showPassword = !showPassword"
                          :aria-label="showPassword ? 'Hide password' : 'Show password'">
                          <i :class="showPassword ? 'mdi mdi-eye-off-outline' : 'mdi mdi-eye-outline'"></i>
                        </button>
                      </div>
                      <div v-if="err('password')" class="text-danger small mt-1">{{ err('password') }}</div>
                    </div>
                    <div class="mb-3">
                      <label for="password2" class="form-label">Confirm password</label>
                      <input :type="showPassword ? 'text' : 'password'" class="form-control" id="password2"
                        v-model="passwordConfirmation" placeholder="Type it again" autocomplete="new-password" required>
                    </div>
                    <div class="mb-3">
                      <label for="pin" class="form-label">Counter PIN <span class="text-muted fw-normal">(optional, 4 to 6 digits)</span></label>
                      <input type="password" class="form-control" :class="{ 'is-invalid': err('pin') }" id="pin" v-model.trim="pin"
                        inputmode="numeric" maxlength="6" placeholder="For signing in at the till" autocomplete="off">
                      <div v-if="err('pin')" class="text-danger small mt-1">{{ err('pin') }}</div>
                    </div>
                    <!-- Several businesses: which one to open first -->
                    <div v-if="businesses.length > 1" class="mb-3">
                      <label for="business" class="form-label">Open this business first</label>
                      <select id="business" class="form-select" v-model="tenantId">
                        <option v-for="b in businesses" :key="b.tenant_id" :value="b.tenant_id">{{ b.name }} ({{ b.role }})</option>
                      </select>
                    </div>
                    <div class="d-grid mt-4">
                      <button class="btn btn-primary btn-lg fw-bold d-flex align-items-center justify-content-center" type="submit" :disabled="loading">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {{ loading ? 'Saving...' : 'Activate and sign in' }}
                      </button>
                    </div>
                  </form>

                  <!-- Back to sign-in -->
                  <div class="mt-4">
                    <router-link to="/login" class="text-muted d-inline-flex align-items-center">
                      <Icon icon="ri:arrow-left-line" class="me-1" /> Back to sign in
                    </router-link>
                  </div>
                </div>
                <AuthFooter />
                <ImageToast :status="toastStatus" :title="toastTitle" :message="toastMessage" :image="toastImage"
                  :imageHeight="70" @hide="toastStatus = null" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ---------------------------------------------------------------
// Account activation (/activate) for a new owner or staff member, from the
// code PaySol sent when the business (or the person) was added.
//
// Step 1  POST /api/v1/auth/setup/verify-code { phone | email, code }
//         -> { data: { user, setup_token (30 min), businesses } }
// Step 2  POST /api/v1/auth/setup/set-password
//         { password, password_confirmation, pin?, tenant_id? } with the setup token
//         -> { data: { user, tenant, token } }: activated and signed in
// 422 puts each message under its field. ?login= pre-fills the phone / email.
// Modelled on the console's sign-in pages.
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
import { useSessionStart } from "@/composables/useSessionStart";
import successImage from "../../assets/images/icons/check.png";
import errorImage from "../../assets/images/icons/error.png";

// Page state
const route = useRoute();
const router = useRouter();
const { startSession } = useSessionStart();
const step = ref(1);
const loading = ref(false);
const errors = ref({});

// Step 1
// Phone or email: ?login= from the sign-in page; ?phone= / ?email= from the setup SMS and email links
const who = ref(String(route.query.login || route.query.phone || route.query.email || "").trim());
const code = ref("");

// Step 2
const setupToken = ref(null);      // held in memory only
const person = ref(null);
const businesses = ref([]);
const tenantId = ref(null);
const password = ref("");
const passwordConfirmation = ref("");
const pin = ref("");
const showPassword = ref(false);

// Toast
const toastStatus = ref(null);
const toastTitle = ref("");
const toastMessage = ref("");
const toastImage = ref(null);

const err = (key) => errors.value[key]?.[0] || "";
const firstName = computed(() => String(person.value?.name || "").split(" ")[0] || "there");

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

// ---- Step 1: check the code ----
async function verifyCode() {
  errors.value = {};
  const isEmail = who.value.includes("@");
  if (!who.value) errors.value[isEmail ? "email" : "phone"] = ["Enter the phone number or email the code was sent to."];
  if (!/^\d{6}$/.test(code.value)) errors.value.code = ["The code has 6 digits."];
  if (Object.keys(errors.value).length) return;

  NProgress.start();
  loading.value = true;
  try {
    const response = await authApi.verifySetupCode(isEmail ? { email: who.value, code: code.value } : { phone: who.value, code: code.value });
    const data = response.data.data;
    setupToken.value = data.setup_token;
    person.value = data.user;
    businesses.value = data.businesses || [];
    tenantId.value = businesses.value[0]?.tenant_id ?? null;
    step.value = 2;
  } catch (error) {
    console.error("Error checking the activation code:", error.response?.data || error.message);
    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {};
    } else {
      showError("Could not check the code", error.response?.data?.message || "Please try again.");
    }
  } finally {
    NProgress.done();
    loading.value = false;
  }
}

// ---- Step 2: password, PIN, sign in ----
async function savePassword() {
  errors.value = {};
  if (password.value.length < 8) errors.value.password = ["Use at least 8 characters."];
  else if (password.value !== passwordConfirmation.value) errors.value.password = ["The two passwords don't match."];
  if (pin.value && !/^\d{4,6}$/.test(pin.value)) errors.value.pin = ["A PIN is 4 to 6 digits."];
  if (Object.keys(errors.value).length) return;

  NProgress.start();
  loading.value = true;
  try {
    const response = await authApi.setPassword({
      password: password.value,
      password_confirmation: passwordConfirmation.value,
      pin: pin.value || undefined,
      tenant_id: tenantId.value || undefined,
    }, setupToken.value);
    await startSession(response.data.data, { remember: true });
    showToast("success", "You're in", "Your account is active.");
    setTimeout(() => router.push("/"), 500);
  } catch (error) {
    console.error("Error setting the password:", error.response?.data || error.message);
    const status = error.response?.status;
    if (status === 422) {
      errors.value = error.response.data.errors || {};
    } else if (status === 401) {
      // The setup token lasts 30 minutes: start again
      showError("Start again", "Activation timed out. Enter your code again.");
      step.value = 1;
    } else {
      showError("Could not activate", error.response?.data?.message || "Please try again.");
    }
  } finally {
    NProgress.done();
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
/* The code box: wide letter spacing so the 6 digits read clearly */
.ls-wide { letter-spacing: 0.5em; }
</style>
