<template>
    <!-- One plan as the Plans board draws it (canvas "Plans", v1): flat card with a 1px border and no shadow;
         top (icon, name, status, one line, price and what it works out to), facts (users, branches, trial),
         what it adds, a full-width "Edit plan", and the businesses on it as a footer row. custom.css 36. -->
    <article class="plan-card" :class="{ 'is-selected': selected, 'is-retired': !plan.is_active }">
        <!-- Top: icon, name, status; one line; price -->
        <div class="plan-card-top">
            <div class="d-flex align-items-center gap-2 mb-2">
                <span class="plan-icon" :style="{ background: tint, color: plan.color }">
                    <Icon :icon="planIcon(plan.icon, selected)" />
                </span>
                <span class="plan-card-name flex-grow-1 text-truncate">{{ plan.name }}</span>
                <span class="plan-pill" :style="{ background: status.bg, color: status.fg }" :title="status.note">{{ status.label }}</span>
            </div>
            <span class="plan-card-desc">{{ plan.description || (plan.inherits ? `Everything in ${plan.inherits}, and more` : 'The starting plan') }}</span>
            <div class="d-flex align-items-baseline gap-1 mt-3">
                <span class="plan-price">{{ price.big }}</span><span class="text-muted font-size-12">{{ price.per }}</span>
            </div>
            <span class="plan-card-sub" :class="{ 'is-saving': price.saving }">{{ price.small }}</span>
            <span v-if="scheduledLine" class="d-block font-size-12 text-warning mt-1"><Icon icon="ri:time-line" class="me-1" />{{ scheduledLine }}</span>
        </div>

        <!-- Facts: users, branches, trial -->
        <div class="plan-card-facts">
            <span class="plan-fact"><span>Users</span><b>{{ limitWord(plan.user_limit, plan.unlimited_users) }}</b></span>
            <span class="plan-fact"><span>Branches</span><b>{{ limitWord(plan.branch_limit, plan.unlimited_branches) }}</b></span>
            <span class="plan-fact plan-fact-wide"><span>Free trial</span><b>{{ trialWord }}</b></span>
        </div>

        <!-- What it adds over the plan before it -->
        <div class="plan-card-feats">
            <span class="plan-card-label">{{ plan.inherits ? `Everything in ${plan.inherits}, plus` : 'Includes' }}</span>
            <div v-for="f in features" :key="f" class="plan-feat"><Icon icon="ri:check-line" /><span>{{ f }}</span></div>
            <span v-if="!features.length" class="text-muted font-size-12">No features listed yet</span>
            <button v-if="moreFeatures" type="button" class="plan-card-more" @click="$emit('edit', plan)">and {{ moreFeatures }} more</button>
        </div>

        <!-- Edit plan, full width -->
        <div class="px-3 pb-3">
            <button type="button" class="btn btn-white w-100" @click="$emit('edit', plan)">
                <Icon :icon="canManage ? 'ri:edit-line' : 'ri:eye-line'" class="me-1" />{{ canManage ? 'Edit plan' : 'View plan' }}
            </button>
        </div>

        <!-- Businesses on it: count on the left, faces and an arrow on the right (the whole row opens the list) -->
        <AvatarStack class="plan-card-onplan" :items="faces" :total="plan.businesses?.total ?? 0" :loading="facesLoading"
            :note="businessNote" go-label="See the businesses on this plan" @open="$emit('businesses', plan)" />
    </article>
</template>

<script setup>
// ---------------------------------------------------------------
// PlanCard — one plan in the Plans slider (10 Nov 2026), drawn as the canvas
// board "Plans" (v1) draws it.
//
// Props:  plan (GET /admin/plans row), period (the switch's key),
//         faces [{ id, name }] (first businesses on it), facesLoading,
//         canManage (Edit plan vs View plan), selected (its panel is open)
// Emits:  edit (plan), businesses (plan)
// ---------------------------------------------------------------
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import AvatarStack from '@/components/Data-tools/Avatar.Stack.vue'
import { planIcon, priceFor, tintOf, kes, periodOf } from '../helpers/planMeta'

const props = defineProps({
    plan: { type: Object, required: true },
    period: { type: String, default: 'monthly' },
    faces: { type: Array, default: () => [] },
    facesLoading: { type: Boolean, default: false },
    canManage: { type: Boolean, default: false },
    selected: { type: Boolean, default: false },
})
defineEmits(['edit', 'businesses'])

const MAX_FEATURES = 4
const tint = computed(() => tintOf(props.plan.color))

// The board's status words: On sale, By quote only, Hidden, Retired
const status = computed(() => {
    const p = props.plan
    if (!p.is_active) return { label: 'Retired', bg: '#EFF2F7', fg: '#6C7083', note: 'Closed to new businesses; those on it keep it' }
    if (!p.is_public) return { label: 'Hidden', bg: '#EFF2F7', fg: '#6C7083', note: 'Not offered at sign-up or on the pricing page' }
    if (p.is_quoted) return { label: 'By quote only', bg: '#FEF3E2', fg: '#8A5500', note: 'Priced for each business by the team' }
    return { label: 'On sale', bg: '#E3F5EC', fg: '#1E7F45', note: 'Offered at sign-up and on the pricing page' }
})

// Price for the chosen period, with what a longer period works out to a month (green when it saves)
const price = computed(() => {
    const p = props.plan
    if (p.is_free) return { big: 'Free', per: 'for ever', small: 'No card, no end date' }
    if (p.is_quoted) return { big: 'Quoted', per: '', small: 'Priced for each business' }
    const per = periodOf(props.period)
    const row = priceFor(p, props.period)
    if (!row) return { big: '—', per: '', small: `Not offered ${per.label.toLowerCase()}` }
    const unit = { monthly: 'a month', quarterly: 'a quarter', semi_annual: 'every 6 months', annual: 'a year' }[per.key]
    if (per.months === 1) return { big: kes(row.amount), per: unit, small: 'Billed every month' }
    return { big: kes(row.amount), per: unit, small: `${kes(row.monthly_equivalent)} a month${row.saving_percent ? ` · saves ${row.saving_percent}%` : ''}`, saving: !!row.saving_percent }
})

const limitWord = (n, unlimited) => (unlimited || n === null || n === undefined ? 'Unlimited' : String(n))
const trialWord = computed(() => (props.plan.trial_days ? `${props.plan.trial_days} days, then billed` : props.plan.is_free ? 'Not needed: it is free' : 'No trial'))
const features = computed(() => (props.plan.features || []).slice(0, MAX_FEATURES))
const moreFeatures = computed(() => Math.max(0, (props.plan.features || []).length - MAX_FEATURES))

// Under the count: "3 on a free trial" / "All active" / how a quoted plan gets businesses
const businessNote = computed(() => {
    const b = props.plan.businesses || {}
    if (!b.total) return props.plan.is_quoted ? 'Added by the team after a quote' : ''
    return b.trialing ? `${b.trialing} on a free trial` : 'All active'
})

// A price change waiting for its 30 days' notice, for the chosen period
const scheduledLine = computed(() => {
    const c = (props.plan.scheduled_price_changes || []).find((x) => x.period === props.period)
    if (!c) return ''
    return `Existing customers move to ${kes(c.new_amount)} on ${new Date(c.effective_from).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`
})
</script>
