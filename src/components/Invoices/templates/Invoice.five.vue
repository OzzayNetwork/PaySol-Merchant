<template>
    <div class="bill-container">
        <button class="print-btn d-none" @click="handlePrint">
            <i class="ri-printer-line"></i>
        </button>

        <div class="page">
            <div class="page-content p-5">
                <!-- Header: Branding & Solid INVOICE Banner -->
                <div class="d-flex justify-content-between align-items-stretch pb-4 mb-4">
                    <div class="d-flex flex-column justify-content-center" style="max-width: 60%;">
                        <div class="d-flex align-items-center gap-3 mb-2">
                            <img v-if="bLogo" :src="bLogo" alt="Logo" class="img-fluid" style="max-height: 58px;" />
                            <div v-else class="rounded-circle border p-2 bg-light text-primary d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                                <i class="ri-building-2-line fs-3"></i>
                            </div>
                            <div class="border-start ps-3 py-1">
                                <i class="ri-shield-check-line fs-2 text-danger"></i>
                            </div>
                        </div>
                        <h4 class="fw-bold text-uppercase mb-1" style="color: #0b2545;">{{ bName }}</h4>
                        <div class="font-size-12 text-muted">{{ bAddress }}</div>
                        <div class="font-size-12 text-muted">Tel: {{ bPhone }}</div>
                    </div>

                    <div class="d-flex align-items-center justify-content-center px-5 py-3 text-white rounded-1"
                        :style="{ backgroundColor: bPrimaryColor, minWidth: '240px' }">
                        <h1 class="fw-bold tracking-widest text-white mb-0" style="letter-spacing: 4px;">INVOICE</h1>
                    </div>
                </div>

                <!-- Meta Details Block -->
                <div class="d-flex justify-content-end mb-4 font-size-13">
                    <div style="min-width: 320px;">
                        <div class="d-flex justify-content-between py-1 border-bottom">
                            <strong class="text-dark">INVOICE NO. :</strong>
                            <span class="font-monospace fw-semibold">{{ bInvoiceNo }}</span>
                        </div>
                        <div class="d-flex justify-content-between py-1 border-bottom">
                            <strong class="text-dark">INVOICE TO :</strong>
                            <span>{{ bClientName }}</span>
                        </div>
                        <div class="d-flex justify-content-between py-1">
                            <strong class="text-dark">DATE :</strong>
                            <span>{{ bDate }}</span>
                        </div>
                    </div>
                </div>

                <!-- Items Table -->
                <table class="table font-size-13 mb-4 border-0">
                    <thead style="background-color: #f1f5f9; color: #0b2545;">
                        <tr class="fw-bold">
                            <th style="width: 8%;">#</th>
                            <th style="width: 47%;">ACCOUNT</th>
                            <th class="text-end" style="width: 15%;">UNIT PRICE</th>
                            <th class="text-center" style="width: 15%;">QTY</th>
                            <th class="text-end" style="width: 15%;">PRICE</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, idx) in bItems" :key="idx">
                            <td class="fw-bold">{{ idx + 1 }}.</td>
                            <td>{{ item.name }}</td>
                            <td class="text-end">KES {{ formatMoney(item.price) }}</td>
                            <td class="text-center">{{ item.qty }}</td>
                            <td class="text-end fw-semibold">KES {{ formatMoney(item.qty * item.price) }}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- High-contrast Total Banner -->
                <div class="d-flex justify-content-end mb-5">
                    <div class="d-flex justify-content-between align-items-center px-4 py-2 text-white rounded-1"
                        :style="{ backgroundColor: bPrimaryColor, width: '340px' }">
                        <span class="font-size-16 fw-semibold">Total</span>
                        <span class="font-size-20 fw-bold">{{ 'KES ' + formatMoney(grandTotal) }}</span>
                    </div>
                </div>

                <!-- Payment Info Block -->
                <div class="pt-3 border-top font-size-12">
                    <h6 class="fw-bold text-dark mb-2 font-size-14">Payment Info:</h6>
                    <div class="mb-1"><strong>{{ bBankName || 'National Bank of Kenya' }}</strong> A/C No: {{ bBankAccount || '5553673877644' }}</div>
                    <div><strong>M-Pesa Paybill No:</strong> {{ bMpesaPaybill || '4093833' }} : <strong>Account No:</strong> {{ bMpesaAccount }}</div>
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
