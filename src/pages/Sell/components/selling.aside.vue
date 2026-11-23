<template>
  <!-- Hidden toggle button for programmatic triggering -->
  <button
    class="btn btn-primary d-none"
    type="button"
    data-bs-toggle="offcanvas"
    data-bs-target="#sellingAside"
    ref="toggleBtnRef"
  >
    Toggle Selling Aside
  </button>

  <!-- Selling / Checkout Offcanvas Drawer (Matching SaveTabAside design) -->
  <div
    class="offcanvas offcanvas-end"
    tabindex="-1"
    id="sellingAside"
    ref="offcanvasRef"
    style="width: 520px; max-width: 95vw;"
  >
    <!-- Header -->
    <div class="offcanvas-header border-bottom py-3 px-4">
      <div class="d-flex align-items-center gap-2">
        <button
          type="button"
          class="btn btn-light avatar-xs rounded-circle p-0 d-flex align-items-center justify-content-center shadow-none border"
          data-bs-dismiss="offcanvas"
          aria-label="Close"
          :disabled="isSubmitting"
        >
          <i class="bx bx-arrow-back font-size-18"></i>
        </button>
        <div>
          <h5 class="mb-0 fw-bold font-size-16 text-dark">Checkout &amp; Payment</h5>
          <p class="m-0 text-muted font-size-12">Select payment method &amp; complete transaction</p>
        </div>
      </div>
      <button type="button" class="btn-close text-reset d-none" data-bs-dismiss="offcanvas"></button>
    </div>

    <!-- Offcanvas Body -->
    <div class="offcanvas-body p-0 d-flex flex-column justify-content-between" style="overflow-y: auto;">
      <div class="p-3">
        <!-- Amount Due & Order Capsule Banner -->
        <div class="card border border-primary-subtle bg-primary-subtle rounded-3 p-3 mb-3 shadow-none">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <span class="text-primary text-uppercase font-size-11 fw-bold tracking-wide">Total Amount Due</span>
              <h2 class="mb-0 fw-bold text-dark font-size-26 mt-1">
                {{ formatMoney(effectiveTotal) }}
              </h2>
            </div>
            <div class="text-end">
              <span class="badge bg-white text-primary border font-size-12 px-2.5 py-1 fw-bold rounded-pill shadow-sm">
                {{ itemCount }} item{{ itemCount === 1 ? '' : 's' }}
              </span>
              <div v-if="customer" class="text-muted font-size-12 mt-1 fw-medium text-truncate" style="max-width: 180px;">
                <i class="mdi mdi-account-circle-outline text-primary me-0.5"></i>
                <strong class="text-dark">{{ customer.name }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Customer Card (Matching Reference Design) -->
        <SelectedCustomerCard
          v-if="customer"
          :customer="customer"
          :outstanding-amount="customer?.outstanding_balance || customer?.current_debt || 0"
          :unpaid-bills-count="customer?.unpaid_bills_count || 0"
          :show-callout="true"
          @open-profile="openCustomerProfileModal"
          @view-bills="$emit('view-customer-bills', customer)"
        />

        <!-- Fulfilment Type & KRA PIN Section -->
        <div class="card border rounded-3 p-3 mb-3 bg-white shadow-none">
          <div class="row g-2 align-items-center">
            <div class="col-sm-6">
              <label class="form-label font-size-12 fw-bold text-dark mb-1">Fulfilment Type</label>
              <div class="btn-group btn-group-sm w-100" role="group">
                <button
                  type="button"
                  class="btn"
                  :class="selectedFulfilment === 'takeaway' ? 'btn-primary fw-bold' : 'btn-outline-light text-dark'"
                  @click="selectedFulfilment = 'takeaway'"
                >
                  Takeaway
                </button>
                <button
                  type="button"
                  class="btn"
                  :class="selectedFulfilment === 'dine_in' ? 'btn-primary fw-bold' : 'btn-outline-light text-dark'"
                  @click="selectedFulfilment = 'dine_in'"
                >
                  Dine In
                </button>
                <button
                  type="button"
                  class="btn"
                  :class="selectedFulfilment === 'delivery' ? 'btn-primary fw-bold' : 'btn-outline-light text-dark'"
                  @click="selectedFulfilment = 'delivery'"
                >
                  Delivery
                </button>
              </div>
            </div>

            <div class="col-sm-6">
              <label class="form-label font-size-12 fw-bold text-dark mb-1">
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

          <!-- Delivery Address (Google Maps) -->
          <div v-if="selectedFulfilment === 'delivery'" class="mt-3 pt-3 border-top">
            <label class="form-label font-size-12 fw-bold text-dark d-flex align-items-center gap-1 mb-1">
              <i class="bx bx-map text-primary font-size-16"></i>
              <span>Delivery Address (Google Maps)</span>
            </label>
            <GoogleLocationInput
              v-model="deliveryAddress"
              placeholder="Search delivery address or landmark in Kenya..."
              @location-selected="onDeliveryLocationSelected"
              @location-cleared="onDeliveryLocationCleared"
            />

            <!-- Google Maps Preview -->
            <GoogleMapPreview
              v-if="deliveryLocation?.latitude && deliveryLocation?.longitude"
              :latitude="deliveryLocation.latitude"
              :longitude="deliveryLocation.longitude"
              :label="deliveryAddress || 'Delivery Destination'"
              height="140"
              class="mt-2"
            />

            <div class="row g-2 mt-2">
              <div class="col-sm-6">
                <label class="form-label font-size-11 text-muted mb-0 fw-semibold">Delivery Fee (KES)</label>
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
                <label class="form-label font-size-11 text-muted mb-0 fw-semibold">Building / Apt / Door Details</label>
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

        <!-- Payment Mode Header & Split Toggle -->
        <div class="d-flex align-items-center justify-content-between mb-2 px-1">
          <div class="d-flex align-items-center gap-1">
            <span class="font-size-13 fw-bold text-dark">Payment Method</span>
            <span v-if="configuredMethods.length > 0" class="badge bg-light text-muted font-size-11">
              {{ configuredMethods.length }} accounts setup
            </span>
          </div>
          <div class="form-check form-switch mb-0">
            <input
              class="form-check-input"
              type="checkbox"
              id="splitToggleAside"
              v-model="isSplitPayment"
              @change="handleSplitToggle"
            />
            <label class="form-check-label font-size-12 text-muted fw-semibold" for="splitToggleAside">
              Split Bill
            </label>
          </div>
        </div>

        <!-- SINGLE PAYMENT MODE: CONFIGURED PAYMENT METHODS SELECTION -->
        <div v-if="!isSplitPayment" class="mb-3">
          <!-- Loading skeleton for payment methods -->
          <div v-if="loadingMethods" class="text-center py-3">
            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
            <span class="ms-2 font-size-12 text-muted">Loading business payment methods...</span>
          </div>

          <!-- Selectable Payment Accounts Grid -->
          <div v-else class="row g-2 mb-3">
            <div
              v-for="method in displayPaymentMethods"
              :key="method.id || method.type"
              class="col-sm-6"
            >
              <div
                class="card border p-2.5 rounded-3 cursor-pointer h-100 transition-all position-relative"
                :class="selectedMethodId === (method.id || method.type) ? 'border-primary bg-primary-subtle shadow-sm' : 'border-light-subtle bg-white hover-shadow'"
                @click="selectPaymentMethod(method)"
                role="button"
              >
                <div class="d-flex align-items-center justify-content-between mb-1.5">
                  <div class="d-flex align-items-center gap-2">
                    <span
                      class="avatar-xs rounded-circle d-flex align-items-center justify-content-center"
                      :class="getMethodIconClass(method.type)"
                    >
                      <i :class="getMethodIcon(method.type)" class="font-size-16"></i>
                    </span>
                    <span class="fw-bold font-size-13 text-dark text-truncate" style="max-width: 140px;" :title="method.name">
                      {{ method.name }}
                    </span>
                  </div>
                  <input
                    type="radio"
                    class="form-check-input"
                    :checked="selectedMethodId === (method.id || method.type)"
                  />
                </div>

                <!-- Account Sub-details: Till / Paybill number -->
                <div class="ps-4 ms-1">
                  <small v-if="method.type === 'mpesa_till'" class="font-size-11 fw-semibold text-success">
                    Till No: {{ method.identifier || 'Active Till' }}
                  </small>
                  <small v-else-if="method.type === 'bank_paybill' || method.type === 'mpesa_paybill'" class="font-size-11 fw-semibold text-primary">
                    Paybill: {{ method.identifier }} <span v-if="method.account_number">· Acc: {{ method.account_number }}</span>
                  </small>
                  <small v-else-if="method.type === 'card' || method.type === 'card_terminal'" class="font-size-11 text-muted">
                    Card Terminal / PDQ
                  </small>
                  <small v-else-if="method.type === 'cash'" class="font-size-11 text-muted">
                    Cash in Drawer
                  </small>
                  <small v-else class="font-size-11 text-muted">
                    {{ method.instructions || 'Direct payment' }}
                  </small>
                </div>
              </div>
            </div>
          </div>

          <!-- SELECTED METHOD INTERACTION PANEL -->
          <!-- 1. CASH PANEL -->
          <div v-if="activeTypeCategory === 'cash'" class="card border rounded-3 p-3 bg-light mb-3">
            <div class="row g-2 mb-3">
              <div class="col-sm-6">
                <label class="form-label font-size-12 fw-bold text-dark">Cash Tendered (KES)</label>
                <div class="input-group">
                  <span class="input-group-text bg-white text-muted fw-bold">KES</span>
                  <input
                    v-model.number="cashTendered"
                    type="number"
                    class="form-control form-control-lg fw-bold font-size-18"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    ref="cashInputRef"
                  />
                </div>
              </div>
              <div class="col-sm-6">
                <label class="form-label font-size-12 fw-bold text-dark">Change Due (KES)</label>
                <div class="input-group">
                  <span class="input-group-text bg-white text-muted fw-bold">KES</span>
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

            <!-- Quick Cash Denominations -->
            <div class="d-flex flex-wrap gap-1.5">
              <button
                type="button"
                class="btn btn-sm btn-white border flex-fill font-size-11 fw-semibold py-1.5"
                @click="cashTendered = effectiveTotal"
              >
                Exact ({{ formatPlainMoney(effectiveTotal) }})
              </button>
              <button
                type="button"
                class="btn btn-sm btn-white border flex-fill font-size-11 fw-semibold py-1.5"
                @click="roundToNearest(50)"
              >
                Nearest 50
              </button>
              <button
                type="button"
                class="btn btn-sm btn-white border flex-fill font-size-11 fw-semibold py-1.5"
                @click="roundToNearest(100)"
              >
                Nearest 100
              </button>
              <button
                type="button"
                class="btn btn-sm btn-white border flex-fill font-size-11 fw-semibold py-1.5"
                @click="roundToNearest(500)"
              >
                Nearest 500
              </button>
              <button
                type="button"
                class="btn btn-sm btn-white border flex-fill font-size-11 fw-semibold py-1.5"
                @click="roundToNearest(1000)"
              >
                Nearest 1,000
              </button>
              <button
                type="button"
                class="btn btn-sm btn-white border flex-fill font-size-11 fw-semibold py-1.5"
                @click="addCash(500)"
              >
                +500
              </button>
              <button
                type="button"
                class="btn btn-sm btn-white border flex-fill font-size-11 fw-semibold py-1.5"
                @click="addCash(1000)"
              >
                +1,000
              </button>
            </div>
          </div>

          <!-- 2. M-PESA TILL / PAYBILL PANEL -->
          <div v-else-if="activeTypeCategory === 'mpesa'" class="card border rounded-3 p-3 bg-light mb-3">
            <!-- Account Instruction Banner -->
            <div
              v-if="selectedMethodObject?.identifier"
              class="p-2.5 rounded-2 mb-3 d-flex align-items-center justify-content-between"
              style="background-color: #f0fdf4; border: 1px solid #bbf7d0;"
            >
              <div>
                <span class="text-success text-uppercase font-size-11 fw-bold">Customer Instructions:</span>
                <div class="fw-bold text-dark font-size-14">
                  <template v-if="selectedMethodObject.type === 'mpesa_till'">
                    Buy Goods Till: <span class="font-monospace text-success fs-5">{{ selectedMethodObject.identifier }}</span>
                  </template>
                  <template v-else>
                    PayBill: <span class="font-monospace text-primary fs-5">{{ selectedMethodObject.identifier }}</span>
                    <span v-if="selectedMethodObject.account_number" class="ms-2">Acc: <span class="font-monospace text-dark">{{ selectedMethodObject.account_number }}</span></span>
                  </template>
                </div>
              </div>
              <span class="badge bg-success font-size-11 px-2 py-1">Active Channel</span>
            </div>

            <!-- Transaction Code Input -->
            <label class="form-label font-size-12 fw-bold text-dark mb-1">
              M-Pesa Transaction Code / Confirmation Ref <span class="text-danger">*</span>
            </label>
            <div class="input-group">
              <span class="input-group-text bg-white text-muted">
                <i class="bx bx-barcode font-size-18"></i>
              </span>
              <input
                v-model="mpesaReference"
                type="text"
                class="form-control form-control-lg text-uppercase fw-bold font-monospace font-size-16"
                placeholder="e.g. QK83DF91A2"
                maxlength="20"
                @input="mpesaReference = mpesaReference.toUpperCase()"
              />
            </div>
            <small class="text-muted mt-1.5 d-block font-size-11">
              Enter the M-Pesa receipt code received on your till, paybill, or customer SMS.
            </small>
          </div>

          <!-- 3. CARD / BANK / PDQ PANEL -->
          <div v-else-if="activeTypeCategory === 'card' || activeTypeCategory === 'bank'" class="card border rounded-3 p-3 bg-light mb-3">
            <div
              v-if="selectedMethodObject?.identifier || selectedMethodObject?.account_number"
              class="p-2.5 rounded-2 mb-3"
              style="background-color: #eff6ff; border: 1px solid #bfdbfe;"
            >
              <div class="fw-bold text-dark font-size-13">
                {{ selectedMethodObject.name }}
                <span v-if="selectedMethodObject.account_number" class="text-muted font-monospace">({{ selectedMethodObject.account_number }})</span>
              </div>
            </div>

            <label class="form-label font-size-12 fw-bold text-dark mb-1">
              Terminal Auth Code / Trace Number <span class="text-muted fw-normal">(Optional)</span>
            </label>
            <input
              v-model="bankReference"
              type="text"
              class="form-control form-control-lg font-monospace font-size-15"
              placeholder="e.g. AUTH-482910 or Cheque #"
            />
            <small class="text-muted mt-1.5 d-block font-size-11">
              Record receipt trace reference from POS PDQ terminal or bank wire slip.
            </small>
          </div>
        </div>

        <!-- SPLIT PAYMENT MODE -->
        <div v-else class="card border rounded-3 p-3 bg-light mb-3">
          <div class="d-flex justify-content-between align-items-center mb-2.5">
            <span class="font-size-12 fw-bold text-dark">Split Payment Breakdown</span>
            <span
              class="font-size-12 fw-bold px-2 py-0.5 rounded"
              :class="remainingSplitBalance === 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'"
            >
              Remaining: {{ formatMoney(remainingSplitBalance) }}
            </span>
          </div>

          <div class="d-flex flex-column gap-2 mb-3">
            <div
              v-for="(split, idx) in splitTenders"
              :key="idx"
              class="p-2.5 bg-white rounded-2 border"
            >
              <div class="row g-2 align-items-center">
                <div class="col-5">
                  <label class="font-size-11 text-muted mb-0 fw-semibold d-block">Channel</label>
                  <select v-model="split.payment_method_id" class="form-select form-select-sm" @change="onSplitMethodChange(split)">
                    <option
                      v-for="m in displayPaymentMethods"
                      :key="m.id || m.type"
                      :value="m.id || m.type"
                    >
                      {{ m.name }} ({{ m.type }})
                    </option>
                  </select>
                </div>
                <div class="col-5">
                  <label class="font-size-11 text-muted mb-0 fw-semibold d-block">Amount (KES)</label>
                  <input
                    v-model.number="split.amount"
                    type="number"
                    class="form-control form-control-sm fw-bold"
                    placeholder="0.00"
                    min="0"
                    step="any"
                  />
                </div>
                <div class="col-2 text-end pt-3">
                  <button
                    type="button"
                    class="btn btn-outline-danger btn-sm p-1 rounded-circle"
                    :disabled="splitTenders.length <= 1"
                    @click="removeSplitRow(idx)"
                    title="Remove split tender"
                  >
                    <i class="mdi mdi-delete-outline"></i>
                  </button>
                </div>

                <!-- Reference / Tendered input for split tender -->
                <div class="col-12 mt-1">
                  <input
                    v-if="split.method === 'mpesa'"
                    v-model="split.external_reference"
                    type="text"
                    class="form-control form-control-sm text-uppercase font-monospace"
                    placeholder="M-Pesa reference code (e.g. QK83DF91A2)"
                  />
                  <div v-else-if="split.method === 'cash'" class="d-flex align-items-center gap-2">
                    <input
                      v-model.number="split.tendered_amount"
                      type="number"
                      class="form-control form-control-sm"
                      placeholder="Cash tendered"
                    />
                    <small class="text-muted text-nowrap font-size-11">
                      Change: {{ formatMoney(Math.max(0, (split.tendered_amount || 0) - (split.amount || 0))) }}
                    </small>
                  </div>
                  <input
                    v-else
                    v-model="split.external_reference"
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="Terminal Auth code (optional)"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="btn btn-outline-primary btn-sm w-100 fw-semibold d-flex align-items-center justify-content-center gap-1"
            :disabled="remainingSplitBalance <= 0"
            @click="addSplitRow"
          >
            <i class="mdi mdi-plus fs-5"></i>
            <span>Add Tender Row (Remaining: {{ formatMoney(remainingSplitBalance) }})</span>
          </button>
        </div>

        <!-- Optional Order Note -->
        <div class="mb-3">
          <label class="form-label font-size-12 fw-semibold text-dark mb-1">Sale Notes / Customer Remark</label>
          <textarea
            v-model="saleNotes"
            rows="2"
            class="form-control form-control-sm"
            placeholder="Add any internal order memo or customer delivery request..."
          ></textarea>
        </div>
      </div>

      <!-- Footer Action -->
      <div class="p-3 border-top bg-white sticky-bottom">
        <button
          type="button"
          class="btn btn-primary btn-lg w-100 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
          :disabled="!isFormValid || isSubmitting"
          @click="handleCompleteSale"
        >
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <i v-else class="mdi mdi-check-all fs-4 align-middle"></i>
          <span>
            {{ isSubmitting ? 'Recording Transaction...' : `Confirm & Complete Sale • ${formatMoney(effectiveTotal)}` }}
          </span>
        </button>
      </div>
    </div>
  </div>

  <CustomerProfileModal
    v-if="customer"
    modal-id="sellingCustomerProfileModal"
    :customer="customer"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useShiftStore } from '@/stores/shift';
import salesApi from '@/api/sales';
import paymentMethodsApi from '@/api/paymentMethods';
import GoogleLocationInput from '@/components/GoogleLocationInput.vue';
import GoogleMapPreview from '@/components/GoogleMapPreview.vue';
import SelectedCustomerCard from './SelectedCustomerCard.vue';
import CustomerProfileModal from './CustomerProfileModal.vue';

const props = defineProps({
  cartItems: { type: Array, default: () => [] },
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

const toggleBtnRef = ref(null);
const offcanvasRef = ref(null);
const isSubmitting = ref(false);
const loadingMethods = ref(false);
const configuredMethods = ref([]);

const selectedMethodId = ref('cash');
const activeTypeCategory = ref('cash');
const isSplitPayment = ref(false);

const selectedFulfilment = ref(props.fulfilmentMethod || 'takeaway');
const deliveryAddress = ref('');
const deliveryDirections = ref('');
const deliveryFeeInput = ref(props.deliveryFee || 0);
const kraPin = ref(props.customer?.tax_pin || '');
const deliveryLocation = ref(null);

const cashTendered = ref(0);
const mpesaReference = ref('');
const bankReference = ref('');
const saleNotes = ref('');

const splitTenders = ref([]);

const openCustomerProfileModal = () => {
  const el = document.getElementById('sellingCustomerProfileModal');
  if (el && window.bootstrap) {
    const modal = window.bootstrap.Modal.getOrCreateInstance(el);
    modal.show();
  }
};

// Default fallback payment methods if business has not added custom accounts
const defaultMethods = [
  { id: 'cash', name: 'Cash Drawer', type: 'cash', is_primary: true },
  { id: 'mpesa_till', name: 'M-Pesa Buy Goods', type: 'mpesa_till', identifier: 'Counter Till' },
  { id: 'bank_paybill', name: 'M-Pesa PayBill', type: 'bank_paybill', identifier: 'PayBill' },
  { id: 'card', name: 'Card Terminal / PDQ', type: 'card' },
];

const displayPaymentMethods = computed(() => {
  if (configuredMethods.value.length > 0) {
    return configuredMethods.value;
  }
  return defaultMethods;
});

const selectedMethodObject = computed(() => {
  return displayPaymentMethods.value.find((m) => (m.id || m.type) === selectedMethodId.value) || displayPaymentMethods.value[0];
});

const effectiveTotal = computed(() => {
  const base = props.subtotal - props.discountAmount + props.taxAmount;
  const delivery = selectedFulfilment.value === 'delivery' ? (Number(deliveryFeeInput.value) || 0) : 0;
  return Math.max(0, Math.round((base + delivery) * 100) / 100);
});

// Load configured payment methods from backend
const fetchPaymentMethods = async () => {
  loadingMethods.value = true;
  try {
    const res = await paymentMethodsApi.list({ is_active: true, per_page: 50 });
    const list = res.data?.data?.data || res.data?.data || [];
    if (Array.isArray(list) && list.length > 0) {
      configuredMethods.value = list;
      // Auto-select primary or first method
      const primary = list.find((m) => m.is_primary) || list[0];
      if (primary) {
        selectPaymentMethod(primary);
      }
    } else {
      selectPaymentMethod(defaultMethods[0]);
    }
  } catch (err) {
    console.warn('Failed to load configured payment methods, using defaults:', err);
    selectPaymentMethod(defaultMethods[0]);
  } finally {
    loadingMethods.value = false;
  }
};

const selectPaymentMethod = (method) => {
  selectedMethodId.value = method.id || method.type;
  const type = method.type || 'cash';

  if (type === 'cash') {
    activeTypeCategory.value = 'cash';
  } else if (['mpesa_till', 'mpesa_paybill', 'mpesa_pochi', 'bank_paybill', 'mpesa'].includes(type)) {
    activeTypeCategory.value = 'mpesa';
  } else if (['card', 'card_terminal', 'pdq'].includes(type)) {
    activeTypeCategory.value = 'card';
  } else {
    activeTypeCategory.value = 'bank';
  }
};

const getMethodIcon = (type) => {
  if (type === 'cash') return 'bx bx-money';
  if (type === 'mpesa_till' || type === 'mpesa_pochi') return 'bx bx-mobile-alt';
  if (type === 'bank_paybill' || type === 'mpesa_paybill') return 'bx bx-barcode';
  if (type === 'card' || type === 'card_terminal') return 'bx bx-credit-card';
  return 'bx bx-buildings';
};

const getMethodIconClass = (type) => {
  if (type === 'cash') return 'bg-success-subtle text-success';
  if (type === 'mpesa_till' || type === 'mpesa_pochi') return 'bg-success text-white';
  if (type === 'bank_paybill' || type === 'mpesa_paybill') return 'bg-primary-subtle text-primary';
  if (type === 'card' || type === 'card_terminal') return 'bg-info-subtle text-info';
  return 'bg-secondary-subtle text-dark';
};

const getInitials = (name) => {
  if (!name) return 'C';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Keep cashTendered in sync with total
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

// Populate KRA PIN & address when customer changes
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
    deliveryLocation.value = data;
  }
};

const onDeliveryLocationCleared = () => {
  deliveryLocation.value = null;
};

const cashChange = computed(() => {
  if (activeTypeCategory.value !== 'cash') return 0;
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

  if (activeTypeCategory.value === 'cash') {
    return cashTendered.value >= effectiveTotal.value;
  }

  if (activeTypeCategory.value === 'mpesa') {
    return mpesaReference.value.trim().length >= 4;
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
    const firstMethod = displayPaymentMethods.value[0];
    const secondMethod = displayPaymentMethods.value[1] || displayPaymentMethods.value[0];
    splitTenders.value = [
      {
        payment_method_id: firstMethod.id || firstMethod.type,
        method: mapToBackendMethod(firstMethod.type),
        amount: Math.floor(effectiveTotal.value / 2),
        tendered_amount: Math.floor(effectiveTotal.value / 2),
        external_reference: '',
      },
      {
        payment_method_id: secondMethod.id || secondMethod.type,
        method: mapToBackendMethod(secondMethod.type),
        amount: Math.ceil(effectiveTotal.value / 2),
        external_reference: '',
      },
    ];
  }
};

const onSplitMethodChange = (split) => {
  const found = displayPaymentMethods.value.find((m) => (m.id || m.type) === split.payment_method_id);
  if (found) {
    split.method = mapToBackendMethod(found.type);
  }
};

const addSplitRow = () => {
  const defaultMethod = displayPaymentMethods.value[0];
  splitTenders.value.push({
    payment_method_id: defaultMethod.id || defaultMethod.type,
    method: mapToBackendMethod(defaultMethod.type),
    amount: remainingSplitBalance.value,
    external_reference: '',
  });
};

const removeSplitRow = (idx) => {
  if (splitTenders.value.length > 1) {
    splitTenders.value.splice(idx, 1);
  }
};

const mapToBackendMethod = (type) => {
  if (type === 'cash') return 'cash';
  if (['mpesa_till', 'mpesa_paybill', 'mpesa_pochi', 'bank_paybill', 'mpesa'].includes(type)) return 'mpesa';
  if (['card', 'card_terminal', 'pdq'].includes(type)) return 'card';
  return 'bank';
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

    const items = props.cartItems.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate || 0,
      discount_amount: item.discount_amount || 0,
      notes: item.notes || null,
    }));

    let payments = [];
    if (isSplitPayment.value) {
      payments = splitTenders.value.map((s) => ({
        method: s.method,
        amount: Number(s.amount),
        tendered_amount: s.method === 'cash' ? (Number(s.tendered_amount) || Number(s.amount)) : undefined,
        external_reference: s.external_reference?.trim() || null,
        notes: s.payment_method_id ? `Account ID: ${s.payment_method_id}` : null,
      }));
    } else {
      const currentMethod = selectedMethodObject.value;
      const backendMethod = mapToBackendMethod(currentMethod.type);

      payments = [
        {
          method: backendMethod,
          amount: effectiveTotal.value,
          tendered_amount: backendMethod === 'cash' ? cashTendered.value : effectiveTotal.value,
          external_reference:
            backendMethod === 'mpesa'
              ? mpesaReference.value.trim().toUpperCase()
              : backendMethod === 'bank' || backendMethod === 'card'
              ? bankReference.value.trim()
              : null,
          notes: currentMethod.name ? `Via: ${currentMethod.name}` : null,
        },
      ];
    }

    const payload = {
      branch_id: branchId,
      customer_id: props.customer?.id || null,
      channel: props.channel || 'counter',
      fulfilment_method: selectedFulfilment.value,
      tax_pin: kraPin.value.trim() || null,
      delivery_address: selectedFulfilment.value === 'delivery' ? (deliveryAddress.value.trim() || null) : null,
      delivery_fee: selectedFulfilment.value === 'delivery' ? (Number(deliveryFeeInput.value) || 0) : 0,
      discount_amount: props.discountAmount,
      notes: saleNotes.value.trim() || null,
      items,
      payments,
    };

    const res = await salesApi.create(payload);
    if (res.data?.order) {
      // Close offcanvas drawer
      const el = document.getElementById('sellingAside');
      if (el && window.bootstrap?.Offcanvas) {
        window.bootstrap.Offcanvas.getInstance(el)?.hide();
      }
      emit('sale-completed', res.data.order);
    }
  } catch (err) {
    console.error('Failed to complete sale order:', err);
    const msg = err.response?.data?.message || Object.values(err.response?.data?.errors || {})?.[0]?.[0] || 'Sale transaction failed. Please check cash/details and retry.';
    alert(msg);
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchPaymentMethods();

  // Listen to offcanvas open to refresh methods & recalculate
  const el = document.getElementById('sellingAside');
  if (el) {
    el.addEventListener('show.bs.offcanvas', () => {
      fetchPaymentMethods();
      cashTendered.value = effectiveTotal.value;
    });
  }
});
</script>

<style scoped>
.hover-shadow:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #93c5fd !important;
}
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>
