<template>
    <!-- Page Title -->
    <div class="row">
        <div class="col-12">
            <div class="page-title-box d-sm-flex align-items-center justify-content-between">
                <div>
                    <h4 class="mb-sm-0 font-size-18 pb-2">Add Product</h4>
                    <div class="page-title-right">
                        <ol class="breadcrumb m-0">
                            <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
                            <li class="breadcrumb-item"><router-link to="/products">Products &amp; Prices</router-link></li>
                            <li class="breadcrumb-item active">Add</li>
                        </ol>
                    </div>
                </div>
                <span v-if="addedCount" class="badge rounded-pill bg-success bg-soft text-success font-size-13 px-3 py-2">
                    <i class="mdi mdi-check-all me-1"></i>{{ addedCount }} added this session
                </span>
            </div>
        </div>
    </div>

    <div class="row justify-content-center">
        <div class="col-12">
            <div class="card" style="min-height: 76vh;">
                <div class="card-body p-3 p-sm-5 justify-content-center d-flex" :class="[showInputs ? '' : 'hero-gradient hero-gradient2', searching ? 'loading-gradient' : '']">
                    <div class="row w-100">
                        <div class="d-flex flex-column align-items-center pt-4 pb-3">
                            <!-- Title: the lookup first, then the form -->
                            <div class="col-sm-12 col-md-8 col-lg-6 text-center">
                                <div class="mb-4 opacity-25"><img class="img" src="@/assets/images/logo.svg" alt="" height="70"></div>
                                <template v-if="!showInputs">
                                    <h4 class="card-title fs-1 mb-4 fw-bold text-black">Scan a barcode to add a product</h4>
                                    <p class="fs-5 text-muted">
                                        We check your shop, the PaySol catalogue and Open Food Facts, and fill in the name, brand,
                                        size and photo when we find it. You set the price.
                                    </p>
                                </template>
                                <template v-else>
                                    <h4 class="card-title fs-1 mb-3 fw-bold text-black">New Product Registration</h4>
                                    <p class="fs-5 text-muted">{{ introText }}</p>
                                </template>
                            </div>

                            <!-- The barcode box (hidden while adding an item with no barcode) -->
                            <div class="col-sm-12 col-md-11 col-lg-9 col-xl-8" :class="showInputs ? 'mt-1' : 'mt-5'">
                                <BarcodeLookup v-show="!noBarcode" ref="lookupRef" class="mb-4" @result="onLookup" @reset="onLookupReset"
                                    @error="showError" />

                                <template v-if="!showInputs">
                                    <div class="text-center">
                                        <div class="d-flex align-items-center mt-4 mb-3 opacity-50">
                                            <hr class="flex-grow-1 text-muted bg-dark opacity-25">
                                            <span class="px-3 text-dark fw-bold">OR</span>
                                            <hr class="flex-grow-1 text-muted bg-dark opacity-25">
                                        </div>
                                        <button @click="withoutBarcode()" type="button" class="btn btn-link btn-rounded waves-effect btn-lg fw-semibold">
                                            + Add Product Without Barcode
                                        </button>
                                    </div>
                                </template>
                                <div v-else-if="noBarcode" class="text-center mb-3">
                                    <button type="button" class="btn btn-link waves-effect" @click="backToScan()"><i class="mdi mdi-barcode-scan me-1"></i>It has a barcode after all</button>
                                </div>
                            </div>

                            <!-- ================= The form ================= -->
                            <div v-if="showInputs" class="col-12 col-xl-11 animate__animated animate__fadeInUp animate__faster">
                                <form @submit.prevent="save('next')" novalidate>
                                    <!-- !!saving: Vue treats disabled="" as on, and saving is '' when idle -->
                                    <fieldset :disabled="!!saving" class="row">
                                        <!-- Left: the details -->
                                        <div class="col-lg-8 mb-3">
                                            <!-- Basic information -->
                                            <div class="bg-light rounded p-4 mb-3">
                                                <h4 class="card-title mb-3">Basic Information</h4>
                                                <div class="d-flex flex-wrap gap-3 mb-3">
                                                    <!-- Photo: upload, or take one on a phone -->
                                                    <div class="product-photo flex-shrink-0">
                                                        <img v-if="photoPreview" :src="photoPreview" alt="">
                                                        <img v-else-if="suggestedImage" :src="suggestedImage" alt="" class="is-suggested" @error="suggestedImage = ''">
                                                        <i v-else class="mdi mdi-image-outline"></i>
                                                    </div>
                                                    <div class="d-flex flex-column justify-content-center gap-2">
                                                        <div class="d-flex flex-wrap gap-2">
                                                            <label class="btn btn-white waves-effect mb-0" for="productPhotoUpload"><i class="mdi mdi-upload me-1"></i>Upload photo</label>
                                                            <label class="btn btn-white waves-effect mb-0" for="productPhotoCamera"><i class="mdi mdi-camera-outline me-1"></i>Take photo</label>
                                                            <button v-if="photoFile" type="button" class="btn btn-link text-danger px-1" @click="clearPhoto">Remove</button>
                                                        </div>
                                                        <input id="productPhotoUpload" type="file" accept="image/png,image/jpeg,image/webp" class="d-none" @change="pickPhoto">
                                                        <input id="productPhotoCamera" type="file" accept="image/*" capture="environment" class="d-none" @change="pickPhoto">
                                                        <small class="text-muted">
                                                            {{ photoFile ? photoFile.name : suggestedImage && lookupSourceIsOpen ? `The photo shown is from ${sourceLabel} and is not saved. Take your own.` : 'Optional. PNG, JPG or WebP up to 2 MB.' }}
                                                        </small>
                                                        <small v-if="errors.file" class="text-danger">{{ errors.file }}</small>
                                                    </div>
                                                </div>

                                                <div class="row g-3">
                                                    <!-- Name -->
                                                    <div class="col-12">
                                                        <label class="form-label" for="productName">Product name <span class="text-danger">*</span></label>
                                                        <input id="productName" ref="nameRef" v-model.trim="form.name" type="text" maxlength="200" class="form-control"
                                                            :class="{ 'is-invalid': errors.name }" placeholder="e.g. Tusker Lager 500ml, Nyama choma (kg)">
                                                        <div class="invalid-feedback">{{ errors.name }}</div>
                                                    </div>
                                                    <!-- Category -->
                                                    <div class="col-md-7">
                                                        <label class="form-label">Category <span class="text-muted">(optional)</span></label>
                                                        <SelectSearchBox v-model="form.category_id" :options="categoryOptions" placeholder="e.g. Beer, Soft drinks, Meat"
                                                            input-class="form-control form-select" />
                                                        <small v-if="errors.category_id" class="text-danger">{{ errors.category_id }}</small>
                                                    </div>
                                                    <!-- Sold by -->
                                                    <div class="col-md-5">
                                                        <label class="form-label d-block">Sold by</label>
                                                        <div class="d-flex flex-wrap gap-2">
                                                            <button v-for="u in UNITS" :key="u.key" type="button" class="pack-chip" :class="{ 'is-on': form.unit === u.key }"
                                                                @click="form.unit = u.key">{{ u.label }}</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Pricing and stock -->
                                            <div class="bg-light rounded p-4 mb-3">
                                                <h4 class="card-title mb-3">Price &amp; Stock</h4>
                                                <div class="row g-3">
                                                    <div class="col-sm-4">
                                                        <label class="form-label" for="productPrice">Selling price <span class="text-danger">*</span></label>
                                                        <div class="input-group">
                                                            <span class="input-group-text">KSh</span>
                                                            <input id="productPrice" ref="priceRef" v-model="form.selling_price" type="number" min="0" step="any" inputmode="decimal"
                                                                class="form-control" :class="{ 'is-invalid': errors.selling_price }" placeholder="0">
                                                        </div>
                                                        <small class="text-muted">per {{ unitWord }}</small>
                                                        <small v-if="errors.selling_price" class="text-danger d-block">{{ errors.selling_price }}</small>
                                                    </div>
                                                    <div class="col-sm-4">
                                                        <label class="form-label" for="productCost">Buying price <span class="text-muted">(optional)</span></label>
                                                        <div class="input-group">
                                                            <span class="input-group-text">KSh</span>
                                                            <input id="productCost" v-model="form.cost_price" type="number" min="0" step="any" inputmode="decimal" class="form-control" placeholder="0">
                                                        </div>
                                                        <small v-if="margin !== null" class="text-muted">Margin {{ margin }}%</small>
                                                    </div>
                                                    <div class="col-sm-4">
                                                        <label class="form-label" for="productOpening">Stock now <span class="text-muted">(optional)</span></label>
                                                        <div class="input-group">
                                                            <input id="productOpening" v-model="form.opening_stock" type="number" min="0" step="any" inputmode="decimal" class="form-control"
                                                                :class="{ 'is-invalid': errors.opening_stock || errors.branch_id }" placeholder="0">
                                                            <span class="input-group-text">{{ unitShort(form.unit) }}</span>
                                                        </div>
                                                        <small class="text-muted">{{ branches.length > 1 ? `at ${branchName}` : 'counted in ' + unitWord + 's' }}</small>
                                                        <small v-if="errors.branch_id" class="text-danger d-block">{{ errors.branch_id }}</small>
                                                    </div>
                                                    <!-- VAT -->
                                                    <div class="col-12">
                                                        <label class="form-label d-block">VAT</label>
                                                        <div class="d-flex flex-wrap align-items-center gap-2">
                                                            <button v-for="v in VAT_TYPES" :key="v.key" type="button" class="pack-chip" :class="{ 'is-on': form.vat_type === v.key }"
                                                                @click="form.vat_type = v.key">{{ v.label }}</button>
                                                            <small v-if="form.vat_type === 'standard_16' && Number(form.selling_price)" class="text-muted ms-sm-2">
                                                                Price includes KSh {{ vatInside(form.selling_price, form.vat_type).toLocaleString('en-KE') }} VAT
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Packs -->
                                            <div class="bg-light rounded p-4 mb-3">
                                                <h4 class="card-title mb-1">Sold in packs <span class="text-muted font-size-13 fw-normal">(optional)</span></h4>
                                                <p class="text-muted small mb-3">Sell the same stock by the box, carton or crate. Stock is counted in {{ unitWord }}s; selling a crate of 24 takes 24 off.</p>
                                                <PackRows v-model="form.packs" :unit-label="`${capital(unitWord)}s`" :unit-price="form.selling_price" :errors="rawErrors" id="addPacks" />
                                            </div>

                                            <!-- More details (folded) -->
                                            <div class="bg-light rounded p-4">
                                                <a href="javascript:void(0);" class="d-flex align-items-center text-dark" @click="showMore = !showMore">
                                                    <h4 class="card-title mb-0 flex-grow-1">More details</h4>
                                                    <small class="text-muted me-2">{{ moreSummary }}</small>
                                                    <i class="mdi fs-4" :class="showMore ? 'mdi-chevron-up' : 'mdi-chevron-down'"></i>
                                                </a>
                                                <div v-show="showMore" class="row g-3 mt-1">
                                                    <div class="col-md-6">
                                                        <label class="form-label" for="productBrand">Brand</label>
                                                        <input id="productBrand" v-model.trim="form.brand" maxlength="120" class="form-control" placeholder="e.g. EABL, Brookside">
                                                    </div>
                                                    <div class="col-md-6">
                                                        <label class="form-label" for="productSize">Size</label>
                                                        <input id="productSize" v-model.trim="form.size_label" maxlength="50" class="form-control" placeholder="e.g. 500 ml, 1 kg">
                                                    </div>
                                                    <div class="col-12">
                                                        <label class="form-label" for="productDesc">Description</label>
                                                        <textarea id="productDesc" v-model.trim="form.description" rows="2" maxlength="2000" class="form-control" placeholder="Anything staff should know"></textarea>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <label class="form-label" for="productBarcode">Barcode</label>
                                                        <input id="productBarcode" v-model.trim="form.barcode" class="form-control" :class="{ 'is-invalid': errors.barcode }" inputmode="numeric"
                                                            :placeholder="noBarcode ? (form.generate_barcode ? 'A PaySol code will be made' : 'None') : ''">
                                                        <div class="invalid-feedback">{{ errors.barcode }}</div>
                                                        <div v-if="noBarcode && !form.barcode" class="form-check mt-2">
                                                            <input id="productGenCode" v-model="form.generate_barcode" class="form-check-input" type="checkbox">
                                                            <label class="form-check-label" for="productGenCode">Make a PaySol code I can print on a label</label>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <label class="form-label" for="productSku">SKU / your own code</label>
                                                        <input id="productSku" v-model.trim="form.sku" maxlength="60" class="form-control" placeholder="Optional">
                                                    </div>
                                                    <div class="col-md-6">
                                                        <label class="form-label" for="productReorder">Reorder when stock reaches</label>
                                                        <div class="input-group">
                                                            <input id="productReorder" v-model="form.reorder_level" type="number" min="0" step="any" class="form-control" placeholder="e.g. 12">
                                                            <span class="input-group-text">{{ unitShort(form.unit) }}</span>
                                                        </div>
                                                    </div>
                                                    <div v-if="branches.length > 1" class="col-md-6">
                                                        <label class="form-label" for="productBranch">Stock is at</label>
                                                        <select id="productBranch" v-model="form.branch_id" class="form-select">
                                                            <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}{{ b.is_main ? ' (main)' : '' }}</option>
                                                        </select>
                                                    </div>
                                                    <div class="col-12">
                                                        <label class="form-label" for="productKeywords">Search words</label>
                                                        <input id="productKeywords" v-model="keywordsText" class="form-control" placeholder="Other names people use, separated by commas: e.g. baridi, lager">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Right: summary and save -->
                                        <div class="col-lg-4">
                                            <div class="card border shadow-none product-add-summary mb-0">
                                                <div class="card-body">
                                                    <h4 class="card-title mb-3">Summary</h4>
                                                    <div class="d-flex align-items-center gap-3 mb-3">
                                                        <div class="product-photo is-small flex-shrink-0">
                                                            <img v-if="photoPreview || suggestedImage" :src="photoPreview || suggestedImage" alt="">
                                                            <i v-else class="mdi mdi-package-variant-closed"></i>
                                                        </div>
                                                        <div class="min-w-0">
                                                            <div class="fw-semibold text-dark text-truncate">{{ form.name || 'New product' }}</div>
                                                            <small class="text-muted">{{ money(form.selling_price || null) }} a {{ unitWord }}<template v-if="form.packs.length"> · {{ form.packs.length }} {{ form.packs.length === 1 ? 'pack' : 'packs' }}</template></small>
                                                        </div>
                                                    </div>

                                                    <div class="detail-line"><span>Details from</span><span>{{ sourceLabel }}</span></div>
                                                    <div class="detail-line"><span>Barcode</span><span>{{ form.barcode || (noBarcode && form.generate_barcode ? 'PaySol code' : 'None') }}</span></div>
                                                    <div class="detail-line"><span>Stock now</span><span>{{ Number(form.opening_stock) ? `${form.opening_stock} ${unitShort(form.unit)}` : 'Not counted yet' }}</span></div>

                                                    <div v-if="willPropose" class="legal-note is-info mt-3">
                                                        PaySol doesn't know this barcode yet. Saving shares the name and category with the PaySol catalogue (checked by our team), so the next shop that scans it gets it filled in. Your price stays yours.
                                                    </div>

                                                    <div class="d-grid gap-2 mt-4">
                                                        <button type="submit" class="btn btn-primary waves-effect waves-light">
                                                            <span v-if="saving === 'next'" class="spinner-border spinner-border-sm me-1"></span>
                                                            <i v-else class="mdi mdi-plus me-1"></i>Add &amp; next
                                                        </button>
                                                        <button type="button" class="btn btn-white waves-effect" @click="save('view')">
                                                            <span v-if="saving === 'view'" class="spinner-border spinner-border-sm me-1"></span>Add &amp; view product
                                                        </button>
                                                        <button type="button" class="btn btn-link text-muted" @click="startOver()">Start over</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <ImageToast :status="toastStatus" :title="toastTitle" :message="toastMessage" :image="toastImage"
        :imageHeight="70" @hide="toastStatus = null" />
</template>

<script setup>
// ---------------------------------------------------------------
// Products.Add — add a product, barcode first (owner, manager).
//
// Kelvin's console page (Products.POS.add.vue) moved to the business app on
// 12 Nov 2026 and updated with what we learnt from Kaunta POS:
//   1. Scan (Barcode.Lookup): your shop → PaySol catalogue → Open Food Facts.
//      "You already sell this" stops a duplicate before any typing.
//   2. The form, short: photo (upload or camera), name, category, Sold by;
//      selling / buying / stock in one row; VAT chips; packs inline with an
//      optional barcode each; the rest folded under More details.
//   3. Add & next keeps the form going (category, VAT and unit stay), puts the
//      cursor back in the barcode box and counts what was added.
//
// API: GET /tenant/products/lookup, GET /tenant/products/categories,
// GET /tenant/branches, POST /tenant/products, POST /tenant/products/{id}/image.
// A typed-in item with a real barcode and a category is proposed to the
// shared catalogue by the API (unchecked) unless the person turns it off.
// ---------------------------------------------------------------
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

// API
import ProductsAPI from '@/api/products'
import BranchesAPI from '@/api/branches'

// Components
import BarcodeLookup from './components/Barcode.Lookup.vue'
import PackRows from '@/components/Data-tools/Pack.Rows.vue'
import SelectSearchBox from '@/components/SelectSearchBox.vue'
import ImageToast from '@/components/ImageToast.vue'

// Utils
import { UNITS, VAT_TYPES, SOURCE_META, unitShort, vatInside, money } from './helpers/productMeta'
import successImage from '@/assets/images/icons/check.png'
import errorImage from '@/assets/images/icons/error.png'

const router = useRouter()

// Page state
const lookupRef = ref(null)
const nameRef = ref(null)
const priceRef = ref(null)
const showInputs = ref(false)
const noBarcode = ref(false)
const searching = ref(false)
const saving = ref('')            // '' | 'next' | 'view'
const showMore = ref(false)
const addedCount = ref(0)
const lookup = ref(null)          // the API's lookup answer

// Data for the pickers
const categories = ref([])
const branches = ref([])

// The form
const blankForm = () => ({
    name: '', category_id: null, unit: 'piece',
    selling_price: '', cost_price: '', opening_stock: '', vat_type: 'standard_16',
    packs: [], brand: '', size_label: '', description: '', barcode: '', sku: '',
    reorder_level: '', branch_id: null, generate_barcode: true,
    catalogue_product_id: null, lookup_source: 'manual',
})
const form = reactive(blankForm())
const keywordsText = ref('')
const rawErrors = ref({})          // the API's 422 errors as sent (packs.0.barcode…)
const errors = computed(() => Object.fromEntries(Object.entries(rawErrors.value).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))

// Photo
const photoFile = ref(null)
const photoPreview = ref('')
const suggestedImage = ref('')

// Toast
const toastStatus = ref(null)
const toastTitle = ref('')
const toastMessage = ref('')
const toastImage = ref(null)

// ---- Derived ----
const categoryOptions = computed(() => categories.value.map((c) => ({ label: c.path, value: c.id })))
const unitWord = computed(() => ({ piece: 'piece', kg: 'kilo', litre: 'litre', metre: 'metre' }[form.unit] || 'piece'))
const branchName = computed(() => branches.value.find((b) => b.id === form.branch_id)?.name || 'the main branch')
const margin = computed(() => {
    const p = Number(form.selling_price)
    const c = Number(form.cost_price)
    return p > 0 && c > 0 ? Math.round(((p - c) / p) * 1000) / 10 : null
})
const sourceLabel = computed(() => SOURCE_META[form.lookup_source]?.label || 'Typed in')
const lookupSourceIsOpen = computed(() => String(form.lookup_source).startsWith('open'))
const introText = computed(() => {
    if (noBarcode.value) return 'No barcode: fill in the details. PaySol can make a code for you to print on a label.'
    if (lookup.value?.source === 'catalogue') return 'Found in the PaySol catalogue. Check the details, then set your price.'
    if (lookupSourceIsOpen.value) return `Found on ${sourceLabel.value}. Check the details, then set your price.`
    return 'Not found anywhere yet. Fill in the details below to register it.'
})
// The API proposes a real, unknown barcode with a category to the catalogue
const willPropose = computed(() => !form.catalogue_product_id && !!form.category_id && /^\d{8}$|^\d{12,14}$/.test(form.barcode || '') && !/^2\d{12}$/.test(form.barcode))
const moreSummary = computed(() => [form.brand, form.size_label, form.sku && `SKU ${form.sku}`].filter(Boolean).join(' · ') || 'brand, size, codes, reorder level')
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// ---- Loading the pickers ----
async function getCategories() {
    try {
        const { data } = await ProductsAPI.categories()
        categories.value = data.data || []
    } catch (error) {
        console.error('Error fetching categories:', error)
    }
}
async function getBranches() {
    try {
        const { data } = await BranchesAPI.list()
        branches.value = data.data || []
        form.branch_id = branches.value[0]?.id || null       // the main branch comes first
    } catch (error) {
        console.error('Error fetching branches:', error)
    }
}

// ---- The lookup's answer fills the form ----
async function onLookup(r) {
    lookup.value = r
    if (!r.valid || r.source === 'shop') {
        showInputs.value = false
        return
    }
    const keep = { category_id: form.category_id, vat_type: form.vat_type, unit: form.unit, branch_id: form.branch_id }
    Object.assign(form, blankForm(), keep)
    keywordsText.value = ''
    rawErrors.value = {}
    clearPhoto()
    suggestedImage.value = ''
    noBarcode.value = false
    form.barcode = r.barcode
    form.lookup_source = r.source === 'none' ? 'manual' : r.source

    const s = r.suggestion
    if (s) {
        form.name = s.name || ''
        form.brand = s.brand || ''
        form.size_label = s.size_label || ''
        form.category_id = s.category?.id ?? keep.category_id
        form.unit = s.unit || 'piece'
        form.catalogue_product_id = s.catalogue_product_id
        keywordsText.value = (s.keywords || []).join(', ')
        suggestedImage.value = s.image_url || ''
        // Scanned a crate: the product is the bottle, and the scanned code is the crate's
        if (s.pack) {
            form.barcode = s.product_barcode || ''
            form.packs = [{ _key: Date.now(), name: s.pack.name, units: s.pack.units, selling_price: '', cost_price: '', barcode: s.pack.barcode }]
        }
    }
    showInputs.value = true
    await nextTick()
    // Found: the price is what's left. Not found: start with the name
    ;(s ? priceRef.value : nameRef.value)?.focus()
}

function onLookupReset() {
    lookup.value = null
    if (!noBarcode.value) showInputs.value = false
}

// ---- No barcode ----
async function withoutBarcode() {
    const keep = { category_id: form.category_id, vat_type: form.vat_type, unit: form.unit, branch_id: form.branch_id }
    Object.assign(form, blankForm(), keep)
    keywordsText.value = ''
    rawErrors.value = {}
    clearPhoto()
    suggestedImage.value = ''
    lookup.value = null
    noBarcode.value = true
    showInputs.value = true
    await nextTick()
    nameRef.value?.focus()
}
function backToScan() {
    noBarcode.value = false
    showInputs.value = false
    lookupRef.value?.reset(true)
}
function startOver() {
    noBarcode.value = false
    showInputs.value = false
    lookupRef.value?.reset(true)
}

// ---- Photo ----
function pickPhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
        rawErrors.value = { ...rawErrors.value, file: ['That photo is over 2 MB. Choose a smaller one.'] }
        return
    }
    photoFile.value = file
    photoPreview.value = URL.createObjectURL(file)
}
function clearPhoto() {
    if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
    photoFile.value = null
    photoPreview.value = ''
}

// ---- Checks before sending (the API checks again) ----
function validate() {
    const e = {}
    if (!form.name) e.name = ['Enter the product name.']
    if (form.selling_price === '' || Number(form.selling_price) < 0) e.selling_price = ['Enter the selling price.']
    form.packs.forEach((p, i) => {
        if (!p.name) e[`packs.${i}.name`] = ['Each pack needs a name.']
        if (!(Number(p.units) > 1)) e[`packs.${i}.units`] = ['A pack holds more than one.']
        if (p.selling_price === '' || Number(p.selling_price) < 0) e[`packs.${i}.selling_price`] = ['Each pack needs a price.']
    })
    rawErrors.value = e
    return !Object.keys(e).length
}

// ---- Save ----
async function save(after) {
    if (saving.value || !validate()) return
    saving.value = after
    try {
        const num = (v) => (v === '' || v === null ? undefined : Number(v))
        const body = {
            name: form.name,
            selling_price: Number(form.selling_price),
            cost_price: num(form.cost_price),
            unit: form.unit,
            vat_type: form.vat_type,
            category_id: form.category_id || undefined,
            barcode: form.barcode || undefined,
            generate_barcode: noBarcode.value && !form.barcode ? !!form.generate_barcode : undefined,
            opening_stock: num(form.opening_stock),
            reorder_level: num(form.reorder_level),
            branch_id: (num(form.opening_stock) || num(form.reorder_level) !== undefined) ? (form.branch_id || undefined) : undefined,
            brand: form.brand || undefined,
            size_label: form.size_label || undefined,
            description: form.description || undefined,
            sku: form.sku || undefined,
            keywords: keywordsText.value.split(',').map((w) => w.trim()).filter((w) => w.length >= 2),
            catalogue_product_id: form.catalogue_product_id || undefined,
            lookup_source: form.lookup_source,
            packs: form.packs.map((p) => ({
                name: p.name, units: Number(p.units), selling_price: Number(p.selling_price),
                cost_price: num(p.cost_price), barcode: p.barcode || undefined,
            })),
        }
        const { data } = await ProductsAPI.create(body)
        const product = data.data

        // The photo goes up after the product exists; a failed upload keeps the product
        if (photoFile.value) {
            try {
                await ProductsAPI.uploadImage(product.id, photoFile.value)
            } catch (error) {
                console.error('Error uploading the photo:', error)
                showError('Photo Not Saved', 'The product was added, but its photo could not be saved. Add it from the product.')
            }
        }

        addedCount.value++
        if (after === 'view') {
            router.push({ path: '/products', query: { open: product.id, added: '1' } })
            return
        }
        showToast('Product Added', `${product.name} is ready to sell${product.proposed_to_catalogue ? ' and was shared with the PaySol catalogue' : ''}.`)
        // Add & next: keep the category, VAT, unit and branch; back to the barcode box
        const keep = { category_id: form.category_id, vat_type: form.vat_type, unit: form.unit, branch_id: form.branch_id }
        Object.assign(form, blankForm(), keep)
        keywordsText.value = ''
        clearPhoto()
        suggestedImage.value = ''
        showMore.value = false
        showInputs.value = false
        noBarcode.value = false
        lookupRef.value?.reset(true)
    } catch (error) {
        console.error('Error adding the product:', error)
        if (error.response?.status === 422) {
            rawErrors.value = error.response.data.errors || {}
            // A problem in a folded field: open the fold
            if (['barcode', 'sku', 'reorder_level', 'branch_id'].some((k) => rawErrors.value[k])) showMore.value = true
        } else {
            showError('Could Not Add Product', error.response?.data?.message || 'Please try again.')
        }
    } finally {
        saving.value = ''
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
    getCategories()
    getBranches()
})
</script>
