<template>
  <div
    class="modal fade"
    id="reorderPointModal"
    ref="modalEl"
    tabindex="-1"
    aria-labelledby="reorderPointModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header border-bottom py-3">
          <div class="d-flex align-items-center gap-2">
            <div class="avatar-xs d-flex align-items-center justify-content-center rounded-circle bg-warning-subtle text-warning">
              <i class="bx bx-bell fs-5"></i>
            </div>
            <div>
              <h5 class="modal-title font-size-16 mb-0" id="reorderPointModalLabel">
                Reorder Point (ROL)
              </h5>
              <p class="text-muted fs-12 mb-0">
                {{ branchName || 'Main Branch' }}
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
            <!-- Product Preview -->
            <div v-if="product" class="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3">
              <img
                v-if="product.image_url"
                :src="product.image_url"
                alt=""
                class="rounded bg-white p-1 border object-fit-contain"
                style="width: 44px; height: 44px;"
              />
              <div
                v-else
                class="rounded bg-white p-1 border d-flex align-items-center justify-content-center text-muted"
                style="width: 44px; height: 44px;"
              >
                <i class="mdi mdi-package-variant-closed fs-4"></i>
              </div>
              <div class="min-w-0 flex-grow-1">
                <div class="fw-bold text-dark text-truncate">{{ product.name }}</div>
                <div class="fs-12 text-muted">
                  Current on-hand:
                  <strong class="text-dark">{{ formatQty(stockRow?.quantity, product.unit) }}</strong>
                </div>
              </div>
            </div>

            <!-- AI Suggested Reorder Point Card (if available) -->
            <div
              v-if="stockRow?.suggested_reorder_point !== null && stockRow?.suggested_reorder_point !== undefined"
              class="card border border-warning-subtle bg-warning-subtle p-3 mb-3 rounded-3"
            >
              <div class="d-flex align-items-start gap-2">
                <i class="mdi mdi-creation fs-5 text-warning flex-shrink-0 mt-1"></i>
                <div class="flex-grow-1">
                  <div class="d-flex align-items-center justify-content-between">
                    <span class="fw-bold text-dark fs-13">Sales Velocity Suggestion</span>
                    <button
                      type="button"
                      class="btn btn-sm btn-warning text-dark fw-bold d-inline-flex align-items-center gap-1 py-1 px-2"
                      @click="useSuggestion"
                    >
                      <i class="bx bx-check"></i>
                      <span>Use {{ formatQty(stockRow.suggested_reorder_point) }}</span>
                    </button>
                  </div>
                  <p class="fs-12 text-muted mb-0 mt-1">
                    Based on average daily sales of
                    <strong>{{ formatQty(stockRow.avg_daily_out) }} {{ product?.unit }}/day</strong>
                    over {{ stockRow.suggestion_basis_days || 30 }} days of sales history.
                  </p>
                </div>
              </div>
            </div>

            <!-- Manual Point Input -->
            <div class="mb-3">
              <label class="form-label fw-semibold fs-13">
                Reorder Level Threshold ({{ product?.unit || 'units' }})
              </label>
              <div class="input-group">
                <input
                  type="number"
                  step="any"
                  class="form-control form-control-lg"
                  placeholder="e.g. 10"
                  v-model.number="reorderPoint"
                  min="0"
                />
                <span class="input-group-text bg-light text-muted">{{ product?.unit || 'units' }}</span>
              </div>
              <p class="fs-12 text-muted mt-1 mb-0">
                When stock falls to or below this level, an alert will be raised to restock.
                Leave blank or 0 to clear the alert.
              </p>
            </div>
          </div>

          <div class="modal-footer border-top bg-light py-2 d-flex justify-content-between">
            <button
              v-if="stockRow?.reorder_point !== null"
              type="button"
              class="btn btn-outline-soft-danger btn-sm waves-effect"
              :disabled="saving"
              @click="clearPoint"
            >
              <i class="bx bx-trash me-1"></i>
              <span>Clear Point</span>
            </button>
            <div class="ms-auto d-flex gap-2">
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
                :disabled="saving"
              >
                <span v-if="saving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <i v-else class="bx bx-check fs-5"></i>
                <span>Save Reorder Point</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { formatQty } from "../helpers/stockMeta";
import StockAPI from "@/api/stock";

const props = defineProps({
  branchId: { type: Number, required: true },
  branchName: { type: String, default: "" },
});

const emit = defineEmits(["saved", "error"]);

const modalEl = ref(null);
const stockRow = ref(null);
const product = ref(null);
const reorderPoint = ref(null);
const saving = ref(false);

function open(row) {
  stockRow.value = row;
  product.value = row.product;
  reorderPoint.value = row.reorder_point ?? null;
  saving.value = false;

  if (window.bootstrap?.Modal) {
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl.value);
    modal.show();
  }
}

function useSuggestion() {
  if (stockRow.value?.suggested_reorder_point !== null) {
    reorderPoint.value = Number(stockRow.value.suggested_reorder_point);
  }
}

async function clearPoint() {
  reorderPoint.value = null;
  await handleSubmit();
}

async function handleSubmit() {
  if (!product.value) return;

  saving.value = true;
  try {
    const pointVal = reorderPoint.value === "" || reorderPoint.value === null ? null : Number(reorderPoint.value);

    const { data } = await StockAPI.setReorderPoint(product.value.id, {
      branch_id: props.branchId,
      reorder_point: pointVal,
    });

    if (window.bootstrap?.Modal) {
      const modal = window.bootstrap.Modal.getInstance(modalEl.value);
      modal?.hide();
    }

    emit("saved", {
      product: product.value,
      result: data,
      message: data.message || "Reorder point saved.",
    });
  } catch (err) {
    console.error("Error saving reorder point:", err);
    emit("error", err.response?.data?.message || "Failed to save reorder point.");
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>
