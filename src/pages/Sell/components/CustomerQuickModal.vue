<template>
  <div
    class="modal fade"
    id="addCustomerModal"
    tabindex="-1"
    aria-labelledby="addCustomerModalLabel"
    aria-hidden="true"
    ref="modalRef"
  >
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 620px;">
      <div class="modal-content border-0 shadow-lg" style="border-radius: 12px; overflow: hidden;">
        <!-- Header -->
        <div class="modal-header bg-white border-bottom px-4 pt-3 pb-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <div class="avatar-sm flex-shrink-0">
              <span class="avatar-title rounded-circle bg-primary-subtle text-primary font-size-18">
                <i class="bx bx-user-plus"></i>
              </span>
            </div>
            <div>
              <h5 class="modal-title font-size-16 fw-bold text-dark mb-0" id="addCustomerModalLabel">
                Register Customer
              </h5>
              <p class="text-muted font-size-12 mb-0">
                Create customer profile with KRA PIN and delivery address without losing active cart
              </p>
            </div>
          </div>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>

        <!-- Body -->
        <div class="modal-body px-4 py-3 bg-light-subtle">
          <form id="quickCustomerForm" @submit.prevent="handleSubmit">
            <!-- Customer Type Segmented Switch -->
            <div class="mb-3">
              <label class="form-label font-size-12 fw-semibold text-uppercase text-muted letter-spacing-1 mb-2">
                Customer Type <span class="text-danger">*</span>
              </label>
              <div class="btn-group w-100" role="group">
                <button
                  type="button"
                  class="btn py-2 fw-semibold font-size-13 transition-all"
                  :class="form.customer_type === 'individual' ? 'btn-primary shadow-sm' : 'btn-white border text-secondary'"
                  @click="form.customer_type = 'individual'"
                >
                  <i class="bx bx-user me-1 font-size-15 align-middle"></i>
                  Individual
                </button>
                <button
                  type="button"
                  class="btn py-2 fw-semibold font-size-13 transition-all"
                  :class="form.customer_type === 'business' ? 'btn-primary shadow-sm' : 'btn-white border text-secondary'"
                  @click="form.customer_type = 'business'"
                >
                  <i class="bx bx-buildings me-1 font-size-15 align-middle"></i>
                  Business / Corporate
                </button>
              </div>
            </div>

            <!-- Identity Section -->
            <div class="card border rounded-3 p-3 mb-3 bg-white shadow-none">
              <div class="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                <span class="font-size-11 fw-bold text-uppercase text-muted letter-spacing-1">
                  1. Identity Details
                </span>
                <span class="badge bg-light text-muted font-size-11">Required</span>
              </div>

              <!-- Full Name / Business Name -->
              <div class="mb-3">
                <label class="form-label font-size-13 fw-semibold text-dark mb-1">
                  {{ form.customer_type === 'business' ? 'Business / Account Name' : 'Full Name' }}
                  <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted border-end-0">
                    <i :class="form.customer_type === 'business' ? 'bx bx-buildings' : 'bx bx-user'"></i>
                  </span>
                  <input
                    v-model="form.name"
                    type="text"
                    class="form-control border-start-0 ps-1"
                    :placeholder="form.customer_type === 'business' ? 'e.g. Kamau Supplies Ltd' : 'e.g. Wanjiku Kimani'"
                    required
                    autocomplete="off"
                  />
                </div>
              </div>

              <!-- Contact Person for Business -->
              <div v-if="form.customer_type === 'business'" class="mb-2">
                <label class="form-label font-size-12 fw-semibold text-muted mb-1">
                  Contact Person <span class="text-muted fw-normal">(Optional)</span>
                </label>
                <input
                  v-model="form.contact_person"
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="e.g. Peter Njoroge (Procurement)"
                />
              </div>
            </div>

            <!-- Contact & Duplicate Detection Section -->
            <div class="card border rounded-3 p-3 mb-3 bg-white shadow-none">
              <div class="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                <span class="font-size-11 fw-bold text-uppercase text-muted letter-spacing-1">
                  2. Contact &amp; Reachability
                </span>
                <span v-if="isCheckingPhone" class="spinner-border spinner-border-sm text-primary" role="status"></span>
              </div>

              <div class="row g-2 mb-2">
                <!-- Phone Number -->
                <div class="col-sm-6">
                  <label class="form-label font-size-12 fw-semibold text-dark mb-1">
                    Phone Number
                  </label>
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-light text-muted font-size-12">+254</span>
                    <input
                      v-model="form.phone"
                      type="tel"
                      class="form-control"
                      placeholder="712 345 678"
                      maxlength="15"
                      @input="handlePhoneInput"
                      autocomplete="off"
                    />
                  </div>
                  <small class="text-muted font-size-11 d-block mt-1">Used for M-Pesa prompts and SMS receipts</small>
                </div>

                <!-- Email -->
                <div class="col-sm-6">
                  <label class="form-label font-size-12 fw-semibold text-dark mb-1">
                    Email Address <span class="text-muted fw-normal">(Optional)</span>
                  </label>
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-light text-muted">
                      <i class="bx bx-envelope"></i>
                    </span>
                    <input
                      v-model="form.email"
                      type="email"
                      class="form-control"
                      placeholder="name@company.com"
                      autocomplete="off"
                    />
                  </div>
                  <small class="text-muted font-size-11 d-block mt-1">For digital e-invoices</small>
                </div>
              </div>

              <!-- Existing Customer Warning Alert -->
              <div
                v-if="existingCustomer"
                class="alert alert-warning border border-warning-subtle d-flex align-items-center justify-content-between p-2 mt-2 mb-0 rounded-3"
              >
                <div class="d-flex align-items-center gap-2 font-size-12">
                  <i class="bx bx-error-circle font-size-18 text-warning flex-shrink-0"></i>
                  <div>
                    <span class="fw-semibold text-dark">{{ existingCustomer.name }}</span>
                    <span class="text-muted"> is already registered with this phone.</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn btn-warning btn-sm py-1 px-2 font-size-11 fw-bold text-dark flex-shrink-0"
                  @click="useExistingCustomer(existingCustomer)"
                >
                  <i class="bx bx-check me-1"></i> Use Existing
                </button>
              </div>
            </div>

            <!-- Tax PIN (KRA Compliance) -->
            <div class="card border rounded-3 p-3 mb-3 bg-white shadow-none">
              <div class="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                <span class="font-size-11 fw-bold text-uppercase text-muted letter-spacing-1">
                  3. Tax Compliance &amp; ETR Invoicing
                </span>
                <span
                  v-if="form.tax_pin && isValidKraPin(form.tax_pin)"
                  class="badge bg-soft-success text-success font-size-11"
                >
                  <i class="bx bx-check me-1"></i>Valid KRA PIN
                </span>
              </div>

              <div class="mb-1">
                <label class="form-label font-size-12 fw-semibold text-dark mb-1">
                  KRA PIN <span class="text-muted fw-normal">(Optional — Buyer PIN for VAT Invoices)</span>
                </label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text bg-light text-muted">
                    <i class="bx bx-receipt"></i>
                  </span>
                  <input
                    v-model="form.tax_pin"
                    type="text"
                    class="form-control text-uppercase font-monospace fw-bold"
                    placeholder="e.g. P051234567X / A012345678B"
                    maxlength="11"
                    @input="form.tax_pin = form.tax_pin.toUpperCase().trim()"
                  />
                </div>
                <small class="text-muted font-size-11 d-block mt-1">
                  Enables Kenya Revenue Authority eTIMS compliant B2B tax receipts
                </small>
              </div>
            </div>

            <!-- Fulfilment & Delivery Address (Unified Interactive Toggle Card) -->
            <div
              class="border rounded-3 mb-3 overflow-hidden transition-all bg-white shadow-none"
              :class="showAddressFields ? 'border-primary' : 'border-light-subtle'"
            >
              <!-- Interactive Header / Toggle Bar -->
              <div
                class="p-3 cursor-pointer d-flex align-items-center justify-content-between user-select-none transition-all"
                :class="showAddressFields ? 'bg-primary-subtle bg-opacity-10 border-bottom border-primary-subtle' : 'bg-light'"
                @click="showAddressFields = !showAddressFields"
                role="button"
                tabindex="0"
                @keydown.space.prevent="showAddressFields = !showAddressFields"
                @keydown.enter.prevent="showAddressFields = !showAddressFields"
                style="cursor: pointer;"
              >
                <div class="d-flex align-items-center gap-3">
                  <div class="avatar-xs flex-shrink-0">
                    <span
                      class="avatar-title rounded-circle font-size-16"
                      :class="showAddressFields ? 'bg-primary text-white shadow-sm' : 'bg-white text-primary border'"
                    >
                      <i class="bx bx-map-pin"></i>
                    </span>
                  </div>
                  <div>
                    <div class="d-flex align-items-center gap-2">
                      <h6 class="mb-0 fw-bold font-size-13 text-dark">Add Delivery Address</h6>
                      <span
                        v-if="showAddressFields"
                        class="badge bg-primary text-white font-size-10 px-2 py-0.5 rounded-pill"
                      >
                        <i class="bx bx-check me-1"></i>Active
                      </span>
                    </div>
                    <small class="text-muted font-size-11 d-block mt-0.5">
                      Google Maps location, GPS coordinates, and rider drop-off directions
                    </small>
                  </div>
                </div>

                <div class="form-check form-switch form-switch-md mb-0 ms-2" @click.stop>
                  <input
                    class="form-check-input cursor-pointer"
                    type="checkbox"
                    id="includeAddress"
                    v-model="showAddressFields"
                    role="switch"
                  />
                  <label class="form-check-label visually-hidden" for="includeAddress">Add Delivery Address</label>
                </div>
              </div>

              <!-- Collapsible Address Body -->
              <div v-if="showAddressFields" class="p-3 bg-white">
                <!-- Google Maps Address Search -->
                <div class="mb-3">
                  <label class="form-label font-size-12 fw-semibold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span class="d-flex align-items-center gap-1">
                      <i class="bx bxs-map-pin text-primary font-size-14"></i>
                      <span>Search Landmark, Estate or Road (Google Maps)</span>
                    </span>
                    <span v-if="form.address.latitude && form.address.longitude" class="badge bg-soft-success text-success font-size-11">
                      <i class="mdi mdi-crosshairs-gps me-1"></i>GPS Locked
                    </span>
                  </label>
                  <GoogleLocationInput
                    v-model="mapSearchQuery"
                    placeholder="Search address, landmark, building, or road in Kenya..."
                    @location-selected="onLocationSelected"
                    @location-cleared="onLocationCleared"
                  />
                  <small class="text-muted font-size-11">Select a suggestion to auto-fill town, county, estate, and GPS coordinates.</small>
                </div>

                <div class="row g-2 mb-2">
                  <div class="col-6">
                    <label class="form-label font-size-12 text-muted mb-1">Town / City</label>
                    <input v-model="form.address.town_city" type="text" class="form-control form-control-sm" placeholder="e.g. Nairobi" />
                  </div>
                  <div class="col-6">
                    <label class="form-label font-size-12 text-muted mb-1">Estate / Neighborhood</label>
                    <input v-model="form.address.estate_area" type="text" class="form-control form-control-sm" placeholder="e.g. Kilimani / Westlands" />
                  </div>
                </div>
                <div class="row g-2 mb-2">
                  <div class="col-7">
                    <label class="form-label font-size-12 text-muted mb-1">Building / Complex / House No.</label>
                    <input v-model="form.address.building" type="text" class="form-control form-control-sm" placeholder="e.g. Green Towers, Apt 4B" />
                  </div>
                  <div class="col-5">
                    <label class="form-label font-size-12 text-muted mb-1">Street / Road</label>
                    <input v-model="form.address.street" type="text" class="form-control form-control-sm" placeholder="e.g. Wood Avenue" />
                  </div>
                </div>
                <div>
                  <label class="form-label font-size-12 text-muted mb-1">Delivery / Rider Instructions</label>
                  <input v-model="form.address.additional_directions" type="text" class="form-control form-control-sm" placeholder="e.g. Gate opposite Quickmart, call on arrival" />
                </div>
              </div>
            </div>

            <!-- Notes & Preferences (Collapsible or Clean Section) -->
            <div class="card border rounded-3 p-3 mb-2 bg-white shadow-none">
              <div class="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                <span class="font-size-11 fw-bold text-uppercase text-muted letter-spacing-1">
                  4. Additional Notes
                </span>
                <span class="badge bg-light text-muted font-size-11">Optional</span>
              </div>
              <textarea
                v-model="form.notes"
                class="form-control font-size-12"
                rows="2"
                placeholder="e.g. Preferred delivery time, wholesale credit agreement, customer preferences..."
              ></textarea>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-between">
          <button
            type="button"
            class="btn btn-white font-size-13 px-3"
            data-bs-dismiss="modal"
            @click="resetForm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="quickCustomerForm"
            class="btn btn-primary d-inline-flex align-items-center gap-2 px-4 font-size-13 fw-semibold shadow-sm"
            :disabled="isSubmitting || !form.name.trim()"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status"></span>
            <i v-else class="bx bx-check-circle font-size-16"></i>
            <span>{{ isSubmitting ? 'Registering...' : 'Save & Attach Customer' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import customersApi from '@/api/customers';
import GoogleLocationInput from '@/components/GoogleLocationInput.vue';

const emit = defineEmits(['customer-created']);

const isSubmitting = ref(false);
const isCheckingPhone = ref(false);
const existingCustomer = ref(null);
const showAddressFields = ref(false);
const mapSearchQuery = ref('');
const modalRef = ref(null);

let phoneSearchTimeout = null;

const form = reactive({
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  customer_type: 'individual',
  tax_pin: '',
  notes: '',
  address: {
    town_city: '',
    estate_area: '',
    county: '',
    street: '',
    building: '',
    additional_directions: '',
    latitude: null,
    longitude: null,
  },
});

const isValidKraPin = (pin) => {
  if (!pin) return false;
  // Kenya KRA PIN format: [A|P][0-9]{9}[A-Z]
  return /^[AP]\d{9}[A-Z]$/i.test(pin.trim());
};

const handlePhoneInput = () => {
  const raw = form.phone.replace(/\D/g, '');
  existingCustomer.value = null;

  if (raw.length < 9) return;

  if (phoneSearchTimeout) clearTimeout(phoneSearchTimeout);
  phoneSearchTimeout = setTimeout(async () => {
    isCheckingPhone.value = true;
    try {
      const searchVal = raw.startsWith('0') ? raw : `0${raw}`;
      const res = await customersApi.list({ search: searchVal });
      const items = res.data?.data || res.data || [];
      const match = items.find((c) => {
        const cPhone = (c.phone || '').replace(/\D/g, '');
        return cPhone.endsWith(raw.slice(-9));
      });
      if (match) {
        existingCustomer.value = match;
      }
    } catch {
      // Ignore background search error
    } finally {
      isCheckingPhone.value = false;
    }
  }, 400);
};

const useExistingCustomer = (customer) => {
  emit('customer-created', customer);
  resetForm();
  closeModal();
};

const onLocationSelected = (data) => {
  if (!data) return;
  const comps = data.address_components || [];
  let city = '';
  let estate = '';
  let street = '';
  let county = '';

  for (const c of comps) {
    const types = c.types || [];
    if (types.includes('locality')) {
      city = c.long_name;
    } else if (types.includes('administrative_area_level_2') && !city) {
      city = c.long_name;
    }
    if (types.includes('administrative_area_level_1')) {
      county = c.long_name;
    }
    if (types.includes('sublocality') || types.includes('neighborhood')) {
      estate = c.long_name;
    }
    if (types.includes('route')) {
      street = c.long_name;
    }
  }

  form.address.town_city = city || form.address.town_city || 'Nairobi';
  form.address.estate_area = estate || data.name || form.address.estate_area;
  form.address.county = county || form.address.county;
  form.address.street = street || form.address.street;
  if (!form.address.building && data.name && data.name !== data.formatted_address) {
    form.address.building = data.name;
  }
  form.address.latitude = data.latitude || null;
  form.address.longitude = data.longitude || null;
};

const onLocationCleared = () => {
  form.address.latitude = null;
  form.address.longitude = null;
};

const resetForm = () => {
  form.name = '';
  form.contact_person = '';
  form.phone = '';
  form.email = '';
  form.customer_type = 'individual';
  form.tax_pin = '';
  form.notes = '';
  form.address.town_city = '';
  form.address.estate_area = '';
  form.address.county = '';
  form.address.street = '';
  form.address.building = '';
  form.address.additional_directions = '';
  form.address.latitude = null;
  form.address.longitude = null;
  mapSearchQuery.value = '';
  showAddressFields.value = false;
  existingCustomer.value = null;
};

const closeModal = () => {
  if (window.bootstrap && modalRef.value) {
    const modal = window.bootstrap.Modal.getInstance(modalRef.value);
    if (modal) modal.hide();
  }
};

const handleSubmit = async () => {
  if (!form.name.trim()) return;

  isSubmitting.value = true;
  try {
    const cleanPhone = form.phone.trim();
    const formattedPhone = cleanPhone
      ? (cleanPhone.startsWith('0') ? cleanPhone : cleanPhone.startsWith('254') ? `0${cleanPhone.slice(3)}` : `0${cleanPhone}`)
      : null;

    const payload = {
      name: form.name.trim(),
      phone: formattedPhone,
      email: form.email.trim() || null,
      customer_type: form.customer_type,
      tax_pin: form.tax_pin.trim() ? form.tax_pin.trim().toUpperCase() : null,
      notes: [
        form.contact_person ? `Contact: ${form.contact_person.trim()}` : null,
        form.notes ? form.notes.trim() : null,
      ].filter(Boolean).join(' | ') || null,
    };

    if (showAddressFields.value && (form.address.town_city || form.address.building || form.address.estate_area || mapSearchQuery.value)) {
      payload.address = {
        ...form.address,
        building: form.address.building || mapSearchQuery.value || null,
      };
    }

    const res = await customersApi.create(payload);
    const customer = res.data?.customer || res.data;

    emit('customer-created', customer);
    resetForm();
    closeModal();
  } catch (error) {
    console.error('Error creating customer:', error);
    alert(error.response?.data?.message || 'Failed to register customer. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.letter-spacing-1 {
  letter-spacing: 0.5px;
}
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>
