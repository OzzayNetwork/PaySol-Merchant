<template>
    <!-- Skeleton (AGENTS.md 6.9): placeholder rows while the first counts load, never dashes -->
    <template v-if="loading && !facets.categories">
        <div v-for="(n, s) in [10, 4, 4]" :key="`sk-sec-${s}`" class="card-body px-3 pb-2" :class="{ 'border-top-soft': s }">
            <SkeletonLoader type="text" :lines="1" height="9px" width="70px" />
            <div v-for="i in n" :key="`sk-${s}-${i}`" class="d-flex align-items-center gap-2 py-2">
                <SkeletonLoader type="circle" width="18px" height="18px" />
                <SkeletonLoader type="text" :lines="1" height="10px" width="55%" />
                <span class="ms-auto"><SkeletonLoader type="rectangle" width="26px" height="16px" /></span>
            </div>
        </div>
    </template>

    <template v-else>
    <!-- Category: menu rows with an icon (outline idle, filled chosen) and a count pill -->
    <div class="card-body px-2 pb-2">
        <p class="filter-list-title">Category</p>
        <button v-for="c in categoryRows" :key="c.key" type="button" class="filter-list-item" :class="{ active: category === c.key }"
            :aria-pressed="category === c.key" :title="CATEGORY_HINT[c.key]" @click="pickCategory(c.key)">
            <Icon :icon="category === c.key ? meta(c.key).iconActive : meta(c.key).icon" class="fs-4 flex-shrink-0" />
            <span class="text-truncate">{{ c.label }}</span>
            <span v-if="c.planned" class="badge badge-soft-secondary font-size-10 ms-1">Soon</span>
            <span v-else class="count" :class="c.key === 'security' && c.count ? 'bg-danger bg-soft text-danger' : 'bg-light text-body'">{{ fmt(c.count) }}</span>
        </button>
    </div>

    <!-- The chosen category's types (coloured dots) -->
    <div v-if="types.length" class="card-body px-2 pb-2 border-top-soft">
        <div class="d-flex align-items-center justify-content-between">
            <p class="filter-list-title">Type</p>
            <a v-if="type" href="javascript:void(0);" class="font-size-12 pe-3 pb-2" @click="emit('update:type', '')">Clear</a>
        </div>
        <button v-for="(t, i) in types" :key="t.key" type="button" class="filter-list-item" :class="{ active: type === t.key }"
            :aria-pressed="type === t.key" :disabled="t.planned" @click="emit('update:type', type === t.key ? '' : t.key)">
            <span class="filter-list-icon-box fs-4"><span class="filter-list-dot" :style="{ backgroundColor: TYPE_DOTS[i % TYPE_DOTS.length] }"></span></span>
            <span class="text-truncate">{{ t.label }}<template v-if="t.planned"> (soon)</template></span>
            <span v-if="!t.planned" class="count text-muted fw-normal">{{ fmt(t.count) }}</span>
        </button>
    </div>

    <!-- Result -->
    <div class="card-body px-2 pb-2 border-top-soft">
        <div class="d-flex align-items-center justify-content-between">
            <p class="filter-list-title">Result</p>
            <a v-if="result" href="javascript:void(0);" class="font-size-12 pe-3 pb-2" @click="emit('update:result', '')">Clear</a>
        </div>
        <button v-for="r in facets.results || []" :key="r.key" type="button" class="filter-list-item" :class="{ active: result === r.key }"
            :aria-pressed="result === r.key" @click="emit('update:result', result === r.key ? '' : r.key)">
            <span class="filter-list-icon-box fs-4"><span class="filter-list-dot" :style="{ backgroundColor: RESULT_META[r.key]?.dot }"></span></span>
            <span class="text-truncate">{{ RESULT_META[r.key]?.label || r.label }}</span>
            <span class="count text-muted fw-normal">{{ fmt(r.count) }}</span>
        </button>
    </div>

    <!-- Who did it -->
    <div class="card-body px-2 pb-2 border-top-soft">
        <div class="d-flex align-items-center justify-content-between">
            <p class="filter-list-title">Who</p>
            <a v-if="actor" href="javascript:void(0);" class="font-size-12 pe-3 pb-2" @click="emit('update:actor', '')">Clear</a>
        </div>
        <button v-for="a in facets.actors || []" :key="a.key" type="button" class="filter-list-item" :class="{ active: actor === a.key }"
            :aria-pressed="actor === a.key" @click="emit('update:actor', actor === a.key ? '' : a.key)">
            <Icon :icon="actor === a.key ? ACTOR_META[a.key]?.iconActive : ACTOR_META[a.key]?.icon" class="fs-4 flex-shrink-0" />
            <span class="text-truncate">{{ ACTOR_META[a.key]?.label || a.label }}</span>
            <span class="count text-muted fw-normal">{{ fmt(a.count) }}</span>
        </button>
    </div>

    </template>

    <!-- Security, last 24 hours: square bars against the alert points (skeleton bars while they load) -->
    <div v-if="summaryLoading && !securityBars.length" class="card-footer bg-tint-light border-top-soft d-flex flex-column gap-3 py-3">
        <SkeletonLoader type="text" :lines="1" height="9px" width="140px" />
        <div v-for="i in 3" :key="`sk-bar-${i}`">
            <div class="d-flex justify-content-between mb-2">
                <SkeletonLoader type="text" :lines="1" height="9px" width="90px" />
                <SkeletonLoader type="text" :lines="1" height="9px" width="60px" />
            </div>
            <SkeletonLoader type="rectangle" width="100%" height="6px" />
        </div>
    </div>
    <div v-else-if="securityBars.length" class="card-footer bg-tint-light border-top-soft d-flex flex-column gap-3 py-3 activity-security">
        <p class="filter-list-title mb-0 ps-0">Security, last 24 hours</p>
        <div v-for="b in securityBars" :key="b.key" class="usage-meter">
            <div class="d-flex justify-content-between font-size-12 mb-1">
                <span class="text-black fw-medium">{{ b.label }}</span>
                <span class="text-muted"><strong :class="`text-${b.tone}`">{{ b.value }}</strong> · alert at {{ b.alert_at }}</span>
            </div>
            <div class="progress"><div class="progress-bar" :class="`bg-${b.tone}`" :style="{ width: `${b.pct}%` }"></div></div>
        </div>
        <router-link to="/site-identity/alert-rules" class="font-size-12 fw-semibold">Security alert rules →</router-link>
    </div>
</template>

<script setup>
// ---------------------------------------------------------------
// ActivityFilterList — the Activity log's left card (9 Nov 2026): Category,
// the category's Types, Result, Who, and "Security, last 24 hours".
// Counts come from the list's `facets` (each counted without its own filter,
// so a number says what clicking it would show). Used in the page's sticky
// left card and, on phones and tablets, in the Filters panel.
//
// Props:  facets (from GET /activity), summary (from /activity/summary, for
//         the security bars; optional), loading / summaryLoading (skeletons
//         instead of dashes, AGENTS.md 6.9), category, type, result, actor
// Emits:  update:category (also clears the type), update:type,
//         update:result, update:actor
// ---------------------------------------------------------------
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue'
import { CATEGORY_META, CATEGORY_HINT, TYPE_DOTS, RESULT_META, ACTOR_META } from '../helpers/activityMeta'

const props = defineProps({
    facets: { type: Object, default: () => ({}) },
    summary: { type: Object, default: null },
    loading: { type: Boolean, default: false },          // the list (and its counts) is loading
    summaryLoading: { type: Boolean, default: false },   // the security bars are loading
    category: { type: String, default: '' },
    type: { type: String, default: '' },
    result: { type: String, default: '' },
    actor: { type: String, default: '' },
})
const emit = defineEmits(['update:category', 'update:type', 'update:result', 'update:actor'])

const meta = (key) => CATEGORY_META[key] || CATEGORY_META.all
const fmt = (n) => (n === undefined || n === null ? '–' : Number(n).toLocaleString('en-KE'))

// "All activity" first, then the API's categories in its order
const categoryRows = computed(() => [
    { key: '', label: 'All activity', count: props.facets.total, planned: false },
    ...(props.facets.categories || []),
].map((c) => ({ ...c, key: c.key || '' })))

// CATEGORY_META is keyed 'all' for the empty key
function pickCategory(key) {
    emit('update:category', key)
}

const types = computed(() => (props.facets.categories || []).find((c) => c.key === props.category)?.types || [])

// The three bars, toned by how close they are to their alert point
const securityBars = computed(() => {
    const s = props.summary?.security
    if (!s) return []
    return Object.entries(s).map(([key, b]) => ({
        key, ...b,
        pct: Math.min(100, b.alert_at ? (b.value / b.alert_at) * 100 : 0),
        tone: b.level === 'alert' ? 'danger' : b.level === 'watch' ? 'warning' : 'info',
    }))
})
</script>
