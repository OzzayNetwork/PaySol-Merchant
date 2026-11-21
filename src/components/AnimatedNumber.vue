<script setup>
// ---------------------------------------------------------------
// AnimatedNumber — a number that counts to its new value instead of jumping.
//
// When `value` changes, the shown number runs from the old value to the new
// one over `duration` ms (ease-out, so it settles gently). On first show it
// counts up from zero (set `from-zero` false to start at the value). The text
// is formatted on every frame by `format`, so money, counts and percentages
// all animate in their own shape. Screen readers get the final value only
// (aria-label), never the in-between numbers.
//
// Respects "reduce motion": the number then changes at once.
// No API calls. Used by the Overview cards (Data-tools/Metric.Card.vue) and
// shown on /test-page.
// ---------------------------------------------------------------

// Components
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'

const props = defineProps({
    value: { type: Number, default: null },        // null shows the placeholder
    format: { type: Function, default: (n) => Math.round(n).toLocaleString('en-KE') },
    duration: { type: Number, default: 700 },      // ms
    fromZero: { type: Boolean, default: true },    // first show counts up from 0
    placeholder: { type: String, default: '—' },
})

// Animation state
const shown = ref(null)        // the number on screen right now
let frame = null               // requestAnimationFrame id, so a new value can cancel the old run

const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const text = computed(() => (shown.value === null ? props.placeholder : props.format(shown.value)))
const finalText = computed(() => (props.value === null ? props.placeholder : props.format(props.value)))

// ---- Tween ----
// easeOutCubic: fast at first, slow at the end
const ease = (t) => 1 - Math.pow(1 - t, 3)

function animateTo(target) {
    cancelAnimationFrame(frame)
    if (target === null || target === undefined || Number.isNaN(target)) {
        shown.value = null
        return
    }
    const start = shown.value ?? (props.fromZero ? 0 : target)
    if (reduceMotion || start === target || props.duration <= 0) {
        shown.value = target
        return
    }
    const began = performance.now()
    const step = (now) => {
        const t = Math.min(1, (now - began) / props.duration)
        shown.value = start + (target - start) * ease(t)
        if (t < 1) frame = requestAnimationFrame(step)
        else shown.value = target        // land exactly on the value
    }
    frame = requestAnimationFrame(step)
}

// ---- Lifecycle ----
watch(() => props.value, (v) => animateTo(v))
onMounted(() => animateTo(props.value))
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
    <!-- The animated text; the label carries the real value for assistive tech -->
    <span class="animated-number" :aria-label="finalText">{{ text }}</span>
</template>
