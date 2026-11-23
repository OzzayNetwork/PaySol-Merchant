<template>
  <div
    class="modal fade"
    id="addCustomerModal"
    tabindex="-1"
    aria-labelledby="addCustomerModalLabel"
    aria-hidden="true"
    ref="modalRef"
  >
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 580px;">
      <div class="modal-content border-0 shadow-lg" style="border-radius: 8px;">
        <!-- Header -->
        <div class="modal-header border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <div class="avatar-xs d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary">
              <i class="bx bx-user-plus font-size-18"></i>
            </div>
            <div>
              <h5 class="modal-title font-size-16 fw-bold mb-0" id="addCustomerModalLabel">
                Register Customer
              </h5>
              <p class="text-muted font-size-12 mb-0">Quick add customer without losing active cart</p>
            </div>
          </div>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
            :disabled="isSubmitting"
          ></button>
        </div>

        <!-- Body -->
        <div class="modal-body p-4">
          <form id="quickCustomerForm" @submit.prevent="handleSubmit">
            <!-- Customer Type -->
            <div class="mb-3">
              <label class="form-label font-size-13 fw-semibold text-dark mb-1">
                Customer Type <span class="text-danger">*</span>
              </label>
              <div class="btn-group w-100" role="group">
                <button
                  type="button"
                  class="btn py-2 fw-semibold font-size-13"
                  :class="form.customer_type === 'individual' ? 'btn-primary shadow-sm' : 'btn-white border text-secondary'"
                  @click="form.customer_type = 'individual'"
                >
                  <i class="bx bx-user me-1"></i> Individual
                </button>
                <button
                  type="button"
                  class="btn py-2 fw-semibold font-size-13"
                  :class="form.customer_type === 'business' ? 'btn-primary shadow-sm' : 'btn-white border text-secondary'"
                  @click="form.customer_type = 'business'"
                >
                  <i class="bx bx-buildings me-1"></i> Business / Corporate
                </button>
              </div>
            </div>

            <!-- Name -->
            <div class="mb-3">
              <label class="form-label font-size-13 fw-semibold text-dark mb-1">
                {{ form.customer_type === 'business' ? 'Business / Account Name' : 'Full Name' }}
                <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                class="form-control"
                :placeholder="form.customer_type === 'business' ? 'e.g. Kamau Supplies Ltd' : 'e.g. Wanjiku Kimani'"
                required
                autocomplete="off"
              />
            </div>

            <!-- Contact Person for Business -->
            <div v-if="form.customer_type === 'business'" class="mb-3">
              <label class="form-label font-size-13 fw-semibold text-dark mb-1">Contact Person</label>
              <input
                v-model="form.contact_person"
                type="text"
                class="form-control"
                placeholder="e.g. Peter Njoroge"
              />
            </div>

            <!-- Phone & Email -->
            <div class="row g-3 mb-3">
              <div class="col-sm-6">
                <label class="form-label font-size-13 fw-semibold text-dark mb-1 d-flex align-items-center justify-content-between">
                  <span>Phone Number</span>
                  <span v-if="isCheckingPhone" class="spinner-border spinner-border-sm text-primary" role="status"></span>
                </label>
                <div class="input-group">
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

                <!-- Existing Customer Warning Alert -->
                <div
                  v-if="existingCustomer"
                  class="alert alert-warning border border-warning-subtle d-flex align-items-center justify-content-between p-2 mt-2 mb-0 rounded"
                >
                  <small class="text-dark"><strong>{{ existingCustomer.name }}</strong> is registered.</small>
                  <button
                    type="button"
                    class="btn btn-warning btn-sm py-0 px-2 font-size-11 fw-bold text-dark"
                    @click="useExistingCustomer(existingCustomer)"
                  >
                    Use Existing
                  </button>
                </div>
              </div>

              <div class="col-sm-6">
                <label class="form-label font-size-13 fw-semibold text-dark mb-1">Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  class="form-control"
                  placeholder="name@example.com"
                  autocomplete="off"
                />
              </div>
            </div>

            <!-- KRA PIN -->
            <div class="mb-3">
              <label class="form-label font-size-13 fw-semibold text-dark mb-1">KRA Tax PIN</label>
              <input
                v-model="form.tax_pin"
                type="text"
                class="form-control text-uppercase font-monospace"
                placeholder="e.g. P051234567X"
                maxlength="11"
                @input="form.tax_pin = form.tax_pin.toUpperCase().trim()"
              />
            </div>

            <!-- Delivery Address Toggle Card -->
            <div
              class="border rounded-3 mb-3 overflow-hidden"
              :class="showAddressFields ? 'border-primary' : 'border-light-subtle'"
            >
              <!-- Toggle Bar -->
              <div
                class="p-3 cursor-pointer d-flex align-items-center justify-content-between user-select-none"
                :class="showAddressFields ? 'bg-primary-subtle bg-opacity-10 border-bottom border-primary-subtle' : 'bg-light'"
                @click="showAddressFields = !showAddressFields"
                role="button"
                tabindex="0"
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
                        Active
                      </span>
                    </div>
                    <small class="text-muted font-size-11 d-block mt-0.5">
                      Google Maps location, GPS coordinates &amp; directions
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
                <div class="mb-2">
                  <label class="form-label font-size-12 fw-semibold text-dark d-flex align-items-center justify-content-between mb-1">
                    <span>Search Google Maps</span>
                    <span v-if="form.address.latitude && form.address.longitude" class="badge bg-soft-success text-success font-size-11">
                      <i class="mdi mdi-crosshairs-gps me-1"></i>GPS Locked
                    </span>
                  </label>
                  <GoogleLocationInput
                    v-model="mapSearchQuery"
                    placeholder="Search address, landmark, building, or road..."
                    @location-selected="onLocationSelected"
                    @location-cleared="onLocationCleared"
                  />
                </div>

                <!-- 🗺️ Map Preview (Non-zoomable map matching gallery.add.vue) -->
                <div v-if="mapUrl" class="position-relative mb-3">
                  <!-- Loader Overlay -->
                  <div
                    v-if="mapLoading"
                    class="d-flex align-items-center justify-content-center"
                    style="position: absolute; inset: 0; background: rgba(255,255,255,0.7); z-index: 10; border-radius: 8px;"
                  >
                    <div class="spinner-border text-primary spinner-border-sm" role="status">
                      <span class="visually-hidden">Loading map...</span>
                    </div>
                  </div>

                  <!-- Map iframe (pointer-events: none prevents scroll-zooming) -->
                  <iframe
                    :src="mapUrl"
                    width="100%"
                    height="180"
                    style="border: 2px solid rgb(229 231 235); border-radius: 8px; overflow: hidden; pointer-events: none; display: block;"
                    allowfullscreen=""
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    @load="mapLoaded"
                  ></iframe>
                </div>

                <div class="row g-2 mb-2">
                  <div class="col-6">
                    <label class="form-label font-size-12 text-muted mb-1">Town / City</label>
                    <input v-model="form.address.town_city" type="text" class="form-control form-control-sm" placeholder="e.g. Nairobi" />
                  </div>
                  <div class="col-6">
                    <label class="form-label font-size-12 text-muted mb-1">Estate / Neighborhood</label>
                    <input v-model="form.address.estate_area" type="text" class="form-control form-control-sm" placeholder="e.g. Kilimani" />
                  </div>
                </div>

                <div class="row g-2 mb-2">
                  <div class="col-7">
                    <label class="form-label font-size-12 text-muted mb-1">Building / Apt No.</label>
                    <input v-model="form.address.building" type="text" class="form-control form-control-sm" placeholder="e.g. Green Towers, Apt 4B" />
                  </div>
                  <div class="col-5">
                    <label class="form-label font-size-12 text-muted mb-1">Street / Road</label>
                    <input v-model="form.address.street" type="text" class="form-control form-control-sm" placeholder="e.g. Wood Avenue" />
                  </div>
                </div>

                <div>
                  <label class="form-label font-size-12 text-muted mb-1">Rider Instructions</label>
                  <input v-model="form.address.additional_directions" type="text" class="form-control form-control-sm" placeholder="e.g. Gate opposite Quickmart, call on arrival" />
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="mb-0">
              <label class="form-label font-size-13 fw-semibold text-dark mb-1">Notes</label>
              <textarea
                v-model="form.notes"
                class="form-control"
                rows="2"
                placeholder="Optional customer notes..."
              ></textarea>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer border-top px-4 py-3 d-flex justify-content-between">
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
import { ref, reactive, computed } from 'vue';
import customersApi from '@/api/customers';
import GoogleLocationInput from '@/components/GoogleLocationInput.vue';

const emit = defineEmits(['customer-created']);

const isSubmitting = ref(false);
const isCheckingPhone = ref(false);
const existingCustomer = ref(null);
const showAddressFields = ref(false);
const mapSearchQuery = ref('');
const modalRef = ref(null);

// 🌍 Map state (referenced from gallery.add.vue)
const selectedLocation = ref(null);
const mapLoading = ref(false);

const mapLoaded = () => {
  mapLoading.value = false;
};

const mapUrl = computed(() => {
  const lat = selectedLocation.value?.latitude || form.address.latitude;
  const lng = selectedLocation.value?.longitude || form.address.longitude;
  if (!lat || !lng) return '';
  return `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
});

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
  mapLoading.value = true;
  selectedLocation.value = data;
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
  selectedLocation.value = null;
  mapLoading.value = false;
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
  selectedLocation.value = null;
  mapLoading.value = false;
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
