<template>
  <div
    v-if="isOpen"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(15, 23, 42, 0.55); z-index: 1055;"
    @click.self="close"
  >
    <div class="modal-dialog modal-dialog-centered" style="max-width: 520px;">
      <div class="modal-content border-0 rounded overflow-hidden">
        <!-- Header -->
        <div class="modal-header bg-white border-bottom py-3 px-4">
          <div class="d-flex align-items-center gap-2">
            <i class="bx bx-bookmark fs-4 text-primary"></i>
            <div>
              <h5 class="modal-title font-size-16 fw-bold mb-0">Save as Open Tab / Bill</h5>
              <p class="text-muted font-size-12 mb-0">
                Keep this order open for rounds, table dining, or later settlement.
              </p>
            </div>
          </div>
          <button type="button" class="btn-close" @click="close"></button>
        </div>

        <!-- Body -->
        <div class="modal-body p-4">
          <div v-if="errorMessage" class="alert alert-danger py-2 px-3 font-size-13 mb-3">
            <i class="bx bx-error-circle me-1"></i> {{ errorMessage }}
          </div>

          <!-- Order Summary Card -->
          <div class="p-3 bg-light rounded border mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-muted font-size-12">Items to save:</span>
              <span class="fw-semibold font-size-13 text-dark">{{ cartStore.itemCount }} items</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-muted font-size-12">Subtotal:</span>
              <span class="font-size-13 text-dark">KES {{ formatMoney(cartStore.subtotal) }}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center pt-2 border-top">
              <span class="fw-bold text-dark font-size-13">Total Bill:</span>
              <span class="fw-bold font-size-16 text-primary">KES {{ formatMoney(cartStore.totalAmount) }}</span>
            </div>
          </div>

          <form @submit.prevent="submitSaveTab">
            <!-- Tab / Bill Reference Name -->
            <div class="mb-3">
              <label class="form-label font-size-12 fw-semibold text-muted mb-1">
                Tab Name or Reference <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                class="form-control"
                placeholder="e.g. Table 4 - Alice, Booth 2, John Doe Tab"
                required
              />
            </div>

            <!-- Table Selection -->
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <label class="form-label font-size-12 fw-semibold text-muted mb-0">
                  Assign to Table (Optional)
                </label>
                <small v-if="isLoadingTables" class="text-muted">Loading tables...</small>
              </div>
              <select v-model="form.table_id" class="form-select font-size-13" @change="onTableChange">
                <option value="">No table / Counter Tab</option>
                <option
                  v-for="t in tables"
                  :key="t.id"
                  :value="t.id"
                >
                  Table {{ t.table_number }} {{ t.label ? `(${t.label})` : '' }} — {{ t.status }}
                </option>
              </select>
            </div>

            <!-- Customer -->
            <div class="mb-3">
              <label class="form-label font-size-12 fw-semibold text-muted mb-1">
                Customer
              </label>
              <div class="p-2 bg-light rounded border d-flex align-items-center justify-content-between">
                <div v-if="cartStore.customer" class="d-flex align-items-center gap-2">
                  <i class="bx bx-user-check text-success fs-5"></i>
                  <div>
                    <div class="fw-semibold text-dark font-size-13">{{ cartStore.customer.name }}</div>
                    <small class="text-muted font-size-11">{{ cartStore.customer.phone || 'No phone' }}</small>
                  </div>
                </div>
                <div v-else class="text-muted font-size-12">
                  <i class="bx bx-user me-1"></i> Walk-in Customer
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="mb-3">
              <label class="form-label font-size-12 fw-semibold text-muted mb-1">
                Tab Notes (Optional)
              </label>
              <textarea
                v-model="form.notes"
                class="form-control font-size-13"
                rows="2"
                placeholder="Special requests, guest count, or instructions..."
              ></textarea>
            </div>

            <!-- Footer Buttons -->
            <div class="d-flex justify-content-end gap-2 pt-2 border-top">
              <button type="button" class="btn btn-light border px-3 font-size-13" @click="close">
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary px-4 font-size-13 fw-semibold d-inline-flex align-items-center gap-1"
                :disabled="isSubmitting || cartStore.isEmpty"
              >
                <i v-if="isSubmitting" class="bx bx-loader-alt bx-spin"></i>
                <i v-else class="bx bx-check"></i>
                <span>{{ isSubmitting ? 'Saving...' : 'Save Open Tab' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import { useCartStore } from "@/stores/cart";
import tabsApi from "@/api/tabs";
import tablesApi from "@/api/tables";

const emit = defineEmits(["tab-saved", "closed"]);

const cartStore = useCartStore();

const isOpen = ref(false);
const isSubmitting = ref(false);
const isLoadingTables = ref(false);
const errorMessage = ref("");
const tables = ref([]);
const currentShiftId = ref(null);
const currentBranchId = ref(null);

const form = reactive({
  name: "",
  table_id: "",
  notes: "",
});

function formatMoney(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function open({ branchId, shiftId }) {
  currentBranchId.value = branchId;
  currentShiftId.value = shiftId;
  errorMessage.value = "";
  isSubmitting.value = false;

  // Auto-generate name default
  if (cartStore.table) {
    form.table_id = cartStore.table.id;
    form.name = `Table ${cartStore.table.table_number}`;
  } else if (cartStore.customer) {
    form.table_id = "";
    form.name = `${cartStore.customer.name}'s Tab`;
  } else {
    form.table_id = "";
    form.name = `Tab ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  form.notes = cartStore.notes || "";

  isOpen.value = true;
  await fetchTables();
}

async function fetchTables() {
  if (!currentBranchId.value) return;
  isLoadingTables.value = true;
  try {
    const res = await tablesApi.list({ branch_id: currentBranchId.value });
    if (res.data?.success) {
      tables.value = res.data.data || [];
    }
  } catch (err) {
    console.error("Failed to load tables:", err);
  } finally {
    isLoadingTables.value = false;
  }
}

function onTableChange() {
  const tbl = tables.value.find((t) => t.id === form.table_id);
  if (tbl && (!form.name || form.name.startsWith("Tab") || form.name.startsWith("Table"))) {
    form.name = `Table ${tbl.table_number}`;
    cartStore.setTable(tbl);
  } else if (!form.table_id) {
    cartStore.clearTable();
  }
}

function close() {
  isOpen.value = false;
  emit("closed");
}

async function submitSaveTab() {
  if (cartStore.isEmpty) {
    errorMessage.value = "Cart is empty.";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = "";

  const items = cartStore.items.map((i) => ({
    product_id: i.id,
    quantity: i.quantity,
    unit_price: i.unit_price,
    tax_rate: i.tax_rate,
    discount_amount: i.discount_amount || 0,
    notes: i.notes || null,
  }));

  const payload = {
    branch_id: currentBranchId.value,
    shift_id: currentShiftId.value || null,
    customer_id: cartStore.customer ? cartStore.customer.id : null,
    table_id: form.table_id || null,
    name: form.name.trim(),
    discount_amount: cartStore.discountAmount,
    delivery_fee: cartStore.deliveryFee,
    notes: form.notes || null,
    items,
  };

  try {
    const res = await tabsApi.open(payload);
    if (res.data?.success) {
      const savedTab = res.data.data;
      cartStore.clearCart();
      isOpen.value = false;
      emit("tab-saved", savedTab);
    } else {
      errorMessage.value = res.data?.message || "Failed to save open tab.";
    }
  } catch (err) {
    console.error("Failed to save open tab:", err);
    errorMessage.value =
      err.response?.data?.message ||
      (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(" ") : null) ||
      "An unexpected error occurred while saving the tab.";
  } finally {
    isSubmitting.value = false;
  }
}

defineExpose({
  open,
  close,
});
</script>

<style scoped>
</style>
