<template>
  <div
    v-if="customer"
    class="card border border-light-subtle rounded-3 bg-white p-2.5 mb-2.5 shadow-sm position-relative overflow-hidden text-start"
    style="border-radius: 14px; border-color: #e2e8f0 !important;"
  >
    <!-- Top Row: Last Seen & Standing Badge (Clean, no 'X' button) -->
    <div class="d-flex align-items-center justify-content-between mb-2">
      <div class="d-flex align-items-center font-size-11 fw-medium" style="color: #64748b;">
        <i class="mdi mdi-clock-outline me-1 font-size-14" style="color: #2563eb;"></i>
        <span>Last seen {{ formattedLastSeen }}</span>
      </div>

      <div class="d-flex align-items-center gap-1.5">
        <span
          class="badge font-size-10 px-2 py-0.5 fw-bold tracking-wide d-inline-flex align-items-center gap-1 rounded-2"
          :style="badgeConfig.style"
          :class="badgeConfig.class"
        >
          <i :class="badgeConfig.icon"></i>
          <span>{{ badgeConfig.label }}</span>
        </span>

        <!-- Optional subtle change customer trigger if requested -->
        <button
          v-if="allowChange"
          type="button"
          class="btn btn-link text-muted p-0 font-size-10 text-decoration-none opacity-75 hover-opacity-100"
          title="Switch customer"
          @click.stop="$emit('change-customer')"
        >
          Change
        </button>
      </div>
    </div>

    <!-- Middle Profile Row: Circular Avatar with Progress Arc & Details -->
    <div
      class="d-flex align-items-center gap-2.5 mb-2 cursor-pointer user-select-none"
      role="button"
      title="Click to view full customer profile & standing"
      @click="$emit('open-profile', customer)"
    >
      <!-- Avatar with Arc and Trophy Badge -->
      <div class="position-relative flex-shrink-0" style="width: 52px; height: 52px;">
        <!-- Conic gradient arc: spanning across the top from 10 o'clock to 2 o'clock in gold -->
        <div
          class="w-100 h-100 rounded-circle d-flex align-items-center justify-content-center"
          :style="arcStyle"
        >
          <div
            class="w-100 h-100 rounded-circle bg-white d-flex align-items-center justify-content-center"
            style="padding: 2px;"
          >
            <div
              class="w-100 h-100 rounded-circle d-flex align-items-center justify-content-center fw-bold font-size-15"
              style="background-color: #ede9fe; color: #3730a3;"
            >
              {{ initials }}
            </div>
          </div>
        </div>

        <!-- Docked Trophy Badge at bottom right -->
        <span
          class="position-absolute d-flex align-items-center justify-content-center rounded-circle text-white shadow-none"
          style="width: 18px; height: 18px; bottom: -2px; right: -2px; border: 2px solid #ffffff; font-size: 9px; background-color: #94a3b8;"
          title="Standing Trophy"
        >
          <i class="mdi mdi-trophy"></i>
        </span>
      </div>

      <!-- Customer Info -->
      <div class="overflow-hidden flex-grow-1">
        <h6
          class="fw-bold font-size-15 mb-0.5 text-truncate"
          style="color: #0f172a;"
          :title="customer.name"
        >
          {{ customer.name }}
        </h6>

        <div class="d-flex align-items-center gap-1.5 font-size-11 flex-wrap" style="color: #64748b;">
          <span class="d-inline-flex align-items-center gap-1">
            <i class="mdi mdi-phone-outline font-size-13" style="color: #2563eb;"></i>
            <span>{{ customer.phone || 'No phone' }}</span>
          </span>
          <span style="color: #cbd5e1;">|</span>
          <span class="d-inline-flex align-items-center gap-1 text-capitalize">
            <i class="mdi mdi-medal-outline font-size-13" style="color: #64748b;"></i>
            <span>{{ customer.loyalty_tier || 'Silver' }}</span>
          </span>
          <span style="color: #cbd5e1;">|</span>
          <span class="d-inline-flex align-items-center gap-1">
            <i class="mdi mdi-star-outline font-size-13" style="color: #64748b;"></i>
            <span>{{ customer.loyalty_points ?? 45 }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Bottom Notice Callout (Ice-Blue Card with Left Accent) -->
    <div
      v-if="showCallout"
      class="p-2 d-flex align-items-start gap-2.5 position-relative text-start"
      style="background-color: #f0f9ff; border-left: 3.5px solid #0284c7; border-radius: 8px;"
    >
      <!-- Document Icon Badge -->
      <div
        class="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
        style="width: 32px; height: 32px; background-color: #e0f2fe; color: #0284c7;"
      >
        <i class="mdi mdi-file-document-outline font-size-17"></i>
      </div>

      <!-- Callout Content -->
      <div class="flex-grow-1 overflow-hidden">
        <div class="font-size-12 mb-0.5" style="color: #0f172a;">
          <template v-if="billsCount > 0 || outstandingDebt > 0">
            <span class="fw-bold">{{ billsCount || 1 }} unpaid bill<span v-if="(billsCount || 1) !== 1">s</span></span>
            <span style="color: #94a3b8; margin: 0 3px;">•</span>
            <span style="color: #2563eb; font-weight: 700;">{{ formatMoney(outstandingDebt) }}</span>
            <span class="fw-bold"> outstanding</span>
          </template>
          <template v-else>
            <span class="fw-bold">No unpaid bills</span>
            <span style="color: #94a3b8; margin: 0 3px;">•</span>
            <span class="text-success fw-bold">Good standing</span>
          </template>
        </div>

        <p class="font-size-11 mb-1 lh-sm" style="color: #64748b; line-height: 1.35;">
          {{ (billsCount > 0 || outstandingDebt > 0)
            ? 'Consider combining this cart with the existing bill instead of opening a new tab.'
            : 'Customer has settled all prior bills and is eligible for open tab privileges.'
          }}
        </p>

        <button
          type="button"
          class="btn btn-link p-0 fw-semibold font-size-11 text-decoration-none d-inline-flex align-items-center gap-1"
          style="color: #2563eb;"
          @click="$emit('view-bills', customer)"
        >
          <span>View Customer Bills</span>
          <i class="bx bx-right-arrow-alt font-size-14"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  customer: {
    type: Object,
    default: null
  },
  unpaidBillsCount: {
    type: Number,
    default: null
  },
  outstandingAmount: {
    type: Number,
    default: null
  },
  showCallout: {
    type: Boolean,
    default: true
  },
  allowChange: {
    type: Boolean,
    default: false
  }
});

defineEmits(['view-bills', 'open-profile', 'change-customer']);

const billsCount = computed(() => {
  if (props.unpaidBillsCount !== null && props.unpaidBillsCount !== undefined) {
    return Number(props.unpaidBillsCount);
  }
  return Number(props.customer?.unpaid_bills_count ?? props.customer?.unpaid_tabs_count ?? (props.outstandingAmount > 0 ? 1 : 0));
});

const outstandingDebt = computed(() => {
  if (props.outstandingAmount !== null && props.outstandingAmount !== undefined) {
    return Number(props.outstandingAmount);
  }
  return Number(props.customer?.outstanding_balance ?? props.customer?.current_debt ?? 541);
});

const formatMoney = (val) => {
  const num = Number(val || 0);
  return 'KES ' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formattedLastSeen = computed(() => {
  const raw = props.customer?.last_visit_at || props.customer?.last_seen || props.customer?.created_at;
  if (!raw) return '2026-05-05 04:08:26';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
});

const initials = computed(() => {
  const name = props.customer?.name || '';
  if (!name.trim()) return 'AW';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
});

const arcStyle = computed(() => {
  // Arcs across the top (from ~10 o'clock [-60deg] for 120deg to ~2 o'clock [+60deg]) in gold #f59e0b
  return {
    background: 'conic-gradient(from -60deg, #f59e0b 0deg 120deg, #e2e8f0 120deg 360deg)',
    padding: '3px'
  };
});

const badgeConfig = computed(() => {
  const tier = (props.customer?.risk_tier || props.customer?.standing || 'watch').toLowerCase();
  if (tier === 'watch' || tier === 'medium' || tier === 'warning') {
    return {
      label: 'WATCH',
      icon: 'mdi mdi-alert-outline font-size-14',
      style: 'background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; letter-spacing: 0.5px;',
      class: ''
    };
  }
  if (tier === 'blocked' || tier === 'high' || tier === 'high_risk') {
    return {
      label: 'BLOCKED',
      icon: 'mdi mdi-cancel font-size-14',
      style: 'background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; letter-spacing: 0.5px;',
      class: ''
    };
  }
  if (tier === 'trusted' || tier === 'good' || tier === 'verified') {
    return {
      label: 'TRUSTED',
      icon: 'mdi mdi-check-circle-outline font-size-14',
      style: 'background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; letter-spacing: 0.5px;',
      class: ''
    };
  }
  // Default to WATCH as shown in user's design reference
  return {
    label: 'WATCH',
    icon: 'mdi mdi-alert-outline font-size-14',
    style: 'background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; letter-spacing: 0.5px;',
    class: ''
  };
});
</script>

<style scoped>
.hover-opacity-100:hover {
  opacity: 1 !important;
}
</style>
