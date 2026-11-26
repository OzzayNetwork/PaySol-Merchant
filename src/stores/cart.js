import { defineStore } from "pinia";
import { groupTabItems } from "@/utils/tabAging";

export const WALK_IN_CUSTOMER = Object.freeze({
  id: null,
  is_walk_in: true,
  name: "Walk-in Customer",
  phone: "Default counter customer",
  email: "",
  loyalty_tier: "Standard",
  loyalty_points: 0,
  risk_tier: "trusted",
});

/**
 * POS Cart Pinia Store (22 Nov 2026).
 *
 * Guarantees cart state persistence across customer selection,
 * modal dialogs, shift opening, and view switching.
 */
export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [], // Array of { id, product, quantity, originalQty, unit_price, tax_rate, discount_amount, notes }
    customer: { ...WALK_IN_CUSTOMER }, // Defaults to Walk-in Customer
    table: null, // Selected restaurant/hospitality table { id, table_number, label }
    activeTabId: null, // If working on an existing open tab
    activeTab: null, // Full metadata of the loaded open tab
    activeTabs: [], // Multiple tabs loaded for Joint Multi-Tab Settlement
    discountAmount: 0,
    deliveryFee: 0,
    notes: "",
    channel: "counter",
    fulfilmentMethod: "takeaway",
  }),

  getters: {
    itemCount: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    lineItemsCount: (state) => state.items.length,
    isEmpty: (state) => state.items.length === 0,
    isEditingTab: (state) => Boolean(state.activeTabId),
    isJointTabMode: (state) => Array.isArray(state.activeTabs) && state.activeTabs.length > 1,
    activeTabIds: (state) => {
      if (Array.isArray(state.activeTabs) && state.activeTabs.length > 0) {
        return state.activeTabs.map((t) => t.id);
      }
      return state.activeTabId ? [state.activeTabId] : [];
    },
    jointTabsLabel: (state) => {
      if (Array.isArray(state.activeTabs) && state.activeTabs.length > 1) {
        return `${state.activeTabs.length} Tabs (${state.activeTabs.map((t) => t.tab_number).filter(Boolean).join(", ")})`;
      }
      return state.activeTab?.tab_number || state.activeTab?.name || "";
    },
    hasUnsavedCart: (state) => {
      if (state.activeTabId) {
        return state.items.some(
          (item) => Number(item.quantity || 0) - Number(item.originalQty || 0) > 0
        );
      }
      return state.items.length > 0;
    },

    pendingTabItems: (state) => {
      if (!state.activeTabId) return [];
      return state.items
        .map((item) => {
          const orig = Number(item.originalQty || 0);
          const added = Number((Number(item.quantity || 0) - orig).toFixed(3));
          if (added <= 0) return null;
          return {
            product_id: String(item.product?.id || item.id),
            pack_id: item.pack_id ?? null,
            quantity: added,
            unit_price: Number(item.unit_price || 0),
            tax_rate: Number(item.tax_rate || 0),
            discount_amount: Number(item.discount_amount || 0),
            notes: item.notes || "",
          };
        })
        .filter(Boolean);
    },

    pendingTabItemsCount: (state) => {
      if (!state.activeTabId) return 0;
      return state.items.reduce((sum, item) => {
        const diff = Number(item.quantity || 0) - Number(item.originalQty || 0);
        return sum + (diff > 0 ? diff : 0);
      }, 0);
    },

    pendingTabAddedAmount: (state) => {
      if (!state.activeTabId) return 0;
      return state.items.reduce((sum, item) => {
        const diff = Number(item.quantity || 0) - Number(item.originalQty || 0);
        if (diff <= 0) return sum;
        return sum + diff * Number(item.unit_price || 0);
      }, 0);
    },

    activeTabBalanceDue: (state) => {
      if (!state.activeTab) return 0;
      const baseBalance = Number(state.activeTab.balance_due ?? 0);
      const added = state.items.reduce((sum, item) => {
        const diff = Number(item.quantity || 0) - Number(item.originalQty || 0);
        return sum + (diff > 0 ? diff * Number(item.unit_price || 0) : 0);
      }, 0);
      return Math.max(0, Math.round((baseBalance + added) * 100) / 100);
    },

    subtotal: (state) => {
      return state.items.reduce((sum, item) => {
        return sum + item.quantity * item.unit_price;
      }, 0);
    },

    itemDiscountsTotal: (state) => {
      return state.items.reduce((sum, item) => {
        return sum + Number(item.discount_amount || 0);
      }, 0);
    },

    totalDiscount: (state) => {
      return Math.round((state.itemDiscountsTotal + Number(state.discountAmount || 0)) * 100) / 100;
    },

    taxAmount: (state) => {
      return state.items.reduce((sum, item) => {
        const lineNet = item.quantity * item.unit_price - (item.discount_amount || 0);
        const rate = item.tax_rate || 0;
        return sum + lineNet * (rate / 100);
      }, 0);
    },

    totalAmount: (state) => {
      const net =
        state.subtotal -
        state.itemDiscountsTotal -
        Number(state.discountAmount || 0) +
        state.taxAmount +
        state.deliveryFee;
      return Math.max(0, Math.round(net * 100) / 100);
    },

    getItemQuantity: (state) => (productId) => {
      const item = state.items.find((i) => i.id === productId);
      return item ? item.quantity : 0;
    },
  },

  actions: {
    addItem(product, qty = 1) {
      const existing = this.items.find((i) => i.id === product.id);
      if (existing) {
        existing.quantity += qty;
      } else {
        this.items.push({
          id: product.id,
          product: {
            id: product.id,
            name: product.name || product.productname,
            sku: product.sku,
            barcode: product.barcode,
            image_url: product.image_url || product.image,
            selling_price: Number(product.selling_price || product.sellingPrice || 0),
            stock: Number(product.stock_on_hand ?? product.branch_stock ?? product.total_stock ?? product.stockLevel ?? 0),
            size_label: product.size_label || product.unit || '',
            allow_discount: product.allow_discount ?? true,
            max_discount_without_approval_type: product.max_discount_without_approval_type || 'percent',
            max_discount_without_approval_value:
              product.max_discount_without_approval_value != null
                ? Number(product.max_discount_without_approval_value)
                : null,
          },
          unit_price: Number(product.selling_price || product.sellingPrice || 0),
          quantity: qty,
          tax_rate: Number(product.tax_rate || 0),
          discount_amount: 0,
          discount_type: null,
          discount_value: 0,
          discount_reason: "",
          discount_approval_request_id: null,
          discount_approval_token: null,
          discount_approved_by: null,
          notes: "",
        });
      }
    },

    setItemDiscount(productId, details) {
      const item = this.items.find((i) => i.id === productId);
      if (!item) return;
      const lineSub = item.quantity * item.unit_price;
      const clamped = Math.max(0, Math.min(lineSub, Number(details.discount_amount || 0)));
      item.discount_amount = Math.round(clamped * 100) / 100;
      item.discount_type = details.discount_type || "fixed";
      item.discount_value = Number(details.discount_value || clamped);
      item.discount_reason = details.discount_reason || "";
      item.discount_approval_request_id = details.discount_approval_request_id || null;
      item.discount_approval_token = details.discount_approval_token || null;
      item.discount_approved_by = details.discount_approved_by || null;
      const noteBits = [];
      if (item.discount_reason) noteBits.push(`Discount: ${item.discount_reason}`);
      if (item.discount_approved_by) noteBits.push(`Approved by: ${item.discount_approved_by}`);
      item.notes = noteBits.join(" | ");
    },

    clearItemDiscount(productId) {
      const item = this.items.find((i) => i.id === productId);
      if (!item) return;
      item.discount_amount = 0;
      item.discount_type = null;
      item.discount_value = 0;
      item.discount_reason = "";
      item.discount_approval_request_id = null;
      item.discount_approval_token = null;
      item.discount_approved_by = null;
      item.notes = "";
    },

    removeItem(productId) {
      const idx = this.items.findIndex((i) => i.id === productId);
      if (idx !== -1) {
        if (this.activeTabId && Number(this.items[idx].originalQty || 0) > 0) {
          return; // Cannot remove items already committed to an open tab
        }
        this.items.splice(idx, 1);
      }
    },

    increaseQty(productId) {
      const item = this.items.find((i) => i.id === productId);
      if (item) {
        item.quantity += 1;
      }
    },

    decreaseQty(productId) {
      const item = this.items.find((i) => i.id === productId);
      if (item) {
        const floor = this.activeTabId ? Number(item.originalQty || 0) : 0;
        if (floor > 0 && item.quantity <= floor) {
          return; // Cannot drop below original tab quantity
        }
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else if (floor === 0) {
          this.removeItem(productId);
        }
      }
    },

    setQuantity(productId, qty) {
      const item = this.items.find((i) => i.id === productId);
      if (item) {
        if (qty <= 0) {
          this.removeItem(productId);
        } else {
          item.quantity = qty;
        }
      }
    },

    setCustomer(customer) {
      this.customer = customer && customer.id ? customer : { ...WALK_IN_CUSTOMER };
    },

    clearCustomer() {
      this.customer = { ...WALK_IN_CUSTOMER };
    },

    setTable(table) {
      this.table = table;
      if (table) {
        this.fulfilmentMethod = "dine_in";
      }
    },

    clearTable() {
      this.table = null;
    },

    loadTab(tab) {
      this.activeTabId = tab.id;
      this.activeTab = { ...tab };
      this.activeTabs = [{ ...tab }];
      const activeItems = (tab.items || []).filter((i) => i.status !== "voided");
      const grouped = groupTabItems(activeItems);

      this.items = grouped.map((item) => {
        const qty = Number(item.quantity || 1);
        const prodId = item.product_id || item.product?.id || item.id;
        return {
          id: prodId,
          pack_id: item.pack_id ?? null,
          product: {
            id: prodId,
            name: item.item_name || item.product?.name || "Item",
            sku: item.sku || item.product?.sku,
            image_url: item.product?.image_url || item.image_url || null,
            size_label: item.product?.size_label || "",
            selling_price: Number(item.unit_price || 0),
            stock: item.product?.stock_on_hand ?? 999,
          },
          unit_price: Number(item.unit_price || 0),
          quantity: qty,
          originalQty: qty,
          tax_rate: Number(item.tax_rate || 0),
          discount_amount: Number(item.discount_amount || 0),
          notes: item.notes || "",
        };
      });
      this.customer = tab.customer ? {
        id: tab.customer.id,
        name: `${tab.customer.first_name || ''} ${tab.customer.last_name || ''}`.trim() || tab.customer.name,
        phone: tab.customer.phone,
        email: tab.customer.email || '',
        loyalty_tier: tab.customer.loyalty_tier || 'Silver',
        loyalty_points: tab.customer.loyalty_points_balance || tab.customer.loyalty_points || 0,
        risk_tier: tab.customer.effective_risk_tier || tab.customer.risk_tier || 'new',
        effective_risk_tier: tab.customer.effective_risk_tier || tab.customer.risk_tier || 'new',
        open_tabs_count: Number(tab.customer.open_tabs_count || 0),
        overdue_tabs_count: Number(tab.customer.overdue_tabs_count || 0),
        active_tab_balance: Number(tab.customer.active_tab_balance || 0),
      } : { ...WALK_IN_CUSTOMER };
      this.table = tab.table ? {
        id: tab.table.id,
        table_number: tab.table.table_number,
        label: tab.table.label,
      } : null;
      this.discountAmount = Number(tab.discount_amount || 0);
      this.deliveryFee = Number(tab.delivery_fee || 0);
      this.notes = tab.notes || "";
      if (this.table) {
        this.fulfilmentMethod = "dine_in";
      }
    },

    /**
     * Load 2+ Open Tabs together for Joint Multi-Tab Settlement.
     * Combines all active items, preserves each tab's metadata, and links the common customer.
     */
    loadMultipleTabs(tabsList = []) {
      const validTabs = (tabsList || []).filter((t) => t && t.id);
      if (validTabs.length === 0) return;
      if (validTabs.length === 1) {
        this.loadTab(validTabs[0]);
        return;
      }

      // Sort oldest-first (FIFO)
      const sorted = [...validTabs].sort(
        (a, b) => new Date(a.opened_at || a.created_at || 0) - new Date(b.opened_at || b.created_at || 0)
      );

      const combinedTotal = Math.round(
        sorted.reduce((sum, t) => sum + Number(t.total_amount ?? 0), 0) * 100
      ) / 100;
      const combinedBalance = Math.round(
        sorted.reduce((sum, t) => sum + Number(t.balance_due ?? t.total_amount ?? 0), 0) * 100
      ) / 100;
      const combinedPaid = Math.round(
        Math.max(
          sorted.reduce((sum, t) => sum + Number(t.paid_amount ?? 0), 0),
          Math.max(0, combinedTotal - combinedBalance)
        ) * 100
      ) / 100;

      this.activeTabs = sorted.map((t) => ({ ...t }));
      this.activeTabId = sorted[0].id;
      this.activeTab = {
        ...sorted[0],
        tab_number: `${sorted.length} Tabs`,
        name: sorted.map((t) => t.tab_number || t.name).join(", "),
        paid_amount: combinedPaid,
        balance_due: combinedBalance,
        total_amount: combinedTotal,
      };

      // Flatten all active items across all selected tabs, then group identical products cleanly
      const combinedRawItems = [];
      for (const tab of sorted) {
        const activeItems = (tab.items || []).filter((i) => i.status !== "voided");
        for (const it of activeItems) {
          combinedRawItems.push(it);
        }
      }

      const grouped = groupTabItems(combinedRawItems);
      this.items = grouped.map((item) => {
        const qty = Number(item.quantity || 1);
        const prodId = item.product_id || item.product?.id || item.id;
        return {
          id: prodId,
          pack_id: item.pack_id ?? null,
          product: {
            id: prodId,
            name: item.item_name || item.product?.name || "Item",
            sku: item.sku || item.product?.sku,
            image_url: item.product?.image_url || item.image_url || null,
            size_label: item.product?.size_label || "",
            selling_price: Number(item.unit_price || 0),
            stock: item.product?.stock_on_hand ?? 999,
          },
          unit_price: Number(item.unit_price || 0),
          quantity: qty,
          originalQty: qty,
          tax_rate: Number(item.tax_rate || 0),
          discount_amount: Number(item.discount_amount || 0),
          notes: item.notes || "",
        };
      });

      const firstCustTab = sorted.find((t) => t.customer?.id);
      this.customer = firstCustTab?.customer ? {
        id: firstCustTab.customer.id,
        name: `${firstCustTab.customer.first_name || ''} ${firstCustTab.customer.last_name || ''}`.trim() || firstCustTab.customer.name,
        phone: firstCustTab.customer.phone,
        email: firstCustTab.customer.email || '',
        loyalty_tier: firstCustTab.customer.loyalty_tier || 'Silver',
        loyalty_points: firstCustTab.customer.loyalty_points_balance || firstCustTab.customer.loyalty_points || 0,
        risk_tier: firstCustTab.customer.effective_risk_tier || firstCustTab.customer.risk_tier || 'new',
        effective_risk_tier: firstCustTab.customer.effective_risk_tier || firstCustTab.customer.risk_tier || 'new',
        open_tabs_count: Number(firstCustTab.customer.open_tabs_count || 0),
        overdue_tabs_count: Number(firstCustTab.customer.overdue_tabs_count || 0),
        active_tab_balance: Number(firstCustTab.customer.active_tab_balance || 0),
      } : { ...WALK_IN_CUSTOMER };

      const firstTableTab = sorted.find((t) => t.table?.id);
      this.table = firstTableTab?.table ? {
        id: firstTableTab.table.id,
        table_number: firstTableTab.table.table_number,
        label: firstTableTab.table.label,
      } : null;

      this.discountAmount = sorted.reduce((sum, t) => sum + Number(t.discount_amount || 0), 0);
      this.deliveryFee = sorted.reduce((sum, t) => sum + Number(t.delivery_fee || 0), 0);
      this.notes = "";
      this.fulfilmentMethod = this.table ? "dine_in" : "takeaway";
    },

    addTabToJoint(tab) {
      if (!tab?.id) return;
      const existingTabs = Array.isArray(this.activeTabs) && this.activeTabs.length > 0
        ? [...this.activeTabs]
        : this.activeTab
        ? [{ ...this.activeTab }]
        : [];
      if (existingTabs.some((t) => t.id === tab.id)) return;
      this.loadMultipleTabs([...existingTabs, { ...tab }]);
    },

    removeTabFromJoint(tabId) {
      const existingTabs = Array.isArray(this.activeTabs) ? this.activeTabs : [];
      const remaining = existingTabs.filter((t) => t.id !== tabId);
      if (remaining.length >= 2) {
        this.loadMultipleTabs(remaining);
      } else if (remaining.length === 1) {
        this.loadTab(remaining[0]);
      } else {
        this.clearCart();
      }
    },

    setDiscount(amount) {
      this.discountAmount = Math.max(0, Number(amount) || 0);
    },

    setDeliveryFee(fee) {
      this.deliveryFee = Math.max(0, Number(fee) || 0);
    },

    setFulfilmentMethod(method) {
      this.fulfilmentMethod = method;
    },

    clearCart() {
      this.items = [];
      this.customer = { ...WALK_IN_CUSTOMER };
      this.table = null;
      this.activeTabId = null;
      this.activeTab = null;
      this.activeTabs = [];
      this.discountAmount = 0;
      this.deliveryFee = 0;
      this.notes = "";
      this.fulfilmentMethod = "takeaway";
    },
  },
});
