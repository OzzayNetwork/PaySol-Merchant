<template>
  <div
    class="modal fade"
    id="supplierFormModal"
    ref="modalEl"
    tabindex="-1"
    aria-labelledby="supplierFormModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow">
        <div class="modal-header border-bottom py-3">
          <div class="d-flex align-items-center gap-2">
            <div class="avatar-xs d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary">
              <Icon :icon="isEdit ? 'ri:edit-2-line' : 'ri:truck-line'" class="fs-5" />
            </div>
            <div>
              <h5 class="modal-title font-size-16 mb-0" id="supplierFormModalLabel">
                {{ isEdit ? 'Edit Supplier' : 'Register New Supplier' }}
              </h5>
              <p class="text-muted fs-12 mb-0">
                {{ isEdit ? `Update profile and terms for ${form.name}` : 'Vendor details, contact information, tax PIN & payment terms' }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
            :disabled="saving"
          ></button>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="modal-body p-4">
            <!-- Server Error Alert -->
            <div v-if="errorMessage" class="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3" role="alert">
              <Icon icon="ri:error-warning-line" class="fs-5 flex-shrink-0" />
              <div class="fs-13">{{ errorMessage }}</div>
            </div>

            <!-- Basic Details -->
            <div class="row g-3 mb-3">
              <div class="col-12 col-md-8">
                <label class="form-label fs-13 fw-semibold">
                  Supplier / Company Name <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted">
                    <Icon icon="ri:building-line" />
                  </span>
                  <input
                    v-model="form.name"
                    type="text"
                    class="form-control"
                    placeholder="e.g. Brookside Dairies Ltd, Farmer's Choice"
                    required
                    maxlength="150"
                  />
                </div>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label fs-13 fw-semibold">KRA Tax PIN</label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted">
                    <Icon icon="ri:file-text-line" />
                  </span>
                  <input
                    v-model="form.tax_pin"
                    type="text"
                    class="form-control text-uppercase"
                    placeholder="e.g. P051234567Z"
                    maxlength="30"
                  />
                </div>
              </div>
            </div>

            <!-- Contact Information -->
            <div class="row g-3 mb-3">
              <div class="col-12 col-md-4">
                <label class="form-label fs-13 fw-semibold">Contact Person</label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted">
                    <Icon icon="ri:user-line" />
                  </span>
                  <input
                    v-model="form.contact_person"
                    type="text"
                    class="form-control"
                    placeholder="e.g. John Mwangi"
                    maxlength="120"
                  />
                </div>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label fs-13 fw-semibold">Phone Number</label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted">
                    <Icon icon="ri:phone-line" />
                  </span>
                  <input
                    v-model="form.phone"
                    type="tel"
                    class="form-control"
                    placeholder="e.g. 0712 345 678"
                    maxlength="32"
                  />
                </div>
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label fs-13 fw-semibold">Email Address</label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted">
                    <Icon icon="ri:mail-line" />
                  </span>
                  <input
                    v-model="form.email"
                    type="email"
                    class="form-control"
                    placeholder="e.g. orders@supplier.co.ke"
                    maxlength="120"
                  />
                </div>
              </div>
            </div>

            <!-- Address & Location -->
            <div class="row g-3 mb-3">
              <div class="col-12 col-md-7">
                <label class="form-label fs-13 fw-semibold">Physical Address / Warehouse</label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted">
                    <Icon icon="ri:map-pin-line" />
                  </span>
                  <input
                    v-model="form.address"
                    type="text"
                    class="form-control"
                    placeholder="e.g. Industrial Area, Enterprise Road, Nairobi"
                    maxlength="255"
                  />
                </div>
              </div>

              <div class="col-12 col-md-5">
                <label class="form-label fs-13 fw-semibold">Payment Terms</label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted">
                    <Icon icon="ri:money-dollar-circle-line" />
                  </span>
                  <input
                    v-model="form.payment_terms"
                    type="text"
                    class="form-control"
                    list="paymentTermsSuggestions"
                    placeholder="e.g. Net 30, COD"
                    maxlength="60"
                  />
                  <datalist id="paymentTermsSuggestions">
                    <option value="Cash on Delivery (COD)" />
                    <option value="Net 7 Days" />
                    <option value="Net 14 Days" />
                    <option value="Net 30 Days" />
                    <option value="Net 60 Days" />
                    <option value="Prepaid" />
                    <option value="Consignment" />
                  </datalist>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="mb-3">
              <label class="form-label fs-13 fw-semibold">Notes / Delivery Schedule</label>
              <textarea
                v-model="form.notes"
                class="form-control"
                rows="2"
                placeholder="e.g. Delivers every Tuesday and Thursday at 8:00 AM. Minimum order value KES 15,000."
                maxlength="1000"
              ></textarea>
            </div>

            <!-- Active Status (Edit Mode) -->
            <div v-if="isEdit" class="d-flex align-items-center justify-content-between p-3 bg-light rounded-3">
              <div>
                <div class="fw-semibold fs-13 text-dark">Active Status</div>
                <div class="text-muted fs-12">
                  {{ form.is_active ? 'Active suppliers appear in stock intake dropdowns.' : 'Inactive suppliers are hidden from daily intake.' }}
                </div>
              </div>
              <div class="form-check form-switch mb-0">
                <input
                  v-model="form.is_active"
                  class="form-check-input fs-5 cursor-pointer"
                  type="checkbox"
                  role="switch"
                  id="supplierActiveSwitch"
                />
              </div>
            </div>
          </div>

          <div class="modal-footer border-top py-2 px-4 bg-light">
            <button
              type="button"
              class="btn btn-light"
              data-bs-dismiss="modal"
              :disabled="saving"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary d-inline-flex align-items-center gap-2"
              :disabled="saving || !form.name?.trim()"
            >
              <span
                v-if="saving"
                class="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              <Icon v-else :icon="isEdit ? 'ri:check-line' : 'ri:user-add-line'" class="fs-5" />
              <span>{{ isEdit ? 'Save Changes' : 'Register Supplier' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import SuppliersAPI from "@/api/suppliers";

const emit = defineEmits(["saved", "error"]);

const modalEl = ref(null);
const saving = ref(false);
const errorMessage = ref("");
const supplierId = ref(null);

const form = ref({
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  tax_pin: "",
  payment_terms: "Cash on Delivery (COD)",
  notes: "",
  is_active: true,
});

const isEdit = computed(() => Boolean(supplierId.value));

function open(supplier = null) {
  errorMessage.value = "";
  saving.value = false;

  if (supplier && supplier.id) {
    supplierId.value = supplier.id;
    form.value = {
      name: supplier.name || "",
      contact_person: supplier.contact_person || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      tax_pin: supplier.tax_pin || "",
      payment_terms: supplier.payment_terms || "Cash on Delivery (COD)",
      notes: supplier.notes || "",
      is_active: supplier.is_active ?? true,
    };
  } else {
    supplierId.value = null;
    form.value = {
      name: typeof supplier === 'string' ? supplier : "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      tax_pin: "",
      payment_terms: "Cash on Delivery (COD)",
      notes: "",
      is_active: true,
    };
  }

  if (window.bootstrap?.Modal) {
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl.value);
    modal.show();
  }
}

async function handleSubmit() {
  if (!form.value.name?.trim()) return;

  saving.value = true;
  errorMessage.value = "";

  const payload = {
    name: form.value.name.trim(),
    contact_person: form.value.contact_person?.trim() || null,
    phone: form.value.phone?.trim() || null,
    email: form.value.email?.trim() || null,
    address: form.value.address?.trim() || null,
    tax_pin: form.value.tax_pin?.trim().toUpperCase() || null,
    payment_terms: form.value.payment_terms?.trim() || null,
    notes: form.value.notes?.trim() || null,
  };

  try {
    let result;
    if (isEdit.value) {
      payload.is_active = form.value.is_active;
      const { data } = await SuppliersAPI.update(supplierId.value, payload);
      result = data.data;
    } else {
      const { data } = await SuppliersAPI.create(payload);
      result = data.data;
    }

    if (window.bootstrap?.Modal) {
      const modal = window.bootstrap.Modal.getInstance(modalEl.value);
      modal?.hide();
    }

    emit("saved", {
      isEdit: isEdit.value,
      supplier: result,
      message: isEdit.value
        ? `Supplier '${result.name}' updated successfully.`
        : `Supplier '${result.name}' registered successfully.`,
    });
  } catch (err) {
    console.error("Error saving supplier:", err);
    errorMessage.value =
      err.response?.data?.message ||
      "Unable to save supplier. Please check required fields.";
    emit("error", errorMessage.value);
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>

<style scoped>
.form-label {
  margin-bottom: 0.35rem;
}
</style>
