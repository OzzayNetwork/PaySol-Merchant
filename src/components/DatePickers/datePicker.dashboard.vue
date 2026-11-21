<script setup>
// ---------------------------------------------------------------
// datePicker.dashboard — the dashboard's two header buttons:
//
//   [Last 30 days: Oct 11 – Nov 9  v]   [chart  View by Day  v]
//
// Dates (9 Nov 2026, Kelvin: "make it behave exactly like the one in the
// Messages page"): the console's shared picker, datePicker.facebookstyle.vue,
// as it is on Messages, Activity Log and Change History: the same trigger,
// presets with radio dots, "Custom →" with the range calendar, Back / Apply.
// It replaced this component's own calendar and preset list.
//
// View by: Hour / Day / Week / Month. One that does not fit the range is
// greyed with its rule ("Up to 7 days"). When the range changes, the best fit
// is picked unless the viewer chose one that still fits. "Compare with the
// period before" (it used to sit under the date presets) is the switch at the
// foot of this menu. Look: custom.css 32.
//
// v-model:dateFrom / v-model:dateTo (Date), v-model:grain ('hour'|'day'|
// 'week'|'month'|null = best fit), v-model:compare (Boolean).
// Props: autoGrain (what the server chose while `grain` is null, so the button
// says it); minDate is kept for callers but the shared picker has no floor.
// Emits `change` once after any choice, so the page fetches once.
// ---------------------------------------------------------------

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import DateRangePicker from '@/components/DatePickers/datePicker.facebookstyle.vue'

const props = defineProps({
    dateFrom: { type: Date, required: true },
    dateTo: { type: Date, required: true },
    grain: { type: String, default: null },
    compare: { type: Boolean, default: true },
    minDate: { type: Date, default: null },
    autoGrain: { type: String, default: null },   // the grain the server picked when `grain` is null
})
const emit = defineEmits(['update:dateFrom', 'update:dateTo', 'update:grain', 'update:compare', 'change'])

// ---- Days in a range (local days; the API reads them as Nairobi dates) ----
const DAY = 864e5
const dayOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const daysIn = (a, b) => Math.round((dayOnly(b) - dayOnly(a)) / DAY) + 1

// ---- Dates: the shared picker ----
// It emits dateFrom then dateTo for every choice; the page fetches once, after dateTo.
// Re-keyed when the dates change from outside (a shared link, Back) so its label follows.
const pickerKey = computed(() => `${dayOnly(props.dateFrom).getTime()}-${dayOnly(props.dateTo).getTime()}`)
let pendingFrom = null
function onFrom(d) { pendingFrom = dayOnly(d) }
function onTo(d) {
    const a = pendingFrom || dayOnly(props.dateFrom)
    const b = dayOnly(d)
    pendingFrom = null
    emit('update:dateFrom', a)
    emit('update:dateTo', b)
    // Keep the viewer's grain if it still fits; otherwise back to the best fit
    if (props.grain && !fits(props.grain, daysIn(a, b))) emit('update:grain', null)
    emit('change')
}

// ---- View by (the API enforces the same rules) ----
const GRAINS = [
    ['hour', 'Hour', (d) => d <= 7, 'Up to 7 days'],
    ['day', 'Day', (d) => d <= 366, 'Up to a year'],
    ['week', 'Week', (d) => d >= 14, 'From 14 days'],
    ['month', 'Month', (d) => d >= 60, 'From 60 days'],
]
const bestGrain = (d) => (d <= 2 ? 'hour' : d <= 92 ? 'day' : 'week')
const fits = (g, d) => GRAINS.find((x) => x[0] === g)?.[2](d)
const days = computed(() => daysIn(props.dateFrom, props.dateTo))
// The viewer's pick when it fits; else what the server chose (autoGrain); else our best guess
const activeGrain = computed(() => {
    if (props.grain && fits(props.grain, days.value)) return props.grain
    if (props.autoGrain && fits(props.autoGrain, days.value)) return props.autoGrain
    return bestGrain(days.value)
})
const grainLabel = computed(() => GRAINS.find((g) => g[0] === activeGrain.value)[1])

// ---- The View by menu: open / closed ----
const grainWrap = ref(null)
const open = ref(false)
function close() { open.value = false }
function onDocClick(e) { if (open.value && grainWrap.value && !grainWrap.value.contains(e.target)) close() }
function onKey(e) { if (e.key === 'Escape' && open.value) close() }
onMounted(() => { document.addEventListener('click', onDocClick); document.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onKey) })

function pickGrain(g) {
    if (!g[2](days.value)) return
    if (g[0] === activeGrain.value) { close(); return }
    emit('update:grain', g[0])
    close()
    emit('change')
}

function onCompare(e) {
    emit('update:compare', e.target.checked)
    emit('change')
}
</script>

<template>
    <div class="d-flex gap-2 flex-shrink-0 align-items-center">
        <!-- ===== Dates: the shared picker, exactly as on Messages ===== -->
        <!-- variant="header": the white button with the calendar icon (outline / fill), only the icon on phones -->
        <DateRangePicker :key="pickerKey" :dateFrom="dateFrom" :dateTo="dateTo" variant="header"
            @update:dateFrom="onFrom" @update:dateTo="onTo" />

        <!-- ===== View by, and Compare at its foot ===== -->
        <div ref="grainWrap" class="dp-wrap">
            <button
                type="button"
                class="btn btn-white header-btn d-flex align-items-center justify-content-center gap-2 flex-nowrap"
                aria-haspopup="menu"
                :aria-expanded="open"
                title="Show the chart by hour, day, week or month, and compare with the period before"
                :aria-label="`View by ${grainLabel}`"
                @click="open = !open"
            >
                <Icon :icon="open ? 'ri:bar-chart-2-fill' : 'ri:bar-chart-2-line'" class="fs-4 d-flex" />
                <span class="d-none d-lg-inline text-muted">View by</span>
                <span class="d-none d-sm-inline fw-semibold">{{ grainLabel }}</span>
                <i class="mdi mdi-chevron-down d-none d-sm-inline"></i>
            </button>
            <div v-if="open" class="dropdown-menu dropdown-menu-end dp-grain-menu" role="menu">
                <h6 class="dropdown-header">View by</h6>
                <button
                    v-for="g in GRAINS"
                    :key="g[0]"
                    type="button"
                    class="dropdown-item d-flex justify-content-between align-items-center gap-3"
                    :class="{ active: activeGrain === g[0] }"
                    :disabled="!g[2](days)"
                    role="menuitemradio"
                    :aria-checked="activeGrain === g[0]"
                    @click="pickGrain(g)"
                >
                    <span>{{ g[1] }}</span>
                    <i v-if="g[2](days) && activeGrain === g[0]" class="mdi mdi-check"></i>
                    <span v-else-if="!g[2](days)" class="small text-muted">{{ g[3] }}</span>
                </button>
                <div class="dropdown-divider"></div>
                <div class="form-check form-switch mb-0 px-3 py-1 ms-2">
                    <input id="dpCompare" class="form-check-input" type="checkbox" :checked="compare" @change="onCompare">
                    <label class="form-check-label text-nowrap" for="dpCompare">Compare with the period before</label>
                </div>
            </div>
        </div>
    </div>
</template>
