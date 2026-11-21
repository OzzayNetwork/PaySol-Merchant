<template>
  <div
    class="modal fade"
    id="stockTransferDispatchModal"
    ref="modalEl"
    tabindex="-1"
    aria-labelledby="stockTransferDispatchModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border">
        <!-- Header -->
        <div class="modal-header border-bottom py-3">
          <div class="d-flex align-items-center gap-2">
            <div class="avatar-xs d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary">
              <i class="bx bx-transfer fs-5"></i>
            </div>
            <div>
              <h5 class="modal-title font-size-16 mb-0" id="stockTransferDispatchModalLabel">
                Dispatch Inter-Branch Transfer
              </h5>
              <p class="text-muted fs-12 mb-0">
                Move inventory stock between business branches
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
            <!-- Branch routing card -->
            <div class="section-card border rounded-3 p-3 bg-light-subtle mb-4">
              <div class="row g-3 align-items-center">
                <!-- Source Branch -->
                <div class="col-md-5">
                  <label class="form-label fw-semibold fs-12 text-dark mb-1">
                    From (Source Branch) <span class="text-danger">*</span>
                  </label>
                  <select
                    class="form-select"
                    v-model="form.source_branch_id"
                    required
                    @change="onSourceBranchChange"
                  >
                    <option v-for="b in branches" :key="b.id" :value="b.id">
                      {{ b.name }} {{ b.is_main ? '(Main)' : '' }}
                    </option>
                  </select>
                </div>

                <!-- Transfer Arrow -->
                <div class="col-md-2 text-center d-none d-md-block pt-3">
                  <div class="transfer-arrow text-primary">
                    <i class="bx bx-right-arrow-alt fs-2"></i>
                  </div>
                </div>

                <!-- Destination Branch -->
                <div class="col-md-5">
                  <label class="form-label fw-semibold fs-12 text-dark mb-1">
                    To (Destination Branch) <span class="text-danger">*</span>
                  </label>
                  <select
                    class="form-select"
                    v-model="form.destination_branch_id"
                    required
                  >
                    <option :value="null" disabled>Select receiving branch...</option>
                    <option
                      v-for="b in destinationBranchOptions"
                      :key="b.id"
                      :value="b.id"
                    >
                      {{ b.name }} {{ b.is_main ? '(Main)' : '' }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Items Section -->
            <div class="mb-4">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center gap-2">
                  <h6 class="fs-13 fw-bold text-uppercase text-dark mb-0">Items to Transfer</h6>
                  <span class="badge bg-white text-dark border font-size-11">
                    {{ form.items.length }} {{ form.items.length === 1 ? 'line' : 'lines' }}
                  </span>
                </div>
                <button
                  type="button"
                  class="btn btn-sm btn-white d-inline-flex align-items-center gap-1 waves-effect border"
                  @click="addItem"
                >
                  <i class="bx bx-plus font-size-14 text-primary"></i>
                  <span>Add Product</span>
                </button>
              </div>

              <!-- Table Container (Activity Day Box Style) -->
              <div class="activity-day-box bg-white overflow-hidden">
                <div class="table-responsive">
                  <table class="table align-middle mb-0 transfer-table">
                    <thead>
                      <tr>
                        <th style="width: 40px;" class="text-center">#</th>
                        <th style="min-width: 280px;">Product Item <span class="text-danger">*</span></th>
                        <th style="width: 140px;" class="text-end">Transfer Qty <span class="text-danger">*</span></th>
                        <th style="width: 44px;" class="text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(it, idx) in form.items" :key="idx" class="transfer-row">
                        <td class="text-center text-muted font-size-12 fw-medium">
                          {{ idx + 1 }}
                        </td>
                        <td class="p-2">
                          <SelectSearchBox
                            v-model="it.tenant_product_id"
                            :options="productSelectOptions"
                            placeholder="Select product to transfer..."
                            :show-images="true"
                            image-key="image"
                            @update:modelValue="onProductPicked(it)"
                          />
                        </td>
                        <td class="p-2">
                          <div class="input-group">
                            <input
                              type="number"
                              step="any"
                              min="0.0001"
                              class="form-control text-end fw-semibold"
                              placeholder="1"
                              v-model.number="it.quantity"
                              required
                            />
                            <span class="input-group-text px-2 text-muted fs-11">
                              {{ it.unit || 'pcs' }}
                            </span>
                          </div>
                        </td>
                        <td class="text-center p-1">
                          <button
                            type="button"
                            class="btn btn-outline-danger btn-sm border-0 rounded-circle remove-row-btn"
                            title="Remove line"
                            :disabled="form.items.length <= 1"
                            @click="removeItem(idx)"
                          >
                            <i class="bx bx-trash font-size-15"></i>
                          </button>
                        </td>
                      </tr>

                      <!-- Add line row -->
                      <tr class="activity-add-row" @click="addItem">
                        <td colspan="4" class="p-0 border-top">
                          <div class="d-flex align-items-center px-3 py-2 cursor-pointer">
                            <div class="add-circle-icon me-2">
                              <i class="bx bx-plus font-size-14"></i>
                            </div>
                            <span class="fw-semibold text-primary font-size-13">+ Add another transfer line</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Transfer Notes -->
            <div class="mb-0">
              <label class="form-label fs-12 fw-semibold text-dark mb-1">Transfer Notes / Reason (Optional)</label>
              <textarea
                class="form-control"
                rows="2"
                placeholder="e.g. Stock replenishment for weekend; transferred via courier driver..."
                v-model="form.notes"
                maxlength="500"
              ></textarea>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer border-top bg-light py-2">
            <button
              type="button"
              class="btn btn-white waves-effect"
              data-bs-dismiss="modal"
              :disabled="saving"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary d-inline-flex align-items-center gap-2"
              :disabled="saving || !canSubmit"
            >
              <span v-if="saving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <i v-else class="bx bx-send fs-5"></i>
              <span>Dispatch Transfer ({{ totalTransferQty }} units)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import StockAPI from "@/api/stock";
import ProductsAPI from "@/api/products";
import SelectSearchBox from "@/components/SelectSearchBox.vue";

const props = defineProps({
  branches: { type: Array, default: () => [] },
  activeBranchId: { type: Number, default: null },
});

const emit = defineEmits(["saved", "error"]);

const modalEl = ref(null);
const saving = ref(false);
const allProducts = ref([]);

const form = ref({
  source_branch_id: null,
  destination_branch_id: null,
  notes: "",
  items: [{ tenant_product_id: "", quantity: 1, unit: "pcs" }],
});

const destinationBranchOptions = computed(() => {
  return props.branches.filter((b) => b.id !== form.value.source_branch_id);
});

async function loadProducts() {
  try {
    const { data } = await ProductsAPI.list({ per_page: 300, is_active: 1 });
    allProducts.value = data.data || [];
  } catch (err) {
    allProducts.value = [];
  }
}

const productSelectOptions = computed(() => {
  return allProducts.value.map((p) => ({
    label: `${p.name} ${p.unit ? `(${p.unit})` : ""}`,
    value: p.id,
    image: p.image_url || p.image?.url || "",
    unit: p.unit || "pcs",
  }));
});

function onProductPicked(item) {
  const p = allProducts.value.find((opt) => opt.id === item.tenant_product_id);
  if (p) {
    item.unit = p.unit || "pcs";
  }
}

function onSourceBranchChange() {
  if (form.value.destination_branch_id === form.value.source_branch_id) {
    form.value.destination_branch_id = null;
  }
}

function addItem() {
  form.value.items.push({ tenant_product_id: "", quantity: 1, unit: "pcs" });
}

function removeItem(idx) {
  if (form.value.items.length > 1) {
    form.value.items.splice(idx, 1);
  }
}

const totalTransferQty = computed(() => {
  return form.value.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
});

const canSubmit = computed(() => {
  return (
    form.value.source_branch_id &&
    form.value.destination_branch_id &&
    form.value.source_branch_id !== form.value.destination_branch_id &&
    form.value.items.length > 0 &&
    form.value.items.every(
      (it) => it.tenant_product_id && Number(it.quantity) > 0
    )
  );
});

function open() {
  loadProducts();
  const sourceId = props.activeBranchId || props.branches[0]?.id || null;
  const otherBranch = props.branches.find((b) => b.id !== sourceId);

  form.value = {
    source_branch_id: sourceId,
    destination_branch_id: otherBranch?.id || null,
    notes: "",
    items: [{ tenant_product_id: "", quantity: 1, unit: "pcs" }],
  };
  saving.value = false;

  if (window.bootstrap?.Modal) {
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl.value);
    modal.show();
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return;

  saving.value = true;
  try {
    const payload = {
      source_branch_id: Number(form.value.source_branch_id),
      destination_branch_id: Number(form.value.destination_branch_id),
      notes: form.value.notes?.trim() || undefined,
      items: form.value.items.map((it) => ({
        tenant_product_id: it.tenant_product_id,
        quantity: Number(it.quantity),
      })),
    };

    const { data } = await StockAPI.dispatchTransfer(payload);

    if (window.bootstrap?.Modal) {
      const modal = window.bootstrap.Modal.getInstance(modalEl.value);
      modal?.hide();
    }

    emit("saved", {
      result: data,
      message: data.message || "Stock transfer successfully dispatched.",
    });
  } catch (err) {
    console.error("Error dispatching transfer:", err);
    emit("error", err.response?.data?.message || "Failed to dispatch transfer.");
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>

<style scoped>
.section-card {
  background-color: #FAFBFD;
  border: 1px solid #E9EBEF !important;
  border-radius: 8px;
}

.activity-day-box {
  border: 1px solid #E9EBEF;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
}

.transfer-table {
  width: 100%;
  border-collapse: collapse;
}

.transfer-table thead th {
  background-color: #FAFBFD;
  color: #5B6B8C;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #E9EBEF !important;
  padding: 10px 10px;
}

.transfer-table tbody tr {
  border-top: 1px solid #EFF2F7;
  background-color: #ffffff;
  transition: background-color 0.15s ease-in-out;
}

.transfer-table tbody tr:hover {
  background-color: #FAFBFD;
}

.transfer-table :deep(.vue-select .control),
.transfer-table .form-control,
.transfer-table .input-group-text,
.transfer-table .input-group {
  height: 36px !important;
  min-height: 36px !important;
  max-height: 36px !important;
  font-size: 13px !important;
}

.transfer-table :deep(.vue-select .value-container) {
  height: 36px !important;
  min-height: 36px !important;
  padding: 0 10px !important;
  display: flex !important;
  align-items: center !important;
  font-size: 13px !important;
}

.activity-add-row {
  cursor: pointer;
  background-color: #ffffff;
  border-top: 1px dashed #CBD5E1 !important;
  transition: background-color 0.15s ease-in-out;
}

.activity-add-row:hover {
  background-color: #F3F7FF;
}

.add-circle-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: rgba(var(--bs-primary-rgb), 0.1);
  color: var(--bs-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-row-btn {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #94a3b8;
}

.remove-row-btn:hover:not(:disabled) {
  background-color: #fee2e2;
  color: #ef4444;
}
</style>
