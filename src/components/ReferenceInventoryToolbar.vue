<script setup>
// ---------------------------------------------------------------
// API-free reference for the POS Inventory toolbar.
// Search, filter, create, and column actions are emitted to the parent.
// Modelled on Products.inventory.pos.table.vue; it does not navigate or write data.
// ---------------------------------------------------------------

import { computed } from 'vue'

// Props / events
const props = defineProps({
    modelValue: { type: String, default: '' },
    columns: { type: Array, default: () => [] },
    createOptions: { type: Array, default: () => [] },
    filterCount: { type: Number, default: 0 },
})
const emit = defineEmits(['update:modelValue', 'update:columns', 'search', 'create', 'filter', 'clear'])

// Derived state
const visibleColumns = computed(() => props.columns.filter((column) => column.visible).length)

// ---- Search / filter / create actions ----
function updateSearch(event) {
    emit('update:modelValue', event.target.value)
}

function updateColumn(column, event) {
    emit('update:columns', props.columns.map((item) => item.key === column.key
        ? { ...item, visible: event.target.checked }
        : item))
}
</script>

<template>
    <!-- Inventory toolbar: mirrors the POS Products search, Create menu, Filter, and Columns controls. -->
    <div class="reference-inventory-toolbar d-flex flex-wrap align-items-center gap-2">
        <!-- Search: submit or type to emit the query; this component does not call an API. -->
        <form class="flex-grow-1" @submit.prevent="emit('search', modelValue)">
            <div class="input-group bg-light rounded flex-nowrap">
                <div class="position-relative flex-grow-1">
                    <i class="bx bx-search-alt search-icon fs-4" aria-hidden="true"></i>
                    <input
                        :value="modelValue"
                        type="search"
                        class="form-control bg-light"
                        placeholder="Search products..."
                        aria-label="Search products"
                        @input="updateSearch"
                    >
                </div>
                <button type="submit" class="btn btn-primary d-none d-md-flex align-items-center gap-2" title="Search products">
                    <i class="bx bx-search-alt" aria-hidden="true"></i><span>Search</span>
                </button>
                <button v-if="modelValue" type="button" class="btn btn-white" title="Clear search" aria-label="Clear search" @click="emit('clear')">
                    <i class="mdi mdi-close" aria-hidden="true"></i>
                </button>
            </div>
        </form>

        <!-- Create: options are data-driven so each consuming page can choose its own actions. -->
        <div class="dropdown">
            <button type="button" class="btn btn-primary d-flex align-items-center gap-2 fw-bold text-nowrap" data-bs-toggle="dropdown" aria-expanded="false" title="Create a product or inventory reference">
                <i class="dripicons-plus fs-5" aria-hidden="true"></i><span>Create</span><i class="mdi mdi-chevron-down" aria-hidden="true"></i>
            </button>
            <div class="dropdown-menu dropdown-menu-end">
                <button v-for="option in createOptions" :key="option.key" type="button" class="dropdown-item d-flex align-items-center gap-2" @click="emit('create', option)">
                    <i :class="option.icon" class="fs-5" aria-hidden="true"></i><span>{{ option.label }}</span>
                </button>
            </div>
        </div>

        <!-- Filter: count badge makes active filter state visible. -->
        <button type="button" class="btn btn-light waves-effect fw-bold d-flex align-items-center gap-2 text-nowrap" title="Open inventory filters" @click="emit('filter')">
            <i class="mdi mdi-filter-variant fs-5" aria-hidden="true"></i><span>Filter</span>
            <span v-if="filterCount" class="badge rounded-pill bg-primary">{{ filterCount }}</span>
        </button>

        <!-- Columns: controlled by the parent so the visible table can follow the same selection. -->
        <div class="dropdown">
            <button type="button" class="btn btn-light waves-effect fw-bold d-flex align-items-center gap-2 text-nowrap" data-bs-toggle="dropdown" aria-expanded="false" title="Choose table columns">
                <i class="mdi mdi-format-columns fs-5" aria-hidden="true"></i><span>Columns</span><i class="mdi mdi-chevron-down" aria-hidden="true"></i>
            </button>
            <div class="dropdown-menu dropdown-menu-end p-3" style="min-width: 220px;">
                <p class="small text-muted mb-2">{{ visibleColumns }} of {{ columns.length }} visible</p>
                <div v-for="column in columns" :key="column.key" class="form-check mb-2">
                    <input :id="`reference-column-${column.key}`" class="form-check-input" type="checkbox" :checked="column.visible" @change="updateColumn(column, $event)">
                    <label class="form-check-label" :for="`reference-column-${column.key}`">{{ column.label }}</label>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.reference-inventory-toolbar > form { min-width: min(100%, 260px); }
.reference-inventory-toolbar .search-icon { left: 12px; top: 50%; transform: translateY(-50%); }
.reference-inventory-toolbar input { min-width: 0; padding-left: 40px; }

@media (max-width: 575.98px) {
    .reference-inventory-toolbar > form { flex-basis: 100%; }
    .reference-inventory-toolbar > .dropdown,
    .reference-inventory-toolbar > button { flex: 1 1 auto; }
    .reference-inventory-toolbar > .dropdown > button,
    .reference-inventory-toolbar > button { width: 100%; justify-content: center; }
}
</style>
