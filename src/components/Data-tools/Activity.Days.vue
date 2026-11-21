<template>
    <!-- Skeleton (AGENTS.md 6.9) while the first page loads -->
    <div v-if="loading && !items.length" class="activity-day">
        <SkeletonLoader type="text" :lines="1" height="12px" width="90px" />
        <div class="activity-day-box">
            <div v-for="n in skeletonRows" :key="`sk-${n}`" class="activity-row trail-row">
                <SkeletonLoader type="circle" width="38px" height="38px" />
                <span><SkeletonLoader type="text" :lines="1" height="10px" width="65%" /><SkeletonLoader type="text" :lines="1" height="8px" width="40%" margin-top="7px" /></span>
                <SkeletonLoader type="rectangle" width="64px" height="22px" />
                <SkeletonLoader type="text" :lines="1" height="10px" width="36px" />
            </div>
        </div>
    </div>

    <!-- Empty: the page says why through the slot -->
    <div v-else-if="!items.length" class="text-center p-5">
        <slot name="empty">
            <Icon icon="ri:history-line" class="text-black opacity-25" style="font-size: 96px;" />
            <h5 class="fw-bold text-dark mt-3 mb-2">No activity yet</h5>
            <p class="text-muted mb-0">Nothing has been recorded here yet.</p>
        </slot>
    </div>

    <template v-else>
        <!-- Each Nairobi day in its own box -->
        <div v-for="d in days" :key="d.key" class="activity-day">
            <div class="d-flex align-items-baseline justify-content-between px-1">
                <span class="fw-semibold text-black font-size-14">{{ d.label }}</span>
                <span class="text-muted font-size-12">{{ d.items.length }} {{ d.items.length === 1 ? 'event' : 'events' }}</span>
            </div>
            <div class="activity-day-box">
                <div v-for="it in d.items" :key="it.id" class="activity-row trail-row" role="button" tabindex="0"
                    :class="{ 'is-open': selectedId === it.id }" @click="emit('open', it)" @keydown.enter="emit('open', it)">
                    <!-- Who: initials in their tint, the kind's badge at the corner -->
                    <span class="activity-who" :class="it.tintClass" :style="it.tint ? { background: it.tint, color: it.fg } : null">
                        {{ it.initials }}
                        <span v-if="it.badgeIcon" class="activity-cat-badge" :style="{ background: it.badgeColor || '#5B6B8C' }" :title="it.meta">
                            <Icon :icon="it.badgeIcon" width="10" height="10" />
                        </span>
                    </span>
                    <!-- The sentence, where it came from, and why it failed -->
                    <span class="min-w-0 d-flex flex-column gap-1">
                        <span class="text-black activity-sentence">
                            <a v-if="it.whoClickable" href="javascript:void(0);" class="fw-semibold text-black trail-who" :title="`Only ${it.who}'s activity`"
                                @click.stop="emit('who', it)">{{ it.who }}</a>
                            <strong v-else class="fw-semibold">{{ it.who }}</strong>
                            {{ it.verb }} <span class="fw-medium">{{ it.what }}</span>
                        </span>
                        <span v-if="it.meta" class="text-muted text-truncate font-size-12">{{ it.meta }}</span>
                        <span v-if="it.reason" class="font-size-12 text-danger text-truncate">{{ it.reason }}</span>
                    </span>
                    <span><span class="activity-pill" :style="{ background: it.pillBg, color: it.pillFg }">{{ it.pill }}</span></span>
                    <span class="text-end text-muted font-size-12 activity-time" :title="longWhen(it.at)">{{ timeOf(it.at) }}</span>
                </div>
            </div>
        </div>

        <!-- More: a button; the page may also load more as its list scrolls -->
        <div v-if="hasMore" class="text-center py-2">
            <button type="button" class="btn btn-sm btn-white waves-effect" :disabled="loadingMore" @click="emit('more')">
                <span v-if="loadingMore" class="spinner-border spinner-border-sm me-1"></span>{{ moreLabel }}
            </button>
        </div>
        <p v-else-if="endNote" class="text-center text-muted font-size-12 mb-0 py-1">{{ endNote }}</p>
    </template>
</template>

<script setup>
// ---------------------------------------------------------------
// Activity.Days — the activity log standard for any page that shows a trail
// (9 Nov 2026, Kelvin: "use the same standard of the activity logs anywhere
// it is located"): each Nairobi day in its own bordered box, a row of
// initials with the kind's badge, "<who> <verb> <what>", a muted line (kind ·
// device · place), the reason when it failed, a result pill and the time.
// Looks: custom.css 33 (.activity-*) and 35 (.trail-row). Used by a team
// member's Activity log (Team.Details) and a business's Activity tab.
//
// The page maps its own rows to items; this component only draws them.
//
// Props:  items [{ id, at (ISO), initials, tint / fg (colours) or tintClass,
//                  badgeIcon, badgeColor, who, whoClickable, verb, what, meta,
//                  reason, pill, pillBg, pillFg }],
//         loading, loadingMore, hasMore, selectedId, moreLabel, endNote,
//         skeletonRows
// Emits:  open(item), who(item) (the person's name was clicked), more
// Slots:  empty
// ---------------------------------------------------------------
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue'
import { dayKey, dayLabel, timeOf, longWhen } from '@/pages/ActivityLog/helpers/activityMeta'

const props = defineProps({
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    loadingMore: { type: Boolean, default: false },
    hasMore: { type: Boolean, default: false },
    selectedId: { type: [Number, String], default: null },
    moreLabel: { type: String, default: 'Load older activity' },
    endNote: { type: String, default: '' },
    skeletonRows: { type: Number, default: 6 },
})
const emit = defineEmits(['open', 'who', 'more'])

// Group by Nairobi day, newest first (the order the page gives)
const days = computed(() => {
    const out = []
    for (const it of props.items) {
        const k = dayKey(it.at)
        let d = out[out.length - 1]
        if (!d || d.key !== k) { d = { key: k, label: dayLabel(it.at), items: [] }; out.push(d) }
        d.items.push(it)
    }
    return out
})
</script>
