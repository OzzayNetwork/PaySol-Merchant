<template>
  <div>
    <!-- Backdrop -->
    <div
      v-if="shiftStore.isModalOpen"
      class="modal-backdrop fade show"
      @click="shiftStore.closeModal"
    ></div>

    <!-- Modal Dialog -->
    <div
      class="modal fade"
      :class="{ show: shiftStore.isModalOpen }"
      tabindex="-1"
      :style="{ display: shiftStore.isModalOpen ? 'block' : 'none' }"
      :aria-hidden="shiftStore.isModalOpen ? 'false' : 'true'"
    >
      <div
        class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down modal-dialog-scrollable"
        style="max-width: 600px;"
      >
        <div
          class="modal-content border-0 overflow-hidden"
          style="border-radius: 12px; border: 1px solid #eef0f4 !important; box-shadow: none !important; max-height: 90vh;"
        >
          <!-- Loading State -->
          <div v-if="shiftStore.isLoading && !shiftStore.activeShift" class="p-5 text-center">
            <div class="spinner-border text-primary mb-3" role="status"></div>
            <p class="text-muted small mb-0">Checking shift status...</p>
          </div>

          <template v-else>
            <!-- ========================================================= -->
            <!-- CASE 1: TEAM SHIFT ALREADY ACTIVE (JOIN SHIFT)           -->
            <!-- ========================================================= -->
            <div v-if="shiftStore.hasActiveShift && !shiftStore.isJoined" class="d-flex flex-column h-100 flex-grow-1 overflow-hidden">
              <!-- Header -->
              <div class="modal-header border-0 pb-0 pt-4 px-4 bg-light bg-opacity-50">
                <div class="d-flex align-items-center gap-3">
                  <div
                    class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style="width: 48px; height: 48px; background: rgba(52, 195, 143, 0.15); color: #34c38f;"
                  >
                    <Icon icon="ri:team-fill" class="fs-3" />
                  </div>
                  <div>
                    <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 mb-1 rounded-pill fw-medium fs-11">
                      <span class="spinner-grow spinner-grow-sm me-1" style="width: 8px; height: 8px;" role="status"></span>
                      Active Shift Running
                    </span>
                    <h5 class="modal-title fw-bold text-dark fs-5 mb-0">
                      Join Team Shift
                    </h5>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn-close"
                  aria-label="Close"
                  @click="shiftStore.closeModal"
                ></button>
              </div>

              <!-- Body -->
              <div class="modal-body p-4 custom-scroll" style="overflow-y: auto; max-height: calc(88vh - 140px);">
                <div class="p-3 rounded-3 bg-light border mb-4">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div class="fs-12 text-muted text-uppercase fw-semibold letter-spacing-1">Shift Number</div>
                      <div class="fw-bold fs-5 text-dark font-monospace">{{ shiftStore.activeShift?.shift_number }}</div>
                    </div>
                    <span class="badge bg-primary fs-12 px-2 py-1 rounded-pill">
                      {{ shiftStore.activeShift?.branch?.name || 'Main Branch' }}
                    </span>
                  </div>

                  <hr class="my-2 border-secondary opacity-10" />

                  <div class="row g-2 mt-1">
                    <div class="col-6">
                      <div class="fs-11 text-muted text-uppercase">Started By</div>
                      <div class="fw-medium text-dark d-flex align-items-center gap-1 mt-1">
                        <Icon icon="ri:user-star-line" class="text-primary" />
                        {{ shiftStore.activeShift?.opened_by?.name || 'Shift Lead' }}
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="fs-11 text-muted text-uppercase">Opening Float</div>
                      <div class="fw-bold text-success fs-14 mt-1">
                        {{ formatMoney(shiftStore.openingFloat) }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Active Colleagues -->
                <div class="mb-4">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="fs-12 text-muted text-uppercase fw-bold">Currently On Duty</span>
                    <span class="badge bg-light text-secondary rounded-pill">
                      {{ shiftStore.activeMembersCount }} staff active
                    </span>
                  </div>
                  <div class="d-flex flex-wrap gap-2">
                    <div
                      v-for="member in shiftStore.activeMembers"
                      :key="member.id"
                      class="d-flex align-items-center gap-2 px-2 py-1 rounded-pill border bg-white small"
                    >
                      <span class="avatar-title rounded-circle bg-primary-subtle text-primary fw-bold" style="width: 22px; height: 22px; font-size: 11px;">
                        {{ getInitials(member.name) }}
                      </span>
                      <span class="text-dark fw-medium">{{ member.name }}</span>
                      <span v-if="member.role === 'lead'" class="badge bg-warning-subtle text-warning fs-10 px-1 py-0">Lead</span>
                    </div>
                  </div>
                </div>

                <!-- Friendly instruction banner -->
                <div class="alert alert-info py-2 px-3 border-0 rounded-3 mb-0 fs-12 d-flex align-items-center gap-2">
                  <Icon icon="ri:information-line" class="fs-5 flex-shrink-0 text-info" />
                  <div>
                    The counter float is already logged. Tap below to connect your device and begin ringing sales immediately.
                  </div>
                </div>

                <!-- Error Alert -->
                <div v-if="errorMessage" class="alert alert-danger py-2 px-3 border-0 rounded-3 mt-3 fs-12">
                  {{ errorMessage }}
                </div>
              </div>

              <!-- Footer -->
              <div class="modal-footer border-top p-3 px-4 bg-light bg-opacity-25 d-flex justify-content-between">
                <button
                  type="button"
                  class="btn btn-outline-secondary px-3"
                  @click="shiftStore.closeModal"
                  :disabled="submitting"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn btn-success px-4 d-flex align-items-center gap-2 fw-semibold"
                  @click="handleJoinShift"
                  :disabled="submitting"
                >
                  <span v-if="submitting" class="spinner-border spinner-border-sm" role="status"></span>
                  <Icon v-else icon="ri:user-shared-line" class="fs-5" />
                  Join Shift & Start Selling
                </button>
              </div>
            </div>

            <!-- ========================================================= -->
            <!-- CASE 2: NO SHIFT ACTIVE -> OPEN SHIFT SCREEN              -->
            <!-- ========================================================= -->
            <div v-else-if="!shiftStore.hasActiveShift" class="d-flex flex-column h-100 flex-grow-1 overflow-hidden">
              <!-- Header -->
              <div class="modal-header border-0 pb-0 pt-4 px-4 bg-light bg-opacity-50">
                <div class="d-flex align-items-center gap-3">
                  <div
                    class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style="width: 48px; height: 48px; background: rgba(85, 110, 230, 0.12); color: #556ee6;"
                  >
                    <Icon icon="ri:cash-line" class="fs-3" />
                  </div>
                  <div>
                    <h5 class="modal-title fw-bold text-dark fs-5 mb-0">
                      Open Counter Shift
                    </h5>
                    <p class="text-muted small mb-0">
                      Set your starting float to begin today's sales.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn-close"
                  aria-label="Close"
                  @click="shiftStore.closeModal"
                ></button>
              </div>

              <!-- Body -->
              <div class="modal-body p-4 custom-scroll" style="overflow-y: auto; max-height: calc(88vh - 140px);">
                <!-- Branch Selector (if multiple branches exist) -->
                <div v-if="shiftStore.branches.length > 1" class="mb-3">
                  <label class="form-label small fw-bold text-uppercase text-muted">Branch / Shop</label>
                  <select
                    class="form-select"
                    v-model="form.branch_id"
                    @change="onBranchChange"
                  >
                    <option v-for="b in shiftStore.branches" :key="b.id" :value="b.id">
                      {{ b.name }} {{ b.is_main ? '(Main)' : '' }}
                    </option>
                  </select>
                </div>

                <!-- Cash Keying-in Section Card with Distinct Background Tint -->
                <div class="cash-input-card p-3 p-sm-4 rounded-4 mb-4 border">
                  <!-- Hero Float Input -->
                  <div class="text-center mb-3">
                    <label class="form-label fs-11 fw-bold text-uppercase text-muted letter-spacing-1 mb-2">
                      Starting Cash Float (Change Money)
                    </label>
                    <div class="input-group input-group-lg mx-auto" style="max-width: 320px;">
                      <span class="input-group-text fw-bold text-primary bg-white border-end-0">KES</span>
                      <input
                        type="number"
                        class="form-control text-center fw-bold fs-3 border-start-0 bg-white"
                        v-model.number="form.opening_float"
                        min="0"
                        step="50"
                        placeholder="0.00"
                      />
                    </div>
                    <div class="text-muted fs-11 mt-1">
                      Cash at counter or pouch before making sales
                    </div>
                  </div>

                  <!-- Quick Preset Chips (Effortless 1-Tap) -->
                  <div class="mb-3">
                    <div class="fs-11 text-uppercase text-muted fw-bold mb-2 text-center text-sm-start">
                      Fast Presets (1-Tap)
                    </div>
                    <div class="d-flex flex-wrap justify-content-center justify-content-sm-start gap-2">
                      <button
                        type="button"
                        v-for="preset in quickPresets"
                        :key="preset.amount"
                        class="btn btn-sm rounded-pill px-3 transition-all fw-medium"
                        :class="form.opening_float === preset.amount ? 'btn-primary' : 'btn-light border text-secondary'"
                        @click="selectPreset(preset.amount)"
                      >
                        {{ preset.label }}
                      </button>
                    </div>
                  </div>

                  <!-- Prominent Count Notes & Coins Toggle Bar -->
                  <div class="pt-3 border-top border-secondary border-opacity-10">
                    <button
                      type="button"
                      class="btn w-100 p-3 rounded-3 transition-all d-flex align-items-center justify-content-between"
                      style="border: 1px solid #e2e8f0 !important;"
                      :class="showDenominations ? 'btn-light border-primary-subtle' : 'btn-light'"
                      @click="toggleDenominations"
                    >
                      <div class="d-flex align-items-center gap-3">
                        <div
                          class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style="width: 38px; height: 38px; background: rgba(85, 110, 230, 0.12); color: #556ee6;"
                        >
                          <Icon icon="ri:coins-line" class="fs-5" />
                        </div>
                        <div class="text-start">
                          <div class="fw-bold fs-13 text-dark d-flex align-items-center gap-2">
                            Count Notes & Coins
                            <span v-if="denominationsTotal > 0" class="badge bg-success-subtle text-success fs-10 px-2 py-1">
                              KES {{ denominationsTotal.toLocaleString() }}
                            </span>
                          </div>
                          <div class="text-muted fs-11 mt-1">
                            Breakdown by 1,000s, 500s, 200s, 100s, 50s & coins
                          </div>
                        </div>
                      </div>

                      <div class="d-flex align-items-center gap-2">
                        <span
                          class="badge rounded-pill fs-11 px-3 py-1"
                          :class="showDenominations ? 'bg-primary text-white' : 'bg-white text-secondary border'"
                        >
                          {{ showDenominations ? 'Collapse' : 'Count' }}
                        </span>
                        <Icon :icon="showDenominations ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" class="fs-5 text-secondary" />
                      </div>
                    </button>
                  </div>

                  <!-- Denominations Grid (When Expanded) -->
                  <div
                    v-if="showDenominations"
                    class="mt-3 p-3 p-sm-4 rounded-3 bg-white"
                    style="border: 1px solid #e2e8f0 !important;"
                  >
                    <div class="fw-bold text-dark fs-12 mb-3 d-flex justify-content-between align-items-center pb-2 border-bottom" style="border-color: #eef0f4 !important;">
                      <span class="text-uppercase letter-spacing-1 fs-11 text-muted">Currency Breakdown</span>
                      <span class="text-success fw-bold fs-13">{{ formatMoney(denominationsTotal) }}</span>
                    </div>

                    <div class="row g-2 g-sm-3">
                      <div
                        v-for="note in noteDenominations"
                        :key="note.val"
                        class="col-6 col-sm-4"
                      >
                        <div
                          class="p-2 p-sm-3 rounded-3 text-center denomination-box d-flex flex-column justify-content-between h-100"
                          :style="{ background: note.bg, border: '1px solid ' + note.borderColor + ' !important' }"
                        >
                          <div>
                            <span class="fs-12 fw-bold text-dark d-block">KES {{ note.val.toLocaleString() }}</span>
                          </div>

                          <div class="d-flex align-items-center justify-content-center gap-2 my-2 py-1">
                            <button
                              type="button"
                              class="btn btn-sm btn-white bg-white border p-0 rounded-circle"
                              style="width: 28px; height: 28px; line-height: 1; border-color: #e2e8f0 !important;"
                              @click="changeNoteCount(note.val, -1)"
                              :disabled="!denominations[note.val]"
                            >
                              -
                            </button>
                            <span class="fw-bold fs-14 text-dark font-monospace text-center" style="min-width: 24px;">
                              {{ denominations[note.val] || 0 }}
                            </span>
                            <button
                              type="button"
                              class="btn btn-sm btn-white bg-white border p-0 rounded-circle"
                              style="width: 28px; height: 28px; line-height: 1; border-color: #e2e8f0 !important;"
                              @click="changeNoteCount(note.val, 1)"
                            >
                              +
                            </button>
                          </div>

                          <span class="fs-10 text-muted d-block">
                            = KES {{ ((denominations[note.val] || 0) * note.val).toLocaleString() }}
                          </span>
                        </div>
                      </div>

                      <!-- Coins Tile with Subtle Border and Proper Spacing -->
                      <div class="col-6 col-sm-4">
                        <div
                          class="p-2 p-sm-3 rounded-3 text-center denomination-box d-flex flex-column justify-content-between h-100"
                          style="background: #fafbfc; border: 1px solid #e2e8f0 !important;"
                        >
                          <div>
                            <span class="fs-12 fw-bold text-dark d-flex align-items-center justify-content-center gap-1">
                              <Icon icon="ri:copper-coin-line" class="text-warning fs-13" />
                              Loose Coins
                            </span>
                          </div>

                          <div class="my-2 py-0.5">
                            <div class="input-group input-group-sm">
                              <span class="input-group-text bg-white border-end-0 px-2 fs-11 text-muted" style="border-color: #e2e8f0;">KES</span>
                              <input
                                type="number"
                                class="form-control form-control-sm text-center fw-bold border-start-0 bg-white"
                                style="border-color: #e2e8f0;"
                                v-model.number="denominations.coins"
                                min="0"
                                step="5"
                                placeholder="0"
                                @input="syncFromDenominations"
                              />
                            </div>
                          </div>

                          <span class="fs-10 text-muted d-block">
                            = KES {{ (Number(denominations.coins) || 0).toLocaleString() }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Shift Note (Optional) -->
                <div class="mb-3">
                  <label class="form-label fs-11 text-uppercase text-muted fw-bold">Note / Remark (Optional)</label>
                  <input
                    type="text"
                    class="form-control form-control-sm"
                    v-model="form.opening_notes"
                    placeholder="e.g. Morning counter kickoff, float ready"
                    maxlength="150"
                  />
                </div>

                <!-- Error Alert -->
                <div v-if="errorMessage" class="alert alert-danger py-2 px-3 border-0 rounded-3 mb-0 fs-12">
                  {{ errorMessage }}
                </div>
              </div>

              <!-- Footer -->
              <div class="modal-footer border-top p-3 px-4 bg-light bg-opacity-25 d-flex justify-content-between">
                <button
                  type="button"
                  class="btn btn-outline-secondary px-3"
                  @click="shiftStore.closeModal"
                  :disabled="submitting"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn btn-primary px-4 d-flex align-items-center gap-2 fw-semibold"
                  @click="handleOpenShift"
                  :disabled="submitting"
                >
                  <span v-if="submitting" class="spinner-border spinner-border-sm" role="status"></span>
                  <Icon v-else icon="ri:rocket-line" class="fs-5" />
                  Open Shift & Start Selling
                </button>
              </div>
            </div>

            <!-- ========================================================= -->
            <!-- CASE 3: CURRENTLY ON DUTY (STATUS VIEW)                   -->
            <!-- ========================================================= -->
            <div v-else class="d-flex flex-column h-100 flex-grow-1 overflow-hidden">
              <div class="modal-header border-0 pb-0 pt-4 px-4 bg-light bg-opacity-50">
                <div class="d-flex align-items-center gap-3">
                  <div
                    class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style="width: 48px; height: 48px; background: rgba(52, 195, 143, 0.15); color: #34c38f;"
                  >
                    <Icon icon="ri:checkbox-circle-fill" class="fs-3" />
                  </div>
                  <div>
                    <h5 class="modal-title fw-bold text-dark fs-5 mb-0">
                      You are On Duty
                    </h5>
                    <p class="text-muted small mb-0">
                      Active Shift: <span class="fw-bold font-monospace text-dark">{{ shiftStore.activeShiftNumber }}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn-close"
                  aria-label="Close"
                  @click="shiftStore.closeModal"
                ></button>
              </div>

              <div class="modal-body p-4 custom-scroll" style="overflow-y: auto; max-height: calc(88vh - 140px);">
                <div class="p-3 rounded-3 bg-light border mb-3">
                  <div class="row g-2">
                    <div class="col-6">
                      <div class="fs-11 text-muted text-uppercase">Your Role</div>
                      <div class="fw-bold text-dark text-capitalize mt-1">
                        {{ shiftStore.myRole === 'lead' ? 'Shift Lead' : 'Team Cashier' }}
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="fs-11 text-muted text-uppercase">Opening Float</div>
                      <div class="fw-bold text-success fs-14 mt-1">
                        {{ formatMoney(shiftStore.openingFloat) }}
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="fs-11 text-muted text-uppercase">Active Members</div>
                      <div class="fw-bold text-dark mt-1">
                        {{ shiftStore.activeMembersCount }} staff on duty
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="fs-11 text-muted text-uppercase">Branch</div>
                      <div class="fw-bold text-dark mt-1">
                        {{ shiftStore.activeShift?.branch?.name || 'Main Branch' }}
                      </div>
                    </div>
                  </div>
                </div>

                <p class="text-muted small mb-0">
                  You can now create orders and accept customer payments on any of your devices. All sales are tracked under this shift.
                </p>
              </div>

              <div class="modal-footer border-top p-3 px-4 bg-light bg-opacity-25 d-flex justify-content-end">
                <button
                  type="button"
                  class="btn btn-primary px-4"
                  @click="shiftStore.closeModal"
                >
                  Back to Counter
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { useShiftStore } from "@/stores/shift";
import currency from "@/utils/currency";

const shiftStore = useShiftStore();

const submitting = ref(false);
const errorMessage = ref("");
const showDenominations = ref(false);

const quickPresets = [
  { label: "Zero Float", amount: 0 },
  { label: "KES 1,000", amount: 1000 },
  { label: "KES 2,000", amount: 2000 },
  { label: "KES 3,000", amount: 3000 },
  { label: "KES 5,000", amount: 5000 },
];

const noteDenominations = [
  { val: 1000, bg: "rgba(178, 126, 70, 0.06)", borderColor: "#ecdccb" },
  { val: 500, bg: "rgba(52, 195, 143, 0.06)", borderColor: "#c8eedd" },
  { val: 200, bg: "rgba(80, 165, 241, 0.06)", borderColor: "#cfe5fa" },
  { val: 100, bg: "rgba(244, 106, 106, 0.06)", borderColor: "#fad2d2" },
  { val: 50, bg: "rgba(241, 180, 76, 0.06)", borderColor: "#fae8c8" },
];

const form = reactive({
  branch_id: null,
  opening_float: 1000,
  opening_notes: "",
});

const denominations = reactive({
  1000: 0,
  500: 0,
  200: 0,
  100: 0,
  50: 0,
  coins: 0,
});

const denominationsTotal = computed(() => {
  let sum = 0;
  for (const n of noteDenominations) {
    sum += (denominations[n.val] || 0) * n.val;
  }
  sum += Number(denominations.coins || 0);
  return sum;
});

function selectPreset(amount) {
  form.opening_float = amount;
  // If presets selected, zero out denomination breakdown unless user actively counts
  if (!showDenominations.value) {
    resetDenominations();
  }
}

function toggleDenominations() {
  showDenominations.value = !showDenominations.value;
  if (showDenominations.value && denominationsTotal.value === 0 && form.opening_float > 0) {
    // Attempt friendly auto-breakdown for common amounts (e.g. 1000 -> 1x1000)
    autoBreakdown(form.opening_float);
  }
}

function autoBreakdown(target) {
  let remaining = target;
  resetDenominations();
  for (const n of noteDenominations) {
    if (remaining >= n.val) {
      const count = Math.floor(remaining / n.val);
      denominations[n.val] = count;
      remaining -= count * n.val;
    }
  }
  denominations.coins = remaining;
}

function changeNoteCount(noteVal, delta) {
  const current = denominations[noteVal] || 0;
  const next = Math.max(0, current + delta);
  denominations[noteVal] = next;
  syncFromDenominations();
}

function syncFromDenominations() {
  form.opening_float = denominationsTotal.value;
}

function resetDenominations() {
  for (const n of noteDenominations) {
    denominations[n.val] = 0;
  }
  denominations.coins = 0;
}

function onBranchChange() {
  errorMessage.value = "";
  shiftStore.checkCurrentShift(form.branch_id);
}

function formatMoney(amount) {
  return currency.formatKES(amount ?? 0);
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

async function handleOpenShift() {
  errorMessage.value = "";
  if (!form.branch_id) {
    errorMessage.value = "Please select a branch.";
    return;
  }

  if (form.opening_float < 0 || isNaN(form.opening_float)) {
    errorMessage.value = "Please enter a valid starting float amount.";
    return;
  }

  submitting.value = true;
  const payload = {
    branch_id: form.branch_id,
    opening_float: Number(form.opening_float),
    opening_notes: form.opening_notes || null,
  };

  if (showDenominations.value && denominationsTotal.value > 0) {
    payload.opening_denominations = { ...denominations };
  }

  const result = await shiftStore.openShift(payload);
  submitting.value = false;

  if (!result.success) {
    errorMessage.value = result.error;
  }
}

async function handleJoinShift() {
  errorMessage.value = "";
  submitting.value = true;
  const result = await shiftStore.joinActiveShift();
  submitting.value = false;

  if (!result.success) {
    errorMessage.value = result.error;
  }
}

watch(
  () => shiftStore.selectedBranchId,
  (val) => {
    if (val) form.branch_id = val;
  },
  { immediate: true }
);

watch(
  () => shiftStore.isModalOpen,
  (open) => {
    if (open) {
      errorMessage.value = "";
      if (shiftStore.selectedBranchId) {
        form.branch_id = shiftStore.selectedBranchId;
      }
    }
  }
);

onMounted(async () => {
  await shiftStore.fetchBranches();
  if (shiftStore.selectedBranchId) {
    form.branch_id = shiftStore.selectedBranchId;
  }
});
</script>

<style scoped>
.cash-input-card {
  background: #f8faff;
  border-color: #ced4da !important;
  box-shadow: none !important;
}
.denomination-box {
  min-height: 116px;
  box-shadow: none !important;
  transition: all 0.15s ease;
}
.modal-content,
.btn,
.badge,
input {
  box-shadow: none !important;
}
.custom-scroll::-webkit-scrollbar {
  width: 5px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 4px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
.letter-spacing-1 {
  letter-spacing: 0.5px;
}
.cursor-pointer {
  cursor: pointer;
}
.fs-10 {
  font-size: 10px;
}
.fs-11 {
  font-size: 11px;
}
.fs-12 {
  font-size: 12px;
}
.fs-13 {
  font-size: 13px;
}
.fs-14 {
  font-size: 14px;
}
</style>
