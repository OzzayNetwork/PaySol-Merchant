<template>
  <Teleport to="body">
    <div
      class="modal fade text-dark"
      id="addTableModal"
      tabindex="-1"
      aria-labelledby="addTableModalLabel"
      aria-hidden="true"
      ref="addTableModalRef"
    >
      <div class="modal-dialog modal-dialog-centered" style="max-width: 540px;">
        <div class="modal-content shadow-lg border-0" style="border-radius: 10px;">
          <!-- Header -->
          <div class="modal-header border-bottom px-4 py-3">
            <div>
              <h5 class="modal-title fw-bold text-dark fs-5 mb-0" id="addTableModalLabel">
                {{ title }}
              </h5>
              <small class="text-muted font-size-12">Register a new dining or lounge table for this branch</small>
            </div>
            <button
              type="button"
              class="btn-close shadow-none"
              data-bs-dismiss="modal"
              aria-label="Close"
              :disabled="tableAddLoading"
            ></button>
          </div>

          <!-- Body -->
          <div class="modal-body p-4">
            <form id="tenantAddTableForm" @submit.prevent="handleSubmit">
              <fieldset :disabled="tableAddLoading">
                <!-- Table Number (required, live uniqueness check) -->
                <div class="mb-3">
                  <label for="tenantTableNumber" class="form-label fw-semibold text-dark font-size-13 mb-1">
                    Table Number <span class="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="tenantTableNumber"
                    class="form-control"
                    placeholder="e.g. T-05, 12, VIP-1"
                    ref="tableNumberInputRef"
                    v-model="tableNumber"
                    @input="handleTableNumberTyping"
                    maxlength="50"
                    autocomplete="off"
                    required
                  />
                  <small v-if="!tableExists" class="text-muted d-block mt-1 font-size-12">
                    A unique identifier for this table. Keep it short.
                  </small>
                </div>

                <!-- Already exists warning -->
                <div
                  v-if="tableExists"
                  class="alert alert-warning d-flex flex-column gap-2 p-3 mb-3"
                  style="border-radius: 8px;"
                  role="alert"
                >
                  <div class="d-flex align-items-center gap-2">
                    <i class="mdi mdi-alert-circle-outline text-warning fs-5"></i>
                    <span class="font-size-13">
                      Table <strong class="fw-semibold">"{{ tableNumber.trim() }}"</strong> already exists in this branch.
                    </span>
                  </div>
                  <div v-if="showSelect && existingTableId">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-muted-primary"
                      @click="selectExistingTable"
                    >
                      Select This Table
                    </button>
                  </div>
                </div>

                <!-- Label (optional friendly name) -->
                <div class="mb-3">
                  <label for="tenantTableLabel" class="form-label fw-semibold text-dark font-size-13 mb-1">
                    Label <span class="text-muted fw-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="tenantTableLabel"
                    class="form-control"
                    placeholder="e.g. Window Side, VIP Booth"
                    v-model="tableLabel"
                    maxlength="100"
                  />
                  <small class="text-muted d-block mt-1 font-size-12">
                    Optional friendly name shown next to the table number.
                  </small>
                </div>

                <!-- Section -->
                <div class="mb-3">
                  <label for="tenantTableSection" class="form-label fw-semibold text-dark font-size-13 mb-1">
                    Section <span class="text-muted fw-normal">(Optional)</span>
                    <span
                      v-if="loadingMetadata"
                      class="spinner-border spinner-border-sm text-secondary ms-1"
                      style="width: 12px; height: 12px;"
                    ></span>
                  </label>
                  <input
                    type="text"
                    id="tenantTableSection"
                    class="form-control"
                    list="tenantTableSectionsList"
                    placeholder="Pick existing or type a new section (e.g. Terrace, Lounge)"
                    v-model="tableSection"
                    maxlength="100"
                    autocomplete="off"
                  />
                  <datalist id="tenantTableSectionsList">
                    <option v-for="sec in availableSections" :key="sec.id" :value="sec.name" />
                  </datalist>
                  <small v-if="!loadingMetadata && availableSections.length === 0" class="text-muted d-block mt-1 font-size-12">
                    No sections yet — typing one will create it automatically.
                  </small>
                </div>

                <!-- Capacity + Min Capacity -->
                <div class="row g-3 mb-3">
                  <div class="col-sm-6">
                    <label for="tenantTableCapacity" class="form-label fw-semibold text-dark font-size-13 mb-1">
                      Capacity
                    </label>
                    <input
                      type="number"
                      id="tenantTableCapacity"
                      class="form-control"
                      placeholder="e.g. 4"
                      v-model.number="tableCapacity"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div class="col-sm-6">
                    <label for="tenantTableMinCapacity" class="form-label fw-semibold text-dark font-size-13 mb-1">
                      Min. Capacity
                    </label>
                    <input
                      type="number"
                      id="tenantTableMinCapacity"
                      class="form-control"
                      placeholder="e.g. 1"
                      v-model.number="tableMinCapacity"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div v-if="capacityInvalid" class="col-12 mt-1">
                    <small class="text-danger font-size-12">
                      Min. capacity cannot be greater than capacity.
                    </small>
                  </div>
                </div>

                <!-- Notes / Description -->
                <div class="mb-0">
                  <label for="tenantTableNotes" class="form-label fw-semibold text-dark font-size-13 mb-1">
                    Notes <span class="text-muted fw-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="tenantTableNotes"
                    class="form-control"
                    placeholder="Notes about this table..."
                    rows="2"
                    v-model="tableNotes"
                    maxlength="500"
                  ></textarea>
                </div>
              </fieldset>
            </form>
          </div>

          <!-- Footer -->
          <div class="modal-footer border-top px-4 py-3 d-flex justify-content-end gap-2">
            <button
              type="button"
              class="btn btn-white"
              :disabled="tableAddLoading || !isDirty"
              @click="resetForm"
            >
              {{ cancelText }}
            </button>
            <button
              type="submit"
              form="tenantAddTableForm"
              class="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2"
              :disabled="tableAddLoading || !tableNumber.trim() || tableExists || capacityInvalid"
            >
              <span
                v-if="tableAddLoading"
                class="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              <span>{{ tableAddLoading ? 'Saving...' : confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <ImageToast
      :status="toastStatus"
      :title="toastTitle"
      :message="toastMessage"
      :image="toastImage"
      :image-height="64"
      @hide="toastStatus = null"
    />
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from "vue";
import tablesApi from "@/api/tables";
import { useShiftStore } from "@/stores/shift";
import ImageToast from "@/components/ImageToast.vue";
import successImage from "@/assets/images/icons/check.png";
import errorImage from "@/assets/images/icons/error.png";

const props = defineProps({
  title: { type: String, default: "Add New Table" },
  cancelText: { type: String, default: "Clear Form" },
  confirmText: { type: String, default: "Save Table" },
  showSelect: { type: Boolean, default: true },
  existingTables: { type: Array, default: () => [] },
});

const emit = defineEmits(["table-added", "table-selected"]);

const shiftStore = useShiftStore();

const addTableModalRef = ref(null);
const tableNumberInputRef = ref(null);

const tableNumber = ref("");
const tableLabel = ref("");
const tableSection = ref("");
const tableCapacity = ref(4);
const tableMinCapacity = ref(1);
const tableNotes = ref("");

const availableSections = ref([]);
const branchTables = ref([]);
const loadingMetadata = ref(false);
const tableAddLoading = ref(false);
const tableExists = ref(false);
const existingTableId = ref(null);

// Toast state
const toastStatus = ref(null);
const toastTitle = ref("");
const toastMessage = ref("");
const toastImage = ref(null);

function showToast(status, title, message) {
  toastStatus.value = status;
  toastTitle.value = title;
  toastMessage.value = message;
  toastImage.value =
    status === "success" ? successImage : status === "error" ? errorImage : null;
}

function resolveBranchId() {
  return (
    shiftStore.activeShift?.branch_id ||
    shiftStore.selectedBranchId ||
    (shiftStore.branches?.length
      ? shiftStore.branches.find((b) => b.is_main)?.id || shiftStore.branches[0].id
      : null) ||
    null
  );
}

const isDirty = computed(
  () =>
    tableNumber.value.trim() !== "" ||
    tableLabel.value.trim() !== "" ||
    tableSection.value.trim() !== "" ||
    tableNotes.value.trim() !== "" ||
    tableCapacity.value !== 4 ||
    tableMinCapacity.value !== 1
);

const capacityInvalid = computed(() => {
  const cap = Number(tableCapacity.value);
  const min = Number(tableMinCapacity.value);
  if (!cap || !min) return false;
  return min > cap;
});

function handleTableNumberTyping() {
  const needle = tableNumber.value.trim().toLowerCase();
  if (!needle) {
    tableExists.value = false;
    existingTableId.value = null;
    return;
  }

  const pool = branchTables.value.length ? branchTables.value : props.existingTables;
  const match = pool.find(
    (t) => String(t.table_number || "").trim().toLowerCase() === needle
  );

  if (match) {
    tableExists.value = true;
    existingTableId.value = match.id;
  } else {
    tableExists.value = false;
    existingTableId.value = null;
  }
}

function selectExistingTable() {
  if (!existingTableId.value) return;
  emit("table-selected", existingTableId.value);
  hideModal();
}

function hideModal() {
  const el = addTableModalRef.value;
  if (el && window.bootstrap?.Modal) {
    window.bootstrap.Modal.getOrCreateInstance(el)?.hide();
  }
}

function clearFormValuesOnly() {
  tableNumber.value = "";
  tableLabel.value = "";
  tableSection.value = "";
  tableCapacity.value = 4;
  tableMinCapacity.value = 1;
  tableNotes.value = "";
  tableExists.value = false;
  existingTableId.value = null;
}

async function resetForm() {
  clearFormValuesOnly();
  await nextTick();
  tableNumberInputRef.value?.focus();
}

async function loadMetadata() {
  const branchId = resolveBranchId();
  if (!branchId) return;

  loadingMetadata.value = true;
  try {
    const [secRes, tblRes] = await Promise.all([
      tablesApi.sections({ branch_id: branchId }),
      tablesApi.list({ branch_id: branchId }),
    ]);
    availableSections.value = secRes.data?.data || [];
    branchTables.value = tblRes.data?.data || [];
    handleTableNumberTyping();
  } catch (err) {
    console.warn("Could not load table sections/metadata:", err);
  } finally {
    loadingMetadata.value = false;
  }
}

async function handleSubmit() {
  const number = tableNumber.value.trim();
  if (!number) {
    showToast("error", "Table Number Required", "Please enter a table number before saving.");
    return;
  }

  if (capacityInvalid.value) {
    showToast("error", "Invalid Capacity", "Min. capacity cannot be greater than capacity.");
    return;
  }

  const branchId = resolveBranchId();
  if (!branchId) {
    showToast("error", "Branch Not Selected", "Could not determine active branch. Please select a branch first.");
    return;
  }

  tableAddLoading.value = true;
  showToast("loading", "Saving Table", `Creating table ${number}...`);

  try {
    // Resolve or create section if provided
    let sectionId = null;
    const sectionName = tableSection.value.trim();
    if (sectionName) {
      const existingSec = availableSections.value.find(
        (s) => String(s.name || "").trim().toLowerCase() === sectionName.toLowerCase()
      );
      if (existingSec) {
        sectionId = existingSec.id;
      } else {
        const secRes = await tablesApi.createSection({
          branch_id: Number(branchId),
          name: sectionName,
        });
        const createdSec = secRes.data?.data || secRes.data;
        if (createdSec?.id) {
          sectionId = createdSec.id;
          availableSections.value.push(createdSec);
        }
      }
    }

    const payload = {
      branch_id: Number(branchId),
      table_number: number,
      section_id: sectionId,
      label: tableLabel.value.trim() || null,
      capacity: tableCapacity.value ? Number(tableCapacity.value) : 4,
      min_capacity: tableMinCapacity.value ? Number(tableMinCapacity.value) : 1,
      notes: tableNotes.value.trim() || null,
    };

    const res = await tablesApi.createTable(payload);
    const created = res.data?.data || res.data;

    showToast(
      "success",
      "Table Created",
      `<strong>Table ${created?.table_number || number}</strong> was added successfully.`
    );

    hideModal();
    emit("table-added", created);
    if (created?.id) {
      emit("table-selected", created.id);
    }
    clearFormValuesOnly();
  } catch (err) {
    const apiData = err?.response?.data;
    const fieldErrors = apiData?.errors;
    const msg =
      (fieldErrors && Object.values(fieldErrors).flat()[0]) ||
      apiData?.message ||
      "Failed to create table. Please try again.";
    showToast("error", "Could Not Create Table", msg);
  } finally {
    tableAddLoading.value = false;
  }
}

let onShownHandler = null;
let onHiddenHandler = null;

onMounted(() => {
  const el = addTableModalRef.value;
  if (!el) return;

  onShownHandler = () => {
    loadMetadata();
    nextTick(() => tableNumberInputRef.value?.focus());
  };
  onHiddenHandler = () => {
    clearFormValuesOnly();
  };

  el.addEventListener("shown.bs.modal", onShownHandler);
  el.addEventListener("hidden.bs.modal", onHiddenHandler);
});

onBeforeUnmount(() => {
  const el = addTableModalRef.value;
  if (!el) return;
  if (onShownHandler) el.removeEventListener("shown.bs.modal", onShownHandler);
  if (onHiddenHandler) el.removeEventListener("hidden.bs.modal", onHiddenHandler);
});
</script>
