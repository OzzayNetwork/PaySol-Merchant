<template>
  <div
    v-if="visible && item"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(15, 23, 42, 0.55); z-index: 1060;"
    @click.self="closeModal"
  >
    <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
      <div class="modal-content border-0 rounded-3 shadow">
        <!-- Header -->
        <div class="modal-header bg-white border-bottom py-3 px-4">
          <div class="d-flex align-items-center gap-2 min-w-0">
            <div
              class="d-flex align-items-center justify-content-center rounded-2 bg-primary-subtle text-primary border border-primary-subtle flex-shrink-0"
              style="width: 34px; height: 34px;"
            >
              <Icon icon="ri:price-tag-3-line" class="fs-5" />
            </div>
            <div class="min-w-0">
              <h5 class="modal-title font-size-15 fw-bold mb-0 text-dark">
                {{ step === 'otp' ? 'Manager OTP Approval' : 'Item Discount' }}
              </h5>
              <small class="text-muted font-size-12 text-truncate d-block">
                {{ item.product?.name }} · ×{{ item.quantity }}
              </small>
            </div>
          </div>
          <button type="button" class="btn-close shadow-none" :disabled="submitting" @click="closeModal"></button>
        </div>

        <!-- Body -->
        <div class="modal-body p-4 d-flex flex-column gap-3">
          <!-- Line Summary Card (with subtle borders on details) -->
          <div class="rounded overflow-hidden discount-details-box">
            <div class="d-flex align-items-center justify-content-between font-size-12 text-muted px-3 py-2 discount-detail-row">
              <span>Line Subtotal ({{ item.quantity }} × {{ formatMoney(item.unit_price) }})</span>
              <span class="fw-semibold text-dark">{{ formatMoney(lineSubtotal) }}</span>
            </div>
            <div class="d-flex align-items-center justify-content-between font-size-12 text-muted px-3 py-2 discount-detail-row">
              <span>Discount</span>
              <span class="fw-bold text-danger">-{{ formatMoney(computedDiscountAmount) }}</span>
            </div>
            <div class="d-flex align-items-center justify-content-between px-3 py-2 bg-white">
              <span class="fw-bold font-size-13 text-dark">New Line Total</span>
              <span class="fw-bold font-size-16 text-success">{{ formatMoney(netLineTotal) }}</span>
            </div>
          </div>

          <!-- Policy Banner -->
          <ReferenceAlert
            v-if="!allowDiscount"
            tone="danger"
            bordered
            icon="ri:forbid-2-line"
            title="Discounts Disabled"
            message="Discounts are disabled for this item in product settings."
          />

          <template v-else-if="step === 'form'">
            <!-- Policy Tip / Approval Alert (Shared ReferenceAlert) -->
            <ReferenceAlert
              v-if="userCanApprove"
              tone="info"
              bordered
              icon="ri:lightbulb-flash-line"
              title="Tip"
              message="Your role has approval rights — discounts apply immediately under your name."
            />
            <ReferenceAlert
              v-else-if="exceedsLimit"
              tone="warning"
              bordered
              icon="ri:shield-keyhole-line"
              title="Approval Required"
              :message="`Exceeds no-approval limit (${limitLabel}). Submitting will email a unique 6-digit OTP to eligible approvers.`"
            />
            <ReferenceAlert
              v-else
              tone="info"
              bordered
              icon="ri:lightbulb-line"
              title="Tip"
              :message="`No-approval limit for this item: ${limitLabel}.`"
            />

            <!-- Discount Type Tabs + Grouped Input & Category-Style Preset Tags -->
            <div class="rounded bg-white discount-control-box">
              <ul class="nav nav-tabs nav-tabs-custom nav-justified border-bottom mb-0" role="tablist">
                <li class="nav-item" role="presentation">
                  <button
                    type="button"
                    class="nav-link fw-semibold font-size-13 d-flex align-items-center justify-content-center gap-2 py-3"
                    :class="{ active: discountType === 'percent' }"
                    role="tab"
                    :aria-selected="discountType === 'percent'"
                    @click="discountType = 'percent'"
                  >
                    <Icon icon="ri:percent-line" class="fs-5" />
                    <span>Percentage (%)</span>
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button
                    type="button"
                    class="nav-link fw-semibold font-size-13 d-flex align-items-center justify-content-center gap-2 py-3"
                    :class="{ active: discountType === 'fixed' }"
                    role="tab"
                    :aria-selected="discountType === 'fixed'"
                    @click="discountType = 'fixed'"
                  >
                    <Icon icon="ri:money-dollar-circle-line" class="fs-5" />
                    <span>Fixed Amount (KES)</span>
                  </button>
                </li>
              </ul>

              <div class="p-3">
                <label class="form-label fw-bold font-size-12 text-dark mb-2">
                  {{ discountType === 'percent' ? 'Discount Percentage' : 'Discount Amount (KES)' }}
                </label>
                <div class="input-group">
                  <span v-if="discountType === 'fixed'" class="input-group-text bg-light fw-bold text-muted">KES</span>
                  <input
                    v-model.number="discountValue"
                    type="number"
                    min="0"
                    :max="discountType === 'percent' ? 100 : lineSubtotal"
                    step="any"
                    class="form-control fw-bold"
                    :placeholder="discountType === 'percent' ? 'e.g. 10' : 'e.g. 200'"
                  />
                  <span v-if="discountType === 'percent'" class="input-group-text bg-light fw-bold text-muted">%</span>
                </div>

                <!-- Quick Preselection Tags (Category Tags Style, Primary Highlight When Selected) -->
                <div class="d-flex flex-wrap gap-2 mt-3 pt-3 border-top" style="border-color: #dbe2ea !important;">
                  <button
                    v-for="preset in activePresets"
                    :key="preset"
                    type="button"
                    class="btn btn-sm fw-bold btn-rounded waves-effect px-3 text-nowrap"
                    :class="Number(discountValue) === preset ? 'btn-primary text-white' : 'btn-light text-dark'"
                    @click="discountValue = preset"
                  >
                    {{ discountType === 'percent' ? `${preset}%` : `KES ${preset}` }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Mandatory Reason (SelectSearchBox with native taggable + pinned Create row) -->
            <div>
              <label class="form-label fw-bold font-size-12 text-dark mb-2">
                Discount Reason <span class="text-danger">*</span>
              </label>
              <SelectSearchBox
                :model-value="selectedReasonOption === '__other__' ? null : selectedReasonOption"
                :options="reasonSelectOptions"
                placeholder="Search or type a new reason..."
                :is-taggable="true"
                show-create
                create-text="Add New Reason"
                create-btn-title="Add a custom discount reason"
                create-modal-id=""
                input-class="form-control form-select"
                :is-multi="false"
                @update:modelValue="onSelectSearchReason"
                @option-created="onTagReasonCreated"
                @create="openOtherReasonInput"
              />

              <!-- Inline Custom Reason input when pinned "+ Add New Reason" row is clicked -->
              <div v-if="selectedReasonOption === '__other__'" class="mt-2">
                <div class="input-group input-group-sm">
                  <input
                    ref="customReasonInputRef"
                    v-model.trim="customReasonText"
                    type="text"
                    maxlength="120"
                    class="form-control"
                    placeholder="Type new reason (will be saved for reuse)..."
                    @keydown.enter.prevent="addCustomReason"
                  />
                  <button
                    type="button"
                    class="btn btn-primary fw-semibold"
                    :disabled="customReasonText.trim().length < 2"
                    @click="addCustomReason"
                  >
                    + Add
                  </button>
                </div>
                <small class="text-muted font-size-11 d-block mt-1">
                  This reason will be saved to the dropdown for future discounts.
                </small>
              </div>
            </div>

            <div v-if="errorMsg" class="alert alert-danger py-2 px-3 font-size-12 mt-3 mb-0">
              {{ errorMsg }}
            </div>
          </template>

          <!-- Step 2: Enter Approver's Unique 6-digit OTP -->
          <template v-else-if="step === 'otp'">
            <div class="p-3 rounded border bg-primary-subtle border-primary-subtle mb-3">
              <div class="d-flex align-items-center gap-2 mb-1">
                <Icon icon="ri:mail-send-line" class="fs-5 text-primary" />
                <span class="fw-bold font-size-13 text-dark">Unique Approval Codes Sent</span>
              </div>
              <p class="font-size-12 text-muted mb-2">
                Each approver below received their own 6-digit code by email. Keying in their code verifies and records who approved this discount:
              </p>
              <div class="d-flex flex-wrap gap-1">
                <span
                  v-for="ap in approversNotified"
                  :key="ap.email_masked + ap.name"
                  class="badge bg-white text-dark border font-size-11 fw-medium py-1 px-2"
                >
                  {{ ap.name }} <span class="text-muted">({{ ap.email_masked }})</span>
                </span>
              </div>
            </div>

            <div class="mb-2">
              <label class="form-label fw-bold font-size-12 text-dark mb-1">
                Enter 6-Digit Approver Code <span class="text-danger">*</span>
              </label>
              <input
                v-model="otpInput"
                type="text"
                inputmode="numeric"
                maxlength="6"
                class="form-control form-control-lg text-center font-monospace fw-bold"
                style="letter-spacing: 8px; font-size: 22px;"
                placeholder="000000"
                @input="otpInput = otpInput.replace(/\D/g, '').slice(0, 6)"
                @keydown.enter.prevent="submitOtpVerification"
              />
              <div class="d-flex align-items-center justify-content-between mt-2">
                <small class="text-muted font-size-11">Expires in 10 minutes · Single-use</small>
                <button
                  type="button"
                  class="btn btn-link btn-sm p-0 font-size-12 text-decoration-none"
                  :disabled="submitting"
                  @click="submitDiscountRequest"
                >
                  Resend Codes
                </button>
              </div>
            </div>

            <div v-if="errorMsg" class="alert alert-danger py-2 px-3 font-size-12 mt-3 mb-0">
              {{ errorMsg }}
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="modal-footer bg-white border-top py-3 px-4 d-flex justify-content-between align-items-center gap-2">
          <div>
            <button
              v-if="step === 'form' && Number(item.discount_amount) > 0"
              type="button"
              class="btn btn-sm btn-outline-muted-danger"
              :disabled="submitting"
              @click="removeDiscount"
            >
              Remove Discount
            </button>
            <button
              v-else-if="step === 'otp'"
              type="button"
              class="btn btn-sm btn-white"
              :disabled="submitting"
              @click="step = 'form'; errorMsg = ''"
            >
              Back
            </button>
          </div>

          <div class="d-flex align-items-center gap-2">
            <button type="button" class="btn btn-white" :disabled="submitting" @click="closeModal">
              Cancel
            </button>

            <button
              v-if="allowDiscount && step === 'form'"
              type="button"
              class="btn btn-primary fw-semibold d-inline-flex align-items-center gap-2"
              :disabled="submitting || !canSubmitForm"
              @click="submitDiscountRequest"
            >
              <span v-if="submitting" class="spinner-border spinner-border-sm" role="status"></span>
              <Icon v-else :icon="exceedsLimit && !userCanApprove ? 'ri:mail-send-line' : 'ri:check-line'" class="fs-5" />
              <span>{{ exceedsLimit && !userCanApprove ? 'Request Approval OTP' : 'Apply Discount' }}</span>
            </button>

            <button
              v-else-if="allowDiscount && step === 'otp'"
              type="button"
              class="btn btn-primary fw-semibold d-inline-flex align-items-center gap-2"
              :disabled="submitting || otpInput.length !== 6"
              @click="submitOtpVerification"
            >
              <span v-if="submitting" class="spinner-border spinner-border-sm" role="status"></span>
              <Icon v-else icon="ri:shield-check-line" class="fs-5" />
              <span>Verify &amp; Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/auth";
import { useShiftStore } from "@/stores/shift";
import discountsApi from "@/api/discounts";
import SelectSearchBox from "@/components/SelectSearchBox.vue";
import ReferenceAlert from "@/components/ReferenceAlert.vue";

const props = defineProps({
  visible: { type: Boolean, default: false },
  item: { type: Object, default: null },
});

const emit = defineEmits(["close", "applied", "removed"]);

const authStore = useAuthStore();
const shiftStore = useShiftStore();

const step = ref("form"); // 'form' | 'otp'
const discountType = ref("percent");
const discountValue = ref(0);
const selectedReasonOption = ref("");
const customReasonText = ref("");
const customReasonInputRef = ref(null);
const otpInput = ref("");
const pendingRequestId = ref(null);
const approversNotified = ref([]);
const submitting = ref(false);
const errorMsg = ref("");

const DEFAULT_REASONS = [
  "Loyal customer",
  "Promo / Offer",
  "Damaged / Imperfect",
  "Price match",
  "Staff courtesy",
];

function getReasonsStorageKey() {
  const tenantId = authStore.tenant?.id || "default";
  return `psDiscountReasons_${tenantId}`;
}

function loadCustomReasons() {
  try {
    const raw = localStorage.getItem(getReasonsStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((r) => typeof r === "string" && r.trim()) : [];
  } catch {
    return [];
  }
}

const customReasons = ref(loadCustomReasons());

const allReasons = computed(() => {
  const seen = new Set();
  const list = [];
  for (const r of [...DEFAULT_REASONS, ...customReasons.value]) {
    const key = r.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    list.push(r.trim());
  }
  return list;
});

function persistCustomReason(label) {
  const cleaned = (label || "").trim();
  if (cleaned.length < 2) return cleaned;
  const exists = allReasons.value.some((r) => r.toLowerCase() === cleaned.toLowerCase());
  if (!exists) {
    customReasons.value = [...customReasons.value, cleaned];
    try {
      localStorage.setItem(getReasonsStorageKey(), JSON.stringify(customReasons.value));
    } catch {
      // ignore storage quota errors
    }
  }
  return allReasons.value.find((r) => r.toLowerCase() === cleaned.toLowerCase()) || cleaned;
}

const reasonSelectOptions = computed(() =>
  allReasons.value.map((r) => ({ label: r, value: r }))
);

function onTagReasonCreated(newLabel) {
  const text = typeof newLabel === "string" ? newLabel : newLabel?.label || newLabel?.value || "";
  if (text.trim().length < 2) return;
  const saved = persistCustomReason(text);
  selectedReasonOption.value = saved;
}

function openOtherReasonInput() {
  selectedReasonOption.value = "__other__";
  customReasonText.value = "";
  nextTick(() => customReasonInputRef.value?.focus());
}

function onSelectSearchReason(val) {
  if (!val) {
    selectedReasonOption.value = "";
    return;
  }
  selectedReasonOption.value = persistCustomReason(String(val));
}

function addCustomReason() {
  const cleaned = customReasonText.value.trim();
  if (cleaned.length < 2) return;
  const saved = persistCustomReason(cleaned);
  selectedReasonOption.value = saved;
  customReasonText.value = "";
}

const reason = computed(() => {
  if (selectedReasonOption.value === "__other__") {
    return customReasonText.value.trim();
  }
  return (selectedReasonOption.value || "").trim();
});

const activePresets = computed(() =>
  discountType.value === "percent" ? [5, 10, 15, 20] : [50, 100, 200, 500]
);

const lineSubtotal = computed(() => {
  if (!props.item) return 0;
  return Math.round(Number(props.item.quantity || 0) * Number(props.item.unit_price || 0) * 100) / 100;
});

const computedDiscountAmount = computed(() => {
  const val = Number(discountValue.value || 0);
  if (val <= 0 || lineSubtotal.value <= 0) return 0;
  if (discountType.value === "percent") {
    return Math.round(lineSubtotal.value * (Math.min(100, val) / 100) * 100) / 100;
  }
  return Math.round(Math.min(lineSubtotal.value, val) * 100) / 100;
});

const netLineTotal = computed(() =>
  Math.max(0, Math.round((lineSubtotal.value - computedDiscountAmount.value) * 100) / 100)
);

const allowDiscount = computed(() => props.item?.product?.allow_discount ?? true);

const maxWithoutApprovalAmount = computed(() => {
  const prod = props.item?.product;
  const val = prod?.max_discount_without_approval_value;
  if (val == null || Number(val) <= 0) return 0;
  const type = prod?.max_discount_without_approval_type || "percent";
  if (type === "percent") {
    return Math.round(lineSubtotal.value * (Math.min(100, Number(val)) / 100) * 100) / 100;
  }
  return Math.round(Math.min(lineSubtotal.value, Number(val)) * 100) / 100;
});

const limitLabel = computed(() => {
  const prod = props.item?.product;
  const val = prod?.max_discount_without_approval_value;
  if (val == null || Number(val) <= 0) return "KES 0 (requires manager approval)";
  const type = prod?.max_discount_without_approval_type || "percent";
  if (type === "percent") {
    return `${val}% (${formatMoney(maxWithoutApprovalAmount.value)})`;
  }
  return formatMoney(val);
});

const userCanApprove = computed(() => {
  const role = (authStore.role || authStore.membership?.role || "").toLowerCase();
  return role === "owner" || role === "manager";
});

const exceedsLimit = computed(() => {
  return computedDiscountAmount.value > maxWithoutApprovalAmount.value + 0.009;
});

const canSubmitForm = computed(() => {
  return computedDiscountAmount.value > 0 && reason.value.trim().length >= 2;
});

watch(
  () => [props.visible, props.item],
  ([vis, item]) => {
    if (vis && item) {
      customReasons.value = loadCustomReasons();
      step.value = "form";
      discountType.value = item.discount_type || "percent";
      discountValue.value = Number(item.discount_value || 0) || "";
      customReasonText.value = "";
      if (item.discount_reason) {
        selectedReasonOption.value = persistCustomReason(item.discount_reason);
      } else {
        selectedReasonOption.value = "";
      }
      otpInput.value = "";
      pendingRequestId.value = null;
      approversNotified.value = [];
      errorMsg.value = "";
    }
  },
  { immediate: true }
);

function formatMoney(val) {
  return Number(val || 0).toLocaleString("en-US", { style: "currency", currency: "KES" });
}

function closeModal() {
  if (submitting.value) return;
  emit("close");
}

function removeDiscount() {
  if (!props.item) return;
  emit("removed", props.item.id);
}

async function submitDiscountRequest() {
  if (!props.item || !canSubmitForm.value || submitting.value) return;

  // If the user typed a new reason under "Other" and clicked submit directly,
  // save it into the selectable dropdown list right away.
  if (selectedReasonOption.value === "__other__" && customReasonText.value.trim().length >= 2) {
    selectedReasonOption.value = persistCustomReason(customReasonText.value.trim());
    customReasonText.value = "";
  }

  submitting.value = true;
  errorMsg.value = "";
  try {
    const branchId =
      shiftStore.activeShift?.branch_id ||
      shiftStore.selectedBranchId ||
      (shiftStore.branches?.find((b) => b.is_main)?.id || shiftStore.branches?.[0]?.id) ||
      null;

    const { data } = await discountsApi.requestApproval({
      product_id: String(props.item.product?.id || props.item.id),
      branch_id: branchId,
      quantity: Number(props.item.quantity || 1),
      unit_price: Number(props.item.unit_price || 0),
      discount_type: discountType.value,
      discount_value: Number(discountValue.value || 0),
      reason: reason.value.trim(),
    });

    if (data.approved && !data.requires_otp) {
      emit("applied", {
        productId: props.item.id,
        discount_amount: data.discount_amount,
        discount_type: discountType.value,
        discount_value: Number(discountValue.value || 0),
        discount_reason: reason.value.trim(),
        discount_approval_request_id: data.request_id,
        discount_approval_token: data.approval_token,
        discount_approved_by: data.approved_by?.name || null,
        message: data.message,
      });
      return;
    }

    pendingRequestId.value = data.request_id;
    approversNotified.value = data.approvers_notified || [];
    otpInput.value = "";
    step.value = "otp";
  } catch (err) {
    errorMsg.value =
      err.response?.data?.message ||
      Object.values(err.response?.data?.errors || {})?.[0]?.[0] ||
      "Could not process discount request.";
  } finally {
    submitting.value = false;
  }
}

async function submitOtpVerification() {
  if (!pendingRequestId.value || otpInput.value.length !== 6 || submitting.value) return;
  submitting.value = true;
  errorMsg.value = "";
  try {
    const { data } = await discountsApi.verifyOtp({
      request_id: pendingRequestId.value,
      otp: otpInput.value,
    });

    if (data.approved) {
      emit("applied", {
        productId: props.item.id,
        discount_amount: data.discount_amount,
        discount_type: discountType.value,
        discount_value: Number(discountValue.value || 0),
        discount_reason: reason.value.trim(),
        discount_approval_request_id: data.request_id,
        discount_approval_token: data.approval_token,
        discount_approved_by: data.approved_by?.name || "Approver",
        message: data.message,
      });
    }
  } catch (err) {
    errorMsg.value =
      err.response?.data?.message ||
      "Invalid approval code. Please verify with your approver.";
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.discount-details-box {
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
}

.discount-detail-row {
  border-bottom: 1px solid #dbe2ea;
}

.discount-control-box {
  border: 1px solid #cbd5e1;
}
</style>
