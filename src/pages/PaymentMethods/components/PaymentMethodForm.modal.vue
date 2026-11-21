<template>
  <div
    class="modal fade"
    :class="{ show: visible }"
    tabindex="-1"
    :style="{ display: visible ? 'block' : 'none' }"
    :aria-hidden="visible ? 'false' : 'true'"
  >
    <div
      class="modal-dialog modal-lg modal-dialog-centered modal-fullscreen-sm-down modal-dialog-scrollable"
      style="max-width: 720px;"
    >
      <div class="modal-content border-0" style="border-radius: 12px; border: 1px solid #eef0f4 !important; box-shadow: none !important;">
        <!-- Header -->
        <div class="modal-header border-bottom py-3 px-4" style="border-color: #f0f2f5 !important;">
          <div>
            <h5 class="modal-title fw-bold text-dark fs-5 mb-1">
              {{ isEdit ? `Edit Payment Account` : "Add Payment Account / Mode" }}
            </h5>
            <p class="text-muted small mb-0">
              Configure how your business receives funds across M-Pesa, Bank Accounts, Cards, and Cash.
            </p>
          </div>
          <button
            type="button"
            class="btn p-0 border-0"
            @click="close"
            :disabled="submitting"
            style="width: 32px; height: 32px; border-radius: 50%; background: #f3f4f6; display: grid; place-items: center;"
          >
            <Icon icon="ri:close-line" class="fs-4 text-secondary" />
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body p-4">
          <!-- Server Error Banner -->
          <div v-if="serverError" class="alert alert-danger py-2 px-3 small mb-3 border-0 rounded-3">
            <div class="d-flex align-items-center gap-2">
              <Icon icon="ri:error-warning-fill" class="fs-5 flex-shrink-0" />
              <div>{{ serverError }}</div>
            </div>
          </div>

          <!-- Step 1: Select Payment Type -->
          <div class="mb-4">
            <label class="form-label fw-bold text-dark small text-uppercase letter-spacing-1 mb-2">
              1. Choose Payment Channel
            </label>
            <div class="row g-2">
              <div
                v-for="item in channelOptions"
                :key="item.value"
                class="col-6 col-sm-4 col-md-3"
              >
                <div
                  class="p-2 text-center rounded-3 cursor-pointer transition-all border"
                  :style="getTypeCardStyle(item.value)"
                  @click="selectType(item.value)"
                >
                  <div
                    class="avatar-xs mx-auto mb-1 rounded-circle d-flex align-items-center justify-content-center"
                    :style="getTypeIconBgStyle(item.value)"
                  >
                    <Icon :icon="item.icon" class="fs-5" :style="{ color: item.iconColor }" />
                  </div>
                  <div class="fw-bold font-size-12 text-truncate text-dark">{{ item.title }}</div>
                  <div class="text-muted font-size-10 text-truncate">{{ item.subtitle }}</div>
                </div>
              </div>
            </div>
            <div v-if="errors.type" class="text-danger small mt-1">{{ errors.type }}</div>
          </div>

          <!-- Step 2: Account Details -->
          <div class="mb-3">
            <label class="form-label fw-bold text-dark small text-uppercase letter-spacing-1 mb-2">
              2. Account & Identifier Details
            </label>

            <!-- Bank Selector (Conditional for Bank PayBill & Bank Account) -->
            <div v-if="selectedTypeRequiresBank" class="mb-3">
              <label class="form-label fw-semibold small text-dark">
                Commercial Bank <span class="text-danger">*</span>
              </label>
              <select
                class="form-select"
                v-model="form.bank_id"
                @change="onBankChange"
                :disabled="submitting"
                style="border-color: #e2e8f0;"
              >
                <option :value="null">-- Select Kenyan Commercial Bank --</option>
                <option v-for="b in banks" :key="b.id" :value="b.id">
                  {{ b.name }} ({{ b.short_name }})
                  <template v-if="b.primary_paybill"> - PayBill: {{ b.primary_paybill }}</template>
                </option>
              </select>
              <small class="text-muted">
                Select your banking institution to link USSD instructions and routing.
              </small>
              <div v-if="errors.bank_id" class="text-danger small mt-1">{{ errors.bank_id }}</div>
            </div>

            <div class="row g-3">
              <!-- Account Name / Label -->
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold small text-dark">
                  {{ accountNameLabel }} <span class="text-danger">*</span>
                </label>
                <input
                  type="text"
                  class="form-control"
                  v-model="form.name"
                  :placeholder="accountNamePlaceholder"
                  :disabled="submitting"
                  maxlength="100"
                  style="border-color: #e2e8f0;"
                />
                <small class="text-muted">{{ accountNameHint }}</small>
                <div v-if="errors.name" class="text-danger small mt-1">{{ errors.name }}</div>
              </div>

              <!-- Identifier (Till Number / PayBill / Phone / Terminal ID) -->
              <div v-if="form.type !== 'cash'" class="col-12 col-md-6">
                <label class="form-label fw-semibold small text-dark d-flex align-items-center justify-content-between">
                  <span>
                    {{ identifierLabel }}
                    <span v-if="identifierRequired" class="text-danger">*</span>
                  </span>
                  <span v-if="detectedBank && form.type === 'bank_paybill'" class="badge bg-success-subtle text-success font-size-11 d-flex align-items-center gap-1">
                    <Icon icon="ri:checkbox-circle-fill" /> {{ detectedBank.short_name || detectedBank.name }}
                  </span>
                </label>
                <div class="position-relative">
                  <input
                    type="text"
                    class="form-control"
                    v-model="form.identifier"
                    @input="onIdentifierInput"
                    :placeholder="identifierPlaceholder"
                    :disabled="submitting"
                    maxlength="100"
                    style="border-color: #e2e8f0;"
                  />
                </div>

                <!-- Detected Bank Helper Strip -->
                <div v-if="detectedBank && form.type === 'bank_paybill'" class="d-flex align-items-center gap-1 text-success font-size-12 mt-1 fw-semibold">
                  <Icon icon="ri:bank-line" />
                  <span>Bank Recognized: {{ detectedBank.name }}</span>
                  <span v-if="detectedBank.ussd_code" class="badge bg-light text-secondary ms-1">{{ detectedBank.ussd_code }}</span>
                </div>

                <!-- Suggestion to switch if typed on M-Pesa PayBill -->
                <div
                  v-if="detectedBank && form.type === 'mpesa_paybill'"
                  class="alert alert-info py-2 px-3 font-size-12 mt-2 mb-0 d-flex flex-wrap align-items-center justify-content-between gap-2 rounded-2"
                >
                  <div class="d-flex align-items-center gap-2">
                    <Icon icon="ri:bank-line" class="fs-5 text-primary flex-shrink-0" />
                    <span>
                      PayBill <strong>{{ form.identifier }}</strong> belongs to <strong>{{ detectedBank.name }}</strong>.
                    </span>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-primary py-0 px-2 fw-semibold text-nowrap"
                    @click="switchToBankPaybill(detectedBank)"
                  >
                    Switch to Bank PayBill
                  </button>
                </div>

                <small v-else class="text-muted">{{ identifierHint }}</small>
                <div v-if="errors.identifier" class="text-danger small mt-1">{{ errors.identifier }}</div>
              </div>

              <!-- Account Number (For PayBills and Bank Accounts) -->
              <div v-if="showAccountNumberField" class="col-12 col-md-6">
                <label class="form-label fw-semibold small text-dark">
                  {{ accountNumberLabel }}
                  <span v-if="accountNumberRequired" class="text-danger">*</span>
                </label>
                <input
                  type="text"
                  class="form-control"
                  v-model="form.account_number"
                  :placeholder="accountNumberPlaceholder"
                  :disabled="submitting"
                  maxlength="100"
                  style="border-color: #e2e8f0;"
                />
                <small class="text-muted">{{ accountNumberHint }}</small>
                <div v-if="errors.account_number" class="text-danger small mt-1">{{ errors.account_number }}</div>
              </div>

              <!-- Branch Assignment -->
              <div class="col-12 col-md-6">
                <label class="form-label fw-semibold small text-dark">
                  Branch Assignment
                </label>
                <select
                  class="form-select"
                  v-model="form.branch_id"
                  :disabled="submitting"
                  style="border-color: #e2e8f0;"
                >
                  <option :value="null">All Branches (Global / Shared)</option>
                  <option v-for="br in branches" :key="br.id" :value="br.id">
                    {{ br.name }} {{ br.code ? `(${br.code})` : '' }}
                  </option>
                </select>
                <small class="text-muted">Limit this payment method to a specific branch or make it universal.</small>
              </div>
            </div>
          </div>

          <!-- Customer Instructions -->
          <div class="mb-4">
            <label class="form-label fw-semibold small text-dark">
              Customer Payment Instructions
            </label>
            <textarea
              class="form-control"
              rows="2"
              v-model="form.instructions"
              :placeholder="instructionsPlaceholder"
              :disabled="submitting"
              maxlength="500"
              style="border-color: #e2e8f0; resize: vertical;"
            ></textarea>
            <small class="text-muted">Printed on customer receipts, PDF invoices, and displayed on POS checkout.</small>
          </div>

          <!-- Isolated Toggle 1: Set as Primary -->
          <div
            class="card border p-3 mb-3 rounded-3 transition-all"
            :class="form.is_primary ? 'border-warning-subtle bg-warning bg-opacity-10' : 'bg-light bg-opacity-50'"
            style="box-shadow: none !important; border-color: #e5e7eb !important;"
          >
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                  <Icon icon="ri:star-fill" class="text-warning fs-5" />
                  <h6 class="fw-bold text-dark mb-0 font-size-14">
                    Set as Primary {{ selectedChannelTitle }}
                  </h6>
                  <span
                    v-if="form.is_primary"
                    class="badge bg-warning text-dark px-2 py-0.5 font-size-11 fw-semibold"
                  >
                    Default Account
                  </span>
                </div>
                <p class="text-muted small mb-0">
                  {{ form.is_primary
                      ? 'This account will be printed on customer invoices and presented as the first option at checkout.'
                      : 'Make this the default receiving account for this payment category.' }}
                </p>
              </div>
              <div class="form-check form-switch form-switch-lg mb-0 flex-shrink-0 ms-3">
                <input
                  class="form-check-input cursor-pointer"
                  type="checkbox"
                  role="switch"
                  id="methodIsPrimary"
                  v-model="form.is_primary"
                  :disabled="submitting"
                />
                <label class="form-check-label" for="methodIsPrimary"></label>
              </div>
            </div>
          </div>

          <!-- Isolated Toggle 2: Active for Payments -->
          <div
            class="card border p-3 mb-2 rounded-3 transition-all"
            :class="form.is_active ? 'border-success-subtle bg-success bg-opacity-10' : 'bg-light bg-opacity-50'"
            style="box-shadow: none !important; border-color: #e5e7eb !important;"
          >
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                  <span
                    class="d-inline-block rounded-circle"
                    :style="{ width: '10px', height: '10px', background: form.is_active ? '#10b981' : '#94a3b8' }"
                  ></span>
                  <h6 class="fw-bold text-dark mb-0 font-size-14">Payment Receiving Status</h6>
                  <span
                    class="badge px-2 py-0.5 font-size-11 fw-semibold"
                    :class="form.is_active ? 'bg-success text-white' : 'bg-secondary text-white'"
                  >
                    {{ form.is_active ? 'Active & Ready' : 'Disabled / Suspended' }}
                  </span>
                </div>
                <p class="text-muted small mb-0">
                  {{ form.is_active
                      ? 'Account is active: visible to cashiers during till sessions and ready to receive customer payments.'
                      : 'Account is temporarily disabled: hidden from cashier tills and POS checkout.' }}
                </p>
              </div>
              <div class="form-check form-switch form-switch-lg mb-0 flex-shrink-0 ms-3">
                <input
                  class="form-check-input cursor-pointer"
                  type="checkbox"
                  role="switch"
                  id="methodIsActive"
                  v-model="form.is_active"
                  :disabled="submitting"
                />
                <label class="form-check-label" for="methodIsActive"></label>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer border-top py-3 px-4 d-flex justify-content-between" style="border-color: #f0f2f5 !important;">
          <button
            type="button"
            class="btn btn-light px-3 fw-medium"
            @click="close"
            :disabled="submitting"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary px-4 fw-semibold d-flex align-items-center gap-2"
            @click="submitForm"
            :disabled="submitting"
            style="background: #2563eb; border-color: #2563eb;"
          >
            <span v-if="submitting" class="spinner-border spinner-border-sm" role="status"></span>
            <Icon v-else icon="ri:check-line" class="fs-5" />
            <span>{{ isEdit ? "Save Changes" : "Create Account" }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Backdrop -->
  <div v-if="visible" class="modal-backdrop fade show" @click="close"></div>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import paymentMethodsApi from "@/api/paymentMethods";

const props = defineProps({
  visible: { type: Boolean, default: false },
  method: { type: Object, default: null },
  banks: { type: Array, default: () => [] },
  branches: { type: Array, default: () => [] },
});

const emit = defineEmits(["close", "saved"]);

const isEdit = computed(() => !!props.method?.id);
const submitting = ref(false);
const serverError = ref("");
const errors = reactive({});

// Supported channels catalog
const channelOptions = [
  {
    value: "mpesa_till",
    title: "M-Pesa Till",
    subtitle: "Buy Goods",
    icon: "ri:smartphone-line",
    iconColor: "#059669",
    category: "mobile_money",
  },
  {
    value: "mpesa_paybill",
    title: "M-Pesa PayBill",
    subtitle: "Business No.",
    icon: "ri:qr-code-line",
    iconColor: "#0284c7",
    category: "mobile_money",
  },
  {
    value: "pochi_la_biashara",
    title: "Pochi la Biashara",
    subtitle: "Trader Phone",
    icon: "material-symbols:phone-android-rounded",
    iconColor: "#16a34a",
    category: "mobile_money",
  },
  {
    value: "bank_paybill",
    title: "Bank PayBill",
    subtitle: "KCB, Equity, Co-op",
    icon: "ri:bank-card-2-line",
    iconColor: "#7c3aed",
    category: "bank",
  },
  {
    value: "bank_account",
    title: "Bank Account",
    subtitle: "PesaLink / EFT",
    icon: "ri:bank-line",
    iconColor: "#4f46e5",
    category: "bank",
  },
  {
    value: "cash",
    title: "Cash Drawer",
    subtitle: "Counter Till",
    icon: "ri:cash-line",
    iconColor: "#d97706",
    category: "cash",
  },
  {
    value: "card",
    title: "Card Terminal",
    subtitle: "PDQ / POS",
    icon: "ri:bank-card-line",
    iconColor: "#0d9488",
    category: "card",
  },
];

// Form Model
const form = reactive({
  type: "mpesa_till",
  name: "",
  identifier: "",
  account_number: "",
  bank_id: null,
  branch_id: null,
  is_primary: false,
  is_active: true,
  instructions: "",
});

// Watch method prop to populate form
watch(
  () => props.method,
  (m) => {
    resetErrors();
    if (m) {
      form.type = m.type || "mpesa_till";
      form.name = m.name || "";
      form.identifier = m.identifier || "";
      form.account_number = m.account_number || "";
      form.bank_id = m.bank?.id || m.bank_id || null;
      form.branch_id = m.branch?.id || m.branch_id || null;
      form.is_primary = !!m.is_primary;
      form.is_active = m.is_active !== undefined ? !!m.is_active : true;
      form.instructions = m.instructions || "";
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

function resetForm() {
  form.type = "mpesa_till";
  form.name = "";
  form.identifier = "";
  form.account_number = "";
  form.bank_id = null;
  form.branch_id = null;
  form.is_primary = false;
  form.is_active = true;
  form.instructions = "";
  resetErrors();
}

function resetErrors() {
  serverError.value = "";
  Object.keys(errors).forEach((k) => delete errors[k]);
}

const defaultInstructionSnippets = [
  "Lipa na M-Pesa > Buy Goods and Services",
  "Lipa na M-Pesa > PayBill",
  "Lipa na M-Pesa > Pochi la Biashara",
  "Direct bank transfer via PesaLink or RTGS",
  "Cash payments accepted in KES at the counter",
  "Visa, Mastercard, & mobile tap accepted",
];

function selectType(t) {
  if (form.type === t) return;
  form.type = t;
  if (!isEdit.value) {
    if (defaultInstructionSnippets.some((snippet) => form.instructions.includes(snippet)) || !form.instructions) {
      form.instructions = "";
    }
    if (!["bank_paybill", "bank_account"].includes(t)) {
      form.bank_id = null;
    }
    if (t === "cash") {
      form.identifier = "";
      form.account_number = "";
    }
    suggestDefaults(t);
  }
}

// Automatic Commercial Bank Detection from PayBill numbers
const detectedBank = computed(() => {
  const clean = (form.identifier || "").toString().trim();
  if (!clean || clean.length < 3) return null;

  return (
    props.banks.find((b) => {
      if (b.primary_paybill && String(b.primary_paybill).trim() === clean) return true;
      if (Array.isArray(b.paybills) && b.paybills.some((p) => String(p).trim() === clean)) return true;
      return false;
    }) || null
  );
});

function onIdentifierInput() {
  const bank = detectedBank.value;
  if (bank) {
    if (form.type === "bank_paybill") {
      form.bank_id = bank.id;
      if (!form.name || form.name === "Bank Collection PayBill" || form.name.endsWith("PayBill")) {
        form.name = `${bank.name} PayBill`;
      }
      if (!form.instructions || form.instructions.includes("M-Pesa > PayBill") || defaultInstructionSnippets.some((s) => form.instructions.includes(s))) {
        const acLabel = bank.account_label || "Bank Account Number";
        form.instructions = `M-Pesa > PayBill > Business No: ${bank.primary_paybill || form.identifier} > Account No: [Your ${acLabel}]`;
      }
    }
  }
}

function switchToBankPaybill(bank) {
  form.type = "bank_paybill";
  form.bank_id = bank.id;
  if (!form.name || form.name === "Direct M-Pesa PayBill" || form.name === "Bank Collection PayBill") {
    form.name = `${bank.name} PayBill`;
  }
  const acLabel = bank.account_label || "Bank Account Number";
  form.instructions = `M-Pesa > PayBill > Business No: ${bank.primary_paybill || form.identifier} > Account No: [Your ${acLabel}]`;
}

function onBankChange() {
  if (form.type === "bank_paybill" && form.bank_id) {
    const selectedBank = props.banks.find((b) => b.id === form.bank_id);
    if (selectedBank?.primary_paybill) {
      form.identifier = selectedBank.primary_paybill;
    }
    if (selectedBank) {
      if (!form.name || form.name === "Bank Collection PayBill" || form.name.endsWith("PayBill")) {
        form.name = `${selectedBank.name} PayBill`;
      }
      const acLabel = selectedBank.account_label || "Bank Account Number";
      form.instructions = `M-Pesa > PayBill > Business No: ${selectedBank.primary_paybill || form.identifier || ""} > Account No: [Your ${acLabel}]`;
    }
  }
}

function suggestDefaults(type) {
  switch (type) {
    case "mpesa_till":
      if (!form.name) form.name = "Main Counter Till";
      if (!form.instructions) form.instructions = "Lipa na M-Pesa > Buy Goods and Services";
      break;
    case "mpesa_paybill":
      if (!form.name) form.name = "Direct M-Pesa PayBill";
      if (!form.instructions) form.instructions = "Lipa na M-Pesa > PayBill";
      break;
    case "pochi_la_biashara":
      if (!form.name) form.name = "Pochi la Biashara";
      if (!form.instructions) form.instructions = "Lipa na M-Pesa > Pochi la Biashara";
      break;
    case "bank_paybill":
      if (!form.name) form.name = "Bank Collection PayBill";
      break;
    case "bank_account":
      if (!form.name) form.name = "Commercial Bank Operating Account";
      if (!form.instructions) form.instructions = "Direct bank transfer via PesaLink or RTGS";
      break;
    case "cash":
      if (!form.name) form.name = "Counter Cash Drawer";
      form.identifier = "";
      form.account_number = "";
      form.bank_id = null;
      if (!form.instructions) form.instructions = "Cash payments accepted in KES at the counter";
      break;
    case "card":
      if (!form.name) form.name = "Card Terminal PDQ";
      if (!form.instructions) form.instructions = "Visa, Mastercard, & mobile tap accepted";
      break;
  }
}

// Helpers & Styling
function getTypeCardStyle(value) {
  const isSelected = form.type === value;
  return {
    borderColor: isSelected ? "#2563eb" : "#e5e7eb",
    backgroundColor: isSelected ? "#eff6ff" : "#ffffff",
    boxShadow: "none",
  };
}

function getTypeIconBgStyle(value) {
  const isSelected = form.type === value;
  return {
    backgroundColor: isSelected ? "#dbeafe" : "#f3f4f6",
  };
}

// Dynamic computed properties based on selected type
const selectedTypeRequiresBank = computed(() => {
  return form.type === "bank_paybill" || form.type === "bank_account";
});

const selectedChannelTitle = computed(() => {
  const ch = channelOptions.find((c) => c.value === form.type);
  return ch ? ch.title : "Mode";
});

const accountNameLabel = computed(() => {
  switch (form.type) {
    case "cash":
      return "Drawer / Register Name";
    case "card":
      return "Terminal / PDQ Name";
    case "pochi_la_biashara":
      return "Trader / Business Name";
    case "bank_account":
      return "Bank Account Name";
    default:
      return "Display / Store Name";
  }
});

const accountNamePlaceholder = computed(() => {
  switch (form.type) {
    case "cash":
      return "e.g. Main Counter Drawer 1";
    case "card":
      return "e.g. Counter 1 Visa/Mastercard PDQ";
    case "pochi_la_biashara":
      return "e.g. Mama Mboga Pochi";
    case "bank_account":
      return "e.g. Kwa Maina Bar Operations A/C";
    case "bank_paybill":
      return "e.g. KCB PayBill Collection";
    case "mpesa_till":
      return "e.g. Bar Counter Till";
    default:
      return "e.g. Main M-Pesa PayBill";
  }
});

const accountNameHint = computed(() => {
  return "How this account is named on reports, receipts, and staff screens.";
});

const identifierLabel = computed(() => {
  switch (form.type) {
    case "mpesa_till":
      return "Buy Goods Till Number";
    case "mpesa_paybill":
      return "M-Pesa PayBill Number";
    case "pochi_la_biashara":
      return "Trader Mobile Phone";
    case "bank_paybill":
      return "Bank PayBill Number";
    case "bank_account":
      return "Branch / Sort Code (Optional)";
    case "card":
      return "Terminal ID (TID) / Serial";
    default:
      return "Identifier / Number";
  }
});

const identifierPlaceholder = computed(() => {
  switch (form.type) {
    case "mpesa_till":
      return "e.g. 542123";
    case "mpesa_paybill":
      return "e.g. 400200 or 888880";
    case "pochi_la_biashara":
      return "e.g. 0712345678";
    case "bank_paybill":
      return "e.g. 522522 (KCB), 247247 (Equity)";
    case "bank_account":
      return "e.g. Nairobi Branch / 01100";
    case "card":
      return "e.g. TID-908123";
    default:
      return "";
  }
});

const identifierHint = computed(() => {
  switch (form.type) {
    case "mpesa_till":
      return "Safaricom 5 to 7-digit Till Number.";
    case "mpesa_paybill":
      return "5 to 6-digit business PayBill number.";
    case "pochi_la_biashara":
      return "Safaricom number registered for Pochi.";
    case "bank_paybill":
      return "Commercial bank shared PayBill number.";
    default:
      return "Official identifier assigned to this device or channel.";
  }
});

const identifierRequired = computed(() => {
  return ["mpesa_till", "mpesa_paybill", "pochi_la_biashara", "bank_paybill"].includes(form.type);
});

const showAccountNumberField = computed(() => {
  return ["mpesa_paybill", "bank_paybill", "bank_account"].includes(form.type);
});

const accountNumberLabel = computed(() => {
  switch (form.type) {
    case "bank_account":
    case "bank_paybill":
      return "Bank Account Number";
    case "mpesa_paybill":
      return "Account Number / Reference Hint";
    default:
      return "Account Number";
  }
});

const accountNumberPlaceholder = computed(() => {
  switch (form.type) {
    case "bank_account":
    case "bank_paybill":
      return "e.g. 0112938475600";
    case "mpesa_paybill":
      return "e.g. Invoice Number, or Fixed A/C";
    default:
      return "";
  }
});

const accountNumberHint = computed(() => {
  switch (form.type) {
    case "bank_account":
    case "bank_paybill":
      return "Commercial bank account where money settles.";
    case "mpesa_paybill":
      return "What customer enters as the Account Number.";
    default:
      return "";
  }
});

const accountNumberRequired = computed(() => {
  return form.type === "bank_account" || form.type === "bank_paybill";
});

const instructionsPlaceholder = computed(() => {
  switch (form.type) {
    case "mpesa_till":
      return "e.g. Lipa na M-Pesa > Buy Goods > Enter Till 542123";
    case "mpesa_paybill":
      return "e.g. Lipa na M-Pesa > PayBill > Business No 400200 > Account No [Invoice #]";
    case "bank_paybill":
      return "e.g. M-Pesa > PayBill > 522522 > Account [Your Bank Account]";
    default:
      return "e.g. Payment guidelines for customers and cashiers";
  }
});

function validate() {
  resetErrors();
  let valid = true;

  if (!form.type) {
    errors.type = "Please select a payment channel.";
    valid = false;
  }

  if (!form.name || !form.name.trim()) {
    errors.name = "Account name is required.";
    valid = false;
  }

  if (selectedTypeRequiresBank.value && !form.bank_id) {
    errors.bank_id = "Please select a commercial bank.";
    valid = false;
  }

  if (identifierRequired.value && (!form.identifier || !form.identifier.trim())) {
    errors.identifier = `${identifierLabel.value} is required.`;
    valid = false;
  }

  if (accountNumberRequired.value && (!form.account_number || !form.account_number.trim())) {
    errors.account_number = `${accountNumberLabel.value} is required.`;
    valid = false;
  }

  return valid;
}

async function submitForm() {
  if (!validate()) return;

  submitting.value = true;
  serverError.value = "";

  const payload = {
    type: form.type,
    name: form.name.trim(),
    identifier: form.identifier ? form.identifier.trim() : null,
    account_number: form.account_number ? form.account_number.trim() : null,
    bank_id: form.bank_id || null,
    branch_id: form.branch_id || null,
    is_primary: !!form.is_primary,
    is_active: !!form.is_active,
    instructions: form.instructions ? form.instructions.trim() : null,
  };

  try {
    let res;
    if (isEdit.value) {
      res = await paymentMethodsApi.update(props.method.id, payload);
    } else {
      res = await paymentMethodsApi.create(payload);
    }
    submitting.value = false;
    emit("saved", res.data?.data || payload);
    emit("close");
  } catch (err) {
    submitting.value = false;
    if (err.response?.status === 422 && err.response?.data?.errors) {
      Object.assign(errors, err.response.data.errors);
      serverError.value = err.response?.data?.message || "Please check the highlighted fields.";
    } else {
      serverError.value =
        err.response?.data?.message || err.message || "Failed to save payment account.";
    }
  }
}

function close() {
  if (submitting.value) return;
  emit("close");
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.transition-all {
  transition: all 0.15s ease-in-out;
}
.letter-spacing-1 {
  letter-spacing: 0.05em;
}
</style>
