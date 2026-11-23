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
                {{ formatMoney(effectiveTotal) }}
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

          <!-- Fulfilment & Tax/KRA PIN Section -->
          <div class="p-3 bg-light rounded border mb-3">
            <div class="row g-2 align-items-center">
              <div class="col-sm-6">
                <label class="form-label font-size-12 fw-semibold text-dark mb-1">Fulfilment Type</label>
                <div class="btn-group btn-group-sm w-100" role="group">
                  <button
                    type="button"
                    class="btn"
                    :class="selectedFulfilment === 'takeaway' ? 'btn-primary' : 'btn-white'"
                    @click="selectedFulfilment = 'takeaway'"
                  >
                    Takeaway
                  </button>
                  <button
                    type="button"
                    class="btn"
                    :class="selectedFulfilment === 'dine_in' ? 'btn-primary' : 'btn-white'"
                    @click="selectedFulfilment = 'dine_in'"
                  >
                    Dine In
                  </button>
                  <button
                    type="button"
                    class="btn"
                    :class="selectedFulfilment === 'delivery' ? 'btn-primary' : 'btn-white'"
                    @click="selectedFulfilment = 'delivery'"
                  >
                    Delivery
                  </button>
                </div>
              </div>

              <div class="col-sm-6">
                <label class="form-label font-size-12 fw-semibold text-dark mb-1">
                  KRA PIN <span class="text-muted fw-normal">(Optional)</span>
                </label>
                <input
                  v-model="kraPin"
                  type="text"
                  class="form-control form-control-sm text-uppercase font-monospace"
                  placeholder="e.g. P051234567X"
                  maxlength="11"
                  @input="kraPin = kraPin.toUpperCase()"
                />
              </div>
            </div>

            <!-- Delivery Address via Google Maps -->
            <div v-if="selectedFulfilment === 'delivery'" class="mt-3 pt-2 border-top">
              <label class="form-label font-size-12 fw-semibold text-dark d-flex align-items-center gap-1 mb-1">
                <i class="bx bx-map text-primary fs-5"></i>
                <span>Delivery Address (Google Maps)</span>
              </label>
              <GoogleLocationInput
                v-model="deliveryAddress"
                placeholder="Search delivery address or landmark in Kenya..."
                @location-selected="onDeliveryLocationSelected"
                @location-cleared="onDeliveryLocationCleared"
              />

              <!-- 🗺️ Map Preview (Non-zoomable map matching gallery.add.vue) -->
              <div v-if="deliveryMapUrl" class="position-relative my-2">
                <!-- Loader Overlay -->
                <div
                  v-if="deliveryMapLoading"
                  class="d-flex align-items-center justify-content-center"
                  style="position: absolute; inset: 0; background: rgba(255,255,255,0.7); z-index: 10; border-radius: 8px;"
                >
                  <div class="spinner-border text-primary spinner-border-sm" role="status">
                    <span class="visually-hidden">Loading map...</span>
                  </div>
                </div>

                <!-- Map iframe (pointer-events: none prevents scroll-zooming) -->
                <iframe
                  :src="deliveryMapUrl"
                  width="100%"
                  height="160"
                  style="border: 2px solid rgb(229 231 235); border-radius: 8px; overflow: hidden; pointer-events: none; display: block;"
                  allowfullscreen=""
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  @load="deliveryMapLoaded"
                ></iframe>
              </div>
              <div class="row g-2 mt-1">
                <div class="col-sm-6">
                  <label class="form-label font-size-11 text-muted mb-0">Delivery Fee (KES)</label>
                  <input
                    v-model.number="deliveryFeeInput"
                    type="number"
                    min="0"
                    step="any"
                    class="form-control form-control-sm"
                    placeholder="0.00"
                  />
                </div>
                <div class="col-sm-6">
                  <label class="form-label font-size-11 text-muted mb-0">Building / Apt / Door Details</label>
                  <input
                    v-model="deliveryDirections"
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="e.g. Apt 4B, 3rd Floor"
                  />
                </div>
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
                <button type="button" class="btn btn-sm btn-white flex-fill" @click="cashTendered = effectiveTotal">
                  Exact ({{ formatPlainMoney(effectiveTotal) }})
                </button>
                <button type="button" class="btn btn-sm btn-white flex-fill" @click="roundToNearest(50)">
                  Nearest 50
                </button>
                <button type="button" class="btn btn-sm btn-white flex-fill" @click="roundToNearest(100)">
                  Nearest 100
                </button>
                <button type="button" class="btn btn-sm btn-white flex-fill" @click="roundToNearest(500)">
                  Nearest 500
                </button>
                <button type="button" class="btn btn-sm btn-white flex-fill" @click="roundToNearest(1000)">
                  Nearest 1,000
                </button>
                <button type="button" class="btn btn-sm btn-white flex-fill" @click="addCash(500)">
                  +500
                </button>
                <button type="button" class="btn btn-sm btn-white flex-fill" @click="addCash(1000)">
                  +1,000
                </button>
              </div>
            </div>

            <!-- M-PESA TAB -->
            <div v-else-if="activeMethod === 'mpesa'" class="p-3 bg-light rounded border mb-3">
              <label class="form-label font-size-12 fw-semibold text-dark">
                M-Pesa Transaction Code / Confirmation Ref <span class="text-danger">*</span>
              </label>
              <div class="input-group">
                <span class="input-group-text bg-white text-muted">
                  <i class="bx bx-barcode"></i>
                </span>
                <input
                  v-model="mpesaReference"
                  type="text"
                  class="form-control form-control-lg text-uppercase fw-bold font-monospace"
                  placeholder="e.g. QK83DF91A2"
                  maxlength="20"
                />
              </div>
              <small class="text-muted mt-1 d-block font-size-11">
                Enter the customer M-Pesa receipt code received on your till or phone.
              </small>
            </div>

            <!-- CARD / BANK TAB -->
            <div v-else-if="activeMethod === 'bank'" class="p-3 bg-light rounded border mb-3">
              <label class="form-label font-size-12 fw-semibold text-dark">
                POS Terminal Auth / Trace Number (Optional)
              </label>
              <input
                v-model="bankReference"
                type="text"
                class="form-control"
                placeholder="e.g. AUTH-482910"
              />
              <small class="text-muted mt-1 d-block font-size-11">
                Card terminal trace code, cheque number, or bank transfer reference.
              </small>
            </div>
          </div>

          <!-- Split Payment Mode -->
          <div v-else class="p-3 bg-light rounded border mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="font-size-12 fw-semibold text-dark">Split Rows</span>
              <span
                class="font-size-12 fw-bold"
                :class="remainingSplitBalance === 0 ? 'text-success' : 'text-danger'"
              >
                Remaining: {{ formatMoney(remainingSplitBalance) }}
              </span>
            </div>

            <div class="d-flex flex-column gap-2">
              <div
                v-for="(split, idx) in splitTenders"
                :key="idx"
                class="row g-2 align-items-center bg-white p-2 rounded border"
              >
                <div class="col-4">
                  <select v-model="split.method" class="form-select form-select-sm">
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank">Card / Bank</option>
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
                    class="form-control form-control-sm text-uppercase font-monospace"
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
            <input v-model="saleNotes" type="text" class="form-control form-control-sm" placeholder="e.g. Delivery drop-off packaging requested" />
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
import GoogleLocationInput from '@/components/GoogleLocationInput.vue';
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

const selectedFulfilment = ref(props.fulfilmentMethod || 'takeaway');
const deliveryAddress = ref('');
const deliveryDirections = ref('');
const deliveryFeeInput = ref(props.deliveryFee || 0);
const kraPin = ref(props.customer?.tax_pin || '');

// 🌍 Map state (referenced from gallery.add.vue)
const deliveryLocation = ref(null);
const deliveryMapLoading = ref(false);

const deliveryMapLoaded = () => {
  deliveryMapLoading.value = false;
};

const deliveryMapUrl = computed(() => {
  const lat = deliveryLocation.value?.latitude;
  const lng = deliveryLocation.value?.longitude;
  if (!lat || !lng) return '';
  return `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
});

const cashTendered = ref(0);
const mpesaReference = ref('');
const bankReference = ref('');
const saleNotes = ref('');

const splitTenders = ref([
  { method: 'cash', amount: 0, tendered_amount: 0, external_reference: '' },
  { method: 'mpesa', amount: 0, external_reference: '' },
]);

const effectiveTotal = computed(() => {
  const base = props.subtotal - props.discountAmount + props.taxAmount;
  const delivery = selectedFulfilment.value === 'delivery' ? (Number(deliveryFeeInput.value) || 0) : 0;
  return Math.max(0, Math.round((base + delivery) * 100) / 100);
});

// Watch effectiveTotal to update default tendered amounts
watch(
  effectiveTotal,
  (val) => {
    cashTendered.value = val;
    if (splitTenders.value.length > 0) {
      splitTenders.value[0].amount = val;
      splitTenders.value[0].tendered_amount = val;
    }
  },
  { immediate: true }
);

// Watch customer changes to populate saved KRA PIN or address
watch(
  () => props.customer,
  (cust) => {
    if (cust) {
      if (cust.tax_pin) {
        kraPin.value = cust.tax_pin;
      }
      if (cust.addresses && cust.addresses.length > 0) {
        const a = cust.addresses.find((addr) => addr.is_default) || cust.addresses[0];
        deliveryAddress.value = [a.building, a.estate_area, a.town_city].filter(Boolean).join(', ');
        if (a.additional_directions) {
          deliveryDirections.value = a.additional_directions;
        }
        if (a.latitude && a.longitude) {
          deliveryMapLoading.value = true;
          deliveryLocation.value = { latitude: a.latitude, longitude: a.longitude };
        }
      }
    } else {
      deliveryLocation.value = null;
    }
  },
  { immediate: true }
);

const onDeliveryLocationSelected = (data) => {
  if (data?.formatted_address) {
    deliveryAddress.value = data.formatted_address;
  }
  if (data?.latitude && data?.longitude) {
    deliveryMapLoading.value = true;
    deliveryLocation.value = data;
  }
};

const onDeliveryLocationCleared = () => {
  deliveryLocation.value = null;
  deliveryMapLoading.value = false;
};

const cashChange = computed(() => {
  if (activeMethod.value !== 'cash') return 0;
  return Math.max(0, Math.round((cashTendered.value - effectiveTotal.value) * 100) / 100);
});

const remainingSplitBalance = computed(() => {
  const sum = splitTenders.value.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return Math.max(0, Math.round((effectiveTotal.value - sum) * 100) / 100);
});

const isFormValid = computed(() => {
  if (effectiveTotal.value <= 0) return true;

  if (isSplitPayment.value) {
    const sum = splitTenders.value.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    return Math.abs(sum - effectiveTotal.value) < 0.01;
  }

  if (activeMethod.value === 'cash') {
    return cashTendered.value >= effectiveTotal.value;
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
  cashTendered.value = Math.ceil(effectiveTotal.value / nearest) * nearest;
};

const handleSplitToggle = () => {
  if (isSplitPayment.value) {
    splitTenders.value = [
      { method: 'cash', amount: Math.floor(effectiveTotal.value / 2), tendered_amount: Math.floor(effectiveTotal.value / 2), external_reference: '' },
      { method: 'mpesa', amount: Math.ceil(effectiveTotal.value / 2), external_reference: '' },
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
          amount: effectiveTotal.value,
          tendered_amount: activeMethod.value === 'cash' ? cashTendered.value : effectiveTotal.value,
          external_reference:
            activeMethod.value === 'mpesa'
              ? mpesaReference.value.trim().toUpperCase()
              : activeMethod.value === 'bank'
              ? bankReference.value.trim()
              : null,
        },
      ];
    }

    const finalDeliveryAddress = selectedFulfilment.value === 'delivery'
      ? [deliveryAddress.value, deliveryDirections.value].filter(Boolean).join(', ')
      : null;

    const payload = {
      branch_id: branchId,
      customer_id: props.customer?.id || null,
      channel: selectedFulfilment.value === 'delivery' ? 'delivery' : (props.channel || 'counter'),
      fulfilment_method: selectedFulfilment.value,
      tax_pin: kraPin.value?.trim() ? kraPin.value.trim().toUpperCase() : null,
      delivery_address: finalDeliveryAddress,
      discount_amount: props.discountAmount || 0,
      delivery_fee: selectedFulfilment.value === 'delivery' ? (Number(deliveryFeeInput.value) || 0) : 0,
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
