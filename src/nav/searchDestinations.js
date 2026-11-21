// ---------------------------------------------------------------
// searchDestinations — the pages, tabs and actions the universal search can
// take you to ("Pages & actions") within the active business, so a user
// finds a place instantly without hunting through the sidebar.
//
// Only real destinations in router/index.js are listed.
// kind:  'page'   opens a page
//        'tab'    opens a page on one of its tabs or views
//        'action' opens the page and starts the action (e.g. /staff/add, /products/add)
// ---------------------------------------------------------------

export const KIND_LABELS = {
    page: 'Page',
    tab: 'Tab',
    action: 'Action',
};

const RAW_DESTINATIONS = [
    // Your business
    {
        key: 'home',
        label: 'Home',
        to: '/',
        kind: 'page',
        crumb: 'Your business',
        icon: 'ri:home-5-line',
        roles: null,
        keywords: ['home', 'dashboard', 'start', 'overview', 'summary', 'today', 'pulse'],
        description: 'Business welcome, setup checklist and stats',
    },

    // Selling
    {
        key: 'sell-counter',
        label: 'Counter (POS)',
        to: '/sell',
        kind: 'page',
        crumb: 'Selling',
        icon: 'ri:shopping-cart-2-line',
        roles: ['owner', 'manager', 'cashier', 'waiter'],
        soon: true,
        keywords: ['counter', 'pos', 'till', 'sell', 'cart', 'checkout', 'ring up', 'cash register'],
        description: 'Ring up sales, scan items and take payments',
    },
    {
        key: 'sell-tabs',
        label: 'Open Tabs & Bills',
        to: '/sell/tabs',
        kind: 'page',
        crumb: 'Selling',
        icon: 'ri:file-list-3-line',
        roles: ['owner', 'manager', 'cashier', 'waiter'],
        soon: true,
        keywords: ['open tabs', 'bills', 'orders', 'split payment', 'rounds', 'table'],
        description: 'Manage active tables and ongoing customer orders',
    },
    {
        key: 'sell-receipts',
        label: 'Receipts & Reprint',
        to: '/sell/receipts',
        kind: 'page',
        crumb: 'Selling',
        icon: 'ri:bill-line',
        roles: ['owner', 'manager', 'cashier', 'waiter'],
        soon: true,
        keywords: ['receipts', 'reprint', 'invoices', 'proof of purchase', 'past sales'],
        description: 'Look up past receipts and reprint on request',
    },
    {
        key: 'sell-shift',
        label: 'My Shift & Cash Count',
        to: '/sell/shift',
        kind: 'page',
        crumb: 'Selling',
        icon: 'ri:time-line',
        roles: ['owner', 'manager', 'cashier'],
        soon: true,
        keywords: ['shift', 'cash count', 'clock in', 'clock out', 'float', 'drawer', 'till balance'],
        description: 'Open or close cashier shift and count the till',
    },

    // Products & Stock
    {
        key: 'products-list',
        label: 'Products & Prices',
        to: '/products',
        kind: 'page',
        crumb: 'Products & stock',
        icon: 'ri:price-tag-3-line',
        roles: ['owner', 'manager'],
        keywords: ['products', 'prices', 'inventory', 'items', 'barcodes', 'skus', 'packs', 'selling prices'],
        description: 'Manage all items, barcodes, prices and packaging',
    },
    {
        key: 'products-add',
        label: 'Add a Product',
        to: '/products/add',
        kind: 'action',
        crumb: 'Products & stock › Products',
        icon: 'ri:add-box-line',
        roles: ['owner', 'manager'],
        keywords: ['add product', 'new product', 'create item', 'scan barcode', 'upload product', 'new item'],
        description: 'Add a new product with barcode, price and opening stock',
    },
    {
        key: 'stock-levels',
        label: 'Stock Levels',
        to: '/stock',
        kind: 'page',
        crumb: 'Products & stock › Stock',
        icon: 'ri:archive-2-line',
        roles: ['owner', 'manager'],
        soon: true,
        keywords: ['stock levels', 'quantities', 'inventory count', 'reorder alerts', 'low stock'],
        description: 'Current counts and reorder points across branches',
    },
    {
        key: 'stock-receive',
        label: 'Receive Goods',
        to: '/stock/receive',
        kind: 'action',
        crumb: 'Products & stock › Stock',
        icon: 'ri:inbox-archive-line',
        roles: ['owner', 'manager'],
        soon: true,
        keywords: ['receive goods', 'supplier delivery', 'stock intake', 'add stock'],
        description: 'Record incoming supplier shipments and invoices',
    },
    {
        key: 'stock-movements',
        label: 'Stock Movements',
        to: '/stock/movements',
        kind: 'page',
        crumb: 'Products & stock › Stock',
        icon: 'ri:swap-line',
        roles: ['owner', 'manager'],
        soon: true,
        keywords: ['stock movements', 'adjustments', 'wastage', 'damage', 'spoilage', 'audit trail'],
        description: 'Audit history of all stock additions, deductions and sales',
    },

    // People
    {
        key: 'staff-list',
        label: 'Staff & Team',
        to: '/staff',
        kind: 'page',
        crumb: 'People',
        icon: 'ri:team-line',
        roles: ['owner', 'manager'],
        keywords: ['staff', 'team', 'employees', 'cashiers', 'waiters', 'managers', 'workers', 'crew'],
        description: 'Manage team members, roles, branch access and PINs',
    },
    {
        key: 'staff-add',
        label: 'Add Staff Member',
        to: '/staff/add',
        kind: 'action',
        crumb: 'People › Staff',
        icon: 'ri:user-add-line',
        roles: ['owner', 'manager'],
        keywords: ['add staff', 'invite staff', 'new cashier', 'new waiter', 'new manager', 'create pin'],
        description: 'Invite a cashier, waiter or manager and assign a PIN',
    },

    // Money
    {
        key: 'money-check',
        label: 'Money Check',
        to: '/money-check',
        kind: 'page',
        crumb: 'Money',
        icon: 'ri:scales-3-line',
        roles: ['owner', 'manager'],
        soon: true,
        keywords: ['money check', 'cash audit', 'voids', 'overrides', 'discrepancies', 'reconciliation'],
        description: 'Compare expected cash vs actual counts and review voids',
    },
    {
        key: 'mpesa-payments',
        label: 'M-Pesa Payments',
        to: '/mpesa',
        kind: 'page',
        crumb: 'Money',
        icon: 'ri:smartphone-line',
        roles: ['owner', 'manager'],
        soon: true,
        keywords: ['mpesa', 'safaricom', 'lipa na mpesa', 'mobile money', 'transactions', 'receipt code'],
        description: 'Live M-Pesa receipts verified by Safaricom',
    },
    {
        key: 'payment-methods',
        label: 'How You Get Paid',
        to: '/payment-methods',
        kind: 'page',
        crumb: 'Money',
        icon: 'ri:bank-card-line',
        roles: ['owner', 'manager'],
        soon: true,
        keywords: ['payment methods', 'tills', 'paybills', 'bank account', 'card machine'],
        description: 'Connected M-Pesa till numbers and bank accounts',
    },

    // Oversight
    {
        key: 'activity-log',
        label: 'Activity Log',
        to: '/activity-log',
        kind: 'page',
        crumb: 'Oversight',
        icon: 'ri:history-line',
        roles: ['owner', 'manager'],
        keywords: ['activity log', 'history', 'audit', 'events', 'timeline', 'who did what', 'changes'],
        description: 'Track all sign-ins, product edits, staff changes and sales',
    },

    // Business settings
    {
        key: 'branches',
        label: 'Branches & Locations',
        to: '/branches',
        kind: 'page',
        crumb: 'Business',
        icon: 'ri:store-2-line',
        roles: ['owner', 'manager'],
        soon: true,
        keywords: ['branches', 'stores', 'locations', 'outlets', 'addresses'],
        description: 'Manage shop branches and counter locations',
    },
    {
        key: 'business-details',
        label: 'Business Details',
        to: '/business',
        kind: 'page',
        crumb: 'Business',
        icon: 'ri:building-2-line',
        roles: ['owner'],
        soon: true,
        keywords: ['business details', 'name', 'kra pin', 'receipt header', 'logo', 'location'],
        description: 'Shop profile, KRA PIN and receipt header settings',
    },
    {
        key: 'plan-billing',
        label: 'Plan & Billing',
        to: '/billing',
        kind: 'page',
        crumb: 'Business',
        icon: 'ri:vip-crown-2-line',
        roles: ['owner'],
        soon: true,
        keywords: ['plan', 'billing', 'subscription', 'upgrade', 'invoices', 'pricing'],
        description: 'Subscription status, renewal and available features',
    },

    // Testing / Development
    {
        key: 'test-page',
        label: 'Component Reference',
        to: '/test-page',
        kind: 'page',
        crumb: 'Development',
        icon: 'ri:flask-line',
        roles: ['owner', 'manager'],
        keywords: ['test page', 'components', 'widgets', 'dev reference', 'testing'],
        description: 'Interactive catalog of all PaySol UI components',
    },
];

/**
 * Filter destinations by current role.
 */
export function destinationsFor(role = 'waiter') {
    return RAW_DESTINATIONS.filter(d => !d.roles || d.roles.includes(role));
}

/**
 * Match destinations against typed text.
 */
export function matchDestinations(q = '', destinations = [], limit = 5) {
    const s = q.trim().toLowerCase();
    if (!s) return [];

    const scored = [];
    for (const d of destinations) {
        let score = 0;
        const labelLower = d.label.toLowerCase();
        if (labelLower === s) score += 100;
        else if (labelLower.startsWith(s)) score += 50;
        else if (labelLower.includes(s)) score += 30;

        for (const kw of d.keywords || []) {
            const kwLower = kw.toLowerCase();
            if (kwLower === s) score += 40;
            else if (kwLower.startsWith(s)) score += 20;
            else if (kwLower.includes(s)) score += 10;
        }

        if (d.crumb && d.crumb.toLowerCase().includes(s)) score += 5;
        if (d.description && d.description.toLowerCase().includes(s)) score += 5;

        if (score > 0) {
            scored.push({ destination: d, score });
        }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(item => item.destination);
}
