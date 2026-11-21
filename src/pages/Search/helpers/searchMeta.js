// ---------------------------------------------------------------
// Global search — labels, colours, links and helper rules shared by the
// top-bar universal search (components/search/GlobalSearch.vue) and the results
// page (pages/Search/Search.Results.vue), scoped strictly to the current tenant.
// Modeled to replicate PaySol's platform admin global search architecture.
// ---------------------------------------------------------------

export const ALL_LIMIT = 10;   // rows per group in "all" search
export const ALL_SHOWN = 3;    // rows per group displayed on "all" tab
export const TAB_LIMIT = 50;   // rows requested on a dedicated module tab

export const SEARCH_MODULES = [
    {
        key: 'products',
        label: 'Products & Prices',
        note: 'Items, packs and barcodes in this shop',
        icon: 'ri:price-tag-3-line',
        tint: '#E3F5EC',
        fg: '#1E7F45',
        perm: 'products',
        roles: ['owner', 'manager', 'cashier', 'waiter'],
        action: 'Open product',
    },
    {
        key: 'staff',
        label: 'Staff',
        note: 'Team members, cashiers and PINs',
        icon: 'ri:team-line',
        tint: '#F3EEFD',
        fg: '#6B3FD1',
        perm: 'staff',
        roles: ['owner', 'manager'],
        action: 'Open staff',
    },
    {
        key: 'activity',
        label: 'Activity Log',
        note: 'Audit events and timeline in this business',
        icon: 'ri:history-line',
        tint: '#E8F0FE',
        fg: '#2164F3',
        perm: 'activity',
        roles: ['owner', 'manager'],
        action: 'Open activity',
    },
];

export const moduleMeta = (key) => SEARCH_MODULES.find(m => m.key === key) || SEARCH_MODULES[0];

/**
 * Filter the modules this person may search based on their business role.
 */
export function modulesFor(role = 'waiter') {
    return SEARCH_MODULES.filter(m => !m.roles || m.roles.includes(role));
}

/**
 * Where a result row navigates to.
 */
export function resultLink(row) {
    switch (row.category) {
        case 'products':
            return { path: '/products', query: { q: row.title || row.meta?.barcode || undefined } };
        case 'staff':
            return `/staff/${row.id}`;
        case 'activity':
            return { path: '/activity-log', query: { q: row.title || undefined } };
        default:
            return row.route || '/';
    }
}

/**
 * A module's dedicated listing page.
 */
export function listLink(category) {
    switch (category) {
        case 'products': return '/products';
        case 'staff': return '/staff';
        case 'activity': return '/activity-log';
        default: return '/';
    }
}

/**
 * Badge tone class from status or text.
 */
export function badgeTone(label = '') {
    const l = String(label).toLowerCase();
    if (/(suspend|fail|lost|closed|retired|overdue|expired|inactive|out)/.test(l)) return 'bg-danger-subtle text-danger';
    if (/(attention|pending|trial|demo|low|invited)/.test(l)) return 'bg-warning-subtle text-warning';
    if (/(active|trading|verified|won|paid|confirmed|completed)/.test(l)) return 'bg-success-subtle text-success';
    return 'bg-light text-dark';
}

/**
 * Highlight searched substring: returns [before, hit, after].
 */
export function splitHit(text = '', q = '') {
    const s = String(text ?? '');
    const at = q ? s.toLowerCase().indexOf(q.toLowerCase()) : -1;
    if (at < 0) return [s, '', ''];
    return [s.slice(0, at), s.slice(at, at + q.length), s.slice(at + q.length)];
}

/**
 * Which field matched, in words, for rows whose title does not contain the text.
 */
export const MATCHED_FIELD_LABELS = {
    barcode: 'Barcode',
    sku: 'SKU',
    brand: 'Brand',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    role: 'Role',
    activity: 'Activity',
    description: 'Description',
};

/**
 * Initials for staff rows when no photo is provided.
 */
export function initials(row) {
    if (row.category !== 'staff') return '';
    return String(row.title || '')
        .split(/\s+/)
        .filter(w => /^[a-z0-9]/i.test(w))
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase();
}

/**
 * Detect what kind of query this looks like (barcode, phone number, etc.).
 */
export function detectQuery(q = '') {
    const s = String(q).trim();
    if (!s) return null;

    // Barcode: numeric, 8 to 14 digits
    if (/^\d{8,14}$/.test(s)) {
        return { category: 'products', label: 'a barcode' };
    }

    // Kenyan phone number
    if (/^(07|01|\+?2547|\+?2541)\d{7,8}$/.test(s.replace(/[\s-]/g, ''))) {
        return { category: 'staff', label: 'a phone number' };
    }

    // Email
    if (/^[\w.-]+@[\w.-]+\.\w+$/.test(s)) {
        return { category: 'staff', label: 'an email address' };
    }

    return null;
}

// ---- Shortcut label ----
export const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const SEARCH_SHORTCUT_LABEL = isMac ? '⌘ K' : 'Ctrl K';

export function isSearchShortcut(e) {
    if (e.key?.toLowerCase() !== 'k' || e.altKey || e.shiftKey) return false;
    return isMac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
}

// ---- Recent searches (scoped to tenant and user) ----
const RECENT_KEY = (tenantId = 'default') => `psBizRecent_${tenantId}`;
const MAX_RECENT = 8;

export function readRecent(tenantId) {
    try {
        const raw = localStorage.getItem(RECENT_KEY(tenantId));
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

export function saveRecent(tenantId, q, category = 'all') {
    if (!q || q.trim().length < 2) return readRecent(tenantId);
    const trimmed = q.trim();
    const existing = readRecent(tenantId).filter(r => r.q.toLowerCase() !== trimmed.toLowerCase());
    const next = [{ q: trimmed, category, at: Date.now() }, ...existing].slice(0, MAX_RECENT);
    try {
        localStorage.setItem(RECENT_KEY(tenantId), JSON.stringify(next));
    } catch (e) {}
    return next;
}

export function removeRecent(tenantId, q) {
    const next = readRecent(tenantId).filter(r => r.q.toLowerCase() !== String(q).trim().toLowerCase());
    try {
        localStorage.setItem(RECENT_KEY(tenantId), JSON.stringify(next));
    } catch (e) {}
    return next;
}

export function clearRecent(tenantId) {
    try {
        localStorage.removeItem(RECENT_KEY(tenantId));
    } catch (e) {}
    return [];
}
