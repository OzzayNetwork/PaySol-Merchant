<template>
  <div
    class="modal fade"
    :id="modalId"
    tabindex="-1"
    :aria-labelledby="`${modalId}Label`"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered" style="max-width: 440px;">
      <div class="modal-content rounded-4 border border-light-subtle bg-white shadow-none overflow-hidden" v-if="customerData">
        <!-- Top Soft Pastel Banner -->
        <div
          class="px-4 pt-3 pb-4 d-flex align-items-center justify-content-between position-relative"
          style="height: 104px; background: linear-gradient(135deg, rgba(85, 110, 230, 0.12) 0%, rgba(80, 165, 241, 0.16) 100%);"
        >
          <!-- Customer Identifier Chip -->
          <span class="badge rounded-pill bg-white text-secondary border font-monospace font-size-11 px-3 py-1.5 shadow-none">
            <i class="bx bx-id-card me-1.5 text-primary"></i>{{ customerData.customer_number || 'CUST-PROFILE' }}
          </span>

          <!-- Close Button -->
          <button
            type="button"
            class="btn-close font-size-11 p-2 bg-white rounded-circle shadow-none border"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>

        <!-- Centered Circular Avatar with Verified Standing Badge -->
        <div class="position-relative d-inline-block mx-auto text-center" style="margin-top: -46px; margin-bottom: 12px;">
          <div
            class="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold font-size-24"
            style="width: 82px; height: 82px; border: 4px solid #ffffff; background-color: #556ee6;"
          >
            {{ getInitials(customerData.name) }}
          </div>

          <!-- Verified / Standing Tick on Avatar -->
          <span
            class="position-absolute d-flex align-items-center justify-content-center rounded-circle text-white"
            style="width: 24px; height: 24px; bottom: 2px; right: 2px; border: 2.5px solid #ffffff; font-size: 12px;"
            :class="{
              'bg-secondary': riskTier === 'new',
              'bg-info': riskTier === 'reliable',
              'bg-success': riskTier === 'trusted',
              'bg-warning': riskTier === 'watch',
              'bg-danger': riskTier === 'high_risk'
            }"
            :title="riskTierLabel"
          >
            <i
              :class="{
                'bx bx-time-five': riskTier === 'new',
                'bx bx-check': ['reliable', 'trusted'].includes(riskTier),
                'bx bx-error': riskTier === 'watch',
                'bx bx-block': riskTier === 'high_risk'
              }"
            ></i>
          </span>
        </div>

        <!-- Identity Block -->
        <div class="px-4 text-center">
          <h5 class="fw-bold font-size-19 text-dark mb-1 text-truncate" :id="`${modalId}Label`" :title="customerData.name">
            {{ customerData.name }}
          </h5>

          <!-- Subtitle: Classification Pill & Entity Type -->
          <div class="d-flex align-items-center justify-content-center gap-2 mb-2 flex-wrap">
            <span
              class="badge rounded-pill font-size-11 px-3 py-1 d-inline-flex align-items-center gap-1.5"
              :class="riskBadgeClass"
            >
              <i :class="riskIconClass"></i>
              <span>{{ riskTierLabel }}</span>
            </span>

            <span class="badge rounded-pill bg-light text-secondary border font-size-11 px-2.5 py-1 text-capitalize">
              {{ customerData.customer_type || 'individual' }}
            </span>
          </div>

          <!-- Contact Details -->
          <div class="text-muted font-size-12 d-flex align-items-center justify-content-center gap-3 text-truncate mb-3.5">
            <span v-if="customerData.phone"><i class="bx bx-phone me-1"></i>{{ customerData.phone }}</span>
            <span v-if="customerData.phone && customerData.email" class="text-black-50">•</span>
            <span v-if="customerData.email"><i class="bx bx-envelope me-1"></i>{{ customerData.email }}</span>
          </div>
        </div>

        <!-- 3-Column Clean Stat Strip (Capsule) -->
        <div class="px-4 mb-3.5">
          <div class="bg-light rounded-4 py-3 px-3 d-flex justify-content-around text-center border-0">
            <div class="flex-fill">
              <div class="font-size-17 fw-bold text-dark lh-1 mb-1.5">{{ customerData.bills_issued_count || 0 }}</div>
              <div class="font-size-11 text-muted text-uppercase tracking-wider fw-medium">Total Bills</div>
            </div>
            <div class="border-end border-light-subtle my-1"></div>
            <div class="flex-fill">
              <div class="font-size-17 fw-bold text-success lh-1 mb-1.5">{{ promptSettlementRate }}%</div>
              <div class="font-size-11 text-muted text-uppercase tracking-wider fw-medium">Prompt Pay</div>
            </div>
            <div class="border-end border-light-subtle my-1"></div>
            <div class="flex-fill">
              <div class="font-size-17 fw-bold text-primary lh-1 mb-1.5">{{ (customerData.loyalty_points || 0).toLocaleString() }}</div>
              <div class="font-size-11 text-muted text-uppercase tracking-wider text-capitalize fw-medium">{{ customerData.loyalty_tier || 'Bronze' }} Pts</div>
            </div>
          </div>
        </div>

        <!-- Milestone Progress Section -->
        <div class="px-4 mb-3.5 text-start">
          <div class="d-flex justify-content-between align-items-center mb-1.5 font-size-12">
            <span class="fw-semibold text-dark d-flex align-items-center gap-1.5">
              <i class="mdi mdi-trending-up text-primary"></i>
              Milestone: {{ trustMilestone.targetTier }}
            </span>
            <span class="text-muted font-size-11 font-monospace">
              {{ trustMilestone.currentCount }} / {{ trustMilestone.requiredCount }} bills
            </span>
          </div>
          <div class="progress rounded-pill" style="height: 7px; background-color: #f1f3f5;">
            <div
              class="progress-bar rounded-pill"
              :class="trustMilestone.barClass"
              role="progressbar"
              :style="{ width: `${trustMilestone.percent}%` }"
              :aria-valuenow="trustMilestone.percent"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
          <p class="d-flex align-items-start gap-1.5 text-muted font-size-11 mt-2 mb-0 lh-sm">
            <i class="bx bx-info-circle text-primary flex-shrink-0 mt-0.5"></i>
            <span>{{ trustMilestone.advice }}</span>
          </p>
        </div>

        <!-- Account Standing & Specifications Details -->
        <div class="px-4 mb-4">
          <div class="border border-light-subtle rounded-3 p-3 bg-light-subtle font-size-12 text-start">
            <!-- Credit & Outstanding Debt -->
            <div class="d-flex justify-content-between align-items-center pb-2.5 mb-2.5 border-bottom border-light-subtle">
              <div>
                <span class="text-muted d-block font-size-11 mb-0.5">Approved Credit Limit</span>
                <span class="fw-bold text-dark font-size-14">{{ formatMoney(customerData.credit_limit || 0) }}</span>
              </div>
              <div class="text-end">
                <span class="text-muted d-block font-size-11 mb-0.5">Outstanding Balance</span>
                <span
                  class="fw-bold font-size-14"
                  :class="(customerData.outstanding_balance || 0) > 0 ? 'text-danger' : 'text-success'"
                >
                  {{ formatMoney(customerData.outstanding_balance || 0) }}
                </span>
              </div>
            </div>

            <!-- Policy Guidance Strip -->
            <div class="p-2.5 rounded bg-white border border-light-subtle d-flex align-items-start gap-2 font-size-11 text-muted">
              <i class="mdi mdi-shield-check-outline text-primary mt-0.5 flex-shrink-0 fs-6"></i>
              <div class="lh-sm">
                <strong class="text-dark">Policy:</strong> {{ riskRecommendation.message }}
              </div>
            </div>

            <!-- Delivery Location (if available) -->
            <div v-if="defaultAddress" class="d-flex align-items-start gap-2 pt-2.5 mt-2.5 border-top border-light-subtle font-size-11 text-muted">
              <i class="bx bx-map-pin text-primary mt-0.5 flex-shrink-0 fs-6"></i>
              <div class="lh-sm">
                <strong class="text-dark">{{ defaultAddress.building || defaultAddress.estate_area || 'Delivery Destination' }}:</strong>
                <span class="ms-1">{{ [defaultAddress.street, defaultAddress.estate_area, defaultAddress.town_city, defaultAddress.county].filter(Boolean).join(', ') }}</span>
                <span v-if="defaultAddress.additional_directions" class="d-block fst-italic mt-0.5">"{{ defaultAddress.additional_directions }}"</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Action Button -->
        <div class="px-4 pb-4 pt-0">
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm rounded-pill w-100 py-2.5 fw-semibold font-size-13 shadow-none border-light-subtle"
            data-bs-dismiss="modal"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modalId: {
    type: String,
    default: 'customerProfileModal'
  },
  customer: {
    type: Object,
    default: null
  }
});

const customerData = computed(() => props.customer || null);

const formatMoney = (val) => {
  return Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'KES' });
};

const formatDate = (val) => {
  if (!val) return 'Never';
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
};

const defaultAddress = computed(() => {
  if (!customerData.value?.addresses?.length) return null;
  return customerData.value.addresses.find((a) => a.is_default) || customerData.value.addresses[0];
});

// Risk / Trust Tier Visuals
const riskTier = computed(() => customerData.value?.risk_tier || 'new');

const riskTierLabel = computed(() => {
  const map = {
    new: 'New Customer',
    reliable: 'Reliable Regular',
    trusted: 'Trusted VIP',
    watch: 'Watch List',
    high_risk: 'Credit Blocked'
  };
  return map[riskTier.value] || 'New Customer';
});

const riskBadgeClass = computed(() => {
  const map = {
    new: 'bg-secondary-subtle text-secondary border',
    reliable: 'bg-info-subtle text-info',
    trusted: 'bg-success-subtle text-success',
    watch: 'bg-warning-subtle text-warning-emphasis',
    high_risk: 'bg-danger-subtle text-danger'
  };
  return map[riskTier.value] || 'bg-secondary-subtle text-secondary border';
});

const riskIconClass = computed(() => {
  const map = {
    new: 'mdi mdi-clock-outline',
    reliable: 'mdi mdi-check-circle',
    trusted: 'mdi mdi-check-decagram',
    watch: 'mdi mdi-alert-outline',
    high_risk: 'mdi mdi-alert-octagon'
  };
  return map[riskTier.value] || 'mdi mdi-clock-outline';
});

const riskRecommendation = computed(() => {
  const c = customerData.value;
  if (!c) return { title: 'Standard Profile', message: 'Standard checkout and tab rules apply.' };
  if (c.risk_tier === 'new' || (!c.bills_issued_count && c.risk_tier !== 'high_risk')) {
    return {
      title: 'Unverified Standing (New)',
      message: 'First-time patron with no prior settlement record. Cash or mobile payment upon order is strongly recommended; manager verification required for open tabs.'
    };
  }
  if (c.risk_tier === 'high_risk') {
    return {
      title: 'Credit Privileges Blocked',
      message: 'Customer has default history or outstanding debt exceeding limit. Running tabs disabled; full prepayment required.'
    };
  }
  if (c.risk_tier === 'watch') {
    return {
      title: 'Watch List / Active Debt',
      message: 'Active credit exposure or delayed settlement history. Settle outstanding balance or take partial deposit before extending further credit.'
    };
  }
  if (c.risk_tier === 'trusted') {
    return {
      title: 'Trusted Regular (VIP)',
      message: 'Exceptional settlement track record with zero debt. Approved for running tabs and deferred checkout.'
    };
  }
  return {
    title: 'Reliable Regular',
    message: 'Established settlement record with prompt payments. Standard open tab limits apply.'
  };
});

// Settlement Progress & Metrics
const promptSettlementRate = computed(() => {
  const issued = customerData.value?.bills_issued_count || 0;
  const prompt = customerData.value?.bills_paid_promptly || 0;
  if (issued === 0) return 0;
  return Math.round((prompt / issued) * 100);
});

const trustMilestone = computed(() => {
  const c = customerData.value;
  const count = c?.bills_issued_count || 0;
  const tier = c?.risk_tier || 'new';

  if (tier === 'high_risk') {
    return {
      targetTier: 'Good Standing',
      requiredCount: count || 1,
      currentCount: 0,
      percent: 0,
      barClass: 'bg-danger',
      advice: 'Credit suspended due to debt or default. Settle all pending bills to begin rebuilding account score.'
    };
  }

  if (tier === 'watch') {
    return {
      targetTier: 'Reliable Regular',
      requiredCount: 3,
      currentCount: Math.min(count, 3),
      percent: 33,
      barClass: 'bg-warning',
      advice: 'Promptly settle active balance to return to Reliable standing and unlock standard tab limits.'
    };
  }

  if (tier === 'new') {
    const required = 3;
    const current = Math.min(count, required);
    const pct = Math.round((current / required) * 100);
    return {
      targetTier: 'Reliable Regular',
      requiredCount: required,
      currentCount: current,
      percent: pct,
      barClass: 'bg-info',
      advice: `Needs ${required - current} more promptly settled bill(s) to verify trustworthiness and earn Reliable patron status.`
    };
  }

  if (tier === 'reliable') {
    const required = 10;
    const current = Math.min(count, required);
    const pct = Math.round((current / required) * 100);
    return {
      targetTier: 'Trusted VIP',
      requiredCount: required,
      currentCount: current,
      percent: pct,
      barClass: 'bg-success',
      advice: `Needs ${required - current} more prompt settlements with zero debt to reach top-tier Trusted VIP standing.`
    };
  }

  return {
    targetTier: 'Top Standing Achieved',
    requiredCount: count,
    currentCount: count,
    percent: 100,
    barClass: 'bg-success',
    advice: 'Top classification achieved. Patron maintains exceptional payment record and approved open tab privileges.'
  };
});
</script>
