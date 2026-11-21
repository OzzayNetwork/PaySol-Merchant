<template>
    <!-- Kelvin's reference (10 Nov), as the Plans board draws it: the count and a line under it on the left;
         on the right up to three solid round faces with a white ring, overlapping, then a solid blue "+N"
         (or a dashed "+" circle when there is nobody), and a chevron. Clickable as one row.
         Styles: custom.css 36 (.avatar-stack). -->
    <component :is="clickable ? 'button' : 'div'" :type="clickable ? 'button' : undefined" class="avatar-stack" :class="{ 'is-clickable': clickable }"
        :title="clickable ? goLabel : undefined" @click="clickable && $emit('open')">
        <span class="avatar-stack-caption">
            <template v-if="loading">
                <SkeletonLoader type="text" :lines="1" height="11px" width="90px" />
                <SkeletonLoader type="text" :lines="1" height="9px" width="70px" margin-top="6px" />
            </template>
            <template v-else>
                <span class="avatar-stack-count">{{ total ? `${total} ${total === 1 ? one : many}` : emptyLabel }}</span>
                <span v-if="note" class="avatar-stack-note">{{ note }}</span>
            </template>
        </span>

        <span class="avatar-stack-faces" aria-hidden="true">
            <template v-if="loading">
                <SkeletonLoader v-for="i in 3" :key="`sk-${i}`" type="circle" width="34px" height="34px" class="avatar-stack-face" />
            </template>
            <template v-else>
                <span v-for="(f, i) in shown" :key="f.id ?? i" class="avatar-stack-face" :title="f.name"
                    :style="{ background: f.color || colors[i % colors.length], zIndex: 10 - i }">
                    <img v-if="f.image" :src="f.image" :alt="f.name" />
                    <template v-else>{{ f.initials || initials(f.name) }}</template>
                </span>
                <span v-if="rest > 0" class="avatar-stack-face avatar-stack-more" :title="`${rest} more`">+{{ rest > 99 ? '99' : rest }}</span>
                <span v-if="!total && showEmpty" class="avatar-stack-face avatar-stack-empty"><Icon icon="ri:add-line" /></span>
            </template>
        </span>

        <Icon v-if="clickable" icon="ri:arrow-right-s-line" class="avatar-stack-chevron" />
    </component>
</template>

<script setup>
// ---------------------------------------------------------------
// Avatar.Stack — a count of businesses or people with a few faces
// (10 Nov 2026, the businesses on a plan). Shared: any card that says
// "N businesses / N people" and opens the full list.
//
// Props:  items [{ id, name, initials?, image?, color? }] (the first few),
//         total (the real count; "+N" is total minus the faces shown),
//         max (faces before "+N", 3), one / many (the noun), emptyLabel,
//         note (a line under the count), loading (skeleton shapes),
//         showEmpty (a dashed "+" circle when total is 0), clickable, goLabel
// Emits:  open (the row is clicked)
// ---------------------------------------------------------------
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue'

const props = defineProps({
    items: { type: Array, default: () => [] },
    total: { type: Number, default: 0 },
    max: { type: Number, default: 3 },
    one: { type: String, default: 'business' },
    many: { type: String, default: 'businesses' },
    emptyLabel: { type: String, default: 'No business yet' },
    note: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    showEmpty: { type: Boolean, default: true },
    clickable: { type: Boolean, default: true },
    goLabel: { type: String, default: 'See them all' },
})
defineEmits(['open'])

// The board's face colours (white initials on each)
const colors = ['#E8875B', '#5B8DEF', '#3FA37A', '#B76FD6', '#D9A23B', '#4BA3B8']
const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'

const shown = computed(() => props.items.slice(0, props.max))
const rest = computed(() => Math.max(0, props.total - shown.value.length))
</script>
