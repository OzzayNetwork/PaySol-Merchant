<template>
  <div
    v-if="open"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(15, 23, 42, 0.55); z-index: 1060;"
    @click.self="$emit('close')"
  >
    <div class="modal-dialog modal-dialog-centered" style="max-width: 540px;">
      <div class="modal-content border-0 rounded-3 overflow-hidden shadow">
        <!-- Header -->
        <div class="modal-header bg-white border-bottom py-3 px-4">
          <div class="d-flex align-items-center gap-2.5">
            <span class="avatar-sm flex-shrink-0">
              <span class="avatar-title rounded-circle tone-chip font-size-20" style="--tone: #556ee6;">
                <Icon icon="ri:settings-3-line" />
              </span>
            </span>
            <div>
              <h5 class="modal-title font-size-16 fw-bold mb-0 text-dark">Tab Aging Definitions</h5>
              <small class="text-muted font-size-12">Configure how open tabs transition across aging tiers</small>
            </div>
          </div>
          <button type="button" class="btn-close shadow-none" @click="$emit('close')"></button>
        </div>

        <!-- Body -->
        <div class="modal-body p-4">
          <!-- Role notice -->
          <div v-if="!canManage" class="alert alert-warning py-2 px-3 font-size-12 d-flex align-items-center gap-2 mb-3">
            <Icon icon="ri:lock-line" class="fs-5 flex-shrink-0" />
            <span>Only Owners and Managers can update tab aging definitions.</span>
          </div>

          <!-- Quick Presets -->
          <div class="mb-3">
            <label class="form-label font-size-12 fw-semibold text-muted text-uppercase mb-2">Quick Presets</label>
            <div class="row g-2">
              <div v-for="preset in AGING_PRESETS" :key="preset.key" class="col-12 col-sm-4">
                <button
                  type="button"
                  class="btn w-100 text-start p-2.5 rounded-2 border transition-all shadow-none"
                  :class="isPresetActive(preset) ? 'border-primary bg-primary-subtle' : 'btn-light bg-white'"
                  :disabled="!canManage"
                  @click="applyPreset(preset)"
                >
                  <div class="fw-bold font-size-12 text-dark">{{ preset.label }}</div>
                  <div class="text-muted" style="font-size: 10.5px; line-height: 1.35;">
                    {{ formatMinutesShort(preset.extendedMinutes) }} / {{ formatMinutesShort(preset.overdueMinutes) }}
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Threshold Inputs -->
          <div class="row g-3 mb-3">
            <div class="col-sm-6">
              <label class="form-label font-size-12 fw-semibold text-dark mb-1">
                Extended (Warning) After
              </label>
              <div class="input-group input-group-sm">
                <input
                  v-model.number="form.extendedMinutes"
                  type="number"
                  min="5"
                  max="1440"
                  step="5"
                  class="form-control font-size-13 fw-semibold"
                  :disabled="!canManage"
                />
                <span class="input-group-text bg-light text-muted font-size-12">mins</span>
              </div>
              <small class="text-muted font-size-11">
                = {{ formatMinutesShort(form.extendedMinutes) }} (Fresh is 0 – {{ formatMinutesShort(form.extendedMinutes) }})
              </small>
            </div>

            <div class="col-sm-6">
              <label class="form-label font-size-12 fw-semibold text-dark mb-1">
                Overdue (Critical) After
              </label>
              <div class="input-group input-group-sm">
                <input
                  v-model.number="form.overdueMinutes"
                  type="number"
                  :min="(Number(form.extendedMinutes) || 5) + 5"
                  max="2880"
                  step="5"
                  class="form-control font-size-13 fw-semibold"
                  :disabled="!canManage"
                />
                <span class="input-group-text bg-light text-muted font-size-12">mins</span>
              </div>
              <small class="text-muted font-size-11">
                = {{ formatMinutesShort(form.overdueMinutes) }} (Must exceed Extended)
              </small>
            </div>
          </div>

          <div v-if="validationError" class="alert alert-danger py-2 px-3 font-size-12 mb-3">
            {{ validationError }}
          </div>

          <!-- Live Visual Preview of Aging Tiers -->
          <div class="border rounded-3 p-3 bg-light">
            <div class="font-size-11 fw-bold text-uppercase text-muted mb-2">Live Card Theme Preview</div>
            <div class="d-flex flex-column gap-2">
              <!-- Fresh -->
              <div
                class="d-flex align-items-center justify-content-between px-3 py-2 rounded-2"
                style="background-color: #f1f6fd; border: 1px solid #dbe7f7; border-bottom: 3px solid #93c5fd;"
              >
                <div>
                  <span class="fw-bold font-size-12 text-dark">Fresh / Outstanding</span>
                  <div class="text-muted" style="font-size: 11px;">
                    0 to {{ formatMinutesShort(form.extendedMinutes) }}
                  </div>
                </div>
                <span
                  class="badge font-size-10 px-2.5 py-1 fw-bold rounded-pill"
                  style="background-color: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe;"
                >
                  Outstanding
                </span>
              </div>

              <!-- Extended -->
              <div
                class="d-flex align-items-center justify-content-between px-3 py-2 rounded-2"
                style="background-color: #fdf8ea; border: 1px solid #fae8b6; border-bottom: 3px solid #fde68a;"
              >
                <div>
                  <span class="fw-bold font-size-12 text-dark">Extended Session</span>
                  <div class="text-muted" style="font-size: 11px;">
                    {{ formatMinutesShort(form.extendedMinutes) }} to {{ formatMinutesShort(form.overdueMinutes) }}
                  </div>
                </div>
                <span
                  class="badge font-size-10 px-2.5 py-1 fw-bold rounded-pill"
                  style="background-color: #fef9c3; color: #854d0e; border: 1px solid #fef08a;"
                >
                  Active ({{ formatMinutesShort(form.extendedMinutes) }}+)
                </span>
              </div>

              <!-- Overdue -->
              <div
                class="d-flex align-items-center justify-content-between px-3 py-2 rounded-2"
                style="background-color: #fdf2f2; border: 1px solid #fcdada; border-bottom: 3px solid #fca5a5;"
              >
                <div>
                  <span class="fw-bold font-size-12 text-dark">Overdue / Attention Needed</span>
                  <div class="text-muted" style="font-size: 11px;">
                    More than {{ formatMinutesShort(form.overdueMinutes) }}
                  </div>
                </div>
                <span
                  class="badge font-size-10 px-2.5 py-1 fw-bold rounded-pill"
                  style="background-color: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3;"
                >
                  Overdue ({{ formatMinutesShort(form.overdueMinutes) }}+)
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer bg-white border-top py-2.5 px-4 d-flex justify-content-between align-items-center">
          <button
            v-if="canManage"
            type="button"
            class="btn btn-link text-muted text-decoration-none font-size-12 p-0 shadow-none"
            @click="handleReset"
          >
            Reset to Defaults (2h / 4h)
          </button>
          <span v-else></span>

          <div class="d-flex align-items-center gap-2">
            <button type="button" class="btn btn-sm btn-light border px-3 font-size-12" @click="$emit('close')">
              Cancel
            </button>
            <button
              v-if="canManage"
              type="button"
              class="btn btn-sm btn-primary px-3 font-size-12 fw-semibold"
              :disabled="!!validationError"
              @click="handleSave"
            >
              Save Aging Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { useAuthStore } from '@/stores/auth';
import {
  tabAgingConfig,
  AGING_PRESETS,
  DEFAULT_AGING_CONFIG,
  saveTabAgingConfig,
  resetTabAgingConfig,
  formatMinutesShort,
} from '@/utils/tabAging';

const props = defineProps({
  open: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'saved']);
const authStore = useAuthStore();

const canManage = computed(() => authStore.hasRole(['owner', 'manager']));

const form = reactive({
  extendedMinutes: tabAgingConfig.extendedMinutes,
  overdueMinutes: tabAgingConfig.overdueMinutes,
});

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      form.extendedMinutes = tabAgingConfig.extendedMinutes;
      form.overdueMinutes = tabAgingConfig.overdueMinutes;
    }
  }
);

const validationError = computed(() => {
  const ext = Number(form.extendedMinutes);
  const ov = Number(form.overdueMinutes);
  if (!Number.isFinite(ext) || ext < 5) {
    return 'Extended threshold must be at least 5 minutes.';
  }
  if (!Number.isFinite(ov) || ov <= ext) {
    return 'Overdue threshold must be greater than the Extended threshold.';
  }
  return '';
});

function isPresetActive(preset) {
  return (
    Number(form.extendedMinutes) === preset.extendedMinutes &&
    Number(form.overdueMinutes) === preset.overdueMinutes
  );
}

function applyPreset(preset) {
  if (!canManage.value) return;
  form.extendedMinutes = preset.extendedMinutes;
  form.overdueMinutes = preset.overdueMinutes;
}

function handleReset() {
  if (!canManage.value) return;
  form.extendedMinutes = DEFAULT_AGING_CONFIG.extendedMinutes;
  form.overdueMinutes = DEFAULT_AGING_CONFIG.overdueMinutes;
  const saved = resetTabAgingConfig(authStore.tenant?.id);
  emit('saved', saved);
  emit('close');
}

function handleSave() {
  if (!canManage.value || validationError.value) return;
  const saved = saveTabAgingConfig(
    {
      extendedMinutes: form.extendedMinutes,
      overdueMinutes: form.overdueMinutes,
    },
    authStore.tenant?.id
  );
  emit('saved', saved);
  emit('close');
}
</script>
