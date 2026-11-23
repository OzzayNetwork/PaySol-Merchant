<template>
  <div
    class="modal fade"
    :id="modalId"
    tabindex="-1"
    :aria-labelledby="`${modalId}Label`"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
      <div class="modal-content rounded-4 border border-light-subtle bg-white shadow-none overflow-hidden" v-if="customerData">
        <!-- Top Soft Pastel Banner (Inspired by reference images) -->
        <div
          class="px-3 pt-2.5 pb-4 d-flex align-items-center justify-content-between position-relative"
          style="height: 84px; background: linear-gradient(135deg, rgba(85, 110, 230, 0.12) 0%, rgba(80, 165, 241, 0.16) 100%);"
        >
          <!-- Customer Identifier Chip -->
          <span class="badge rounded-pill bg-white text-muted border font-monospace font-size-11 px-2.5 py-1">
            <i class="bx bx-id-card me-1 text-primary"></i>{{ customerData.customer_number || 'CUST-PROFILE' }}
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
        <div class="position-relative d-inline-block mx-auto text-center" style="margin-top: -38px;">
          <div
            class="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold font-size-22"
            style="width: 72px; height: 72px; border: 4px solid #ffffff; background-color: #556ee6;"
          >
            {{ getInitials(customerData.name) }}
          </div>

          <!-- Verified / Standing Tick on Avatar (References 1, 2, 3) -->
          <span
            class="position-absolute d-flex align-items-center justify-content-center rounded-circle text-white"
            style="width: 22px; height: 22px; bottom: 0; right: 0; border: 2.5px solid #ffffff; font-size: 11px;"
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
        <div class="px-4 pt-2 pb-1 text-center">
          <h5 class="fw-bold font-size-17 text-dark mb-1 text-truncate" :id="`${modalId}Label`" :title="customerData.name">
            {{ customerData.name }}
          </h5>

          <!-- Subtitle: Classification Pill & Contact -->
          <div class="d-flex align-items-center justify-content-center gap-1.5 flex-wrap">
            <span
              class="badge rounded-pill font-size-11 px-2.5 py-0.5 d-inline-flex align-items-center gap-1"
              :class="riskBadgeClass"
            >
              <i :class="riskIconClass"></i>
              <span>{{ riskTierLabel }}</span>
            </span>

            <span class="badge rounded-pill bg-light text-secondary border font-size-11 px-2.5 py-0.5 text-capitalize">
              {{ customerData.customer_type || 'individual' }}
            </span>
          </div>

          <div class="text-muted font-size-12 mt-1.5 text-truncate">
            <span v-if="customerData.phone"><i class="bx bx-phone me-1"></i>{{ customerData.phone }}</span>
            <span v-if="customerData.phone && customerData.email"> • </span>
            <span v-if="customerData.email"><i class="bx bx-envelope me-1"></i>{{ customerData.email }}</span>
          </div>
        </div>

        <!-- 3-Column Clean Stat Strip (Inspired by References 1, 2, 4) -->
        <div class="bg-light-subtle border border-light-subtle rounded-3 py-2 px-3 mx-4 my-2.5 d-flex justify-content-around text-center">
          <div>
            <div class="font-size-16 fw-bold text-dark lh-1">{{ customerData.bills_issued_count || 0 }}</div>
            <div class="font-size-11 text-muted mt-1">Total Bills</div>
          </div>
          <div class="border-end border-light-subtle"></div>
          <div>
            <div class="font-size-16 fw-bold text-success lh-1">{{ promptSettlementRate }}%</div>
            <div class="font-size-11 text-muted mt-1">Prompt Pay</div>
          </div>
          <div class="border-end border-light-subtle"></div>
          <div>
            <div class="font-size-16 fw-bold text-primary lh-1">{{ (customerData.loyalty_points || 0).toLocaleString() }}</div>
            <div class="font-size-11 text-muted mt-1 text-capitalize">{{ customerData.loyalty_tier || 'Bronze' }} Points</div>
          </div>
        </div>

        <!-- Milestone Progress Section (Inspired by References 5 & 6) -->
        <div class="px-4 mb-3 text-start">
          <div class="d-flex justify-content-between align-items-center mb-1 font-size-12">
            <span class="fw-semibold text-dark">
              <i class="mdi mdi-trending-up text-primary me-1"></i>
              Milestone: {{ trustMilestone.targetTier }}
            </span>
            <span class="text-muted font-size-11">
              {{ trustMilestone.currentCount }} / {{ trustMilestone.requiredCount }} bills
            </span>
          </div>
          <div class="progress" style="height: 5px; border-radius: 10px; background-color: #edf2f7;">
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
          <p class="text-muted font-size-11 mt-1 mb-0 lh-sm">
            <i class="bx bx-info-circle text-primary me-0.5"></i>
            {{ trustMilestone.advice }}
          </p>
        </div>

        <!-- Account Standing & Specifications Details (Clean Flat Card) -->
        <div class="px-4 mb-3">
          <div class="border border-light-subtle rounded-3 p-3 bg-light-subtle font-size-12 text-start">
            <!-- Credit & Outstanding Debt -->
            <div class="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom border-light-subtle">
              <div>
                <span class="text-muted d-block font-size-11">Approved Credit Limit</span>
                <span class="fw-bold text-dark font-size-13">{{ formatMoney(customerData.credit_limit || 0) }}</span>
              </div>
              <div class="text-end">
                <span class="text-muted d-block font-size-11">Outstanding Balance</span>
                <span
                  class="fw-bold font-size-13"
                  :class="(customerData.outstanding_balance || 0) > 0 ? 'text-danger' : 'text-success'"
                >
                  {{ formatMoney(customerData.outstanding_balance || 0) }}
                </span>
              </div>
            </div>

            <!-- Policy Guidance Strip -->
            <div class="d-flex align-items-start gap-1.5 mb-2 font-size-11 text-muted">
              <i class="mdi mdi-shield-outline text-primary mt-0.5 flex-shrink-0"></i>
              <span><strong>Policy:</strong> {{ riskRecommendation.message }}</span>
            </div>

            <!-- KRA PIN (relocated here cleanly) -->
            <div v-if="customerData.tax_pin" class="d-flex align-items-center justify-content-between py-1.5 border-top border-light-subtle font-size-11">
              <span class="text-muted">KRA Tax PIN:</span>
              <span class="font-monospace fw-bold text-dark">{{ customerData.tax_pin }}</span>
            </div>

            <!-- Delivery Location (if available) -->
            <div v-if="defaultAddress" class="d-flex align-items-start gap-1.5 pt-1.5 border-top border-light-subtle font-size-11 text-muted">
              <i class="bx bx-map-pin text-primary mt-0.5 flex-shrink-0"></i>
              <div>
                <strong class="text-dark">{{ defaultAddress.building || defaultAddress.estate_area || 'Delivery Destination' }}:</strong>
                <span class="ms-1">{{ [defaultAddress.street, defaultAddress.estate_area, defaultAddress.town_city, defaultAddress.county].filter(Boolean).join(', ') }}</span>
                <span v-if="defaultAddress.additional_directions" class="d-block fst-italic">"{{ defaultAddress.additional_directions }}"</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Action Button (Inspired by Reference 1) -->
        <div class="px-4 pb-4 pt-1">
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm rounded-pill w-100 py-2 fw-semibold font-size-12"
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
