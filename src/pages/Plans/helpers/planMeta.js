// ---------------------------------------------------------------
// planMeta — what the Plans pages need to draw a plan: the Iconify pair for
// each icon key the API allows (Plan::ICONS; outline idle, filled when
// selected), the colours (Plan::COLORS), payment-method and period labels,
// and whole-shilling money.
// ---------------------------------------------------------------

// The API's icon keys → Iconify outline / fill (Remix icons, like the menu)
export const PLAN_ICONS = {
    seedling: { icon: 'ri:seedling-line', iconActive: 'ri:seedling-fill', label: 'Seedling' },
    store: { icon: 'ri:store-2-line', iconActive: 'ri:store-2-fill', label: 'Shop' },
    crown: { icon: 'ri:vip-crown-line', iconActive: 'ri:vip-crown-fill', label: 'Crown' },
    building: { icon: 'ri:building-line', iconActive: 'ri:building-fill', label: 'Building' },
    star: { icon: 'ri:star-line', iconActive: 'ri:star-fill', label: 'Star' },
    rocket: { icon: 'ri:rocket-line', iconActive: 'ri:rocket-fill', label: 'Rocket' },
    gem: { icon: 'ri:vip-diamond-line', iconActive: 'ri:vip-diamond-fill', label: 'Gem' },
    bolt: { icon: 'ri:flashlight-line', iconActive: 'ri:flashlight-fill', label: 'Bolt' },
    shield: { icon: 'ri:shield-star-line', iconActive: 'ri:shield-star-fill', label: 'Shield' },
    layers: { icon: 'ri:stack-line', iconActive: 'ri:stack-fill', label: 'Layers' },
}
export const planIcon = (key, active = false) => {
    const m = PLAN_ICONS[key] || PLAN_ICONS.layers
    return active ? m.iconActive : m.icon
}

// The colours a plan may take (the API refuses any other)
export const PLAN_COLORS = ['#2164F3', '#0F7C8A', '#1E7F45', '#B4620A', '#C2185B', '#7B4FC9', '#5B6B8C', '#B42318']

// Payment methods a plan can be paid with (Plan::PAYMENT_METHODS)
export const PAYMENT_METHODS = {
    m_pesa: { label: 'M-Pesa', icon: 'ri:smartphone-line', note: 'STK prompt or PayBill' },
    card: { label: 'Card', icon: 'ri:bank-card-line', note: 'Through Paystack (comes with card billing)' },
    bank_transfer: { label: 'Bank transfer', icon: 'ri:bank-line', note: 'Invoiced; recorded by finance' },
}

// Billing periods, in the order the switch shows them (BillingPeriod enum)
export const PERIODS = [
    { key: 'monthly', label: 'Monthly', short: 'mo', months: 1 },
    { key: 'quarterly', label: 'Quarterly', short: 'qtr', months: 3 },
    { key: 'semi_annual', label: '6 months', short: '6 mo', months: 6 },
    { key: 'annual', label: 'Annual', short: 'yr', months: 12 },
]
export const periodOf = (key) => PERIODS.find((p) => p.key === key) || PERIODS[0]

// Whole shillings: "KES 1,400" (plan prices never have cents)
export function kes(amount) {
    if (amount === null || amount === undefined || amount === '') return '—'
    return `KES ${Math.round(Number(amount)).toLocaleString('en-KE')}`
}

// A plan's price for one period, or null when that period isn't offered
export function priceFor(plan, period) {
    const p = (plan?.prices || []).find((x) => x.period === period)
    return p && p.offered ? p : null
}

// What the card says under the name: Free / quoted / the price for the period
export function priceLine(plan, period) {
    if (plan?.is_free) return { big: 'Free', unit: '', small: 'Never expires' }
    if (plan?.is_quoted) return { big: 'Quoted', unit: '', small: 'Priced per business' }
    const p = priceFor(plan, period)
    const per = periodOf(period)
    if (!p) return { big: '—', unit: '', small: `Not offered ${per.label.toLowerCase()}` }
    const small = per.months > 1
        ? `${kes(p.monthly_equivalent)} a month${p.saving_percent ? ` · save ${p.saving_percent}%` : ''}`
        : 'Billed monthly'
    return { big: kes(p.amount), unit: `/${per.short}`, small }
}

// Users / branches as words
export const limitWord = (n, unlimited, one, many) => (unlimited || n === null || n === undefined ? `Unlimited ${many}` : `${n} ${n === 1 ? one : many}`)

// The plan's state as a badge: retired, hidden, or offered
export function stateOf(plan) {
    if (!plan?.is_active) return { label: 'Retired', tone: 'secondary', note: 'Closed to new businesses; those on it keep it' }
    if (!plan?.is_public) return { label: 'Hidden', tone: 'warning', note: 'Not offered at sign-up or on the pricing page' }
    return { label: 'Offered', tone: 'success', note: 'Offered at sign-up and on the pricing page' }
}

// Two letters for a business face
export const initialsOf = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'

// A soft background for a plan's colour (8-digit hex, ~12% alpha)
export const tintOf = (hex) => `${hex || '#2164F3'}1F`

// A plan_changes value as words (prices in shillings, lists joined, switches as Yes/No)
export function changeValue(field, v) {
    if (v === null || v === undefined || v === '') return field?.startsWith('price.') ? 'Not offered' : field?.includes('limit') ? 'Unlimited' : '—'
    if (field?.startsWith('price.')) return kes(v)
    if (field === 'payment_methods' && Array.isArray(v)) return v.map((m) => PAYMENT_METHODS[m]?.label || m).join(', ') || 'None'
    if (Array.isArray(v)) return v.length ? v.join(', ') : 'None'
    if (typeof v === 'boolean') return v ? 'Yes' : 'No'
    if (field === 'icon') return PLAN_ICONS[v]?.label || v
    if (field === 'trial_days') return `${v} days`
    if (typeof v === 'object') return v.name || JSON.stringify(v)
    return String(v)
}
