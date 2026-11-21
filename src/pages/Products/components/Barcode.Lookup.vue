<template>
    <div class="position-relative">
        <!-- The barcode box: a scanner types the code and presses Enter by itself -->
        <form @submit.prevent="search()" class="pb-0" :id="formId">
            <fieldset :disabled="searching" class="input-group flex-nowrap">
                <div class="flex-grow-1 position-relative">
                    <i style="position: absolute; left: 25px; top: 8px; bottom: 15px;" class="mdi-barcode-scan mdi search-icon fs-3 opacity-50"></i>
                    <input ref="inputRef" style="padding-left: 55px; border-radius: 640px;" type="text" inputmode="numeric"
                        class="form-control flex-grow-1 form-control-lg" placeholder="Scan or type the barcode" required
                        spellcheck="false" autocomplete="off" aria-label="Barcode" v-model="barcode">

                    <div style="position: absolute; top: 7px; right: 8px;" class="d-flex gap-2">
                        <!-- Clear -->
                        <button v-if="barcode && !searching" type="button" title="Clear" class="btn btn-light btn-rounded waves-effect px-2" @click="reset(true)">
                            <i class="mdi mdi-close fs-6"></i>
                        </button>
                        <!-- Search -->
                        <button type="submit" style="height: 2.3rem; width: 2.3rem;" title="Look it up"
                            class="btn btn-primary waves-light position-relative p-0 avatar-xs rounded-circle btn-lg d-flex align-items-center justify-content-center">
                            <span v-if="!searching" class="avatar-title bg-transparent text-reset"><i class="bx bx-search fs-4"></i></span>
                            <span v-else class="spinner-border spinner-border-sm" role="status"></span>
                        </button>
                    </div>
                </div>
            </fieldset>
        </form>

        <!-- Where the lookup has got to: Your shop → PaySol catalogue → Open Food Facts -->
        <div class="lookup-steps mt-3" :class="{ 'ai-shimmer-text': searching }">
            <template v-for="(s, i) in LOOKUP_STEPS" :key="s.key">
                <span class="lookup-step" :class="stepState(s.key)">
                    <Icon :icon="stepIcon(s.key)" /> {{ s.label }}
                </span>
                <i v-if="i < LOOKUP_STEPS.length - 1" class="mdi mdi-chevron-right text-muted"></i>
            </template>
        </div>

        <div class="px-md-4 mt-3">
            <!-- Mistyped (the last digit doesn't match) -->
            <div v-if="result && !result.valid" class="gap-3 alert animate__animated animate__fadeInUp animate__fast alert-danger rounded border-danger-subtle d-flex flex-wrap flex-sm-nowrap align-items-center mb-3 p-3" role="alert">
                <span class="mdi mdi-barcode-off fs-1 text-dark"></span>
                <span class="flex-grow-1">
                    <span class="fw-semibold text-black fs-6">That barcode doesn't look right.</span><br>
                    <span class="text-muted">The last digit of <strong>{{ result.barcode }}</strong> doesn't match. Scan it again or check the number.</span>
                </span>
                <button type="button" class="btn btn-outline-danger waves-effect text-nowrap" @click="reset(true)">Try again</button>
            </div>

            <!-- Already in this shop: never a second row for one code -->
            <div v-else-if="result?.source === 'shop'" class="gap-3 alert animate__animated animate__fadeInUp animate__fast alert-warning rounded border-warning-subtle d-flex flex-wrap flex-sm-nowrap align-items-center mb-3 p-3" role="alert">
                <span class="mdi mdi-alert-circle-outline fs-1 text-dark"></span>
                <span class="flex-grow-1">
                    <span class="fw-semibold text-black fs-6">You already sell this.</span><br>
                    <span class="text-muted">
                        <template v-if="result.existing.pack">It's the <strong>{{ result.existing.pack.name }}</strong> of </template>
                        <strong>{{ result.existing.name }}</strong> ({{ money(result.existing.selling_price) }})<span v-if="!result.existing.is_active">, which is hidden from the counter</span>.
                        Change its price or stock there instead of adding it twice.
                    </span>
                </span>
                <div class="d-flex flex-wrap gap-2">
                    <router-link :to="`/products?open=${result.existing.id}`" class="btn btn-dark waves-effect text-nowrap">View product</router-link>
                    <button type="button" class="btn btn-white waves-effect text-nowrap" @click="reset(true)">Scan another</button>
                </div>
            </div>

            <!-- Matched: PaySol catalogue or an Open Facts database -->
            <div v-else-if="result?.suggestion" class="gap-3 alert animate__animated animate__fadeInUp animate__fast alert-info rounded border-info-subtle d-flex align-items-center mb-3 p-3" role="alert">
                <img v-if="result.suggestion.image_url" :src="result.suggestion.image_url" alt="" class="rounded bg-white" style="width: 56px; height: 56px; object-fit: contain;" @error="result.suggestion.image_url = null">
                <span v-else :class="`mdi ${result.source === 'catalogue' ? 'mdi-check-decagram' : 'mdi-cloud-check'} fs-1 text-dark`"></span>
                <span class="flex-grow-1">
                    <span class="fw-semibold text-black fs-6">Product matched.</span>
                    <span class="badge rounded-pill ms-1" :class="result.source === 'catalogue' ? (result.verified ? 'bg-primary' : 'bg-primary bg-soft text-primary') : 'bg-info bg-soft text-info'">
                        {{ result.source === 'catalogue' ? (result.verified ? 'Verified by PaySol' : 'PaySol catalogue, not yet verified') : `From ${result.source_label}, please check` }}
                    </span><br>
                    <span class="text-muted">
                        <strong>{{ result.suggestion.name }}</strong><span v-if="result.suggestion.size_label"> · {{ result.suggestion.size_label }}</span>
                        <template v-if="result.suggestion.pack"> · this code is its <strong>{{ result.suggestion.pack.name }} of {{ result.suggestion.pack.units }}</strong></template>.
                        The details are filled in below; check them before saving.
                    </span>
                </span>
            </div>

            <!-- Nowhere -->
            <div v-else-if="result?.source === 'none'" class="gap-3 alert animate__animated animate__fadeInUp animate__fast alert-secondary rounded border-secondary-subtle d-flex flex-wrap flex-sm-nowrap align-items-center mb-3 p-3" role="alert">
                <span class="mdi mdi-magnify-scan fs-1 text-dark"></span>
                <span class="flex-grow-1">
                    <span class="fw-semibold text-black fs-6">No match found.</span><br>
                    <span class="text-muted">
                        <template v-if="result.in_store_code"><strong>{{ result.barcode }}</strong> is a shop's own code, so only your shop could know it. </template>
                        <template v-else>We checked your shop, the PaySol catalogue and Open Food Facts for <strong>{{ result.barcode }}</strong>. </template>
                        Fill in the details below; the next shop that scans it will get them.
                    </span>
                </span>
                <button type="button" class="btn btn-outline-secondary waves-effect text-nowrap" @click="search()">Retry</button>
            </div>
        </div>
    </div>
</template>

<script setup>
// ---------------------------------------------------------------
// Barcode.Lookup — the barcode box at the top of Add Product (12 Nov 2026).
// Ported from the console's Products.POS.scan.barcode.vue (Kelvin's design:
// the pill box, the scan icon, the shimmering line and the three alerts) and
// moved to the server: one call, GET /tenant/products/lookup, which asks this
// shop, then the PaySol catalogue, then the Open Facts databases.
//
// Emits `result` with the API's answer (data), `reset` when cleared.
// Exposes focus(), reset(), search(code).
// ---------------------------------------------------------------
import { Icon } from '@iconify/vue'
import { ref, onMounted } from 'vue'
import ProductsAPI from '@/api/products'
import { LOOKUP_STEPS, money } from '../helpers/productMeta'

const props = defineProps({
    formId: { type: String, default: 'barcodeLookupForm' },
})
const emit = defineEmits(['result', 'reset', 'error'])

const inputRef = ref(null)
const barcode = ref('')
const searching = ref(false)
const result = ref(null)

// ---- The step line ----
// shop / catalogue / open: done (checked, not found there), found, or waiting
function checkedOpen() {
    return (result.value?.checked || []).some((c) => c.startsWith('open'))
}
function stepState(key) {
    const r = result.value
    if (searching.value) return 'is-busy'
    if (!r || !r.valid) return ''
    const found = r.source === key || (key === 'open' && r.source.startsWith('open'))
    if (found) return 'is-found'
    const checked = key === 'open' ? checkedOpen() : r.checked.includes(key)
    return checked ? 'is-done' : 'is-skipped'
}
function stepIcon(key) {
    const s = stepState(key)
    return s === 'is-found' ? 'ri:checkbox-circle-fill' : s === 'is-done' ? 'ri:close-circle-line' : 'ri:checkbox-blank-circle-line'
}

// ---- Search ----
async function search(code) {
    if (code !== undefined) barcode.value = String(code)
    const value = barcode.value.trim()
    if (!value) return
    searching.value = true
    result.value = null
    try {
        const { data } = await ProductsAPI.lookup(value)
        result.value = data.data
        emit('result', data.data)
    } catch (error) {
        console.error('Error looking up the barcode:', error)
        emit('error', 'Lookup Failed', error.response?.status === 429
            ? 'Too many lookups in a minute. Wait a moment and try again.'
            : (error.response?.data?.message || 'Please try again.'))
    } finally {
        searching.value = false
    }
}

function reset(focus = false) {
    barcode.value = ''
    result.value = null
    emit('reset')
    if (focus) setTimeout(() => inputRef.value?.focus(), 50)
}

function focus() {
    inputRef.value?.focus()
}

onMounted(focus)

defineExpose({ focus, reset, search })
</script>
