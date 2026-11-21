<template>
  <div
    class="modal fade"
    id="stockReceiveModal"
    ref="modalEl"
    tabindex="-1"
    aria-labelledby="stockReceiveModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-xl modal-dialog-centered">
      <!-- Flat modal content without drop shadow, matching PaySol clean border system -->
      <div class="modal-content border">
        <!-- Modal Header -->
        <div class="modal-header border-bottom py-3">
          <div class="d-flex align-items-center gap-2">
            <div class="avatar-xs d-flex align-items-center justify-content-center rounded-circle bg-success-subtle text-success">
              <i class="bx bx-archive-in fs-5"></i>
            </div>
            <div>
              <h5 class="modal-title font-size-16 mb-0" id="stockReceiveModalLabel">
                Receive Goods &amp; Restock Delivery
              </h5>
              <p class="text-muted fs-12 mb-0">
                Supplier delivery intake into {{ branchName || 'Main Branch' }}
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
            <!-- Section 1: Delivery Details & Supplier -->
            <div class="section-card border rounded-3 p-3 bg-light-subtle mb-4">
              <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-primary text-white rounded-pill px-2 py-1 font-size-10 fw-bold">1</span>
                  <h6 class="fs-13 fw-bold text-uppercase text-dark mb-0">Delivery &amp; Supplier Information</h6>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    class="btn btn-link btn-sm p-0 fs-12 text-primary fw-medium text-decoration-none"
                    @click="openSupplierModal"
                    title="Register a new supplier in directory"
                  >
                    <i class="bx bx-plus-circle"></i>
                    <span class="ms-1">Register New Supplier</span>
                  </button>
                  <span class="text-muted fs-11">·</span>
                  <button
                    type="button"
                    class="btn btn-link btn-sm p-0 fs-12 text-muted fw-medium text-decoration-none"
                    @click="isCustomSupplier = !isCustomSupplier"
                  >
                    <i class="bx" :class="isCustomSupplier ? 'bx-list-ul' : 'bx-user-plus'"></i>
                    <span class="ms-1">{{ isCustomSupplier ? 'Pick Registered' : 'One-Time Vendor' }}</span>
                  </button>
                </div>
              </div>

              <div class="row g-3">
                <!-- Supplier Select -->
                <div class="col-md-7">
                  <label class="form-label fw-semibold fs-12 text-dark mb-1">
                    Supplier / Vendor <span class="text-danger">*</span>
                  </label>

                  <!-- Directory Searchable Select with Add Supplier Option -->
                  <div v-if="!isCustomSupplier">
                    <SelectSearchBox
                      v-model="form.supplier_id"
                      :options="supplierOptions"
                      placeholder="Search registered supplier or add new..."
                      :show-create="true"
                      create-text="+ Register New Supplier"
                      create-modal-id=""
                      @create="openSupplierModal"
                      @update:modelValue="onSupplierSelected"
                    />
                    <div v-if="form.supplier_id" class="text-success fs-11 mt-1 d-flex align-items-center gap-1">
                      <i class="bx bx-check-circle"></i>
                      <span>Selected: <strong>{{ form.supplier_name }}</strong></span>
                    </div>
                  </div>

                  <!-- Custom one-off vendor input -->
                  <div v-else>
                    <div class="input-group">
                      <span class="input-group-text bg-white text-muted">
                        <i class="bx bx-truck"></i>
                      </span>
                      <input
                        type="text"
                        class="form-control"
                        placeholder="e.g. Local Market Farmer, Walk-in Distributor"
                        v-model="form.supplier_name"
                        required
                        maxlength="120"
                      />
                    </div>
                    <small class="text-muted fs-11">Unregistered vendor for this delivery only.</small>
                  </div>
                </div>

                <!-- Invoice / Delivery Note # -->
                <div class="col-md-5">
                  <label class="form-label fw-semibold fs-12 text-dark mb-1">Invoice / Delivery Note #</label>
                  <div class="input-group">
                    <span class="input-group-text bg-white text-muted">
                      <i class="bx bx-receipt"></i>
                    </span>
                    <input
                      type="text"
                      class="form-control"
                      placeholder="e.g. INV-2026-8819 or DN-4401"
                      v-model="form.invoice_number"
                      maxlength="60"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 2: Items Received (Activity Log Clean Box Style, No Drop Shadows) -->
            <div class="mb-4">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-primary text-white rounded-pill px-2 py-1 font-size-10 fw-bold">2</span>
                  <h6 class="fs-13 fw-bold text-uppercase text-dark mb-0">Delivery Items &amp; Quantities</h6>
                  <span class="badge bg-white text-dark border font-size-11">
                    {{ form.items.length }} {{ form.items.length === 1 ? 'item' : 'items' }}
                  </span>
                </div>
                <button
                  type="button"
                  class="btn btn-sm btn-white d-inline-flex align-items-center gap-1 waves-effect border"
                  @click="addItem"
                >
                  <i class="bx bx-plus font-size-14 text-primary"></i>
                  <span>Add Line</span>
                </button>
              </div>

              <!-- Barcode Quick-Scan Bar -->
              <div class="barcode-scan-bar d-flex flex-wrap align-items-center justify-content-between gap-2 p-2 px-3 mb-3 rounded-3 border">
                <div class="d-flex align-items-center gap-2 flex-grow-1" style="max-width: 540px;">
                  <div class="input-group">
                    <span class="input-group-text bg-white border-end-0 text-muted">
                      <i class="bx bx-barcode fs-5"></i>
                    </span>
                    <input
                      ref="barcodeScanInput"
                      type="text"
                      class="form-control border-start-0 ps-1"
                      placeholder="Scan barcode or type &amp; press Enter..."
                      v-model="scanBarcodeQuery"
                      @keydown.enter.prevent="handleBarcodeScan"
                    />
                    <button
                      class="btn btn-primary waves-effect d-inline-flex align-items-center gap-1"
                      type="button"
                      @click="handleBarcodeScan"
                      :disabled="!scanBarcodeQuery || !scanBarcodeQuery.trim()"
                    >
                      <i class="bx bx-plus"></i>
                      <span>Scan Add</span>
                    </button>
                  </div>

                  <!-- Scan Multiplier (defaults to 1) -->
                  <div class="input-group" style="width: 125px;" title="Quantity increment added per barcode scan">
                    <span class="input-group-text bg-white text-muted fs-11 px-2">+Qty</span>
                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      class="form-control text-center fw-bold bg-white"
                      v-model.number="scanMultiplier"
                    />
                  </div>
                </div>

                <!-- Scan Feedback status -->
                <div class="scan-feedback ms-auto text-end">
                  <div v-if="scanFeedback" class="d-flex align-items-center gap-1 fs-12" :class="scanFeedback.success ? 'text-success' : 'text-danger'">
                    <i class="bx" :class="scanFeedback.success ? 'bx-check-circle' : 'bx-error-circle'"></i>
                    <span class="fw-medium">{{ scanFeedback.message }}</span>
                  </div>
                  <div v-else class="text-muted fs-11 d-flex align-items-center gap-1">
                    <i class="bx bx-scan text-primary"></i>
                    <span>Ready for USB/Bluetooth scanner · Auto-increments quantity</span>
                  </div>
                </div>
              </div>

              <!-- Activity Day Box Container (Flat 1px #E9EBEF border, No Drop Shadow) -->
              <div class="activity-day-box bg-white overflow-hidden">
                <div class="table-responsive-receive">
                  <table class="table align-middle mb-0 receive-table">
                    <thead>
                      <tr>
                        <th class="col-idx text-center">#</th>
                        <th class="col-product">Product Item <span class="text-danger">*</span></th>
                        <th class="col-barcode text-center">Barcode</th>
                        <th class="col-batch">Batch / Lot #</th>
                        <th class="col-qty text-end">Quantity <span class="text-danger">*</span></th>
                        <th class="col-bonus text-end" title="Free promotional or bonus units delivered">Bonus / Free</th>
                        <th class="col-cost text-end">Unit Cost (KES) <span class="text-danger">*</span></th>
                        <th class="col-total text-end">Line Total (KES)</th>
                        <th class="col-action text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(item, idx) in form.items"
                        :key="idx"
                        class="delivery-row"
                        :class="{ 'scan-highlight': highlightedRowIdx === idx }"
                      >
                        <!-- 1. Row index -->
                        <td class="text-center text-muted font-size-12 fw-medium col-idx">
                          {{ idx + 1 }}
                        </td>

                        <!-- 2. Product Searchable Dropdown -->
                        <td class="col-product px-2 py-2">
                          <div class="product-select-wrapper">
                            <SelectSearchBox
                              v-model="item.tenant_product_id"
                              :options="productSelectOptions"
                              placeholder="Search product by name or barcode..."
                              :show-images="true"
                              image-key="image"
                              @update:modelValue="onProductPicked(item)"
                            />
                          </div>
                        </td>

                        <!-- 3. Barcode (Dedicated Clean Column) -->
                        <td class="col-barcode px-2 text-center">
                          <span
                            v-if="item.barcode"
                            class="badge font-monospace bg-light text-dark border px-2 py-1 fs-11"
                            title="Product barcode"
                          >
                            <i class="bx bx-barcode align-middle me-1 text-muted"></i>{{ item.barcode }}
                          </span>
                          <span v-else class="text-muted fs-12">—</span>
                        </td>

                        <!-- 4. Batch / Lot # -->
                        <td class="col-batch px-2">
                          <input
                            type="text"
                            class="form-control font-monospace"
                            placeholder="e.g. B-012"
                            v-model="item.batch_number"
                            maxlength="40"
                            title="Batch or Lot Number from supplier delivery"
                          />
                        </td>

                        <!-- 5. Quantity -->
                        <td class="col-qty px-2">
                          <div class="input-group">
                            <input
                              type="number"
                              step="any"
                              min="0.0001"
                              class="form-control text-end fw-semibold"
                              placeholder="1"
                              v-model.number="item.quantity"
                              required
                            />
                            <span class="input-group-text px-2 text-muted fw-medium fs-11">
                              {{ getProductUnit(item.tenant_product_id) }}
                            </span>
                          </div>
                        </td>

                        <!-- 6. Bonus / Free Qty -->
                        <td class="col-bonus px-2">
                          <div class="input-group" title="Free bonus / promotional units received">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              class="form-control text-end"
                              placeholder="0"
                              v-model.number="item.bonus_quantity"
                            />
                            <span
                              v-if="item.bonus_quantity > 0"
                              class="input-group-text bg-success-subtle text-success px-2 fw-bold fs-10"
                            >
                              Free
                            </span>
                          </div>
                        </td>

                        <!-- 7. Unit Cost (KES) -->
                        <td class="col-cost px-2">
                          <div class="input-group">
                            <span class="input-group-text px-2 text-muted fs-11">KES</span>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              class="form-control text-end fw-semibold"
                              placeholder="0.00"
                              v-model.number="item.unit_cost"
                              required
                              @keydown.enter.prevent="onCostEnter(idx)"
                            />
                          </div>
                        </td>

                        <!-- 8. Line Total -->
                        <td class="col-total text-end fw-bold text-dark fs-13 font-monospace px-3">
                          {{ formatMoney((item.quantity || 0) * (item.unit_cost || 0)) }}
                        </td>

                        <!-- 9. Remove Row Action -->
                        <td class="col-action text-center px-1">
                          <button
                            type="button"
                            class="btn btn-outline-danger btn-sm border-0 rounded-circle remove-row-btn"
                            title="Remove row"
                            :disabled="form.items.length <= 1"
                            @click="removeItem(idx)"
                          >
                            <i class="bx bx-trash font-size-15"></i>
                          </button>
                        </td>
                      </tr>

                      <!-- ClickUp / Activity Log Style '+ Add Line' Interactive Row -->
                      <tr class="activity-add-row" @click="addItem">
                        <td colspan="9" class="p-0 border-top">
                          <div class="add-row-inner d-flex align-items-center px-3 py-2 cursor-pointer">
                            <div class="add-icon-circle me-2">
                              <i class="bx bx-plus font-size-14"></i>
                            </div>
                            <span class="fw-semibold text-primary font-size-13">+ Add another product line</span>
                            <span class="text-muted font-size-11 ms-auto d-none d-sm-inline">
                              Tip: Press <kbd class="bg-light text-dark border px-1 rounded">Enter ↵</kbd> on cost to append row
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>

                    <!-- Summary Totals Footer -->
                    <tfoot class="activity-table-foot">
                      <tr>
                        <td colspan="4" class="py-2 px-3 fw-bold text-dark font-size-12">
                          <span>Total Items: </span>
                          <span class="badge bg-white text-dark border ms-1 font-size-11">
                            {{ form.items.length }} {{ form.items.length === 1 ? 'Line' : 'Lines' }}
                          </span>
                        </td>
                        <td class="text-end py-2 px-2">
                          <small class="text-muted d-block font-size-10 text-uppercase fw-semibold">Total Units</small>
                          <span class="fw-bold text-dark font-size-12">{{ totalQuantitySum }}</span>
                        </td>
                        <td class="text-end py-2 px-2">
                          <small v-if="totalBonusSum > 0" class="text-success d-block font-size-10 text-uppercase fw-semibold">Total Bonus</small>
                          <span v-if="totalBonusSum > 0" class="fw-bold text-success font-size-12">+{{ totalBonusSum }} free</span>
                        </td>
                        <td class="text-end py-2 px-2 fw-bold text-uppercase fs-11 text-muted">
                          Grand Total Delivery:
                        </td>
                        <td class="text-end py-2 px-3 fw-bold text-primary fs-14 font-monospace bg-primary-subtle text-primary border-primary-subtle">
                          {{ formatMoney(grandTotal) }}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <!-- Notes Section -->
            <div class="mb-0">
              <label class="form-label fs-12 fw-semibold text-dark mb-1">Delivery Remarks / Audit Notes</label>
              <textarea
                class="form-control"
                rows="2"
                placeholder="e.g. Delivered by vendor truck, checked and verified by storekeeper, batch/lot notes..."
                v-model="form.notes"
                maxlength="500"
              ></textarea>
            </div>
          </div>

          <!-- Modal Footer -->
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
              class="btn btn-success d-inline-flex align-items-center gap-2"
              :disabled="saving || !canSubmit"
            >
              <span v-if="saving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <i v-else class="bx bx-check-double fs-5"></i>
              <span>Record Delivery ({{ formatMoney(grandTotal) }})</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Mount Supplier Registration Modal -->
    <SupplierFormModal
      ref="supplierModal"
      @saved="onSupplierSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { formatMoney } from "../helpers/stockMeta";
import StockAPI from "@/api/stock";
import SuppliersAPI from "@/api/suppliers";
import ProductsAPI from "@/api/products";
import SelectSearchBox from "@/components/SelectSearchBox.vue";
import SupplierFormModal from "@/pages/Suppliers/components/SupplierForm.modal.vue";

const props = defineProps({
  branchId: { type: Number, required: true },
  branchName: { type: String, default: "" },
  availableProducts: { type: Array, default: () => [] },
});

const emit = defineEmits(["saved", "error"]);

const modalEl = ref(null);
const supplierModal = ref(null);
const saving = ref(false);
const registeredSuppliers = ref([]);
const allProducts = ref([]);
const isCustomSupplier = ref(false);

// Barcode Scanning State
const barcodeScanInput = ref(null);
const scanBarcodeQuery = ref("");
const scanMultiplier = ref(1);
const scanFeedback = ref(null);
const highlightedRowIdx = ref(null);
let feedbackTimeout = null;

function showScanFeedback(message, success = true) {
  clearTimeout(feedbackTimeout);
  scanFeedback.value = { message, success };
  feedbackTimeout = setTimeout(() => {
    scanFeedback.value = null;
  }, 4000);
}

function handleBarcodeScan() {
  const query = scanBarcodeQuery.value?.trim();
  if (!query) return;

  const qLower = query.toLowerCase();
  const list = allProducts.value.length ? allProducts.value : props.availableProducts;

  // Find product by exact barcode, or SKU, or ID
  const matched = list.find((p) => {
    const b = (p.barcode || "").trim().toLowerCase();
    const sku = (p.sku || "").trim().toLowerCase();
    const id = String(p.id).toLowerCase();
    return b === qLower || sku === qLower || id === qLower;
  });

  if (!matched) {
    showScanFeedback(`No product found matching barcode "${query}"`, false);
    scanBarcodeQuery.value = "";
    barcodeScanInput.value?.focus();
    return;
  }

  const addQty = Number(scanMultiplier.value) > 0 ? Number(scanMultiplier.value) : 1;

  // Check if product is already in form.items
  const existingIdx = form.value.items.findIndex(
    (it) => it.tenant_product_id === matched.id
  );

  if (existingIdx !== -1) {
    const existing = form.value.items[existingIdx];
    existing.quantity = (Number(existing.quantity) || 0) + addQty;
    highlightedRowIdx.value = existingIdx;
    showScanFeedback(`✓ Incremented ${matched.name}: Qty is now ${existing.quantity} ${existing.unit || "pcs"}`);
  } else {
    // Check if the first row is completely unselected
    const isFirstEmpty =
      form.value.items.length === 1 && !form.value.items[0].tenant_product_id;

    const newRow = {
      tenant_product_id: matched.id,
      quantity: addQty,
      bonus_quantity: 0,
      unit_cost: Number(matched.cost_price || matched.last_cost_price || 0),
      barcode: matched.barcode || "",
      unit: matched.unit || "pcs",
      batch_number: "",
    };

    if (isFirstEmpty) {
      form.value.items[0] = newRow;
      highlightedRowIdx.value = 0;
    } else {
      form.value.items.push(newRow);
      highlightedRowIdx.value = form.value.items.length - 1;
    }

    showScanFeedback(`✓ Added ${matched.name} (${addQty} ${matched.unit || "pcs"})`);
  }

  // Clear query and schedule removing row highlight
  scanBarcodeQuery.value = "";
  setTimeout(() => {
    highlightedRowIdx.value = null;
  }, 1500);

  // Keep scanner input focused for continuous scanning
  barcodeScanInput.value?.focus();
}

const form = ref({
  supplier_id: null,
  supplier_name: "",
  invoice_number: "",
  notes: "",
  items: [
    { tenant_product_id: "", quantity: 1, bonus_quantity: 0, unit_cost: 0, barcode: "", unit: "pcs", batch_number: "" },
  ],
});

// Load registered suppliers from Directory
async function loadRegisteredSuppliers() {
  try {
    const { data } = await SuppliersAPI.list({ status: "active", per_page: 150 });
    registeredSuppliers.value = data.data || [];
  } catch (err) {
    registeredSuppliers.value = [];
  }
}

// Load full tenant products catalogue
async function loadAllProducts() {
  try {
    const { data } = await ProductsAPI.list({ per_page: 300, is_active: 1 });
    allProducts.value = data.data || [];
  } catch (err) {
    allProducts.value = props.availableProducts || [];
  }
}

// Supplier Options for SelectSearchBox
const supplierOptions = computed(() => {
  return registeredSuppliers.value.map((s) => ({
    label: s.name + (s.tax_pin ? ` (PIN: ${s.tax_pin})` : s.phone ? ` (${s.phone})` : ""),
    value: s.id,
    name: s.name,
  }));
});

function onSupplierSelected(id) {
  const found = registeredSuppliers.value.find((s) => s.id === id);
  if (found) {
    form.value.supplier_id = found.id;
    form.value.supplier_name = found.name;
  } else {
    form.value.supplier_id = null;
    form.value.supplier_name = "";
  }
}

// Flag to track whether the receive goods modal was open when adding a supplier
const reopenReceiveModalOnSupplierClose = ref(false);

function openSupplierModal() {
  reopenReceiveModalOnSupplierClose.value = true;

  // 1. Close the receive goods modal first so modals never overlap
  if (window.bootstrap?.Modal && modalEl.value) {
    const receiveModal = window.bootstrap.Modal.getInstance(modalEl.value);
    receiveModal?.hide();
  }

  // 2. Open Supplier Registration modal cleanly after receive modal starts hiding
  setTimeout(() => {
    supplierModal.value?.open();
  }, 200);
}

// Reopen receive goods modal whenever supplier modal is closed, dismissed or saved
function handleSupplierModalHidden() {
  if (reopenReceiveModalOnSupplierClose.value) {
    reopenReceiveModalOnSupplierClose.value = false;

    // Wait for the supplier modal backdrop to clear, then restore the receive modal with all data intact
    setTimeout(() => {
      if (window.bootstrap?.Modal && modalEl.value) {
        const receiveModal = window.bootstrap.Modal.getOrCreateInstance(modalEl.value);
        receiveModal?.show();
      }
    }, 200);
  }
}

onMounted(() => {
  const sModalEl = document.getElementById("supplierFormModal");
  if (sModalEl) {
    sModalEl.addEventListener("hidden.bs.modal", handleSupplierModalHidden);
  }
});

onBeforeUnmount(() => {
  const sModalEl = document.getElementById("supplierFormModal");
  if (sModalEl) {
    sModalEl.removeEventListener("hidden.bs.modal", handleSupplierModalHidden);
  }
});

function onSupplierSaved(saved) {
  const supplier = saved?.supplier || saved;
  if (supplier && supplier.id) {
    registeredSuppliers.value.unshift(supplier);
    form.value.supplier_id = supplier.id;
    form.value.supplier_name = supplier.name;
    isCustomSupplier.value = false;
  } else {
    loadRegisteredSuppliers();
  }
}

// Product Options for SelectSearchBox
const productSelectOptions = computed(() => {
  const list = allProducts.value.length ? allProducts.value : props.availableProducts;
  return list.map((p) => ({
    label: `${p.name} ${p.unit ? `(${p.unit})` : ""}`,
    value: p.id,
    image: p.image_url || p.image?.url || "",
    barcode: p.barcode || "",
    unit: p.unit || "pcs",
    cost_price: p.cost_price || p.last_cost_price || 0,
    selling_price: p.selling_price || 0,
  }));
});

function getProductUnit(productId) {
  const found = productSelectOptions.value.find((p) => p.value === productId);
  return found?.unit || "pcs";
}

function onProductPicked(item) {
  const p = productSelectOptions.value.find((opt) => opt.value === item.tenant_product_id);
  if (p) {
    item.unit = p.unit;
    item.barcode = p.barcode;
    if ((!item.unit_cost || item.unit_cost === 0) && p.cost_price > 0) {
      item.unit_cost = Number(p.cost_price);
    }
  }
}

function onCostEnter(idx) {
  if (idx === form.value.items.length - 1) {
    addItem();
  }
}

const grandTotal = computed(() => {
  return form.value.items.reduce((acc, it) => {
    return acc + (Number(it.quantity) || 0) * (Number(it.unit_cost) || 0);
  }, 0);
});

const totalQuantitySum = computed(() => {
  return form.value.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
});

const totalBonusSum = computed(() => {
  return form.value.items.reduce((acc, it) => acc + (Number(it.bonus_quantity) || 0), 0);
});

const canSubmit = computed(() => {
  return (
    form.value.items.length > 0 &&
    form.value.items.every(
      (it) => it.tenant_product_id && Number(it.quantity) > 0 && Number(it.unit_cost) >= 0
    ) &&
    (Boolean(form.value.supplier_id) || Boolean(form.value.supplier_name?.trim()))
  );
});

function addItem() {
  form.value.items.push({
    tenant_product_id: "",
    quantity: 1,
    bonus_quantity: 0,
    unit_cost: 0,
    barcode: "",
    unit: "pcs",
    batch_number: "",
  });
}

function removeItem(idx) {
  if (form.value.items.length > 1) {
    form.value.items.splice(idx, 1);
  }
}

function open(arg = null) {
  loadRegisteredSuppliers();
  loadAllProducts();

  let preselectedProductId = null;
  let supplierId = null;
  let supplierName = "";

  if (typeof arg === "string") {
    preselectedProductId = arg;
  } else if (arg && typeof arg === "object") {
    preselectedProductId = arg.productId || arg.product?.id || null;
    supplierId = arg.supplier_id || arg.id || null;
    supplierName = arg.supplier_name || arg.name || "";
  }

  isCustomSupplier.value = false;

  const initialProduct = preselectedProductId
    ? props.availableProducts.find((p) => p.id === preselectedProductId)
    : props.availableProducts[0];

  form.value = {
    supplier_id: supplierId,
    supplier_name: supplierName,
    invoice_number: "",
    notes: "",
    items: [
      {
        tenant_product_id: preselectedProductId || (initialProduct?.id ?? ""),
        quantity: 1,
        bonus_quantity: 0,
        unit_cost: initialProduct?.cost_price ?? 0,
        barcode: initialProduct?.barcode || "",
        unit: initialProduct?.unit || "pcs",
        batch_number: "",
      },
    ],
  };
  saving.value = false;

  scanBarcodeQuery.value = "";
  scanMultiplier.value = 1;
  scanFeedback.value = null;

  if (window.bootstrap?.Modal) {
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl.value);
    modal.show();
  }

  setTimeout(() => {
    barcodeScanInput.value?.focus();
  }, 350);
}

async function handleSubmit() {
  if (!canSubmit.value) return;

  saving.value = true;
  try {
    // Record batch/lot numbers cleanly into delivery ledger notes
    const batchSummaries = form.value.items
      .filter((it) => it.batch_number && it.batch_number.trim())
      .map((it) => {
        const prod = productSelectOptions.value.find((p) => p.value === it.tenant_product_id);
        const name = prod?.label || "Item";
        return `${name}: [Batch ${it.batch_number.trim()}]`;
      });

    let combinedNotes = form.value.notes ? form.value.notes.trim() : "";
    if (batchSummaries.length > 0) {
      const batchText = `Batches: ${batchSummaries.join("; ")}`;
      combinedNotes = combinedNotes ? `${combinedNotes} | ${batchText}` : batchText;
    }

    const payload = {
      branch_id: props.branchId,
      supplier_id: form.value.supplier_id || undefined,
      supplier_name: form.value.supplier_name?.trim() || undefined,
      invoice_number: form.value.invoice_number?.trim() || undefined,
      notes: combinedNotes || undefined,
      items: form.value.items.map((it) => ({
        tenant_product_id: it.tenant_product_id,
        quantity: Number(it.quantity),
        bonus_quantity: Number(it.bonus_quantity) || 0,
        unit_cost: Number(it.unit_cost),
      })),
    };

    const { data } = await StockAPI.receive(payload);

    if (window.bootstrap?.Modal) {
      const modal = window.bootstrap.Modal.getInstance(modalEl.value);
      modal?.hide();
    }

    emit("saved", {
      result: data,
      message: data.message || "Stock delivery successfully recorded.",
    });
  } catch (err) {
    console.error("Error receiving stock:", err);
    emit("error", err.response?.data?.message || "Failed to record delivery.");
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>

<style scoped>
/* Activity Log Clean Border Style (flat, 1px #E9EBEF, zero drop shadow) */
.section-card {
  background-color: #FAFBFD;
  border: 1px solid #E9EBEF !important;
  border-radius: 8px;
}

.section-card :deep(.vue-select .control),
.section-card .form-control,
.section-card .input-group-text,
.section-card .input-group {
  height: 36px !important;
  min-height: 36px !important;
  font-size: 13px !important;
}

.section-card :deep(.vue-select .value-container) {
  height: 36px !important;
  min-height: 36px !important;
  padding: 0 10px !important;
  display: flex !important;
  align-items: center !important;
}

/* Barcode Scan Toolbar */
.barcode-scan-bar {
  border-color: #E9EBEF !important;
  background-color: #FAFBFD !important;
}

.barcode-scan-bar .input-group,
.barcode-scan-bar .form-control,
.barcode-scan-bar .input-group-text,
.barcode-scan-bar .btn {
  height: 36px !important;
  min-height: 36px !important;
  font-size: 13px !important;
}

/* Green Pulse Animation on Scanned Row */
@keyframes rowFlash {
  0% { background-color: #d1fae5; }
  50% { background-color: #ecfdf5; }
  100% { background-color: transparent; }
}

.scan-highlight {
  animation: rowFlash 1.5s ease-out;
}

/* Activity Day Box Container */
.activity-day-box {
  border: 1px solid #E9EBEF;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
}

.table-responsive-receive {
  min-height: 220px;
  overflow-x: auto;
  overflow-y: visible;
}

@media (min-width: 992px) {
  .table-responsive-receive {
    overflow: visible !important;
  }
}

/* Activity Log Table Aesthetic */
.receive-table {
  width: 100%;
  border-collapse: collapse;
}

.receive-table thead th {
  background-color: #FAFBFD;
  color: #5B6B8C;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #E9EBEF !important;
  padding: 10px 10px;
  vertical-align: middle;
}

.receive-table tbody tr {
  border-top: 1px solid #EFF2F7;
  background-color: #ffffff;
  transition: background-color 0.15s ease-in-out;
}

.receive-table tbody tr:hover {
  background-color: #FAFBFD;
}

.receive-table tbody td {
  padding: 8px 8px;
  vertical-align: middle;
}

/* Column Dimensions */
.col-idx { width: 38px; }
.col-product { min-width: 270px; }
.col-barcode { width: 120px; }
.col-batch { width: 120px; }
.col-qty { width: 120px; }
.col-bonus { width: 105px; }
.col-cost { width: 135px; }
.col-total { width: 125px; }
.col-action { width: 42px; }

/* Strict Uniform Height (36px) across all Table Controls */
.receive-table :deep(.vue-select .control) {
  height: 36px !important;
  min-height: 36px !important;
  max-height: 36px !important;
  padding: 0 !important;
  border-radius: 4px !important;
  border: 1px solid #ced4da !important;
  box-shadow: none !important;
  background-color: #ffffff !important;
}

.receive-table :deep(.vue-select .value-container) {
  height: 36px !important;
  min-height: 36px !important;
  padding: 0 10px !important;
  display: flex !important;
  align-items: center !important;
  font-size: 13px !important;
}

.receive-table :deep(.vue-select .indicators-container) {
  height: 36px !important;
}

.receive-table :deep(.vue-select .search-input) {
  height: 32px !important;
  font-size: 13px !important;
}

.receive-table :deep(.vue-select .placeholder) {
  font-size: 13px !important;
  color: #94a3b8 !important;
}

.receive-table :deep(.vue-select .single-value) {
  font-size: 13px !important;
  color: #1e293b !important;
  font-weight: 500 !important;
}

.receive-table .input-group {
  height: 36px !important;
  flex-wrap: nowrap;
}

.receive-table .form-control {
  height: 36px !important;
  min-height: 36px !important;
  max-height: 36px !important;
  padding: 5px 9px !important;
  font-size: 13px !important;
  border-color: #ced4da !important;
  box-shadow: none !important;
}

.receive-table .form-control:focus {
  border-color: #86b7fe !important;
  box-shadow: 0 0 0 0.15rem rgba(13, 110, 253, 0.12) !important;
}

.receive-table .input-group-text {
  height: 36px !important;
  min-height: 36px !important;
  max-height: 36px !important;
  padding: 0 8px !important;
  border-color: #ced4da !important;
  background-color: #FAFBFD !important;
  display: inline-flex !important;
  align-items: center !important;
}

.product-select-wrapper {
  position: relative;
  min-width: 260px;
}

/* Activity Log / ClickUp Style Add Line Row */
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
  transition: all 0.15s ease;
}

.activity-add-row:hover .add-circle-icon {
  background-color: var(--bs-primary);
  color: #ffffff;
  transform: scale(1.1);
}

.remove-row-btn {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #94a3b8;
  transition: all 0.15s ease;
}

.remove-row-btn:hover:not(:disabled) {
  background-color: #fee2e2;
  color: #ef4444;
}

/* Summary Footer */
.activity-table-foot {
  background-color: #FAFBFD;
  border-top: 2px solid #E9EBEF;
}
</style>