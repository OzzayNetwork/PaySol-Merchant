<template>
    <!-- Document picker (10 Nov 2026, Settings › Legal & Terms): a large button showing the chosen item's
         icon, name and a short status line, opening a list of every item with its own status and a tick.
         Outline icon idle, filled for the chosen one. Keyboard: Enter / Space / ↓ opens, ↑ ↓ move, Enter
         picks, Esc closes. custom.css 37 (.doc-picker). -->
    <div ref="root" class="doc-picker" :class="{ 'is-open': open }">
        <button ref="trigger" type="button" class="doc-picker-btn" :disabled="disabled" aria-haspopup="listbox" :aria-expanded="open"
            :aria-label="ariaLabel" @click="toggle" @keydown="onTriggerKey">
            <!-- Loading: the button's own shape -->
            <template v-if="loading">
                <SkeletonLoader type="rectangle" width="32px" height="32px" />
                <span class="flex-grow-1 min-w-0 text-start">
                    <SkeletonLoader type="text" :lines="1" height="11px" width="140px" />
                    <SkeletonLoader type="text" :lines="1" height="9px" width="100px" margin-top="6px" />
                </span>
            </template>
            <template v-else-if="current">
                <span class="doc-picker-icon" :style="{ background: current.tint, color: current.fg }">
                    <Icon :icon="current.iconActive || current.icon" />
                </span>
                <span class="flex-grow-1 min-w-0 text-start">
                    <span class="doc-picker-name text-truncate">{{ current.label }}</span>
                    <span v-if="current.sub" class="doc-picker-sub text-truncate">{{ current.sub }}</span>
                </span>
            </template>
            <span v-else class="flex-grow-1 text-start text-muted">{{ placeholder }}</span>
            <Icon :icon="open ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" class="doc-picker-chev" />
        </button>

        <!-- The list -->
        <div v-if="open" class="doc-picker-menu" role="listbox" :aria-activedescendant="`${uid}-${active}`" tabindex="-1" @keydown="onMenuKey">
            <div v-for="(item, i) in items" :id="`${uid}-${i}`" :key="item.key" class="doc-picker-item" role="option"
                :class="{ 'is-on': item.key === modelValue, 'is-active': i === active }" :aria-selected="item.key === modelValue"
                @click="choose(item)" @mouseenter="active = i">
                <span class="doc-picker-icon is-lg" :style="{ background: item.tint, color: item.fg }">
                    <Icon :icon="item.key === modelValue ? (item.iconActive || item.icon) : item.icon" />
                </span>
                <span class="min-w-0">
                    <span class="doc-picker-name text-truncate">{{ item.label }}</span>
                    <span v-if="item.sub" class="doc-picker-sub text-truncate">{{ item.sub }}</span>
                </span>
                <Icon v-if="item.key === modelValue" icon="ri:check-line" class="doc-picker-tick" />
                <span v-else></span>
            </div>
            <p v-if="!items.length" class="text-muted font-size-13 px-2 py-2 mb-0">Nothing to choose from.</p>
        </div>
    </div>
</template>

<script setup>
// ---------------------------------------------------------------
// A dropdown for choosing one of a few named items (documents, templates,
// reports) where each item needs an icon and a one-line status. Used by
// Settings › Legal & Terms; shown on the test page.
//
// Props:  modelValue (the chosen key), items ([{ key, label, sub?, icon,
//         iconActive?, tint?, fg? }]), loading, disabled, placeholder, ariaLabel.
// Emits:  update:modelValue (key), change (the whole item).
// ---------------------------------------------------------------
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue'

const props = defineProps({
    modelValue: { type: [String, Number], default: null },
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    placeholder: { type: String, default: 'Choose…' },
    ariaLabel: { type: String, default: 'Choose a document' },
})
const emit = defineEmits(['update:modelValue', 'change'])

// A unique id for aria-activedescendant
const uid = `docpick-${Math.random().toString(36).slice(2, 8)}`
const root = ref(null)
const trigger = ref(null)
const open = ref(false)
const active = ref(0)

const current = computed(() => props.items.find((i) => i.key === props.modelValue) ?? null)

const openMenu = async () => {
    if (props.disabled || props.loading) return
    open.value = true
    active.value = Math.max(0, props.items.findIndex((i) => i.key === props.modelValue))
    await nextTick()
    root.value?.querySelector('.doc-picker-menu')?.focus()
}
const close = (refocus = false) => {
    open.value = false
    if (refocus) trigger.value?.focus()
}
const toggle = () => (open.value ? close() : openMenu())

const choose = (item) => {
    if (item.key !== props.modelValue) {
        emit('update:modelValue', item.key)
        emit('change', item)
    }
    close(true)
}

// Keyboard on the closed button
const onTriggerKey = (e) => {
    if (['ArrowDown', 'Enter', ' '].includes(e.key) && !open.value) { e.preventDefault(); openMenu() }
}
// Keyboard in the open list
const onMenuKey = (e) => {
    const n = props.items.length
    if (!n) return
    if (e.key === 'ArrowDown') { e.preventDefault(); active.value = (active.value + 1) % n }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active.value = (active.value - 1 + n) % n }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(props.items[active.value]) }
    else if (e.key === 'Escape' || e.key === 'Tab') { close(e.key === 'Escape') }
}

// A click anywhere else closes the list
const onDocClick = (e) => { if (open.value && root.value && !root.value.contains(e.target)) close() }
onMounted(() => document.addEventListener('mousedown', onDocClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick))
</script>
