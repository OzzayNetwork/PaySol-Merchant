<template>
  <div
    v-if="visible"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(15, 23, 42, 0.55); z-index: 1070;"
    @focusin.stop
    @click.self="close"
  >
    <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
      <div class="modal-content border-0 rounded-3 shadow">
        <div class="modal-header bg-white border-bottom py-3 px-4">
          <div class="d-flex align-items-center gap-2">
            <div
              class="d-flex align-items-center justify-content-center rounded-2 bg-primary-subtle text-primary border border-primary-subtle flex-shrink-0"
              style="width: 34px; height: 34px;"
            >
              <Icon icon="ri:bank-card-line" class="fs-5" />
            </div>
            <div>
              <h5 class="modal-title font-size-15 fw-bold mb-0 text-dark">Add Payment Channel</h5>
              <small class="text-muted font-size-12">Available immediately in checkout</small>
            </div>
          </div>
          <button type="button" class="btn-close shadow-none" :disabled="saving" @click="close"></button>
        </div>

        <form @submit.prevent="submit">
          <div class="modal-body p-4 d-flex flex-column gap-3">
            <div>
              <label class="form-label fw-bold font-size-12 text-dark mb-1">
                Channel Type <span class="text-danger">*</span>
              </label>
              <select v-model="form.type" class="form-select" required>
                <option value="mpesa_till">M-Pesa Buy Goods (Till)</option>
                <option value="mpesa_paybill">M-Pesa PayBill</option>
                <option value="pochi_la_biashara">Pochi la Biashara</option>
                <option value="mpesa_send_money">M-Pesa Send Money</option>
                <option value="bank_paybill">Bank PayBill</option>
                <option value="bank_account">Bank Account</option>
                <option value="card">Card Terminal / PDQ</option>
                <option value="cash">Cash Drawer</option>
              </select>
            </div>

            <div>
              <label class="form-label fw-bold font-size-12 text-dark mb-1">
                Account / Channel Name <span class="text-danger">*</span>
              </label>
              <input
                v-model.trim="form.name"
                type="text"
                class="form-control"
                placeholder="e.g. Main Counter Till or Equity PayBill"
                maxlength="120"
                required
              />
            </div>

            <div v-if="needsBank">
              <label class="form-label fw-bold font-size-12 text-dark mb-1">
                Bank <span class="text-danger">*</span>
              </label>
              <select v-model="form.bank_id" class="form-select" required>
                <option :value="null" disabled>Select bank...</option>
                <option v-for="b in banks" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </div>

            <div v-if="form.type !== 'cash' && form.type !== 'card'" class="row g-2">
              <div :class="needsAccountNumber ? 'col-6' : 'col-12'">
                <label class="form-label fw-bold font-size-12 text-dark mb-1">{{ identifierLabel }}</label>
                <input
                  v-model.trim="form.identifier"
                  type="text"
                  class="form-control font-monospace"
                  :placeholder="identifierPlaceholder"
                  maxlength="60"
                />
              </div>
              <div v-if="needsAccountNumber" class="col-6">
                <label class="form-label fw-bold font-size-12 text-dark mb-1">Account Number</label>
                <input
                  v-model.trim="form.account_number"
                  type="text"
                  class="form-control font-monospace"
                  placeholder="e.g. 01102345678"
                  maxlength="60"
                />
              </div>
            </div>

            <div v-if="errorMsg" class="alert alert-danger py-2 px-3 font-size-12 mb-0">
              {{ errorMsg }}
            </div>
          </div>

          <div class="modal-footer bg-white border-top py-3 px-4 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-white" :disabled="saving" @click="close">Cancel</button>
            <button
              type="submit"
              class="btn btn-primary fw-semibold d-inline-flex align-items-center gap-2"
              :disabled="saving || !form.name.trim()"
            >
              <span v-if="saving" class="spinner-border spinner-border-sm" role="status"></span>
              <Icon v-else icon="ri:check-line" class="fs-5" />
              <span>{{ saving ? 'Saving...' : 'Save Channel' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import paymentMethodsApi from "@/api/paymentMethods";

const props = defineProps({
  visible: { type: Boolean, default: false },
  branchId: { type: [Number, String], default: null },
});

const emit = defineEmits(["close", "created"]);

const saving = ref(false);
const errorMsg = ref("");
const banks = ref([]);

const form = ref({
  type: "mpesa_till",
  name: "",
  identifier: "",
  account_number: "",
  bank_id: null,
});

const needsBank = computed(() => ["bank_paybill", "bank_account"].includes(form.value.type));
const needsAccountNumber = computed(() =>
  ["mpesa_paybill", "bank_paybill", "bank_account"].includes(form.value.type)
);

const identifierLabel = computed(() => {
  if (form.value.type === "mpesa_till") return "Till Number";
  if (form.value.type === "mpesa_paybill" || form.value.type === "bank_paybill") return "PayBill Number";
  if (form.value.type === "pochi_la_biashara" || form.value.type === "mpesa_send_money") return "M-Pesa Phone Number";
  return "Reference / Branch";
});

const identifierPlaceholder = computed(() => {
  if (form.value.type === "mpesa_till") return "e.g. 543210";
  if (form.value.type === "mpesa_paybill" || form.value.type === "bank_paybill") return "e.g. 247247";
  if (form.value.type === "pochi_la_biashara" || form.value.type === "mpesa_send_money") return "e.g. 0712 345 678";
  return "Optional";
});

watch(
  () => props.visible,
  async (vis) => {
    if (vis) {
      errorMsg.value = "";
      form.value = { type: "mpesa_till", name: "", identifier: "", account_number: "", bank_id: null };
      if (!banks.value.length) {
        try {
          const { data } = await paymentMethodsApi.options();
          banks.value = data?.banks || [];
        } catch {
          // non-blocking
        }
      }
    }
  }
);

function close() {
  if (saving.value) return;
  emit("close");
}

async function submit() {
  if (saving.value || !form.value.name.trim()) return;
  saving.value = true;
  errorMsg.value = "";
  try {
    const { data } = await paymentMethodsApi.create({
      type: form.value.type,
      name: form.value.name.trim(),
      identifier: form.value.identifier.trim() || null,
      account_number: form.value.account_number.trim() || null,
      bank_id: needsBank.value ? form.value.bank_id : null,
      branch_id: props.branchId ? String(props.branchId) : null,
      is_active: true,
    });
    if (data?.data) {
      emit("created", data.data);
    }
  } catch (err) {
    errorMsg.value =
      err.response?.data?.message ||
      Object.values(err.response?.data?.errors || {})?.[0]?.[0] ||
      "Failed to create payment method.";
  } finally {
    saving.value = false;
  }
}
</script>
