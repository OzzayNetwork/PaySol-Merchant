<template>
  <div
    class="modal fade"
    :id="modalId"
    tabindex="-1"
    :aria-labelledby="`${modalId}Label`"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered" style="max-width: 440px;">
      <div
        class="modal-content border-0 bg-white shadow-sm overflow-hidden"
        style="border-radius: 24px;"
        v-if="customerData"
      >
        <!-- Top Soft Pastel Banner (Inspired by reference designs) -->
        <div
          class="px-4 pt-3 pb-4 d-flex align-items-center justify-content-between position-relative"
          style="height: 110px; background: linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%);"
        >
          <!-- Customer Identifier Chip -->
          <span class="badge rounded-pill bg-white text-secondary border-0 font-monospace font-size-11 px-3 py-1.5 shadow-none">
            <i class="bx bx-id-card me-1.5 text-primary"></i>{{ customerData.customer_number || 'CUST-PROFILE' }}
          </span>

          <!-- Minimal Circular Close Button -->
          <button
            type="button"
            class="btn-close font-size-11 p-2 bg-white rounded-circle shadow-none border-0"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>

        <!-- Centered Circular Avatar with Verified Standing Badge -->
        <div class="position-relative d-inline-block mx-auto text-center" style="margin-top: -48px; margin-bottom: 12px;">
          <div
            class="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold font-size-26"
            :style="{
              width: '84px',
              height: '84px',
              border: '4px solid #ffffff',
              boxShadow: '0 4px 14px rgba(85, 110, 230, 0.15)',
              background: avatarGradient
            }"
          >
            {{ getInitials(customerData.name) }}
          </div>

          <!-- Verified / Standing Tick on Avatar (Inspired by Reference Cards 1, 2, 3) -->
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

        <!-- Identity & Hierarchy Block -->
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

            <span class="badge rounded-pill bg-light text-secondary border-0 font-size-11 px-2.5 py-1 text-capitalize">
              {{ customerData.customer_type || 'individual' }}
            </span>
          </div>

          <!-- Contact Details (Generous breathing room) -->
          <div class="text-muted font-size-12 d-flex align-items-center justify-content-center gap-2.5 text-truncate mb-3">
            <span v-if="customerData.phone" class="d-inline-flex align-items-center gap-1">
              <i class="bx bx-phone text-primary opacity-75"></i>{{ customerData.phone }}
            </span>
            <span v-if="customerData.phone && customerData.email" class="text-black-50">•</span>
            <span v-if="customerData.email" class="d-inline-flex align-items-center gap-1">
              <i class="bx bx-envelope text-primary opacity-75"></i>{{ customerData.email }}
            </span>
          </div>
        </div>

        <!-- 3-Column Clean Stat Strip (Inspired by Reference Cards 1 & 2) -->
        <div class="px-4 mb-3">
          <div
            class="py-3 px-2 d-flex justify-content-around text-center"
            style="background-color: #f8fafc; border-radius: 18px;"
          >
            <div class="flex-fill">
              <div class="font-size-18 fw-bold text-dark lh-1 mb-1">{{ customerData.bills_issued_count || 0 }}</div>
              <div class="font-size-11 text-muted text-uppercase tracking-wider fw-medium">Total Bills</div>
            </div>
            <div class="border-end border-light-subtle my-1" style="opacity: 0.6;"></div>
            <div class="flex-fill">
              <div
                class="font-size-18 fw-bold lh-1 mb-1"
                :class="promptSettlementRate >= 80 ? 'text-success' : 'text-primary'"
              >
                {{ promptSettlementRate }}%
              </div>
              <div class="font-size-11 text-muted text-uppercase tracking-wider fw-medium">Prompt Pay</div>
            </div>
            <div class="border-end border-light-subtle my-1" style="opacity: 0.6;"></div>
            <div class="flex-fill">
              <div class="font-size-18 fw-bold text-primary lh-1 mb-1">{{ (customerData.loyalty_points || 0).toLocaleString() }}</div>
              <div class="font-size-11 text-muted text-uppercase tracking-wider text-capitalize fw-medium">{{ customerData.loyalty_tier || 'Bronze' }} Pts</div>
            </div>
          </div>
        </div>

        <!-- Milestone Progress Section (Inspired by Reference Cards 5 & 6) -->
        <div class="px-4 mb-3 text-start">
          <div
            class="p-3"
            style="background-color: #f8fafc; border-radius: 18px;"
          >
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="d-flex align-items-center gap-2">
                <span
                  class="rounded-circle d-flex align-items-center justify-content-center bg-white border-0 shadow-none flex-shrink-0"
                  style="width: 28px; height: 28px;"
                >
                  <i class="mdi mdi-trophy-outline text-warning font-size-14"></i>
                </span>
                <div>
                  <span class="d-block fw-semibold text-dark font-size-12 lh-1">{{ trustMilestone.targetTier }}</span>
                  <span class="text-muted font-size-10">Target Standing Milestone</span>
                </div>
              </div>
              <span class="badge rounded-pill bg-white text-secondary border font-size-11 px-2.5 py-1 font-monospace">
                {{ trustMilestone.currentCount }} / {{ trustMilestone.requiredCount }} bills
              </span>
            </div>

            <!-- Capsule Progress Bar -->
            <div class="progress rounded-pill bg-white border-0" style="height: 8px;">
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

            <div class="d-flex align-items-center justify-content-between mt-2 font-size-11 text-muted lh-sm">
              <span class="fw-medium text-dark">{{ trustMilestone.percent }}% Achieved</span>
              <span class="text-truncate ps-2" :title="trustMilestone.advice">{{ trustMilestone.advice }}</span>
            </div>
          </div>
        </div>

        <!-- Account Standing & Credit / Policy Details -->
        <div class="px-4 mb-3 text-start">
          <!-- 2-Column Credit Summary -->
          <div class="row g-2 mb-2">
            <div class="col-6">
              <div class="p-2.5 rounded-3 bg-light text-start h-100">
                <span class="text-muted d-block font-size-10 text-uppercase fw-semibold mb-0.5">Approved Credit</span>
                <span class="fw-bold text-dark font-size-13">{{ formatMoney(customerData.credit_limit || 0) }}</span>
              </div>
            </div>
            <div class="col-6">
              <div
                class="p-2.5 rounded-3 text-start h-100"
                :class="(customerData.outstanding_balance || 0) > 0 ? 'bg-danger-subtle text-danger' : 'bg-light text-success'"
              >
                <span
                  class="d-block font-size-10 text-uppercase fw-semibold mb-0.5"
                  :class="(customerData.outstanding_balance || 0) > 0 ? 'text-danger' : 'text-muted'"
                >
                  Outstanding Debt
                </span>
                <span class="fw-bold font-size-13">{{ formatMoney(customerData.outstanding_balance || 0) }}</span>
              </div>
            </div>
          </div>

          <!-- Policy Guidance Strip -->
          <div class="p-2.5 rounded-3 bg-light d-flex align-items-start gap-2 font-size-11 text-muted">
            <i class="mdi mdi-shield-check-outline text-primary mt-0.5 flex-shrink-0 fs-6"></i>
            <div class="lh-sm">
              <strong class="text-dark">Policy:</strong> {{ riskRecommendation.message }}
            </div>
          </div>

          <!-- Delivery Destination (if present) -->
          <div
            v-if="defaultAddress"
            class="p-2.5 mt-2 rounded-3 bg-light d-flex align-items-start gap-2 font-size-11 text-muted"
          >
            <i class="bx bx-map-pin text-primary mt-0.5 flex-shrink-0 fs-6"></i>
            <div class="lh-sm">
              <strong class="text-dark">{{ defaultAddress.building || defaultAddress.estate_area || 'Delivery' }}:</strong>
              <span class="ms-1">{{ [defaultAddress.street, defaultAddress.estate_area, defaultAddress.town_city, defaultAddress.county].filter(Boolean).join(', ') }}</span>
              <span v-if="defaultAddress.additional_directions" class="d-block fst-italic mt-0.5 text-black-50">"{{ defaultAddress.additional_directions }}"</span>
            </div>
          </div>
        </div>

        <!-- Footer Action Button (Clean Pill Button, inspired by Reference Cards 1 & 3) -->
        <div class="px-4 pb-4 pt-1">
          <button
            type="button"
            class="btn btn-primary rounded-pill w-100 py-2.5 fw-semibold font-size-13 shadow-none border-0"
            style="background: linear-gradient(135deg, #556ee6 0%, #4b63d5 100%);"
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

const avatarGradient = computed(() => {
  const tier = riskTier.value;
  if (tier === 'trusted') return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  if (tier === 'reliable') return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
  if (tier === 'watch') return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  if (tier === 'high_risk') return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
  return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
});

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
    new: 'bg-secondary-subtle text-secondary border-0',
    reliable: 'bg-info-subtle text-info border-0',
    trusted: 'bg-success-subtle text-success border-0',
    watch: 'bg-warning-subtle text-warning-emphasis border-0',
    high_risk: 'bg-danger-subtle text-danger border-0'
  };
  return map[riskTier.value] || 'bg-secondary-subtle text-secondary border-0';
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
      advice: 'Credit suspended due to debt or default. Settle all pending bills to rebuild account score.'
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
      advice: `Needs ${required - current} more promptly settled bill(s) to reach Reliable patron status.`
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
      advice: `Needs ${required - current} more prompt settlements with zero debt to reach top-tier VIP standing.`
    };
  }

  return {
    targetTier: 'Top Standing Achieved',
    requiredCount: count,
    currentCount: count,
    percent: 100,
    barClass: 'bg-success',
    advice: 'Top classification achieved. Patron maintains exceptional payment record and open tab privileges.'
  };
});
</script>
