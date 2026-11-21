<template>
    <!-- Selection actions bar (11 Nov 2026, Kelvin: "use that style", the File Manager's): shown above a list once
         rows are ticked. Left: the actions as icon + word links that tint on hover (custom.css .more-actions /
         .contact-links, the File Manager's own classes). Right: "× N selected", which unticks everything. -->
    <div class="card-body border-bottom py-3 p-2 selection-actions-bar">
        <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <div class="d-flex align-items-center more-actions min-w-0">
                <ul class="list-inline font-size-20 contact-links mb-0 d-flex flex-wrap">
                    <li v-for="a in visibleActions" :key="a.key" class="list-inline-item p-2 px-3 border-round m-0"
                        :class="{ 'opacity-50 pe-none': a.disabled || busy, dropdown: a.items }">
                        <!-- An action with choices (e.g. which tag) opens a menu; the File Manager's dropdown styles -->
                        <a href="javascript: void(0);" :title="a.title || a.label" class="d-flex gap-2 align-items-center"
                            :class="a.danger ? 'text-danger' : ''" :aria-disabled="a.disabled || busy"
                            :data-bs-toggle="a.items ? 'dropdown' : null" :aria-expanded="a.items ? 'false' : null" @click="!a.items && run(a)">
                            <!-- Outline icon; the hover tint comes from .more-actions .contact-links -->
                            <Icon :icon="a.icon" />
                            <span style="font-size: 13px;">{{ a.label }}</span>
                            <i v-if="a.items" class="mdi mdi-chevron-down font-size-14"></i>
                        </a>
                        <div v-if="a.items" class="dropdown-menu p-1" style="min-width: 200px;">
                            <template v-for="(it, i) in a.items" :key="it.key ?? `d-${i}`">
                                <div v-if="it.divider" class="dropdown-divider"></div>
                                <a v-else href="javascript: void(0);" class="dropdown-item gap-2 font-size-13" @click="run(a, it)">
                                    <span v-if="it.dot" class="tone-dot" :style="{ '--tone': it.dot }"></span>
                                    <Icon v-else-if="it.icon" :icon="it.icon" />
                                    {{ it.label }}
                                </a>
                            </template>
                            <span v-if="!a.items.length" class="dropdown-item-text text-muted font-size-12">{{ a.emptyText || 'Nothing to choose yet.' }}</span>
                        </div>
                    </li>
                </ul>
            </div>
            <div class="d-flex align-items-center gap-3 more-actions flex-shrink-0">
                <!-- Anything the page wants on the right (e.g. "Showing X of Y") -->
                <slot name="right"></slot>
                <button type="button" class="btn btn-light btn-rounded waves-effect text-capitalize px-3 fw-bold"
                    title="Untick everything" @click="$emit('clear')">
                    <i class="bx bx-x font-size-16 align-middle"></i> {{ count }} selected
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
// ---------------------------------------------------------------
// Selection.Actions.bar - the File Manager's "after selecting a row" bar,
// shared so every list with ticks looks the same (Tenants first).
//
// Props:  count (how many are ticked), actions ([{ key, label, icon,
//         title?, disabled?, hidden?, danger?, items?, emptyText? }]),
//         busy (greys every action while one runs). `items` turns an action
//         into a menu: [{ key, label, dot? | icon? } | { divider: true }].
// Emits:  action (key, item | null), clear.
// Slot:   right (extra text before the "N selected" button).
// ---------------------------------------------------------------
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
    count: { type: Number, default: 0 },
    actions: { type: Array, default: () => [] },
    busy: { type: Boolean, default: false },
})
const emit = defineEmits(['action', 'clear'])

// Hidden actions are left out (e.g. Open only when one row is ticked)
const visibleActions = computed(() => props.actions.filter((a) => !a.hidden))

// A plain action emits its key; a choice from an action's menu also sends the chosen item
const run = (a, item = null) => {
    if (a.disabled || props.busy) return
    emit('action', a.key, item)
}
</script>
