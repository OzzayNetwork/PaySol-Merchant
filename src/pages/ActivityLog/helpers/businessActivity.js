// ---------------------------------------------------------------
// Business activity helpers (11 Nov 2026): the kinds of event GET /tenant/activity
// returns, how they read, their icons and the avatar tint by who did it.
// Used by ActivityLog.List (the business's Activity Log page).
// The day grouping, result colours and times stay in ./activityMeta.js.
// ---------------------------------------------------------------

// In the order the Kind filter shows them (TenantActivity::KINDS on the backend)
export const KIND_LABELS = {
    business: 'Business',
    products: 'Products',
    sales: 'Sales',
    staff: 'Staff',
    settings: 'Settings',
    subscription: 'Subscription',
    signins: 'Sign-ins',
    setup: 'Setup',
}

export const kindLabel = (kind) => KIND_LABELS[kind] || kind

// One Iconify icon per kind: outline while idle, filled when it is the filter
const KIND_ICONS = {
    business: 'ri:store-2',
    products: 'ri:shopping-basket-2',
    sales: 'ri:receipt',
    staff: 'ri:team',
    settings: 'ri:settings-3',
    subscription: 'ri:vip-crown-2',
    signins: 'ri:login-circle',
    setup: 'ri:list-check-2',
}
export const kindIcon = (kind, on = false) => `${KIND_ICONS[kind] || 'ri:history'}-${on ? 'fill' : 'line'}`

// The PaySol team blue, the business's own people green, PaySol itself grey
export function whoTint(type) {
    if (type === 'admin') return 'bg-primary bg-soft text-primary'
    if (type === 'user') return 'bg-success bg-soft text-success'
    return 'bg-light text-muted'
}

// "Jane Wanjiru" -> "JW" (a name, not an actor object)
export function nameInitials(name = '') {
    return String(name).replace(/&/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2)
        .map((w) => w[0]).join('').toUpperCase() || '?'
}

// The Who filter's fixed choices (the API's `actor`: team | business | system | user:ID)
export const ACTOR_OPTIONS = [
    { key: '', label: 'Anyone', short: '' },
    { key: 'business', label: 'Your team', short: 'Your team' },
    { key: 'team', label: 'PaySol team', short: 'PaySol team' },
    { key: 'system', label: 'PaySol (automatic)', short: 'Automatic' },
]
