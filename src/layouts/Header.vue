<template>
    <header id="page-topbar">
        <div class="navbar-header">
            <!-- No align-items-center here: the logo box must stretch the full header height (as in the console) -->
            <div class="d-flex flex-grow-1" style="min-width: 0;">
                <!-- LOGO -->
                <div class="navbar-brand-box">
                    <router-link to="/" class="logo logo-dark">
                        <span class="logo-sm">
                            <img src="../assets/images/logo.svg" alt="PaySol" height="32">
                        </span>
                        <span class="logo-lg">
                            <img src="../assets/images/logo-dark.png" alt="PaySol" height="42">
                        </span>
                    </router-link>

                    <router-link to="/" class="logo logo-light">
                        <span class="logo-sm">
                            <img src="../assets/images/logo-light.svg" alt="PaySol" height="32">
                        </span>
                        <span class="logo-lg">
                            <img src="../assets/images/logo-white.svg" alt="PaySol" height="42">
                        </span>
                    </router-link>
                </div>

                <!-- Menu toggle -->
                <button type="button" class="btn btn-sm px-3 font-size-16 header-item waves-effect"
                    id="vertical-menu-btn" aria-label="Show or hide the menu">
                    <i class="fa fa-fw fa-bars"></i>
                </button>
                <!-- logo small -->
                <div class="phone-logo d-md-none d-sm-flex"><img src="../assets/images/color-log0.svg" alt="PaySol" class="img"></div>

                <!-- Universal search (desktop): widens to fill the bar while in use; results open on Enter at /search -->
                <GlobalSearch v-if="auth.isAuthenticated" class="d-none d-lg-flex" />
            </div>

            <div class="d-flex align-items-center">
                <!-- Universal search (phones and tablets): button that opens search over top bar -->
                <div v-if="auth.isAuthenticated" class="d-inline-flex d-lg-none ms-2">
                    <GlobalSearch :mobile="true" />
                </div>
                <!-- Full screen -->
                <div class="dropdown d-none d-lg-inline-block ms-1">
                    <button type="button" class="btn header-item noti-icon waves-effect" data-bs-toggle="fullscreen" aria-label="Full screen">
                        <i class="bx bx-fullscreen" title="Full Screen"></i>
                    </button>
                </div>

                <!-- The signed-in person -->
                <div v-if="auth.isAuthenticated" class="dropdown d-inline-block">
                    <button type="button" class="btn header-item waves-effect d-flex align-items-center"
                        id="page-header-user-dropdown" data-bs-toggle="dropdown" aria-haspopup="true"
                        aria-expanded="false">
                        <!-- Initials avatar (skeleton until the session is restored) -->
                        <div v-if="user" class="avatar-sm header-profile-user d-flex">
                            <span class="avatar-title rounded-circle bg-primary font-size-14 bg-loader">
                                <strong class="text-uppercase">{{ initials }}</strong>
                            </span>
                        </div>
                        <div v-else class="avatar-sm placeholder-glow">
                            <span class="avatar-title rounded-circle bg-dark-muted bg-loader font-size-16 placeholder"><strong class="opacity-25">?</strong></span>
                        </div>
                        <h5 class="text-left mb-0 mx-3 d-none d-md-flex flex-column text-capitalize">
                            <div>
                                <span v-if="user" class="d-inline-block">{{ user.name }}</span>
                                <span v-else class="d-inline-block placeholder-glow overflow-hidden" style="height: 15px; width: 150px;">
                                    <span class="placeholder col-8 me-1"></span><span class="placeholder col-3"></span>
                                </span>
                                <i class="mdi mdi-chevron-down d-inline-block"></i>
                            </div>
                            <p v-if="user" class="fs-12 mb-0 text-muted text-lowercase">{{ user.phone || user.email }}</p>
                        </h5>
                    </button>
                    <div class="dropdown-menu dropdown-menu-end p-0">
                        <!-- Who and where -->
                        <div class="p-3 d-flex align-items-center gap-2">
                            <div class="avatar-sm header-profile-user d-flex flex-shrink-0">
                                <span class="avatar-title rounded-circle bg-primary font-size-14"><strong class="text-uppercase">{{ initials }}</strong></span>
                            </div>
                            <div class="d-flex flex-column min-w-0">
                                <span class="text-capitalize text-black text-truncate">{{ user?.name }}</span>
                                <span class="small text-muted text-truncate">{{ user?.phone || user?.email }}</span>
                                <span class="small text-muted text-truncate">{{ auth.roleLabel }} at {{ auth.tenant?.name }}</span>
                            </div>
                        </div>
                        <!-- Links the role may open -->
                        <div v-if="auth.hasRole(['owner', 'manager'])" class="p-2 border-top d-flex flex-column gap-2">
                            <router-link class="dropdown-item px-3" to="/activity-log">
                                <i class="mdi mdi-chart-timeline-variant align-middle me-2 fs-4"></i>
                                <span>Activity Log</span>
                            </router-link>
                        </div>
                        <div class="dropdown-divider m-0"></div>
                        <!-- Sign out -->
                        <div class="p-2">
                            <a class="dropdown-item px-3" href="javascript:void(0)" @click="handleLogout">
                                <i class="mdi mdi-logout align-middle me-2 fs-4"></i>
                                <span>Sign out</span>
                            </a>
                        </div>
                    </div>
                </div>
                <div v-else class="d-flex align-items-center justify-content-center px-3">
                    <router-link class="btn btn-primary waves-effect waves-light" to="/login">
                        <i class="bx bx-log-in font-size-16 me-1"></i> Sign in
                    </router-link>
                </div>
            </div>
        </div>
    </header>

    <ScrollUp />
    <ImageToast :status="toastStatus" :title="toastTitle" :message="toastMessage" :image="toastImage"
        :imageHeight="70" @hide="toastStatus = null" />
</template>

<script setup>
// ---------------------------------------------------------------
// The business app's top bar: the logo and menu toggle, the BUSINESS this
// session is for (with "Switch to" for the person's other businesses), full
// screen, and the signed-in person (role, Activity Log for owners/managers,
// Sign out). Modelled on the admin console's Header.vue, without its global
// search, notifications bell and AI menu (admin endpoints).
//
// Writes POST /auth/switch-tenant { tenant_id } (a new token for that business,
// then GET /auth/me) and POST /auth/logout. Any signed-in role.
// ---------------------------------------------------------------

// Vue
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";

// API
import authApi from "@/api/auth";

// Components
import ScrollUp from "@/layouts/ScrollUp.vue";
import ImageToast from "@/components/ImageToast.vue";
import GlobalSearch from "@/components/search/GlobalSearch.vue";

// Utils
import { useAuthStore } from "@/stores/auth";
import { useSessionStart } from "@/composables/useSessionStart";
import errorImage from "@/assets/images/icons/error.png";

const auth = useAuthStore();
const router = useRouter();
const { startSession } = useSessionStart();

// Page state
const switching = ref(null);   // tenant_id being switched to

// Toast
const toastStatus = ref(null);
const toastTitle = ref("");
const toastMessage = ref("");
const toastImage = ref(null);

const user = computed(() => auth.user);

// "Maina Kamau" -> "MK"
const initials = computed(() =>
    String(user.value?.name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("")
);

// ---- Toast helpers ----
function showError(title, message) {
    toastStatus.value = "error";
    toastTitle.value = title;
    toastMessage.value = message;
    toastImage.value = errorImage;
}

// ---- Switch business ----
// A new token for the other business; data is never mixed on one screen, so
// the app reloads at Home for that business.
async function switchTo(business) {
    switching.value = business.tenant_id;
    try {
        const response = await authApi.switchTenant(business.tenant_id);
        await startSession(response.data.data, { remember: !!localStorage.getItem("psBizToken") });
        await router.push("/");
        window.location.reload();
    } catch (error) {
        console.error("Error switching business:", error.response?.data || error.message);
        showError("Can't switch", error.response?.data?.message || "Please try again.");
    } finally {
        switching.value = null;
    }
}

// ---- Sign out ----
// Revoke the token first (it is logged as a sign-out), then clear local state
// whatever the server said, so nobody is ever trapped inside.
async function handleLogout() {
    try {
        await authApi.logout();
    } catch (err) {
        console.warn("Server sign-out skipped or already expired:", err?.message || err);
    } finally {
        auth.clearAuth();
        router.push("/login");
    }
}
</script>

<style lang="scss" scoped></style>
