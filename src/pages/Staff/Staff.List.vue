<template>
    <!-- Page title -->
    <div class="row">
        <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between gap-2">
                <div>
                    <h4 class="mb-sm-0 font-size-18 pb-2">Staff</h4>
                    <div class="page-title-right">
                        <ol class="breadcrumb m-0">
                            <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
                            <li class="breadcrumb-item active">People</li>
                            <li class="breadcrumb-item active">Staff</li>
                        </ol>
                    </div>
                </div>
                <router-link to="/staff/add"
                    class="btn btn-primary d-flex align-items-center justify-content-center gap-2 flex-nowrap text-white">
                    <i class="dripicons-plus fs-4 d-flex"></i>
                    <span class="d-none d-sm-inline">Add Staff</span>
                </router-link>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-12">
            <div class="card">
                <!-- Toolbar: refresh, search, role, status, columns -->
                <div class="card-body border-bottom">
                    <div class="d-flex gap-2 gap-md-3 align-items-center">
                        <!-- Refresh -->
                        <div>
                            <button @click="reload()" type="button"
                                class="btn waves-effect btn-lg btn-light position-relative p-0 avatar-sm rounded-circle">
                                <span class="avatar-title bg-transparent text-reset">
                                    <Icon title="Refresh the staff list" icon="boxicons:refresh-ccw" class="fs-4" />
                                </span>
                            </button>
                        </div>

                        <!-- Search -->
                        <div class="flex-grow-1" style="min-width: 0;">
                            <div class="search-box mb-0 me-0">
                                <div class="position-relative">
                                    <form @submit.prevent="reload()" class="input-group bg-light rounded pb-0 flex-nowrap">
                                        <div class="flex-grow-1">
                                            <input style="border-radius: 0px; padding-right: 35px;" type="text"
                                                class="form-control bg-light rounded flex-grow-1"
                                                placeholder="Search by name, phone, email..." spellcheck="false"
                                                aria-label="Search staff" v-model="searchQuery" @input="onSearch">
                                            <i class="bx bx-search-alt search-icon fs-4"></i>
                                            <i v-if="searchQuery != ''" title="Clear search" style="right: 15px; left:unset;"
                                                class="mdi mdi-close search-icon cursor-pointer fs-3 waves-effect"
                                                @click="searchQuery = ''; reload();"></i>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <!-- Phones & tablets: both filters in one menu -->
                        <div class="position-relative d-flex d-lg-none">
                            <button type="button" title="Filter the staff list"
                                class="btn btn-light waves-effect position-relative p-0 avatar-sm rounded-circle"
                                data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                                <span class="avatar-title bg-transparent text-reset"><i class="mdi mdi-filter-variant fs-4"></i></span>
                                <span v-if="roleFilter || statusFilter" class="filter-dot"></span>
                            </button>
                            <div class="dropdown-menu dropdown-menu-end p-2" style="min-width: 220px;">
                                <h6 class="dropdown-header">Role</h6>
                                <a v-for="r in roleOptions" :key="`m-r-${r.key}`" href="javascript:void(0);" class="dropdown-item"
                                    :class="{ active: roleFilter === r.key }" @click="setRole(r.key)">{{ r.label }}</a>
                                <div class="dropdown-divider"></div>
                                <h6 class="dropdown-header">Status</h6>
                                <a v-for="s in statusOptions" :key="`m-s-${s.key}`" href="javascript:void(0);" class="dropdown-item"
                                    :class="{ active: statusFilter === s.key }" @click="setStatus(s.key)">{{ s.label }}</a>
                            </div>
                        </div>

                        <!-- Role filter -->
                        <div class="position-relative d-none d-lg-flex">
                            <button class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2" type="button"
                                data-bs-toggle="dropdown" aria-expanded="false">
                                <Icon :icon="roleFilter ? (ROLE_META[roleFilter]?.iconActive) : 'ri:team-line'" class="fs-4" />
                                <span>{{ roleFilter ? roleLabel(roleFilter) : 'Role' }}</span>
                                <i class="mdi mdi-chevron-down fs-4"></i>
                            </button>
                            <div class="dropdown-menu p-2" style="min-width: 200px;">
                                <a v-for="r in roleOptions" :key="r.key" href="javascript:void(0);"
                                    class="dropdown-item d-flex align-items-center gap-2" :class="{ active: roleFilter === r.key }" @click="setRole(r.key)">
                                    {{ r.label }}
                                    <span v-if="r.count != null" class="ms-auto text-muted small">{{ r.count }}</span>
                                </a>
                            </div>
                        </div>

                        <!-- Status filter -->
                        <div class="position-relative d-none d-lg-flex">
                            <button class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2" type="button"
                                data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="mdi mdi-toggle-switch-outline fs-4"></i>
                                <span>{{ statusFilter ? statusMeta(statusFilter).label : 'Status' }}</span>
                                <i class="mdi mdi-chevron-down fs-4"></i>
                            </button>
                            <div class="dropdown-menu p-2" style="min-width: 180px;">
                                <a v-for="s in statusOptions" :key="s.key" href="javascript:void(0);"
                                    class="dropdown-item d-flex align-items-center gap-2" :class="{ active: statusFilter === s.key }" @click="setStatus(s.key)">
                                    {{ s.label }}
                                    <span v-if="s.count != null" class="ms-auto text-muted small">{{ s.count }}</span>
                                </a>
                            </div>
                        </div>

                        <!-- Columns -->
                        <div class="position-relative d-none d-lg-flex">
                            <button title="Choose the columns to show" class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2"
                                type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="mdi mdi-format-columns fs-4"></i>
                                <span>Columns</span>
                                <i class="mdi mdi-chevron-down fs-4"></i>
                            </button>
                            <div class="dropdown-menu dropdown-menu-end p-3" style="min-width: 200px;">
                                <div v-for="column in allColumns" :key="column.key" class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" :id="`col-${column.key}`" v-model="column.visible" />
                                    <label class="form-check-label" :for="`col-${column.key}`">{{ column.label }}</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- "Showing X of Y" and the filters in use -->
                <div class="card-body py-2 border-bottom d-flex flex-wrap align-items-center gap-2 font-size-13">
                    <div v-if="loading && !staff.length"><SkeletonLoader type="text" :lines="1" height="10px" width="150px" /></div>
                    <span v-else class="text-muted">Showing <span class="fw-bold text-black">{{ staff.length }}</span> of <span class="fw-bold text-black">{{ total }}</span> {{ total === 1 ? 'person' : 'people' }}</span>
                    <template v-if="chips.length">
                        <span class="text-muted">· Filters in use:</span>
                        <span v-for="c in chips" :key="c.key"
                            class="badge rounded-pill bg-primary bg-soft text-primary font-size-12 fw-medium px-2 py-1 d-inline-flex align-items-center gap-1">
                            {{ c.label }}
                            <a href="javascript:void(0);" class="text-primary" :title="`Remove ${c.label}`" @click="c.clear()"><i class="mdi mdi-close"></i></a>
                        </span>
                        <a v-if="chips.length > 1" href="javascript:void(0);" class="ms-1" @click="clearAll">Clear all</a>
                    </template>
                </div>

                <div class="card-body p-0" style="min-height: 55vh;">
                    <!-- Empty state -->
                    <div v-if="!loading && !staff.length" class="text-center p-5">
                        <Icon icon="ri:team-line" class="text-black opacity-25" style="font-size: 120px;" />
                        <h4 class="fw-bold text-dark mb-2">{{ hasFilters ? 'Nobody matches' : 'Just you so far' }}</h4>
                        <p class="text-muted mb-3">{{ hasFilters ? 'Nobody matches your search or filters.' : 'Add your managers, cashiers and waiters so each sale is recorded against the person who made it.' }}</p>
                        <router-link v-if="!hasFilters" to="/staff/add" class="btn btn-primary">Add Staff</router-link>
                    </div>

                    <template v-else>
                        <!-- Tablets and up: the table -->
                        <div class="table-responsive d-none d-md-block">
                            <table class="table verticle-middle table-hover mb-0">
                                <thead class="table-light text-nowrap">
                                    <tr>
                                        <th class="sortable" @click="sort('name')">Person <i v-if="sortBy === 'name'" class="mdi ms-1" :class="sortIcon"></i></th>
                                        <th v-if="col('role')" class="sortable" @click="sort('role')">Role <i v-if="sortBy === 'role'" class="mdi ms-1" :class="sortIcon"></i></th>
                                        <th v-if="col('branches')">Works at</th>
                                        <th v-if="col('phone')">Phone</th>
                                        <th v-if="col('signin')">Signs in with</th>
                                        <th v-if="col('status')" class="sortable" @click="sort('status')">Status <i v-if="sortBy === 'status'" class="mdi ms-1" :class="sortIcon"></i></th>
                                        <th v-if="col('joined')" class="sortable" @click="sort('joined')">Joined <i v-if="sortBy === 'joined'" class="mdi ms-1" :class="sortIcon"></i></th>
                                        <th v-if="col('lastSeen')" class="sortable" @click="sort('last_seen')">Last seen <i v-if="sortBy === 'last_seen'" class="mdi ms-1" :class="sortIcon"></i></th>
                                        <th></th>
                                    </tr>
                                </thead>

                                <!-- Rows -->
                                <tbody v-if="!(loading && page === 1)">
                                    <tr v-for="p in staff" :key="p.id" class="staff-row" @click="openPerson(p)">
                                        <td>
                                            <div class="d-flex gap-2 align-items-center">
                                                <div class="avatar-xs flex-shrink-0">
                                                    <span class="avatar-title rounded-circle fw-semibold font-size-11" :class="ROLE_META[p.role]?.tint || 'bg-light text-muted'">{{ initialsOf(p.name) }}</span>
                                                </div>
                                                <div class="min-w-0">
                                                    <span class="d-block fw-bold text-dark text-truncate">{{ p.name }} <small v-if="isMe(p)" class="text-muted fw-normal">(you)</small></span>
                                                    <span class="text-muted font-size-12 text-truncate d-block">{{ p.email || '—' }}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td v-if="col('role')" class="text-nowrap">
                                            <Icon :icon="ROLE_META[p.role]?.icon" class="me-1 align-middle" /> {{ p.role_label || roleLabel(p.role) }}
                                        </td>
                                        <td v-if="col('branches')" class="text-truncate" style="max-width: 200px;" :title="branchNames(p.branch_scope, branches)">{{ branchNames(p.branch_scope, branches) }}</td>
                                        <td v-if="col('phone')" class="text-nowrap">{{ p.phone }}</td>
                                        <td v-if="col('signin')" class="text-nowrap">
                                            <span v-if="p.can_use_pin"><Icon icon="ri:lock-password-line" class="me-1 align-middle" />PIN</span>
                                            <span v-else-if="p.role === 'owner' || p.role === 'manager'"><Icon icon="ri:key-2-line" class="me-1 align-middle" />Password</span>
                                            <span v-else class="text-muted">No PIN yet</span>
                                        </td>
                                        <td v-if="col('status')">
                                            <span class="badge rounded-pill font-size-12 px-2" :class="statusMeta(p.membership_status).cls">{{ p.membership_status_label || statusMeta(p.membership_status).label }}</span>
                                        </td>
                                        <td v-if="col('joined')" class="text-nowrap" :title="p.joined_at ? formatDateTime(p.joined_at) : ''">{{ p.joined_at ? smartDate(p.joined_at) : '—' }}</td>
                                        <td v-if="col('lastSeen')" class="text-nowrap" :title="p.last_seen_at ? formatDateTime(p.last_seen_at) : ''">{{ p.last_seen_at ? smartDate(p.last_seen_at) : 'Never' }}</td>
                                        <!-- Actions -->
                                        <td @click.stop>
                                            <div class="dropdown">
                                                <a href="javascript:void(0);" title="More actions" class="text-decoration-none text-black waves-effect px-2 rounded font-size-20"
                                                    data-bs-toggle="dropdown"><i class="bx bx-dots-horizontal-rounded"></i></a>
                                                <ul class="dropdown-menu dropdown-menu-end p-2">
                                                    <li><router-link class="dropdown-item d-flex py-2" :to="`/staff/${p.id}`"><Icon icon="ri:information-line" class="me-2 fs-5" /> View details</router-link></li>
                                                    <template v-if="canManage(p)">
                                                        <li><router-link class="dropdown-item d-flex py-2" :to="{ path: `/staff/${p.id}`, query: { tab: 'access' } }"><Icon icon="ri:edit-line" class="me-2 fs-5" /> Edit role &amp; access</router-link></li>
                                                        <li v-if="p.membership_status !== 'suspended'"><a class="dropdown-item d-flex py-2 text-danger" href="javascript:void(0);" @click="ask(p, 'suspend')"><Icon icon="ri:user-forbid-line" class="me-2 fs-5" /> Suspend</a></li>
                                                        <li v-else><a class="dropdown-item d-flex py-2" href="javascript:void(0);" @click="ask(p, 'reactivate')"><Icon icon="ri:user-follow-line" class="me-2 fs-5" /> Reactivate</a></li>
                                                        <li><hr class="dropdown-divider"></li>
                                                        <li><a class="dropdown-item d-flex py-2 text-danger" href="javascript:void(0);" @click="ask(p, 'remove')"><Icon icon="ri:delete-bin-line" class="me-2 fs-5" /> Remove from business</a></li>
                                                    </template>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>

                                <!-- Skeleton rows -->
                                <tbody v-if="loading">
                                    <tr v-for="n in (page === 1 ? 6 : 2)" :key="`sk-${n}`">
                                        <td>
                                            <div class="d-flex align-items-center gap-2">
                                                <SkeletonLoader width="32px" height="32px" />
                                                <div class="d-flex flex-column gap-1"><SkeletonLoader type="text" :lines="1" height="10px" width="120px" /><SkeletonLoader type="text" :lines="1" height="10px" width="90px" /></div>
                                            </div>
                                        </td>
                                        <td v-for="c in visibleCount" :key="c"><SkeletonLoader type="text" :lines="1" height="10px" width="70px" /></td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Phones: cards -->
                        <div class="d-md-none">
                            <template v-if="loading && page === 1">
                                <div v-for="n in 4" :key="`skc-${n}`" class="p-3 border-bottom"><SkeletonLoader type="text" :lines="2" height="12px" /></div>
                            </template>
                            <div v-for="p in staff" :key="`c-${p.id}`" class="staff-card" @click="openPerson(p)">
                                <div class="avatar-sm flex-shrink-0">
                                    <span class="avatar-title rounded-circle fw-semibold" :class="ROLE_META[p.role]?.tint || 'bg-light text-muted'">{{ initialsOf(p.name) }}</span>
                                </div>
                                <div class="flex-grow-1 min-w-0">
                                    <div class="d-flex align-items-center gap-2">
                                        <span class="fw-bold text-dark text-truncate">{{ p.name }}</span>
                                        <span class="badge rounded-pill font-size-11 px-2 ms-auto flex-shrink-0" :class="statusMeta(p.membership_status).cls">{{ statusMeta(p.membership_status).label }}</span>
                                    </div>
                                    <small class="d-block text-muted text-truncate">{{ p.role_label || roleLabel(p.role) }} · {{ branchNames(p.branch_scope, branches) }}</small>
                                    <small class="d-block text-muted">{{ p.phone }} · {{ p.last_seen_at ? `seen ${smartDate(p.last_seen_at)}` : 'never signed in' }}</small>
                                </div>
                            </div>
                        </div>

                        <!-- Load more / the end -->
                        <div class="p-3 text-center">
                            <button v-if="hasMore" class="btn btn-primary" :disabled="loading" @click="loadMore">Load more</button>
                            <p v-else-if="staff.length" class="text-muted mb-0 small"><i class="bx bx-check-circle text-success me-1"></i>Showing all {{ total }} {{ total === 1 ? 'person' : 'people' }}</p>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>

    <!-- Suspend / reactivate / remove -->
    <StaffActionModal ref="actionModal" @done="onActionDone" />

    <ImageToast :status="toastStatus" :title="toastTitle" :message="toastMessage" :image="toastImage"
        :imageHeight="70" @hide="toastStatus = null" />
</template>

<script setup>
// ---------------------------------------------------------------
// Staff.List — everyone who works at this business (owner and manager only).
// Modelled on the console's Team.List.
//
// API: GET /tenant/staff (search, role, status, sort_by, sort_order, page;
// meta.counts feeds the filter counts), GET /tenant/branches (branch names
// for "Works at"). Row actions go through StaffAction.modal (suspend,
// reactivate, remove). The owner and your own row have no actions.
// A row opens Staff.Details (/staff/:id); "Edit" opens it with ?do=edit.
// ---------------------------------------------------------------
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

// API
import StaffAPI from '@/api/staff'
import BranchesAPI from '@/api/branches'

// Components
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue'
import ImageToast from '@/components/ImageToast.vue'
import StaffActionModal from './components/StaffAction.modal.vue'

// Utils
import { formatDateTime, smartDate } from '@/utils/dates'
import { ROLE_META, roleLabel, statusMeta, initialsOf, branchNames } from './helpers/staffMeta'
import { useAuthStore } from '@/stores/auth'
import successImage from '@/assets/images/icons/check.png'
import errorImage from '@/assets/images/icons/error.png'

const router = useRouter()
const authStore = useAuthStore()

// Data
const staff = ref([])
const branches = ref([])
const counts = ref(null)
const loading = ref(false)

// Paging
const page = ref(1)
const lastPage = ref(1)
const total = ref(0)
const hasMore = computed(() => page.value < lastPage.value)

// Filters and sort
const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const sortBy = ref('name')
const sortOrder = ref('asc')
const sortIcon = computed(() => (sortOrder.value === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'))
const hasFilters = computed(() => !!(searchQuery.value.trim() || roleFilter.value || statusFilter.value))

// Columns the person can hide
const allColumns = ref([
    { key: 'role', label: 'Role', visible: true },
    { key: 'branches', label: 'Works at', visible: true },
    { key: 'phone', label: 'Phone', visible: true },
    { key: 'signin', label: 'Signs in with', visible: false },
    { key: 'status', label: 'Status', visible: true },
    { key: 'joined', label: 'Joined', visible: false },
    { key: 'lastSeen', label: 'Last seen', visible: true },
])
const col = (key) => allColumns.value.find((c) => c.key === key)?.visible
const visibleCount = computed(() => allColumns.value.filter((c) => c.visible).length)

// Modal
const actionModal = ref(null)

// Toast
const toastStatus = ref(null)
const toastTitle = ref('')
const toastMessage = ref('')
const toastImage = ref(null)

// ---- Filter options, with counts from meta.counts ----
const roleOptions = computed(() => [
    { key: '', label: 'All roles', count: counts.value?.total ?? null },
    ...['owner', 'manager', 'cashier', 'waiter'].map((k) => ({ key: k, label: ROLE_META[k].label, count: counts.value?.by_role?.[k] ?? null })),
])
const statusOptions = computed(() => [
    { key: '', label: 'Any status', count: null },
    ...['active', 'invited', 'suspended'].map((k) => ({ key: k, label: statusMeta(k).label, count: counts.value?.[k] ?? null })),
])

// "Filters in use"
const chips = computed(() => {
    const out = []
    if (roleFilter.value) out.push({ key: 'role', label: roleLabel(roleFilter.value), clear: () => setRole('') })
    if (statusFilter.value) out.push({ key: 'status', label: statusMeta(statusFilter.value).label, clear: () => setStatus('') })
    if (searchQuery.value.trim()) out.push({ key: 'q', label: `"${searchQuery.value.trim()}"`, clear: () => { searchQuery.value = ''; reload() } })
    return out
})

// ---- Who may act on whom ----
const isMe = (p) => p.user_id === authStore.user?.id
// Nobody acts on the owner or on themselves here (the API refuses the owner anyway)
const canManage = (p) => p.role !== 'owner' && !isMe(p)

// ---- Fetch ----
async function getStaff(more = false) {
    loading.value = true
    try {
        const params = { page: page.value, per_page: 25, sort_by: sortBy.value, sort_order: sortOrder.value }
        if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
        if (roleFilter.value) params.role = roleFilter.value
        if (statusFilter.value) params.status = statusFilter.value
        const { data } = await StaffAPI.list(params)
        staff.value = more ? [...staff.value, ...(data.data || [])] : (data.data || [])
        lastPage.value = data.meta?.last_page || 1
        total.value = data.meta?.total ?? staff.value.length
        counts.value = data.meta?.counts || counts.value
    } catch (error) {
        console.error('Error fetching staff:', error)
        if (!more) staff.value = []
        showError('Could Not Load Staff', error.response?.data?.message || 'Please try again.')
    } finally {
        loading.value = false
    }
}

async function getBranches() {
    try {
        const { data } = await BranchesAPI.list({ include_inactive: 1 })
        branches.value = data.data || []
    } catch (error) {
        // Names fall back to "N branches"; the list still works
        console.error('Error fetching branches:', error)
    }
}

function reload() {
    page.value = 1
    getStaff()
}

function loadMore() {
    if (!hasMore.value || loading.value) return
    page.value++
    getStaff(true)
}

// Search waits for typing to pause
let searchTimer = null
function onSearch() {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(reload, 400)
}

function setRole(key) { roleFilter.value = key; reload() }
function setStatus(key) { statusFilter.value = key; reload() }
function clearAll() { roleFilter.value = ''; statusFilter.value = ''; searchQuery.value = ''; reload() }

// Sorting asks the API again (only one page is loaded)
function sort(field) {
    if (sortBy.value === field) sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    else { sortBy.value = field; sortOrder.value = field === 'name' || field === 'role' ? 'asc' : 'desc' }
    reload()
}

function openPerson(p) {
    router.push(`/staff/${p.id}`)
}

// ---- Suspend / reactivate / remove ----
function ask(p, action) {
    actionModal.value?.open(p, action)
}

function onActionDone({ person, action, data }) {
    if (action === 'remove') {
        staff.value = staff.value.filter((x) => x.id !== person.id)
        total.value = Math.max(0, total.value - 1)
        showToast('Removed', `${person.name} no longer works at this business.`)
    } else {
        const i = staff.value.findIndex((x) => x.id === person.id)
        if (i !== -1 && data) staff.value[i] = data
        showToast(action === 'suspend' ? 'Suspended' : 'Reactivated',
            action === 'suspend' ? `${person.name} can't sign in here until reactivated.` : `${person.name} can sign in again.`)
    }
    // The filter counts changed (and the row may now fall outside a status filter)
    reload()
}

// ---- Toast helpers ----
function showToast(title, message) {
    toastStatus.value = 'success'
    toastTitle.value = title
    toastMessage.value = message
    toastImage.value = successImage
}
function showError(title, message) {
    toastStatus.value = 'error'
    toastTitle.value = title
    toastMessage.value = message
    toastImage.value = errorImage
}

// ---- Lifecycle ----
onMounted(() => {
    getBranches()
    getStaff()
})
onBeforeUnmount(() => clearTimeout(searchTimer))
</script>
