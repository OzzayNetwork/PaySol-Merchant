<template>
    <div class="container-fluid">
        <!-- Page Title -->
        <div class="row">
            <div class="col-12">
                <div class="page-title-box d-flex align-items-center justify-content-between gap-2">
                    <div class="min-w-0">
                        <h4 class="mb-sm-0 font-size-18 pb-2 text-truncate">Branches &amp; Outlets</h4>
                        <div class="page-title-right">
                            <ol class="breadcrumb m-0 flex-nowrap">
                                <li class="breadcrumb-item d-none d-sm-block">
                                    <router-link to="/">Dashboard</router-link>
                                </li>
                                <li class="breadcrumb-item active">Business</li>
                                <li class="breadcrumb-item active text-truncate">Branches &amp; Outlets</li>
                            </ol>
                        </div>
                    </div>
                    <div class="d-flex gap-2 flex-shrink-0">
                        <button type="button" @click="openForm()" title="Add a branch" aria-label="Add a branch"
                            class="btn btn-primary header-btn d-flex flex-nowrap align-items-center justify-content-center gap-2 text-white">
                            <i class="dripicons-plus fs-4 d-flex"></i>
                            <span class="d-none d-lg-inline">Add Branch</span>
                            <span class="d-none d-sm-inline d-lg-none">Add</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="row justify-content-center">
            <div class="col-12">
                <div class="card">
                    <!-- Toolbar -->
                    <div class="card-body border-bottom">
                        <div class="row">
                            <div class="col-12 gap-2 gap-md-3 d-flex align-items-center">
                                <!-- Refresh -->
                                <div>
                                    <button @click="loadBranches()" type="button"
                                        class="btn waves-effect btn-lg btn-light position-relative p-0 avatar-sm rounded-circle">
                                        <span class="avatar-title bg-transparent text-reset">
                                            <Icon title="Refresh branches" icon="boxicons:refresh-ccw" class="fs-4" />
                                        </span>
                                    </button>
                                </div>

                                <!-- Search -->
                                <div class="flex-grow-1">
                                    <div class="search-box mb-0 me-0">
                                        <div class="position-relative">
                                            <form @submit.prevent="handleSearchInput()"
                                                class="input-group bg-light rounded mb04 pb-0 flex-nowrap">
                                                <div class="flex-grow-1">
                                                    <input style="border-radius: 0px; padding-right: 35px;" type="text"
                                                        class="form-control bg-light rounded flex-grow-1"
                                                        placeholder="Search by branch name, premises, street..." spellcheck="false"
                                                        aria-label="Search branches"
                                                        v-model="searchQuery" @input="handleSearchInput">
                                                    <i class="bx bx-search-alt search-icon fs-4"></i>
                                                    <i v-if="searchQuery != ''" title="Clear search"
                                                        style="right: 15px; left:unset;"
                                                        class="mdi mdi-close search-icon cursor-pointer fs-3 waves-effect"
                                                        @click="searchQuery = ''; handleSearchInput();">
                                                    </i>
                                                </div>
                                                <button type="submit" @click="handleSearchInput()" title="Click to search"
                                                    class="btn btn-primary px-4 d-md-flex d-none align-items-center fw-bold">
                                                    <i class="bx bx-search-alt search-icon fs-4"></i>
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>

                                <!-- Status Filter -->
                                <div class="position-relative d-flex d-lg-flex d-none">
                                    <button
                                        class="d-lg-flex d-flex align-items-center fw-bold btn btn-light waves-effect gap-2"
                                        type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        <i class="mdi mdi-toggle-switch-outline fs-4 align-middle"></i>
                                        <span class="d-md-inline-block d-none">{{ statusFilterLabel }}</span>
                                        <i class="mdi mdi-chevron-down fs-4"></i>
                                    </button>
                                    <div class="dropdown-menu p-2" style="min-width: 160px;">
                                        <a href="javascript:void(0);" class="dropdown-item"
                                            :class="{ 'active': statusFilter === '' }" @click="setStatusFilter('')">All Branches</a>
                                        <a href="javascript:void(0);" class="dropdown-item"
                                            :class="{ 'active': statusFilter === '1' }" @click="setStatusFilter('1')">Active Only</a>
                                        <a href="javascript:void(0);" class="dropdown-item"
                                            :class="{ 'active': statusFilter === '0' }" @click="setStatusFilter('0')">Inactive Only</a>
                                    </div>
                                </div>

                                <!-- Columns Toggle -->
                                <div class="position-relative d-flex d-lg-flex d-none">
                                    <button title="Edit columns to view on the table"
                                        class="d-lg-flex d-flex align-items-center fw-bold btn btn-light waves-effect gap-2"
                                        type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        <i class="mdi mdi-format-columns fs-4 align-middle"></i>
                                        <span class="d-md-inline-block d-none">Columns</span>
                                        <i class="mdi mdi-chevron-down fs-4"></i>
                                    </button>
                                    <div class="dropdown-menu dropdown-menu-end p-3" style="min-width: 220px;">
                                        <div v-for="column in allColumns" :key="column.key" class="form-check mb-2">
                                            <input class="form-check-input" type="checkbox" :id="`col-${column.key}`"
                                                v-model="column.visible" />
                                            <label class="form-check-label small" :for="`col-${column.key}`">
                                                {{ column.label }}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Table area -->
                    <div class="card-body p-0" style="min-height: 65vh;">
                        <!-- Empty state -->
                        <div class="p-4 d-flex align-items-center justify-content-center h-100 w-100"
                            v-if="!loading && filteredBranches.length === 0">
                            <div class="text-center p-4 w-100 h-100">
                                <div class="empty-state-icon mb-0">
                                    <i style="font-size: 140px;" class="bx bxs-store text-black opacity-25"></i>
                                </div>
                                <h4 class="fw-bold text-dark mb-2 text-capitalize">
                                    {{ searchQuery || statusFilter !== '' ? 'No branches match your filters' : "It's empty in here" }}
                                </h4>
                                <p v-if="searchQuery || statusFilter !== ''" class="text-muted mb-3 mx-auto" style="max-width: 440px;">
                                    We couldn't find any branches matching your search. Try checking spelling or reset filters.
                                </p>
                                <p v-else class="text-muted mb-3 mx-auto" style="max-width: 440px;">
                                    No branches configured yet. Every business starts with a Main branch, and grows to add depots and outlets.
                                </p>
                                <button v-if="!searchQuery && statusFilter === ''" type="button" class="btn btn-primary" @click="openForm()">
                                    <i class="dripicons-plus me-1"></i> Add Branch
                                </button>
                                <button v-else type="button" class="btn btn-soft-secondary" @click="clearFilters">
                                    Clear filters
                                </button>
                            </div>
                        </div>

                        <!-- Table: tablets and up -->
                        <div v-else class="table-responsive d-none d-md-block">
                            <!-- Table Showing Bar (Kelvin's Banks.List.vue pattern) -->
                            <table class="table verticle-middle table-hover mb-0 doc-table">
                                <thead>
                                    <tr>
                                        <td>
                                            <template v-if="!loading">
                                                Showing <span class="fw-bold text-black">{{ filteredBranches.length }}</span> of <span class="fw-bold text-black">{{ branches.length }}</span> Branches
                                            </template>
                                            <template v-else>
                                                <div class="d-flex align-items-center gap-2">
                                                    <div style="height: 20px; width:20px;"
                                                        class="spinner-border text-secondary m-1" role="status">
                                                        <span class="sr-only">Loading...</span>
                                                    </div>
                                                    <span>Loading ...</span>
                                                </div>
                                            </template>
                                        </td>
                                    </tr>
                                </thead>
                            </table>

                            <table class="table verticle-middle table-hover mb-0 doc-table">
                                <thead class="table-light text-nowrap">
                                    <tr>
                                        <th>Branch</th>
                                        <th v-if="col('address')">Premises &amp; Address</th>
                                        <th v-if="col('region')">Region / Ward</th>
                                        <th v-if="col('stock')" class="text-center">Stock On-Hand</th>
                                        <th v-if="col('staff')" class="text-center">Employees</th>
                                        <th v-if="col('tills')" class="text-center">Tills</th>
                                        <th v-if="col('status')" class="text-center">Status</th>
                                        <th></th>
                                    </tr>
                                </thead>

                                <!-- Rows -->
                                <tbody v-if="!loading">
                                    <tr v-for="b in filteredBranches" :key="b.id" class="cursor-pointer"
                                        :class="{ 'table-active': selectedBranch?.id === b.id }"
                                        title="Click to view details" @click="openDetails(b)">
                                        <!-- Branch Identity (Avatar + Name + Premises) -->
                                        <td>
                                            <div class="d-flex gap-3 align-items-center" :title="b.name">
                                                <div class="avatar-xs d-flex flex-shrink-0">
                                                    <div class="avatar-xs rounded-circle d-flex align-items-center justify-content-center text-white"
                                                        :class="b.is_main ? 'bg-primary shadow-sm' : 'bg-secondary bg-opacity-75'">
                                                        <i class="bx bx-store fs-5"></i>
                                                    </div>
                                                </div>
                                                <div class="min-w-0">
                                                    <div class="d-flex align-items-center gap-2">
                                                        <span class="d-block fw-bold text-dark truncate-singleLine hover-primary">
                                                            {{ b.name }}
                                                        </span>
                                                        <span v-if="b.is_main" class="badge bg-primary text-white font-size-10 px-2 py-1">
                                                            Main
                                                        </span>
                                                    </div>
                                                    <span style="font-size: 12px;" class="text-muted text-nowrap d-block">
                                                        {{ b.premises_name || 'Physical Store' }}<template v-if="b.unit_label"> · {{ b.unit_label }}</template>
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <!-- Premises & Address -->
                                        <td v-if="col('address')">
                                            <span class="d-block text-dark font-size-13 truncate-singleLine" :title="b.address_line || b.premises_name || '—'">
                                                {{ b.address_line || b.premises_name || '—' }}
                                            </span>
                                            <span v-if="b.latitude && b.longitude" style="font-size: 11px;" class="text-muted d-flex align-items-center gap-1 font-monospace">
                                                <i class="bx bx-map-pin text-danger"></i> {{ b.latitude }}, {{ b.longitude }}
                                            </span>
                                        </td>

                                        <!-- Region / Ward -->
                                        <td v-if="col('region')">
                                            <span class="d-block text-dark font-size-13 truncate-singleLine">
                                                <template v-if="b.ward">{{ b.ward.name }} Ward</template>
                                                <template v-else-if="b.area">{{ b.area.name }}</template>
                                                <template v-else>—</template>
                                            </span>
                                            <span v-if="b.ward?.county" style="font-size: 12px;" class="text-muted text-nowrap d-block">
                                                {{ b.ward.county }} County
                                            </span>
                                        </td>

                                        <!-- Stock on hand -->
                                        <td v-if="col('stock')" class="text-center text-nowrap">
                                            <span class="fw-bold text-dark font-size-13">
                                                {{ Number(b.stats?.total_stock_units ?? 0).toLocaleString() }}
                                            </span>
                                            <small class="text-muted font-size-11 d-block">
                                                {{ b.stats?.tracked_products_count ?? 0 }} products
                                            </small>
                                        </td>

                                        <!-- Employees -->
                                        <td v-if="col('staff')" class="text-center text-nowrap">
                                            <div v-if="b.stats?.staff_count > 0">
                                                <span class="fw-bold text-dark font-size-13">{{ b.stats?.staff_count }}</span>
                                                <small class="text-muted font-size-11 d-block">{{ b.stats?.staff_count === 1 ? 'employee' : 'employees' }}</small>
                                            </div>
                                            <span v-else class="text-muted font-size-13 opacity-50">—</span>
                                        </td>

                                        <!-- Tills -->
                                        <td v-if="col('tills')" class="text-center text-nowrap">
                                            <div v-if="b.stats?.payment_methods_count > 0">
                                                <span class="fw-bold text-dark font-size-13">{{ b.stats?.payment_methods_count }}</span>
                                                <small class="text-muted font-size-11 d-block">{{ b.stats?.payment_methods_count === 1 ? 'till' : 'tills' }}</small>
                                            </div>
                                            <span v-else class="text-muted font-size-13 opacity-50">—</span>
                                        </td>

                                        <!-- Status -->
                                        <td v-if="col('status')" class="text-center text-nowrap">
                                            <span class="badge font-size-11 px-2 py-1"
                                                :class="b.is_active ? 'bg-success-subtle text-success' : 'bg-light text-muted'">
                                                {{ b.is_active ? 'Active' : 'Inactive' }}
                                            </span>
                                        </td>

                                        <!-- Actions -->
                                        <td @click.stop class="text-end pe-3">
                                            <ul class="list-inline font-size-20 mb-0">
                                                <li class="list-inline-item px-2 dropdown d-flex justify-content-center align-items-center">
                                                    <a href="javascript:void(0);" title="More actions"
                                                        class="text-decoration-none text-black waves-effect px-2 rounded"
                                                        data-bs-toggle="dropdown" aria-expanded="false">
                                                        <i class="bx bx-dots-horizontal-rounded"></i>
                                                    </a>
                                                    <ul class="dropdown-menu dropdown-menu-end p-2" data-bs-auto-close="true">
                                                        <li>
                                                            <a class="dropdown-item d-flex py-2 align-items-center" href="javascript:void(0);" @click="openDetails(b)">
                                                                <i class="bx bx-info-circle me-2 fs-5 text-muted"></i>
                                                                <span>View Details</span>
                                                            </a>
                                                        </li>
                                                        <li>
                                                            <a class="dropdown-item d-flex py-2 align-items-center" href="javascript:void(0);" @click="openForm(b)">
                                                                <i class="bx bx-edit-alt me-2 fs-5 text-muted"></i>
                                                                <span>Edit Branch</span>
                                                            </a>
                                                        </li>
                                                        <li v-if="!b.is_main && b.is_active">
                                                            <a class="dropdown-item d-flex py-2 align-items-center text-warning" href="javascript:void(0);" @click="confirmSetMain(b)">
                                                                <i class="bx bx-star me-2 fs-5"></i>
                                                                <span>Set as Main</span>
                                                            </a>
                                                        </li>
                                                        <template v-if="!b.is_main">
                                                            <li><hr class="dropdown-divider my-1"></li>
                                                            <li>
                                                                <a class="dropdown-item d-flex py-2 align-items-center text-danger" href="javascript:void(0);" @click="confirmDelete(b)">
                                                                <i class="bx bx-trash me-2 fs-5"></i>
                                                                <span>Delete Branch</span>
                                                            </a>
                                                        </li>
                                                        </template>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </td>
                                    </tr>
                                </tbody>

                                <!-- Skeleton when loading table -->
                                <tbody v-if="loading">
                                    <tr v-for="n in 3" :key="`sk-${n}`">
                                        <td>
                                            <div class="d-flex gap-3 align-items-center">
                                                <SkeletonLoader width="32px" height="32px" rounded />
                                                <div class="d-flex flex-column gap-1">
                                                    <SkeletonLoader type="text" :lines="1" height="12px" width="130px" />
                                                    <SkeletonLoader type="text" :lines="1" height="10px" width="90px" />
                                                </div>
                                            </div>
                                        </td>
                                        <td v-if="col('address')"><SkeletonLoader type="text" :lines="1" height="12px" width="140px" /></td>
                                        <td v-if="col('region')"><SkeletonLoader type="text" :lines="1" height="12px" width="110px" /></td>
                                        <td v-if="col('stock')"><SkeletonLoader type="text" :lines="1" height="12px" width="60px" class="mx-auto" /></td>
                                        <td v-if="col('staff')"><SkeletonLoader type="text" :lines="1" height="12px" width="40px" class="mx-auto" /></td>
                                        <td v-if="col('tills')"><SkeletonLoader type="text" :lines="1" height="12px" width="40px" class="mx-auto" /></td>
                                        <td v-if="col('status')"><SkeletonLoader type="text" :lines="1" height="12px" width="50px" class="mx-auto" /></td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Mobile cards (phones, 375 px) -->
                        <div class="d-block d-md-none p-2">
                            <div v-for="b in filteredBranches" :key="`mb-${b.id}`"
                                class="card border mb-2 shadow-none p-3 cursor-pointer"
                                :class="{ 'bg-primary-subtle bg-opacity-10': b.is_main }"
                                @click="openDetails(b)">
                                <div class="d-flex align-items-start justify-content-between mb-2">
                                    <div class="min-w-0 me-2">
                                        <div class="d-flex align-items-center gap-2">
                                            <h5 class="fw-bold text-dark mb-0 font-size-14 text-truncate">{{ b.name }}</h5>
                                            <span v-if="b.is_main" class="badge bg-primary text-white font-size-10">Main</span>
                                        </div>
                                        <span class="text-muted font-size-11 d-block text-truncate mt-1">
                                            {{ b.premises_name || b.address_line || 'Physical Store' }}
                                        </span>
                                    </div>
                                    <span class="badge font-size-10 flex-shrink-0" :class="b.is_active ? 'bg-success-subtle text-success' : 'bg-light text-muted'">
                                        {{ b.is_active ? 'Active' : 'Closed' }}
                                    </span>
                                </div>
                                <div class="d-flex align-items-center justify-content-between pt-2 border-top font-size-12">
                                    <span class="text-muted">
                                        {{ b.stats?.staff_count ? `${b.stats.staff_count} ${b.stats.staff_count === 1 ? 'employee' : 'employees'}` : 'No employees' }} · {{ b.stats?.payment_methods_count ?? 0 }} tills
                                    </span>
                                    <span class="fw-bold text-dark">{{ Number(b.stats?.total_stock_units ?? 0).toLocaleString() }} units</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals & Asides -->
        <BranchFormModal ref="formModal" @saved="onBranchSaved" />
        <BranchDetailsAside ref="detailsAside" @edit="openForm" @set-main="confirmSetMain" @delete="confirmDelete" @updated="onBranchUpdated" />
    </div>
</template>

<script setup>
// ---------------------------------------------------------------
// Branches.List — the business's branches management page (§5.2).
//
// Modelled on: Paysol.Admin/src/pages/Banks/Banks.List.vue
// (container-fluid, header buttons, Skote toolbar, columns toggle,
// doc-table for tablets/desktop, cards for phones, empty state).
//
// Endpoints:
//   GET    /api/v1/tenant/branches           (any role)
//   GET    /api/v1/tenant/branches/{id}      (any role)
//   POST   /api/v1/tenant/branches           (owner, manager)
//   PATCH  /api/v1/tenant/branches/{id}      (owner, manager)
//   POST   /api/v1/tenant/branches/{id}/set-main (owner, manager)
//   DELETE /api/v1/tenant/branches/{id}      (owner, manager)
// ---------------------------------------------------------------
import { ref, computed, reactive, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import branchesApi from "@/api/branches";
import SkeletonLoader from "@/components/Loaders/SkeletonLoader.vue";
import BranchFormModal from "./components/BranchForm.modal.vue";
import BranchDetailsAside from "./components/BranchDetails.aside.vue";

// Page state
const branches = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const statusFilter = ref("");
const selectedBranch = ref(null);

const formModal = ref(null);
const detailsAside = ref(null);

// Columns config
const allColumns = reactive([
    { key: "address", label: "Premises & Address", visible: true },
    { key: "region", label: "Region / Ward", visible: true },
    { key: "stock", label: "Stock On-Hand", visible: true },
    { key: "staff", label: "Employees", visible: true },
    { key: "tills", label: "Tills", visible: true },
    { key: "status", label: "Status", visible: true },
]);

function col(key) {
    return allColumns.find((c) => c.key === key)?.visible ?? true;
}

const statusFilterLabel = computed(() => {
    if (statusFilter.value === "1") return "Active Only";
    if (statusFilter.value === "0") return "Inactive Only";
    return "All Branches";
});

function setStatusFilter(val) {
    statusFilter.value = val;
    loadBranches();
}

function clearFilters() {
    searchQuery.value = "";
    statusFilter.value = "";
    loadBranches();
}

// Search filtering
const filteredBranches = computed(() => {
    let list = branches.value;

    if (statusFilter.value === "1") {
        list = list.filter((b) => b.is_active);
    } else if (statusFilter.value === "0") {
        list = list.filter((b) => !b.is_active);
    }

    if (!searchQuery.value.trim()) return list;

    const q = searchQuery.value.toLowerCase().trim();
    return list.filter((b) => {
        return (
            b.name?.toLowerCase().includes(q) ||
            b.premises_name?.toLowerCase().includes(q) ||
            b.address_line?.toLowerCase().includes(q) ||
            b.ward?.name?.toLowerCase().includes(q) ||
            b.area?.name?.toLowerCase().includes(q)
        );
    });
});

// ---- Fetch branches ----
async function loadBranches() {
    loading.value = true;
    try {
        const res = await branchesApi.list({
            include_inactive: 1,
            search: searchQuery.value ? searchQuery.value.trim() : undefined,
        });
        branches.value = res.data?.data || [];
    } catch (err) {
        console.error("Error fetching branches:", err);
    } finally {
        loading.value = false;
    }
}

let searchTimer = null;
function handleSearchInput() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        loadBranches();
    }, 300);
}

// ---- Modals & Asides ----
function openForm(b = null) {
    formModal.value?.open(b);
}

function openDetails(b) {
    selectedBranch.value = b;
    detailsAside.value?.open(b.id);
}

function onBranchSaved() {
    loadBranches();
}

function onBranchUpdated() {
    loadBranches();
}

async function confirmSetMain(b) {
    const confirmed = window.confirm(
        `Promote "${b.name}" to be your Main Branch? It will become the default location for sales and till sessions.`
    );
    if (!confirmed) return;

    try {
        await branchesApi.setMain(b.id);
        loadBranches();
    } catch (err) {
        console.error("Error setting main branch:", err);
        alert(err.response?.data?.message || "Failed to promote branch to main.");
    }
}

async function confirmDelete(b) {
    const confirmed = window.confirm(
        `Are you sure you want to delete branch "${b.name}"? Only branches with zero inventory balance and no past stock movements can be deleted.`
    );
    if (!confirmed) return;

    try {
        await branchesApi.delete(b.id);
        loadBranches();
    } catch (err) {
        console.error("Error deleting branch:", err);
        alert(err.response?.data?.message || "Cannot delete branch. If it has past transactions, deactivate it instead.");
    }
}

onMounted(() => {
    loadBranches();
});
</script>

<style scoped>
.hover-primary:hover {
    color: var(--bs-primary) !important;
}
.cursor-pointer {
    cursor: pointer;
}
.header-btn {
    height: 38px;
    padding: 0 16px;
    font-size: 13px;
    font-weight: 600;
}
.truncate-singleLine {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
