<template>
  <div class="stock-page">
    <!-- Page title and Top Controls -->
    <div class="row">
      <div class="col-12">
        <div class="page-title-box d-flex align-items-center justify-content-between gap-2">
          <div>
            <h4 class="mb-sm-0 font-size-18 pb-1">Stock Counts &amp; Adjustments</h4>
            <div class="page-title-right">
              <ol class="breadcrumb m-0 flex-nowrap">
                <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
                <li class="breadcrumb-item">Products &amp; stock</li>
                <li class="breadcrumb-item active text-truncate">Counts &amp; Adjustments</li>
              </ol>
            </div>
          </div>

          <div class="d-flex gap-2 flex-shrink-0 align-items-center">
            <!-- Branch Selector -->
            <div v-if="branches.length > 1" class="dropdown">
              <button
                type="button"
                class="btn btn-white d-flex align-items-center gap-2 waves-effect"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i class="bx bx-store-alt fs-5 text-primary"></i>
                <span class="fw-semibold d-none d-sm-inline">{{ activeBranch?.name || 'All Branches' }}</span>
                <i class="mdi mdi-chevron-down fs-5 text-muted"></i>
              </button>
              <div class="dropdown-menu dropdown-menu-end shadow-sm">
                <button
                  type="button"
                  class="dropdown-item d-flex align-items-center justify-content-between gap-3"
                  :class="{ active: selectedBranchId === null }"
                  @click="changeBranch(null)"
                >
                  <span>All Branches</span>
                  <i v-if="selectedBranchId === null" class="bx bx-check fs-5 text-primary"></i>
                </button>
                <button
                  v-for="b in branches"
                  :key="b.id"
                  type="button"
                  class="dropdown-item d-flex align-items-center justify-content-between gap-3"
                  :class="{ active: selectedBranchId === b.id }"
                  @click="changeBranch(b.id)"
                >
                  <span>{{ b.name }} <small v-if="b.is_main" class="text-muted">(Main)</small></span>
                  <i v-if="selectedBranchId === b.id" class="bx bx-check fs-5 text-primary"></i>
                </button>
              </div>
            </div>

            <!-- Export CSV Button -->
            <button
              type="button"
              class="btn btn-white header-btn d-flex align-items-center justify-content-center gap-2 flex-nowrap waves-effect"
              :disabled="loading || items.length === 0"
              @click="exportCsv"
              title="Download adjustments as CSV"
            >
              <i class="bx bx-export fs-4 d-flex"></i>
              <span class="d-none d-sm-inline">Export</span>
            </button>

            <!-- Single Product Adjust Button -->
            <button
              type="button"
              class="btn btn-white header-btn d-flex align-items-center justify-content-center gap-2 flex-nowrap waves-effect"
              title="Single Product Adjustment (Waste, damage, quick count)"
              aria-label="Single Product Adjustment"
              @click="openAdjustModal"
            >
              <i class="bx bx-slider-alt fs-4 d-flex text-primary"></i>
              <span class="d-none d-lg-inline">Single Adjust</span>
              <span class="d-none d-sm-inline d-lg-none">Adjust</span>
            </button>

            <!-- Stock Count (Multi-Product Audit) Action Button -->
            <button
              type="button"
              class="btn btn-primary header-btn d-flex align-items-center justify-content-center gap-2 flex-nowrap fw-bold text-white shadow-sm"
              title="Stock Count (Shelf stocktake across multiple goods)"
              aria-label="Stock Count"
              @click="openStockCountModal"
            >
              <i class="bx bx-list-check fs-4 d-flex"></i>
              <span class="d-none d-lg-inline">Stock Count</span>
              <span class="d-none d-sm-inline d-lg-none">Count</span>
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
                title="Refresh adjustments"
                aria-label="Refresh adjustments"
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
                        placeholder="Search adjustments by product name, barcode, or reason notes..."
                        spellcheck="false"
                        aria-label="Search adjustments"
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
                title="Filter adjustments"
                class="btn btn-light waves-effect position-relative p-0 avatar-sm rounded-circle"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                aria-expanded="false"
              >
                <span class="avatar-title bg-transparent text-reset">
                  <i class="mdi mdi-filter-variant fs-4"></i>
                </span>
                <span v-if="selectedType !== 'all'" class="filter-dot"></span>
              </button>
              <div class="dropdown-menu dropdown-menu-end p-2 filter-menu" style="min-width: 250px;">
                <h6 class="dropdown-header">Adjustment Type</h6>
                <a
                  v-for="tab in typeTabs"
                  :key="`m-t-${tab.key}`"
                  href="javascript:void(0);"
                  class="dropdown-item d-flex align-items-center justify-content-between"
                  :class="{ active: selectedType === tab.key }"
                  @click="setType(tab.key)"
                >
                  <span>
                    <i class="mdi mdi-record me-2" :class="adjustmentDotOf(tab.key)"></i>
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

        <!-- Active Filter Chips Bar -->
      </div>

      <!-- Adjustment Type Tabs (in card-header with border) -->
      <div class="card-header bg-white border-bottom py-2">
        <div
          class="d-flex flex-row flex-nowrap category-scroll gap-2"
          style="overflow-x: auto; overflow-y: hidden; scrollbar-width: none; -ms-overflow-style: none;"
        >
          <button
            v-for="tab in typeTabs"
            :key="tab.key"
            type="button"
            class="btn btn-sm fw-semibold btn-light btn-rounded waves-effect px-3 py-1 text-nowrap flex-shrink-0 d-inline-flex align-items-center border font-size-12"
            :class="{ 'btn-dark text-light border-dark': selectedType === tab.key }"
            @click="setType(tab.key)"
          >
            <i v-if="tab.key !== 'all'" class="mdi mdi-record me-1 font-size-10" :class="adjustmentDotOf(tab.key)"></i>
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
            <span class="fw-bold text-black">{{ total }}</span> Stock Adjustments
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
              <i style="font-size: 145px;" class="bx bx-slider-alt text-black opacity-25"></i>
            </div>
            <h4 class="fw-bold text-dark mb-3 text-capitalize">No adjustments found</h4>
            <p v-if="hasFilters" class="text-muted">
              No adjustment records match your search criteria or selected type.
            </p>
            <p v-else class="text-muted">
              Physical counts, spoilage write-offs, and staff drinks will be tracked here.
            </p>
            <div class="d-flex justify-content-center flex-wrap gap-2 mt-2">
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
                @click="openStockCountModal"
              >
                <i class="bx bx-list-check me-1"></i> Start Stock Count
              </button>
              <button
                type="button"
                class="btn btn-light border"
                @click="openAdjustModal"
              >
                <i class="bx bx-slider-alt me-1"></i> Record Single Adjustment
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
                <th style="min-width: 140px;">Date &amp; Time</th>
                <th style="min-width: 240px;">Product</th>
                <th v-if="isCol('barcode')">Barcode</th>
                <th v-if="isCol('type')">Adjustment Type</th>
                <th v-if="isCol('delta')" class="text-end">Variance (Delta)</th>
                <th v-if="isCol('balance')" class="text-end">Balance After</th>
                <th v-if="isCol('notes')" style="min-width: 180px;">Reason &amp; Notes</th>
                <th v-if="isCol('branch')">Branch</th>
                <th v-if="isCol('staff')">Staff</th>
                <th style="width: 70px;" class="text-end pe-3">Action</th>
              </tr>
            </thead>

            <!-- Rows -->
            <tbody v-if="!(loading && page === 1)">
              <tr v-for="m in items" :key="m.id">
                <!-- Date -->
                <td class="text-nowrap fs-12 text-muted">
                  {{ formatDate(m.created_at) }}
                </td>

                <!-- Product Column (Avatar Tile + Truncated Name) -->
                <td>
                  <div class="d-flex gap-2 align-items-center" :title="m.product?.name">
                    <div class="avatar-xs d-flex flex-shrink-0">
                      <img
                        v-if="m.product?.image_url"
                        :src="m.product.image_url"
                        :alt="m.product?.name"
                        class="avatar-xs product-thumb"
                        loading="lazy"
                        @error="m.product.image_url = null"
                      />
                      <div v-else class="avatar-xs product-thumb d-flex align-items-center justify-content-center text-muted">
                        <i class="bx fs-5 bx-package"></i>
                      </div>
                    </div>
                    <div class="min-w-0">
                      <span class="d-block fw-bold truncate-singleLine" style="max-width: 240px;">
                        {{ m.product?.name || 'Unknown Item' }}
                      </span>
                      <span style="font-size: 12px;" class="text-muted text-nowrap">
                        {{ [m.product?.brand, m.product?.category].filter(Boolean).join(' · ') || 'General' }}
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Barcode: Monospace chip with copy on click -->
                <td v-if="isCol('barcode')" class="text-nowrap">
                  <button
                    v-if="m.product?.barcode"
                    type="button"
                    class="barcode-chip waves-effect"
                    title="Click to copy barcode"
                    @click.stop="copyText(m.product.barcode, `Barcode ${m.product.barcode}`)"
                  >
                    {{ m.product.barcode }}
                  </button>
                  <span v-else class="text-muted">No barcode</span>
                </td>

                <!-- Reason Badge (With Dot) -->
                <td v-if="isCol('type')" class="text-nowrap">
                  <span
                    class="badge font-size-12 px-2 py-1 fw-medium"
                    :class="adjustmentBadgeClass(m.movement_type)"
                  >
                    <i class="mdi mdi-record me-1 font-size-11" :class="adjustmentDotOf(m.movement_type)"></i>
                    {{ m.movement_label || m.movement_type }}
                  </span>
                </td>

                <!-- Variance (Delta) -->
                <td v-if="isCol('delta')" class="text-end font-monospace fw-bold fs-13">
                  <span :class="deltaClass(m.quantity_delta)">
                    {{ m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta }}
                  </span>
                </td>

                <!-- Balance After -->
                <td v-if="isCol('balance')" class="text-end font-monospace text-dark fw-bold fs-13">
                  {{ m.balance_after }}
                </td>

                <!-- Reason & Notes -->
                <td v-if="isCol('notes')">
                  <div v-if="m.notes" class="fs-12 text-muted text-truncate" style="max-width: 250px;" :title="m.notes">
                    {{ m.notes }}
                  </div>
                  <span v-else class="text-muted fs-12">—</span>
                </td>

                <!-- Branch -->
                <td v-if="isCol('branch')">
                  <span class="badge bg-light text-dark border fs-11">
                    {{ m.branch?.name || '—' }}
                  </span>
                </td>

                <!-- Staff -->
                <td v-if="isCol('staff')" class="fs-12 text-muted">
                  {{ m.user?.name || 'System' }}
                </td>

                <!-- Action: Adjust Again -->
                <td class="text-end pe-3" @click.stop>
                  <button
                    type="button"
                    class="btn btn-white btn-sm waves-effect"
                    title="Adjust this item again"
                    @click="adjustProductAgain(m)"
                  >
                    <i class="bx bx-slider-alt font-size-13 align-middle me-1"></i>
                    <span>Adjust</span>
                  </button>
                </td>
              </tr>
            </tbody>

            <!-- Skeleton Rows -->
            <tbody v-if="loading && page === 1">
              <tr v-for="i in 6" :key="`sk-${i}`">
                <td><SkeletonLoader type="text" :lines="1" height="10px" width="100px" /></td>
                <td>
                  <div class="d-flex align-items-center">
                    <SkeletonLoader width="36px" height="36px" />
                    <div class="d-flex flex-column gap-1 ms-2">
                      <SkeletonLoader type="text" :lines="1" height="10px" width="140px" class="mx-2" />
                      <SkeletonLoader type="text" :lines="1" height="10px" width="80px" class="mx-2" />
                    </div>
                  </div>
                </td>
                <td v-if="isCol('barcode')"><SkeletonLoader type="text" :lines="1" height="10px" width="90px" /></td>
                <td v-if="isCol('type')"><SkeletonLoader type="text" :lines="1" height="10px" width="90px" /></td>
                <td v-if="isCol('delta')"><SkeletonLoader type="text" :lines="1" height="10px" width="50px" class="ms-auto" /></td>
                <td v-if="isCol('balance')"><SkeletonLoader type="text" :lines="1" height="10px" width="50px" class="ms-auto" /></td>
                <td v-if="isCol('notes')"><SkeletonLoader type="text" :lines="1" height="10px" width="120px" /></td>
                <td v-if="isCol('branch')"><SkeletonLoader type="text" :lines="1" height="10px" width="70px" /></td>
                <td v-if="isCol('staff')"><SkeletonLoader type="text" :lines="1" height="10px" width="70px" /></td>
                <td><SkeletonLoader type="text" :lines="1" height="10px" width="50px" class="ms-auto" /></td>
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
              v-for="m in items"
              :key="`card-${m.id}`"
              class="product-card px-3 py-3 border-bottom"
              @click="adjustProductAgain(m)"
            >
              <div class="d-flex gap-3 align-items-start">
                <div class="avatar-sm product-thumb card-thumb d-flex align-items-center justify-content-center text-muted flex-shrink-0">
                  <i class="bx fs-4 bx-slider-alt"></i>
                </div>

                <div class="flex-grow-1 min-w-0">
                  <span class="fw-bold text-black d-block text-truncate">{{ m.product?.name || 'Unknown Item' }}</span>
                  <small class="text-muted d-block text-truncate">
                    {{ formatDate(m.created_at) }} · {{ m.branch?.name }}
                  </small>

                  <div class="d-flex flex-wrap align-items-center gap-2 mt-2 small">
                    <button
                      v-if="m.product?.barcode"
                      type="button"
                      class="barcode-chip waves-effect"
                      @click.stop="copyText(m.product.barcode, `Barcode ${m.product.barcode}`)"
                    >
                      {{ m.product.barcode }}
                    </button>
                    <span class="font-monospace fw-bold" :class="deltaClass(m.quantity_delta)">
                      {{ m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta }}
                    </span>
                    <span class="text-muted ms-1 font-size-11">
                      (Bal: {{ m.balance_after }})
                    </span>
                    <span
                      class="badge font-size-11 px-2 py-1 fw-medium ms-auto"
                      :class="adjustmentBadgeClass(m.movement_type)"
                    >
                      <i class="mdi mdi-record me-1 font-size-10" :class="adjustmentDotOf(m.movement_type)"></i>
                      {{ m.movement_label || m.movement_type }}
                    </span>
                  </div>

                  <div v-if="m.notes" class="mt-1 small text-muted text-truncate">
                    <span>{{ m.notes }}</span>
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
              Showing all {{ total }} adjustments
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

    <!-- Single Product Adjust Modal -->
    <StockAdjustModal
      ref="adjustModal"
      :branch-id="selectedBranchId"
      :branch-name="activeBranch?.name"
      @saved="onAdjustmentSaved"
      @error="showErrorToast"
    />

    <!-- Multi-Product Stock Count Workstation Modal -->
    <StockCountModal
      ref="countModal"
      :branch-id="selectedBranchId"
      :branch-name="activeBranch?.name"
      @saved="onAdjustmentSaved"
      @error="showErrorToast"
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
 * StockAdjustments.List — Physical count reconciliation, waste/spoilage, and staff drinks.
 * Modelled directly on Stock.List.vue and Catalogue doc-table pattern.
 *
 * API: GET /tenant/stock/movements?movement_type=audit_count,waste_spoilage,staff_consumption
 * Roles: owner, manager
 */
import { ref, computed, watch, onMounted } from "vue";
import StockAPI from "@/api/stock";
import BranchesAPI from "@/api/branches";
import StockAdjustModal from "./components/StockAdjust.modal.vue";
import StockCountModal from "./components/StockCount.modal.vue";
import SkeletonLoader from "@/components/Loaders/SkeletonLoader.vue";
import ImageToast from "@/components/ImageToast.vue";
import DateRangePicker from "@/components/DatePickers/datePicker.facebookstyle.vue";
import { subDays, format } from "date-fns";
import successImage from "@/assets/images/icons/check.png";
import errorImage from "@/assets/images/icons/error.png";

// Branch State
const branches = ref([]);
const selectedBranchId = ref(null);
const activeBranch = computed(() => {
  return branches.value.find((b) => b.id === selectedBranchId.value) || null;
});

// Data State
const items = ref([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);
const perPage = ref(30);
const lastPage = ref(1);
const hasMore = computed(() => page.value < lastPage.value);

// Filters
const searchQuery = ref("");
const selectedType = ref("all");
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
const adjustModal = ref(null);
const countModal = ref(null);

// Columns State
const columns = ref([
  { key: "barcode", label: "Barcode", visible: true },
  { key: "type", label: "Adjustment Type", visible: true },
  { key: "delta", label: "Variance (Delta)", visible: true },
  { key: "balance", label: "Balance After", visible: true },
  { key: "notes", label: "Reason & Notes", visible: true },
  { key: "branch", label: "Branch", visible: true },
  { key: "staff", label: "Staff", visible: true },
]);

function isCol(key) {
  return columns.value.find((c) => c.key === key)?.visible ?? true;
}

// Toast
const toastStatus = ref(null);
const toastTitle = ref("");
const toastMessage = ref("");
const toastImage = ref(null);

const typeTabs = [
  { key: "all", label: "All Adjustments" },
  { key: "audit_count", label: "Physical Audit Counts" },
  { key: "waste_spoilage", label: "Waste & Spoilage" },
  { key: "staff_consumption", label: "Staff Drinks" },
];

const hasFilters = computed(() => !!(searchQuery.value.trim() || selectedType.value !== "all"));

function safeFormatDate(d, fmt) {
  if (!d) return "";
  try {
    const parsed = d instanceof Date ? d : new Date(d);
    if (isNaN(parsed.getTime())) return "";
    return format(parsed, fmt);
  } catch (e) {
    return "";
  }
}

const chips = computed(() => {
  const out = [];
  if (selectedType.value && selectedType.value !== "all") {
    const tab = typeTabs.find((t) => t.key === selectedType.value);
    out.push({
      key: "type",
      label: tab ? tab.label : selectedType.value,
      clear: () => setType("all"),
    });
  }
  if (dateFrom.value && dateTo.value) {
    const fromStr = safeFormatDate(dateFrom.value, "MMM d");
    const toStr = safeFormatDate(dateTo.value, "MMM d, yyyy");
    if (fromStr && toStr) {
      out.push({
        key: "date",
        label: `${fromStr} – ${toStr}`,
        clear: () => {
          dateFrom.value = subDays(new Date(), 29);
          dateTo.value = new Date();
        },
      });
    }
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
  selectedType.value = "all";
  searchQuery.value = "";
  dateFrom.value = subDays(new Date(), 29);
  dateTo.value = new Date();
  reload();
}

async function loadBranches() {
  try {
    const { data } = await BranchesAPI.list();
    branches.value = data.data || [];
    if (branches.value.length > 0 && selectedBranchId.value === null) {
      selectedBranchId.value = branches.value[0].id;
    }
  } catch (err) {
    branches.value = [];
  }
}

async function loadAdjustments(append = false) {
  loading.value = true;
  try {
    let movementTypeParam = undefined;
    if (selectedType.value === "all") {
      movementTypeParam = "audit_count,waste_spoilage,staff_consumption";
    } else {
      movementTypeParam = selectedType.value;
    }

    const params = {
      page: page.value,
      per_page: perPage.value,
      branch_id: selectedBranchId.value || undefined,
      movement_type: movementTypeParam,
    };
    if (searchQuery.value?.trim()) {
      params.search = searchQuery.value.trim();
    }
    if (dateFrom.value) {
      const fromFormatted = safeFormatDate(dateFrom.value, "yyyy-MM-dd");
      if (fromFormatted) params.date_from = fromFormatted;
    }
    if (dateTo.value) {
      const toFormatted = safeFormatDate(dateTo.value, "yyyy-MM-dd");
      if (toFormatted) params.date_to = toFormatted + " 23:59:59";
    }

    const { data } = await StockAPI.movements(params);
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
  loadAdjustments(false);
}

function loadMore() {
  if (hasMore.value && !loading.value) {
    page.value += 1;
    loadAdjustments(true);
  }
}

function changeBranch(id) {
  selectedBranchId.value = id;
  page.value = 1;
  loadAdjustments(false);
}

function setType(typeKey) {
  selectedType.value = typeKey;
  page.value = 1;
  loadAdjustments(false);
}

function onSearch() {
  page.value = 1;
  loadAdjustments(false);
}

function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
    loadAdjustments(false);
  }, 350);
}

function clearSearch() {
  searchQuery.value = "";
  page.value = 1;
  loadAdjustments(false);
}

function openAdjustModal() {
  adjustModal.value?.open(null);
}

function openStockCountModal() {
  countModal.value?.open(null);
}

function adjustProductAgain(movement) {
  if (movement.product) {
    adjustModal.value?.open({
      product: movement.product,
      stock_quantity: movement.balance_after,
    });
  } else {
    adjustModal.value?.open(null);
  }
}

function onAdjustmentSaved({ message }) {
  showSuccessToast("Stock Adjusted", message || "Stock adjustment successfully recorded.");
  reload();
}

function copyText(text, label) {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(text);
  showSuccessToast("Copied to clipboard", `${label} copied.`);
}

function showSuccessToast(title, message) {
  toastStatus.value = "success";
  toastTitle.value = title;
  toastMessage.value = message;
  toastImage.value = successImage;
}

function formatDate(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleString("en-GB", {
    timeZone: "Africa/Nairobi",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function adjustmentDotOf(type) {
  switch (type) {
    case "audit_count":
      return "text-info";
    case "waste_spoilage":
      return "text-danger";
    case "staff_consumption":
      return "text-warning";
    default:
      return "text-muted";
  }
}

function adjustmentBadgeClass(type) {
  switch (type) {
    case "audit_count":
      return "bg-info-subtle text-info";
    case "waste_spoilage":
      return "bg-danger-subtle text-danger";
    case "staff_consumption":
      return "bg-warning-subtle text-warning";
    default:
      return "bg-light text-muted";
  }
}

function deltaClass(delta) {
  if (delta > 0) return "text-success";
  if (delta < 0) return "text-danger";
  return "text-muted";
}

function exportCsv() {
  if (!items.value.length) return;
  const headers = ["Date", "Product", "Barcode", "Branch", "Adjustment Type", "Variance", "Balance After", "Notes", "Staff"];
  const rows = items.value.map((m) => [
    m.created_at || "",
    `"${(m.product?.name || '').replace(/"/g, '""')}"`,
    m.product?.barcode || "",
    m.branch?.name || "",
    m.movement_type || "",
    m.quantity_delta,
    m.balance_after,
    `"${(m.notes || '').replace(/"/g, '""')}"`,
    m.user?.name || "",
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `stock_adjustments_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

onMounted(async () => {
  await loadBranches();
  loadAdjustments(false);
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

.barcode-chip {
  font-family: var(--bs-font-monospace);
  font-size: 12px;
  line-height: 1;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid var(--bs-border-color);
  background: var(--bs-light);
  color: var(--bs-body-color);
  cursor: pointer;
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
