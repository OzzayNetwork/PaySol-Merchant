<script setup>
// ---------------------------------------------------------------
// Reusable slot-based modal shell for the component reference page.
// This component owns presentation only; the parent owns form state and actions.
// ---------------------------------------------------------------

import { ref } from 'vue'

// Props / events
const props = defineProps({
    id: { type: String, default: 'referenceModal' },
    title: { type: String, default: '' },
    size: { type: String, default: 'modal-lg' },
    // `standard` uses the normal divider; `soft` matches product form headers.
    titleStyle: { type: String, default: 'standard', validator: (value) => ['standard', 'soft'].includes(value) },
    closeDisabled: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

// Visibility
const visible = ref(false)

// ---- Modal controls ----
function open() {
    visible.value = true
}

function close() {
    if (props.closeDisabled) return
    visible.value = false
    emit('close')
}

defineExpose({ open, close })
</script>

<template>
    <div
        v-if="visible"
        class="modal fade show"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`${id}-title`"
        style="display: block;"
        @keydown.esc="close"
    >
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable animate__animated animate__zoomInUp animate__faster" :class="size">
            <div class="modal-content">
                <!-- Header: close stays in the familiar round grey control. -->
                <div class="modal-header" :class="titleStyle === 'soft' ? 'border-0 bg-light px-4 pt-4 pb-4' : 'border-bottom'">
                    <h5 :id="`${id}-title`" class="modal-title fw-bold text-black fs-4 mb-1">{{ title }}</h5>
                    <button
                        type="button"
                        class="btn reference-modal-close"
                        title="Close dialog"
                        aria-label="Close dialog"
                        :disabled="closeDisabled"
                        @click="close"
                    >
                        <i class="bx bx-x" aria-hidden="true"></i>
                    </button>
                </div>

                <!-- Body and footer are slots so each page owns its content and actions. -->
                <div class="modal-body">
                    <slot />
                </div>
                <div v-if="$slots.footer" class="modal-footer">
                    <slot name="footer" />
                </div>
            </div>
        </div>
    </div>
    <div v-if="visible" class="modal-backdrop fade show" @click="close"></div>
</template>

<style scoped>
.modal.show { background: transparent; }
.reference-modal-close {
    width: 34px;
    height: 34px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.05);
    display: grid;
    place-items: center;
}
.reference-modal-close:hover { background: rgba(0, 0, 0, 0.1); }
.reference-modal-close i { color: #343a40; font-size: 22px; line-height: 1; }
</style>
