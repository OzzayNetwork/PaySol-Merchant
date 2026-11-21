// ---------------------------------------------------------------
// Staff helpers (12 Nov 2026): how roles and statuses read and look, shared by
// Staff.List, Staff.Add, Staff.Details and the Role.Picker. Role words follow
// README.md §2 (Proposed); the backend's TenantRole is the authority.
// ---------------------------------------------------------------

// Every role (the owner is set at onboarding, never added here)
export const ROLE_META = {
    owner: {
        label: 'Owner',
        icon: 'ri:vip-crown-2-line', iconActive: 'ri:vip-crown-2-fill',
        tint: 'bg-warning bg-soft text-warning',
        about: 'Runs the business. Sees everything, can change anything.',
    },
    manager: {
        label: 'Manager',
        icon: 'ri:shield-user-line', iconActive: 'ri:shield-user-fill',
        tint: 'bg-primary bg-soft text-primary',
        about: 'Runs shifts and stock, manages staff, approves voids and discounts. Signs in with a password.',
    },
    cashier: {
        label: 'Cashier',
        icon: 'ri:shopping-cart-2-line', iconActive: 'ri:shopping-cart-2-fill',
        tint: 'bg-success bg-soft text-success',
        about: 'Sells at the counter, takes payments, opens and closes their shift. Signs in with a PIN.',
    },
    waiter: {
        label: 'Waiter',
        icon: 'ri:restaurant-2-line', iconActive: 'ri:restaurant-2-fill',
        tint: 'bg-info bg-soft text-info',
        about: 'Opens tabs and adds rounds for their tables. Signs in with a PIN.',
    },
}

// Roles the app can give (POST / PATCH refuse "owner")
export const ASSIGNABLE_ROLES = ['manager', 'cashier', 'waiter']

export const roleLabel = (role) => ROLE_META[role]?.label || role || '—'

// Status at THIS business (the membership), as the API names it
export const STATUS_META = {
    active: { label: 'Active', cls: 'bg-success bg-soft text-success' },
    invited: { label: 'Invited', cls: 'bg-warning bg-soft text-warning' },
    suspended: { label: 'Suspended', cls: 'bg-danger bg-soft text-danger' },
}

export const statusMeta = (status) => STATUS_META[status] || { label: status || '—', cls: 'bg-light text-muted' }

// "Jane Wanjiru" -> "JW"
export function initialsOf(name = '') {
    return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
}

// Branch ids -> "Main, Westlands"; null / [] means every branch
export function branchNames(scope, branches = []) {
    if (!scope || !scope.length) return 'All branches'
    const names = scope.map((id) => branches.find((b) => b.id === id)?.name).filter(Boolean)
    return names.length ? names.join(', ') : `${scope.length} ${scope.length === 1 ? 'branch' : 'branches'}`
}
