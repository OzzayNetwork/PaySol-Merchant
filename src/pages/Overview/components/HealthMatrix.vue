<script setup>
// ---------------------------------------------------------------
// HealthMatrix — "Business health & lifecycle" on the Overview, laid out as
// the V11 design (docs/paysol-operations-overview-v11.html, renderMatrix):
//
//   Business health & lifecycle  [N businesses] [Live]      Spotlight (top 4) · Healthy (12) · …
//   x live, y setting up, z suspended.
//   ┌ Live business health ─────────────┐ ┌ Lifecycle status ───────┐
//   │ ███████████░░░░  (healthy/att/dgr) │ │ Live          12  [60%] │
//   │ [Healthy] [Attention] [Danger zone]│ │ Setting up     6  [30%] │
//   └────────────────────────────────────┘ │ Suspended      2  [10%] │
//   Spotlight businesses (top priority)          View all N in Tenants →
//   [spot card] [spot card] [spot card] [spot card]
//
// Presentational: the page fetches GET /admin/overview/businesses (tenants.view)
// and passes counts and the chosen group's rows in. Every bar part, tier and
// lifecycle row switches the group (emits update:group); a spot card emits
// `open` with its row (the page shows the business's "More info" pop-up).
// The status tabs show their counts in brackets, as V11 does.
//
// Emits: update:group, open (row), load-more.
// Look: custom.css 29 (status tabs, square bar) and 32 (matrix, tiers, spot cards).
// ---------------------------------------------------------------

// Components
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue'
import AnimatedNumber from '@/components/AnimatedNumber.vue'

// Utils
import { smartDate } from '@/utils/dates'
import { HEALTH_GROUPS, HEALTH_BADGE } from '../helpers/overviewMeta'

const props = defineProps({
    counts: { type: Object, default: null },
    rows: { type: Array, default: () => [] },
    group: { type: String, default: 'spotlight' },
    loading: { type: Boolean, default: false },       // the group's rows are loading
    loadingMore: { type: Boolean, default: false },
    hasMore: { type: Boolean, default: false },
    tenantsLink: { type: [String, Object], default: '/tenants' },
})

const emit = defineEmits(['update:group', 'open', 'load-more'])

const COLOR = Object.fromEntries(HEALTH_GROUPS.map((g) => [g.key, g.color]))
const c = computed(() => props.counts || {})
const live = computed(() => c.value.live || 0)
const pct = (n, of) => (of ? `${((n / of) * 100).toFixed(1).replace(/\.0$/, '')}%` : '0%')

// Status tabs: "Spotlight (top 4)", "Healthy (12)", …
const tabs = computed(() => HEALTH_GROUPS.map((g) => ({
    ...g,
    text: !props.counts ? g.label : g.key === 'spotlight' ? `Spotlight (top ${c.value.spotlight ?? 0})` : `${g.label} (${c.value[g.key] ?? 0})`,
})))

// Live business health: the bar and the three tiers
const tiers = computed(() => [
    { key: 'healthy', cls: 'tier-good', label: 'Healthy', sub: 'Paid up and trading' },
    { key: 'attention', cls: 'tier-warn', label: 'Attention', sub: 'Trial ending · gone quiet' },
    { key: 'danger', cls: 'tier-bad', label: 'Danger zone', sub: 'Payment failed · past due' },
].map((t) => ({ ...t, n: c.value[t.key] || 0, color: COLOR[t.key] })))
const needReview = computed(() => (c.value.attention || 0) + (c.value.danger || 0))

// Lifecycle status, set on each business
const lifecycle = computed(() => [
    { key: 'healthy', label: 'Live', note: 'selling at the till', n: c.value.live || 0, color: COLOR.healthy },
    { key: 'onboarding', label: 'Setting up', note: 'before going live', n: c.value.onboarding || 0, color: COLOR.onboarding },
    { key: 'suspended', label: 'Suspended', note: 'stopped by an admin', n: c.value.suspended || 0, color: COLOR.suspended },
])

// The roster heading
const rosterTitle = computed(() => (props.group === 'spotlight'
    ? ['Spotlight businesses (top priority)', `${c.value.spotlight ?? 0} needing focus`]
    : [HEALTH_GROUPS.find((g) => g.key === props.group)?.label || '', `${c.value[props.group] ?? 0} ${c.value[props.group] === 1 ? 'business' : 'businesses'}`]))

// ---- A spot card's words ----
const tagOf = (row) => HEALTH_BADGE[row.health] || HEALTH_BADGE.healthy
const colorOf = (row) => COLOR[row.health] || COLOR.healthy
function lineOf(row) {
    if (row.attention?.message) return row.attention.message
    if (row.health === 'onboarding') return 'Still setting up'
    if (row.health === 'suspended') return 'Stopped by an admin'
    return [row.plan?.name ? `${row.plan.name} plan` : null, row.business_type?.name].filter(Boolean).join(' · ') || row.human_code
}
function footOf(row) {
    const left = row.last_sale_at ? `Last sale ${smartDate(row.last_sale_at)}`
        : row.last_activity_at ? `Active ${smartDate(row.last_activity_at)}`
        : row.onboarded_at ? `Live since ${smartDate(row.onboarded_at)}` : `Added ${smartDate(row.created_at)}`
    const right = { danger: 'Urgent', attention: 'Warning', onboarding: row.attention ? 'Stuck' : 'On track', suspended: 'Review' }[row.health]
        || (row.plan?.status === 'past_due' ? 'Due' : 'Healthy')
    return [left, right]
}
</script>

<template>
    <div>
        <!-- Head: title, total, source; the status tabs -->
        <div class="d-flex flex-column flex-xl-row align-items-xl-center justify-content-between gap-3 pb-3 mb-3 border-bottom">
            <div>
                <div class="d-flex align-items-center gap-2 flex-wrap">
                    <h2 class="mb-0">Business health &amp; lifecycle</h2>
                    <span v-if="counts" class="ops-pill"><AnimatedNumber :value="c.total" /> businesses</span>
                    <span class="src src-live">Live</span>
                </div>
                <p v-if="counts" class="hero-sub mb-0">
                    <AnimatedNumber :value="c.live" /> live, <AnimatedNumber :value="c.onboarding" /> setting up, <AnimatedNumber :value="c.suspended" /> suspended.
                </p>
                <SkeletonLoader v-else type="text" width="220px" height="12px" class="mt-1" />
            </div>
            <div class="d-flex flex-wrap align-items-center gap-1" role="tablist" aria-label="Filter businesses by status">
                <button
                    v-for="t in tabs"
                    :key="t.key"
                    type="button"
                    class="status-tab"
                    :class="{ active: group === t.key }"
                    role="tab"
                    :aria-selected="group === t.key"
                    :title="t.hint"
                    @click="emit('update:group', t.key)"
                >
                    <span v-if="t.color" class="sq" :style="{ background: t.color }"></span>{{ t.text }}
                </button>
            </div>
        </div>

        <!-- The two boxes -->
        <div class="row g-3">
            <!-- Live business health -->
            <div class="col-lg-7">
                <div class="matrix-box">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="d-flex align-items-center gap-2"><span class="sq" :style="{ background: COLOR.healthy }"></span><h3 class="matrix-h">Live business health</h3></div>
                        <span class="ops-pill good"><AnimatedNumber :value="c.healthy || 0" /> healthy</span>
                    </div>
                    <div class="sq-bar" role="img" :aria-label="tiers.map((t) => `${t.label} ${t.n}`).join(', ')">
                        <span
                            v-for="t in tiers"
                            :key="t.key"
                            :style="{ width: live ? `${(t.n / live) * 100}%` : '0%', background: t.color }"
                            :title="`${t.label}: ${t.n}`"
                            @click="emit('update:group', t.key)"
                        ></span>
                    </div>
                    <div class="d-flex justify-content-between small text-muted mt-1">
                        <span><AnimatedNumber :value="live" /> live businesses</span>
                        <span class="fw-semibold text-dark"><AnimatedNumber :value="needReview" /> need a review</span>
                    </div>
                    <div class="row g-2 row-cols-3 mt-1">
                        <div v-for="t in tiers" :key="t.key" class="col">
                            <button type="button" class="tier" :class="[t.cls, { 'shadow-sm': group === t.key }]" :aria-pressed="group === t.key" @click="emit('update:group', t.key)">
                                <span class="d-flex justify-content-between" style="font-size: 10.5px; font-weight: 700">
                                    <span class="d-flex align-items-center gap-1"><span class="sq" :style="{ background: t.color }"></span>{{ t.label }}</span>
                                    <span>{{ pct(t.n, live) }}</span>
                                </span>
                                <span class="tier-n d-block"><AnimatedNumber :value="t.n" /></span>
                                <span class="d-block text-truncate" style="font-size: 10.5px">{{ t.sub }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lifecycle status -->
            <div class="col-lg-5">
                <div class="matrix-box">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="d-flex align-items-center gap-2"><span class="sq" :style="{ background: COLOR.onboarding }"></span><h3 class="matrix-h">Lifecycle status</h3></div>
                        <span class="text-muted" style="font-size: 10.5px">Set on each business</span>
                    </div>
                    <div class="d-flex flex-column gap-2">
                        <button v-for="r in lifecycle" :key="r.label" type="button" class="admin-row" @click="emit('update:group', r.key)">
                            <span class="d-flex align-items-center gap-2">
                                <span class="sq" :style="{ background: r.color }"></span>
                                <span class="fw-semibold">{{ r.label }}</span>
                                <span class="text-muted" style="font-size: 10px">({{ r.note }})</span>
                            </span>
                            <span class="d-flex align-items-center gap-2">
                                <span class="fw-bold"><AnimatedNumber :value="r.n" /></span>
                                <span class="pct-chip" :style="{ background: `${r.color}22` }">{{ pct(r.n, c.total) }}</span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- The roster: spot cards of the chosen group -->
        <div class="d-flex align-items-center justify-content-between mt-3 mb-2 gap-2">
            <div class="d-flex align-items-center gap-2 min-w-0">
                <h3 class="matrix-h text-truncate">{{ rosterTitle[0] }}</h3>
                <span class="text-muted text-nowrap" style="font-size: 10.5px">{{ rosterTitle[1] }}</span>
            </div>
            <router-link :to="tenantsLink" class="small fw-semibold text-nowrap">
                View all {{ c.total ?? '' }} in Tenants <Icon icon="ri:arrow-right-s-line" class="align-middle" />
            </router-link>
        </div>

        <!-- First load: four card skeletons -->
        <div v-if="loading && !rows.length" class="row g-3 row-cols-1 row-cols-sm-2 row-cols-xl-4">
            <div v-for="n in 4" :key="n" class="col"><SkeletonLoader type="rectangle" height="104px" :rounded="true" /></div>
        </div>
        <TransitionGroup v-else name="fade" tag="div" class="row g-3 row-cols-1 row-cols-sm-2 row-cols-xl-4" :class="loading ? 'is-refreshing' : 'is-refreshed'">
            <div v-for="row in rows" :key="row.id" class="col">
                <button type="button" class="spot-card" :class="`s-${row.health}`" title="More info" @click="emit('open', row)">
                    <span class="d-flex align-items-center justify-content-between mb-1 gap-2">
                        <span class="spot-tag" :class="tagOf(row)[0]"><span class="sq" :style="{ background: colorOf(row) }"></span>{{ tagOf(row)[1] }}</span>
                        <span class="fw-bold small text-dark text-truncate">{{ row.plan?.name || row.human_code }}</span>
                    </span>
                    <span class="d-block fw-semibold text-dark small text-truncate">{{ row.name }}</span>
                    <span class="d-block text-muted text-truncate" style="font-size: 11px">{{ lineOf(row) }}</span>
                    <span class="spot-foot">
                        <span class="text-muted text-truncate">{{ footOf(row)[0] }}</span>
                        <span class="fw-semibold text-nowrap" :style="{ color: colorOf(row) }">{{ footOf(row)[1] }}</span>
                    </span>
                </button>
            </div>
            <div v-if="!rows.length && !loading" key="empty" class="col-12 text-muted small py-3">No business in this group.</div>
        </TransitionGroup>

        <!-- More of the group -->
        <div v-if="hasMore" class="text-center mt-3">
            <button type="button" class="btn btn-white btn-sm" :disabled="loadingMore" @click="emit('load-more')">
                <span v-if="loadingMore" class="spinner-border spinner-border-sm me-1"></span>Load More
            </button>
        </div>
    </div>
</template>
