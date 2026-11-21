import { computed } from 'vue';

export const defaultInvoiceItems = [
    {
        id: 1,
        name: 'Enterprise Cloud POS Subscription',
        description: 'Monthly seat tier with dedicated cloud sync node',
        qty: 1,
        price: 10000,
    },
    {
        id: 2,
        name: 'Fiscal Device Integration (TIMS / eTIMS)',
        description: 'Standard KRA compliance API gateway license',
        qty: 1,
        price: 2500,
    },
    {
        id: 3,
        name: 'Thermal Receipt Rolls & Accessories',
        description: '80mm BPA-free high density rolls (Box of 50)',
        qty: 2,
        price: 1200,
    },
];

export const invoicePropsDeclaration = {
    business: {
        type: Object,
        default: () => ({}),
    },
    items: {
        type: Array,
        default: () => null,
    },
    businessName: { type: String, default: '' },
    logo: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    kraPin: { type: String, default: '' },
    primaryColor: { type: String, default: '' },
    invoiceNumber: { type: String, default: '' },
    invoiceDate: { type: String, default: '' },
    dueDate: { type: String, default: '' },
    clientName: { type: String, default: '' },
    clientAddress: { type: String, default: '' },
    terms: { type: String, default: '' },
    paymentTerms: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    mpesaPaybill: { type: String, default: '' },
    mpesaAccount: { type: String, default: '' },
    showBank: { type: Boolean, default: undefined },
};

export function useInvoiceData(props) {
    const bName = computed(() => {
        return props.businessName || props.business?.name || 'YOUR BUSINESS NAME';
    });

    const bLogo = computed(() => {
        return (
            props.logo ||
            props.business?.branding?.logo_url ||
            props.business?.logo_url ||
            props.business?.logo ||
            ''
        );
    });

    const bAddress = computed(() => {
        return (
            props.address ||
            props.business?.address_line ||
            'Main Headquarters, Nairobi, Kenya'
        );
    });

    const bPhone = computed(() => {
        return props.phone || props.business?.phone || '+254 700 000 000';
    });

    const bEmail = computed(() => {
        return props.email || props.business?.email || 'billing@business.co.ke';
    });

    const bKraPin = computed(() => {
        return props.kraPin || props.business?.kra_pin || '';
    });

    const bPrimaryColor = computed(() => {
        return (
            props.primaryColor ||
            props.business?.primary_color ||
            '#2b59ff'
        );
    });

    const bInvoiceNo = computed(() => {
        if (props.invoiceNumber) return props.invoiceNumber;
        const prefix = props.business?.invoice_prefix || 'INV-';
        return `${prefix}2026-0042`;
    });

    const bDate = computed(() => {
        return props.invoiceDate || '20 Nov 2026';
    });

    const bDueDate = computed(() => {
        return props.dueDate || '04 Dec 2026';
    });

    const bClientName = computed(() => {
        return props.clientName || 'Acme Global Distributors Ltd';
    });

    const bClientAddress = computed(() => {
        return (
            props.clientAddress ||
            'P.O. Box 7890-00100, Westlands, Nairobi'
        );
    });

    const bTerms = computed(() => {
        return (
            props.terms ||
            props.business?.invoice_terms ||
            'Payment is due within agreed terms. Direct bank transfer is preferred.'
        );
    });

    const bPaymentTerms = computed(() => {
        return (
            props.paymentTerms ||
            props.business?.invoice_payment_terms ||
            'Due on Receipt'
        );
    });

    const bBankName = computed(() => {
        return props.bankName || props.business?.bank_name || '';
    });

    const bBankAccount = computed(() => {
        return props.bankAccount || props.business?.bank_account_no || '';
    });

    const bMpesaPaybill = computed(() => {
        return props.mpesaPaybill || props.business?.mpesa_paybill || '';
    });

    const bMpesaAccount = computed(() => {
        return (
            props.mpesaAccount ||
            props.business?.mpesa_account_no ||
            bInvoiceNo.value
        );
    });

    const bShowBank = computed(() => {
        if (props.showBank !== undefined) return props.showBank;
        if (props.business?.invoice_show_bank !== undefined)
            return Boolean(props.business.invoice_show_bank);
        return true;
    });

    const bItems = computed(() => {
        if (props.items && props.items.length) {
            return props.items.map((it, idx) => ({
                id: it.id || idx + 1,
                name: it.name || it.description || `Item #${idx + 1}`,
                description: it.description || '',
                qty: Number(it.qty || it.quantity || 1),
                price: Number(it.price || it.unitPrice || 0),
            }));
        }
        if (props.business?.items && props.business.items.length) {
            return props.business.items;
        }
        return defaultInvoiceItems;
    });

    const subtotal = computed(() => {
        return bItems.value.reduce(
            (sum, item) => sum + (item.qty * item.price),
            0
        );
    });

    const taxAmount = computed(() => {
        return subtotal.value * 0.16;
    });

    const grandTotal = computed(() => {
        return subtotal.value + taxAmount.value;
    });

    function formatMoney(amount) {
        const num = Number(amount || 0);
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    return {
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
        formatMoney,
    };
}
