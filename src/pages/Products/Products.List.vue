<template>
    <!-- Page title -->
    <div class="row">
        <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between gap-2">
                <div>
                    <h4 class="mb-sm-0 font-size-18 pb-2">Products &amp; Prices</h4>
                    <div class="page-title-right">
                        <ol class="breadcrumb m-0">
                            <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
                            <li class="breadcrumb-item active">Products &amp; stock</li>
                            <li class="breadcrumb-item active">Products &amp; Prices</li>
                        </ol>
                    </div>
                </div>
                <router-link to="/products/add"
                    class="btn btn-primary d-flex align-items-center justify-content-center gap-2 flex-nowrap text-white">
                    <i class="dripicons-plus fs-4 d-flex"></i>
                    <span class="d-none d-sm-inline">Add Product</span>
                </router-link>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-12">
            <div class="card">
                <!-- Toolbar: refresh, search, status, stock -->
                <div class="card-body border-bottom">
                    <div class="d-flex gap-2 gap-md-3 align-items-center">
                        <div>
                            <button @click="reload()" type="button"
                                class="btn waves-effect btn-lg btn-light position-relative p-0 avatar-sm rounded-circle">
                                <span class="avatar-title bg-transparent text-reset">
                                    <Icon title="Refresh the list" icon="boxicons:refresh-ccw" class="fs-4" />
                                </span>
                            </button>
                        </div>

                        <!-- Search: name, brand, barcode, SKU -->
                        <div class="flex-grow-1" style="min-width: 0;">
                            <div class="search-box mb-0 me-0">
                                <div class="position-relative">
                                    <form @submit.prevent="reload()" class="input-group bg-light rounded pb-0 flex-nowrap">
                                        <div class="flex-grow-1">
                                            <input style="border-radius: 0px; padding-right: 35px;" type="text"
                                                class="form-control bg-light rounded flex-grow-1"
                                                placeholder="Search by name, brand, barcode or SKU..." spellcheck="false"
                                                aria-label="Search products" v-model="searchQuery" @input="onSearch">
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
                            <button type="button" title="Filter the list"
                                class="btn btn-light waves-effect position-relative p-0 avatar-sm rounded-circle"
                                data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                                <span class="avatar-title bg-transparent text-reset"><i class="mdi mdi-filter-variant fs-4"></i></span>
                                <span v-if="statusFilter || stockFilter" class="filter-dot"></span>
                            </button>
                            <div class="dropdown-menu dropdown-menu-end p-2" style="min-width: 220px;">
                                <h6 class="dropdown-header">Selling</h6>
                                <a v-for="s in statusOptions" :key="`m-s-${s.key}`" href="javascript:void(0);" class="dropdown-item"
                                    :class="{ active: statusFilter === s.key }" @click="setStatus(s.key)">{{ s.label }}</a>
                                <div class="dropdown-divider"></div>
                                <h6 class="dropdown-header">Stock</h6>
                                <a v-for="s in stockOptions" :key="`m-k-${s.key}`" href="javascript:void(0);" class="dropdown-item"
                                    :class="{ active: stockFilter === s.key }" @click="setStock(s.key)">{{ s.label }}</a>
                            </div>
                        </div>

                        <!-- Selling filter -->
                        <div class="position-relative d-none d-lg-flex">
                            <button class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2" type="button" data-bs-toggle="dropdown">
                                <i class="mdi mdi-toggle-switch-outline fs-4"></i>
                                <span>{{ statusOptions.find((s) => s.key === statusFilter)?.label || 'Selling' }}</span>
                                <i class="mdi mdi-chevron-down fs-4"></i>
                            </button>
                            <div class="dropdown-menu p-2" style="min-width: 200px;">
                                <a v-for="s in statusOptions" :key="s.key" href="javascript:void(0);"
                                    class="dropdown-item d-flex align-items-center gap-2" :class="{ active: statusFilter === s.key }" @click="setStatus(s.key)">
                                    {{ s.label }}<span v-if="s.count != null" class="ms-auto text-muted small">{{ s.count }}</span>
                                </a>
                            </div>
                        </div>

                        <!-- Stock filter -->
                        <div class="position-relative d-none d-lg-flex">
                            <button class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2" type="button" data-bs-toggle="dropdown">
                                <Icon icon="ri:archive-2-line" class="fs-4" />
                                <span>{{ stockOptions.find((s) => s.key === stockFilter)?.label || 'Stock' }}</span>
                                <i class="mdi mdi-chevron-down fs-4"></i>
                            </button>
                            <div class="dropdown-menu p-2" style="min-width: 180px;">
                                <a v-for="s in stockOptions" :key="s.key" href="javascript:void(0);" class="dropdown-item"
                                    :class="{ active: stockFilter === s.key }" @click="setStock(s.key)">{{ s.label }}</a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- "Showing X of Y" and the filters in use -->
                <div class="card-body py-2 border-bottom d-flex flex-wrap align-items-center gap-2 font-size-13">
                    <div v-if="loading && !products.length"><SkeletonLoader type="text" :lines="1" height="10px" width="150px" /></div>
                    <span v-else class="text-muted">Showing <span class="fw-bold text-black">{{ products.length }}</span> of <span class="fw-bold text-black">{{ total }}</span> products</span>
                    <template v-if="chips.length">
                        <span class="text-muted">· Filters in use:</span>
                        <span v-for="c in chips" :key="c.key"
                            class="badge rounded-pill bg-primary bg-soft text-primary font-size-12 fw-medium px-2 py-1 d-inline-flex align-items-center gap-1">
                            {{ c.label }}
                            <a href="javascript:void(0);" class="text-primary" :title="`Remove ${c.label}`" @click="c.clear()"><i class="mdi mdi-close"></i></a>
                        </span>
                    </template>
                </div>

                <div class="card-body p-0" style="min-height: 55vh;">
                    <!-- Empty state -->
                    <div v-if="!loading && !products.length" class="text-center p-5">
                        <img src="@/assets/images/empty-products.svg" alt="" height="140" class="mb-3 opacity-75">
                        <h4 class="fw-bold text-dark mb-2">{{ hasFilters ? 'Nothing matches' : 'No products yet' }}</h4>
                        <p class="text-muted mb-3">{{ hasFilters ? 'Nothing matches your search or filters.' : 'Scan a barcode and we fill in most of the details. You set the price.' }}</p>
                        <router-link v-if="!hasFilters" to="/products/add" class="btn btn-primary"><i class="mdi mdi-barcode-scan me-1"></i>Add your first product</router-link>
                    </div>

                    <template v-else>
                        <!-- Tablets and up: the table -->
                        <div class="table-responsive d-none d-md-block">
                            <table class="table verticle-middle table-hover mb-0">
                                <thead class="table-light text-nowrap">
                                    <tr>
                                        <th class="sortable" @click="sort('name')">Product <i v-if="sortBy === 'name'" class="mdi ms-1" :class="sortIcon"></i></th>
                                        <th>Category</th>
                                        <th class="sortable text-end" @click="sort('selling_price')">Price <i v-if="sortBy === 'selling_price'" class="mdi ms-1" :class="sortIcon"></i></th>
                                        <th>Packs</th>
                                        <th class="text-end">In stock</th>
                                        <th>Selling</th>
                                        <th class="sortable" @click="sort('created_at')">Added <i v-if="sortBy === 'created_at'" class="mdi ms-1" :class="sortIcon"></i></th>
                                    </tr>
                                </thead>
                                <tbody v-if="!(loading && page === 1)">
                                    <tr v-for="p in products" :key="p.id" class="staff-row" @click="openProduct(p.id)">
                                        <td>
                                            <div class="d-flex gap-2 align-items-center">
                                                <div class="product-photo is-tiny flex-shrink-0">
                                                    <img v-if="p.image_url" :src="p.image_url" alt="" loading="lazy" @error="p.image_url = null">
                                                    <i v-else class="mdi mdi-package-variant-closed"></i>
                                                </div>
                                                <div class="min-w-0">
                                                    <span class="d-block fw-bold text-dark text-truncate" style="max-width: 280px;">{{ p.name }}</span>
                                                    <span class="text-muted font-size-12 text-truncate d-block">{{ [p.brand, p.size_label, p.barcode].filter(Boolean).join(' · ') || '—' }}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="text-truncate" style="max-width: 160px;">{{ p.category?.name || '—' }}</td>
                                        <td class="text-end text-nowrap fw-semibold">{{ money(p.selling_price) }}<small class="text-muted fw-normal"> /{{ unitShort(p.unit) }}</small></td>
                                        <td class="text-nowrap">{{ p.packs?.length ? p.packs.map((k) => k.name).join(', ') : '—' }}</td>
                                        <td class="text-end text-nowrap">
                                            <span v-if="p.total_stock === null" class="text-muted">Not counted</span>
                                            <span v-else :class="stockClass(p)">{{ qty(p.total_stock) }} {{ unitShort(p.unit) }}</span>
                                        </td>
                                        <td><span class="badge rounded-pill font-size-12 px-2" :class="p.is_active ? 'bg-success bg-soft text-success' : 'bg-secondary bg-soft text-secondary'">{{ p.is_active ? 'Selling' : 'Stopped' }}</span></td>
                                        <td class="text-nowrap" :title="p.created_at ? formatDateTime(p.created_at) : ''">{{ p.created_at ? smartDate(p.created_at) : '—' }}</td>
                                    </tr>
                                </tbody>
                                <tbody v-if="loading">
                                    <tr v-for="n in (page === 1 ? 6 : 2)" :key="`sk-${n}`">
                                        <td><div class="d-flex align-items-center gap-2"><SkeletonLoader width="36px" height="36px" /><SkeletonLoader type="text" :lines="1" height="10px" width="140px" /></div></td>
                                        <td v-for="c in 6" :key="c"><SkeletonLoader type="text" :lines="1" height="10px" width="60px" /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Phones: cards -->
                        <div class="d-md-none">
                            <template v-if="loading && page === 1">
                                <div v-for="n in 4" :key="`skc-${n}`" class="p-3 border-bottom"><SkeletonLoader type="text" :lines="2" height="12px" /></div>
                            </template>
                            <div v-for="p in products" :key="`c-${p.id}`" class="staff-card" @click="openProduct(p.id)">
                                <div class="product-photo is-small flex-shrink-0">
                                    <img v-if="p.image_url" :src="p.image_url" alt="" loading="lazy" @error="p.image_url = null">
                                    <i v-else class="mdi mdi-package-variant-closed"></i>
                                </div>
                                <div class="flex-grow-1 min-w-0">
                                    <div class="d-flex align-items-center gap-2">
                                        <span class="fw-bold text-dark text-truncate">{{ p.name }}</span>
                                        <span class="fw-semibold ms-auto flex-shrink-0">{{ money(p.selling_price) }}</span>
                                    </div>
                                    <small class="d-block text-muted text-truncate">{{ p.category?.name || 'No category' }}<template v-if="p.packs?.length"> · {{ p.packs.map((k) => k.name).join(', ') }}</template></small>
                                    <small class="d-block">
                                        <span v-if="!p.is_active" class="text-secondary">Stopped · </span>
                                        <span v-if="p.total_stock === null" class="text-muted">Stock not counted</span>
                                        <span v-else :class="stockClass(p)">{{ qty(p.total_stock) }} {{ unitShort(p.unit) }} in stock</span>
                                    </small>
                                </div>
                            </div>
                        </div>

                        <div class="p-3 text-center">
                            <button v-if="hasMore" class="btn btn-primary" :disabled="loading" @click="loadMore">Load more</button>
                            <p v-else-if="products.length" class="text-muted mb-0 small"><i class="bx bx-check-circle text-success me-1"></i>Showing all {{ total }} {{ total === 1 ? 'product' : 'products' }}</p>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>

    <!-- One product: details, packs, stock per branch, latest movements -->
    <div class="modal fade" id="productDetailModal" tabindex="-1" aria-hidden="true" ref="detailModalEl">
        <div class="modal-dialog modal-lg modal-dialog-scrollable modal-fullscreen-sm-down">
            <div class="modal-content">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title">Product</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <SkeletonLoader v-if="detailLoading && !detail" type="text" :lines="6" height="12px" />
                    <template v-else-if="detail">
                        <!-- Identity -->
                        <div class="d-flex gap-3 align-items-start mb-3">
                            <label class="product-photo flex-shrink-0 cursor-pointer mb-0" title="Change the photo" for="detailPhoto">
                                <img v-if="detail.image_url" :src="detail.image_url" alt="" @error="detail.image_url = null">
                                <i v-else class="mdi mdi-camera-plus-outline"></i>
                                <span v-if="photoSaving" class="product-photo-busy"><span class="spinner-border spinner-border-sm"></span></span>
                            </label>
                            <input id="detailPhoto" type="file" accept="image/*" class="d-none" @change="changePhoto">
                            <div class="min-w-0 flex-grow-1">
                                <h4 class="mb-1 text-dark">{{ detail.name }}</h4>
                                <p class="text-muted mb-2">{{ [detail.brand, detail.size_label, detail.category?.name].filter(Boolean).join(' · ') || 'No category' }}</p>
                                <div class="d-flex flex-wrap gap-2">
                                    <span class="badge rounded-pill font-size-12 px-2" :class="detail.is_active ? 'bg-success bg-soft text-success' : 'bg-secondary bg-soft text-secondary'">{{ detail.is_active ? 'Selling' : 'Stopped' }}</span>
                                    <span class="badge rounded-pill bg-light text-dark font-size-12 px-2">{{ SOURCE_META[detail.lookup_source]?.label || 'Typed in' }}</span>
                                    <span v-if="detail.low_stock" class="badge rounded-pill bg-warning bg-soft text-warning font-size-12 px-2">Low stock</span>
                                </div>
                            </div>
                        </div>

                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="bg-light rounded p-3 h-100">
                                    <h6 class="mb-2">Price</h6>
                                    <div class="detail-line"><span>Selling</span><span>{{ money(detail.selling_price) }} a {{ unitShort(detail.unit) }}</span></div>
                                    <div class="detail-line"><span>Buying</span><span>{{ detail.cost_price != null ? money(detail.cost_price) : '—' }}</span></div>
                                    <div class="detail-line"><span>VAT</span><span>{{ VAT_TYPES.find((v) => v.key === detail.vat_type)?.label || detail.vat_type }}</span></div>
                                    <div class="detail-line"><span>Barcode</span><span>{{ detail.barcode || '—' }}</span></div>
                                    <div v-if="detail.sku" class="detail-line"><span>SKU</span><span>{{ detail.sku }}</span></div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="bg-light rounded p-3 h-100">
                                    <h6 class="mb-2">Stock</h6>
                                    <div v-for="s in detail.stock" :key="s.branch_id" class="detail-line">
                                        <span>{{ s.branch }}<small v-if="s.is_main" class="text-muted"> (main)</small></span>
                                        <span>{{ s.quantity === null ? 'Not counted' : `${qty(s.quantity)} ${unitShort(detail.unit)}` }}<small v-if="s.reorder_point !== null" class="text-muted"> · reorder at {{ qty(s.reorder_point) }}</small></span>
                                    </div>
                                </div>
                            </div>
                            <div v-if="detail.packs?.length" class="col-12">
                                <div class="bg-light rounded p-3">
                                    <h6 class="mb-2">Packs</h6>
                                    <div v-for="k in detail.packs" :key="k.id" class="detail-line">
                                        <span>{{ k.name }} of {{ qty(k.units) }}<small v-if="k.barcode" class="text-muted"> · {{ k.barcode }}</small></span>
                                        <span>{{ money(k.selling_price) }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12">
                                <h6 class="mb-2">Recent stock changes</h6>
                                <p v-if="!detail.movements?.length" class="text-muted small mb-0">No stock changes yet.</p>
                                <div v-for="m in detail.movements" :key="m.id" class="activity-person py-2 border-bottom">
                                    <div class="d-flex justify-content-between gap-2">
                                        <span><span :class="m.quantity < 0 ? 'text-danger' : 'text-success'">{{ m.quantity > 0 ? '+' : '' }}{{ qty(m.quantity) }}</span> {{ m.type_label }}<small v-if="m.notes" class="text-muted"> · {{ m.notes }}</small></span>
                                        <small class="text-muted text-nowrap" :title="formatDateTime(m.at)">{{ smartDate(m.at) }}</small>
                                    </div>
                                    <small class="text-muted">{{ [m.branch, m.by && `by ${m.by}`, m.balance_after !== null && `left ${qty(m.balance_after)}`].filter(Boolean).join(' · ') }}</small>
                                </div>
                            </div>
                        </div>
                        <p class="text-muted small mt-3 mb-0">Added {{ detail.created_at ? formatDateTime(detail.created_at) : '' }}<template v-if="detail.created_by_person"> by {{ detail.created_by_person }}</template>.</p>
                    </template>
                </div>
                <div v-if="detail" class="modal-footer">
                    <button type="button" class="btn me-auto" :class="detail.is_active ? 'btn-outline-danger' : 'btn-outline-success'" :disabled="toggling" @click="toggleSelling">
                        <span v-if="toggling" class="spinner-border spinner-border-sm me-1"></span>{{ detail.is_active ? 'Stop selling' : 'Start selling again' }}
                    </button>
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>

    <ImageToast :status="toastStatus" :title="toastTitle" :message="toastMessage" :image="toastImage"
        :imageHeight="70" @hide="toastStatus = null" />
</template>

<script setup>
// ---------------------------------------------------------------
// Products.List — the business's own products and prices (owner, manager).
// Built like Staff.List: toolbar, "Showing X of Y", a table on tablets and
// cards on phones, Load more.
//
// API: GET /tenant/products (q, is_active, stock low|out, sort_by,
// sort_order, page; meta.counts), GET /tenant/products/{id} (the modal),
// PATCH /tenant/products/{id} (stop / start selling),
// POST /tenant/products/{id}/image (tap the photo in the modal).
// ?open={id} opens a product straight away (used by "View product" on the
// barcode lookup and by "Add & view" on Products.Add).
// ---------------------------------------------------------------
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// API
import ProductsAPI from '@/api/products'

// Components
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue'
import ImageToast from '@/components/ImageToast.vue'

// Utils
import { formatDateTime, smartDate } from '@/utils/dates'
import { VAT_TYPES, SOURCE_META, unitShort, money } from './helpers/productMeta'
import successImage from '@/assets/images/icons/check.png'
import errorImage from '@/assets/images/icons/error.png'

const route = useRoute()
const router = useRouter()

// Data
const products = ref([])
const counts = ref(null)
const loading = ref(false)

// Paging
const page = ref(1)
const lastPage = ref(1)
const total = ref(0)
const hasMore = computed(() => page.value < lastPage.value)

// Filters and sort
const searchQuery = ref('')
const statusFilter = ref('')     // '' | 'active' | 'stopped'
const stockFilter = ref('')      // '' | 'low' | 'out'
const sortBy = ref('name')
const sortOrder = ref('asc')
const sortIcon = computed(() => (sortOrder.value === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'))
const hasFilters = computed(() => !!(searchQuery.value.trim() || statusFilter.value || stockFilter.value))

// The modal
const detailModalEl = ref(null)
const detail = ref(null)
const detailLoading = ref(false)
const toggling = ref(false)
const photoSaving = ref(false)

// Toast
const toastStatus = ref(null)
const toastTitle = ref('')
const toastMessage = ref('')
const toastImage = ref(null)

// ---- Filter options ----
const statusOptions = computed(() => [
    { key: '', label: 'All products', count: counts.value?.all ?? null },
    { key: 'active', label: 'Selling', count: counts.value?.active ?? null },
    { key: 'stopped', label: 'Stopped', count: counts.value ? counts.value.all - counts.value.active : null },
])
const stockOptions = [
    { key: '', label: 'Any stock' },
    { key: 'low', label: 'Low stock' },
    { key: 'out', label: 'Out of stock' },
]
const chips = computed(() => {
    const out = []
    if (statusFilter.value) out.push({ key: 's', label: statusOptions.value.find((s) => s.key === statusFilter.value)?.label, clear: () => setStatus('') })
    if (stockFilter.value) out.push({ key: 'k', label: stockOptions.find((s) => s.key === stockFilter.value)?.label, clear: () => setStock('') })
    if (searchQuery.value.trim()) out.push({ key: 'q', label: `"${searchQuery.value.trim()}"`, clear: () => { searchQuery.value = ''; reload() } })
    return out
})

// ---- Small formatters ----
const qty = (n) => Number(n).toLocaleString('en-KE', { maximumFractionDigits: 3 })
const stockClass = (p) => (p.total_stock <= 0 ? 'text-danger fw-semibold' : p.low_stock ? 'text-warning fw-semibold' : '')

// ---- Fetch ----
async function getProducts(more = false) {
    loading.value = true
    try {
        const params = { page: page.value, per_page: 25, sort_by: sortBy.value, sort_order: sortOrder.value }
        if (searchQuery.value.trim()) params.q = searchQuery.value.trim()
        if (statusFilter.value) params.is_active = statusFilter.value === 'active' ? 1 : 0
        if (stockFilter.value) params.stock = stockFilter.value
        const { data } = await ProductsAPI.list(params)
        products.value = more ? [...products.value, ...(data.data || [])] : (data.data || [])
        lastPage.value = data.meta?.last_page || 1
        total.value = data.meta?.total ?? products.value.length
        counts.value = data.meta?.counts || counts.value
    } catch (error) {
        console.error('Error fetching products:', error)
        if (!more) products.value = []
        showError('Could Not Load Products', error.response?.data?.message || 'Please try again.')
    } finally {
        loading.value = false
    }
}

function reload() {
    page.value = 1
    getProducts()
}
function loadMore() {
    page.value++
    getProducts(true)
}

// Search as you type, after a short pause
let searchTimer = null
function onSearch() {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(reload, 350)
}

function setStatus(key) { statusFilter.value = key; reload() }
function setStock(key) { stockFilter.value = key; reload() }
function sort(key) {
    if (sortBy.value === key) sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    else { sortBy.value = key; sortOrder.value = key === 'created_at' ? 'desc' : 'asc' }
    reload()
}

// ---- One product ----
async function openProduct(id) {
    detail.value = null
    detailLoading.value = true
    bootstrap.Modal.getOrCreateInstance(detailModalEl.value).show()
    try {
        const { data } = await ProductsAPI.get(id)
        detail.value = data.data
    } catch (error) {
        console.error('Error fetching the product:', error)
        bootstrap.Modal.getOrCreateInstance(detailModalEl.value).hide()
        showError('Could Not Open Product', error.response?.data?.message || 'Please try again.')
    } finally {
        detailLoading.value = false
    }
}

// Put the fresh copy back into the list too
function replaceRow(row) {
    detail.value = row
    const i = products.value.findIndex((p) => p.id === row.id)
    if (i > -1) products.value[i] = { ...products.value[i], ...row }
}

async function toggleSelling() {
    toggling.value = true
    try {
        const { data } = await ProductsAPI.update(detail.value.id, { is_active: !detail.value.is_active })
        replaceRow(data.data)
        showToast(data.data.is_active ? 'Selling Again' : 'Stopped Selling',
            data.data.is_active ? `${data.data.name} is back on the counter.` : `${data.data.name} no longer shows at the counter. Its history is kept.`)
    } catch (error) {
        console.error('Error updating the product:', error)
        showError('Could Not Save', error.response?.data?.message || 'Please try again.')
    } finally {
        toggling.value = false
    }
}

async function changePhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return showError('Photo Too Big', 'Choose a photo under 2 MB.')
    photoSaving.value = true
    try {
        const { data } = await ProductsAPI.uploadImage(detail.value.id, file)
        replaceRow(data.data)
        showToast('Photo Saved', 'The new photo shows on the counter and in this list.')
    } catch (error) {
        console.error('Error uploading the photo:', error)
        showError('Photo Not Saved', error.response?.data?.errors?.file?.[0] || error.response?.data?.message || 'Please try again.')
    } finally {
        photoSaving.value = false
    }
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

onMounted(() => {
    getProducts()
    // ?open=id (from the lookup's "View product" or Add & view)
    if (route.query.open) {
        openProduct(String(route.query.open))
        if (route.query.added) showToast('Product Added', 'It is ready to sell.')
        router.replace({ query: {} })
    }
})

onBeforeUnmount(() => {
    clearTimeout(searchTimer)
    if (detailModalEl.value) bootstrap.Modal.getInstance(detailModalEl.value)?.dispose()
    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove())
})
</script>
