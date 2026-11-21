<template>
  <div>
    <!-- Page Title & Breadcrumb -->
    <div class="row">
      <div class="col-12">
        <div class="page-title-box d-flex align-items-center justify-content-between gap-2">
          <div>
            <h4 class="mb-sm-0 font-size-18 pb-2">Suppliers</h4>
            <div class="page-title-right">
              <ol class="breadcrumb m-0">
                <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
                <li class="breadcrumb-item">Products &amp; stock</li>
                <li class="breadcrumb-item active">Suppliers</li>
              </ol>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-primary d-flex align-items-center justify-content-center gap-2 flex-nowrap text-white"
            @click="openAddSupplier"
          >
            <Icon icon="ri:user-add-line" class="fs-5" />
            <span class="d-none d-sm-inline">Add Supplier</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Top KPI Metric Cards -->
    <div class="row mb-3">
      <div class="col-12 col-sm-6 col-xl-4 mb-2 mb-xl-0">
        <div class="card h-100 mb-0 shadow-sm border">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted fs-12 fw-medium text-uppercase">Total Registered</span>
                <h3 class="fw-bold text-dark mt-1 mb-0">
                  <SkeletonLoader v-if="loading && !suppliers.length" type="text" :lines="1" height="24px" width="48px" />
                  <span v-else>{{ summary.total_suppliers ?? suppliers.length }}</span>
                </h3>
              </div>
              <div class="avatar-sm rounded-circle bg-primary-subtle d-flex align-items-center justify-content-center text-primary">
                <Icon icon="ri:truck-line" class="fs-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-xl-4 mb-2 mb-xl-0">
        <div class="card h-100 mb-0 shadow-sm border">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted fs-12 fw-medium text-uppercase">Active Suppliers</span>
                <h3 class="fw-bold text-success mt-1 mb-0">
                  <SkeletonLoader v-if="loading && !suppliers.length" type="text" :lines="1" height="24px" width="48px" />
                  <span v-else>{{ summary.active_suppliers ?? activeCount }}</span>
                </h3>
              </div>
              <div class="avatar-sm rounded-circle bg-success-subtle d-flex align-items-center justify-content-center text-success">
                <Icon icon="ri:checkbox-circle-line" class="fs-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-12 col-xl-4">
        <div class="card h-100 mb-0 shadow-sm border">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted fs-12 fw-medium text-uppercase">Total Deliveries Logged</span>
                <h3 class="fw-bold text-dark mt-1 mb-0">
                  <SkeletonLoader v-if="loading && !suppliers.length" type="text" :lines="1" height="24px" width="48px" />
                  <span v-else>{{ summary.total_deliveries ?? 0 }}</span>
                </h3>
              </div>
              <div class="avatar-sm rounded-circle bg-info-subtle d-flex align-items-center justify-content-center text-info">
                <Icon icon="ri:inbox-archive-line" class="fs-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="row">
      <div class="col-12">
        <div class="card shadow-sm border">
          <!-- Toolbar: Refresh, Search, Status, Columns -->
          <div class="card-body border-bottom p-3">
            <div class="d-flex gap-2 gap-md-3 align-items-center">
              <!-- Refresh button -->
              <button
                @click="loadSuppliers(true)"
                type="button"
                class="btn btn-light position-relative p-0 avatar-sm rounded-circle flex-shrink-0"
                title="Refresh suppliers list"
              >
                <span class="avatar-title bg-transparent text-reset">
                  <Icon icon="boxicons:refresh-ccw" class="fs-4" />
                </span>
              </button>

              <!-- Search Box -->
              <div class="flex-grow-1" style="min-width: 0;">
                <div class="search-box mb-0 me-0">
                  <div class="position-relative">
                    <form @submit.prevent="loadSuppliers(true)" class="input-group bg-light rounded pb-0 flex-nowrap">
                      <div class="flex-grow-1 position-relative">
                        <input
                          style="border-radius: 0px; padding-right: 35px; padding-left: 36px;"
                          type="text"
                          class="form-control bg-light rounded flex-grow-1"
                          placeholder="Search by vendor name, contact person, phone, email, KRA PIN..."
                          spellcheck="false"
                          aria-label="Search suppliers"
                          v-model="searchQuery"
                          @input="onSearchInput"
                        />
                        <Icon icon="ri:search-line" class="search-icon fs-5 text-muted position-absolute" style="top: 10px; left: 10px;" />
                        <Icon
                          v-if="searchQuery"
                          icon="ri:close-line"
                          class="cursor-pointer fs-5 text-muted position-absolute"
                          style="top: 10px; right: 12px;"
                          title="Clear search"
                          @click="clearSearch"
                        />
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <!-- Status Filter Dropdown -->
              <div class="position-relative d-none d-sm-flex">
                <button
                  class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <Icon icon="ri:filter-3-line" class="fs-5" />
                  <span>{{ statusLabel }}</span>
                  <Icon icon="ri:arrow-down-s-line" class="fs-5" />
                </button>
                <div class="dropdown-menu dropdown-menu-end p-2" style="min-width: 170px;">
                  <a
                    href="javascript:void(0);"
                    class="dropdown-item d-flex align-items-center justify-content-between"
                    :class="{ active: statusFilter === 'active' }"
                    @click="setStatusFilter('active')"
                  >
                    <span>Active only</span>
                    <span class="badge bg-light text-muted ms-2">{{ summary.active_suppliers ?? '' }}</span>
                  </a>
                  <a
                    href="javascript:void(0);"
                    class="dropdown-item d-flex align-items-center justify-content-between"
                    :class="{ active: statusFilter === 'all' }"
                    @click="setStatusFilter('all')"
                  >
                    <span>All suppliers</span>
                    <span class="badge bg-light text-muted ms-2">{{ summary.total_suppliers ?? '' }}</span>
                  </a>
                  <a
                    href="javascript:void(0);"
                    class="dropdown-item d-flex align-items-center justify-content-between"
                    :class="{ active: statusFilter === 'inactive' }"
                    @click="setStatusFilter('inactive')"
                  >
                    <span>Inactive</span>
                    <span class="badge bg-light text-muted ms-2">{{ summary.inactive_suppliers ?? '' }}</span>
                  </a>
                </div>
              </div>

              <!-- Columns Visibility -->
              <div class="position-relative d-none d-lg-flex">
                <button
                  title="Choose columns"
                  class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <Icon icon="ri:table-line" class="fs-5" />
                  <span>Columns</span>
                  <Icon icon="ri:arrow-down-s-line" class="fs-5" />
                </button>
                <div class="dropdown-menu dropdown-menu-end p-3" style="min-width: 210px;">
                  <div v-for="col in columns" :key="col.key" class="form-check mb-2">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :id="`col-${col.key}`"
                      v-model="col.visible"
                    />
                    <label class="form-check-label fs-13" :for="`col-${col.key}`">
                      {{ col.label }}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Filter chips & active scope indicator -->
          <div class="card-body py-2 border-bottom d-flex flex-wrap align-items-center gap-2 font-size-13 bg-light bg-opacity-25">
            <div v-if="loading && !suppliers.length">
              <SkeletonLoader type="text" :lines="1" height="10px" width="160px" />
            </div>
            <span v-else class="text-muted">
              Showing <span class="fw-bold text-dark">{{ suppliers.length }}</span> of <span class="fw-bold text-dark">{{ total }}</span> suppliers
            </span>

            <template v-if="activeChips.length">
              <span class="text-muted">· Filters in use:</span>
              <span
                v-for="chip in activeChips"
                :key="chip.key"
                class="badge rounded-pill bg-primary bg-soft text-primary font-size-12 fw-medium px-2 py-1 d-inline-flex align-items-center gap-1"
              >
                {{ chip.label }}
                <a href="javascript:void(0);" class="text-primary" :title="`Remove ${chip.label}`" @click="chip.clear()">
                  <Icon icon="ri:close-line" />
                </a>
              </span>
              <a href="javascript:void(0);" class="ms-1 fs-12 text-decoration-none" @click="clearAllFilters">Clear all</a>
            </template>
          </div>

          <!-- Table Container -->
          <div class="card-body p-0" style="min-height: 50vh;">
            <!-- Empty State (Only when NOT loading and zero suppliers) -->
            <div v-if="!loading && !suppliers.length" class="text-center p-5">
              <Icon icon="ri:truck-line" class="text-dark opacity-25" style="font-size: 100px;" />
              <h4 class="fw-bold text-dark mb-2">
                {{ hasFilters ? 'No suppliers match your search' : 'No suppliers registered yet' }}
              </h4>
              <p class="text-muted mb-3 mx-auto" style="max-width: 440px;">
                {{
                  hasFilters
                    ? 'Try adjusting your search keywords or clear your status filters.'
                    : 'Register the vendors, dairies, bakeries and distributors who supply your stock to track intake deliveries and invoices.'
                }}
              </p>
              <button
                v-if="!hasFilters"
                type="button"
                class="btn btn-primary d-inline-flex align-items-center gap-2"
                @click="openAddSupplier"
              >
                <Icon icon="ri:user-add-line" class="fs-5" />
                <span>Register First Supplier</span>
              </button>
            </div>

            <template v-else>
              <!-- Desktop / Tablet Table -->
              <div class="table-responsive d-none d-md-block">
                <table class="table align-middle table-hover mb-0">
                  <thead class="table-light text-nowrap">
                    <tr>
                      <th class="cursor-pointer" @click="toggleSort('name')">
                        Supplier / Company
                        <Icon v-if="sortBy === 'name'" :icon="sortOrder === 'asc' ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" class="ms-1" />
                      </th>
                      <th v-if="isColVisible('contact')">Contact Person</th>
                      <th v-if="isColVisible('address')">Location</th>
                      <th v-if="isColVisible('terms')">Payment Terms</th>
                      <th
                        v-if="isColVisible('deliveries')"
                        class="cursor-pointer text-end"
                        @click="toggleSort('deliveries_count')"
                      >
                        Deliveries
                        <Icon v-if="sortBy === 'deliveries_count'" :icon="sortOrder === 'asc' ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" class="ms-1" />
                      </th>
                      <th v-if="isColVisible('status')">Status</th>
                      <th class="text-end" style="width: 120px;">Actions</th>
                    </tr>
                  </thead>

                  <!-- Data Rows -->
                  <tbody v-if="!(loading && currentPage === 1)">
                    <tr
                      v-for="s in suppliers"
                      :key="s.id"
                      class="cursor-pointer"
                      @click="openSupplierDetails(s)"
                    >
                      <!-- Supplier Name & Tax PIN -->
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <div class="avatar-xs flex-shrink-0">
                            <span class="avatar-title rounded-circle fw-bold font-size-12 bg-primary-subtle text-primary">
                              {{ initialsOf(s.name) }}
                            </span>
                          </div>
                          <div class="min-w-0">
                            <span class="d-block fw-bold text-dark text-truncate">{{ s.name }}</span>
                            <small v-if="s.tax_pin" class="text-muted font-size-11">
                              PIN: <strong class="text-dark">{{ s.tax_pin }}</strong>
                            </small>
                            <small v-else class="text-muted font-size-11">No PIN registered</small>
                          </div>
                        </div>
                      </td>

                      <!-- Contact Details -->
                      <td v-if="isColVisible('contact')" class="text-nowrap" @click.stop>
                        <div v-if="s.contact_person || s.phone || s.email">
                          <div v-if="s.contact_person" class="fw-semibold text-dark fs-13">{{ s.contact_person }}</div>
                          <div class="d-flex align-items-center gap-2 font-size-12 text-muted">
                            <a v-if="s.phone" :href="`tel:${s.phone}`" class="text-muted text-decoration-none hover-primary">
                              <Icon icon="ri:phone-line" class="align-middle me-1" />{{ s.phone }}
                            </a>
                            <a v-if="s.email" :href="`mailto:${s.email}`" class="text-muted text-decoration-none hover-primary" :title="s.email">
                              <Icon icon="ri:mail-line" class="align-middle" />
                            </a>
                          </div>
                        </div>
                        <span v-else class="text-muted fs-12">—</span>
                      </td>

                      <!-- Location -->
                      <td v-if="isColVisible('address')" class="text-truncate fs-13" style="max-width: 200px;" :title="s.address">
                        <span v-if="s.address">
                          <Icon icon="ri:map-pin-line" class="me-1 text-muted align-middle" />{{ s.address }}
                        </span>
                        <span v-else class="text-muted">—</span>
                      </td>

                      <!-- Payment Terms -->
                      <td v-if="isColVisible('terms')" class="text-nowrap">
                        <span v-if="s.payment_terms" class="badge bg-light text-secondary border font-size-12">
                          <Icon icon="ri:money-dollar-circle-line" class="me-1 align-middle" />
                          {{ s.payment_terms }}
                        </span>
                        <span v-else class="text-muted fs-12">—</span>
                      </td>

                      <!-- Deliveries & Total Value -->
                      <td v-if="isColVisible('deliveries')" class="text-end text-nowrap">
                        <div class="fw-bold text-dark fs-13">{{ s.deliveries_count ?? 0 }}</div>
                        <small class="text-muted font-size-11">
                          KES {{ formatMoney(s.total_supplied_kes) }}
                        </small>
                      </td>

                      <!-- Status -->
                      <td v-if="isColVisible('status')" class="text-nowrap">
                        <span
                          class="badge rounded-pill font-size-12 px-2"
                          :class="s.is_active ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-muted'"
                        >
                          {{ s.is_active ? 'Active' : 'Inactive' }}
                        </span>
                      </td>

                      <!-- Action Buttons -->
                      <td class="text-end text-nowrap" @click.stop>
                        <div class="d-inline-flex align-items-center gap-1">
                          <button
                            type="button"
                            class="btn btn-sm btn-light waves-effect"
                            title="View supplier profile"
                            @click="openSupplierDetails(s)"
                          >
                            <Icon icon="ri:eye-line" class="fs-5 text-muted" />
                          </button>
                          <button
                            type="button"
                            class="btn btn-sm btn-light waves-effect"
                            title="Edit supplier"
                            @click="openEditSupplier(s)"
                          >
                            <Icon icon="ri:edit-2-line" class="fs-5 text-muted" />
                          </button>
                          <button
                            type="button"
                            class="btn btn-sm btn-light text-danger waves-effect"
                            title="Remove supplier"
                            @click="confirmDelete(s)"
                          >
                            <Icon icon="ri:delete-bin-line" class="fs-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>

                  <!-- Skeleton Rows (Loading) -->
                  <tbody v-if="loading">
                    <tr v-for="n in (currentPage === 1 ? 6 : 2)" :key="`sk-${n}`">
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <SkeletonLoader width="32px" height="32px" rounded />
                          <div class="d-flex flex-column gap-1">
                            <SkeletonLoader type="text" :lines="1" height="10px" width="130px" />
                            <SkeletonLoader type="text" :lines="1" height="10px" width="80px" />
                          </div>
                        </div>
                      </td>
                      <td v-if="isColVisible('contact')">
                        <div class="d-flex flex-column gap-1">
                          <SkeletonLoader type="text" :lines="1" height="10px" width="100px" />
                          <SkeletonLoader type="text" :lines="1" height="10px" width="70px" />
                        </div>
                      </td>
                      <td v-if="isColVisible('address')">
                        <SkeletonLoader type="text" :lines="1" height="10px" width="110px" />
                      </td>
                      <td v-if="isColVisible('terms')">
                        <SkeletonLoader type="text" :lines="1" height="18px" width="80px" rounded />
                      </td>
                      <td v-if="isColVisible('deliveries')" class="text-end">
                        <div class="d-flex flex-column align-items-end gap-1">
                          <SkeletonLoader type="text" :lines="1" height="10px" width="30px" />
                          <SkeletonLoader type="text" :lines="1" height="10px" width="70px" />
                        </div>
                      </td>
                      <td v-if="isColVisible('status')">
                        <SkeletonLoader type="text" :lines="1" height="18px" width="55px" rounded />
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Mobile View (Cards) -->
              <div class="d-block d-md-none p-2">
                <!-- Mobile Skeletons -->
                <template v-if="loading && currentPage === 1">
                  <div v-for="n in 4" :key="`skc-${n}`" class="card border mb-2 shadow-none p-3">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <div class="d-flex align-items-center gap-2">
                        <SkeletonLoader width="32px" height="32px" rounded />
                        <SkeletonLoader type="text" :lines="1" height="12px" width="120px" />
                      </div>
                      <SkeletonLoader type="text" :lines="1" height="16px" width="50px" rounded />
                    </div>
                    <SkeletonLoader type="text" :lines="2" height="10px" />
                  </div>
                </template>
                <div
                  v-for="s in suppliers"
                  :key="`m-${s.id}`"
                  class="card border mb-2 shadow-none cursor-pointer"
                  @click="openSupplierDetails(s)"
                >
                  <div class="card-body p-3">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <div class="d-flex align-items-center gap-2">
                        <div class="avatar-xs flex-shrink-0">
                          <span class="avatar-title rounded-circle fw-bold font-size-12 bg-primary-subtle text-primary">
                            {{ initialsOf(s.name) }}
                          </span>
                        </div>
                        <div class="min-w-0">
                          <h6 class="fw-bold text-dark mb-0 text-truncate">{{ s.name }}</h6>
                          <small v-if="s.tax_pin" class="text-muted font-size-11">PIN: {{ s.tax_pin }}</small>
                        </div>
                      </div>
                      <span
                        class="badge rounded-pill font-size-11"
                        :class="s.is_active ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-muted'"
                      >
                        {{ s.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </div>

                    <div v-if="s.contact_person || s.phone" class="fs-12 text-muted mb-2">
                      <span v-if="s.contact_person" class="fw-semibold text-dark">{{ s.contact_person }}</span>
                      <span v-if="s.contact_person && s.phone"> · </span>
                      <span v-if="s.phone">{{ s.phone }}</span>
                    </div>

                    <div class="d-flex align-items-center justify-content-between pt-2 border-top fs-12">
                      <span class="text-muted">{{ s.deliveries_count ?? 0 }} deliveries</span>
                      <span class="fw-bold text-dark">KES {{ formatMoney(s.total_supplied_kes) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pagination Footer -->
              <div v-if="total > perPage" class="card-body border-top py-2 d-flex align-items-center justify-content-between">
                <span class="text-muted fs-12">
                  Page {{ currentPage }} of {{ lastPage }}
                </span>
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item" :class="{ disabled: currentPage <= 1 }">
                    <a class="page-link" href="javascript:void(0);" @click="changePage(currentPage - 1)">Previous</a>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage >= lastPage }">
                    <a class="page-link" href="javascript:void(0);" @click="changePage(currentPage + 1)">Next</a>
                  </li>
                </ul>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals & Asides -->
    <SupplierFormModal
      ref="formModal"
      @saved="onSupplierSaved"
      @error="onSupplierError"
    />

    <SupplierDetailsAside
      ref="detailsAside"
      @edit="openEditSupplier"
      @receive="openReceiveForSupplier"
    />

    <!-- Feedback Toast -->
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
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import SuppliersAPI from "@/api/suppliers";
import SupplierFormModal from "./components/SupplierForm.modal.vue";
import SupplierDetailsAside from "./components/SupplierDetails.aside.vue";
import SkeletonLoader from "@/components/Loaders/SkeletonLoader.vue";
import ImageToast from "@/components/ImageToast.vue";
import successImage from "@/assets/images/icons/check.png";
import errorImage from "@/assets/images/icons/error.png";

const router = useRouter();

// State
const suppliers = ref([]);
const loading = ref(false);
const summary = ref({
  total_suppliers: 0,
  active_suppliers: 0,
  inactive_suppliers: 0,
  total_deliveries: 0,
});

// Filters & Pagination
const searchQuery = ref("");
const statusFilter = ref("active"); // active, all, inactive
const sortBy = ref("name");
const sortOrder = ref("asc");
const currentPage = ref(1);
const lastPage = ref(1);
const perPage = ref(25);
const total = ref(0);

// Search debounce
let searchTimer = null;

// Modal / Aside refs
const formModal = ref(null);
const detailsAside = ref(null);

// Toast
const toastStatus = ref(null);
const toastTitle = ref("");
const toastMessage = ref("");
const toastImage = ref(successImage);

// Column picker
const columns = ref([
  { key: "contact", label: "Contact Person", visible: true },
  { key: "address", label: "Location", visible: true },
  { key: "terms", label: "Payment Terms", visible: true },
  { key: "deliveries", label: "Deliveries", visible: true },
  { key: "status", label: "Status", visible: true },
]);

function isColVisible(key) {
  const c = columns.value.find((col) => col.key === key);
  return c ? c.visible : true;
}

const statusLabel = computed(() => {
  if (statusFilter.value === "active") return "Active only";
  if (statusFilter.value === "inactive") return "Inactive";
  return "All suppliers";
});

const activeCount = computed(() => {
  return suppliers.value.filter((s) => s.is_active).length;
});

const hasFilters = computed(() => {
  return Boolean(searchQuery.value.trim()) || statusFilter.value !== "active";
});

const activeChips = computed(() => {
  const chips = [];
  if (searchQuery.value.trim()) {
    chips.push({
      key: "search",
      label: `"${searchQuery.value.trim()}"`,
      clear: () => {
        searchQuery.value = "";
        loadSuppliers(true);
      },
    });
  }
  if (statusFilter.value !== "active") {
    chips.push({
      key: "status",
      label: statusFilter.value === "all" ? "All status" : "Inactive only",
      clear: () => {
        statusFilter.value = "active";
        loadSuppliers(true);
      },
    });
  }
  return chips;
});

function initialsOf(name) {
  if (!name) return "??";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function formatMoney(amount) {
  if (amount == null) return "0.00";
  return Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function showToast(title, message) {
  toastStatus.value = "success";
  toastTitle.value = title;
  toastMessage.value = message;
  toastImage.value = successImage;
}

function showError(title, message) {
  toastStatus.value = "error";
  toastTitle.value = title;
  toastMessage.value = message;
  toastImage.value = errorImage;
}

async function loadSuppliers(resetPage = false) {
  if (resetPage) currentPage.value = 1;

  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      per_page: perPage.value,
      status: statusFilter.value,
      sort_by: sortBy.value,
      sort_order: sortOrder.value,
    };
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }

    const { data } = await SuppliersAPI.list(params);
    suppliers.value = data.data || [];
    total.value = data.meta?.total ?? suppliers.value.length;
    currentPage.value = data.meta?.current_page ?? 1;
    lastPage.value = data.meta?.last_page ?? 1;

    if (data.meta?.summary) {
      summary.value = data.meta.summary;
    }
  } catch (err) {
    console.error("Error loading suppliers:", err);
    showError("Failed to load", err.response?.data?.message || "Could not retrieve suppliers.");
  } finally {
    loading.value = false;
  }
}

function onSearchInput() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadSuppliers(true);
  }, 350);
}

function clearSearch() {
  searchQuery.value = "";
  loadSuppliers(true);
}

function setStatusFilter(filter) {
  statusFilter.value = filter;
  loadSuppliers(true);
}

function clearAllFilters() {
  searchQuery.value = "";
  statusFilter.value = "active";
  loadSuppliers(true);
}

function toggleSort(col) {
  if (sortBy.value === col) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = col;
    sortOrder.value = "asc";
  }
  loadSuppliers(true);
}

function changePage(p) {
  if (p < 1 || p > lastPage.value) return;
  currentPage.value = p;
  loadSuppliers();
}

// Modal / Aside actions
function openAddSupplier() {
  formModal.value?.open();
}

function openEditSupplier(supplier) {
  formModal.value?.open(supplier);
}

function openSupplierDetails(supplier) {
  detailsAside.value?.open(supplier.id);
}

function openReceiveForSupplier(supplier) {
  // Navigate to /stock with query params or open stock receive
  router.push({
    path: "/stock",
    query: {
      action: "receive",
      supplier_id: supplier.id,
      supplier_name: supplier.name,
    },
  });
}

function onSupplierSaved({ isEdit, supplier, message }) {
  showToast(isEdit ? "Updated" : "Registered", message);
  loadSuppliers();
}

function onSupplierError(msg) {
  showError("Error", msg);
}

async function confirmDelete(supplier) {
  const confirmed = window.confirm(
    `Are you sure you want to remove supplier "${supplier.name}"? Past delivery records will be preserved.`
  );
  if (!confirmed) return;

  try {
    await SuppliersAPI.remove(supplier.id);
    showToast("Supplier Removed", `Supplier "${supplier.name}" was successfully removed.`);
    loadSuppliers();
  } catch (err) {
    console.error("Error removing supplier:", err);
    showError("Could not remove", err.response?.data?.message || "Failed to remove supplier.");
  }
}

onMounted(() => {
  loadSuppliers();
});
</script>

<style scoped>
.hover-primary:hover {
  color: var(--bs-primary) !important;
}
</style>
