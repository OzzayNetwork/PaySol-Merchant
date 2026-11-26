<template>
    <div
        v-if="open && tab"
        class="modal fade show d-block"
        tabindex="-1"
        style="background-color: rgba(15, 23, 42, 0.55); z-index: 1058;"
        @click.self="handleClose"
    >
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 600px;">
            <div class="modal-content border-0 rounded-3 overflow-hidden shadow">
                <!-- Header -->
                <div class="modal-header bg-white split-modal-divider py-3 px-4">
                    <div class="d-flex align-items-center gap-3 min-w-0">
                        <div
                            class="d-flex align-items-center justify-content-center rounded-2 bg-primary-subtle text-primary border border-primary-subtle flex-shrink-0"
                            style="width: 38px; height: 38px;"
                        >
                            <Icon icon="ri:git-branch-line" class="fs-5" />
                        </div>
                        <div class="min-w-0">
                            <h5 class="modal-title font-size-16 fw-bold mb-0 text-dark">Split Bill</h5>
                            <div class="font-size-12 text-muted text-truncate mt-1">
                                <span class="font-monospace fw-semibold text-dark">{{ tab.tab_number }}</span>
                                <span class="mx-1">•</span>
                                <span>{{ tab.name || tab.customer?.name || "Open Tab" }}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="btn-close shadow-none"
                        :disabled="busy"
                        @click="handleClose"
                    ></button>
                </div>

                <!-- Body -->
                <div class="modal-body p-4 d-flex flex-column gap-3">
                    <!-- Error Banner -->
                    <div
                        v-if="errorMessage"
                        class="alert alert-danger py-2 px-3 mb-0 font-size-12 d-flex align-items-center gap-2"
                    >
                        <Icon icon="ri:error-warning-line" class="fs-5 flex-shrink-0" />
                        <span>{{ errorMessage }}</span>
                    </div>

                    <!-- Instruction + Quick Clear -->
                    <div class="d-flex align-items-center justify-content-between gap-2">
                        <span class="font-size-12 text-muted">
                            Pick the items (and quantities) to move onto a separate bill for payment.
                        </span>
                        <button
                            v-if="selectedCount > 0"
                            type="button"
                            class="btn btn-sm btn-link text-decoration-none p-0 font-size-12 flex-shrink-0"
                            :disabled="busy"
                            @click="clearSelection"
                        >
                            Clear
                        </button>
                    </div>

                    <!-- Selectable Items Table -->
                    <div class="table-responsive split-table-box">
                        <table class="table verticle-middle table-hover mb-0 doc-table">
                            <thead class="table-light text-nowrap">
                                <tr>
                                    <th style="width: 36px;"></th>
                                    <th>Item</th>
                                    <th class="text-center" style="width: 148px;">Split Qty</th>
                                    <th class="text-end" style="width: 118px;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="item in activeItems"
                                    :key="item.id"
                                    class="split-item-row"
                                    :class="{ 'is-selected': isSelected(item.id) }"
                                    @click="toggleItem(item)"
                                >
                                    <td class="text-center" @click.stop>
                                        <input
                                            type="checkbox"
                                            class="form-check-input mt-0"
                                            :checked="isSelected(item.id)"
                                            :disabled="busy"
                                            @change="toggleItem(item)"
                                        />
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center gap-2 min-w-0">
                                            <div class="split-thumb flex-shrink-0">
                                                <img
                                                    v-if="item.product?.image_url"
                                                    :src="item.product.image_url"
                                                    :alt="item.item_name"
                                                    class="w-100 h-100 object-fit-cover"
                                                />
                                                <i v-else class="bx bx-package text-muted fs-6"></i>
                                            </div>
                                            <div class="min-w-0">
                                                <div class="fw-semibold text-dark font-size-13 text-truncate">
                                                    {{ item.item_name || "Item" }}
                                                </div>
                                                <div class="font-size-11 text-muted split-num">
                                                    {{ formatKES(item.unit_price) }} × {{ formatQty(item.quantity) }}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="text-center" @click.stop>
                                        <div
                                            v-if="isSelected(item.id) && Number(item.quantity) > 1"
                                            class="d-inline-flex align-items-center justify-content-center gap-1"
                                        >
                                            <button
                                                type="button"
                                                class="split-qty-btn"
                                                :disabled="busy || getMoveQty(item.id) <= 1"
                                                @click="decrementQty(item)"
                                            >
                                                <i class="mdi mdi-minus font-size-12"></i>
                                            </button>
                                            <span class="split-qty-val split-num fw-bold text-primary">
                                                {{ formatQty(getMoveQty(item.id)) }}
                                                <span class="text-muted fw-normal font-size-11">/{{ formatQty(item.quantity) }}</span>
                                            </span>
                                            <button
                                                type="button"
                                                class="split-qty-btn"
                                                :disabled="busy || getMoveQty(item.id) >= Number(item.quantity)"
                                                @click="incrementQty(item)"
                                            >
                                                <i class="mdi mdi-plus font-size-12"></i>
                                            </button>
                                        </div>
                                        <span
                                            v-else-if="isSelected(item.id)"
                                            class="badge bg-primary-subtle text-primary font-size-11 fw-semibold split-num"
                                        >
                                            {{ formatQty(item.quantity) }} of {{ formatQty(item.quantity) }}
                                        </span>
                                        <span v-else class="text-muted font-size-12 split-num">
                                            —
                                        </span>
                                    </td>
                                    <td class="text-end fw-bold font-size-13 text-nowrap split-num">
                                        <span :class="isSelected(item.id) ? 'text-primary' : 'text-muted fw-normal'">
                                            {{ formatKES(isSelected(item.id) ? getMoveAmount(item) : item.total_amount) }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Full-selection guard -->
                    <div
                        v-if="isSelectingEverything"
                        class="d-flex align-items-center gap-2 px-3 py-2 rounded border border-warning-subtle bg-warning-subtle text-dark font-size-12"
                    >
                        <Icon icon="ri:error-warning-line" class="fs-5 text-warning flex-shrink-0" />
                        <span>Leave at least 1 item on the original tab — to pay the entire bill, use <strong>Record Payment</strong> directly.</span>
                    </div>

                    <!-- New Split Tab Name -->
                    <div>
                        <label class="form-label font-size-12 fw-semibold text-muted mb-1">
                            New Split Bill Name <span class="fw-normal">(Optional)</span>
                        </label>
                        <input
                            v-model="newTabName"
                            type="text"
                            class="form-control font-size-13"
                            maxlength="150"
                            :disabled="busy"
                            :placeholder="`Split - ${tab.name || tab.tab_number}`"
                        />
                    </div>

                    <!-- Live Split Summary Preview -->
                    <div class="row g-3">
                        <div class="col-sm-6">
                            <div class="p-3 split-summary-box h-100">
                                <div class="text-muted text-uppercase fw-semibold" style="font-size: 10px; letter-spacing: 0.4px;">
                                    Stays on {{ tab.tab_number }}
                                </div>
                                <div class="fw-bold text-dark font-size-16 mt-1 split-num">
                                    {{ formatKES(remainingAmount) }}
                                </div>
                                <div class="font-size-11 text-muted mt-1">
                                    {{ remainingQtyTotal }} item{{ remainingQtyTotal === 1 ? "" : "s" }} remaining
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div
                                class="p-3 split-summary-box h-100"
                                :class="{ 'split-summary-active': canSubmit }"
                            >
                                <div class="text-uppercase fw-semibold" :class="canSubmit ? 'text-primary' : 'text-muted'" style="font-size: 10px; letter-spacing: 0.4px;">
                                    New Split Bill (To Pay)
                                </div>
                                <div class="fw-bold font-size-16 mt-1 split-num" :class="canSubmit ? 'text-primary' : 'text-muted'">
                                    {{ formatKES(splitAmount) }}
                                </div>
                                <div class="font-size-11 text-muted mt-1">
                                    {{ selectedQtyTotal }} item{{ selectedQtyTotal === 1 ? "" : "s" }} selected
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="modal-footer bg-white split-modal-footer-divider py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <button
                        type="button"
                        class="btn btn-white"
                        :disabled="busy"
                        @click="handleClose"
                    >
                        Cancel
                    </button>

                    <div class="d-flex align-items-center gap-2 ms-auto">
                        <button
                            type="button"
                            class="btn btn-white d-inline-flex align-items-center justify-content-center gap-2"
                            :disabled="busy || !canSubmit"
                            @click="submitSplit(false)"
                        >
                            <span v-if="busy && submitMode === 'split'" class="spinner-border spinner-border-sm" role="status"></span>
                            <Icon v-else icon="ri:git-branch-line" class="fs-5" />
                            <span>{{ busy && submitMode === 'split' ? 'Splitting...' : 'Split Only' }}</span>
                        </button>

                        <button
                            type="button"
                            class="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2 fw-semibold"
                            :disabled="busy || !canSubmit"
                            @click="submitSplit(true)"
                        >
                            <span v-if="busy && submitMode === 'pay'" class="spinner-border spinner-border-sm" role="status"></span>
                            <Icon v-else icon="ri:money-dollar-circle-line" class="fs-5" />
                            <span>
                                {{ busy && submitMode === 'pay' ? 'Preparing Checkout...' : (canSubmit ? `Split & Pay (${formatKES(splitAmount)})` : 'Split & Pay') }}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { formatKES } from "@/utils/currency";

const props = defineProps({
    open: { type: Boolean, default: false },
    tab: { type: Object, default: null },
    busy: { type: Boolean, default: false },
    errorMessage: { type: String, default: "" },
});

const emit = defineEmits(["close", "confirm"]);

// Map of itemId -> quantity to move (0 / absent means not selected)
const selectedQuantities = reactive({});
const newTabName = ref("");
const submitMode = ref(null); // 'split' | 'pay'

const activeItems = computed(() =>
    (props.tab?.items || []).filter((i) => String(i.status || "").toLowerCase() !== "voided")
);

function resetState() {
    Object.keys(selectedQuantities).forEach((k) => delete selectedQuantities[k]);
    newTabName.value = props.tab ? `Split - ${props.tab.name || props.tab.tab_number}` : "";
    submitMode.value = null;
}

watch(
    () => [props.open, props.tab?.id],
    ([isOpen]) => {
        if (isOpen) resetState();
    },
    { immediate: true }
);

function isSelected(itemId) {
    return Number(selectedQuantities[itemId] || 0) > 0;
}

function getMoveQty(itemId) {
    return Number(selectedQuantities[itemId] || 0);
}

function toggleItem(item) {
    if (props.busy) return;
    if (isSelected(item.id)) {
        delete selectedQuantities[item.id];
    } else {
        // Default to 1 if qty > 1 so partial split is effortless, or full qty if 1
        selectedQuantities[item.id] = Number(item.quantity) > 1 ? 1 : Number(item.quantity || 1);
    }
}

function incrementQty(item) {
    if (props.busy) return;
    const maxQty = Number(item.quantity || 1);
    const cur = getMoveQty(item.id);
    if (cur < maxQty) {
        selectedQuantities[item.id] = Math.min(maxQty, cur + 1);
    }
}

function decrementQty(item) {
    if (props.busy) return;
    const cur = getMoveQty(item.id);
    if (cur > 1) {
        selectedQuantities[item.id] = cur - 1;
    }
}

function clearSelection() {
    Object.keys(selectedQuantities).forEach((k) => delete selectedQuantities[k]);
}

function getMoveAmount(item) {
    const qty = Number(item.quantity || 1);
    const moveQty = getMoveQty(item.id);
    if (moveQty <= 0 || qty <= 0) return 0;
    const lineTotal = Number(item.total_amount ?? Number(item.unit_price || 0) * qty);
    return Number(((lineTotal * moveQty) / qty).toFixed(2));
}

function formatQty(qty) {
    const n = Number(qty || 0);
    return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3)));
}

const selectedCount = computed(() =>
    activeItems.value.filter((i) => isSelected(i.id)).length
);

const selectedQtyTotal = computed(() =>
    Number(
        activeItems.value
            .reduce((sum, item) => sum + getMoveQty(item.id), 0)
            .toFixed(3)
    )
);

const totalItemQty = computed(() =>
    Number(
        activeItems.value
            .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
            .toFixed(3)
    )
);

const remainingQtyTotal = computed(() =>
    Math.max(0, Number((totalItemQty.value - selectedQtyTotal.value).toFixed(3)))
);

const splitAmount = computed(() =>
    Number(
        activeItems.value
            .reduce((sum, item) => sum + getMoveAmount(item), 0)
            .toFixed(2)
    )
);

const remainingAmount = computed(() => {
    const orig = Number(props.tab?.total_amount || 0);
    return Math.max(0, Number((orig - splitAmount.value).toFixed(2)));
});

const isSelectingEverything = computed(
    () => selectedQtyTotal.value > 0 && remainingQtyTotal.value <= 0.0005
);

const canSubmit = computed(
    () => selectedQtyTotal.value > 0 && !isSelectingEverything.value
);

function submitSplit(payNow) {
    if (!canSubmit.value || props.busy) return;
    submitMode.value = payNow ? "pay" : "split";
    const items = activeItems.value
        .filter((i) => isSelected(i.id))
        .map((i) => ({
            item_id: String(i.id),
            quantity: getMoveQty(i.id),
        }));

    emit("confirm", {
        tab: props.tab,
        items,
        newTabName: newTabName.value.trim() || null,
        payNow,
    });
}

function handleClose() {
    if (props.busy) return;
    emit("close");
}
</script>

<style scoped>
.split-modal-divider {
    border-bottom: 1px solid #edf0f5 !important;
}

.split-modal-footer-divider {
    border-top: 1px solid #edf0f5 !important;
}

.split-table-box {
    border: 1px solid #edf0f5;
    border-radius: 8px;
    overflow: hidden;
    background-color: #ffffff;
}

.split-table-box .doc-table thead th {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.35px;
    color: #64748b;
    padding: 10px 12px;
    border-bottom: 1px solid #edf0f5;
}

.split-table-box .doc-table tbody td {
    padding: 10px 12px;
    border-color: #f1f4f8;
    vertical-align: middle;
}

.split-item-row {
    cursor: pointer;
}

.split-item-row.is-selected {
    background-color: rgba(59, 130, 246, 0.045);
}

.split-thumb {
    width: 34px;
    height: 34px;
    border-radius: 6px;
    background-color: #f8fafc;
    border: 1px solid #edf0f5;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.split-qty-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid #dbe2ea;
    border-radius: 4px;
    background-color: #ffffff;
    color: #334155;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.split-qty-btn:hover:not(:disabled) {
    background-color: #f1f5f9;
    border-color: #94a3b8;
}

.split-qty-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

.split-qty-val {
    min-width: 44px;
    text-align: center;
    font-size: 12px;
}

.split-summary-box {
    border: 1px solid #edf0f5;
    border-radius: 8px;
    background-color: #f8fafc;
}

.split-summary-active {
    border-color: rgba(59, 130, 246, 0.35);
    background-color: rgba(59, 130, 246, 0.04);
}

.split-num {
    font-variant-numeric: tabular-nums;
}
</style>
