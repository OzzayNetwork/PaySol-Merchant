<template>
    <div
        v-if="open && tab"
        class="modal fade show d-block"
        tabindex="-1"
        style="background-color: rgba(15, 23, 42, 0.55); z-index: 1055;"
        @click.self="handleClose"
    >
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 620px;">
            <div class="modal-content border-0 rounded-3 overflow-hidden shadow">
                <!-- Header -->
                <div class="modal-header bg-white tab-modal-divider py-3 px-4">
                    <div class="d-flex align-items-center gap-3 min-w-0">
                        <span
                            class="tab-modal-avatar flex-shrink-0"
                            :style="{ backgroundColor: avatarTone.bg, color: avatarTone.text }"
                        >
                            {{ initials }}
                        </span>
                        <div class="min-w-0">
                            <div class="d-flex align-items-center gap-2 flex-wrap">
                                <h5 class="modal-title font-size-16 fw-bold mb-0 text-dark text-truncate">
                                    {{ tabTitle }}
                                </h5>
                                <span
                                    class="badge font-size-10 px-2 py-1 fw-bold rounded-1"
                                    :style="{
                                        backgroundColor: agingTheme.badgeBg,
                                        color: agingTheme.badgeText,
                                        border: '1px solid ' + agingTheme.badgeBorder,
                                    }"
                                >
                                    {{ agingTheme.label }}
                                </span>
                            </div>
                            <div class="d-flex align-items-center flex-wrap gap-2 font-size-12 text-muted mt-1">
                                <span class="font-monospace fw-semibold text-dark">{{ tab.tab_number }}</span>
                                <template v-if="tableDisplay">
                                    <span>•</span>
                                    <span><i class="mdi mdi-map-marker me-1"></i>{{ tableDisplay }}</span>
                                </template>
                                <span>•</span>
                                <span><i class="mdi mdi-clock-outline me-1"></i>{{ formatTabRelativeTime(tab.opened_at || tab.created_at) }}</span>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn-close shadow-none" :disabled="isSaving" @click="handleClose"></button>
                </div>

                <!-- Standard PaySol Underline Tabs: Bill Details & Timeline -->
                <div class="bg-white tab-modal-divider px-4 d-flex align-items-center justify-content-between gap-2">
                    <ul class="nav nav-tabs nav-tabs-custom border-bottom-0" role="tablist">
                        <li class="nav-item" role="presentation">
                            <a
                                class="nav-link py-3 d-inline-flex align-items-center gap-2"
                                :class="{ active: activeView === 'details' }"
                                href="javascript:void(0);"
                                role="tab"
                                :aria-selected="activeView === 'details'"
                                @click.prevent="activeView = 'details'"
                            >
                                <Icon icon="ri:bill-line" class="font-size-15" />
                                <span>Bill Details</span>
                            </a>
                        </li>
                        <li class="nav-item" role="presentation">
                            <a
                                class="nav-link py-3 d-inline-flex align-items-center gap-2"
                                :class="{ active: activeView === 'timeline' }"
                                href="javascript:void(0);"
                                role="tab"
                                :aria-selected="activeView === 'timeline'"
                                @click.prevent="activeView = 'timeline'"
                            >
                                <Icon icon="ri:history-line" class="font-size-15" />
                                <span>Timeline</span>
                                <span
                                    v-if="timelineEvents.length > 0"
                                    class="badge rounded-pill font-size-10 px-2"
                                    :class="activeView === 'timeline' ? 'bg-primary-subtle text-primary' : 'bg-light text-muted border'"
                                >
                                    {{ timelineEvents.length }}
                                </span>
                            </a>
                        </li>
                    </ul>
                    <button
                        v-if="activeView === 'timeline'"
                        type="button"
                        class="btn btn-sm btn-light waves-effect d-inline-flex align-items-center gap-1 font-size-11"
                        :disabled="isLoadingTimeline"
                        title="Refresh timeline"
                        @click="loadTimeline(true)"
                    >
                        <Icon icon="ri:refresh-line" :class="{ 'tab-spin': isLoadingTimeline }" class="font-size-14" />
                        <span>Refresh</span>
                    </button>
                </div>

                <!-- Body -->
                <div class="modal-body p-4">
                    <template v-if="activeView === 'details'">
                    <!-- Customer & Staff Meta Cards -->
                    <div class="row g-3 mb-3">
                        <div class="col-sm-6">
                            <div class="p-3 tab-detail-section h-100">
                                <div class="text-muted text-uppercase fw-semibold" style="font-size: 10px; letter-spacing: 0.4px;">Customer</div>
                                <div class="fw-bold text-dark font-size-13 mt-1">{{ customerName }}</div>
                                <div class="text-muted font-size-12 mt-1">{{ tab.customer?.phone || 'No phone on file' }}</div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="p-3 tab-detail-section h-100">
                                <div class="text-muted text-uppercase fw-semibold" style="font-size: 10px; letter-spacing: 0.4px;">Opened By</div>
                                <div class="fw-bold text-dark font-size-13 mt-1">{{ tab.opened_by?.name || 'Staff' }}</div>
                                <div class="text-muted font-size-12 mt-1">{{ openedAtFormatted }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Notes (if present) -->
                    <div v-if="tab.notes" class="p-3 rounded border border-warning-subtle bg-warning-subtle text-dark font-size-12 mb-3 d-flex align-items-start gap-2">
                        <Icon icon="ri:sticky-note-line" class="fs-5 text-warning flex-shrink-0" />
                        <div>
                            <span class="fw-semibold">Notes:</span> {{ tab.notes }}
                        </div>
                    </div>

                    <!-- Save Error Alert -->
                    <div v-if="saveError" class="alert alert-danger py-2 px-3 font-size-12 mb-3 d-flex align-items-center gap-2">
                        <Icon icon="ri:error-warning-line" class="fs-5 flex-shrink-0" />
                        <span>{{ saveError }}</span>
                    </div>

                    <!-- Cart-Aligned Itemized Order Table (Logs table style) -->
                    <div class="mb-3">
                        <div class="table-responsive tab-logs-box">
                            <table class="table verticle-middle table-hover mb-0 doc-table tab-cart-table">
                                <thead class="table-light text-nowrap">
                                    <tr>
                                        <th>Item</th>
                                        <th class="text-center" style="width: 136px;">Qty</th>
                                        <th class="text-end" style="width: 132px;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="(item, idx) in groupedItems"
                                        :key="item._groupKey || item.id || idx"
                                        :class="{ 'tab-item-added-row': getAddedQty(item) > 0 }"
                                    >
                                        <!-- Product Image + Name + Size / Unit Price Subtitle (matches Cart & Logs table) -->
                                        <td>
                                            <div class="d-flex align-items-center gap-3 min-w-0">
                                                <div class="tab-product-thumb flex-shrink-0">
                                                    <img
                                                        v-if="getItemImage(item)"
                                                        :src="getItemImage(item)"
                                                        :alt="item.item_name || item.name || 'Item'"
                                                        class="tab-product-img"
                                                        loading="lazy"
                                                        @error="markImageBroken(item)"
                                                    />
                                                    <i v-else class="bx bx-package fs-5 text-muted"></i>
                                                </div>
                                                <div class="min-w-0">
                                                    <div class="d-flex align-items-center gap-2">
                                                        <span class="fw-bold text-dark font-size-13 text-truncate">
                                                            {{ item.item_name || item.name || 'Item' }}
                                                        </span>
                                                        <span
                                                            v-if="getAddedQty(item) > 0"
                                                            class="badge bg-primary-subtle text-primary font-size-10 fw-semibold px-2 py-1 flex-shrink-0"
                                                        >
                                                            +{{ getAddedQty(item) }}
                                                        </span>
                                                    </div>
                                                    <small class="text-muted d-flex align-items-center gap-2 font-size-12 mt-1">
                                                        <template v-if="item.product?.size_label">
                                                            <span>{{ item.product.size_label }}</span>
                                                            <span class="opacity-50">|</span>
                                                        </template>
                                                        <span class="tab-num">{{ formatKES(item.unit_price) }}</span>
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <!-- Cart-style Quantity Stepper (increase-only above original qty) -->
                                        <td class="text-center">
                                            <div
                                                v-if="isOpenTab"
                                                class="d-inline-flex align-items-center justify-content-center gap-2"
                                            >
                                                <button
                                                    type="button"
                                                    class="tab-qty-btn"
                                                    :disabled="isSaving || getAddedQty(item) <= 0"
                                                    :title="getAddedQty(item) <= 0 ? 'Cannot reduce original tab items' : 'Undo added quantity'"
                                                    @click="decrementItem(item)"
                                                >
                                                    <i class="mdi mdi-minus fs-6"></i>
                                                </button>
                                                <span class="tab-qty-val tab-num fw-semibold text-dark">
                                                    {{ getDisplayQty(item) }}
                                                </span>
                                                <button
                                                    type="button"
                                                    class="tab-qty-btn tab-qty-btn-plus"
                                                    :disabled="isSaving || !item.product_id"
                                                    :title="item.product_id ? 'Add 1 more' : 'Product reference unavailable'"
                                                    @click="incrementItem(item)"
                                                >
                                                    <i class="mdi mdi-plus fs-6"></i>
                                                </button>
                                            </div>
                                            <span v-else class="fw-medium text-muted font-size-13 tab-num">
                                                {{ Number(item.quantity || 1) }}
                                            </span>
                                        </td>

                                        <!-- Right-aligned Line Total -->
                                        <td class="text-end fw-bold text-dark text-nowrap font-size-13 tab-num">
                                            {{ formatKES(getDisplayLineTotal(item)) }}
                                        </td>
                                    </tr>
                                    <tr v-if="groupedItems.length === 0">
                                        <td colspan="3" class="text-center text-muted font-size-12 py-4 fst-italic">
                                            No items recorded on this tab.
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot class="table-light">
                                    <tr v-if="hasPendingAdditions">
                                        <td colspan="2" class="text-end text-primary fw-medium font-size-12">
                                            Added Items (+{{ totalAddedQty }})
                                        </td>
                                        <td class="text-end fw-semibold text-primary text-nowrap font-size-12 tab-num">
                                            +{{ formatKES(addedSubtotal) }}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" class="text-end text-muted font-size-12">Total Bill</td>
                                        <td class="text-end fw-semibold text-dark text-nowrap font-size-13 tab-num">
                                            {{ formatKES(liveTotalAmount) }}
                                        </td>
                                    </tr>
                                    <tr v-if="Number(tab.paid_amount) > 0">
                                        <td colspan="2" class="text-end text-muted font-size-12">Amount Paid</td>
                                        <td class="text-end fw-semibold text-success text-nowrap font-size-13 tab-num">
                                            {{ formatKES(tab.paid_amount) }}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" class="text-end fw-bold text-dark font-size-13">Balance Due</td>
                                        <td
                                            class="text-end fw-bold font-size-15 text-nowrap tab-num"
                                            :style="{ color: liveBalanceDue > 0 ? agingTheme.priceColor : '#15803d' }"
                                        >
                                            {{ formatKES(liveBalanceDue) }}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <!-- Payment History Table (if any payments exist) -->
                    <div v-if="tab.payments && tab.payments.length > 0">
                        <div class="font-size-11 fw-bold text-uppercase text-muted mb-2">
                            Payments Recorded ({{ tab.payments.length }})
                        </div>
                        <div class="table-responsive tab-logs-box">
                            <table class="table verticle-middle table-hover mb-0 doc-table font-size-12">
                                <thead class="table-light text-nowrap">
                                    <tr>
                                        <th>Method</th>
                                        <th>Reference</th>
                                        <th class="text-end">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="p in tab.payments" :key="p.id">
                                        <td>
                                            <span class="badge bg-success-subtle text-success text-uppercase fw-bold">{{ p.method }}</span>
                                        </td>
                                        <td class="text-muted font-monospace">{{ p.payment_reference || '—' }}</td>
                                        <td class="text-end fw-bold text-success text-nowrap tab-num">{{ formatKES(p.amount) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </template>

                    <!-- Audit Timeline View -->
                    <template v-else>
                        <div v-if="isLoadingTimeline" class="py-2">
                            <SkeletonLoader variant="list" :rows="4" />
                        </div>

                        <div v-else-if="timelineError" class="alert alert-danger py-2 px-3 font-size-12 d-flex align-items-center justify-content-between gap-2">
                            <div class="d-flex align-items-center gap-2">
                                <Icon icon="ri:error-warning-line" class="fs-5 flex-shrink-0" />
                                <span>{{ timelineError }}</span>
                            </div>
                            <button type="button" class="btn btn-sm btn-light border" @click="loadTimeline(true)">Retry</button>
                        </div>

                        <div v-else-if="timelineEvents.length === 0" class="text-center py-5 text-muted">
                            <Icon icon="ri:history-line" class="fs-1 opacity-50 mb-2" />
                            <div class="fw-semibold text-dark font-size-13">No timeline activity yet</div>
                            <div class="font-size-12 mt-1">Events will appear here as items, payments, and updates happen on this tab.</div>
                        </div>

                        <div v-else>
                            <!-- Legacy reconstruction notice (if applicable) -->
                            <div
                                v-if="timelineSource === 'reconstructed'"
                                class="d-flex align-items-center gap-2 px-3 py-2 tab-detail-section text-muted font-size-11 mb-3"
                            >
                                <Icon icon="ri:information-line" class="fs-6 text-primary flex-shrink-0" />
                                <span>Reconstructed from historical order &amp; payment timestamps for this earlier tab.</span>
                            </div>

                            <!-- Vertical Timeline -->
                            <div class="tab-timeline">
                                <div
                                    v-for="(ev, idx) in timelineEvents"
                                    :key="ev.id || idx"
                                    class="tab-timeline-item"
                                    :class="{ 'is-last': idx === timelineEvents.length - 1 }"
                                >
                                    <div
                                        class="tab-timeline-dot"
                                        :style="{
                                            backgroundColor: getEventTheme(ev.event_type).bg,
                                            color: getEventTheme(ev.event_type).color,
                                            borderColor: getEventTheme(ev.event_type).border,
                                        }"
                                    >
                                        <Icon :icon="getEventTheme(ev.event_type).icon" class="font-size-14" />
                                    </div>

                                    <div class="tab-timeline-card">
                                        <div class="d-flex align-items-start justify-content-between gap-2 flex-wrap">
                                            <div class="min-w-0">
                                                <div class="d-flex align-items-center gap-2 flex-wrap">
                                                    <span
                                                        class="badge font-size-10 fw-semibold rounded-1 px-2 py-1"
                                                        :style="{
                                                            backgroundColor: getEventTheme(ev.event_type).bg,
                                                            color: getEventTheme(ev.event_type).color,
                                                            border: '1px solid ' + getEventTheme(ev.event_type).border,
                                                        }"
                                                    >
                                                        {{ getEventTheme(ev.event_type).label }}
                                                    </span>
                                                    <span class="fw-bold text-dark font-size-13">{{ ev.summary }}</span>
                                                </div>
                                                <div class="d-flex align-items-center flex-wrap gap-2 font-size-11 text-muted mt-1">
                                                    <span class="d-inline-flex align-items-center gap-1">
                                                        <Icon icon="ri:user-line" class="font-size-12" />
                                                        <span>{{ ev.actor_name || 'Staff' }}</span>
                                                    </span>
                                                    <span>•</span>
                                                    <span>{{ formatEventTimestamp(ev.created_at) }}</span>
                                                    <span class="text-muted opacity-75">({{ formatTabRelativeTime(ev.created_at) }})</span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Itemized Round Breakdown -->
                                        <div
                                            v-if="ev.meta?.items && ev.meta.items.length > 0"
                                            class="mt-2 pt-2 border-top d-flex flex-column gap-1"
                                        >
                                            <div
                                                v-for="(line, lIdx) in ev.meta.items"
                                                :key="line.id || lIdx"
                                                class="d-flex align-items-center justify-content-between gap-2 font-size-12"
                                            >
                                                <span class="text-dark text-truncate">
                                                    <span class="fw-semibold tab-num">{{ formatEventQty(line.quantity) }}×</span>
                                                    <span class="ms-1">{{ line.name }}</span>
                                                </span>
                                                <span class="text-muted fw-semibold text-nowrap tab-num">
                                                    {{ formatKES(line.total) }}
                                                </span>
                                            </div>
                                        </div>

                                        <!-- Void Reason -->
                                        <div
                                            v-if="ev.event_type === 'item_voided' && ev.meta?.reason"
                                            class="mt-2 pt-2 border-top font-size-11 text-danger d-flex align-items-center gap-1"
                                        >
                                            <Icon icon="ri:chat-delete-line" class="font-size-13 flex-shrink-0" />
                                            <span>Reason: {{ ev.meta.reason }}</span>
                                        </div>

                                        <!-- Payment Reference / Order Number / Joint Tabs Badges -->
                                        <div
                                            v-if="ev.meta?.payment_reference || ev.meta?.order_number || (ev.meta?.joint_with && ev.meta.joint_with.length) || ev.meta?.related_tab_number"
                                            class="mt-2 pt-2 border-top d-flex align-items-center flex-wrap gap-2 font-size-11"
                                        >
                                            <span
                                                v-if="ev.meta?.payment_reference"
                                                class="badge bg-light text-dark border font-monospace fw-medium"
                                            >
                                                Ref: {{ ev.meta.payment_reference }}
                                            </span>
                                            <span
                                                v-if="ev.meta?.external_reference"
                                                class="badge bg-light text-dark border font-monospace fw-medium"
                                            >
                                                Ext: {{ ev.meta.external_reference }}
                                            </span>
                                            <span
                                                v-if="ev.meta?.order_number"
                                                class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace fw-semibold"
                                            >
                                                {{ ev.meta.order_number }}
                                            </span>
                                            <span
                                                v-if="ev.meta?.related_tab_number"
                                                class="badge bg-info-subtle text-info border border-info-subtle font-monospace fw-semibold"
                                            >
                                                {{ ev.meta.related_tab_number }}
                                            </span>
                                            <span
                                                v-for="otherNum in (ev.meta?.joint_with || [])"
                                                :key="otherNum"
                                                class="badge bg-light text-muted border font-monospace"
                                            >
                                                + {{ otherNum }}
                                            </span>
                                        </div>

                                        <!-- Running Total / Balance Snapshot -->
                                        <div
                                            v-if="ev.meta && (ev.meta.running_total !== undefined || ev.meta.balance_due !== undefined)"
                                            class="mt-2 pt-2 border-top d-flex align-items-center justify-content-between gap-2 font-size-11 text-muted"
                                        >
                                            <span v-if="ev.meta.running_total !== undefined">
                                                Tab Total: <strong class="text-dark tab-num">{{ formatKES(ev.meta.running_total) }}</strong>
                                            </span>
                                            <span v-if="ev.meta.balance_due !== undefined" class="ms-auto">
                                                Balance:
                                                <strong
                                                    class="tab-num"
                                                    :class="Number(ev.meta.balance_due) > 0 ? 'text-danger' : 'text-success'"
                                                >
                                                    {{ formatKES(ev.meta.balance_due) }}
                                                </strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Footer Actions (PaySol button system from /test-page) -->
                <div class="modal-footer bg-white tab-modal-footer-divider py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div class="d-flex align-items-center gap-2">
                        <button
                            v-if="hasPendingAdditions"
                            type="button"
                            class="btn btn-white"
                            :disabled="isSaving"
                            @click="resetAdditions"
                        >
                            Reset
                        </button>
                        <button
                            v-else-if="isOpenTab && canSplitTab"
                            type="button"
                            class="btn btn-white d-inline-flex align-items-center gap-1"
                            @click="$emit('split', tab)"
                        >
                            <Icon icon="ri:git-branch-line" class="fs-6" />
                            <span>Split Bill</span>
                        </button>
                    </div>

                    <div class="d-flex align-items-center gap-2 ms-auto">
                        <!-- When user has added extra quantities: Save or Save & Record Payment -->
                        <template v-if="isOpenTab && hasPendingAdditions">
                            <button
                                type="button"
                                class="btn btn-outline-muted-primary d-inline-flex align-items-center justify-content-center gap-2"
                                :disabled="isSaving"
                                @click="saveAdditions(false)"
                            >
                                <span v-if="isSaving && savingMode === 'save'" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                <Icon v-else icon="ri:save-line" class="fs-5" />
                                <span>{{ isSaving && savingMode === 'save' ? 'Saving...' : 'Save Changes' }}</span>
                            </button>
                            <button
                                type="button"
                                class="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2"
                                :disabled="isSaving"
                                @click="saveAdditions(true)"
                            >
                                <span v-if="isSaving && savingMode === 'checkout'" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                <Icon v-else icon="ri:money-dollar-circle-line" class="fs-5" />
                                <span>{{ isSaving && savingMode === 'checkout' ? 'Saving...' : 'Save & Record Payment' }}</span>
                            </button>
                        </template>

                        <!-- Default open tab actions when no pending edits -->
                        <template v-else-if="isOpenTab">
                            <button
                                type="button"
                                class="btn btn-outline-muted-primary d-inline-flex align-items-center justify-content-center gap-2"
                                @click="$emit('resume', tab)"
                            >
                                <Icon icon="ri:shopping-cart-2-line" class="fs-5" />
                                <span>Resume in Cart</span>
                            </button>
                            <button
                                v-if="Number(tab.balance_due) > 0"
                                type="button"
                                class="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2"
                                @click="$emit('pay', tab)"
                            >
                                <Icon icon="ri:money-dollar-circle-line" class="fs-5" />
                                <span>Record Payment</span>
                            </button>
                        </template>

                        <!-- Settled / closed tab -->
                        <button
                            v-else
                            type="button"
                            class="btn btn-white"
                            @click="handleClose"
                        >
                            Close
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
import SkeletonLoader from "@/components/Loaders/SkeletonLoader.vue";
import tabsApi from "@/api/tabs";
import { formatKES } from "@/utils/currency";
import { getTabAgingTheme, formatTabRelativeTime, groupTabItems } from "@/utils/tabAging";

const props = defineProps({
    open: { type: Boolean, default: false },
    tab: { type: Object, default: null },
    initialView: { type: String, default: "details" }, // 'details' | 'timeline'
});

const emit = defineEmits(["close", "resume", "pay", "split", "saving", "updated", "save-error"]);

const AVATAR_TONES = [
    { bg: "#d1fae5", text: "#047857" },
    { bg: "#dbeafe", text: "#1d4ed8" },
    { bg: "#ede9fe", text: "#6d28d9" },
    { bg: "#fef3c7", text: "#b45309" },
    { bg: "#fce7f3", text: "#be185d" },
];

// Tracks uncommitted positive-only increments keyed by item._groupKey
const pendingIncrements = reactive({});
const brokenImages = reactive({});
const isSaving = ref(false);
const savingMode = ref(null); // 'save' | 'checkout'
const saveError = ref("");

// Modal view & audit timeline state
const activeView = ref("details"); // 'details' | 'timeline'
const timelineEvents = ref([]);
const timelineSource = ref("events"); // 'events' | 'reconstructed'
const isLoadingTimeline = ref(false);
const timelineError = ref("");
const loadedTimelineTabId = ref(null);

const EVENT_THEMES = {
    opened: {
        label: "Opened",
        icon: "ri:file-add-line",
        bg: "#eff6ff",
        color: "#1d4ed8",
        border: "#bfdbfe",
    },
    items_added: {
        label: "Items Added",
        icon: "ri:shopping-bag-3-line",
        bg: "#eef2ff",
        color: "#4338ca",
        border: "#c7d2fe",
    },
    item_voided: {
        label: "Item Voided",
        icon: "ri:delete-bin-6-line",
        bg: "#fef2f2",
        color: "#b91c1c",
        border: "#fecaca",
    },
    payment_recorded: {
        label: "Payment",
        icon: "ri:money-dollar-circle-line",
        bg: "#ecfdf5",
        color: "#047857",
        border: "#a7f3d0",
    },
    settled: {
        label: "Settled",
        icon: "ri:checkbox-circle-fill",
        bg: "#f0fdf4",
        color: "#15803d",
        border: "#bbf7d0",
    },
    joint_settled: {
        label: "Joint Settlement",
        icon: "ri:stack-line",
        bg: "#ecfdf5",
        color: "#047857",
        border: "#a7f3d0",
    },
    split_out: {
        label: "Split Out",
        icon: "ri:git-branch-line",
        bg: "#fffbeb",
        color: "#b45309",
        border: "#fde68a",
    },
    split_created: {
        label: "Split Created",
        icon: "ri:git-branch-line",
        bg: "#eff6ff",
        color: "#1d4ed8",
        border: "#bfdbfe",
    },
    merged_into: {
        label: "Merged Out",
        icon: "ri:git-merge-line",
        bg: "#f8fafc",
        color: "#475569",
        border: "#cbd5e1",
    },
    merged_from: {
        label: "Merged In",
        icon: "ri:git-merge-line",
        bg: "#f0f9ff",
        color: "#0369a1",
        border: "#bae6fd",
    },
    voided: {
        label: "Voided",
        icon: "ri:close-circle-line",
        bg: "#fef2f2",
        color: "#b91c1c",
        border: "#fecaca",
    },
};

function getEventTheme(eventType) {
    return (
        EVENT_THEMES[String(eventType || "").toLowerCase()] || {
            label: String(eventType || "Event").replace(/_/g, " "),
            icon: "ri:record-circle-line",
            bg: "#f8fafc",
            color: "#475569",
            border: "#e2e8f0",
        }
    );
}

function formatEventTimestamp(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

function formatEventQty(qty) {
    const n = Number(qty || 0);
    return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3)));
}

async function loadTimeline(force = false) {
    const tabId = props.tab?.id;
    if (!tabId) return;
    if (!force && loadedTimelineTabId.value === tabId && timelineEvents.value.length > 0) return;

    isLoadingTimeline.value = true;
    timelineError.value = "";
    try {
        const res = await tabsApi.timeline(tabId);
        const payload = res.data?.data || res.data || {};
        timelineEvents.value = Array.isArray(payload.events) ? payload.events : [];
        timelineSource.value = payload.source || "events";
        loadedTimelineTabId.value = tabId;
    } catch (err) {
        timelineError.value =
            err?.response?.data?.message || "Could not load tab timeline.";
    } finally {
        isLoadingTimeline.value = false;
    }
}

function clearPendingState() {
    Object.keys(pendingIncrements).forEach((k) => {
        delete pendingIncrements[k];
    });
    saveError.value = "";
}

function getItemImage(item) {
    const key = itemKey(item);
    if (brokenImages[key]) return null;
    return item?.product?.image_url || item?.image_url || null;
}

function markImageBroken(item) {
    brokenImages[itemKey(item)] = true;
}

watch(
    () => [props.open, props.tab?.id, props.initialView],
    ([isOpen, newTabId, nextInitialView]) => {
        clearPendingState();
        activeView.value = nextInitialView === "timeline" ? "timeline" : "details";
        timelineError.value = "";
        if (isOpen && newTabId) {
            if (loadedTimelineTabId.value !== newTabId) {
                timelineEvents.value = Array.isArray(props.tab?.timeline) ? props.tab.timeline : [];
                loadedTimelineTabId.value = null;
            }
            loadTimeline(true);
        }
    },
    { immediate: true }
);

const isOpenTab = computed(() =>
    ["open", "partially_paid"].includes(String(props.tab?.status || "").toLowerCase())
);

const canSplitTab = computed(() => {
    const items = (props.tab?.items || []).filter((i) => String(i.status || "").toLowerCase() !== "voided");
    if (items.length > 1) return true;
    return items.some((i) => Number(i.quantity || 0) > 1);
});

const agingTheme = computed(() => getTabAgingTheme(props.tab || {}));
const groupedItems = computed(() => groupTabItems(props.tab?.items || []));

function itemKey(item) {
    return item._groupKey || `${item.product_id ?? String(item.item_name || "item").toLowerCase()}::${Number(item.unit_price || 0).toFixed(2)}`;
}

function getAddedQty(item) {
    return Number(pendingIncrements[itemKey(item)] || 0);
}

function getDisplayQty(item) {
    return Number((Number(item.quantity || 0) + getAddedQty(item)).toFixed(3));
}

function getDisplayLineTotal(item) {
    const baseTotal = Number(item.total_amount ?? (Number(item.unit_price || 0) * Number(item.quantity || 1)));
    const added = getAddedQty(item);
    return baseTotal + added * Number(item.unit_price || 0);
}

function incrementItem(item) {
    if (!isOpenTab.value || !item.product_id || isSaving.value) return;
    const key = itemKey(item);
    pendingIncrements[key] = (Number(pendingIncrements[key]) || 0) + 1;
    saveError.value = "";
}

function decrementItem(item) {
    if (!isOpenTab.value || isSaving.value) return;
    const key = itemKey(item);
    const current = Number(pendingIncrements[key]) || 0;
    if (current <= 0) return; // Never allow dropping below original tab quantity
    if (current === 1) {
        delete pendingIncrements[key];
    } else {
        pendingIncrements[key] = current - 1;
    }
    saveError.value = "";
}

function resetAdditions() {
    clearPendingState();
}

const totalAddedQty = computed(() =>
    groupedItems.value.reduce((sum, item) => sum + getAddedQty(item), 0)
);

const hasPendingAdditions = computed(() => totalAddedQty.value > 0);

const addedSubtotal = computed(() =>
    groupedItems.value.reduce(
        (sum, item) => sum + getAddedQty(item) * Number(item.unit_price || 0),
        0
    )
);

const liveTotalAmount = computed(
    () => Number(props.tab?.total_amount || 0) + addedSubtotal.value
);

const liveBalanceDue = computed(
    () => Number(props.tab?.balance_due || 0) + addedSubtotal.value
);

async function saveAdditions(proceedToCheckout = false) {
    if (!props.tab?.id || !hasPendingAdditions.value || isSaving.value) return;

    const itemsToAdd = groupedItems.value
        .map((item) => {
            const added = getAddedQty(item);
            if (added <= 0 || !item.product_id) return null;
            return {
                product_id: String(item.product_id),
                pack_id: item.pack_id ?? null,
                quantity: added,
                unit_price: Number(item.unit_price || 0),
                tax_rate: Number(item.tax_rate || 0),
            };
        })
        .filter(Boolean);

    if (itemsToAdd.length === 0) return;

    const addedCount = itemsToAdd.reduce((s, i) => s + i.quantity, 0);
    isSaving.value = true;
    savingMode.value = proceedToCheckout ? "checkout" : "save";
    saveError.value = "";
    emit("saving", { tab: props.tab, addedCount });

    try {
        const res = await tabsApi.addItems(props.tab.id, itemsToAdd);
        const updatedTab = res.data?.data || res.data || null;
        clearPendingState();
        loadTimeline(true);
        emit("updated", {
            tab: updatedTab,
            addedCount,
            proceedToCheckout,
        });
    } catch (err) {
        const msg =
            err?.response?.data?.message ||
            Object.values(err?.response?.data?.errors || {})?.flat()?.[0] ||
            "Failed to add items to tab. Please try again.";
        saveError.value = msg;
        emit("save-error", msg);
    } finally {
        isSaving.value = false;
        savingMode.value = null;
    }
}

function handleClose() {
    if (isSaving.value) return;
    emit("close");
}

const customerName = computed(() => {
    if (!props.tab?.customer) return "Walk-in";
    if (props.tab.customer.name) return props.tab.customer.name;
    return `${props.tab.customer.first_name || ""} ${props.tab.customer.last_name || ""}`.trim() || "Walk-in";
});

const tabTitle = computed(() => {
    if (!props.tab) return "";
    return props.tab.name || (props.tab.customer?.name ? `${props.tab.customer.name}'s Tab` : props.tab.tab_number);
});

const tableDisplay = computed(() => {
    if (props.tab?.table?.table_number) return `Table ${props.tab.table.table_number}`;
    if (props.tab?.table?.label) return `Table ${props.tab.table.label}`;
    if (props.tab?.table_number) return `Table ${props.tab.table_number}`;
    return null;
});

const initials = computed(() => {
    const src = props.tab?.customer?.name || props.tab?.name || "T";
    return String(src).trim().split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
});

const avatarTone = computed(() => {
    const str = String(tabTitle.value || "A");
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) % AVATAR_TONES.length;
    return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
});

const openedAtFormatted = computed(() => {
    const ts = props.tab?.opened_at || props.tab?.created_at;
    if (!ts) return "—";
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
});
</script>

<style scoped>
.tab-modal-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
}

.tab-modal-divider {
    border-bottom: 1px solid #edf0f5 !important;
}

.tab-modal-footer-divider {
    border-top: 1px solid #edf0f5 !important;
}

.tab-detail-section {
    border: 1px solid #edf0f5;
    border-radius: 8px;
    background-color: #f8fafc;
}

.tab-logs-box {
    border: 1px solid #edf0f5;
    border-radius: 8px;
    overflow: hidden;
    background-color: #ffffff;
}

.tab-logs-box .doc-table thead th {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.35px;
    color: #64748b;
    padding: 12px 16px;
    border-bottom: 1px solid #edf0f5;
}

.tab-logs-box .doc-table tbody td {
    padding: 12px 16px;
    border-color: #f1f4f8;
    vertical-align: middle;
}

.tab-logs-box .doc-table tbody tr:hover {
    background-color: #fafbfd;
}

.tab-logs-box .doc-table tfoot td {
    border-color: #f1f4f8;
    padding: 10px 16px;
}

.tab-product-thumb {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    background-color: #f8fafc;
    border: 1px solid #eff2f7;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.tab-product-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.tab-num {
    font-variant-numeric: tabular-nums;
}

.tab-cart-table td,
.tab-cart-table th {
    vertical-align: middle;
}

.tab-item-added-row {
    background-color: rgba(59, 130, 246, 0.04);
}

.tab-qty-btn {
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid #e2e8f0;
    border-radius: var(--bs-btn-border-radius, 0.25rem);
    background-color: #ffffff;
    color: #334155;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.tab-qty-btn:hover:not(:disabled) {
    background-color: #f1f5f9;
    border-color: #cbd5e1;
    color: #0f172a;
}

.tab-qty-btn-plus:hover:not(:disabled) {
    background-color: rgba(59, 130, 246, 0.08);
    border-color: rgba(59, 130, 246, 0.4);
    color: #2563eb;
}

.tab-qty-btn:disabled {
    opacity: 0.32;
    cursor: not-allowed;
}

.tab-qty-val {
    min-width: 28px;
    text-align: center;
    font-size: 13px;
}

.tab-timeline {
    position: relative;
    padding-left: 2px;
}

.tab-timeline-item {
    position: relative;
    display: flex;
    gap: 14px;
    padding-bottom: 16px;
}

.tab-timeline-item.is-last {
    padding-bottom: 0;
}

.tab-timeline-item:not(.is-last)::before {
    content: "";
    position: absolute;
    left: 15px;
    top: 32px;
    bottom: 0;
    width: 1.5px;
    background-color: #e6ebf2;
}

.tab-timeline-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid #e2e8f0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
}

.tab-timeline-card {
    flex: 1 1 auto;
    min-width: 0;
    background-color: #ffffff;
    border: 1px solid #edf0f5;
    border-radius: 8px;
    padding: 12px 14px;
}

.tab-timeline-card :deep(.border-top),
.tab-timeline-card .border-top {
    border-top: 1px dashed #e9eef5 !important;
}

.tab-spin {
    animation: tabSpin 0.8s linear infinite;
}

@keyframes tabSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>
