<template>
  <div class="page-content py-3 px-4">
    <div class="container-fluid">
      <!-- Breadcrumb / Page Title -->
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h4 class="font-size-18 fw-bold mb-1 text-dark">Floor & Table Management</h4>
          <ol class="breadcrumb m-0 font-size-12">
            <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
            <li class="breadcrumb-item"><router-link to="/sell">Selling</router-link></li>
            <li class="breadcrumb-item active">Tables & Floor</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <router-link to="/sell" class="btn btn-sm btn-primary d-inline-flex align-items-center gap-1 px-3">
            <i class="bx bx-cart"></i>
            <span>Open Counter POS</span>
          </router-link>
          <router-link to="/sell/tabs" class="btn btn-sm btn-light border d-inline-flex align-items-center gap-1 px-3">
            <i class="bx bx-file"></i>
            <span>Open Tabs</span>
          </router-link>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row g-3 mb-4">
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card h-100 p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted font-size-12 fw-semibold text-uppercase">Total Tables</span>
                <h3 class="font-size-22 fw-bold mb-0 mt-1 text-dark">{{ tables.length }}</h3>
                <small class="text-muted font-size-11">Registered floor tables</small>
              </div>
              <div class="avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center text-primary">
                <i class="bx bx-restaurant fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card h-100 p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted font-size-12 fw-semibold text-uppercase">Available Tables</span>
                <h3 class="font-size-22 fw-bold mb-0 mt-1 text-success">{{ availableCount }}</h3>
                <small class="text-muted font-size-11">Ready to seat guests</small>
              </div>
              <div class="avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center text-success">
                <i class="bx bx-check-circle fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card h-100 p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted font-size-12 fw-semibold text-uppercase">Occupied Tables</span>
                <h3 class="font-size-22 fw-bold mb-0 mt-1 text-warning">{{ occupiedCount }}</h3>
                <small class="text-muted font-size-11">Currently dining / active bills</small>
              </div>
              <div class="avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center text-warning">
                <i class="bx bx-user-voice fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card h-100 p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted font-size-12 fw-semibold text-uppercase">Total Floor Capacity</span>
                <h3 class="font-size-22 fw-bold mb-0 mt-1 text-info">{{ totalSeatsCount }} Seats</h3>
                <small class="text-muted font-size-11">Across all sections</small>
              </div>
              <div class="avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center text-info">
                <i class="bx bx-group fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Floor Plan & Table Grid Card -->
      <div class="card">
        <!-- Toolbar & Section Filter Chips -->
        <div class="card-header bg-white border-bottom p-3">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <!-- Section Chips -->
            <div class="d-flex gap-2 overflow-auto py-1" style="scrollbar-width: none;">
              <button
                type="button"
                class="btn btn-sm rounded-pill px-3 font-size-13 text-nowrap"
                :class="selectedSectionId === '' ? 'btn-dark text-white' : 'btn-light border'"
                @click="selectedSectionId = ''"
              >
                All Sections ({{ tables.length }})
              </button>
              <button
                v-for="sec in sections"
                :key="sec.id"
                type="button"
                class="btn btn-sm rounded-pill px-3 font-size-13 text-nowrap"
                :class="selectedSectionId === sec.id ? 'btn-dark text-white' : 'btn-light border'"
                @click="selectedSectionId = sec.id"
              >
                {{ sec.name }} ({{ sec.tables_count || 0 }})
              </button>
            </div>

            <!-- Status Filter & Refresh -->
            <div class="d-flex align-items-center gap-2">
              <select v-model="selectedStatus" class="form-select form-select-sm font-size-13" style="width: 150px;">
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="cleaning">Cleaning</option>
              </select>

              <button
                type="button"
                class="btn btn-sm btn-light border px-2 py-1 font-size-13 d-inline-flex align-items-center justify-content-center"
                style="min-width: 36px; min-height: 32px;"
                title="Refresh Floor"
                @click="fetchData"
              >
                <i class="bx bx-refresh fs-5" :class="{ 'bx-spin': isLoading }"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Table Cards Grid -->
        <div class="card-body p-4">
          <div v-if="isLoading && tables.length === 0" class="text-center py-5">
            <div class="spinner-border text-primary spinner-border-sm mb-2" role="status"></div>
            <p class="text-muted font-size-13 mb-0">Loading floor tables...</p>
          </div>

          <div v-else-if="filteredTables.length === 0" class="text-center py-5">
            <i class="bx bx-restaurant fs-1 text-muted opacity-50 mb-2"></i>
            <h5 class="fw-semibold text-dark font-size-15 mb-1">No tables match this view</h5>
            <p class="text-muted font-size-13 mb-0">Try changing the section or status filter above.</p>
          </div>

          <div v-else class="row g-3">
            <div
              v-for="tbl in filteredTables"
              :key="tbl.id"
              class="col-12 col-sm-6 col-md-4 col-xl-3"
            >
              <div
                class="card h-100 border rounded p-3 position-relative"
                :class="tableCardBorderClass(tbl.status)"
              >
                <!-- Top Header: Table # & Capacity -->
                <div class="d-flex align-items-start justify-content-between mb-2">
                  <div>
                    <h5 class="font-size-16 fw-bold mb-0 text-dark">
                      Table {{ tbl.table_number }}
                    </h5>
                    <small v-if="tbl.label" class="text-muted font-size-11">{{ tbl.label }}</small>
                  </div>
                  <span
                    class="badge font-size-11 px-2 py-1 rounded-pill"
                    :class="statusBadgeClass(tbl.status)"
                  >
                    {{ formatStatus(tbl.status) }}
                  </span>
                </div>

                <!-- Middle Details -->
                <div class="font-size-12 text-muted mb-3">
                  <div class="d-flex align-items-center gap-1 mb-1">
                    <i class="bx bx-group"></i>
                    <span>Capacity: <strong>{{ tbl.capacity }} Seats</strong></span>
                  </div>
                  <div v-if="tbl.section" class="d-flex align-items-center gap-1 mb-1">
                    <i class="bx bx-map-pin"></i>
                    <span>Section: <strong>{{ tbl.section.name }}</strong></span>
                  </div>
                  <div v-if="tbl.assigned_waiter" class="d-flex align-items-center gap-1">
                    <i class="bx bx-user"></i>
                    <span>Waiter: <strong>{{ tbl.assigned_waiter.name }}</strong></span>
                  </div>
                </div>

                <!-- Active Tab / Bill Info if Occupied -->
                <div v-if="tbl.status === 'occupied' && tbl.tabs && tbl.tabs.length > 0" class="p-2 bg-light rounded border mb-3">
                  <div class="d-flex justify-content-between font-size-12">
                    <span class="text-muted">Active Bill:</span>
                    <strong class="text-dark">KES {{ formatMoney(tbl.tabs[0].total_amount) }}</strong>
                  </div>
                  <div class="d-flex justify-content-between font-size-11">
                    <span class="text-muted">Due:</span>
                    <strong class="text-danger">KES {{ formatMoney(tbl.tabs[0].balance_due) }}</strong>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="mt-auto pt-2 border-top d-flex gap-2">
                  <button
                    v-if="tbl.status === 'available'"
                    type="button"
                    class="btn btn-sm btn-primary w-100 font-size-12 fw-semibold d-inline-flex align-items-center justify-content-center gap-1"
                    @click="startOrderForTable(tbl)"
                  >
                    <i class="bx bx-cart-add"></i>
                    <span>Start Order</span>
                  </button>

                  <button
                    v-else-if="tbl.status === 'occupied'"
                    type="button"
                    class="btn btn-sm btn-light border flex-grow-1 font-size-12 d-inline-flex align-items-center justify-content-center gap-1"
                    @click="viewTableTabs(tbl)"
                  >
                    <i class="bx bx-receipt text-primary"></i>
                    <span>View Bill</span>
                  </button>

                  <button
                    v-if="tbl.status === 'occupied'"
                    type="button"
                    class="btn btn-sm btn-light border font-size-12 px-2"
                    title="Transfer Table"
                    @click="openTransferModal(tbl)"
                  >
                    <i class="bx bx-transfer-alt"></i>
                  </button>

                  <button
                    v-if="tbl.status === 'cleaning'"
                    type="button"
                    class="btn btn-sm btn-success w-100 font-size-12 d-inline-flex align-items-center justify-content-center gap-1"
                    @click="updateTableStatus(tbl.id, 'available')"
                  >
                    <i class="bx bx-check"></i>
                    <span>Mark Available</span>
                  </button>

                  <button
                    v-if="tbl.status === 'reserved'"
                    type="button"
                    class="btn btn-sm btn-primary w-100 font-size-12 d-inline-flex align-items-center justify-content-center gap-1"
                    @click="startOrderForTable(tbl)"
                  >
                    <i class="bx bx-user-check"></i>
                    <span>Seat Guests</span>
                  </button>

                  <!-- Quick Context Menu / Toggle Status -->
                  <div class="dropdown">
                    <button
                      type="button"
                      class="btn btn-sm btn-light border px-2 font-size-12"
                      data-bs-toggle="dropdown"
                      title="More actions"
                    >
                      <i class="bx bx-dots-vertical-rounded"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end font-size-12 shadow-sm">
                      <li v-if="tbl.status !== 'available'">
                        <a class="dropdown-item cursor-pointer" @click="updateTableStatus(tbl.id, 'available')">
                          <i class="bx bx-check text-success me-1"></i> Mark Available
                        </a>
                      </li>
                      <li v-if="tbl.status !== 'reserved'">
                        <a class="dropdown-item cursor-pointer" @click="updateTableStatus(tbl.id, 'reserved')">
                          <i class="bx bx-bookmark text-primary me-1"></i> Mark Reserved
                        </a>
                      </li>
                      <li v-if="tbl.status !== 'cleaning'">
                        <a class="dropdown-item cursor-pointer" @click="updateTableStatus(tbl.id, 'cleaning')">
                          <i class="bx bx-brush text-purple me-1"></i> Mark Cleaning
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Transfer Modal -->
    <div
      v-if="showTransferModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(15, 23, 42, 0.55); z-index: 1055;"
      @click.self="showTransferModal = false"
    >
      <div class="modal-dialog modal-dialog-centered" style="max-width: 440px;">
        <div class="modal-content border-0 rounded overflow-hidden">
          <div class="modal-header bg-white border-bottom py-3 px-4">
            <h5 class="modal-title font-size-16 fw-bold mb-0">Transfer Table</h5>
            <button type="button" class="btn-close" @click="showTransferModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <p class="text-muted font-size-13 mb-3">
              Transfer active orders, running tabs, and guest bills from <strong>Table {{ sourceTable?.table_number }}</strong> to another table.
            </p>
            <div class="mb-3">
              <label class="form-label font-size-12 fw-semibold text-muted mb-1">Target Table</label>
              <select v-model="targetTableId" class="form-select font-size-13">
                <option value="">Select target table...</option>
                <option
                  v-for="t in availableTargetTables"
                  :key="t.id"
                  :value="t.id"
                >
                  Table {{ t.table_number }} ({{ t.capacity }} seats) — {{ t.status }}
                </option>
              </select>
            </div>
            <div class="d-flex justify-content-end gap-2 pt-2 border-top">
              <button type="button" class="btn btn-light border px-3" @click="showTransferModal = false">
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-primary px-4 fw-semibold"
                :disabled="!targetTableId || isSubmittingTransfer"
                @click="submitTransfer"
              >
                <i v-if="isSubmittingTransfer" class="bx bx-loader-alt bx-spin me-1"></i>
                <span>{{ isSubmittingTransfer ? 'Transferring...' : 'Transfer Table' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useCartStore } from "@/stores/cart";
import tablesApi from "@/api/tables";
import shiftsApi from "@/api/shifts";

const router = useRouter();
const cartStore = useCartStore();

const tables = ref([]);
const sections = ref([]);
const isLoading = ref(false);
const selectedSectionId = ref("");
const selectedStatus = ref("");
const branchId = ref(4);

// Transfer modal
const showTransferModal = ref(false);
const isSubmittingTransfer = ref(false);
const sourceTable = ref(null);
const targetTableId = ref("");

const availableCount = computed(() => {
  return tables.value.filter((t) => t.status === "available").length;
});

const occupiedCount = computed(() => {
  return tables.value.filter((t) => t.status === "occupied").length;
});

const totalSeatsCount = computed(() => {
  return tables.value.reduce((sum, t) => sum + (Number(t.capacity) || 0), 0);
});

const filteredTables = computed(() => {
  return tables.value.filter((t) => {
    if (selectedSectionId.value && t.section_id !== selectedSectionId.value) {
      return false;
    }
    if (selectedStatus.value && t.status !== selectedStatus.value) {
      return false;
    }
    return true;
  });
});

const availableTargetTables = computed(() => {
  if (!sourceTable.value) return [];
  return tables.value.filter((t) => t.id !== sourceTable.value.id);
});

function formatMoney(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatStatus(status) {
  return (status || "").toUpperCase();
}

function statusBadgeClass(status) {
  switch (status) {
    case "available":
      return "bg-success-subtle text-success border border-success-subtle";
    case "occupied":
      return "bg-warning-subtle text-warning border border-warning-subtle";
    case "reserved":
      return "bg-info-subtle text-info border border-info-subtle";
    case "cleaning":
      return "bg-secondary-subtle text-secondary border border-secondary-subtle";
    default:
      return "bg-light text-muted border";
  }
}

function tableCardBorderClass(status) {
  switch (status) {
    case "occupied":
      return "border-warning";
    case "available":
      return "border-success-subtle";
    default:
      return "";
  }
}

async function fetchData() {
  isLoading.value = true;
  try {
    const shiftRes = await shiftsApi.current();
    if (shiftRes.data?.success && shiftRes.data?.shift) {
      branchId.value = shiftRes.data.shift.branch_id;
    }

    const [secRes, tblRes] = await Promise.all([
      tablesApi.sections({ branch_id: branchId.value }),
      tablesApi.list({ branch_id: branchId.value }),
    ]);

    if (secRes.data?.success) {
      sections.value = secRes.data.data || [];
    }
    if (tblRes.data?.success) {
      tables.value = tblRes.data.data || [];
    }
  } catch (err) {
    console.error("Failed to load tables:", err);
  } finally {
    isLoading.value = false;
  }
}

function startOrderForTable(table) {
  cartStore.clearCart();
  cartStore.setTable(table);
  router.push({ path: "/sell", query: { table_id: table.id } });
}

function viewTableTabs(table) {
  router.push({ path: "/sell/tabs", query: { table: table.table_number } });
}

async function updateTableStatus(tableId, status) {
  try {
    await tablesApi.updateStatus(tableId, status);
    await fetchData();
  } catch (err) {
    console.error("Failed to update status:", err);
  }
}

function openTransferModal(table) {
  sourceTable.value = table;
  targetTableId.value = "";
  showTransferModal.value = true;
}

async function submitTransfer() {
  if (!sourceTable.value || !targetTableId.value) return;
  isSubmittingTransfer.value = true;
  try {
    const res = await tablesApi.transfer(sourceTable.value.id, targetTableId.value);
    if (res.data?.success) {
      showTransferModal.value = false;
      await fetchData();
    }
  } catch (err) {
    console.error("Failed to transfer table:", err);
    alert(err.response?.data?.message || "Failed to transfer table.");
  } finally {
    isSubmittingTransfer.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
</style>
