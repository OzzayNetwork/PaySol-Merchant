<template>
  <div
    class="modal fade"
    :id="modalId"
    tabindex="-1"
    :aria-labelledby="`${modalId}Label`"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg" v-if="customerData">
        <!-- Modal Header -->
        <div class="modal-header bg-light border-bottom px-4 py-3 align-items-center">
          <div class="d-flex align-items-center gap-3">
            <div
              class="d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary fw-bold font-size-16 border border-primary-subtle flex-shrink-0"
              style="width: 44px; height: 44px;"
            >
              {{ getInitials(customerData.name) }}
            </div>
            <div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <h5 class="modal-title font-size-16 fw-bold text-dark mb-0" :id="`${modalId}Label`">
                  {{ customerData.name }}
                </h5>
                <span class="badge bg-secondary-subtle text-secondary border font-size-11 font-monospace">
                  {{ customerData.customer_number || 'CUST-PROFILE' }}
                </span>
                <span
                  class="badge text-capitalize font-size-11"
                  :class="customerData.customer_type === 'business' ? 'bg-info-subtle text-info border' : 'bg-light text-muted border'"
                >
                  <i :class="customerData.customer_type === 'business' ? 'bx bx-building me-1' : 'bx bx-user me-1'"></i>
                  {{ customerData.customer_type || 'individual' }}
                </span>
              </div>
              <div class="text-muted font-size-12 d-flex align-items-center gap-2 mt-0.5 flex-wrap">
                <span v-if="customerData.phone"><i class="bx bx-phone me-1"></i>{{ customerData.phone }}</span>
                <span v-if="customerData.phone && customerData.email">•</span>
                <span v-if="customerData.email"><i class="bx bx-envelope me-1"></i>{{ customerData.email }}</span>
                <span v-if="customerData.last_visit_at">•</span>
                <span v-if="customerData.last_visit_at">Last seen {{ formatDate(customerData.last_visit_at) }}</span>
              </div>
            </div>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body p-4">
          <!-- Row 1: Dual Classification Cards (Trust & Loyalty) -->
          <div class="row g-3 mb-4">
            <!-- Trust & Risk Standing -->
            <div class="col-md-6">
              <div class="card h-100 border border-light-subtle rounded-3 mb-0">
                <div class="card-header bg-white border-bottom py-2.5 px-3 d-flex align-items-center justify-content-between">
                  <span class="font-size-12 fw-bold text-dark text-uppercase tracking-wider">Trust & Credit Standing</span>
                  <span
                    class="badge rounded-pill font-size-11 px-2.5 py-1 d-inline-flex align-items-center gap-1"
                    :class="riskBadgeClass"
                  >
                    <i :class="riskIconClass"></i>
                    <span>{{ riskTierLabel }}</span>
                  </span>
                </div>
                <div class="card-body p-3 d-flex flex-column justify-content-between">
                  <div>
                    <h6 class="font-size-13 fw-bold text-dark mb-1 d-flex align-items-center gap-1.5">
                      <span>{{ riskRecommendation.title }}</span>
                    </h6>
                    <p class="text-muted font-size-12 mb-3">
                      {{ riskRecommendation.message }}
                    </p>
                  </div>

                  <!-- Credit / Debt Summary -->
                  <div class="p-2.5 rounded bg-light border border-light-subtle font-size-12">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="text-muted">Approved Credit Limit:</span>
                      <span class="fw-bold text-dark">{{ formatMoney(customerData.credit_limit || 0) }}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="text-muted">Current Debt / Balance:</span>
                      <span
                        class="fw-bold"
                        :class="(customerData.outstanding_balance || 0) > 0 ? 'text-danger' : 'text-success'"
                      >
                        {{ formatMoney(customerData.outstanding_balance || 0) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Loyalty Classification -->
            <div class="col-md-6">
              <div class="card h-100 border border-light-subtle rounded-3 mb-0">
                <div class="card-header bg-white border-bottom py-2.5 px-3 d-flex align-items-center justify-content-between">
                  <span class="font-size-12 fw-bold text-dark text-uppercase tracking-wider">Loyalty & Rewards</span>
                  <span
                    class="badge rounded-pill font-size-11 px-2.5 py-1 text-capitalize d-inline-flex align-items-center gap-1"
                    :class="loyaltyBadgeClass"
                  >
                    <i :class="loyaltyIconClass"></i>
                    <span>{{ customerData.loyalty_tier || 'Bronze' }} Tier</span>
                  </span>
                </div>
                <div class="card-body p-3 d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex align-items-baseline gap-2 mb-2">
                      <h3 class="fw-bold text-dark mb-0 font-size-22">
                        {{ (customerData.loyalty_points || 0).toLocaleString() }}
                      </h3>
                      <span class="text-muted font-size-12">reward points accumulated</span>
                    </div>
                    <p class="text-muted font-size-12 mb-3">
                      Earns points automatically on settled bills. Redeemable for discounts and promotions.
                    </p>
                  </div>

                  <!-- Next Tier Progress Bar -->
                  <div class="p-2.5 rounded bg-light border border-light-subtle font-size-12">
                    <div class="d-flex justify-content-between align-items-center mb-1.5">
                      <span class="text-muted">Progress to {{ nextLoyaltyTier.target }}:</span>
                      <span class="fw-bold text-dark">{{ nextLoyaltyTier.current }} / {{ nextLoyaltyTier.threshold }} pts</span>
                    </div>
                    <div class="progress" style="height: 6px;">
                      <div
                        class="progress-bar bg-primary"
                        role="progressbar"
                        :style="{ width: `${nextLoyaltyTier.percent}%` }"
                        :aria-valuenow="nextLoyaltyTier.percent"
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Row 2: Settlement History & Risk Progress -->
          <div class="card border border-light-subtle rounded-3 mb-4">
            <div class="card-header bg-white border-bottom py-2.5 px-3 d-flex align-items-center justify-content-between">
              <span class="font-size-12 fw-bold text-dark text-uppercase tracking-wider">Settlement Performance & Progress</span>
              <span class="font-size-12 text-muted">Prompt Ratio: <strong>{{ promptSettlementRate }}%</strong></span>
            </div>
            <div class="card-body p-3">
              <!-- Progress to Next Trust Level -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <span class="font-size-13 fw-semibold text-dark">
                    <i class="mdi mdi-trending-up text-primary me-1"></i>
                    Progress toward {{ trustMilestone.targetTier }}
                  </span>
                  <span class="font-size-12 text-muted">
                    {{ trustMilestone.currentCount }} of {{ trustMilestone.requiredCount }} bills
                  </span>
                </div>
                <div class="progress mb-2" style="height: 8px;">
                  <div
                    class="progress-bar"
                    :class="trustMilestone.barClass"
                    role="progressbar"
                    :style="{ width: `${trustMilestone.percent}%` }"
                    :aria-valuenow="trustMilestone.percent"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <p class="text-muted font-size-12 mb-0">
                  <i class="bx bx-info-circle text-primary me-1"></i>
                  {{ trustMilestone.advice }}
                </p>
              </div>

              <!-- 4 Metric Stat Tiles -->
              <div class="row g-2 pt-2 border-top">
                <div class="col-6 col-md-3">
                  <div class="p-2 border rounded text-center bg-light-subtle">
                    <span class="text-muted font-size-11 d-block mb-1">Bills Issued</span>
                    <span class="font-size-16 fw-bold text-dark">{{ customerData.bills_issued_count || 0 }}</span>
                  </div>
                </div>
                <div class="col-6 col-md-3">
                  <div class="p-2 border rounded text-center bg-light-subtle">
                    <span class="text-muted font-size-11 d-block mb-1">Paid Promptly</span>
                    <span class="font-size-16 fw-bold text-success">{{ customerData.bills_paid_promptly || 0 }}</span>
                  </div>
                </div>
                <div class="col-6 col-md-3">
                  <div class="p-2 border rounded text-center bg-light-subtle">
                    <span class="text-muted font-size-11 d-block mb-1">Prompt Pay Rate</span>
                    <span
                      class="font-size-16 fw-bold"
                      :class="promptSettlementRate >= 80 ? 'text-success' : (promptSettlementRate >= 60 ? 'text-warning' : 'text-danger')"
                    >
                      {{ promptSettlementRate }}%
                    </span>
                  </div>
                </div>
                <div class="col-6 col-md-3">
                  <div class="p-2 border rounded text-center bg-light-subtle">
                    <span class="text-muted font-size-11 d-block mb-1">Avg Pay Minutes</span>
                    <span class="font-size-16 fw-bold text-dark">
                      {{ avgPaymentMinutes }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Row 3: Account Details & Saved Delivery Address -->
          <div class="row g-3">
            <!-- Account & Tax PIN -->
            <div class="col-md-6">
              <div class="card h-100 border border-light-subtle rounded-3 mb-0">
                <div class="card-header bg-white border-bottom py-2 px-3">
                  <span class="font-size-12 fw-bold text-dark text-uppercase tracking-wider">Account Specifications</span>
                </div>
                <div class="card-body p-3 font-size-12">
                  <div class="d-flex justify-content-between py-1 border-bottom">
                    <span class="text-muted">Entity Type:</span>
                    <span class="fw-semibold text-capitalize text-dark">{{ customerData.customer_type || 'Individual' }}</span>
                  </div>
                  <div class="d-flex justify-content-between py-1 border-bottom">
                    <span class="text-muted">KRA Tax PIN:</span>
                    <span class="fw-bold font-monospace" :class="customerData.tax_pin ? 'text-dark' : 'text-muted'">
                      {{ customerData.tax_pin || 'Not Recorded' }}
                    </span>
                  </div>
                  <div class="d-flex justify-content-between py-1 border-bottom">
                    <span class="text-muted">Registered On:</span>
                    <span class="text-dark">{{ formatDate(customerData.created_at) }}</span>
                  </div>
                  <div class="d-flex justify-content-between py-1">
                    <span class="text-muted">Internal Notes:</span>
                    <span class="text-dark text-end text-truncate" style="max-width: 200px;">
                      {{ customerData.notes || 'None' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Saved Delivery Location -->
            <div class="col-md-6">
              <div class="card h-100 border border-light-subtle rounded-3 mb-0">
                <div class="card-header bg-white border-bottom py-2 px-3 d-flex align-items-center justify-content-between">
                  <span class="font-size-12 fw-bold text-dark text-uppercase tracking-wider">Saved Delivery Address</span>
                  <span v-if="defaultAddress" class="badge bg-light text-primary border font-size-10">Default</span>
                </div>
                <div class="card-body p-3 font-size-12">
                  <template v-if="defaultAddress">
                    <div class="d-flex align-items-start gap-2 mb-2">
                      <i class="bx bx-map-pin text-primary fs-5 mt-0.5"></i>
                      <div>
                        <div class="fw-bold text-dark">{{ defaultAddress.building || defaultAddress.estate_area || 'Delivery Location' }}</div>
                        <div class="text-muted">
                          {{ [defaultAddress.street, defaultAddress.estate_area, defaultAddress.town_city, defaultAddress.county].filter(Boolean).join(', ') }}
                        </div>
                        <div v-if="defaultAddress.additional_directions" class="text-muted fst-italic mt-1 font-size-11">
                          "{{ defaultAddress.additional_directions }}"
                        </div>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="text-center py-3 text-muted">
                      <i class="bx bx-map-alt fs-2 d-block text-secondary opacity-50 mb-1"></i>
                      <span>No saved delivery address recorded.</span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer bg-light border-top px-4 py-2.5 d-flex justify-content-between">
          <span class="font-size-12 text-muted">
            <i class="mdi mdi-shield-account-outline text-primary me-1"></i>
            Classification is evaluated automatically based on bill settlement behavior.
          </span>
          <button type="button" class="btn btn-secondary btn-sm px-3 fw-semibold font-size-12" data-bs-dismiss="modal">
            Close
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
    new: 'mdi mdi-account-clock-outline',
    reliable: 'mdi mdi-information-outline',
    trusted: 'mdi mdi-shield-check',
    watch: 'mdi mdi-alert-outline',
    high_risk: 'mdi mdi-alert-octagon'
  };
  return map[riskTier.value] || 'mdi mdi-account-clock-outline';
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

// Loyalty Visuals
const loyaltyTier = computed(() => (customerData.value?.loyalty_tier || 'bronze').toLowerCase());

const loyaltyBadgeClass = computed(() => {
  const map = {
    bronze: 'bg-light text-secondary border',
    silver: 'bg-light-subtle text-dark border',
    gold: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle',
    platinum: 'bg-primary-subtle text-primary border border-primary-subtle'
  };
  return map[loyaltyTier.value] || 'bg-light text-secondary border';
});

const loyaltyIconClass = computed(() => {
  const map = {
    bronze: 'bx bxs-star',
    silver: 'fas fa-trophy',
    gold: 'fas fa-crown',
    platinum: 'mdi mdi-diamond-stone'
  };
  return map[loyaltyTier.value] || 'bx bxs-star';
});

const nextLoyaltyTier = computed(() => {
  const pts = customerData.value?.loyalty_points || 0;
  if (pts < 500) {
    return { target: 'Silver', threshold: 500, current: pts, percent: Math.min(100, Math.round((pts / 500) * 100)) };
  }
  if (pts < 2000) {
    return { target: 'Gold', threshold: 2000, current: pts, percent: Math.min(100, Math.round((pts / 2000) * 100)) };
  }
  if (pts < 5000) {
    return { target: 'Platinum', threshold: 5000, current: pts, percent: Math.min(100, Math.round((pts / 5000) * 100)) };
  }
  return { target: 'Platinum VIP', threshold: pts, current: pts, percent: 100 };
});

// Settlement Progress & Metrics
const promptSettlementRate = computed(() => {
  const issued = customerData.value?.bills_issued_count || 0;
  const prompt = customerData.value?.bills_paid_promptly || 0;
  if (issued === 0) return 0;
  return Math.round((prompt / issued) * 100);
});

const avgPaymentMinutes = computed(() => {
  const issued = customerData.value?.bills_issued_count || 0;
  const totalMins = customerData.value?.total_pay_minutes || 0;
  if (issued === 0 || totalMins === 0) return 'Immediate';
  const avg = Math.round(totalMins / issued);
  return `${avg} mins`;
});

const trustMilestone = computed(() => {
  const c = customerData.value;
  const count = c?.bills_issued_count || 0;
  const tier = c?.risk_tier || 'new';

  if (tier === 'high_risk') {
    return {
      targetTier: 'Good Standing',
      requiredCount: count,
      currentCount: 0,
      percent: 0,
      barClass: 'bg-danger',
      advice: 'Credit suspended due to debt or default. Settle all pending bills to begin rebuilding account score.'
    };
  }

  if (tier === 'watch') {
    return {
      targetTier: 'Reliable Standing',
      requiredCount: 3,
      currentCount: Math.min(count, 3),
      percent: 40,
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
