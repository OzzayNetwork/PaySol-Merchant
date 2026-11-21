<template>
    <!-- Pages & actions: places in the business console that match the search, above records -->
    <div v-if="items.length" class="card overflow-hidden">
        <!-- Group head, as the record groups have -->
        <div class="card-body d-flex align-items-center justify-content-between gap-3 py-3">
            <span class="d-flex align-items-center gap-3 min-w-0">
                <span class="ps-tile" style="background: #EEF4FF; color: #2164F3;">
                    <Icon icon="ri:compass-3-line" />
                </span>
                <span class="min-w-0">
                    <span class="d-block fw-semibold text-dark font-size-15">
                        Pages &amp; actions <span class="text-muted fw-normal">· {{ items.length }}</span>
                    </span>
                    <span class="text-muted small">Where to go in {{ tenantName }}, and what you can do there</span>
                </span>
            </span>
        </div>

        <!-- Rows: where it sits, what it is, and a button that says what will happen -->
        <router-link v-for="d in items" :key="d.key" :to="d.to" class="ps-row text-reset">
            <span class="ps-tile ps-tile-lg" :style="tileStyle(d)">
                <Icon :icon="d.icon || 'ri:compass-line'" />
            </span>
            <span class="min-w-0 flex-grow-1">
                <span class="ps-crumb">{{ tenantName }} <Icon icon="ri:arrow-right-s-line" /> {{ d.crumb || 'Pages' }}</span>
                <span class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="fw-semibold text-dark font-size-15">{{ d.label }}</span>
                    <span class="badge rounded-pill" :class="kindTone(d.kind)">{{ KIND_LABELS[d.kind] || 'Page' }}</span>
                </span>
                <span v-if="d.description || d.matchedKeyword" class="d-block text-muted small mt-1 text-truncate">
                    {{ d.description || `Also called “${d.matchedKeyword}”` }}
                </span>
            </span>
            <span class="btn btn-soft-primary btn-sm flex-shrink-0 d-none d-sm-inline-flex">
                {{ buttonLabel(d) }}
            </span>
        </router-link>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useAuthStore } from '@/stores/auth';
import { KIND_LABELS } from '@/nav/searchDestinations';

defineProps({
    items: { type: Array, default: () => [] },
});

const authStore = useAuthStore();
const tenantName = computed(() => authStore.currentTenant?.name || 'Your business');

// Pages blue, tabs grey, actions green
const kindTone = (kind) => {
    if (kind === 'action') return 'bg-success-subtle text-success';
    if (kind === 'tab') return 'bg-light text-dark';
    return 'bg-primary-subtle text-primary';
};

const tileStyle = (d) => {
    if (d.kind === 'action') return { background: '#E3F5EC', color: '#1E7F45' };
    return { background: '#EEF4FF', color: '#2164F3' };
};

const buttonLabel = (d) => {
    if (d.kind === 'action') {
        return d.to.includes('/add') || d.to.includes('do=') ? 'Start' : 'Go there';
    }
    return d.kind === 'tab' ? 'Open tab' : 'Open page';
};
</script>

<style scoped>
.min-w-0 { min-width: 0 }
.ps-row {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 16px 20px;
    border-top: 1px solid #EFF2F7;
    text-decoration: none;
    transition: background-color 0.15s ease-in-out;
}
.ps-row:hover { background: #FAFBFD }
.ps-tile {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 17px;
}
.ps-tile-lg {
    width: 40px;
    height: 40px;
    font-size: 19px;
}
.ps-crumb {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: #74788D;
    margin-bottom: 2px;
    min-width: 0;
}
</style>
