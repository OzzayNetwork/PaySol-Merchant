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

        <!-- Right: the list of businesses -->
        <div class="col-xl-4 col-md-6 col-lg-5">
          <div class="auth-full-page-content p-md-5 p-5 bg-white">
            <div class="w-100">
              <div class="d-flex flex-column h-100 p-3">
                <AuthHeader />

                <div class="my-auto">
                  <!-- Title -->
                  <div>
                    <h5 class="text-uppercase fs-12">PaySol Business</h5>
                    <h3 class="fs-20 fw-bolder mb-1 mt-0 pt-0">Choose a business</h3>
                    <p class="text-muted fs-12 mb-4">
                      {{ personName ? `${personName}, you` : 'You' }} work at more than one business. Pick the one to open.
                    </p>
                  </div>

                  <!-- Businesses: one card each, a real button (keyboard and screen readers) -->
                  <div class="d-flex flex-column gap-2">
                    <button
                      v-for="b in businesses"
                      :key="b.tenant_id"
                      type="button"
                      class="btn btn-white text-start border-2 p-3 d-flex align-items-center gap-3 waves-effect"
                      :class="{ 'border-primary': choosing === b.tenant_id }"
                      :disabled="!!choosing"
                      :title="`Open ${b.name}`"
                      @click="choose(b)"
                    >
                      <!-- Circular Business Avatar: Logo or initials on business primary color -->
                      <div
                        class="sidebar-business-avatar d-flex flex-shrink-0 align-items-center justify-content-center shadow-sm"
                        style="width: 40px; height: 40px; min-width: 40px; border-radius: 50% !important;"
                      >
                        <img
                          v-if="showBusinessLogo(b)"
                          :src="b.logo_url"
                          alt="Logo"
                          class="rounded-circle w-100 h-100"
                          @error="markBrokenLogo(b.tenant_id)"
                        />
                        <span
                          v-else
                          class="avatar-title rounded-circle w-100 h-100 text-white font-size-14 fw-bold d-flex align-items-center justify-content-center text-uppercase"
                          :style="{ backgroundColor: b.primary_color || '#2164F3' }"
                        >
                          {{ initialsOf(b.name) }}
                        </span>
                      </div>
                      <span class="flex-grow-1 min-w-0">
                        <span class="d-block fw-bold text-dark text-truncate">{{ b.name }}</span>
                        <span class="d-block text-muted fs-12 text-truncate">
                          {{ b.role_label || b.role }}<template v-if="b.business_type"> · {{ b.business_type }}</template> · {{ b.human_code }}
                        </span>
                      </span>
                      <span v-if="choosing === b.tenant_id" class="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span>
                      <Icon v-else icon="ri:arrow-right-s-line" class="fs-3 text-muted" />
                    </button>
                  </div>

                  <!-- Back to sign-in (the picker token only lasts 15 minutes) -->
                  <div class="mt-4">
                    <router-link to="/login" class="text-muted d-inline-flex align-items-center">
                      <Icon icon="ri:arrow-left-line" class="me-1" /> Sign in with another account
                    </router-link>
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
      </div>
    </div>
  </div>
</template>

<script setup>
// ---------------------------------------------------------------
// Choose a business (/choose-business), after a login that answered
// requires_tenant_selection. Gets the picker token and the businesses from the
// login page through history state (never the URL or storage); without them
// (a refresh, an old link) it goes back to /login.
//
// Writes POST /api/v1/auth/select-tenant { tenant_id } with the picker token
// -> { data: { user, tenant, token } }; 403 = the business is suspended or
// closed, or the membership is no longer active; 401 = the picker expired.
// ---------------------------------------------------------------

// Vue
import { ref, onMounted } from "vue";
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
import errorImage from "../../assets/images/icons/error.png";

// Page state
const route = useRoute();
const router = useRouter();
const { startSession } = useSessionStart();

// Data from the login page (history.state)
const pickerToken = ref(null);
const businesses = ref([]);
const personName = ref("");
const remember = ref(true);
const choosing = ref(null);   // tenant_id being opened

// Toast
const toastStatus = ref(null);
const toastTitle = ref("");
const toastMessage = ref("");
const toastImage = ref(null);

// "Kwa Maina Bar" -> "KM"
const initialsOf = (name) =>
  String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

// Logo handling with fallback to initials on primary color
const brokenLogos = ref(new Set());
const showBusinessLogo = (b) => !!b.logo_url && !brokenLogos.value.has(b.tenant_id);
const markBrokenLogo = (tenantId) => {
  brokenLogos.value = new Set(brokenLogos.value).add(tenantId);
};

// ---- Toast helpers ----
function showError(title, message) {
  toastStatus.value = "error";
  toastTitle.value = title;
  toastMessage.value = message;
  toastImage.value = errorImage;
}

// ---- Choose ----
async function choose(business) {
  NProgress.start();
  choosing.value = business.tenant_id;
  try {
    const response = await authApi.selectTenant(business.tenant_id, pickerToken.value);
    await startSession(response.data.data, { remember: remember.value });
    router.push(safeRedirect(route.query.redirect));
  } catch (error) {
    console.error("Error choosing a business:", error.response?.data || error.message);
    const status = error.response?.status;
    const message = error.response?.data?.message;
    if (status === 401) {
      showError("Please sign in again", "The choice timed out after 15 minutes.");
      setTimeout(() => router.push("/login"), 1200);
    } else {
      showError("Can't open this business", message || "Please try again.");
    }
  } finally {
    NProgress.done();
    choosing.value = null;
  }
}

// ---- Lifecycle ----
onMounted(() => {
  const state = window.history.state || {};
  if (!state.pickerToken || !Array.isArray(state.businesses) || state.businesses.length === 0) {
    router.replace("/login");
    return;
  }
  pickerToken.value = state.pickerToken;
  businesses.value = state.businesses;
  personName.value = state.personName || "";
  remember.value = state.remember !== false;
});
</script>
