<template>
  <div class="d-inline-flex align-items-center ms-2">
    <!-- State 1: Active Shift -->
    <button
      v-if="shiftStore.isOnDuty"
      type="button"
      class="btn btn-sm d-flex align-items-center gap-2 px-3 py-1 rounded-pill transition-all border"
      style="background: rgba(52, 195, 143, 0.1); border-color: rgba(52, 195, 143, 0.3) !important; color: #208e64;"
      @click="shiftStore.openModal"
      title="View shift details"
    >
      <span
        class="spinner-grow spinner-grow-sm text-success flex-shrink-0"
        style="width: 8px; height: 8px;"
        role="status"
      ></span>
      <span class="fw-bold font-monospace fs-12">{{ shiftStore.activeShiftNumber }}</span>
      <span class="d-none d-md-inline opacity-75">·</span>
      <span class="d-none d-md-inline fw-semibold fs-12">{{ formatMoney(shiftStore.openingFloat) }}</span>
      <span class="badge bg-success rounded-pill fs-10 px-1 py-0 d-none d-sm-inline">
        {{ shiftStore.activeMembersCount }} on duty
      </span>
    </button>

    <!-- State 2: Active Shift Available to Join -->
    <button
      v-else-if="shiftStore.hasActiveShift"
      type="button"
      class="btn btn-sm btn-primary-subtle text-primary border border-primary-subtle d-flex align-items-center gap-2 px-3 py-1 rounded-pill transition-all"
      @click="shiftStore.openModal"
      title="Join active team shift"
    >
      <Icon icon="ri:team-line" class="fs-5 text-primary" />
      <span class="fw-semibold fs-12">Join Shift</span>
      <span class="badge bg-primary text-white rounded-pill fs-10 px-1">
        {{ shiftStore.activeShiftNumber }}
      </span>
    </button>

    <!-- State 3: No Active Shift -->
    <button
      v-else
      type="button"
      class="btn btn-sm btn-outline-warning border-dashed d-flex align-items-center gap-2 px-3 py-1 rounded-pill transition-all"
      @click="shiftStore.openModal"
      title="Open new cash shift"
    >
      <Icon icon="ri:time-line" class="fs-5 text-warning" />
      <span class="fw-semibold fs-12 d-none d-sm-inline">No Shift</span>
      <span class="badge bg-warning text-dark rounded-pill fs-10 px-1.5 py-0.5">Start</span>
    </button>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { useShiftStore } from "@/stores/shift";
import currency from "@/utils/currency";

const shiftStore = useShiftStore();

function formatMoney(amt) {
  return currency.formatKES(amt ?? 0);
}

onMounted(() => {
  shiftStore.checkCurrentShift();
});
</script>

<style scoped>
.fs-10 {
  font-size: 10px;
}
.fs-12 {
  font-size: 12px;
}
.border-dashed {
  border-style: dashed !important;
}
</style>
