<template>
  <div class="stock-page">
    <!-- Page title and Top Controls -->
    <div class="row">
      <div class="col-12">
        <div class="page-title-box d-flex align-items-center justify-content-between gap-2">
          <div>
            <h4 class="mb-sm-0 font-size-18 pb-1">Stock Transfers</h4>
            <div class="page-title-right">
              <ol class="breadcrumb m-0 flex-nowrap">
                <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
                <li class="breadcrumb-item">Products &amp; stock</li>
                <li class="breadcrumb-item active text-truncate">Transfers</li>
              </ol>
            </div>
          </div>

          <div class="d-flex gap-2 flex-shrink-0 align-items-center">
            <!-- Dispatch Transfer Action Button -->
            <button
              type="button"
              class="btn btn-primary header-btn d-flex align-items-center justify-content-center gap-2 flex-nowrap fw-bold text-white"
              title="Dispatch Inter-Branch Transfer"
              aria-label="Dispatch Transfer"
              @click="openDispatchModal"
            >
              <i class="bx bx-transfer fs-4 d-flex"></i>
              <span class="d-none d-lg-inline">Dispatch Transfer</span>
              <span class="d-none d-sm-inline d-lg-none">Dispatch</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Card (Matching Stock Levels / Catalogue pattern) -->
    <div class="card shadow-sm border">
      <!-- Toolbar -->
      <div class="card-body border-bottom">
        <div class="row">
          <div class="col-12 gap-2 gap-md-3 d-flex align-items-center">
            <!-- Refresh avatar button -->
            <div>
              <button
                type="button"
                class="btn waves-effect btn-lg btn-light position-relative p-0 avatar-sm rounded-circle"
                title="Refresh transfers"
                aria-label="Refresh transfers"
                @click="reload()"
              >
                <span class="avatar-title bg-transparent text-reset">
                  <i class="mdi mdi-refresh fs-4" :class="{ 'spin-anim': loading }"></i>
                </span>
              </button>
            </div>

            <!-- Search input group with submit button -->
            <div class="flex-grow-1">
              <div class="search-box mb-0 me-0">
                <div class="position-relative">
                  <form
                    @submit.prevent="onSearch()"
                    class="input-group bg-light rounded mb04 pb-0 flex-nowrap"
                  >
                    <div class="flex-grow-1">
                      <input
                        style="border-radius: 0px; padding-right: 35px;"
                        type="text"
                        class="form-control bg-light rounded flex-grow-1"
                        placeholder="Search transfers by transfer # or branch name..."
                        spellcheck="false"
                        aria-label="Search transfers"
                        v-model="searchQuery"
                        @input="debouncedSearch"
                      />
                      <i class="bx bx-search-alt search-icon fs-4"></i>
                      <i
                        v-if="searchQuery !== ''"
                        title="Clear search"
                        style="right: 15px; left: unset;"
                        class="mdi mdi-close search-icon cursor-pointer fs-3 waves-effect"
                        @click="clearSearch"
                      ></i>
                    </div>
                    <button
                      type="submit"
                      @click="onSearch()"
                      title="Click to search"
                      class="btn btn-primary px-4 d-md-flex d-none align-items-center fw-bold"
                    >
                      <i class="bx bx-search-alt search-icon fs-4"></i>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <!-- Date range (the shared facebook style date picker) -->
            <div class="position-relative d-flex align-items-center flex-shrink-0 text-nowrap">
              <DateRangePicker v-model:dateFrom="dateFrom" v-model:dateTo="dateTo" />
            </div>

            <!-- Mobile all-in-one filter dropdown (d-lg-none) -->
            <div class="position-relative d-flex d-lg-none">
              <button
                type="button"
                title="Filter transfers"
                class="btn btn-light waves-effect position-relative p-0 avatar-sm rounded-circle"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                aria-expanded="false"
              >
                <span class="avatar-title bg-transparent text-reset">
                  <i class="mdi mdi-filter-variant fs-4"></i>
                </span>
                <span v-if="selectedStatus !== 'all'" class="filter-dot"></span>
              </button>
              <div class="dropdown-menu dropdown-menu-end p-2 filter-menu" style="min-width: 250px;">
                <h6 class="dropdown-header">Transfer Status</h6>
                <a
                  v-for="tab in statusTabs"
                  :key="`m-s-${tab.key}`"
                  href="javascript:void(0);"
                  class="dropdown-item d-flex align-items-center justify-content-between"
                  :class="{ active: selectedStatus === tab.key }"
                  @click="setStatus(tab.key)"
                >
                  <span>
                    <i class="mdi mdi-record me-2" :class="statusDotOf(tab.key)"></i>
                    {{ tab.label }}
                  </span>
                </a>
              </div>
            </div>

            <!-- Desktop Columns toggle (d-lg-flex d-none) -->
            <div class="position-relative d-flex d-lg-flex d-none">
              <button
                title="Edit columns to view on the table"
                class="d-lg-flex d-flex align-items-center fw-bold btn btn-light waves-effect gap-2"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i class="mdi mdi-format-columns fs-4 align-middle"></i>
                <span class="d-md-inline-block d-none">Columns</span>
                <i class="mdi mdi-chevron-down fs-4"></i>
              </button>
              <div class="dropdown-menu dropdown-menu-end p-3" style="min-width: 220px;">
                <div v-for="column in columns" :key="column.key" class="form-check mb-3">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    :id="`col-${column.key}`"
                    v-model="column.visible"
                  />
                  <label class="form-check-label" :for="`col-${column.key}`">
                    {{ column.label }}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Tabs (in card-header with border) -->
      <div class="card-header bg-white border-bottom py-2">
        <div
          class="d-flex flex-row flex-nowrap category-scroll gap-2"
          style="overflow-x: auto; overflow-y: hidden; scrollbar-width: none; -ms-overflow-style: none;"
        >
          <button
            v-for="tab in statusTabs"
            :key="tab.key"
            type="button"
            class="btn btn-sm fw-semibold btn-light btn-rounded waves-effect px-3 py-1 text-nowrap flex-shrink-0 d-inline-flex align-items-center border font-size-12"
            :class="{ 'btn-dark text-light border-dark': selectedStatus === tab.key }"
            @click="setStatus(tab.key)"
          >
            <i v-if="tab.key !== 'all'" class="mdi mdi-record me-1 font-size-10" :class="statusDotOf(tab.key)"></i>
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </div>

      <!-- Active Filters (Left) & Showing Count (Right) Row -->
      <div class="card-body py-2 px-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2 font-size-13 bg-white">
        <!-- Left: Active Filters -->
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <template v-if="chips.length">
            <span class="text-muted small">Active filters:</span>
            <span
              v-for="c in chips"
              :key="c.key"
              class="badge bg-primary-subtle text-primary d-inline-flex align-items-center gap-1 px-2 py-1 font-size-12 fw-medium"
            >
              <span>{{ c.label }}</span>
              <i class="bx bx-x cursor-pointer fs-6" :title="`Remove ${c.label}`" @click="c.clear()"></i>
            </span>
            <a v-if="chips.length > 1" href="javascript:void(0);" class="small text-primary ms-1" @click="clearAll">Clear all</a>
          </template>
        </div>

        <!-- Right: Showing Count -->
        <div class="ms-auto text-muted small text-nowrap">
          <template v-if="!loading">
            Showing <span class="fw-bold text-black">{{ items.length }}</span> of
            <span class="fw-bold text-black">{{ total }}</span> Stock Transfers
          </template>
          <template v-else>
            <div class="d-flex align-items-center gap-2">
              <div style="height: 16px; width: 16px;" class="spinner-border spinner-border-sm text-secondary" role="status">
                <span class="sr-only">Loading...</span>
              </div>
              <span>Loading ...</span>
            </div>
          </template>
        </div>
      </div>

      <!-- Table Area -->
      <div class="card-body p-0" style="min-height: 60vh;">
        <!-- Empty State -->
        <div
          v-if="!loading && items.length === 0"
          class="p-4 d-flex align-items-center justify-content-center h-100 w-100"
        >
          <div class="text-center p-4 w-100 h-100">
            <div class="empty-state-icon mb-0">
              <i style="font-size: 145px;" class="bx bx-transfer text-black opacity-25"></i>
            </div>
            <h4 class="fw-bold text-dark mb-3 text-capitalize">No transfers found</h4>
            <p v-if="hasFilters" class="text-muted">
              No transfers match your search query or selected status.
            </p>
            <p v-else class="text-muted">
              Transfer inventory between your branches for restocking or rebalancing.
            </p>
            <div class="d-flex justify-content-center gap-2 mt-2">
              <button
                v-if="hasFilters"
                type="button"
                class="btn btn-soft-primary"
                @click="clearAll"
              >
                <i class="bx bx-x me-1"></i>Clear all filters
              </button>
              <button
                type="button"
                class="btn btn-primary"
                @click="openDispatchModal"
              >
                <i class="bx bx-plus me-1"></i> Dispatch First Transfer
              </button>
            </div>
          </div>
        </div>

        <!-- Table View: Desktop & Tablets -->
        <div v-else class="table-responsive d-none d-md-block">
          <!-- Main Table -->
          <table class="table verticle-middle table-hover mb-0 doc-table">
            <thead class="table-light text-nowrap">
              <tr>
                <th style="min-width: 140px;">Transfer #</th>
                <th style="min-width: 140px;">Date</th>
                <th v-if="isCol('origin')">Origin Branch</th>
                <th v-if="isCol('dest')">Destination Branch</th>
                <th v-if="isCol('items')" class="text-center">Line Items</th>
                <th v-if="isCol('status')" class="text-center">Status</th>
                <th v-if="isCol('staff')">Dispatched By</th>
                <th style="width: 120px;" class="text-end pe-3">Action</th>
              </tr>
            </thead>

            <!-- Rows -->
            <tbody v-if="!(loading && page === 1)">
              <tr v-for="t in items" :key="t.id">
                <!-- Transfer # -->
                <td>
                  <span class="badge bg-light text-dark border font-monospace fs-12">
                    <i class="bx bx-transfer text-primary me-1"></i>TRF-{{ t.id }}
                  </span>
                </td>

                <!-- Date -->
                <td class="text-nowrap fs-12 text-muted">
                  {{ formatDate(t.created_at) }}
                </td>

                <!-- Origin Branch -->
                <td v-if="isCol('origin')">
                  <span class="fw-semibold text-dark fs-13">
                    {{ t.source_branch?.name || '—' }}
                  </span>
                </td>

                <!-- Destination Branch -->
                <td v-if="isCol('dest')">
                  <span class="fw-semibold text-dark fs-13">
                    {{ t.destination_branch?.name || '—' }}
                  </span>
                </td>

                <!-- Line Items Count -->
                <td v-if="isCol('items')" class="text-center">
                  <span class="badge bg-light text-dark border fs-12">
                    {{ t.items_count || (t.items ? t.items.length : 0) }} item(s)
                  </span>
                </td>

                <!-- Status Badge (With Dot) -->
                <td v-if="isCol('status')" class="text-center text-nowrap">
                  <span
                    class="badge font-size-12 px-2 py-1 fw-medium"
                    :class="statusBadgeClass(t.status)"
                  >
                    <i class="mdi mdi-record me-1 font-size-11" :class="statusDotOf(t.status)"></i>
                    {{ statusLabel(t.status) }}
                  </span>
                </td>

                <!-- Dispatched By -->
                <td v-if="isCol('staff')" class="fs-12 text-muted">
                  {{ t.dispatched_by?.name || t.user?.name || 'System' }}
                </td>

                <!-- Action Button -->
                <td class="text-end pe-3" @click.stop>
                  <button
                    v-if="t.status === 'in_transit' || t.status === 'pending'"
                    type="button"
                    class="btn btn-white btn-sm waves-effect"
                    title="Confirm intake and verify items"
                    @click="openReceiveModal(t)"
                  >
                    <i class="bx bx-check-circle text-success align-middle me-1"></i>
                    <span>Receive</span>
                  </button>
                  <span v-else class="text-muted fs-12">Completed</span>
                </td>
              </tr>
            </tbody>

            <!-- Skeleton Rows -->
            <tbody v-if="loading && page === 1">
              <tr v-for="i in 6" :key="`sk-${i}`">
                <td><SkeletonLoader type="text" :lines="1" height="10px" width="90px" /></td>
                <td><SkeletonLoader type="text" :lines="1" height="10px" width="100px" /></td>
                <td v-if="isCol('origin')"><SkeletonLoader type="text" :lines="1" height="10px" width="110px" /></td>
                <td v-if="isCol('dest')"><SkeletonLoader type="text" :lines="1" height="10px" width="110px" /></td>
                <td v-if="isCol('items')"><SkeletonLoader type="text" :lines="1" height="10px" width="60px" class="mx-auto" /></td>
                <td v-if="isCol('status')"><SkeletonLoader type="text" :lines="1" height="10px" width="70px" class="mx-auto" /></td>
                <td v-if="isCol('staff')"><SkeletonLoader type="text" :lines="1" height="10px" width="70px" /></td>
                <td><SkeletonLoader type="text" :lines="1" height="10px" width="60px" class="ms-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards View: Phones (d-md-none) -->
        <div v-if="loading || items.length" class="d-md-none">
          <!-- Skeleton cards -->
          <template v-if="loading && page === 1">
            <div v-for="i in 6" :key="`sk-card-${i}`" class="px-3 py-3 border-bottom d-flex gap-3">
              <SkeletonLoader width="48px" height="48px" />
              <div class="d-flex flex-column gap-2 flex-grow-1">
                <SkeletonLoader type="text" :lines="1" height="10px" width="160px" />
                <SkeletonLoader type="text" :lines="1" height="10px" width="110px" />
                <SkeletonLoader type="text" :lines="1" height="10px" width="130px" />
              </div>
            </div>
          </template>

          <!-- Real Mobile Cards -->
          <template v-else>
            <div
              v-for="t in items"
              :key="`card-${t.id}`"
              class="product-card px-3 py-3 border-bottom"
            >
              <div class="d-flex gap-3 align-items-start">
                <div class="avatar-sm product-thumb card-thumb d-flex align-items-center justify-content-center text-muted flex-shrink-0">
                  <i class="bx fs-4 bx-transfer"></i>
                </div>

                <div class="flex-grow-1 min-w-0">
                  <div class="d-flex align-items-center justify-content-between">
                    <span class="fw-bold text-black font-monospace">TRF-{{ t.id }}</span>
                    <span
                      class="badge font-size-11 px-2 py-1 fw-medium"
                      :class="statusBadgeClass(t.status)"
                    >
                      <i class="mdi mdi-record me-1 font-size-10" :class="statusDotOf(t.status)"></i>
                      {{ statusLabel(t.status) }}
                    </span>
                  </div>

                  <small class="text-muted d-block mt-1">
                    {{ t.source_branch?.name }} <i class="bx bx-right-arrow-alt align-middle"></i> {{ t.destination_branch?.name }}
                  </small>

                  <div class="d-flex align-items-center justify-content-between mt-2 small">
                    <span class="text-muted">
                      {{ formatDate(t.created_at) }} · {{ t.items_count || (t.items ? t.items.length : 0) }} item(s)
                    </span>
                    <button
                      v-if="t.status === 'in_transit' || t.status === 'pending'"
                      type="button"
                      class="btn btn-white btn-sm waves-effect"
                      @click="openReceiveModal(t)"
                    >
                      Receive
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer / Load More (Catalogue pattern) -->
        <div class="w-100 d-flex align-items-center justify-content-center text-center p-3">
          <div v-if="!hasMore && items.length > 0" class="w-100 text-center">
            <p class="text-muted mb-0 small">
              <i class="bx bx-check-circle text-success me-1"></i>
              Showing all {{ total }} transfers
            </p>
          </div>
          <div v-if="hasMore" class="flex-grow-1 align-items-center justify-content-center text-center">
            <button
              class="btn btn-primary"
              :disabled="loading"
              @click="loadMore()"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
              Load more
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dispatch & Receive Modals -->
    <StockTransferDispatchModal
      ref="dispatchModal"
      :branches="branches"
      @dispatched="onTransferDispatched"
    />
    <StockTransferReceiveModal
      ref="receiveModal"
      @received="onTransferReceived"
    />

    <!-- Image Toast -->
    <ImageToast
      :status="toastStatus"
      :title="toastTitle"
      :message="toastMessage"
      :image="toastImage"
      :imageHeight="70"
      @hide="toastStatus = null"
    />
  </div>
</template>

<script setup>
/**
 * StockTransfers.List — Inter-branch inventory dispatch and transit tracking.
 * Modelled directly on Stock.List.vue and Catalogue doc-table pattern.
 *
 * API: GET /tenant/stock/transfers (status, search, page, per_page)
 * Roles: owner, manager
 */
import { ref, computed, watch, onMounted } from "vue";
import StockAPI from "@/api/stock";
import BranchesAPI from "@/api/branches";
import StockTransferDispatchModal from "./components/StockTransferDispatch.modal.vue";
import StockTransferReceiveModal from "./components/StockTransferReceive.modal.vue";
import SkeletonLoader from "@/components/Loaders/SkeletonLoader.vue";
import ImageToast from "@/components/ImageToast.vue";
import DateRangePicker from "@/components/DatePickers/datePicker.facebookstyle.vue";
import { subDays, format } from "date-fns";
import successImage from "@/assets/images/icons/check.png";
import errorImage from "@/assets/images/icons/error.png";

// Branch State
const branches = ref([]);

// Data State
const items = ref([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);
const perPage = ref(25);
const lastPage = ref(1);
const hasMore = computed(() => page.value < lastPage.value);

// Filters
const searchQuery = ref("");
const selectedStatus = ref("all");
let searchTimeout = null;

// Dates (the last 30 days by default, as on Activity Log)
const dateFrom = ref(subDays(new Date(), 29));
const dateTo = ref(new Date());

// The picker sets from and to one after the other; one reload covers both
let dateTimer = null;
watch([dateFrom, dateTo], () => {
  clearTimeout(dateTimer);
  dateTimer = setTimeout(reload, 50);
});

// Modals
const dispatchModal = ref(null);
const receiveModal = ref(null);

// Columns State
const columns = ref([
  { key: "origin", label: "Origin Branch", visible: true },
  { key: "dest", label: "Destination Branch", visible: true },
  { key: "items", label: "Line Items", visible: true },
  { key: "status", label: "Status", visible: true },
  { key: "staff", label: "Dispatched By", visible: true },
]);

function isCol(key) {
  return columns.value.find((c) => c.key === key)?.visible ?? true;
}

// Toast
const toastStatus = ref(null);
const toastTitle = ref("");
const toastMessage = ref("");
const toastImage = ref(null);

const statusTabs = [
  { key: "all", label: "All Transfers" },
  { key: "in_transit", label: "In Transit" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const hasFilters = computed(() => !!(searchQuery.value.trim() || selectedStatus.value !== "all"));

const chips = computed(() => {
  const out = [];
  if (selectedStatus.value && selectedStatus.value !== "all") {
    const tab = statusTabs.find((t) => t.key === selectedStatus.value);
    out.push({
      key: "status",
      label: tab ? tab.label : selectedStatus.value,
      clear: () => setStatus("all"),
    });
  }
  if (dateFrom.value && dateTo.value) {
    out.push({
      key: "date",
      label: `${format(dateFrom.value, "MMM d")} – ${format(dateTo.value, "MMM d, yyyy")}`,
      clear: () => {
        dateFrom.value = subDays(new Date(), 29);
        dateTo.value = new Date();
      },
    });
  }
  if (searchQuery.value.trim()) {
    out.push({
      key: "q",
      label: `"${searchQuery.value.trim()}"`,
      clear: () => {
        searchQuery.value = "";
        reload();
      },
    });
  }
  return out;
});

function clearAll() {
  selectedStatus.value = "all";
  searchQuery.value = "";
  dateFrom.value = subDays(new Date(), 29);
  dateTo.value = new Date();
  reload();
}

async function loadBranches() {
  try {
    const { data } = await BranchesAPI.list();
    branches.value = data.data || [];
  } catch (err) {
    branches.value = [];
  }
}

async function loadTransfers(append = false) {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      status: selectedStatus.value !== "all" ? selectedStatus.value : undefined,
    };
    if (dateFrom.value) {
      params.date_from = format(dateFrom.value, "yyyy-MM-dd");
    }
    if (dateTo.value) {
      params.date_to = format(dateTo.value, "yyyy-MM-dd") + " 23:59:59";
    }
    if (searchQuery.value?.trim()) {
      params.search = searchQuery.value.trim();
    }

    const { data } = await StockAPI.transfers(params);
    const fetched = data.data || [];
    if (append) {
      items.value = [...items.value, ...fetched];
    } else {
      items.value = fetched;
    }
    total.value = data.meta?.total || items.value.length;
    lastPage.value = data.meta?.last_page || 1;
  } catch (err) {
    if (!append) items.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function reload() {
  page.value = 1;
  loadTransfers(false);
}

function loadMore() {
  if (hasMore.value && !loading.value) {
    page.value += 1;
    loadTransfers(true);
  }
}

function setStatus(statusKey) {
  selectedStatus.value = statusKey;
  page.value = 1;
  loadTransfers(false);
}

function onSearch() {
  page.value = 1;
  loadTransfers(false);
}

function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
    loadTransfers(false);
  }, 350);
}

function clearSearch() {
  searchQuery.value = "";
  page.value = 1;
  loadTransfers(false);
}

function openDispatchModal() {
  dispatchModal.value?.open();
}

function openReceiveModal(transfer) {
  receiveModal.value?.open(transfer);
}

function onTransferDispatched({ message }) {
  showSuccessToast("Transfer Dispatched", message || "Stock transfer successfully dispatched.");
  reload();
}

function onTransferReceived({ message }) {
  showSuccessToast("Transfer Completed", message || "Stock transfer successfully received.");
  reload();
}

function showSuccessToast(title, message) {
  toastStatus.value = "success";
  toastTitle.value = title;
  toastMessage.value = message;
  toastImage.value = successImage;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    timeZone: "Africa/Nairobi",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusDotOf(status) {
  switch (status) {
    case "in_transit":
      return "text-warning";
    case "received":
    case "completed":
      return "text-success";
    case "cancelled":
      return "text-danger";
    case "pending":
    default:
      return "text-info";
  }
}

function statusBadgeClass(status) {
  switch (status) {
    case "in_transit":
      return "bg-warning-subtle text-warning";
    case "received":
    case "completed":
      return "bg-success-subtle text-success";
    case "cancelled":
      return "bg-danger-subtle text-danger";
    case "pending":
    default:
      return "bg-info-subtle text-info";
  }
}

function statusLabel(status) {
  switch (status) {
    case "in_transit":
      return "In Transit";
    case "received":
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "pending":
      return "Pending";
    default:
      return status;
  }
}

onMounted(async () => {
  await loadBranches();
  loadTransfers(false);
});
</script>

<style scoped>
th.sortable {
  cursor: pointer;
  user-select: none;
}
th.sortable:hover {
  opacity: 0.75;
}

.product-thumb {
  object-fit: contain;
  border-radius: 8px;
  background: #fff;
  border: 1px solid var(--bs-border-color);
}

.min-w-0 {
  min-width: 0;
}

.truncate-singleLine {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-card {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.product-card:active {
  background-color: var(--bs-light);
}

.card-thumb {
  width: 48px;
  height: 48px;
}

@media (max-width: 575.98px) {
  .header-btn {
    width: 42px;
    height: 42px;
    padding: 0;
    border-radius: 50%;
  }
}

.filter-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bs-primary);
}

.filter-menu {
  max-height: 70vh;
  overflow-y: auto;
}

.btn-rounded {
  border-radius: 30px;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.spin-anim {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
