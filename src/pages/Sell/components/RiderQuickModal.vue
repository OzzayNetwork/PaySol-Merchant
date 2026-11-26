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
              <Icon icon="ri:e-bike-2-line" class="fs-5" />
            </div>
            <div>
              <h5 class="modal-title font-size-15 fw-bold mb-0 text-dark">Register New Rider</h5>
              <small class="text-muted font-size-12">Reusable across future delivery orders</small>
            </div>
          </div>
          <button type="button" class="btn-close shadow-none" :disabled="saving" @click="close"></button>
        </div>

        <form @submit.prevent="submit">
          <div class="modal-body p-4 d-flex flex-column gap-3">
            <!-- Staff Identification Toggle -->
            <div class="p-3 rounded border" style="background-color: #f8fafc; border-color: #dbe2ea !important;">
              <div class="d-flex align-items-center justify-content-between gap-2">
                <div>
                  <div class="fw-bold font-size-13 text-dark">Business Staff Member?</div>
                  <small class="text-muted font-size-11">Link to an existing employee instead of creating a duplicate.</small>
                </div>
                <div class="form-check form-switch mb-0">
                  <input
                    id="riderIsStaffToggle"
                    v-model="form.is_staff"
                    class="form-check-input"
                    type="checkbox"
                    @change="onIsStaffToggle"
                  />
                </div>
              </div>

              <div v-if="form.is_staff" class="mt-3 pt-2 border-top" style="border-color: #dbe2ea !important;">
                <label class="form-label fw-bold font-size-12 text-dark mb-1">Link Existing Staff Member</label>
                <SelectSearchBox
                  v-model="form.staff_user_id"
                  :options="staffOptions"
                  placeholder="Select employee..."
                  @update:modelValue="onStaffSelected"
                />
              </div>
            </div>

            <!-- Rider Full Name & Phone -->
            <div class="row g-2">
              <div class="col-7">
                <label class="form-label fw-bold font-size-12 text-dark mb-1">
                  Full Name <span class="text-danger">*</span>
                </label>
                <input
                  v-model.trim="form.full_name"
                  type="text"
                  class="form-control"
                  placeholder="e.g. Peter Mwangi"
                  maxlength="150"
                  required
                />
              </div>
              <div class="col-5">
                <label class="form-label fw-bold font-size-12 text-dark mb-1">Phone</label>
                <input
                  v-model.trim="form.phone"
                  type="text"
                  class="form-control"
                  placeholder="0712 345 678"
                  maxlength="40"
                />
              </div>
            </div>

            <!-- Delivery Provider -->
            <div>
              <label class="form-label fw-bold font-size-12 text-dark mb-1">Delivery Provider</label>
              <SelectSearchBox
                v-model="form.delivery_provider_id"
                :options="providerOptions"
                :is-taggable="true"
                placeholder="Select or type delivery provider..."
                @option-created="onProviderCreated"
              />
            </div>

            <!-- Optional Initial Vehicle Registration -->
            <div class="row g-2">
              <div class="col-7">
                <label class="form-label fw-bold font-size-12 text-dark mb-1">
                  Vehicle Number Plate <span class="text-muted fw-normal">(Optional)</span>
                </label>
                <input
                  v-model="form.vehicle_registration"
                  type="text"
                  class="form-control text-uppercase font-monospace"
                  placeholder="e.g. KMFQ 123A"
                  maxlength="40"
                  @input="form.vehicle_registration = form.vehicle_registration.toUpperCase()"
                />
              </div>
              <div class="col-5">
                <label class="form-label fw-bold font-size-12 text-dark mb-1">Vehicle Type</label>
                <select v-model="form.vehicle_type" class="form-select">
                  <option value="motorbike">Motorbike</option>
                  <option value="car">Car</option>
                  <option value="van">Van / Pickup</option>
                  <option value="tuk_tuk">Tuk-Tuk</option>
                  <option value="bicycle">Bicycle</option>
                </select>
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
              :disabled="saving || !form.full_name.trim()"
            >
              <span v-if="saving" class="spinner-border spinner-border-sm" role="status"></span>
              <Icon v-else icon="ri:check-line" class="fs-5" />
              <span>{{ saving ? 'Saving...' : 'Save Rider' }}</span>
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
import ridersApi from "@/api/riders";
import SelectSearchBox from "@/components/SelectSearchBox.vue";

const props = defineProps({
  visible: { type: Boolean, default: false },
  providers: { type: Array, default: () => [] },
  staffList: { type: Array, default: () => [] },
  branchId: { type: [Number, String], default: null },
});

const emit = defineEmits(["close", "created", "provider-created"]);

const saving = ref(false);
const errorMsg = ref("");
const localProviders = ref([]);

const form = ref({
  is_staff: false,
  staff_user_id: null,
  full_name: "",
  phone: "",
  delivery_provider_id: null,
  vehicle_registration: "",
  vehicle_type: "motorbike",
});

watch(
  () => [props.visible, props.providers],
  ([vis, provs]) => {
    localProviders.value = Array.isArray(provs) ? [...provs] : [];
    if (vis) {
      errorMsg.value = "";
      const fleet = localProviders.value.find((p) => p.code === "in_house_fleet");
      form.value = {
        is_staff: false,
        staff_user_id: null,
        full_name: "",
        phone: "",
        delivery_provider_id: fleet?.id || localProviders.value[0]?.id || null,
        vehicle_registration: "",
        vehicle_type: "motorbike",
      };
    }
  },
  { immediate: true }
);

const providerOptions = computed(() =>
  localProviders.value.map((p) => ({ label: p.name, value: p.id }))
);

const staffOptions = computed(() =>
  (props.staffList || []).map((s) => ({
    label: `${s.name}${s.role ? ` (${s.role})` : ""}`,
    value: s.user_id,
  }))
);

function onIsStaffToggle() {
  if (!form.value.is_staff) {
    form.value.staff_user_id = null;
  } else {
    const fleet = localProviders.value.find((p) => p.code === "in_house_fleet");
    if (fleet) form.value.delivery_provider_id = fleet.id;
  }
}

function onStaffSelected(userId) {
  const emp = (props.staffList || []).find((s) => String(s.user_id) === String(userId));
  if (emp) {
    form.value.full_name = emp.name;
    if (emp.phone) form.value.phone = emp.phone;
  }
}

async function onProviderCreated(newName) {
  const label = typeof newName === "string" ? newName : newName?.label || "";
  if (label.trim().length < 2) return;
  try {
    const { data } = await ridersApi.createProvider(label.trim());
    if (data?.data) {
      if (!localProviders.value.some((p) => p.id === data.data.id)) {
        localProviders.value.push(data.data);
      }
      form.value.delivery_provider_id = data.data.id;
      emit("provider-created", data.data);
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.message || "Could not create delivery provider.";
  }
}

function close() {
  if (saving.value) return;
  emit("close");
}

async function submit() {
  if (saving.value || !form.value.full_name.trim()) return;
  saving.value = true;
  errorMsg.value = "";
  try {
    const { data } = await ridersApi.create({
      full_name: form.value.full_name.trim(),
      phone: form.value.phone.trim() || null,
      branch_id: props.branchId ? Number(props.branchId) : null,
      delivery_provider_id: form.value.delivery_provider_id || null,
      is_staff: !!form.value.is_staff,
      staff_user_id: form.value.is_staff ? form.value.staff_user_id : null,
      vehicle_registration: form.value.vehicle_registration.trim() || null,
      vehicle_type: form.value.vehicle_type || "motorbike",
    });
    if (data?.data) {
      emit("created", data.data);
    }
  } catch (err) {
    errorMsg.value =
      err.response?.data?.message ||
      Object.values(err.response?.data?.errors || {})?.[0]?.[0] ||
      "Failed to register rider.";
  } finally {
    saving.value = false;
  }
}
</script>
