<script setup>
// ---------------------------------------------------------------
// BreakdownBars — "what makes up this number": one square bar per part,
// its share of the whole and its value (the V10 / V11 breakdown panels).
//
// Bars grow from zero when they first show and glide to new widths when the
// numbers change (CSS transition), so switching cards or ranges reads as one
// movement. Square ends on purpose (Kelvin, 4 Nov: progress bars without
// rounded edges). Each row can be clicked (emits `select` with the item).
//
// items: [{ key, label, value, share, color? }]  share is 0–100.
// Look: custom.css section 27 (BREAKDOWN BARS). No API calls.
// Shown on /test-page.
// ---------------------------------------------------------------

// Components
import { ref, onMounted, nextTick } from 'vue'
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue'

const props = defineProps({
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    items: { type: Array, default: () => [] },
    colors: { type: Array, default: () => ['#556ee6', '#34c38f', '#f1b44c', '#50a5f1', '#f46a6a', '#8e7cc3', '#74788d', '#c3c7d4'] },
    format: { type: Function, default: (n) => Math.round(n).toLocaleString('en-KE') },
    footnote: { type: String, default: '' },
    emptyText: { type: String, default: 'Nothing to break down yet.' },
    clickable: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])

// Bars start at zero width and grow once mounted
const grown = ref(false)
onMounted(async () => {
    await nextTick()
    requestAnimationFrame(() => { grown.value = true })
})

const colorOf = (item, i) => item.color || props.colors[i % props.colors.length]
const widthOf = (item) => (grown.value ? `${Math.min(100, Math.max(0, Number(item.share) || 0))}%` : '0%')
const pctText = (item) => `${(Number(item.share) || 0).toLocaleString('en-KE', { maximumFractionDigits: 1 })}%`
</script>

<template>
    <div class="brk-panel">
        <!-- Title and what the bars measure -->
        <div class="brk-panel-title">{{ title }}</div>
        <div v-if="subtitle" class="brk-panel-sub">{{ subtitle }}</div>

        <!-- Skeleton: three bars -->
        <template v-if="loading">
            <div v-for="n in 3" :key="n" class="hbar">
                <SkeletonLoader type="text" width="45%" height="11px" class="mb-2" />
                <SkeletonLoader type="rectangle" height="8px" />
            </div>
        </template>

        <!-- Bars -->
        <template v-else-if="items.length">
            <div
                v-for="(item, i) in items"
                :key="item.key"
                class="hbar"
                :class="{ 'is-clickable': clickable }"
                :role="clickable ? 'button' : undefined"
                :tabindex="clickable ? 0 : undefined"
                @click="clickable && emit('select', item)"
                @keydown.enter="clickable && emit('select', item)"
            >
                <div class="hbar-top">
                    <span class="text-truncate">{{ item.label }}</span>
                    <span class="hbar-value">{{ format(item.value) }}</span>
                </div>
                <div class="hbar-row">
                    <div class="hbar-track" :title="pctText(item)">
                        <div class="hbar-fill" :style="{ width: widthOf(item), backgroundColor: colorOf(item, i) }"></div>
                    </div>
                    <span class="hbar-pct">{{ pctText(item) }}</span>
                </div>
            </div>
        </template>

        <!-- Empty state -->
        <div v-else class="small text-muted mt-3">{{ emptyText }}</div>

        <!-- Footnote: what the bars are counted from -->
        <div v-if="footnote && !loading" class="brk-foot">{{ footnote }}</div>
    </div>
</template>
