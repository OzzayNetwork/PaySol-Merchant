<script setup>
// ---------------------------------------------------------------
// InfoDialog — the small "More info" pop-up from the V11 Overview design
// (V10's store pop-up, Kelvin 4 Nov: "pop-ups like V10"). Opened wherever a
// business or a service is named; shows a few facts and one main action.
//
//   <InfoDialog v-model:open="show" title="Mama Pima Bar">
//     <InfoRow icon="ri:map-pin-2-line">Kilimani · PS-1042</InfoRow>   (any rows)
//     <template #after> 24 check blocks, stats … </template>
//     <template #actions>
//       <router-link class="btn btn-link text-muted px-0 me-auto order-first">Open in Tenants</router-link>
//       <button class="btn btn-primary order-last">Send Reminder</button>
//     </template>
//   </InfoDialog>
//
// Props: open, title, subtitle ("More info"), checks (24 results, oldest
// first: ok|slow|fail|none — draws the hourly blocks with their stats), uptime
// (the "Up, 24 h" figure), response (the "Response" figure).
// Closes on the X, the Close button, the backdrop and Escape; focus goes to
// the X on open and back to what opened it on close; the page behind does
// not scroll while it is open. Look: custom.css 32 (.info-*).
//
// The ReferenceModal shell is the console's form modal; this one is the
// lighter V11 pop-up (rounded, 460 px, pill close) and carries no form.
// ---------------------------------------------------------------

import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
    open: { type: Boolean, default: false },
    title: { type: String, default: '' },
    subtitle: { type: String, default: 'More info' },
    checks: { type: Array, default: null },      // 24 x 'ok' | 'slow' | 'fail' | 'none'
    uptime: { type: [Number, String], default: null },
    response: { type: String, default: null },
})
const emit = defineEmits(['update:open', 'close'])

const closeBtn = ref(null)
let lastFocus = null

function close() {
    emit('update:open', false)
    emit('close')
}

function onKey(e) { if (e.key === 'Escape') close() }

// Focus, scroll lock and Escape follow `open`
watch(() => props.open, async (on) => {
    if (on) {
        lastFocus = document.activeElement
        document.body.style.overflow = 'hidden'
        document.addEventListener('keydown', onKey)
        await nextTick()
        closeBtn.value?.focus()
    } else {
        document.body.style.overflow = ''
        document.removeEventListener('keydown', onKey)
        lastFocus?.focus?.()
    }
})
onBeforeUnmount(() => {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKey)
})

// ---- Hourly checks ----
const LABELS = { ok: 'Working', slow: 'Slow', fail: 'Failed', none: 'Not checked' }
const failed = computed(() => (props.checks ? props.checks.filter((c) => c === 'fail').length : 0))
const checked = computed(() => (props.checks ? props.checks.filter((c) => c !== 'none').length : 0))
const hourLabel = (i) => { const h = (new Date().getHours() - 23 + i + 24) % 24; return `${String(h).padStart(2, '0')}:00` }
const uptimeText = computed(() => (props.uptime === null || props.uptime === undefined ? '—' : typeof props.uptime === 'number' ? `${props.uptime}%` : props.uptime))
</script>

<template>
    <Teleport to="body">
        <Transition name="info">
            <div v-if="open" class="info-overlay" @click.self="close">
                <div class="info-dialog" role="dialog" aria-modal="true" aria-labelledby="infoDialogTitle">
                    <!-- Title and the round close -->
                    <div class="d-flex align-items-start justify-content-between gap-3">
                        <h3 id="infoDialogTitle" class="info-title">{{ title }}</h3>
                        <button ref="closeBtn" type="button" class="info-close" aria-label="Close" title="Close" @click="close">
                            <Icon icon="ri:close-line" />
                        </button>
                    </div>
                    <div class="info-sub">{{ subtitle }}</div>

                    <!-- The facts -->
                    <div class="d-flex flex-column gap-1"><slot /></div>

                    <!-- Hourly checks: stats, 24 blocks, legend -->
                    <template v-if="checks">
                        <div class="info-stats">
                            <div><div class="info-stat-v">{{ uptimeText }}</div><div class="info-stat-l">Up, 24 h</div></div>
                            <div><div class="info-stat-v">{{ response || '—' }}</div><div class="info-stat-l">Response</div></div>
                            <div><div class="info-stat-v">{{ checked ? failed : '—' }}</div><div class="info-stat-l">Failed</div></div>
                        </div>
                        <div class="info-sub mb-1">Hourly checks, last 24 hours</div>
                        <span class="check-blocks check-blocks-lg" role="img" aria-label="24 hourly checks">
                            <span v-for="(c, i) in checks" :key="i" :class="`is-${c}`" :title="`${hourLabel(i)} · ${LABELS[c]}`"></span>
                        </span>
                        <div class="d-flex justify-content-between mt-1 font-size-11 text-muted"><span>24 h ago</span><span>now</span></div>
                        <div class="d-flex flex-wrap gap-3 mt-2 font-size-11 text-muted">
                            <span v-for="(l, k) in LABELS" :key="k" class="d-inline-flex align-items-center gap-1"><span class="check-key" :class="`is-${k}`"></span>{{ l }}</span>
                        </div>
                    </template>
                    <slot name="after" />

                    <!-- Actions: "Open in …" first, the main action last, Close always -->
                    <div class="info-foot">
                        <slot name="actions" />
                        <button type="button" class="btn btn-white" @click="close">Close</button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
