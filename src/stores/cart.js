import { defineStore } from "pinia";

/**
 * POS Cart Pinia Store (22 Nov 2026).
 *
 * Guarantees cart state persistence across customer selection,
 * modal dialogs, shift opening, and view switching.
 */
export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [], // Array of { id, product, quantity, unit_price, tax_rate, discount_amount, notes }
    customer: null, // Selected customer { id, name, phone, loyalty_points, etc. }
    table: null, // Selected restaurant/hospitality table { id, table_number, label }
    activeTabId: null, // If working on an existing open tab
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

    subtotal: (state) => {
      return state.items.reduce((sum, item) => {
        return sum + item.quantity * item.unit_price;
      }, 0);
    },

    taxAmount: (state) => {
      return state.items.reduce((sum, item) => {
        const lineNet = item.quantity * item.unit_price - (item.discount_amount || 0);
        const rate = item.tax_rate || 0;
        return sum + lineNet * (rate / 100);
      }, 0);
    },

    totalAmount: (state) => {
      const net = state.subtotal - state.discountAmount + state.taxAmount + state.deliveryFee;
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
          },
          unit_price: Number(product.selling_price || product.sellingPrice || 0),
          quantity: qty,
          tax_rate: Number(product.tax_rate || 0),
          discount_amount: 0,
          notes: "",
        });
      }
    },

    removeItem(productId) {
      const idx = this.items.findIndex((i) => i.id === productId);
      if (idx !== -1) {
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
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
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
      this.customer = customer;
    },

    clearCustomer() {
      this.customer = null;
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
      this.items = (tab.items || []).filter((i) => i.status !== "voided").map((item) => ({
        id: item.product_id || item.product?.id || item.id,
        product: {
          id: item.product_id || item.product?.id || item.id,
          name: item.item_name || item.product?.name,
          sku: item.sku || item.product?.sku,
          selling_price: Number(item.unit_price || 0),
          stock: item.product?.stock_on_hand ?? 999,
        },
        unit_price: Number(item.unit_price || 0),
        quantity: Number(item.quantity || 1),
        tax_rate: Number(item.tax_rate || 0),
        discount_amount: Number(item.discount_amount || 0),
        notes: item.notes || "",
      }));
      this.customer = tab.customer ? {
        id: tab.customer.id,
        name: `${tab.customer.first_name || ''} ${tab.customer.last_name || ''}`.trim() || tab.customer.name,
        phone: tab.customer.phone,
        loyalty_points: tab.customer.loyalty_points_balance || tab.customer.loyalty_points || 0,
      } : null;
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
      this.customer = null;
      this.table = null;
      this.activeTabId = null;
      this.discountAmount = 0;
      this.deliveryFee = 0;
      this.notes = "";
      this.fulfilmentMethod = "takeaway";
    },
  },
});
