// ---------------------------------------------------------------
// activityMeta — how the Activity log draws what the API sends (9 Nov 2026,
// from the canvas's "ActivityLogCards" board, version 2).
//
// The API owns the words (category, type and result labels, the sentence);
// this file only adds what a screen needs: icons (outline when idle, filled
// when chosen), colours, initials, day headings in Nairobi time and the
// browser logos for the event's Device section.
// ---------------------------------------------------------------

// Categories: icon pair and the colour of the small badge on each row's avatar
export const CATEGORY_META = {
    all: { icon: 'ri:stack-line', iconActive: 'ri:stack-fill', color: '#495057' },
    security: { icon: 'ri:shield-check-line', iconActive: 'ri:shield-check-fill', color: '#7B4FC9' },
    team: { icon: 'ri:team-line', iconActive: 'ri:team-fill', color: '#2164F3' },
    businesses: { icon: 'ri:store-2-line', iconActive: 'ri:store-2-fill', color: '#5B6B8C' },
    money: { icon: 'ri:hand-coin-line', iconActive: 'ri:hand-coin-fill', color: '#1E7F45' },
    messaging: { icon: 'ri:mail-send-line', iconActive: 'ri:mail-send-fill', color: '#0F7C8A' },
    settings: { icon: 'ri:settings-4-line', iconActive: 'ri:settings-4-fill', color: '#495057' },
    references: { icon: 'ri:price-tag-3-line', iconActive: 'ri:price-tag-3-fill', color: '#B4620A' },
    leads: { icon: 'ri:user-star-line', iconActive: 'ri:user-star-fill', color: '#C2185B' },
    sales: { icon: 'ri:shopping-cart-2-line', iconActive: 'ri:shopping-cart-2-fill', color: '#2164F3' },
}

// One sentence per category, used as the card title's tooltip
export const CATEGORY_HINT = {
    all: 'Everything that happens on PaySol, newest first',
    security: 'Admins and businesses’ people: sign-ins, failures, lockouts, codes, passwords, devices',
    team: 'Admin accounts created, changed, deactivated',
    businesses: 'Every business: onboarding, status, staff, products, stock, tills and PayBills, setup',
    money: 'What businesses pay PaySol, and the reminders sent',
    messaging: 'Emails and SMS sent, contacts and opt-outs',
    settings: 'PaySol’s own settings and the outside services’ keys',
    references: 'The product catalogue, locations and areas',
    leads: 'Leads moving through the pipeline, and the business registry',
    sales: 'Sales, voids and refunds at the counters',
}

// Dots for a category's types, in order
export const TYPE_DOTS = ['#2164F3', '#34C38F', '#F1B44C', '#50A5F1', '#8E7CC3', '#F46A6A', '#5B6B8C']

// Results: the pill's colours and the left card's dot
export const RESULT_META = {
    ok: { label: 'Done', bg: '#E3F5EC', fg: '#1E7F45', dot: '#34C38F' },
    refused: { label: 'Refused', bg: 'rgba(244,106,106,.14)', fg: '#B42318', dot: '#F46A6A' },
    failed: { label: 'Failed', bg: 'rgba(244,106,106,.14)', fg: '#B42318', dot: '#F46A6A' },
    locked: { label: 'Locked out', bg: '#FEF3E2', fg: '#8A5500', dot: '#F1B44C' },
}

// Who did it: the left card's label and icons, and the avatar's tint
export const ACTOR_META = {
    admin: { label: 'PaySol team', icon: 'ri:user-line', iconActive: 'ri:user-fill', tint: '#E8F0FE', fg: '#2164F3' },
    user: { label: 'Businesses’ people', icon: 'ri:store-2-line', iconActive: 'ri:store-2-fill', tint: '#E3F5EC', fg: '#1E7F45' },
    system: { label: 'System', icon: 'ri:settings-3-line', iconActive: 'ri:settings-3-fill', tint: '#EFF2F7', fg: '#495057' },
    unknown: { label: 'Not signed in', icon: 'ri:question-line', iconActive: 'ri:question-fill', tint: '#FDECEC', fg: '#B42318' },
}

// Device trust, as the API sends it
export const TRUST_META = {
    trusted: { label: 'Trusted device', bg: '#E3F5EC', fg: '#1E7F45' },
    known: { label: 'Seen before', bg: '#E3F5EC', fg: '#1E7F45' },
    new: { label: 'New device', bg: '#FEF3E2', fg: '#8A5500' },
    unknown: { label: 'Never seen before', bg: 'rgba(244,106,106,.14)', fg: '#B42318' },
}

// The browser's (or app's) logo from Iconify's "logos" set; anything else gets a globe
const BROWSER_LOGOS = {
    Chrome: 'logos:chrome',
    'Microsoft Edge': 'logos:microsoft-edge',
    Firefox: 'logos:firefox',
    Safari: 'logos:safari',
    Opera: 'logos:opera',
}
export function browserLogo(browser) {
    if (!browser) return null
    if (browser.startsWith('PaySol')) return null        // the counter app gets the PaySol tile instead
    return BROWSER_LOGOS[browser] || 'ri:global-line'
}

// What kind of device, in words
export const DEVICE_KIND = { desktop: 'computer', phone: 'phone', tablet: 'tablet', counter: 'counter' }

// "PS" for the system, "?" for a failed sign-in, else the first letters of two names
export function initialsOf(actor) {
    if (!actor) return '?'
    if (actor.type === 'system') return 'PS'
    if (actor.type === 'unknown' || !actor.name) return '?'
    return actor.name.split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase()
}

// ---- Nairobi dates ----
const TZ = 'Africa/Nairobi'
export const dayKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(d))

/** YYYY-MM-DD of a Date as the browser holds it (the date pickers give local dates) */
export function ymd(d) {
    if (!d) return ''
    const x = new Date(d)
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

/** The day heading an event sits under: Today, Yesterday, else "Sat 7 Nov" (with the year when not this year) */
export function dayLabel(iso) {
    const today = dayKey(new Date())
    const k = dayKey(iso)
    if (k === today) return 'Today'
    if (k === dayKey(Date.now() - 86400000)) return 'Yesterday'
    const sameYear = k.slice(0, 4) === today.slice(0, 4)
    return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) }).format(new Date(iso))
}

/** 14:02 in Nairobi */
export function timeOf(iso) {
    return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

/** Sat 7 Nov 2026 at 14:02 (Nairobi) */
export function longWhen(iso) {
    const date = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
    return `${date} at ${timeOf(iso)}`
}

/**
 * A log panel's title (Kelvin, 9 Nov: the panels read as a professional
 * record, alike across the console): what happened, with the person moved to
 * the "by …" line under it. "changed the price of" + "Tusker Lager 500ml" →
 * "Changed the price of Tusker Lager 500ml". Technical notes in brackets
 * ("(a path on the public disk)") are dropped.
 */
export function recordTitle(verb, what) {
    const text = [verb, what].filter(Boolean).join(' ').replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Event'
}

/** before / after as one line: { price: 250 } → "250"; several fields → "price: 250 · plan: free" */
export function changeText(v) {
    if (v === null || v === undefined || v === '') return '—'
    if (typeof v !== 'object') return String(v)
    const show = (x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))
    const entries = Object.entries(v).filter(([, x]) => x !== null && x !== undefined && x !== '')
    if (!entries.length) return '—'
    if (entries.length === 1) return show(entries[0][1])
    return entries.map(([k, x]) => `${k.replace(/_/g, ' ')}: ${show(x)}`).join(' · ')
}
