<template>
  <div class="page-content py-3 px-4">
    <div class="container-fluid">
      <!-- Breadcrumb / Page Title -->
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h4 class="font-size-18 fw-bold mb-1 text-dark">Open Tabs & Bills</h4>
          <ol class="breadcrumb m-0 font-size-12">
            <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
            <li class="breadcrumb-item"><router-link to="/sell">Selling</router-link></li>
            <li class="breadcrumb-item active">Open Tabs</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <router-link to="/sell" class="btn btn-sm btn-primary d-inline-flex align-items-center gap-1 px-3">
            <i class="bx bx-cart"></i>
            <span>Open Counter POS</span>
          </router-link>
          <router-link to="/sell/tables" class="btn btn-sm btn-light border d-inline-flex align-items-center gap-1 px-3">
            <i class="bx bx-restaurant"></i>
            <span>Floor & Tables</span>
          </router-link>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row g-3 mb-4">
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card h-100 p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted font-size-12 fw-semibold text-uppercase">Active Open Tabs</span>
                <h3 class="font-size-22 fw-bold mb-0 mt-1 text-dark">{{ openTabsCount }}</h3>
                <small class="text-muted font-size-11">Awaiting final checkout</small>
              </div>
              <div class="avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center text-primary">
                <i class="bx bx-receipt fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card h-100 p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted font-size-12 fw-semibold text-uppercase">Total Outstanding</span>
                <h3 class="font-size-22 fw-bold mb-0 mt-1 text-primary">KES {{ formatMoney(totalOutstandingBalance) }}</h3>
                <small class="text-muted font-size-11">Unpaid bill balance</small>
              </div>
              <div class="avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center text-warning">
                <i class="bx bx-money fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card h-100 p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted font-size-12 fw-semibold text-uppercase">Partially Paid</span>
                <h3 class="font-size-22 fw-bold mb-0 mt-1 text-info">{{ partiallyPaidCount }}</h3>
                <small class="text-muted font-size-11">With partial payments</small>
              </div>
              <div class="avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center text-info">
                <i class="bx bx-pie-chart-alt-2 fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card h-100 p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted font-size-12 fw-semibold text-uppercase">Occupied Tables</span>
                <h3 class="font-size-22 fw-bold mb-0 mt-1 text-success">{{ occupiedTablesCount }}</h3>
                <small class="text-muted font-size-11">Active dine-in tables</small>
              </div>
              <div class="avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center text-success">
                <i class="bx bx-restaurant fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Tabs Content Card -->
      <div class="card">
        <!-- Filter Toolbar -->
        <div class="card-header bg-white border-bottom p-3">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <!-- Status Tabs -->
            <div class="btn-group btn-group-sm" role="group">
              <button
                type="button"
                class="btn px-3 font-size-13"
                :class="statusFilter === 'active' ? 'btn-primary' : 'btn-light border'"
                @click="changeStatusFilter('active')"
              >
                Active Tabs ({{ activeTabsCount }})
              </button>
              <button
                type="button"
                class="btn px-3 font-size-13"
                :class="statusFilter === 'settled' ? 'btn-primary' : 'btn-light border'"
                @click="changeStatusFilter('settled')"
              >
                Settled Bills
              </button>
              <button
                type="button"
                class="btn px-3 font-size-13"
                :class="statusFilter === 'all' ? 'btn-primary' : 'btn-light border'"
                @click="changeStatusFilter('all')"
              >
                All Tabs
              </button>
            </div>

            <!-- Search and Refresh -->
            <div class="d-flex align-items-center gap-2">
              <div class="position-relative" style="min-width: 260px;">
                <input
                  v-model="searchQuery"
                  type="text"
                  class="form-control form-control-sm pe-4 font-size-13"
                  placeholder="Search tab, table, or customer..."
                  @input="onSearch"
                />
                <i class="bx bx-search position-absolute top-50 end-0 translate-middle-y me-2 text-muted"></i>
              </div>

              <button
                type="button"
                class="btn btn-sm btn-light border px-2 py-1 font-size-13 d-inline-flex align-items-center justify-content-center"
                style="min-width: 36px; min-height: 32px;"
                title="Refresh Tabs"
                @click="fetchTabs"
              >
                <i class="bx bx-refresh fs-5" :class="{ 'bx-spin': isLoading }"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Tab List / Table -->
        <div class="card-body p-0">
          <div v-if="isLoading && tabs.length === 0" class="text-center py-5">
            <div class="spinner-border text-primary spinner-border-sm mb-2" role="status"></div>
            <p class="text-muted font-size-13 mb-0">Loading open tabs...</p>
          </div>

          <div v-else-if="tabs.length === 0" class="text-center py-5">
            <i class="bx bx-folder-open fs-1 text-muted opacity-50 mb-2"></i>
            <h5 class="fw-semibold text-dark font-size-15 mb-1">No open tabs found</h5>
            <p class="text-muted font-size-13 mb-3">
              {{ searchQuery ? 'No tabs match your search.' : 'There are currently no active customer tabs or table orders.' }}
            </p>
            <router-link to="/sell" class="btn btn-sm btn-primary">
              <i class="bx bx-plus me-1"></i> Start a Sale at Counter
            </router-link>
          </div>

          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0 font-size-13">
              <thead class="table-light">
                <tr>
                  <th style="width: 140px;">Tab #</th>
                  <th>Tab Name / Reference</th>
                  <th>Location / Table</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th class="text-end">Total</th>
                  <th class="text-end">Paid</th>
                  <th class="text-end">Balance Due</th>
                  <th class="text-center">Status</th>
                  <th class="text-end" style="min-width: 180px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tab in tabs" :key="tab.id">
                  <td class="font-monospace fw-bold text-dark">
                    {{ tab.tab_number }}
                  </td>
                  <td>
                    <strong class="text-dark">{{ tab.name }}</strong>
                    <div v-if="tab.notes" class="text-muted font-size-11 text-truncate" style="max-width: 200px;">
                      {{ tab.notes }}
                    </div>
                  </td>
                  <td>
                    <span v-if="tab.table" class="badge bg-primary-subtle text-primary border border-primary-subtle font-size-11">
                      <i class="bx bx-restaurant me-1"></i> Table {{ tab.table.table_number }}
                    </span>
                    <span v-else class="badge bg-light text-muted border font-size-11">
                      <i class="bx bx-store me-1"></i> Counter Tab
                    </span>
                  </td>
                  <td>
                    <div v-if="tab.customer">
                      <div class="fw-semibold text-dark">{{ tab.customer.first_name }} {{ tab.customer.last_name }}</div>
                      <small class="text-muted font-size-11">{{ tab.customer.phone || 'No phone' }}</small>
                    </div>
                    <span v-else class="text-muted font-size-12">Walk-in</span>
                  </td>
                  <td>
                    <span class="badge bg-light text-dark border font-size-11">
                      {{ tab.items?.length || 0 }} items
                    </span>
                  </td>
                  <td class="text-end fw-semibold text-dark">
                    KES {{ formatMoney(tab.total_amount) }}
                  </td>
                  <td class="text-end text-success">
                    KES {{ formatMoney(tab.paid_amount) }}
                  </td>
                  <td class="text-end fw-bold" :class="Number(tab.balance_due) > 0 ? 'text-danger' : 'text-success'">
                    KES {{ formatMoney(tab.balance_due) }}
                  </td>
                  <td class="text-center">
                    <span
                      class="badge font-size-11"
                      :class="statusBadgeClass(tab.status)"
                    >
                      {{ formatStatus(tab.status) }}
                    </span>
                  </td>
                  <td class="text-end">
                    <div class="d-inline-flex align-items-center gap-1">
                      <!-- Resume in Cart Button -->
                      <button
                        v-if="['open', 'partially_paid'].includes(tab.status)"
                        type="button"
                        class="btn btn-sm btn-light border d-inline-flex align-items-center gap-1 font-size-12 py-1 px-2"
                        title="Resume in Cart (Add items or checkout)"
                        @click="resumeTabInCart(tab)"
                      >
                        <i class="bx bx-cart-add text-primary"></i>
                        <span>Resume</span>
                      </button>

                      <!-- Quick Partial Payment -->
                      <button
                        v-if="['open', 'partially_paid'].includes(tab.status) && Number(tab.balance_due) > 0"
                        type="button"
                        class="btn btn-sm btn-light border d-inline-flex align-items-center gap-1 font-size-12 py-1 px-2 text-success"
                        title="Record Payment"
                        @click="openPaymentModal(tab)"
                      >
                        <i class="bx bx-money"></i>
                        <span>Pay</span>
                      </button>

                      <!-- Settle Button -->
                      <button
                        v-if="['open', 'partially_paid'].includes(tab.status)"
                        type="button"
                        class="btn btn-sm btn-primary font-size-12 py-1 px-2"
                        title="Settle and close bill"
                        @click="openSettleConfirm(tab)"
                      >
                        <span>Settle</span>
                      </button>

                      <!-- Split Tab -->
                      <button
                        v-if="['open', 'partially_paid'].includes(tab.status) && (tab.items?.length > 1)"
                        type="button"
                        class="btn btn-sm btn-light border font-size-12 py-1 px-2 text-muted"
                        title="Split Bill"
                        @click="openSplitModal(tab)"
                      >
                        <i class="bx bx-git-repo-forked"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Partial Payment Modal -->
    <div
      v-if="showPaymentModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(15, 23, 42, 0.55); z-index: 1055;"
      @click.self="showPaymentModal = false"
    >
      <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
        <div class="modal-content border-0 rounded flat-card overflow-hidden">
          <div class="modal-header bg-white border-bottom py-3 px-4">
            <div class="d-flex align-items-center gap-2">
              <div class="tone-chip tone-chip-success">
                <i class="bx bx-money fs-5"></i>
              </div>
              <div>
                <h5 class="modal-title font-size-16 fw-bold mb-0">Record Payment on Tab</h5>
                <small class="text-muted font-size-12">{{ activeTab?.tab_number }} — {{ activeTab?.name }}</small>
              </div>
            </div>
            <button type="button" class="btn-close" @click="showPaymentModal = false"></button>
          </div>

          <div class="modal-body p-4">
            <div class="p-3 bg-light rounded border mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span class="text-muted font-size-12">Total Bill:</span>
                <span class="fw-semibold font-size-13 text-dark">KES {{ formatMoney(activeTab?.total_amount) }}</span>
              </div>
              <div class="d-flex justify-content-between mb-1">
                <span class="text-muted font-size-12">Already Paid:</span>
                <span class="text-success font-size-13">KES {{ formatMoney(activeTab?.paid_amount) }}</span>
              </div>
              <div class="d-flex justify-content-between pt-2 border-top">
                <span class="fw-bold font-size-13 text-dark">Balance Due:</span>
                <span class="fw-bold font-size-16 text-danger">KES {{ formatMoney(activeTab?.balance_due) }}</span>
              </div>
            </div>

            <div v-if="paymentError" class="alert alert-danger py-2 px-3 font-size-13 mb-3">
              {{ paymentError }}
            </div>

            <form @submit.prevent="submitTabPayment">
              <div class="mb-3">
                <label class="form-label font-size-12 fw-semibold text-muted mb-1">Payment Method</label>
                <div class="d-flex gap-2">
                  <button
                    type="button"
                    class="btn btn-sm flex-grow-1 font-size-12 py-2"
                    :class="paymentForm.method === 'cash' ? 'btn-primary' : 'btn-light border'"
                    @click="paymentForm.method = 'cash'"
                  >
                    <i class="bx bx-money me-1"></i> Cash
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm flex-grow-1 font-size-12 py-2"
                    :class="paymentForm.method === 'mpesa' ? 'btn-success text-white' : 'btn-light border'"
                    @click="paymentForm.method = 'mpesa'"
                  >
                    <i class="bx bx-mobile-alt me-1"></i> M-Pesa
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm flex-grow-1 font-size-12 py-2"
                    :class="paymentForm.method === 'card' ? 'btn-primary' : 'btn-light border'"
                    @click="paymentForm.method = 'card'"
                  >
                    <i class="bx bx-credit-card me-1"></i> Card
                  </button>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label font-size-12 fw-semibold text-muted mb-1">Amount to Pay (KES)</label>
                <input
                  v-model.number="paymentForm.amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  :max="activeTab?.balance_due"
                  class="form-control font-size-15 fw-bold"
                  required
                />
              </div>

              <div v-if="paymentForm.method === 'mpesa'" class="mb-3">
                <label class="form-label font-size-12 fw-semibold text-muted mb-1">M-Pesa Reference / Code</label>
                <input
                  v-model="paymentForm.external_reference"
                  type="text"
                  class="form-control font-size-13"
                  placeholder="e.g. QK12345678"
                />
              </div>

              <div class="d-flex justify-content-end gap-2 pt-2 border-top">
                <button type="button" class="btn btn-light border px-3 font-size-13" @click="showPaymentModal = false">
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-success px-4 font-size-13 fw-semibold d-inline-flex align-items-center gap-1"
                  :disabled="isSubmittingPayment"
                >
                  <i v-if="isSubmittingPayment" class="bx bx-loader-alt bx-spin"></i>
                  <span>{{ isSubmittingPayment ? 'Processing...' : 'Confirm Payment' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Settle Tab Confirmation Modal -->
    <div
      v-if="showSettleModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(15, 23, 42, 0.55); z-index: 1055;"
      @click.self="showSettleModal = false"
    >
      <div class="modal-dialog modal-dialog-centered" style="max-width: 460px;">
        <div class="modal-content border-0 rounded overflow-hidden">
          <div class="modal-header bg-white border-bottom py-3 px-4">
            <h5 class="modal-title font-size-16 fw-bold mb-0">Settle Tab as Completed Sale</h5>
            <button type="button" class="btn-close" @click="showSettleModal = false"></button>
          </div>
          <div class="modal-body p-4 text-center">
            <div class="avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center text-primary mx-auto mb-3" style="width: 50px; height: 50px;">
              <i class="bx bx-check-circle fs-2"></i>
            </div>
            <h5 class="fw-bold text-dark mb-1">Settle {{ activeTab?.tab_number }}?</h5>
            <p class="text-muted font-size-13 mb-3">
              This will deduct inventory stock, finalize the bill as a completed Sales Order, and release Table {{ activeTab?.table?.table_number || '' }}.
            </p>
            <div class="p-3 bg-light rounded border text-start mb-3">
              <div class="d-flex justify-content-between font-size-13 mb-1">
                <span class="text-muted">Total:</span>
                <span class="fw-bold text-dark">KES {{ formatMoney(activeTab?.total_amount) }}</span>
              </div>
              <div class="d-flex justify-content-between font-size-13">
                <span class="text-muted">Paid:</span>
                <span class="fw-bold text-success">KES {{ formatMoney(activeTab?.paid_amount) }}</span>
              </div>
            </div>
            <div class="d-flex justify-content-center gap-2">
              <button type="button" class="btn btn-light border px-3" @click="showSettleModal = false">
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-primary px-4 fw-semibold"
                :disabled="isSubmittingSettle"
                @click="confirmSettleTab"
              >
                <i v-if="isSubmittingSettle" class="bx bx-loader-alt bx-spin me-1"></i>
                <span>{{ isSubmittingSettle ? 'Settling...' : 'Complete Settlement' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { useCartStore } from "@/stores/cart";
import tabsApi from "@/api/tabs";
import shiftsApi from "@/api/shifts";

const router = useRouter();
const cartStore = useCartStore();

const tabs = ref([]);
const isLoading = ref(false);
const statusFilter = ref("active");
const searchQuery = ref("");
const currentShift = ref(null);
const branchId = ref(null);

// Payment modal state
const showPaymentModal = ref(false);
const isSubmittingPayment = ref(false);
const paymentError = ref("");
const activeTab = ref(null);
const paymentForm = reactive({
  method: "cash",
  amount: 0,
  external_reference: "",
});

// Settle modal state
const showSettleModal = ref(false);
const isSubmittingSettle = ref(false);

const openTabsCount = computed(() => {
  return tabs.value.filter((t) => t.status === "open").length;
});

const partiallyPaidCount = computed(() => {
  return tabs.value.filter((t) => t.status === "partially_paid").length;
});

const activeTabsCount = computed(() => {
  return tabs.value.filter((t) => ["open", "partially_paid"].includes(t.status)).length;
});

const totalOutstandingBalance = computed(() => {
  return tabs.value
    .filter((t) => ["open", "partially_paid"].includes(t.status))
    .reduce((sum, t) => sum + Number(t.balance_due || 0), 0);
});

const occupiedTablesCount = computed(() => {
  const tableIds = new Set(
    tabs.value
      .filter((t) => ["open", "partially_paid"].includes(t.status) && t.table_id)
      .map((t) => t.table_id)
  );
  return tableIds.size;
});

function formatMoney(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatStatus(status) {
  return status.replace("_", " ").toUpperCase();
}

function statusBadgeClass(status) {
  switch (status) {
    case "open":
      return "bg-warning-subtle text-warning border border-warning-subtle";
    case "partially_paid":
      return "bg-info-subtle text-info border border-info-subtle";
    case "settled":
      return "bg-success-subtle text-success border border-success-subtle";
    case "merged":
      return "bg-secondary-subtle text-secondary border border-secondary-subtle";
    default:
      return "bg-light text-muted border";
  }
}

async function fetchTabs() {
  isLoading.value = true;
  try {
    const shiftRes = await shiftsApi.current();
    if (shiftRes.data?.success && shiftRes.data?.shift) {
      currentShift.value = shiftRes.data.shift;
      branchId.value = currentShift.value.branch_id;
    } else {
      branchId.value = 4; // Cleo's Kitchen default fallback
    }

    const params = {
      branch_id: branchId.value,
      status: statusFilter.value,
    };
    if (searchQuery.value) {
      params.search = searchQuery.value;
    }

    const res = await tabsApi.list(params);
    if (res.data?.success) {
      tabs.value = res.data.data || [];
    }
  } catch (err) {
    console.error("Failed to load tabs:", err);
  } finally {
    isLoading.value = false;
  }
}

function changeStatusFilter(status) {
  statusFilter.value = status;
  fetchTabs();
}

let searchDebounce = null;
function onSearch() {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    fetchTabs();
  }, 350);
}

function resumeTabInCart(tab) {
  cartStore.loadTab(tab);
  router.push({ path: "/sell", query: { tab_id: tab.id } });
}

function openPaymentModal(tab) {
  activeTab.value = tab;
  paymentForm.method = "cash";
  paymentForm.amount = Number(tab.balance_due) || 0;
  paymentForm.external_reference = "";
  paymentError.value = "";
  showPaymentModal.value = true;
}

async function submitTabPayment() {
  if (!activeTab.value) return;
  isSubmittingPayment.value = true;
  paymentError.value = "";

  try {
    const res = await tabsApi.recordPayment(activeTab.value.id, {
      amount: paymentForm.amount,
      method: paymentForm.method,
      shift_id: currentShift.value?.id || null,
      external_reference: paymentForm.external_reference || null,
    });

    if (res.data?.success) {
      showPaymentModal.value = false;
      await fetchTabs();
    } else {
      paymentError.value = res.data?.message || "Failed to record payment.";
    }
  } catch (err) {
    console.error("Payment error:", err);
    paymentError.value = err.response?.data?.message || "An unexpected error occurred.";
  } finally {
    isSubmittingPayment.value = false;
  }
}

function openSettleConfirm(tab) {
  activeTab.value = tab;
  showSettleModal.value = true;
}

async function confirmSettleTab() {
  if (!activeTab.value) return;
  isSubmittingSettle.value = true;

  try {
    const res = await tabsApi.settle(activeTab.value.id, {
      shift_id: currentShift.value?.id || null,
    });
    if (res.data?.success) {
      showSettleModal.value = false;
      await fetchTabs();
    }
  } catch (err) {
    console.error("Settlement error:", err);
    alert(err.response?.data?.message || "Failed to settle tab.");
  } finally {
    isSubmittingSettle.value = false;
  }
}

function openSplitModal(tab) {
  const newName = prompt(`Enter new tab name to split from ${tab.tab_number}:`, `Split - ${tab.name}`);
  if (!newName) return;
  // Move first item as a split example
  if (tab.items && tab.items.length > 1) {
    const firstItemId = tab.items[0].id;
    tabsApi.split(tab.id, [firstItemId], newName).then(() => {
      fetchTabs();
    });
  }
}

onMounted(() => {
  fetchTabs();
});
</script>

<style scoped>
</style>
