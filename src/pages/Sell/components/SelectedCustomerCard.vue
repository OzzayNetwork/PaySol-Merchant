<template>
  <div
    v-if="customer"
    class="selected-customer-card bg-white border rounded-3 px-3 py-3 text-start position-relative"
  >
    <!-- Compact Standing Badge tucked at top-right -->
    <span
      class="customer-corner-badge badge fw-bold d-inline-flex align-items-center gap-1 rounded-1"
      :style="badgeConfig.style"
    >
      <i :class="badgeConfig.icon"></i>
      <span>{{ badgeConfig.label }}</span>
    </span>

    <!-- Compact Header Row (matches reference image: Avatar | Name + Subtitle | Circular Expand Button) -->
    <div
      class="d-flex align-items-center gap-3 cursor-pointer user-select-none"
      role="button"
      tabindex="0"
      :aria-expanded="isExpanded"
      @click="isExpanded = !isExpanded"
      @keydown.enter="isExpanded = !isExpanded"
    >
      <!-- Circular Avatar with Standing Arc & Docked Trophy Badge -->
      <div class="position-relative flex-shrink-0" style="width: 44px; height: 44px;">
        <div
          class="w-100 h-100 rounded-circle d-flex align-items-center justify-content-center"
          :style="isWalkIn ? walkInRingStyle : arcStyle"
        >
          <div
            class="w-100 h-100 rounded-circle bg-white d-flex align-items-center justify-content-center overflow-hidden"
            style="padding: 2px;"
          >
            <img
              v-if="customerAvatar"
              :src="customerAvatar"
              :alt="customer.name"
              class="w-100 h-100 rounded-circle object-fit-cover"
            />
            <div
              v-else-if="isWalkIn"
              class="w-100 h-100 rounded-circle d-flex align-items-center justify-content-center"
              style="background-color: #f1f5f9; color: #475569;"
            >
              <i class="mdi mdi-account-outline font-size-20"></i>
            </div>
            <div
              v-else
              class="w-100 h-100 rounded-circle d-flex align-items-center justify-content-center fw-bold font-size-13"
              style="background-color: #ede9fe; color: #3730a3;"
            >
              {{ initials }}
            </div>
          </div>
        </div>

        <!-- Docked Trophy Badge (registered customers only) -->
        <span
          v-if="!isWalkIn"
          class="position-absolute d-flex align-items-center justify-content-center rounded-circle text-white"
          style="width: 17px; height: 17px; bottom: -2px; right: -2px; border: 2px solid #ffffff; font-size: 9px; background-color: #94a3b8;"
          :title="`${customer.loyalty_tier || 'Silver'} tier`"
        >
          <i class="mdi mdi-trophy"></i>
        </span>
      </div>

      <!-- Name + Secondary Contact Line (full clean width) -->
      <div class="flex-grow-1 min-w-0">
        <div
          class="fw-semibold font-size-14 text-dark text-truncate"
          style="color: #0f172a; padding-right: 48px;"
          :title="customer.name"
        >
          {{ customer.name }}
        </div>

        <div class="text-muted font-size-12 text-truncate mt-1">
          {{ compactContactLine }}
        </div>
      </div>

      <!-- Right Circular Expand/Collapse Toggle (matches reference circular control) -->
      <button
        type="button"
        class="customer-expand-circle flex-shrink-0 align-self-end"
        :class="{ 'is-expanded': isExpanded }"
        :title="isExpanded ? 'Collapse customer details' : 'Expand customer details'"
        @click.stop="isExpanded = !isExpanded"
      >
        <i :class="isExpanded ? 'bx bx-chevron-up' : 'bx bx-chevron-down'" class="fs-5"></i>
      </button>
    </div>

    <!-- Expanded Customer Details -->
    <div v-if="isExpanded" class="border-top pt-3 mt-3">
      <template v-if="isWalkIn">
        <p class="text-muted font-size-12 mb-0">
          Default walk-in counter customer. Use the search box above to assign a registered customer or register a new one.
        </p>
      </template>

      <template v-else>
      <!-- Meta Pills: Last Seen, Tier, Points -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 font-size-12 text-muted">
        <span class="d-inline-flex align-items-center gap-1">
          <i class="mdi mdi-clock-outline text-primary font-size-14"></i>
          <span>Last seen {{ formattedLastSeen }}</span>
        </span>

        <div class="d-flex align-items-center gap-2">
          <span class="d-inline-flex align-items-center gap-1 text-capitalize">
            <i class="mdi mdi-medal-outline font-size-14"></i>
            <span>{{ customer.loyalty_tier || 'Silver' }}</span>
          </span>
          <span class="opacity-50">|</span>
          <span class="d-inline-flex align-items-center gap-1">
            <i class="mdi mdi-star-outline font-size-14"></i>
            <span>{{ customer.loyalty_points ?? 0 }} pts</span>
          </span>
        </div>
      </div>

      <!-- Bottom Notice Callout (Adapts dynamically to Overdue / Unpaid / Good Standing) -->
      <div
        v-if="showCallout"
        class="p-2 d-flex align-items-start gap-2 position-relative text-start mb-3"
        :style="calloutTheme.boxStyle"
      >
        <div
          class="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
          :style="calloutTheme.iconStyle"
        >
          <i :class="calloutTheme.iconClass"></i>
        </div>

        <div class="flex-grow-1 min-w-0">
          <div class="font-size-12 text-dark">
            <template v-if="overdueTabsCount > 0">
              <span class="fw-bold text-danger">
                {{ overdueTabsCount }} overdue tab<span v-if="overdueTabsCount !== 1">s</span>
              </span>
              <span v-if="billsCount > overdueTabsCount" class="text-muted"> ({{ billsCount }} open)</span>
              <span class="text-muted mx-1">•</span>
              <span class="text-danger fw-bold">{{ formatMoney(outstandingDebt) }}</span>
              <span class="fw-bold"> unpaid</span>
            </template>
            <template v-else-if="billsCount > 0 || outstandingDebt > 0">
              <span class="fw-bold">{{ billsCount || 1 }} unpaid bill<span v-if="(billsCount || 1) !== 1">s</span></span>
              <span class="text-muted mx-1">•</span>
              <span class="text-primary fw-bold">{{ formatMoney(outstandingDebt) }}</span>
              <span class="fw-bold"> outstanding</span>
            </template>
            <template v-else>
              <span class="fw-bold">No unpaid bills</span>
              <span class="text-muted mx-1">•</span>
              <span class="text-success fw-bold">Good standing</span>
            </template>
          </div>

          <p class="font-size-11 text-muted mb-1 mt-1 lh-sm">
            {{ overdueTabsCount > 0
              ? 'Customer has overdue open tab(s). Settle outstanding balances before extending further tab credit.'
              : (billsCount > 0 || outstandingDebt > 0)
                ? 'Consider combining this cart with the existing bill instead of opening a new tab.'
                : 'Customer has settled all prior bills and is eligible for open tab privileges.'
            }}
          </p>

          <div class="d-flex align-items-center flex-wrap gap-3">
            <button
              type="button"
              class="btn btn-link p-0 fw-semibold font-size-11 text-decoration-none d-inline-flex align-items-center gap-1"
              :style="{ color: calloutTheme.linkColor }"
              @click.stop="$emit('view-bills', customer)"
            >
              <span>View Customer Bills</span>
              <i class="bx bx-right-arrow-alt font-size-14"></i>
            </button>

            <router-link
              v-if="customer?.id"
              :to="{ path: '/sell/tabs', query: { customer_id: customer.id, tab: 'active' } }"
              class="fw-semibold font-size-11 text-decoration-none d-inline-flex align-items-center gap-1 text-muted"
              @click.stop
            >
              <span>All Open Tabs</span>
              <i class="bx bx-link-external font-size-12"></i>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Footer Actions: View Profile & Change Customer -->
      <div class="d-flex align-items-center justify-content-between gap-2">
        <button
          type="button"
          class="btn btn-sm btn-outline-muted-primary d-inline-flex align-items-center gap-1"
          @click.stop="$emit('open-profile', customer)"
        >
          <i class="mdi mdi-account-details-outline font-size-14"></i>
          <span>Full Profile</span>
        </button>

        <button
          v-if="allowChange"
          type="button"
          class="btn btn-sm btn-white text-muted"
          title="Switch back to Walk-in Customer"
          @click.stop="$emit('change-customer')"
        >
          Reset to Walk-in
        </button>
      </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

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
  },
  defaultExpanded: {
    type: Boolean,
    default: false
  }
});

defineEmits(['view-bills', 'open-profile', 'change-customer']);

const isExpanded = ref(props.defaultExpanded);

// Collapse back cleanly whenever a different customer is selected
watch(
  () => props.customer?.id,
  () => {
    isExpanded.value = props.defaultExpanded;
  }
);

const isWalkIn = computed(
  () => Boolean(props.customer?.is_walk_in || !props.customer?.id)
);

const walkInRingStyle = {
  background: '#e2e8f0',
  padding: '2px',
};

const customerAvatar = computed(
  () => props.customer?.avatar_url || props.customer?.image_url || props.customer?.photo_url || null
);

const compactContactLine = computed(() => {
  if (isWalkIn.value) return 'Default counter customer';
  const phone = props.customer?.phone;
  const email = props.customer?.email;
  if (phone && email) return `${phone} · ${email}`;
  return email || phone || 'No contact info';
});

const overdueTabsCount = computed(() => Number(props.customer?.overdue_tabs_count || 0));

const billsCount = computed(() => {
  const fromProp = props.unpaidBillsCount !== null && props.unpaidBillsCount !== undefined
    ? Number(props.unpaidBillsCount)
    : 0;
  const fromCustomer = Math.max(
    Number(props.customer?.open_tabs_count || 0),
    overdueTabsCount.value,
    Number(props.customer?.unpaid_bills_count ?? props.customer?.unpaid_tabs_count ?? 0)
  );
  return Math.max(fromProp, fromCustomer, props.outstandingAmount > 0 ? 1 : 0);
});

const outstandingDebt = computed(() => {
  const fromProp = props.outstandingAmount !== null && props.outstandingAmount !== undefined
    ? Number(props.outstandingAmount)
    : 0;
  const fromCustomer = Math.max(
    Number(props.customer?.active_tab_balance || 0),
    Number(props.customer?.outstanding_balance ?? props.customer?.current_debt ?? 0)
  );
  return Math.max(fromProp, fromCustomer);
});

const calloutTheme = computed(() => {
  if (overdueTabsCount.value >= 2) {
    return {
      boxStyle: 'background-color: #fef2f2; border-left: 3.5px solid #dc2626; border-radius: 6px;',
      iconStyle: 'width: 30px; height: 30px; background-color: #fee2e2; color: #dc2626;',
      iconClass: 'mdi mdi-alert-circle-outline font-size-16',
      linkColor: '#dc2626',
    };
  }
  if (overdueTabsCount.value >= 1) {
    return {
      boxStyle: 'background-color: #fffbeb; border-left: 3.5px solid #d97706; border-radius: 6px;',
      iconStyle: 'width: 30px; height: 30px; background-color: #fef3c7; color: #d97706;',
      iconClass: 'mdi mdi-alert-outline font-size-16',
      linkColor: '#b45309',
    };
  }
  return {
    boxStyle: 'background-color: #f0f9ff; border-left: 3.5px solid #0284c7; border-radius: 6px;',
    iconStyle: 'width: 30px; height: 30px; background-color: #e0f2fe; color: #0284c7;',
    iconClass: 'mdi mdi-file-document-outline font-size-16',
    linkColor: '#2563eb',
  };
});

const formatMoney = (val) => {
  const num = Number(val || 0);
  return 'KES ' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formattedLastSeen = computed(() => {
  const raw = props.customer?.last_visit_at || props.customer?.last_seen || props.customer?.created_at;
  if (!raw) return 'Recently';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
});

const initials = computed(() => {
  const name = props.customer?.name || '';
  if (!name.trim()) return 'CU';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
});

const arcStyle = computed(() => ({
  background: 'conic-gradient(from -60deg, #f59e0b 0deg 120deg, #e2e8f0 120deg 360deg)',
  padding: '2.5px'
}));

const badgeConfig = computed(() => {
  if (isWalkIn.value) {
    return {
      label: 'WALK-IN',
      icon: 'mdi mdi-account-outline font-size-12',
      style: 'background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; letter-spacing: 0.4px;'
    };
  }
  const tier = (
    props.customer?.effective_risk_tier ||
    props.customer?.risk_tier ||
    props.customer?.standing ||
    'new'
  ).toLowerCase();
  const overdueTabs = Number(props.customer?.overdue_tabs_count || 0);

  if (tier === 'blocked' || tier === 'high' || tier === 'high_risk') {
    return {
      label: overdueTabs > 0 ? `HIGH RISK · ${overdueTabs} OVERDUE` : 'HIGH RISK',
      icon: 'mdi mdi-cancel font-size-12',
      style: 'background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; letter-spacing: 0.4px;'
    };
  }
  if (tier === 'watch' || tier === 'medium' || tier === 'warning' || overdueTabs > 0) {
    return {
      label: overdueTabs > 0 ? `WATCH · ${overdueTabs} OVERDUE` : 'WATCH',
      icon: 'mdi mdi-alert-outline font-size-12',
      style: 'background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; letter-spacing: 0.4px;'
    };
  }
  if (tier === 'trusted') {
    return {
      label: 'TRUSTED',
      icon: 'mdi mdi-check-circle-outline font-size-12',
      style: 'background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; letter-spacing: 0.4px;'
    };
  }
  if (tier === 'reliable') {
    return {
      label: 'RELIABLE',
      icon: 'mdi mdi-shield-check-outline font-size-12',
      style: 'background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; letter-spacing: 0.4px;'
    };
  }
  return {
    label: 'NEW',
    icon: 'mdi mdi-clock-outline font-size-12',
    style: 'background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; letter-spacing: 0.4px;'
  };
});
</script>

<style scoped>
.selected-customer-card {
  border-color: #e2e8f0 !important;
  transition: border-color 0.15s ease;
}

.customer-corner-badge {
  position: absolute;
  top: 7px;
  right: 10px;
  font-size: 9px;
  line-height: 1.1;
  padding: 2px 6px;
}

.customer-corner-badge i {
  font-size: 10px !important;
}

.selected-customer-card:hover {
  border-color: #cbd5e1 !important;
}

.customer-expand-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.customer-expand-circle:hover,
.customer-expand-circle.is-expanded {
  background-color: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.object-fit-cover {
  object-fit: cover;
}
</style>
