<template>
    <!-- Bootstrap alert shell with optional tone border, Iconify icon, title, and local dismiss control. -->
    <div v-if="visible" class="alert d-flex align-items-start gap-2 mb-0" :class="alertClasses" role="alert">
        <Icon v-if="icon" :icon="icon" class="reference-alert-icon flex-shrink-0 mt-1" aria-hidden="true" />
        <div class="flex-grow-1 min-w-0">
            <p v-if="title" class="fw-semibold mb-1">{{ title }}</p>
            <div><slot>{{ message }}</slot></div>
        </div>
        <button v-if="dismissible" type="button" class="btn-close ms-auto" :aria-label="dismissLabel" :title="dismissLabel" @click="dismiss" />
    </div>
</template>

<script setup>
// ---------------------------------------------------------------
// Reference alert: Bootstrap tone with optional border, icon, title, and dismiss button.
// It is presentation-only; the parent owns the message and handles the dismiss event.
// ---------------------------------------------------------------
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'

// Inputs
const props = defineProps({
    tone: { type: String, default: 'info' },
    bordered: { type: Boolean, default: false },
    icon: { type: String, default: '' },
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    dismissible: { type: Boolean, default: false },
    dismissLabel: { type: String, default: 'Dismiss alert' },
})
const emit = defineEmits(['dismiss'])

// Alert visibility
const visible = ref(true)
const allowedTones = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark']
const toneBorderClasses = {
    primary: 'border-soft-primary',
    secondary: 'border-soft-secondary',
    success: 'border-soft-success',
    danger: 'border-soft-danger',
    warning: 'border-soft-warning',
    info: 'border-soft-info',
    light: 'border',
    dark: 'border-soft-dark',
}
const safeTone = computed(() => allowedTones.includes(props.tone) ? props.tone : 'info')
const alertClasses = computed(() => [
    `alert-${safeTone.value}`,
    props.bordered ? toneBorderClasses[safeTone.value] : 'border-0',
])

// ---- Dismiss ----
function dismiss() {
    visible.value = false
    emit('dismiss')
}
</script>

<style scoped>
.reference-alert-icon {
    width: 20px;
    height: 20px;
}
</style>
