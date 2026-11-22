<template>
  <div
    class="modal fade"
    id="paymentModal"
    tabindex="-1"
    aria-labelledby="paymentModalLabel"
    aria-hidden="true"
    ref="modalRef"
    data-bs-backdrop="static"
  >
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 650px;">
      <div class="modal-content border" style="border-radius: 8px;">
        <div class="modal-header border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <div class="tone-chip tone-chip-emerald">
              <i class="bx bx-credit-card fs-5"></i>
            </div>
            <div>
              <h5 class="modal-title font-size-16 fw-bold mb-0" id="paymentModalLabel">Checkout & Payment</h5>
              <small class="text-muted">Settle bill across cash, M-Pesa, or split tenders</small>
            </div>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" :disabled="isSubmitting"></button>
        </div>

        <div class="modal-body px-4 py-3">
          <!-- Total Summary Banner -->
          <div class="p-3 bg-light rounded border mb-3 d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted font-size-12 text-uppercase fw-semibold">Amount Due</span>
              <h3 class="mb-0 fw-bold text-dark font-size-24">
                {{ formatMoney(totalAmount) }}
              </h3>
            </div>
            <div class="text-end">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 font-size-12">
                {{ itemCount }} item{{ itemCount === 1 ? '' : 's' }}
              </span>
              <div v-if="customer" class="text-muted font-size-12 mt-1">
                Customer: <strong class="text-dark">{{ customer.name }}</strong>
              </div>
            </div>
          </div>

          <!-- Split Mode Toggle -->
          <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
            <span class="font-size-13 fw-semibold text-dark">Payment Method</span>
            <div class="form-check form-switch mb-0">
              <input
                class="form-check-input"
                type="checkbox"
                id="splitToggle"
                v-model="isSplitPayment"
                @change="handleSplitToggle"
              />
              <label class="form-check-label font-size-12 text-muted" for="splitToggle">
                Split payment across multiple tenders
              </label>
            </div>
          </div>

          <!-- Single Payment Mode -->
          <div v-if="!isSplitPayment">
            <!-- Tabs for Payment Methods -->
            <ul class="nav nav-pills nav-justified mb-3 gap-2" role="tablist">
              <li class="nav-item">
                <button
                  type="button"
                  class="nav-link btn btn-sm py-2 font-size-13 fw-semibold"
                  :class="activeMethod === 'cash' ? 'active btn-primary' : 'btn-white'"
                  @click="activeMethod = 'cash'"
                >
                  <i class="bx bx-money me-1 font-size-14"></i> Cash
                </button>
              </li>
              <li class="nav-item">
                <button
                  type="button"
                  class="nav-link btn btn-sm py-2 font-size-13 fw-semibold"
                  :class="activeMethod === 'mpesa' ? 'active btn-primary' : 'btn-white'"
                  @click="activeMethod = 'mpesa'"
                >
                  <i class="bx bx-mobile-alt me-1 font-size-14"></i> M-Pesa
                </button>
              </li>
              <li class="nav-item">
                <button
                  type="button"
                  class="nav-link btn btn-sm py-2 font-size-13 fw-semibold"
                  :class="activeMethod === 'bank' ? 'active btn-primary' : 'btn-white'"
                  @click="activeMethod = 'bank'"
                >
                  <i class="bx bx-credit-card me-1 font-size-14"></i> Card / Bank
                </button>
              </li>
            </ul>

            <!-- CASH TAB -->
            <div v-if="activeMethod === 'cash'" class="p-3 bg-light rounded border mb-3">
              <div class="row g-2 mb-3">
                <div class="col-sm-6">
                  <label class="form-label font-size-12 fw-semibold text-dark">Cash Tendered (KES)</label>
                  <div class="input-group">
                    <span class="input-group-text bg-white text-muted">KES</span>
                    <input
                      v-model.number="cashTendered"
                      type="number"
                      class="form-control form-control-lg fw-bold font-size-18"
                      min="0"
                      step="any"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div class="col-sm-6">
                  <label class="form-label font-size-12 fw-semibold text-dark">Change Due (KES)</label>
                  <div class="input-group">
                    <span class="input-group-text bg-white text-muted">KES</span>
                    <input
                      :value="formatPlainMoney(cashChange)"
                      type="text"
                      class="form-control form-control-lg fw-bold font-size-18 bg-white"
                      :class="cashChange > 0 ? 'text-success' : 'text-dark'"
                      readonly
                    />
                  </div>
                </div>
              </div>

              <!-- Quick cash buttons -->
              <div class="d-flex flex-wrap gap-2">
                <button type="button" class="btn btn-sm btn-white" @click="cashTendered = totalAmount">
                  Exact ({{ formatPlainMoney(totalAmount) }})
                </button>
                <button type="button" class="btn btn-sm btn-white" @click="addCash(100)">+100</button>
                <button type="button" class="btn btn-sm btn-white" @click="addCash(200)">+200</button>
                <button type="button" class="btn btn-sm btn-white" @click="addCash(500)">+500</button>
                <button type="button" class="btn btn-sm btn-white" @click="addCash(1000)">+1,000</button>
                <button type="button" class="btn btn-sm btn-white" @click="roundToNearest(100)">Round 100</button>
                <button type="button" class="btn btn-sm btn-white" @click="roundToNearest(500)">Round 500</button>
              </div>
            </div>

            <!-- M-PESA TAB -->
            <div v-if="activeMethod === 'mpesa'" class="p-3 bg-light rounded border mb-3">
              <div class="mb-3">
                <label class="form-label font-size-12 fw-semibold text-dark">
                  M-Pesa Transaction Code <span class="text-danger">*</span>
                </label>
                <input
                  v-model="mpesaReference"
                  type="text"
                  class="form-control text-uppercase fw-bold"
                  placeholder="e.g. QK876XYZ21"
                  maxlength="20"
                />
                <small class="text-muted font-size-11">
                  Enter the 10-character alphanumeric Safaricom confirmation code.
                </small>
              </div>
            </div>

            <!-- CARD / BANK TAB -->
            <div v-if="activeMethod === 'bank'" class="p-3 bg-light rounded border mb-3">
              <div class="mb-3">
                <label class="form-label font-size-12 fw-semibold text-dark">
                  Bank Reference / Card Terminal Slip #
                </label>
                <input
                  v-model="bankReference"
                  type="text"
                  class="form-control"
                  placeholder="e.g. STANBIC-POS-4482"
                />
              </div>
            </div>
          </div>

          <!-- Split Payment Mode -->
          <div v-else class="mb-3">
            <div class="p-2 mb-2 bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded font-size-12 d-flex align-items-center justify-content-between">
              <span>Allocate the remaining amount across multiple payment methods:</span>
              <strong class="font-size-13">{{ formatMoney(remainingSplitBalance) }} remaining</strong>
            </div>

            <div v-for="(split, idx) in splitTenders" :key="idx" class="p-2 rounded border bg-light mb-2">
              <div class="row g-2 align-items-center">
                <div class="col-4">
                  <select v-model="split.method" class="form-select form-select-sm">
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank">Bank / Card</option>
                  </select>
                </div>
                <div class="col-4">
                  <input
                    v-model.number="split.amount"
                    type="number"
                    class="form-control form-control-sm fw-bold"
                    placeholder="Amount"
                    min="0"
                    step="any"
                  />
                </div>
                <div class="col-3">
                  <input
                    v-if="split.method === 'mpesa'"
                    v-model="split.external_reference"
                    type="text"
                    class="form-control form-control-sm text-uppercase"
                    placeholder="Ref code"
                  />
                  <input
                    v-else-if="split.method === 'cash'"
                    v-model.number="split.tendered_amount"
                    type="number"
                    class="form-control form-control-sm"
                    placeholder="Tendered"
                  />
                  <input
                    v-else
                    v-model="split.external_reference"
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="Ref"
                  />
                </div>
                <div class="col-1 text-end">
                  <button
                    type="button"
                    class="btn btn-sm text-danger p-0"
                    :disabled="splitTenders.length <= 1"
                    @click="removeSplitRow(idx)"
                  >
                    <i class="bx bx-trash fs-5"></i>
                  </button>
                </div>
              </div>
            </div>

            <button type="button" class="btn btn-sm btn-white w-100 mt-2" @click="addSplitRow">
              <i class="bx bx-plus me-1 font-size-14"></i> Add Split Method
            </button>
          </div>

          <!-- Checkout Notes -->
          <div class="mb-2">
            <label class="form-label font-size-12 text-muted">Receipt / Sale Notes (Optional)</label>
            <input v-model="saleNotes" type="text" class="form-control form-control-sm" placeholder="e.g. Takeaway packaging requested" />
          </div>
        </div>

        <div class="modal-footer border-top px-4 py-3 d-flex justify-content-between">
          <button type="button" class="btn btn-white" data-bs-dismiss="modal" :disabled="isSubmitting">Cancel</button>
          <button
            type="button"
            class="btn btn-primary d-inline-flex align-items-center gap-1 font-size-14 px-4 py-2"
            :disabled="isSubmitting || !isFormValid"
            @click="handleCompleteSale"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
            <i v-else class="bx bx-check-circle fs-5"></i>
            <span>{{ isSubmitting ? 'Recording Sale...' : 'Commit & Print Receipt' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import salesApi from '@/api/sales';
import { useShiftStore } from '@/stores/shift';

const props = defineProps({
  cartItems: { type: Array, required: true },
  totalAmount: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  itemCount: { type: Number, default: 0 },
  customer: { type: Object, default: null },
  channel: { type: String, default: 'counter' },
  fulfilmentMethod: { type: String, default: 'takeaway' },
});

const emit = defineEmits(['sale-completed']);

const shiftStore = useShiftStore();

const modalRef = ref(null);
const isSubmitting = ref(false);
const activeMethod = ref('cash');
const isSplitPayment = ref(false);

const cashTendered = ref(0);
const mpesaReference = ref('');
const bankReference = ref('');
const saleNotes = ref('');

const splitTenders = ref([
  { method: 'cash', amount: 0, tendered_amount: 0, external_reference: '' },
  { method: 'mpesa', amount: 0, external_reference: '' },
]);

// Initialize cashTendered whenever totalAmount updates
watch(
  () => props.totalAmount,
  (val) => {
    cashTendered.value = val;
    if (splitTenders.value.length > 0) {
      splitTenders.value[0].amount = val;
      splitTenders.value[0].tendered_amount = val;
    }
  },
  { immediate: true }
);

const cashChange = computed(() => {
  if (activeMethod.value !== 'cash') return 0;
  return Math.max(0, Math.round((cashTendered.value - props.totalAmount) * 100) / 100);
});

const remainingSplitBalance = computed(() => {
  const sum = splitTenders.value.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return Math.max(0, Math.round((props.totalAmount - sum) * 100) / 100);
});

const isFormValid = computed(() => {
  if (props.totalAmount <= 0) return true;

  if (isSplitPayment.value) {
    const sum = splitTenders.value.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    return Math.abs(sum - props.totalAmount) < 0.01;
  }

  if (activeMethod.value === 'cash') {
    return cashTendered.value >= props.totalAmount;
  }

  if (activeMethod.value === 'mpesa') {
    return mpesaReference.value.trim().length >= 5;
  }

  return true;
});

const addCash = (amount) => {
  cashTendered.value = (Number(cashTendered.value) || 0) + amount;
};

const roundToNearest = (nearest) => {
  cashTendered.value = Math.ceil(props.totalAmount / nearest) * nearest;
};

const handleSplitToggle = () => {
  if (isSplitPayment.value) {
    splitTenders.value = [
      { method: 'cash', amount: Math.floor(props.totalAmount / 2), tendered_amount: Math.floor(props.totalAmount / 2), external_reference: '' },
      { method: 'mpesa', amount: Math.ceil(props.totalAmount / 2), external_reference: '' },
    ];
  }
};

const addSplitRow = () => {
  splitTenders.value.push({ method: 'cash', amount: remainingSplitBalance.value, external_reference: '' });
};

const removeSplitRow = (idx) => {
  if (splitTenders.value.length > 1) {
    splitTenders.value.splice(idx, 1);
  }
};

const formatMoney = (val) => {
  return Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'KES' });
};

const formatPlainMoney = (val) => {
  return Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const handleCompleteSale = async () => {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;
  try {
    const branchId = shiftStore.selectedBranchId || shiftStore.activeShift?.branch_id;

    // Assemble line items
    const items = props.cartItems.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate || 0,
      discount_amount: item.discount_amount || 0,
      notes: item.notes || null,
    }));

    // Assemble payments
    let payments = [];
    if (isSplitPayment.value) {
      payments = splitTenders.value.map((s) => ({
        method: s.method,
        amount: Number(s.amount),
        tendered_amount: s.method === 'cash' ? (Number(s.tendered_amount) || Number(s.amount)) : undefined,
        external_reference: s.external_reference?.trim() || null,
      }));
    } else {
      payments = [
        {
          method: activeMethod.value,
          amount: props.totalAmount,
          tendered_amount: activeMethod.value === 'cash' ? cashTendered.value : props.totalAmount,
          external_reference:
            activeMethod.value === 'mpesa'
              ? mpesaReference.value.trim().toUpperCase()
              : activeMethod.value === 'bank'
              ? bankReference.value.trim()
              : null,
        },
      ];
    }

    const payload = {
      branch_id: branchId,
      customer_id: props.customer?.id || null,
      channel: props.channel || 'counter',
      fulfilment_method: props.fulfilmentMethod || 'takeaway',
      discount_amount: props.discountAmount || 0,
      delivery_fee: props.deliveryFee || 0,
      idempotency_key: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      notes: saleNotes.value.trim() || null,
      items,
      payments,
    };

    const res = await salesApi.create(payload);
    const order = res.data?.order || res.data;

    // Refresh active shift stats in background
    shiftStore.checkCurrentShift(branchId);

    // Hide payment modal
    if (window.bootstrap && modalRef.value) {
      const modal = window.bootstrap.Modal.getInstance(modalRef.value);
      if (modal) modal.hide();
    }

    emit('sale-completed', order);
  } catch (error) {
    console.error('Error committing sale:', error);
    alert(error.response?.data?.message || 'Failed to complete sale. Please verify shift and stock.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>
