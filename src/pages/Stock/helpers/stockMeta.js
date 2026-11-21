/**
 * Stock & Inventory Meta & Formatters (18 Nov 2026)
 *
 * Status definitions, movement types, progress calculations, and badges.
 * Follows Kelvin's inventory table patterns and colors.
 */

export const STOCK_STATUSES = {
  all: { key: "all", label: "All Items", badgeClass: "bg-light text-muted", icon: "mdi mdi-package-variant-closed" },
  needs_order: { key: "needs_order", label: "Needs Order", badgeClass: "bg-danger-subtle text-danger", icon: "mdi mdi-alert-circle" },
  out: { key: "out", label: "Out of Stock", badgeClass: "bg-danger-subtle text-danger", icon: "mdi mdi-close-circle" },
  low: { key: "low", label: "Low Stock", badgeClass: "bg-warning-subtle text-warning", icon: "mdi mdi-alert" },
  ok: { key: "ok", label: "In Stock", badgeClass: "bg-success-subtle text-success", icon: "mdi mdi-check-circle" },
  no_point: { key: "no_point", label: "No Reorder Point", badgeClass: "bg-secondary-subtle text-secondary", icon: "mdi mdi-information" },
  not_counted: { key: "not_counted", label: "Uncounted", badgeClass: "bg-light text-muted", icon: "mdi mdi-help-circle" },
};

export const MOVEMENT_TYPES = {
  receive: { key: "receive", label: "Goods Received", icon: "bx bx-archive-in", colorClass: "text-success", badgeClass: "bg-success-subtle text-success" },
  sale: { key: "sale", label: "Sale", icon: "bx bx-shopping-bag", colorClass: "text-primary", badgeClass: "bg-primary-subtle text-primary" },
  audit_count: { key: "audit_count", label: "Audit Count", icon: "bx bx-slider-alt", colorClass: "text-info", badgeClass: "bg-info-subtle text-info" },
  waste_spoilage: { key: "waste_spoilage", label: "Waste / Spoilage", icon: "bx bx-trash", colorClass: "text-danger", badgeClass: "bg-danger-subtle text-danger" },
  staff_consumption: { key: "staff_consumption", label: "Staff Consumption", icon: "bx bx-coffee", colorClass: "text-warning", badgeClass: "bg-warning-subtle text-warning" },
  transfer_out: { key: "transfer_out", label: "Transfer Out", icon: "bx bx-right-arrow-alt", colorClass: "text-secondary", badgeClass: "bg-secondary-subtle text-secondary" },
  transfer_in: { key: "transfer_in", label: "Transfer In", icon: "bx bx-left-arrow-alt", colorClass: "text-success", badgeClass: "bg-success-subtle text-success" },
};

export const ADJUSTMENT_REASONS = [
  { value: "audit_count", label: "Physical Count Audit", desc: "Set actual count counted on the shelf / store", icon: "bx bx-slider-alt" },
  { value: "waste_spoilage", label: "Waste / Breakage / Spoilage", desc: "Deduct broken bottles, expired food, or wasted units", icon: "bx bx-trash" },
  { value: "staff_consumption", label: "Staff Drink / Meal", desc: "Deduct authorized staff meals or beverages", icon: "bx bx-coffee" },
];

/**
 * Calculates stock health progress bar percentage and status label.
 * Reuses Kelvin's formula from Products.inventory.pos.table.vue.
 */
export function calculateStockHealth(quantity, reorderPoint) {
  const qty = Number(quantity) || 0;
  const rol = Number(reorderPoint) || 0;

  if (qty <= 0) {
    return { percent: 0, label: "Out of Stock", barClass: "bg-danger", textClass: "text-danger" };
  }
  if (!rol || rol <= 0) {
    return { percent: 100, label: "Counted", barClass: "bg-info", textClass: "text-info" };
  }

  const rawPercent = Math.round((qty / rol) * 100);
  const clampedPercent = Math.min(Math.max(rawPercent, 5), 100);

  if (rawPercent >= 100) {
    return { percent: clampedPercent, label: "Safe", barClass: "bg-success", textClass: "text-success" };
  }
  if (rawPercent >= 25) {
    return { percent: clampedPercent, label: "Low", barClass: "bg-warning", textClass: "text-warning" };
  }
  return { percent: clampedPercent, label: "Critically Low", barClass: "bg-danger", textClass: "text-danger" };
}

/**
 * Format quantity with up to 3 decimals, trimming trailing zeros.
 */
export function formatQty(n, unit = "") {
  if (n === null || n === undefined) return "—";
  const num = Number(n);
  const formatted = num.toLocaleString("en-KE", { maximumFractionDigits: 3 });
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Format KES currency.
 */
export function formatMoney(amount) {
  if (amount === null || amount === undefined) return "KES 0.00";
  return `KES ${Number(amount).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
