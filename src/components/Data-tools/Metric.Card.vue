<script setup>
// ---------------------------------------------------------------
// MetricCard — a big-number card that picks what a chart shows (the V10 /
// V11 Overview cards). Icon, label, the number (animated when it changes),
// an optional "of 24", and the change against the period before.
//
// States: active (selected: soft primary, filled icon), negative (the change
// is bad news: soft red), planned (no data yet: faded, "Planned" badge, no
// number), loading (skeleton in the same shape). It is a <button role="tab">,
// so a row of cards works with the keyboard; mouseenter / focus pass through
// to the parent (the Overview prefetches the card's chart on hover).
//
// Look: custom.css section 26 (METRIC TILES). No API calls.
// Shown on /test-page.
// ---------------------------------------------------------------

// Components
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import AnimatedNumber from '@/components/AnimatedNumber.vue'
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue'

const props = defineProps({
    label: { type: String, required: true },
    icon: { type: String, default: 'ri:bar-chart-2-line' },
    iconActive: { type: String, default: null },       // filled icon when selected
    value: { type: Number, default: null },
    of: { type: Number, default: null },                // "18 of 24"
    format: { type: Function, default: (n) => Math.round(n).toLocaleString('en-KE') },
    changeTone: { type: String, default: 'neutral' },   // positive | negative | neutral
    changeMarker: { type: String, default: '' },        // ▲ ▼ → •
    changeText: { type: String, default: '' },          // "12.5%", "No change"
    period: { type: String, default: '' },              // "vs the previous 30 days"
    description: { type: String, default: '' },         // hover text
    active: { type: Boolean, default: false },
    planned: { type: Boolean, default: false },
    plannedText: { type: String, default: 'No data yet' }, // the line a planned card shows
    loading: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])

const shownIcon = computed(() => (props.active && props.iconActive ? props.iconActive : props.icon))
const negative = computed(() => !props.planned && props.changeTone === 'negative')

// What a screen reader hears for the whole card
const ariaText = computed(() => {
    if (props.planned) return `${props.label}: planned, no data yet`
    const value = props.value === null ? 'no value' : props.format(props.value)
    return `${props.label}: ${value}${props.of !== null ? ` of ${props.of}` : ''}. ${props.changeText} ${props.period}`.trim()
})
</script>

<template>
    <!-- One card; a click selects it (the parent redraws its chart) -->
    <button
        type="button"
        role="tab"
        class="metric-tile"
        :class="{ 'is-active': active, 'is-negative': negative, 'is-planned': planned }"
        :aria-selected="active"
        :aria-label="ariaText"
        :title="description || label"
        @click="emit('select')"
    >
        <!-- Skeleton: icon, label, number, change line -->
        <template v-if="loading">
            <SkeletonLoader type="rectangle" width="28px" height="28px" class="mb-2" />
            <SkeletonLoader type="text" width="70%" height="12px" class="mb-2" />
            <SkeletonLoader type="text" width="55%" height="22px" class="mb-2" />
            <SkeletonLoader type="text" width="80%" height="11px" />
        </template>

        <template v-else>
            <!-- Icon (+ Planned badge) and label -->
            <span class="metric-tile-head">
                <span class="d-flex align-items-center justify-content-between w-100">
                    <span class="metric-tile-icon" aria-hidden="true"><Icon :icon="shownIcon" /></span>
                    <span v-if="planned" class="badge badge-soft-secondary">Planned</span>
                </span>
                <span class="metric-tile-label"><span>{{ label }}</span></span>
            </span>

            <!-- The number (animated), with its whole when there is one -->
            <span class="metric-tile-value">
                <template v-if="planned">—</template>
                <template v-else>
                    <AnimatedNumber :value="value" :format="format" />
                    <small v-if="of !== null"> of <AnimatedNumber :value="of" :format="(n) => Math.round(n).toLocaleString('en-KE')" /></small>
                </template>
            </span>

            <!-- Change against the period before -->
            <span class="metric-tile-change" :class="`is-${planned ? 'neutral' : changeTone}`">
                <span v-if="changeMarker" aria-hidden="true">{{ changeMarker }}</span>
                <span>{{ planned ? plannedText : changeText }}</span>
                <span v-if="!planned && period" class="metric-tile-period">{{ period }}</span>
            </span>
        </template>
    </button>
</template>
