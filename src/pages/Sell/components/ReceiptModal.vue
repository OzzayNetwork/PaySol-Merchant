<template>
  <div
    class="modal fade"
    id="receiptModal"
    tabindex="-1"
    aria-labelledby="receiptModalLabel"
    aria-hidden="true"
    ref="modalRef"
    data-bs-backdrop="static"
  >
    <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
      <div class="modal-content flat-card border" style="border-radius: 8px;">
        <div class="modal-header border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <div class="tone-chip tone-chip-emerald">
              <i class="ri-check-line fs-5"></i>
            </div>
            <div>
              <h5 class="modal-title font-size-16 fw-bold mb-0" id="receiptModalLabel">Sale Completed</h5>
              <small class="text-muted">Transaction recorded & inventory updated</small>
            </div>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body p-4" id="printableReceiptArea">
          <!-- Receipt Paper Look -->
          <div class="p-3 bg-light rounded border text-center font-monospace font-size-13 text-dark">
            <!-- Header -->
            <h5 class="fw-bold mb-1 text-uppercase">{{ tenantName || 'PaySol Retail' }}</h5>
            <div class="text-muted font-size-11 mb-2">
              {{ order?.branch?.name || 'Main Branch' }}
            </div>
            <div class="border-top border-bottom border-dark-subtle py-1 my-2 text-start font-size-11">
              <div class="d-flex justify-content-between">
                <span>Receipt: <strong>{{ order?.order_number }}</strong></span>
                <span>{{ formatDate(order?.created_at) }}</span>
              </div>
              <div class="d-flex justify-content-between mt-1">
                <span>Cashier: {{ order?.cashier?.name || 'Staff' }}</span>
                <span>Shift: {{ order?.shift?.shift_number || '-' }}</span>
              </div>
              <div v-if="order?.customer" class="d-flex justify-content-between mt-1">
                <span>Customer: {{ order?.customer?.name }}</span>
                <span>Pts: {{ order?.customer?.loyalty_points }}</span>
              </div>
            </div>

            <!-- Items -->
            <div class="py-2 text-start border-bottom border-dark-subtle">
              <div v-for="item in order?.items" :key="item.id" class="d-flex justify-content-between mb-1">
                <div class="text-truncate me-2" style="max-width: 240px;">
                  <span>{{ item.product_name }}</span><br />
                  <small class="text-muted">{{ item.quantity }} x {{ formatMoney(item.unit_price) }}</small>
                </div>
                <div class="fw-semibold">{{ formatMoney(item.total) }}</div>
              </div>
            </div>

            <!-- Financials -->
            <div class="py-2 text-start border-bottom border-dark-subtle font-size-12">
              <div class="d-flex justify-content-between mb-1">
                <span>Subtotal</span>
                <span>{{ formatMoney(order?.subtotal) }}</span>
              </div>
              <div v-if="order?.discount_amount > 0" class="d-flex justify-content-between mb-1 text-danger">
                <span>Discount</span>
                <span>-{{ formatMoney(order?.discount_amount) }}</span>
              </div>
              <div v-if="order?.tax_amount > 0" class="d-flex justify-content-between mb-1">
                <span>VAT / Tax</span>
                <span>{{ formatMoney(order?.tax_amount) }}</span>
              </div>
              <div class="d-flex justify-content-between fw-bold font-size-15 mt-2 pt-1 border-top border-dark-subtle">
                <span>TOTAL</span>
                <span>{{ formatMoney(order?.total_amount) }}</span>
              </div>
            </div>

            <!-- Payments -->
            <div class="py-2 text-start border-bottom border-dark-subtle font-size-11">
              <div v-for="p in order?.payments" :key="p.id" class="mb-1">
                <div class="d-flex justify-content-between">
                  <span class="text-uppercase fw-semibold">{{ p.method }}</span>
                  <span class="fw-bold">{{ formatMoney(p.amount) }}</span>
                </div>
                <div v-if="p.external_reference" class="text-muted">
                  Ref: {{ p.external_reference }}
                </div>
                <div v-if="p.method === 'cash' && p.change_amount > 0" class="d-flex justify-content-between text-muted mt-1">
                  <span>Change Given</span>
                  <span>{{ formatMoney(p.change_amount) }}</span>
                </div>
              </div>
            </div>

            <div class="mt-3 text-muted font-size-11">
              Thank you for your business!<br />
              Powered by PaySol POS
            </div>
          </div>
        </div>

        <div class="modal-footer border-top px-4 py-3 d-flex justify-content-between">
          <button type="button" class="btn btn-white d-inline-flex align-items-center gap-1" @click="printReceipt">
            <i class="ri-printer-line"></i>
            <span>Print Receipt</span>
          </button>
          <button type="button" class="btn btn-primary d-inline-flex align-items-center gap-1" @click="handleNewSale">
            <i class="ri-add-line"></i>
            <span>New Sale</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  order: { type: Object, default: null },
});

const emit = defineEmits(['new-sale']);

const modalRef = ref(null);
const authStore = useAuthStore();

const tenantName = computed(() => {
  return authStore.activeBusiness?.name || authStore.tenant?.name || 'PaySol Retail';
});

const formatMoney = (val) => {
  return Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'KES' });
};

const formatDate = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' });
};

const printReceipt = () => {
  const content = document.getElementById('printableReceiptArea');
  if (!content) return;

  const printWindow = window.open('', '_blank', 'width=400,height=600');
  printWindow.document.write(`
    <html>
      <head>
        <title>Receipt - ${props.order?.order_number || ''}</title>
        <style>
          body { font-family: monospace; font-size: 12px; margin: 20px; line-height: 1.4; color: #000; }
          .text-center { text-align: center; }
          .text-start { text-align: left; }
          .d-flex { display: flex; justify-content: space-between; }
          .fw-bold { font-weight: bold; }
          .border-top { border-top: 1px dashed #333; }
          .border-bottom { border-bottom: 1px dashed #333; }
          .py-1 { padding-top: 4px; padding-bottom: 4px; }
          .my-2 { margin-top: 8px; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

const handleNewSale = () => {
  if (window.bootstrap && modalRef.value) {
    const modal = window.bootstrap.Modal.getInstance(modalRef.value);
    if (modal) modal.hide();
  }
  emit('new-sale');
};
</script>
