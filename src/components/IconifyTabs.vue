<script setup>
// ---------------------------------------------------------------
// Small Iconify tab navigation with outline icons at rest and filled icons
// for the active tab. Each option supplies value, label, icon, iconActive.
// ---------------------------------------------------------------

import { Icon } from '@iconify/vue'

// Props / events
defineProps({
    modelValue: { type: [String, Number], default: null },
    items: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
    <nav aria-label="Section navigation">
        <ul class="nav nav-pills p-1 border rounded mb-0 iconify-tabs" role="tablist">
            <li v-for="item in items" :key="item.value" class="nav-item" role="presentation">
                <button
                    type="button"
                    class="nav-link d-flex align-items-center gap-2"
                    :class="{ active: modelValue === item.value }"
                    role="tab"
                    :aria-selected="modelValue === item.value"
                    @click="emit('update:modelValue', item.value)"
                >
                    <Icon :icon="modelValue === item.value ? item.iconActive : item.icon" class="fs-4" aria-hidden="true" />
                    <span>{{ item.label }}</span>
                </button>
            </li>
        </ul>
    </nav>
</template>

<style scoped>
.iconify-tabs {
    gap: 4px;
    background: #eff2f7;
    border-color: #d5d6d7 !important;
}
.iconify-tabs .nav-link {
    color: var(--bs-secondary-color);
    border: 1px solid transparent;
    background: transparent;
    transition: color 0.16s ease, background-color 0.16s ease, box-shadow 0.16s ease;
}
.iconify-tabs .nav-link:hover { color: var(--bs-primary); }
.iconify-tabs .nav-link.active {
    color: var(--bs-primary);
    background: #fff;
    border-color: rgba(33, 100, 243, 0.08);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 10px rgba(0, 0, 0, 0.05);
}
.iconify-tabs .nav-link:focus-visible {
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(33, 100, 243, 0.2);
}
@media (max-width: 575.98px) {
    .iconify-tabs { flex-wrap: wrap; }
    .iconify-tabs .nav-item { flex: 1 1 auto; }
    .iconify-tabs .nav-link { width: 100%; justify-content: center; }
}
</style>
