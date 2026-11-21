<template>
    <div class="bill-container">
        <button class="print-btn d-none" @click="handlePrint">
            <i class="ri-printer-line"></i>
        </button>

        <div class="page">
            <div class="page-content p-5">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-start pb-4 border-bottom mb-4">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <img v-if="bLogo" :src="bLogo" alt="Logo" class="img-fluid" style="max-height: 52px;" />
                            <h3 class="fw-bold text-dark mb-0">{{ bName }}</h3>
                        </div>
                        <div class="text-muted font-size-12">Phone: {{ bPhone }} | Email: {{ bEmail }}</div>
                    </div>
                    <div class="text-end font-size-13">
                        <h2 class="fw-bold text-uppercase tracking-wider mb-1" :style="{ color: bPrimaryColor }">INVOICE</h2>
                        <div><strong>Invoice #:</strong> <span class="font-monospace fw-semibold">{{ bInvoiceNo }}</span></div>
                        <div><strong>Date:</strong> {{ bDate }}</div>
                        <div class="text-muted mt-1">Invoice To: <strong>{{ bClientName }}</strong></div>
                    </div>
                </div>

                <!-- Scope / Itemized Table -->
                <table class="table table-bordered font-size-13 mb-4">
                    <thead class="bg-light">
                        <tr>
                            <th style="width: 8%;">SL.</th>
                            <th style="width: 67%;">ITEM / SCOPE OF WORK</th>
                            <th class="text-end" style="width: 25%;">PRICE</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, idx) in bItems" :key="idx">
                            <td class="fw-bold">{{ idx + 1 }}</td>
                            <td>
                                <div class="fw-bold text-dark">{{ item.name }}</div>
                                <div class="text-muted font-size-12">{{ item.description }}</div>
                            </td>
                            <td class="text-end fw-bold">KES {{ formatMoney(item.qty * item.price) }}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Bottom Summary, SBM Bank & Point to Note -->
                <div class="row pt-2">
                    <div class="col-7 font-size-12">
                        <div class="p-3 bg-light rounded border mb-2">
                            <div class="fw-bold text-dark mb-1">Payment Info:</div>
                            <div><strong>Bank:</strong> {{ bBankName || 'SBM Bank Kenya Ltd' }}</div>
                            <div><strong>KES Acc No:</strong> {{ bBankAccount || '0302400076001' }}</div>
                            <div><strong>USD Acc No:</strong> 0302400076002</div>
                            <div v-if="bMpesaPaybill" class="mt-1">
                                <strong>M-Pesa Paybill:</strong> {{ bMpesaPaybill }} | <strong>Account:</strong> {{ bMpesaAccount }}
                            </div>
                        </div>
                        <div class="p-2 border rounded text-muted font-size-11">
                            <strong>Point To Note:</strong> {{ bTerms }}
                        </div>
                    </div>
                    <div class="col-5">
                        <div class="d-flex justify-content-between font-size-13 text-muted mb-2">
                            <span>Sub Total:</span>
                            <span>{{ 'KES ' + formatMoney(subtotal) }}</span>
                        </div>
                        <div class="d-flex justify-content-between font-size-18 fw-bold text-white p-3 rounded"
                            :style="{ backgroundColor: bPrimaryColor }">
                            <span>Total:</span>
                            <span>{{ 'KES ' + formatMoney(grandTotal) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { invoicePropsDeclaration, useInvoiceData } from '@/components/Invoices/useInvoiceData';

const props = defineProps(invoicePropsDeclaration);

const {
    bName,
    bLogo,
    bAddress,
    bPhone,
    bEmail,
    bKraPin,
    bPrimaryColor,
    bInvoiceNo,
    bDate,
    bDueDate,
    bClientName,
    bClientAddress,
    bTerms,
    bPaymentTerms,
    bBankName,
    bBankAccount,
    bMpesaPaybill,
    bMpesaAccount,
    bShowBank,
    bItems,
    subtotal,
    taxAmount,
    grandTotal,
    formatMoney
} = useInvoiceData(props);

function handlePrint() {
    window.print();
}
</script>

<style scoped>
.page {
    width: 210mm;
    min-height: 297mm;
    background: #fff;
    margin: 0 auto;
}
@media print {
    .print-btn {
        display: none;
    }
    .page {
        margin: 0;
        box-shadow: none;
    }
}
</style>
