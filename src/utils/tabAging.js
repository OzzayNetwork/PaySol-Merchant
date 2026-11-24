import { reactive } from 'vue';

const STORAGE_PREFIX = 'psTabAgingConfig_';

export const DEFAULT_AGING_CONFIG = {
  extendedMinutes: 120, // 2 hours
  overdueMinutes: 240,  // 4 hours
};

export const AGING_PRESETS = [
  {
    key: 'fast',
    label: 'Fast-Paced Bar',
    description: 'Extended after 45 min · Overdue after 2 hrs',
    extendedMinutes: 45,
    overdueMinutes: 120,
  },
  {
    key: 'standard',
    label: 'Restaurant Standard',
    description: 'Extended after 2 hrs · Overdue after 4 hrs',
    extendedMinutes: 120,
    overdueMinutes: 240,
  },
  {
    key: 'lounge',
    label: 'Lounge / All-Day',
    description: 'Extended after 3 hrs · Overdue after 6 hrs',
    extendedMinutes: 180,
    overdueMinutes: 360,
  },
];

function getStorageKey(tenantId = null) {
  let id = tenantId;
  if (!id) {
    try {
      const raw = localStorage.getItem('psBizSession') || sessionStorage.getItem('psBizSession');
      if (raw) {
        const parsed = JSON.parse(raw);
        id = parsed?.tenant?.id || 'default';
      }
    } catch {
      id = 'default';
    }
  }
  return `${STORAGE_PREFIX}${id || 'default'}`;
}

function loadConfig(tenantId = null) {
  try {
    const raw = localStorage.getItem(getStorageKey(tenantId));
    if (raw) {
      const parsed = JSON.parse(raw);
      const ext = Number(parsed?.extendedMinutes);
      const ov = Number(parsed?.overdueMinutes);
      if (Number.isFinite(ext) && ext >= 5 && Number.isFinite(ov) && ov > ext) {
        return { extendedMinutes: Math.round(ext), overdueMinutes: Math.round(ov) };
      }
    }
  } catch {
    // Ignore storage errors
  }
  return { ...DEFAULT_AGING_CONFIG };
}

// Reactive singleton so changes in Settings immediately update Tabs.List.vue and SaveTabAside.vue
export const tabAgingConfig = reactive(loadConfig());

export function reloadTabAgingConfig(tenantId = null) {
  const fresh = loadConfig(tenantId);
  tabAgingConfig.extendedMinutes = fresh.extendedMinutes;
  tabAgingConfig.overdueMinutes = fresh.overdueMinutes;
}

export function saveTabAgingConfig({ extendedMinutes, overdueMinutes }, tenantId = null) {
  const ext = Math.max(5, Math.round(Number(extendedMinutes) || DEFAULT_AGING_CONFIG.extendedMinutes));
  const ov = Math.max(ext + 5, Math.round(Number(overdueMinutes) || DEFAULT_AGING_CONFIG.overdueMinutes));

  tabAgingConfig.extendedMinutes = ext;
  tabAgingConfig.overdueMinutes = ov;

  try {
    localStorage.setItem(
      getStorageKey(tenantId),
      JSON.stringify({ extendedMinutes: ext, overdueMinutes: ov })
    );
  } catch {
    // Ignore storage errors
  }

  return { extendedMinutes: ext, overdueMinutes: ov };
}

export function resetTabAgingConfig(tenantId = null) {
  return saveTabAgingConfig({ ...DEFAULT_AGING_CONFIG }, tenantId);
}

/**
 * Format a duration in minutes into a concise human label (e.g. 45m, 2h, 2h 30m).
 */
export function formatMinutesShort(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m < 60) return `${m}m`;
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${hrs}h` : `${hrs}h ${rem}m`;
}

/**
 * Calculate elapsed minutes since the tab was opened.
 */
export function getTabElapsedMinutes(tab) {
  const timestamp = tab?.opened_at || tab?.created_at || tab?.updated_at;
  if (!timestamp) return 0;
  const createdDate = new Date(timestamp);
  if (isNaN(createdDate.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60)));
}

/**
 * Format relative elapsed time (e.g., "Just now", "12 Min Ago", "3 Hours Ago").
 */
export function formatTabRelativeTime(timestamp) {
  if (!timestamp) return 'Just now';
  const now = new Date();
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Recently';
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} Min Ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} Hour${diffHours > 1 ? 's' : ''} Ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} Day${diffDays > 1 ? 's' : ''} Ago`;
}

/**
 * Returns the muted card theme, badge colors, outline button colors, and tier
 * for a given tab, respecting the live `tabAgingConfig` thresholds.
 */
export function getTabAgingTheme(tab, config = tabAgingConfig) {
  const status = String(tab?.status || '').toLowerCase();
  const totalAmount = Number(tab?.total_amount || 0);
  const paidAmount = Number(tab?.paid_amount || 0);
  const balanceDue = Number(tab?.balance_due ?? (totalAmount - paidAmount));

  // 1. Settled / Fully Paid (Muted Sage Green)
  if (status === 'settled' || status === 'paid' || (totalAmount > 0 && balanceDue <= 0)) {
    return {
      tier: 'settled',
      label: 'Settled',
      cardBg: '#f0f9f3',
      cardBorder: '#c7edd2',
      bottomBorder: '#86efac',
      badgeBg: '#dcfce7',
      badgeText: '#166534',
      badgeBorder: '#bbf7d0',
      priceColor: '#15803d',
      outlineBtnColor: '#15803d',
      outlineBtnBorder: '#16a34a',
      btnBg: '#16a34a',
      fadeGradient: 'linear-gradient(to bottom, rgba(240, 249, 243, 0) 0%, rgba(240, 249, 243, 0.9) 65%, #f0f9f3 100%)',
    };
  }

  // 2. Partially Paid (Muted Warm Honey)
  if (status === 'partially_paid' || (paidAmount > 0 && balanceDue > 0)) {
    return {
      tier: 'partial',
      label: 'Partially Paid',
      cardBg: '#fdf8ea',
      cardBorder: '#fae8b6',
      bottomBorder: '#fde68a',
      badgeBg: '#fef3c7',
      badgeText: '#92400e',
      badgeBorder: '#fde68a',
      priceColor: '#b45309',
      outlineBtnColor: '#b45309',
      outlineBtnBorder: '#d97706',
      btnBg: '#d97706',
      fadeGradient: 'linear-gradient(to bottom, rgba(253, 248, 234, 0) 0%, rgba(253, 248, 234, 0.9) 65%, #fdf8ea 100%)',
    };
  }

  const elapsedMin = getTabElapsedMinutes(tab);
  const extThreshold = Number(config?.extendedMinutes ?? DEFAULT_AGING_CONFIG.extendedMinutes);
  const ovThreshold = Number(config?.overdueMinutes ?? DEFAULT_AGING_CONFIG.overdueMinutes);

  // 3. Overdue / Critical Aging (Muted Dusty Rose)
  if (elapsedMin >= ovThreshold || status === 'overdue' || status === 'voided') {
    return {
      tier: 'overdue',
      label: `Overdue (${formatMinutesShort(ovThreshold)}+)`,
      shortLabel: 'Overdue',
      cardBg: '#fdf2f2',
      cardBorder: '#fcdada',
      bottomBorder: '#fca5a5',
      badgeBg: '#ffe4e6',
      badgeText: '#9f1239',
      badgeBorder: '#fecdd3',
      priceColor: '#be123c',
      outlineBtnColor: '#be123c',
      outlineBtnBorder: '#e11d48',
      btnBg: '#e11d48',
      fadeGradient: 'linear-gradient(to bottom, rgba(253, 242, 242, 0) 0%, rgba(253, 242, 242, 0.9) 65%, #fdf2f2 100%)',
    };
  }

  // 4. Extended Session / Warning (Muted Warm Honey/Wheat)
  if (elapsedMin >= extThreshold) {
    return {
      tier: 'extended',
      label: `Active (${formatMinutesShort(extThreshold)}+)`,
      shortLabel: 'Extended',
      cardBg: '#fdf8ea',
      cardBorder: '#fae8b6',
      bottomBorder: '#fde68a',
      badgeBg: '#fef9c3',
      badgeText: '#854d0e',
      badgeBorder: '#fef08a',
      priceColor: '#b45309',
      outlineBtnColor: '#b45309',
      outlineBtnBorder: '#d97706',
      btnBg: '#d97706',
      fadeGradient: 'linear-gradient(to bottom, rgba(253, 248, 234, 0) 0%, rgba(253, 248, 234, 0.9) 65%, #fdf8ea 100%)',
    };
  }

  // 5. Fresh / Active (Muted Soft Slate-Blue)
  return {
    tier: 'fresh',
    label: 'Outstanding',
    shortLabel: 'Fresh',
    cardBg: '#f1f6fd',
    cardBorder: '#dbe7f7',
    bottomBorder: '#93c5fd',
    badgeBg: '#dbeafe',
    badgeText: '#1e40af',
    badgeBorder: '#bfdbfe',
    priceColor: '#1d4ed8',
    outlineBtnColor: '#1d4ed8',
    outlineBtnBorder: '#2563eb',
    btnBg: '#1d4ed8',
    fadeGradient: 'linear-gradient(to bottom, rgba(241, 246, 253, 0) 0%, rgba(241, 246, 253, 0.9) 65%, #f1f6fd 100%)',
  };
}
