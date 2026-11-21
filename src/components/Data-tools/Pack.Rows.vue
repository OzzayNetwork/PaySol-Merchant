<template>
    <!-- Packs: the same stock sold by the box, carton or crate -->
    <div class="pack-rows">
        <div v-for="(p, i) in modelValue" :key="p._key" class="pack-row">
            <div class="row g-2 align-items-end">
                <div class="col-sm-6 col-lg-3">
                    <label class="form-label small mb-1" :for="`${id}-name-${i}`">Pack</label>
                    <input :id="`${id}-name-${i}`" :value="p.name" class="form-control" :class="{ 'is-invalid': err(i, 'name') }" placeholder="e.g. Crate"
                        maxlength="40" :disabled="disabled" @input="set(i, 'name', $event.target.value)">
                </div>
                <div class="col-6 col-sm-3 col-lg-2">
                    <label class="form-label small mb-1" :for="`${id}-units-${i}`">{{ unitLabel }} in it</label>
                    <input :id="`${id}-units-${i}`" :value="p.units" type="number" min="2" step="any" inputmode="decimal" class="form-control"
                        :class="{ 'is-invalid': err(i, 'units') }" placeholder="24" :disabled="disabled" @input="set(i, 'units', $event.target.value)">
                </div>
                <div class="col-6 col-sm-3 col-lg-2">
                    <label class="form-label small mb-1" :for="`${id}-price-${i}`">Pack price</label>
                    <input :id="`${id}-price-${i}`" :value="p.selling_price" type="number" min="0" step="any" inputmode="decimal" class="form-control"
                        :class="{ 'is-invalid': err(i, 'selling_price') }" placeholder="KSh" :disabled="disabled" @input="set(i, 'selling_price', $event.target.value)">
                </div>
                <div class="col-6 col-sm-4 col-lg-2">
                    <label class="form-label small mb-1" :for="`${id}-cost-${i}`">Buying <span class="text-muted">(opt.)</span></label>
                    <input :id="`${id}-cost-${i}`" :value="p.cost_price" type="number" min="0" step="any" inputmode="decimal" class="form-control"
                        :disabled="disabled" placeholder="KSh" @input="set(i, 'cost_price', $event.target.value)">
                </div>
                <div class="col-6 col-sm-6 col-lg-2">
                    <label class="form-label small mb-1" :for="`${id}-code-${i}`">Barcode <span class="text-muted">(opt.)</span></label>
                    <input :id="`${id}-code-${i}`" :value="p.barcode" class="form-control" :class="{ 'is-invalid': err(i, 'barcode') }" inputmode="numeric"
                        placeholder="Crates have one" :disabled="disabled" @input="set(i, 'barcode', $event.target.value)">
                </div>
                <div class="col-sm-2 col-lg-1 d-flex">
                    <button type="button" class="btn btn-soft-danger waves-effect ms-auto" title="Remove this pack" :disabled="disabled" @click="remove(i)">
                        <i class="mdi mdi-delete-outline"></i>
                    </button>
                </div>
            </div>

            <!-- Quick names, and what the pack works out to -->
            <div class="d-flex flex-wrap align-items-center gap-2 mt-2">
                <button v-for="n in PACK_NAMES" :key="n" type="button" class="pack-chip" :class="{ 'is-on': p.name === n }"
                    :disabled="disabled" @click="pickName(i, n)">{{ n }}</button>
                <small v-if="perUnit(p)" class="text-muted ms-auto">{{ perUnit(p) }}</small>
            </div>
            <small v-for="m in messages(i)" :key="m" class="text-danger d-block mt-1">{{ m }}</small>
        </div>

        <button type="button" class="btn btn-link px-0 fw-semibold" :disabled="disabled || modelValue.length >= 10" @click="add">
            <i class="mdi mdi-plus"></i> {{ modelValue.length ? 'Add another pack' : 'Add a pack (box, carton, crate…)' }}
        </button>
    </div>
</template>

<script setup>
// ---------------------------------------------------------------
// Pack.Rows — packs on the same product (12 Nov 2026), from Kaunta POS's
// inline packs plus a barcode per pack (crates carry their own codes).
// Stock is counted in the product's unit; selling one pack takes `units` off.
//
// Props: modelValue ([{ name, units, selling_price, cost_price, barcode }]),
// unitLabel ("Pieces", "Kilos"…), unitPrice (the product's price, for the
// "KSh 75 a piece, saves KSh 120" line), errors (the API's 422 errors, keys
// like packs.0.barcode), disabled, id. Emits update:modelValue.
// Styles: custom.css (.pack-row, .pack-chip).
// ---------------------------------------------------------------
import { PACK_NAMES, PACK_DEFAULT_UNITS } from '@/pages/Products/helpers/productMeta'

const props = defineProps({
    modelValue: { type: Array, default: () => [] },
    unitLabel: { type: String, default: 'Pieces' },
    unitPrice: { type: [Number, String], default: null },
    errors: { type: Object, default: () => ({}) },
    disabled: { type: Boolean, default: false },
    id: { type: String, default: 'packs' },
})
const emit = defineEmits(['update:modelValue'])

let keySeq = 0
const blank = () => ({ _key: ++keySeq, name: '', units: '', selling_price: '', cost_price: '', barcode: '' })

function update(next) { emit('update:modelValue', next) }
function set(i, field, value) {
    update(props.modelValue.map((p, j) => (j === i ? { ...p, [field]: value } : p)))
}
function add() { update([...props.modelValue, blank()]) }
function remove(i) { update(props.modelValue.filter((_, j) => j !== i)) }

// A quick name also fills a usual size when none is typed yet
function pickName(i, name) {
    const p = props.modelValue[i]
    update(props.modelValue.map((x, j) => (j === i ? { ...x, name, units: x.units || PACK_DEFAULT_UNITS[name] || '' } : x)))
    if (!p.units) return
}

// "KSh 75 a piece · saves KSh 120 on 24"
function perUnit(p) {
    const units = Number(p.units)
    const price = Number(p.selling_price)
    if (!units || units < 2 || !price) return ''
    const each = price / units
    const unitWord = props.unitLabel.replace(/s$/, '').toLowerCase()
    let line = `KSh ${each.toLocaleString('en-KE', { maximumFractionDigits: 2 })} a ${unitWord}`
    const single = Number(props.unitPrice)
    if (single && single * units > price) line += ` · saves KSh ${(single * units - price).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`
    return line
}

// The API's messages for this row (packs.{i}.field)
function err(i, field) { return !!props.errors[`packs.${i}.${field}`] }
function messages(i) {
    return Object.entries(props.errors).filter(([k]) => k.startsWith(`packs.${i}.`)).map(([, v]) => (Array.isArray(v) ? v[0] : v))
}
</script>
