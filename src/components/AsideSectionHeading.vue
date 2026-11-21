<script setup>
// ---------------------------------------------------------------
// Shared heading treatments used inside PaySol offcanvas panels.
// `sticky` follows record details, `plain` follows filters, and `toolbar`
// holds a right-side control such as the Stock Insights date picker.
// ---------------------------------------------------------------

defineProps({
    title: { type: String, required: true },
    variant: { type: String, default: 'sticky', validator: (value) => ['sticky', 'plain', 'toolbar'].includes(value) },
})
</script>

<template>
    <div
        class="d-flex align-items-center justify-content-between"
        :class="variant === 'toolbar'
            ? 'aside-heading-toolbar px-3 py-2 fw-bold text-dark sticky-top bg-white border-top'
            : variant === 'sticky'
                ? 'px-4 py-2 fw-bold text-black text-dark sticky-top border-top bg-light'
                : 'px-4 py-2 fw-bold text-black bg-light border-bottom'"
    >
        <span>{{ title }}</span>
        <slot />
    </div>
</template>

<style scoped>
.aside-heading-toolbar { z-index: 2100; }
</style>
