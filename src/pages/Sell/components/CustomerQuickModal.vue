<template>
  <div
    class="modal fade"
    id="quickCustomerModal"
    tabindex="-1"
    aria-labelledby="quickCustomerModalLabel"
    aria-hidden="true"
    ref="modalRef"
  >
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 580px;">
      <div class="modal-content flat-card border" style="border-radius: 8px;">
        <div class="modal-header border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <div class="tone-chip tone-chip-primary">
              <i class="bx bx-user-plus fs-5"></i>
            </div>
            <div>
              <h5 class="modal-title font-size-16 fw-bold mb-0" id="quickCustomerModalLabel">Register Customer</h5>
              <small class="text-muted">Quick add without losing the prepared cart</small>
            </div>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body px-4 py-3">
          <form id="quickCustomerForm" @submit.prevent="handleSubmit">
            <!-- Customer Type Selector -->
            <div class="mb-3">
              <label class="form-label font-size-13 fw-semibold text-dark">Customer Type</label>
              <div class="d-flex gap-2">
                <button
                  type="button"
                  class="btn flex-fill"
                  :class="form.customer_type === 'individual' ? 'btn-primary' : 'btn-white'"
                  @click="form.customer_type = 'individual'"
                >
                  <i class="bx bx-user me-1"></i> Individual
                </button>
                <button
                  type="button"
                  class="btn flex-fill"
                  :class="form.customer_type === 'business' ? 'btn-primary' : 'btn-white'"
                  @click="form.customer_type = 'business'"
                >
                  <i class="bx bx-buildings me-1"></i> Business / Corporate
                </button>
              </div>
            </div>

            <!-- Name -->
            <div class="mb-3">
              <label class="form-label font-size-13 fw-semibold text-dark">
                {{ form.customer_type === 'business' ? 'Business Name' : 'Full Name' }}
                <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                class="form-control"
                placeholder="e.g. Wanjiku Kimani / Kamau Supplies"
                required
              />
            </div>

            <!-- Phone & Email -->
            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label font-size-13 fw-semibold text-dark">Phone Number</label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted font-size-12">+254</span>
                  <input
                    v-model="form.phone"
                    type="tel"
                    class="form-control"
                    placeholder="712 345 678"
                  />
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label font-size-13 fw-semibold text-dark">Email (Optional)</label>
                <input
                  v-model="form.email"
                  type="email"
                  class="form-control"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <!-- Optional Delivery Address Toggle -->
            <div class="mb-2">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="includeAddress"
                  v-model="showAddressFields"
                />
                <label class="form-check-label font-size-13 fw-semibold text-dark" for="includeAddress">
                  Add Delivery Address
                </label>
              </div>
            </div>

            <div v-if="showAddressFields" class="p-3 bg-light rounded border mb-3">
              <div class="row g-2 mb-2">
                <div class="col-6">
                  <label class="form-label font-size-12 text-muted">Town / City</label>
                  <input v-model="form.address.town_city" type="text" class="form-control form-control-sm" placeholder="e.g. Nairobi" />
                </div>
                <div class="col-6">
                  <label class="form-label font-size-12 text-muted">Estate / Area</label>
                  <input v-model="form.address.estate_area" type="text" class="form-control form-control-sm" placeholder="e.g. Kilimani / Westlands" />
                </div>
              </div>
              <div class="mb-2">
                <label class="form-label font-size-12 text-muted">Building / Street / Floor</label>
                <input v-model="form.address.building" type="text" class="form-control form-control-sm" placeholder="e.g. Green Towers, 3rd Floor" />
              </div>
              <div>
                <label class="form-label font-size-12 text-muted">Delivery Directions</label>
                <input v-model="form.address.additional_directions" type="text" class="form-control form-control-sm" placeholder="e.g. Gate opposite Quickmart" />
              </div>
            </div>

            <!-- Notes -->
            <div class="mb-2">
              <label class="form-label font-size-13 text-muted">Customer Notes (Optional)</label>
              <textarea
                v-model="form.notes"
                class="form-control"
                rows="2"
                placeholder="e.g. Regular wholesale buyer, prefers M-Pesa"
              ></textarea>
            </div>
          </form>
        </div>

        <div class="modal-footer border-top px-4 py-3 d-flex justify-content-between">
          <button type="button" class="btn btn-white" data-bs-dismiss="modal">Cancel</button>
          <button
            type="submit"
            form="quickCustomerForm"
            class="btn btn-primary d-inline-flex align-items-center gap-1"
            :disabled="isSubmitting || !form.name.trim()"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
            <i v-else class="bx bx-check font-size-16"></i>
            <span>{{ isSubmitting ? 'Registering...' : 'Save & Select Customer' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import customersApi from '@/api/customers';

const emit = defineEmits(['customer-created']);

const isSubmitting = ref(false);
const showAddressFields = ref(false);
const modalRef = ref(null);

const form = reactive({
  name: '',
  phone: '',
  email: '',
  customer_type: 'individual',
  notes: '',
  address: {
    town_city: '',
    estate_area: '',
    building: '',
    additional_directions: '',
  },
});

const resetForm = () => {
  form.name = '';
  form.phone = '';
  form.email = '';
  form.customer_type = 'individual';
  form.notes = '';
  form.address.town_city = '';
  form.address.estate_area = '';
  form.address.building = '';
  form.address.additional_directions = '';
  showAddressFields.value = false;
};

const handleSubmit = async () => {
  if (!form.name.trim()) return;

  isSubmitting.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() ? (form.phone.startsWith('0') ? form.phone : `0${form.phone}`) : null,
      email: form.email.trim() || null,
      customer_type: form.customer_type,
      notes: form.notes.trim() || null,
    };

    if (showAddressFields.value && (form.address.town_city || form.address.building)) {
      payload.address = { ...form.address };
    }

    const res = await customersApi.create(payload);
    const customer = res.data?.customer || res.data;

    emit('customer-created', customer);
    resetForm();

    // Close modal via bootstrap
    if (window.bootstrap && modalRef.value) {
      const modal = window.bootstrap.Modal.getInstance(modalRef.value);
      if (modal) modal.hide();
    }
  } catch (error) {
    console.error('Error creating customer:', error);
    alert(error.response?.data?.message || 'Failed to register customer. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>
