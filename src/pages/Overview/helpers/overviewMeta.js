// ---------------------------------------------------------------
// Overview — labels, icons, colours and number formats shared by the
// Overview page and its pieces (Pulse, the health matrix). The backend sends
// keys and numbers; how each one looks is decided here, once.
//
// Icons follow the console rule: outline while idle, filled when selected.
// Payment problems use cash icons (Kelvin, 4 Nov: most payments are M-Pesa).
// ---------------------------------------------------------------

// Utils
import { formatKES } from '@/utils/currency'

// ---- Tabs ----
export const TAB_ICONS = {
    overview: ['ri:dashboard-3-line', 'ri:dashboard-3-fill'],
    money: ['ri:hand-coin-line', 'ri:hand-coin-fill'],
    businesses: ['ri:store-2-line', 'ri:store-2-fill'],
    sales: ['ri:shopping-cart-2-line', 'ri:shopping-cart-2-fill'],
    catalogue: ['ri:price-tag-3-line', 'ri:price-tag-3-fill'],
}

// ---- Cards: one icon pair per metric key (GET /overview cards[].key) ----
export const METRIC_ICONS = {
    live: ['ri:store-2-line', 'ri:store-2-fill'],
    collected: ['ri:hand-coin-line', 'ri:hand-coin-fill'],
    sales: ['ri:shopping-bag-3-line', 'ri:shopping-bag-3-fill'],
    needlook: ['ri:error-warning-line', 'ri:error-warning-fill'],
    services: ['fluent:puzzle-piece-24-regular', 'fluent:puzzle-piece-24-filled'],
    due: ['ri:calendar-check-line', 'ri:calendar-check-fill'],
    unpaid: ['tabler:cash-off', 'tabler:cash-off'],
    paying: ['ri:wallet-3-line', 'ri:wallet-3-fill'],
    trials: ['ri:timer-line', 'ri:timer-fill'],
    trading: ['ri:line-chart-line', 'ri:line-chart-fill'],
    setup: ['ri:flag-line', 'ri:flag-fill'],
    suspended: ['ri:pause-circle-line', 'ri:pause-circle-fill'],
    txns: ['ri:receipt-line', 'ri:receipt-fill'],
    avg: ['ri:scales-3-line', 'ri:scales-3-fill'],
    mpesa: ['ri:smartphone-line', 'ri:smartphone-fill'],
    timeout: ['ri:alarm-warning-line', 'ri:alarm-warning-fill'],
    catalogue: ['ri:price-tag-3-line', 'ri:price-tag-3-fill'],
    verified: ['ri:shield-check-line', 'ri:shield-check-fill'],
    shop: ['ri:store-3-line', 'ri:store-3-fill'],
    matched: ['ri:links-line', 'ri:links-fill'],
    photo: ['ri:image-line', 'ri:image-fill'],
}

export function metricIcon(key, active = false) {
    const pair = METRIC_ICONS[key] || ['ri:bar-chart-2-line', 'ri:bar-chart-2-fill']
    return active ? pair[1] : pair[0]
}

// ---- Number formats (card format: count | ksh | pct) ----
const countFmt = new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 })
const pctFmt = new Intl.NumberFormat('en-KE', { maximumFractionDigits: 1 })

/** A value as the card shows it. Null means "no number" and reads as an em dash. */
export function formatMetric(value, format) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
    const n = Number(value)
    if (format === 'ksh') return formatKES(Math.round(n), { showDecimals: false })
    if (format === 'pct') return `${pctFmt.format(n)}%`
    return countFmt.format(Math.round(n))
}

/** Short axis labels: 12.4K, 1.2M (the tooltip shows the full number). */
export function formatAxis(value, format) {
    const n = Number(value) || 0
    if (format === 'pct') return `${pctFmt.format(n)}%`
    const short = Math.abs(n) >= 1e6 ? `${pctFmt.format(n / 1e6)}M` : Math.abs(n) >= 1e4 ? `${pctFmt.format(n / 1e3)}K` : countFmt.format(n)
    return format === 'ksh' ? `KES ${short}` : short
}

/**
 * How a card's change reads: arrow, words, tone. "good" says which way is good
 * news (up for money in, down for unpaid). No base to compare = neutral.
 */
export function changeOf(card) {
    if (!card || !card.live) return { tone: 'neutral', marker: '', text: 'Planned' }
    if (card.previous_missing || card.change_pct === null || card.change_pct === undefined) {
        return { tone: 'neutral', marker: '•', text: card.previous_missing ? 'No earlier record' : 'No change to show' }
    }
    const pct = Number(card.change_pct)
    if (pct === 0) return { tone: 'neutral', marker: '→', text: 'No change' }
    const up = pct > 0
    const good = (up && card.good === 'up') || (!up && card.good === 'down')
    return { tone: good ? 'positive' : 'negative', marker: up ? '▲' : '▼', text: `${pctFmt.format(Math.abs(pct))}%` }
}

/** "vs the previous 30 days" / "vs the day before", from the echoed range. */
export function comparisonPeriod(range) {
    if (!range?.compare) return ''
    const days = range.days
    if (days === 1) return 'vs the day before'
    if (days === 7) return 'vs the previous week'
    return `vs the previous ${days} days`
}

// ---- Grains (the "View by" menu) ----
export const GRAINS = [
    { value: 'hour', label: 'Hour', rule: 'Up to 7 days' },
    { value: 'day', label: 'Day', rule: 'Any range' },
    { value: 'week', label: 'Week', rule: 'From 14 days' },
    { value: 'month', label: 'Month', rule: 'From 60 days' },
]

// ---- Pulse: severities and issue icons ----
// V11's colours and words (5 Nov): "2 urgent  3 warnings  1 to do"
export const SEVERITY = {
    critical: { label: 'Urgent', count: 'urgent', color: '#c0392b', icon: 'ri:alarm-warning-fill' },
    warning: { label: 'Warning', count: 'warnings', color: '#b7791f', icon: 'ri:error-warning-line' },
    info: { label: 'To do', count: 'to do', color: '#2f6fb3', icon: 'ri:information-line' },
}

// ---- Dates ----
// Nothing exists before launch; the same day as OverviewRange::LAUNCH (backend)
export const LAUNCH_DATE = new Date(2026, 8, 26)

// ---- What the page is for, per role (V11's line under the title) ----
// Keyed by the admin's first matching role; `platform` is the fallback.
export const ROLE_PURPOSE = {
    super_admin: 'Everything that needs someone today, then how PaySol and its businesses are doing.',
    onboarding: 'Businesses still setting up, the ones stuck, and leads ready to become businesses.',
    agent: 'Your businesses and leads: who to visit or call today.',
    support: 'Businesses with problems and the outside services they depend on.',
    finance: 'What businesses owe PaySol, what came in, and (with checkout) the money moving through their tills.',
    platform: 'Everything that needs someone today, then how PaySol and its businesses are doing.',
}

/** The role key for ROLE_PURPOSE from the signed-in admin (roles as strings or { name }). */
export function roleKeyOf(user, scope) {
    if (scope === 'mine') return 'agent'
    // The admin has one `role` ({ name, display_name }); older shapes carried `roles`
    const list = [user?.role, ...(user?.roles || [])].filter(Boolean)
    const names = list.map((r) => String(r?.name || r?.slug || r).toLowerCase().replace(/[\s-]+/g, '_'))
    return ['super_admin', 'finance', 'support', 'onboarding', 'agent'].find((k) => names.some((n) => n.includes(k))) || 'platform'
}

// ---- Services: hourly check colours (as the Integrations page's blocks) ----
export const CHECK_LABELS = { ok: 'Working', slow: 'Slow', fail: 'Failed', none: 'Not checked' }
export const STATE_COLOR = { working: '#1e8e3e', degraded: '#b7791f', down: '#c0392b', unchecked: '#9a9aa3', not_live: '#9a9aa3' }

/** An icon for each kind of issue, so the list reads at a glance (cash for payments). */
export function issueIcon(item) {
    const byCode = {
        payment_failed: 'tabler:cash-off',
        past_due: 'tabler:cash',
        trial_ended: 'ri:timer-flash-line',
        trial_ending: 'ri:timer-line',
        setup_stuck: 'ri:flag-line',
        gone_quiet: 'ri:volume-mute-line',
        followups_overdue: 'ri:phone-line',
        followups_today: 'ri:calendar-todo-line',
        sms: 'ri:message-2-line',
        email: 'ri:mail-line',
        google_maps: 'ri:map-pin-line',
        map_tiles: 'ri:map-2-line',
        osm_tiles: 'ri:map-2-line',
        backups: 'ri:database-2-line',
        geoip: 'ri:global-line',
    }
    return byCode[item?.code] || (item?.source === 'integration' ? 'fluent:puzzle-piece-24-regular' : 'ri:store-2-line')
}

// ---- Health matrix groups (GET /overview/businesses counts) ----
export const HEALTH_GROUPS = [
    { key: 'spotlight', label: 'Spotlight', color: null, hint: 'Needing a look, worst first' },
    { key: 'healthy', label: 'Healthy', color: '#34c38f', hint: 'Live, nothing to look at' },
    { key: 'attention', label: 'Attention', color: '#f1b44c', hint: 'Live, a warning' },
    { key: 'danger', label: 'Danger zone', color: '#f46a6a', hint: 'Live, urgent' },
    { key: 'onboarding', label: 'Setting up', color: '#556ee6', hint: 'Still in setup' },
    { key: 'suspended', label: 'Suspended', color: '#c3c7d4', hint: 'Stopped by an admin' },
]

export const HEALTH_BADGE = {
    healthy: ['bg-success-subtle text-success', 'Healthy'],
    attention: ['bg-warning-subtle text-warning-emphasis', 'Attention'],
    danger: ['bg-danger-subtle text-danger', 'Danger zone'],
    onboarding: ['bg-primary-subtle text-primary', 'Setting up'],
    suspended: ['bg-secondary-subtle text-secondary', 'Suspended'],
    closed: ['bg-secondary-subtle text-secondary', 'Closed'],
}

// ---- Breakdown bar colours, in order (theme colours first) ----
export const BAR_COLORS = ['#556ee6', '#34c38f', '#f1b44c', '#50a5f1', '#f46a6a', '#8e7cc3', '#74788d', '#c3c7d4']

// ---- The breakdown's "PS" tip and "Inspect details" link, per card (V11) ----
// A tip says what to do about the number, not what it is (the description does that).
export const METRIC_TIPS = {
    live: ['Keep live businesses selling', 'A live business with no sale for 3 days shows under Attention. A call usually finds a till or staff problem.'],
    collected: ['Chase failed payments first', 'A failed M-Pesa plan payment is the quickest money back: the owner meant to pay. Remind them before the plan lapses.'],
    sales: ['Sales start with checkout', 'This fills once businesses sell through the counter app.'],
    needlook: ['Work the danger zone first', 'Payment problems come before quiet businesses: they are the ones about to stop.'],
    services: ['A failing key stops messages', 'When SMS or email fails, reminders and sign-in codes stop too. Fix keys on Integrations.'],
    due: ['Due is what plans are worth', 'Each paying business’s monthly plan price, as things stand now.'],
    unpaid: ['Remind before the grace period ends', 'Owners usually pay within a day of a reminder. Send it from the business’s page.'],
    paying: ['Trials should become paying', 'Call a business a few days before its trial ends; it is the moment it decides.'],
    trials: ['Call before the trial ends', 'A short call a few days before the end converts better than an SMS on the day.'],
    trading: ['Trading means a sale this week', 'Businesses live but not trading need a visit, not a reminder.'],
    setup: ['Unstick setup in person', 'A business stuck on one step for 3 days rarely moves alone. Visit or call the owner.'],
    suspended: ['Review suspensions', 'A suspended business pays nothing and sells nothing. Close it or bring it back.'],
    txns: ['Sales start with checkout', 'This fills once businesses sell through the counter app.'],
    avg: ['Sales start with checkout', 'This fills once businesses sell through the counter app.'],
    mpesa: ['Sales start with checkout', 'This fills once businesses sell through the counter app.'],
    timeout: ['Sales start with checkout', 'This fills once businesses sell through the counter app.'],
    catalogue: ['Grow the catalogue from the shops', 'Products businesses add themselves are the best source of new catalogue items.'],
    verified: ['Verify the best sellers first', 'A verified product brings its name, barcode and photo to every business that stocks it.'],
    shop: ['Match before you add', 'A shop product matched to the catalogue gets the catalogue’s name, barcode and photo.'],
    matched: ['Match the unmatched', 'Unmatched products cannot be compared across businesses. Match them on the Catalogue page.'],
    photo: ['Photos help at the till', 'Cashiers find products faster by picture. Add photos to the most stocked ones first.'],
}

/** Where "Inspect details" goes for a card (the page that lists the records behind it). */
export function inspectLink(key) {
    if (['services'].includes(key)) return '/integrations'
    if (['catalogue', 'verified', 'photo', 'shop', 'matched'].includes(key)) return '/catalogue'
    if (['collected', 'due', 'unpaid', 'paying', 'trials', 'needlook'].includes(key)) return { path: '/tenants', query: { tab: 'attention' } }
    return '/tenants'
}
