<script setup>
// ---------------------------------------------------------------
// Reusable slot-based details aside for the component reference page.
// The parent owns the record, its data, and any actions that change it.
// ---------------------------------------------------------------

import { onBeforeUnmount, onMounted, ref } from 'vue'

// Props / events
const props = defineProps({
    id: { type: String, required: true },
    title: { type: String, default: 'Details' },
    width: { type: String, default: '520px' },
    // `details` is the compact back-arrow header; `icon` is the title/subtitle header.
    headerStyle: { type: String, default: 'details', validator: (value) => ['details', 'icon'].includes(value) },
    subtitle: { type: String, default: '' },
    icon: { type: String, default: 'mdi mdi-cog-outline' },
})
const emit = defineEmits(['close', 'save'])

// Element ref
const asideElement = ref(null)
let hiddenHandler = null

// ---- Offcanvas controls ----
function open() {
    const Offcanvas = window.bootstrap?.Offcanvas
    if (!Offcanvas || !asideElement.value) return
    Offcanvas.getOrCreateInstance(asideElement.value).show()
}

function close() {
    const Offcanvas = window.bootstrap?.Offcanvas
    if (!Offcanvas || !asideElement.value) return
    Offcanvas.getOrCreateInstance(asideElement.value).hide()
}

function onHidden() {
    emit('close')
}

onMounted(() => {
    hiddenHandler = onHidden
    asideElement.value?.addEventListener('hidden.bs.offcanvas', hiddenHandler)
})

onBeforeUnmount(() => {
    if (hiddenHandler) asideElement.value?.removeEventListener('hidden.bs.offcanvas', hiddenHandler)
    const Offcanvas = window.bootstrap?.Offcanvas
    const instance = Offcanvas?.getInstance(asideElement.value)
    instance?.dispose()
})

defineExpose({ open, close })
</script>

<template>
    <aside
        :id="id"
        ref="asideElement"
        class="offcanvas offcanvas-end"
        tabindex="-1"
        :aria-labelledby="`${id}-title`"
        :style="{ width, maxWidth: '100vw' }"
    >
        <!-- Compact header: back arrow, plain title, and optional quick actions match record details asides. -->
        <header v-if="headerStyle === 'details'" class="offcanvas-header border-bottom py-0 pe-0">
            <div class="d-flex align-items-center gap-2 min-w-0">
                <button
                    type="button"
                    class="btn btn-white avatar-sm rounded-circle p-0"
                    title="Close details"
                    aria-label="Close details"
                    @click="close"
                >
                    <span class="avatar-title bg-transparent text-reset">
                        <i class="bx bx-arrow-back font-size-22" aria-hidden="true"></i>
                    </span>
                </button>
                <h2 :id="`${id}-title`" class="h5 mb-0 text-truncate">{{ title }}</h2>
            </div>
            <div class="d-flex align-items-center gap-1">
                <slot name="actions" />
            </div>
        </header>

        <!-- Icon header: round icon, bold title, subtitle, and close control match the older settings aside. -->
        <header v-else class="offcanvas-header border-bottom px-4 py-3">
            <div class="d-flex align-items-center gap-3 min-w-0">
                <div class="reference-aside-icon rounded-circle bg-light d-flex align-items-center justify-content-center">
                    <i :class="icon" class="fs-3 text-dark" aria-hidden="true"></i>
                </div>
                <div class="min-w-0">
                    <h2 :id="`${id}-title`" class="h5 mb-0 fw-bold text-truncate">{{ title }}</h2>
                    <small class="text-muted">{{ subtitle }}</small>
                </div>
            </div>
            <button type="button" class="btn p-0 border-0" title="Close aside" aria-label="Close aside" @click="close">
                <i class="bx bx-x fs-2" aria-hidden="true"></i>
            </button>
        </header>

        <!-- The default slot contains sticky section labels and label/value rows. -->
        <div class="offcanvas-body" :class="headerStyle === 'icon' ? 'p-4' : 'p-0'">
            <slot />
        </div>

        <!-- Optional footer follows the padded icon-header layout; pages can supply their own actions. -->
        <footer v-if="$slots.footer" class="border-top px-4 py-3">
            <slot name="footer" />
        </footer>
    </aside>
</template>

<style scoped>
.reference-aside-icon { width: 48px; height: 48px; flex: 0 0 48px; }
</style>
