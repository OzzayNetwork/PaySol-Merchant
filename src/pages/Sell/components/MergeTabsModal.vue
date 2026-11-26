<template>
    <div
        v-if="open"
        class="modal fade show d-block"
        tabindex="-1"
        style="background-color: rgba(15, 23, 42, 0.55); z-index: 1060;"
        @click.self="$emit('close')"
    >
        <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
            <div class="modal-content border-0 rounded-3 overflow-hidden shadow">
                <!-- Header -->
                <div class="modal-header bg-white border-bottom py-3 px-4">
                    <div class="d-flex align-items-center gap-2.5">
                        <span class="avatar-sm flex-shrink-0">
                            <span class="avatar-title rounded-circle tone-chip font-size-20" style="--tone: #556ee6;">
                                <Icon icon="ri:git-merge-line" />
                            </span>
                        </span>
                        <div>
                            <h5 class="modal-title font-size-16 fw-bold mb-0 text-dark">Merge {{ tabs.length }} Selected Tabs</h5>
                            <small class="text-muted font-size-12">Choose the primary tab that will keep all combined items</small>
                        </div>
                    </div>
                    <button type="button" class="btn-close shadow-none" :disabled="busy" @click="$emit('close')"></button>
                </div>

                <!-- Body -->
                <div class="modal-body p-4">
                    <label class="form-label font-size-12 fw-bold text-uppercase text-muted mb-2">
                        Select Target Tab
                    </label>
                    <div class="d-flex flex-column gap-2 mb-3">
                        <label
                            v-for="tab in tabs"
                            :key="tab.id"
                            class="d-flex align-items-center justify-content-between p-3 rounded border cursor-pointer transition-all"
                            :class="targetId === tab.id ? 'border-primary bg-primary-subtle' : 'bg-white'"
                        >
                            <div class="d-flex align-items-center gap-2.5 min-w-0">
                                <input
                                    v-model="targetId"
                                    type="radio"
                                    class="form-check-input mt-0"
                                    :value="tab.id"
                                    :disabled="busy"
                                />
                                <div class="min-w-0">
                                    <div class="fw-bold text-dark font-size-13 text-truncate">
                                        {{ tab.name || (tab.customer?.name ? `${tab.customer.name}'s Tab` : tab.tab_number) }}
                                    </div>
                                    <div class="text-muted font-size-11">
                                        <span class="font-monospace">{{ tab.tab_number }}</span>
                                        · {{ tab.items?.length || 0 }} item{{ (tab.items?.length || 0) === 1 ? '' : 's' }}
                                    </div>
                                </div>
                            </div>
                            <span class="fw-bold text-dark font-size-13 text-nowrap ms-2">
                                {{ formatKES(tab.total_amount) }}
                            </span>
                        </label>
                    </div>

                    <div class="p-3 rounded border bg-light d-flex align-items-center justify-content-between font-size-13">
                        <span class="text-muted">Combined Total ({{ totalItems }} items)</span>
                        <span class="fw-bold text-primary font-size-15">{{ formatKES(combinedTotal) }}</span>
                    </div>
                </div>

                <!-- Footer -->
                <div class="modal-footer bg-white border-top py-3 px-4 d-flex justify-content-end gap-2">
                    <button type="button" class="btn btn-white" :disabled="busy" @click="$emit('close')">
                        Cancel
                    </button>
                    <button
                        type="button"
                        class="btn btn-primary text-white d-inline-flex align-items-center gap-1.5"
                        :disabled="!targetId || busy"
                        @click="$emit('confirm', targetId)"
                    >
                        <span v-if="busy" class="spinner-border spinner-border-sm" role="status"></span>
                        <Icon v-else icon="ri:git-merge-line" class="fs-5" />
                        <span>{{ busy ? 'Merging...' : `Merge into Target` }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import { formatKES } from "@/utils/currency";

const props = defineProps({
    open: { type: Boolean, default: false },
    tabs: { type: Array, default: () => [] },
    busy: { type: Boolean, default: false },
});

defineEmits(["close", "confirm"]);

const targetId = ref(null);

watch(
    () => [props.open, props.tabs],
    ([isOpen, list]) => {
        if (isOpen && list?.length) {
            targetId.value = list[0].id;
        }
    },
    { immediate: true }
);

const totalItems = computed(() =>
    props.tabs.reduce((sum, t) => sum + (t.items?.length || 0), 0)
);

const combinedTotal = computed(() =>
    props.tabs.reduce((sum, t) => sum + Number(t.total_amount || 0), 0)
);
</script>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}
</style>
