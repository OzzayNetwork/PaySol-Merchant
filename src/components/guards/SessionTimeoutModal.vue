<template>
  <!-- ===============================================================
       SessionTimeoutModal — Warns user before inactivity auto-logout.
       Mounted in App.vue when authenticated. Gives a 60-second grace
       period with live countdown and a keep-alive action.
       =============================================================== -->
  <teleport to="body">
    <div
      v-if="modalVisible"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sessionTimeoutModalTitle"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
      style="background: rgba(0, 0, 0, 0.55); z-index: 1060;"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content border-0 shadow-lg animate__animated animate__fadeInDown animate__faster">
          <!-- Modal Header with Warning Accent -->
          <div class="modal-header border-bottom-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-3">
              <div
                class="avatar-sm rounded-circle d-flex align-items-center justify-content-center bg-warning bg-opacity-10 text-warning flex-shrink-0"
                style="width: 44px; height: 44px;"
              >
                <Icon icon="ri:timer-line" class="fs-3" />
              </div>
              <div>
                <h5 class="modal-title fw-bold text-black mb-0" id="sessionTimeoutModalTitle">
                  Session Expiring Soon
                </h5>
                <span class="text-muted fs-12">PaySol Security Guardian</span>
              </div>
            </div>

            <!-- Optional quick close / extend session button -->
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              :disabled="isLoggingOut || isRefreshing"
              @click="handleStaySignedIn"
            ></button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body px-4 py-3">
            <p class="text-muted fs-13 mb-3">
              You have been inactive for a while. To protect your business registers, sales data, and stock counts, your session will automatically end in:
            </p>

            <!-- Countdown Box -->
            <div class="p-3 rounded-3 bg-light border text-center mb-3">
              <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                <Icon icon="ri:alarm-warning-line" class="fs-4 text-warning" />
                <span class="fs-1 fw-bold font-monospace text-dark">{{ formattedCountdown }}</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div
                  class="progress-bar bg-warning progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  :style="{ width: `${progressPercent}%` }"
                  :aria-valuenow="progressPercent"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>

            <!-- Business context note -->
            <div v-if="authStore.tenant || authStore.user" class="d-flex align-items-center gap-2 text-muted fs-12">
              <Icon icon="ri:store-2-line" class="flex-shrink-0" />
              <span class="text-truncate">
                Signed into <strong class="text-dark">{{ authStore.tenant?.name || 'Your Business' }}</strong> as {{ authStore.user?.name || 'Staff' }}
              </span>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer border-top-0 pt-0 pb-4 px-4 gap-2">
            <button
              type="button"
              class="btn btn-light waves-effect px-3"
              :disabled="isLoggingOut || isRefreshing"
              @click="handleLogoutNow"
            >
              <span v-if="isLoggingOut" class="spinner-border spinner-border-sm me-1" role="status"></span>
              Sign out now
            </button>
            <button
              type="button"
              class="btn btn-primary waves-effect waves-light fw-semibold px-4"
              :disabled="isLoggingOut || isRefreshing"
              @click="handleStaySignedIn"
            >
              <span v-if="isRefreshing" class="spinner-border spinner-border-sm me-1" role="status"></span>
              <Icon v-else icon="ri:shield-check-line" class="me-1 align-middle" />
              Stay signed in
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
// ---------------------------------------------------------------
// SessionTimeoutModal.vue — Inactivity Grace Warning Dialog
//
// Displayed 60 seconds before session termination.
// Connects to useAutoLogout for lifecycle and synchronization.
// Also supports a `preview` prop for testing on /test-page.
// ---------------------------------------------------------------

import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/auth";
import { useAutoLogout } from "@/composables/useAutoLogout";

const props = defineProps({
  // When preview is true, this instance is controlled manually by /test-page
  preview: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["stayed", "signed-out"]);

const authStore = useAuthStore();
const {
  isWarningVisible,
  secondsRemaining,
  isRefreshing,
  isLoggingOut,
  staySignedIn,
  logoutNow,
  startWatcher,
  stopWatcher,
} = useAutoLogout();

// Local preview state for /test-page demo
const previewVisible = ref(false);
const previewSeconds = ref(45);
let previewInterval = null;

const modalVisible = computed(() => {
  if (props.preview) return previewVisible.value;
  return isWarningVisible.value;
});

const currentSeconds = computed(() => {
  if (props.preview) return previewSeconds.value;
  return secondsRemaining.value;
});

// Format seconds into MM:SS
const formattedCountdown = computed(() => {
  const secs = Math.max(0, currentSeconds.value);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});

// Percentage for the 60s countdown progress bar
const progressPercent = computed(() => {
  const secs = Math.max(0, Math.min(60, currentSeconds.value));
  return Math.round((secs / 60) * 100);
});

// Handlers
async function handleStaySignedIn() {
  if (props.preview) {
    closePreview();
    emit("stayed");
    return;
  }
  await staySignedIn();
  emit("stayed");
}

async function handleLogoutNow() {
  if (props.preview) {
    closePreview();
    emit("signed-out");
    return;
  }
  await logoutNow();
  emit("signed-out");
}

function openPreview() {
  previewVisible.value = true;
  previewSeconds.value = 55;
  if (previewInterval) clearInterval(previewInterval);
  previewInterval = setInterval(() => {
    if (previewSeconds.value > 1) {
      previewSeconds.value--;
    } else {
      closePreview();
    }
  }, 1000);
}

function closePreview() {
  previewVisible.value = false;
  if (previewInterval) {
    clearInterval(previewInterval);
    previewInterval = null;
  }
}

// Lifecycle for live app
onMounted(() => {
  if (!props.preview && authStore.isAuthenticated) {
    startWatcher();
  }
});

watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (!props.preview) {
      if (isAuth) startWatcher();
      else stopWatcher();
    }
  }
);

onBeforeUnmount(() => {
  if (previewInterval) clearInterval(previewInterval);
  if (!props.preview) {
    stopWatcher();
  }
});

// Expose preview methods for test-page
defineExpose({
  openPreview,
  closePreview,
});
</script>

<style scoped>
/* Scoped adjustments for smooth entrance */
.modal-content {
  border-radius: 12px;
}
</style>
