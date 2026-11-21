<template>
  <div
    class="modal fade"
    id="stockAdjustModal"
    ref="modalEl"
    tabindex="-1"
    aria-labelledby="stockAdjustModalLabel"
    aria-hidden="true"
    data-bs-backdrop="static"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <!-- Modal Header -->
        <div class="modal-header border-bottom py-3 px-4 bg-white">
          <div class="d-flex align-items-center gap-3">
            <div class="avatar-xs d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary flex-shrink-0">
              <i class="bx bx-slider-alt fs-4"></i>
            </div>
            <div>
              <h5 class="modal-title font-size-16 fw-bold mb-0 text-dark" id="stockAdjustModalLabel">
                Adjust Stock
              </h5>
              <p class="text-muted fs-12 mb-0 mt-1">
                {{ activeBranchName }}
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
            <!-- Product Selector (shown if opened without pre-selected product) -->
            <div v-if="!product" class="mb-3">
              <label class="form-label fw-semibold fs-13">Select Product to Adjust</label>
              <div class="position-relative mb-2">
                <input
                  type="text"
                  class="form-control ps-5"
                  placeholder="Search by name, barcode, brand, or keywords (e.g. 'coke')..."
                  v-model="productSearchQuery"
                  autocomplete="off"
                />
                <i class="bx bx-search-alt position-absolute text-muted fs-5" style="left: 14px; top: 10px;"></i>
                <i
                  v-if="productSearchQuery"
                  class="mdi mdi-close position-absolute text-muted cursor-pointer fs-5"
                  style="right: 14px; top: 9px;"
                  @click="productSearchQuery = ''"
                ></i>
              </div>

              <!-- Filtered Product Suggestions -->
              <div
                v-if="availableProducts.length > 0"
                class="border rounded-3 overflow-hidden bg-white shadow-sm"
                style="max-height: 220px; overflow-y: auto;"
              >
                <div
                  v-for="p in filteredAvailableProducts"
                  :key="p.id"
                  class="d-flex align-items-center justify-content-between p-2 px-3 border-bottom cursor-pointer product-pick-row"
                  @click="selectProduct(p)"
                >
                  <div class="d-flex align-items-center gap-2 min-w-0">
                    <img
                      v-if="p.image_url"
                      :src="p.image_url"
                      alt=""
                      class="rounded border bg-light object-fit-contain flex-shrink-0"
                      style="width: 34px; height: 34px;"
                    />
                    <div
                      v-else
                      class="rounded border bg-light d-flex align-items-center justify-content-center text-muted flex-shrink-0"
                      style="width: 34px; height: 34px;"
                    >
                      <i class="bx bx-package fs-5"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="fw-semibold text-dark font-size-13 text-truncate">{{ p.name }}</div>
                      <div class="font-size-11 text-muted">
                        <span v-if="p.barcode" class="me-2">{{ p.barcode }}</span>
                        <span v-if="p.category" class="badge bg-light text-muted border">{{ p.category }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-end flex-shrink-0 ms-2">
                    <span class="fw-bold font-size-13 text-primary">{{ formatQty(p.current_quantity, p.unit) }}</span>
                    <small class="d-block font-size-10 text-muted">On Hand</small>
                  </div>
                </div>

                <div v-if="filteredAvailableProducts.length === 0" class="p-3 text-center text-muted font-size-13">
                  No products matched "{{ productSearchQuery }}".
                </div>
              </div>
              <div v-else-if="loadingProducts" class="p-3 text-center text-muted font-size-13">
                <span class="spinner-border spinner-border-sm me-2"></span>Loading inventory products...
              </div>
            </div>

            <!-- Product Preview Card -->
            <div v-if="product" class="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3 border">
              <img
                v-if="product.image_url"
                :src="product.image_url"
                alt=""
                class="rounded bg-white p-1 border object-fit-contain flex-shrink-0 shadow-sm"
                style="width: 50px; height: 50px;"
                @error="product.image_url = null"
              />
              <div
                v-else
                class="rounded bg-white p-1 border d-flex align-items-center justify-content-center text-muted flex-shrink-0 shadow-sm"
                style="width: 50px; height: 50px;"
              >
                <i class="bx bx-package fs-2 text-secondary"></i>
              </div>
              <div class="min-w-0 flex-grow-1">
                <div class="fw-bold text-dark font-size-14 text-truncate mb-1">{{ product.name }}</div>
                <div class="d-flex align-items-center gap-2 flex-wrap font-size-12 text-muted">
                  <span>
                    Current on-hand:
                    <strong class="text-dark">{{ formatQty(currentQty, product.unit) }}</strong>
                  </span>
                  <span v-if="product.barcode" class="badge bg-white text-muted border font-monospace">
                    {{ product.barcode }}
                  </span>
                </div>
              </div>
              <button
                v-if="canSwitchProduct"
                type="button"
                class="btn btn-sm btn-link text-primary p-0 text-decoration-none fs-12 flex-shrink-0"
                @click="clearSelectedProduct"
              >
                Change
              </button>
            </div>

            <!-- Reason Selector -->
            <div v-if="product" class="mb-3">
              <label class="form-label fw-semibold fs-13 text-dark">Reason for Adjustment</label>
              <div class="d-flex flex-column gap-2">
                <label
                  v-for="r in reasons"
                  :key="r.value"
                  class="d-flex align-items-center gap-3 p-2 px-3 border rounded cursor-pointer transition-all"
                  :class="{
                    'border-primary bg-primary-subtle text-primary shadow-sm': reason === r.value,
                    'bg-white text-dark': reason !== r.value,
                  }"
                  style="cursor: pointer;"
                >
                  <input
                    type="radio"
                    name="adjustReason"
                    class="form-check-input mt-0 flex-shrink-0"
                    :value="r.value"
                    v-model="reason"
                  />
                  <div class="min-w-0 flex-grow-1">
                    <div class="fw-semibold font-size-13 d-flex align-items-center gap-2">
                      <i :class="getReasonIcon(r.value)" class="fs-5"></i>
                      <span>{{ r.label }}</span>
                    </div>
                    <div class="font-size-11 text-muted mt-0">{{ r.desc }}</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Quantity Input -->
            <div v-if="product" class="mb-3">
              <label class="form-label fw-semibold fs-13 text-dark">
                <span v-if="reason === 'audit_count'">New Physical Count (Total on shelf)</span>
                <span v-else>Quantity to deduct ({{ product?.unit || 'units' }})</span>
              </label>
              <div class="input-group input-group-lg">
                <input
                  ref="quantityInputEl"
                  type="number"
                  step="any"
                  class="form-control form-control-lg font-size-16 fw-bold"
                  :placeholder="reason === 'audit_count' ? String(currentQty) : 'e.g. 2'"
                  v-model.number="quantity"
                  required
                  min="0"
                />
                <span class="input-group-text bg-light text-muted font-size-13 fw-semibold">
                  {{ product?.unit || 'units' }}
                </span>
              </div>

              <!-- Real-time calculation helper -->
              <div v-if="reason === 'audit_count' && quantity !== null && quantity !== ''" class="fs-12 text-muted mt-2">
                Variance:
                <strong :class="variance >= 0 ? 'text-success' : 'text-danger'" class="fw-bold">
                  {{ variance >= 0 ? `+${variance}` : variance }} {{ product?.unit }}
                </strong>
                <span v-if="variance > 0"> (Surplus / Found items)</span>
                <span v-else-if="variance < 0"> (Shrinkage / Missing items)</span>
                <span v-else> (Exact match - no change)</span>
              </div>

              <div v-else-if="reason !== 'audit_count' && quantity !== null && quantity !== ''" class="fs-12 text-muted mt-2">
                Impact:
                <span>Current: <strong>{{ currentQty }}</strong></span>
                <i class="bx bx-right-arrow-alt align-middle mx-1 fs-5"></i>
                <span>
                  New balance:
                  <strong :class="deductBalance >= 0 ? 'text-dark' : 'text-danger'">
                    {{ deductBalance }} {{ product?.unit }}
                  </strong>
                </span>
              </div>
            </div>

            <!-- Notes / Explanation -->
            <div v-if="product" class="mb-1">
              <label class="form-label fs-13 text-muted">Notes / Explanation (optional)</label>
              <textarea
                class="form-control font-size-13"
                rows="2"
                :placeholder="reason === 'audit_count' ? 'e.g. Shelf audit, stock count reconciliation...' : 'e.g. Dropped during stocking; expired on shelf...'"
                v-model="notes"
                maxlength="500"
              ></textarea>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer border-top bg-light py-2 px-4 d-flex align-items-center justify-content-between">
            <button
              type="button"
              class="btn btn-secondary waves-effect font-size-13 px-3 py-2"
              data-bs-dismiss="modal"
              :disabled="saving"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary d-inline-flex align-items-center gap-2 font-size-14 fw-bold px-4 py-2"
              :disabled="saving || !product || quantity === null || quantity === '' || quantity < 0"
            >
              <span v-if="saving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <i v-else class="bx bx-check fs-5"></i>
              <span>Save Adjustment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from "vue";
import { formatQty, ADJUSTMENT_REASONS } from "../helpers/stockMeta";
import StockAPI from "@/api/stock";

const props = defineProps({
  branchId: { type: [Number, String], default: null },
  branchName: { type: String, default: "" },
});

const emit = defineEmits(["saved", "error"]);

const modalEl = ref(null);
const quantityInputEl = ref(null);

const product = ref(null);
const currentQty = ref(0);
const reason = ref("audit_count");
const quantity = ref(null);
const notes = ref("");
const saving = ref(false);

const canSwitchProduct = ref(false);
const availableProducts = ref([]);
const loadingProducts = ref(false);
const productSearchQuery = ref("");

const activeBranchId = ref(null);
const activeBranchName = ref("");

const reasons = ADJUSTMENT_REASONS;

function getReasonIcon(reasonValue) {
  switch (reasonValue) {
    case "audit_count":
      return "bx bx-clipboard";
    case "waste_spoilage":
      return "bx bx-trash";
    case "staff_consumption":
      return "bx bx-coffee";
    default:
      return "bx bx-slider-alt";
  }
}

const variance = computed(() => {
  if (quantity.value === null || quantity.value === "") return 0;
  return Number((quantity.value - (currentQty.value || 0)).toFixed(4));
});

const deductBalance = computed(() => {
  if (quantity.value === null || quantity.value === "") return currentQty.value || 0;
  return Number(((currentQty.value || 0) - Number(quantity.value)).toFixed(4));
});

const filteredAvailableProducts = computed(() => {
  const query = productSearchQuery.value.trim().toLowerCase();
  if (!query) return availableProducts.value.slice(0, 25);
  return availableProducts.value
    .filter((p) => {
      const name = (p.name || "").toLowerCase();
      const barcode = (p.barcode || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      const keywords = Array.isArray(p.keywords) ? p.keywords.join(" ").toLowerCase() : "";
      return (
        name.includes(query) ||
        barcode.includes(query) ||
        sku.includes(query) ||
        brand.includes(query) ||
        category.includes(query) ||
        keywords.includes(query)
      );
    })
    .slice(0, 25);
});

async function loadAvailableProducts() {
  if (availableProducts.value.length > 0) return;
  loadingProducts.value = true;
  try {
    const branchParam = props.branchId ? Number(props.branchId) : undefined;
    const { data } = await StockAPI.countSheet({ branch_id: branchParam });
    availableProducts.value = data.data || [];
    if (!activeBranchId.value) {
      activeBranchId.value = data.branch?.id || props.branchId;
      activeBranchName.value = data.branch?.name || props.branchName || "Main Branch";
    }
  } catch (err) {
    console.error("Error loading products for single adjust picker:", err);
  } finally {
    loadingProducts.value = false;
  }
}

function selectProduct(p) {
  product.value = {
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    sku: p.sku,
    unit: p.unit,
    image_url: p.image_url,
    category: p.category,
    brand: p.brand,
  };
  currentQty.value = p.current_quantity ?? 0;
  reason.value = "audit_count";
  quantity.value = p.current_quantity ?? 0;
  notes.value = "";
  canSwitchProduct.value = true;

  nextTick(() => {
    quantityInputEl.value?.focus();
    quantityInputEl.value?.select();
  });
}

function clearSelectedProduct() {
  product.value = null;
  currentQty.value = 0;
  quantity.value = null;
  productSearchQuery.value = "";
  loadAvailableProducts();
}

function open(row = null) {
  saving.value = false;
  activeBranchId.value = props.branchId || null;
  activeBranchName.value = props.branchName || "Main Branch";

  if (row && (row.product || row.name || row.tenant_product_id)) {
    // Opened for a specific single product (from row click)
    const p = row.product || row;
    const targetId = p.id || row.tenant_product_id;
    const resolvedImageUrl = p.image_url || row.image_url || row.product?.image_url || null;

    product.value = {
      id: targetId,
      name: p.name,
      barcode: p.barcode,
      sku: p.sku,
      unit: p.unit || row.unit || "pcs",
      image_url: resolvedImageUrl,
      category: p.category,
      brand: p.brand,
    };
    currentQty.value = row.quantity ?? row.stock_quantity ?? row.current_quantity ?? 0;
    reason.value = "audit_count";
    quantity.value = currentQty.value;
    notes.value = "";
    canSwitchProduct.value = false;

    // Cross-check image_url if not provided in row payload
    if (!resolvedImageUrl) {
      loadAvailableProducts().then(() => {
        const found = availableProducts.value.find((it) => it.id === targetId);
        if (found?.image_url && product.value && product.value.id === targetId) {
          product.value.image_url = found.image_url;
        }
      });
    }

    nextTick(() => {
      quantityInputEl.value?.focus();
      quantityInputEl.value?.select();
    });
  } else {
    // Opened without a pre-selected product
    product.value = null;
    currentQty.value = 0;
    quantity.value = null;
    notes.value = "";
    productSearchQuery.value = "";
    canSwitchProduct.value = true;
    loadAvailableProducts();
  }

  if (window.bootstrap?.Modal) {
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl.value);
    modal.show();
  }
}

async function handleSubmit() {
  if (!product.value || quantity.value === null || quantity.value === "" || quantity.value < 0) return;

  saving.value = true;
  try {
    const isPhysical = reason.value === "audit_count";
    const qtyPayload = isPhysical ? Number(quantity.value) : Math.abs(Number(quantity.value));
    const branchToUse = activeBranchId.value || props.branchId;

    const { data } = await StockAPI.adjust({
      branch_id: branchToUse,
      tenant_product_id: product.value.id,
      reason: reason.value,
      quantity: qtyPayload,
      is_physical_count: isPhysical,
      notes: notes.value.trim() || undefined,
    });

    if (window.bootstrap?.Modal) {
      const modal = window.bootstrap.Modal.getInstance(modalEl.value);
      modal?.hide();
    }

    emit("saved", {
      product: product.value,
      result: data,
      message: data.message || `Stock adjusted successfully for ${product.value.name}.`,
    });
  } catch (err) {
    console.error("Error adjusting stock:", err);
    emit("error", err.response?.data?.message || "Failed to adjust stock. Please try again.");
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.transition-all {
  transition: all 0.2s ease-in-out;
}

.product-pick-row:hover {
  background-color: #f8f9fa;
}
</style>
