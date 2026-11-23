<template>
  <!-- Toggle Button (Hidden, triggered via data-bs-target or script) -->
  <button
    class="btn btn-primary d-none"
    type="button"
    data-bs-toggle="offcanvas"
    data-bs-target="#saveTabAside"
    ref="toggleBtnRef"
  >
    Toggle right offcanvas
  </button>

  <!-- Save Tab Offcanvas Sidebar (Matching reference SaveTabAside.vue) -->
  <div
    class="offcanvas offcanvas-end"
    style="width: 430px; max-width: 95vw;"
    tabindex="-1"
    id="saveTabAside"
    ref="offcanvasRef"
  >
    <!-- Header (Matching Reference Design) -->
    <div class="offcanvas-header border-bottom py-2.5 px-3.5 d-flex align-items-center justify-content-between bg-white">
      <div class="d-flex align-items-center gap-2">
        <div class="d-flex align-items-center justify-content-center rounded-3 bg-light border p-1.5 flex-shrink-0" style="width: 36px; height: 36px;">
          <i class="mdi mdi-receipt-text-outline font-size-18 text-dark"></i>
        </div>
        <div>
          <h5 class="mb-0 fw-bold font-size-15 text-dark">Open Tabs</h5>
          <p class="m-0 text-muted font-size-11">Select an existing tab or create a new one.</p>
        </div>
      </div>
      <button type="button" class="btn-close text-reset shadow-none font-size-11" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>

    <!-- Navigation Tabs: Segmented Control (Matching Reference Design) -->
    <div class="p-3 pt-2.5 pb-2.5 bg-white border-bottom">
      <div class="d-flex p-1 bg-light rounded-3 border" style="background-color: #f1f5f9 !important; border-radius: 10px; padding: 3px !important;">
        <button
          type="button"
          @click="newTab = true"
          class="btn flex-fill py-1.5 font-size-12 fw-semibold border-0 transition-all rounded-2 shadow-none"
          :style="newTab
            ? 'background-color: #ffffff; color: #0f172a; box-shadow: 0 1px 2px rgba(0,0,0,0.06); font-weight: 600;'
            : 'background-color: transparent; color: #64748b; font-weight: 500;'"
        >
          New Tab/Bill
        </button>
        <button
          type="button"
          @click="newTab = false"
          class="btn flex-fill py-1.5 font-size-12 fw-semibold border-0 transition-all rounded-2 shadow-none"
          :style="!newTab
            ? 'background-color: #dbeafe; color: #1d4ed8; box-shadow: 0 1px 2px rgba(29, 78, 216, 0.12); font-weight: 600;'
            : 'background-color: transparent; color: #64748b; font-weight: 500;'"
        >
          Existing Tab/Bill ({{ openTabs.length }})
        </button>
      </div>
    </div>

    <!-- Offcanvas Body: NEW TAB -->
    <div v-if="newTab" class="offcanvas-body p-0">
      <form id="saveTabForm" @submit.prevent="saveTab">
        <!-- Section: Customer Details -->
        <div class="px-3 py-2 fw-bold text-dark sticky-top bg-light border-top" style="z-index: 1020;">
          <div class="d-flex gap-2 align-items-center justify-content-between">
            <span>Customer Details</span>
            <span v-if="selectedCustomer" class="badge bg-soft-success text-success font-size-11">Selected</span>
          </div>
        </div>

        <div class="p-3">
          <!-- Customer Search Input -->
          <div class="search-box position-relative" ref="customerPickerRef">
            <div class="w-100 mb-2 position-relative">
              <div class="input-group bg-light rounded pb-0 flex-nowrap">
                <div class="flex-grow-1 position-relative">
                  <input
                    style="border-radius: 0px; padding-right: 35px;"
                    type="text"
                    class="form-control bg-light rounded flex-grow-1"
                    placeholder="Search Existing Customers..."
                    spellcheck="false"
                    v-model="searchQuery"
                    @input="handleSearchInput"
                    @focus="showCustomerDropdown = true"
                  />
                  <i class="bx bx-search-alt search-icon fs-4"></i>
                  <i
                    v-if="searchQuery !== ''"
                    title="Clear search"
                    style="right: 15px; left: unset;"
                    class="mdi mdi-close search-icon cursor-pointer fs-3 waves-effect"
                    @click="clearSelectedCustomer"
                  ></i>
                </div>
              </div>

              <!-- Customer Dropdown List -->
              <div
                v-if="showCustomerDropdown"
                class="w-100 rounded bg-white border shadow-sm position-absolute start-0 mt-1"
                style="z-index: 1050; max-height: 280px; overflow-y: auto;"
              >
                <div class="p-2">
                  <ul class="list-group list-group-flush mb-0">
                    <!-- Register New Customer Trigger -->
                    <li
                      class="list-group-item list-group-item-action cursor-pointer p-2 rounded mb-1"
                      data-bs-toggle="modal"
                      data-bs-target="#addCustomerModal"
                      @click="showCustomerDropdown = false"
                    >
                      <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center gap-2">
                          <span class="bg-primary-subtle text-primary btn-sm p-1 px-2 rounded">
                            <i class="mdi mdi-plus fs-4"></i>
                          </span>
                          <span class="fw-bold font-size-13 text-primary">Register New Customer</span>
                        </div>
                        <i class="bx bx-chevron-right fs-5 text-muted"></i>
                      </div>
                    </li>

                    <!-- Loading Skeletons -->
                    <li v-if="loadingCustomers" class="list-group-item text-center py-3 border-0">
                      <div class="spinner-border spinner-border-sm text-primary mb-1" role="status"></div>
                      <p class="small text-muted mb-0">Searching customers...</p>
                    </li>

                    <!-- Empty state -->
                    <li
                      v-else-if="customers.length === 0 && searchQuery"
                      class="list-group-item text-center text-muted py-3 border-0 font-size-13"
                    >
                      No customers found for "<strong>{{ searchQuery }}</strong>"
                    </li>

                    <!-- Customer Items -->
                    <li
                      v-for="contact in customers"
                      :key="contact.id"
                      class="list-group-item list-group-item-action border rounded cursor-pointer mb-1 p-2"
                      :class="{ 'border-primary border-2 bg-primary-muted': String(form.customer_id) === String(contact.id) }"
                      @click="selectCustomer(contact)"
                    >
                      <div class="d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-2">
                          <div class="avatar-xs flex-shrink-0">
                            <span class="avatar-title rounded-circle bg-dark-subtle text-dark font-size-12 fw-bold">
                              {{ getInitials(contact.name) }}
                            </span>
                          </div>
                          <div class="overflow-hidden">
                            <p class="m-0 fw-bold text-dark font-size-13 text-truncate">{{ contact.name }}</p>
                            <small class="text-muted font-size-11">
                              {{ contact.phone || 'No phone' }} {{ contact.email ? `· ${contact.email}` : '' }}
                            </small>
                          </div>
                        </div>
                        <input
                          type="radio"
                          class="form-check-input"
                          :checked="String(form.customer_id) === String(contact.id)"
                        />
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Customer Card (Matching Reference Design) -->
          <SelectedCustomerCard
            v-if="selectedCustomer"
            :customer="selectedCustomer"
            :unpaid-bills-count="customerUnpaidBillsCount"
            :outstanding-amount="customerOutstandingDebt"
            @view-bills="switchToExistingTabs"
            @open-profile="openCustomerProfileModal"
          />

          <!-- Empty Customer Notice -->
          <div v-else class="mb-3">
            <p class="m-0 text-muted d-flex gap-2 align-items-start font-size-13">
              <i class="bx bx-info-circle fs-4 mt-1"></i>
              <span>
                <i>Please select a customer.</i><br />
                <span>If unknown, pick <span class="fw-semibold">Walk-in</span> or <a href="#" class="text-decoration-underline" data-bs-toggle="modal" data-bs-target="#addCustomerModal">register</a> a new customer.</span>
              </span>
            </p>
          </div>
        </div>

        <!-- Section: Table & Bill Details -->
        <div class="px-3 py-2 fw-bold text-dark sticky-top bg-light border-top" style="z-index: 1020;">
          <div class="d-flex gap-2 align-items-center justify-content-between">
            <span>Table & Bill</span>
          </div>
        </div>

        <div class="p-3">
          <div class="row">
            <!-- Table selector with SelectSearchBox -->
            <div class="col-12 mb-3">
              <label class="form-label fw-bold font-size-13 text-dark">Table No./Name (Optional)</label>
              <SelectSearchBox
                :options="tableOptions"
                v-model="form.table_id"
                placeholder="Select Table"
                input-class="form-control form-select"
                :is-multi="false"
                @update:modelValue="onTableChange"
              />
            </div>

            <!-- Tab Name -->
            <div class="col-12 mb-2.5">
              <label class="form-label fw-bold font-size-12 text-dark mb-1">
                Bill Name/Label (Optional)
              </label>
              <input
                type="text"
                class="form-control font-size-12 py-1.5"
                placeholder="e.g. John-Table 4 (Optional)"
                v-model="form.tab_name"
              />
              <small class="text-muted font-size-11">Leave blank to auto-generate from customer or table</small>
            </div>

            <!-- Guest Count -->
            <div class="col-12 mb-2.5">
              <label class="form-label fw-bold font-size-12 text-dark mb-1">
                Number of Guests <span class="text-danger fw-bold">*</span>
              </label>
              <input
                type="text"
                class="form-control font-size-12 py-1.5"
                placeholder="e.g. 4"
                v-model="form.guest_count"
                pattern="^[0-9]+$"
                required
              />
              <small class="text-muted font-size-11">Enter the number of guests for this table</small>
            </div>

            <!-- Notes -->
            <div class="col-12 mb-2.5">
              <label class="form-label fw-bold font-size-12 text-dark mb-1">Notes (Optional)</label>
              <textarea
                class="form-control font-size-12"
                rows="2"
                placeholder="Start typing..."
                v-model="form.notes"
              ></textarea>
            </div>

            <!-- Dine-In badge -->
            <div class="col-12 mt-2">
              <div class="p-2 text-muted text-center border border-1 fw-medium border-dark-subtle bg-light rounded d-flex gap-2 justify-content-center align-items-center font-size-12">
                <span class="bx bx-info-circle font-size-16"></span>
                <div>This tab will be created as Dine-In</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Billing Summary -->
        <div class="p-3 pt-2">
          <div class="p-2.5 pb-1 bg-success-muted rounded border border-2 border-success-subtle">
            <h5 class="card-title d-flex gap-1.5 align-items-center font-size-13 mb-2">
              <i class="dripicons-tags font-size-14"></i>
              <span class="fw-bold">Billing Summary</span>
            </h5>
            <table class="table text-uppercase font-size-12 table-sm border-success m-0">
              <tbody>
                <tr class="border-success">
                  <td>Total Items</td>
                  <th class="text-right">{{ cartItemsCount || 0 }} (Items)</th>
                </tr>
                <tr class="border-success">
                  <td>Discount</td>
                  <th class="text-right">KES 0.00</th>
                </tr>
                <tr class="border-success">
                  <td>Total</td>
                  <th class="text-right">{{ formatMoney(cartTotal) }}</th>
                </tr>
                <tr>
                  <td>Tax</td>
                  <th class="text-right">KES 0.00</th>
                </tr>
                <tr class="font-size-13 text-black">
                  <th>Sub Total</th>
                  <th class="text-right">{{ formatMoney(cartTotal) }}</th>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-3 pt-2 d-flex flex-column gap-2">
          <!-- Save as Tab — primary action -->
          <button
            type="submit"
            :disabled="!canSave || saving"
            class="btn btn-primary waves-effect fw-bold font-size-13 py-2.5 rounded-2"
          >
            <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status"></span>
            <template v-if="saving">Saving...</template>
            <template v-if="!saving">
              <i class="mdi mdi-bookmark-outline font-size-16 align-middle me-1.5"></i>
              Save As Tab
            </template>
          </button>

          <!-- Cancel — dismisses offcanvas -->
          <button
            type="button"
            data-bs-dismiss="offcanvas"
            class="btn btn-light waves-effect fw-semibold font-size-12 py-2 rounded-2 d-flex align-items-center justify-content-center"
            @click="resetForm"
          >
            <i class="mdi mdi-close font-size-15 align-middle me-1.5"></i>
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- Offcanvas Body: EXISTING TABS -->
    <div v-else class="offcanvas-body p-3">
      <!-- Search Input with Search Icon (Matching Reference Design) -->
      <div class="mb-3 position-relative">
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0 pe-1 text-muted rounded-start-3 py-1">
            <i class="bx bx-search font-size-15"></i>
          </span>
          <input
            type="text"
            class="form-control border-start-0 ps-1 rounded-end-3 font-size-12 py-1.5"
            placeholder="Search tabs by customer, table..."
            v-model="existingTabFilter"
          />
        </div>
      </div>

      <div v-if="loadingOpenTabs" class="text-center py-4">
        <div class="spinner-border text-primary spinner-border-sm mb-2" role="status"></div>
        <p class="text-muted font-size-12 mb-0">Loading open tabs...</p>
      </div>

      <div v-else-if="filteredOpenTabs.length === 0" class="text-center py-5 text-muted">
        <i class="bx bx-receipt fs-1 opacity-50 mb-2"></i>
        <h6 class="fw-semibold text-dark font-size-14">No open tabs found</h6>
        <p class="font-size-12">Create a new tab or check another shift.</p>
      </div>

      <div v-else class="d-flex flex-column gap-2.5">
        <!-- Reference Design: Open Tab Card (Matching Image & Fog Fade) -->
        <div
          v-for="tab in filteredOpenTabs"
          :key="tab.id"
          class="card border-0 mb-1 shadow-none text-start overflow-hidden position-relative"
          style="background-color: #f0f6ff; border-radius: 14px; border: 1px solid #dbeafe !important;"
        >
          <div class="card-body p-3">
            <!-- Top Section: Tab Name / Table Pin & Pending Balance -->
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="overflow-hidden pe-2">
                <h6 class="fw-bold mb-0.5 text-dark font-size-14 text-truncate" :title="tab.name || tab.tab_number">
                  {{ tab.name || (tab.customer ? `${tab.customer.name}'s Tab` : tab.tab_number) }}
                </h6>
                <div class="d-flex align-items-center gap-1 font-size-11" style="color: #64748b;">
                  <i class="mdi mdi-map-marker font-size-13 text-secondary"></i>
                  <span>{{ tab.table ? `Table ${tab.table.table_number || tab.table.label}` : 'Counter' }}</span>
                  <span class="mx-0.5">•</span>
                  <span>{{ formatRelativeTime(tab.created_at || tab.updated_at) }}</span>
                </div>
              </div>

              <div class="text-end flex-shrink-0">
                <div class="fw-bold font-size-15" style="color: #1e40af; line-height: 1.2;">
                  KES {{ Number(tab.total_amount || tab.pending_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) }}
                </div>
                <span
                  class="badge font-size-10 px-2 py-0.5 fw-bold rounded-pill"
                  style="background-color: #dbeafe; color: #1d4ed8; letter-spacing: 0.2px; margin-top: 2px;"
                >
                  Outstanding
                </span>
              </div>
            </div>

            <!-- Middle Section: Itemized List with Fog Fade Effect (shows up to 2 items) -->
            <div class="position-relative my-2">
              <div
                class="d-flex flex-column gap-1.5 font-size-12 transition-all"
                :style="(!expandedTabs[tab.id] && (tab.items?.length > 2)) ? 'max-height: 48px; overflow: hidden;' : ''"
              >
                <div
                  v-for="(item, idx) in (tab.items || [])"
                  :key="item.id || idx"
                  class="d-flex justify-content-between align-items-baseline"
                  style="color: #334155;"
                >
                  <div class="text-truncate pe-2">
                    <span>{{ idx + 1 }}. {{ item.item_name || item.name || 'Item' }}</span>
                    <span v-if="item.quantity && Number(item.quantity) > 1" class="text-muted font-size-11 ms-1">({{ Number(item.quantity) }})</span>
                  </div>
                  <div class="fw-semibold font-size-12 text-dark text-nowrap">
                    KES {{ Number(item.total_amount ?? (Number(item.unit_price || 0) * Number(item.quantity || 1))).toFixed(2) }}
                  </div>
                </div>

                <!-- Fallback if no items array -->
                <div v-if="!tab.items || tab.items.length === 0" class="text-muted font-size-11 fst-italic py-0.5">
                  {{ tab.active_items_count || 0 }} item(s) on tab
                </div>
              </div>

              <!-- Fog Fade Overlay: gently fades the 2nd/3rd item into the card background -->
              <div
                v-if="!expandedTabs[tab.id] && (tab.items?.length > 2)"
                class="position-absolute bottom-0 start-0 end-0 pointer-events-none"
                style="height: 28px; background: linear-gradient(to bottom, rgba(240, 246, 255, 0) 0%, rgba(240, 246, 255, 0.75) 40%, #f0f6ff 100%);"
              ></div>
            </div>

            <!-- Items Count & Show Details Toggle -->
            <div class="d-flex justify-content-between align-items-center font-size-11 pt-0.5 mb-2.5" style="color: #64748b;">
              <span class="fw-medium">
                {{ (tab.items?.length || tab.active_items_count || 1) }} item{{ (tab.items?.length || tab.active_items_count || 1) === 1 ? '' : 's' }}
              </span>

              <button
                v-if="tab.items && tab.items.length > 2"
                type="button"
                class="btn btn-link p-0 fw-semibold font-size-11 text-decoration-none d-inline-flex align-items-center gap-1 shadow-none"
                style="color: #1d4ed8;"
                @click="toggleExpandTab(tab.id)"
              >
                <span>{{ expandedTabs[tab.id] ? 'Hide details' : 'Show details' }}</span>
                <i :class="expandedTabs[tab.id] ? 'bx bx-chevron-up' : 'bx bx-chevron-down'"></i>
              </button>
            </div>

            <!-- Action Button: Solid Vibrant Blue -->
            <button
              type="button"
              class="btn btn-primary w-100 fw-semibold font-size-12 py-2 rounded-2 d-flex align-items-center justify-content-center gap-1.5 shadow-none"
              style="background-color: #1d4ed8; border: none;"
              :disabled="saving || cartItemsCount === 0"
              @click="appendToExistingTab(tab)"
            >
              <i class="bx bx-plus font-size-15"></i>
              <span>Add {{ cartItemsCount }} item{{ cartItemsCount === 1 ? '' : 's' }} to this tab</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Customer Profile, Classification & Progress Modal -->
  <CustomerProfileModal
    modal-id="saveTabCustomerProfileModal"
    :customer="selectedCustomer"
  />
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import customersApi from '@/api/customers';
import tablesApi from '@/api/tables';
import tabsApi from '@/api/tabs';
import SelectSearchBox from '@/components/SelectSearchBox.vue';
import CustomerProfileModal from './CustomerProfileModal.vue';
import SelectedCustomerCard from './SelectedCustomerCard.vue';
import { useCartStore } from '@/stores/cart';
import { useShiftStore } from '@/stores/shift';

const props = defineProps({
  cart: { type: Array, default: () => [] },
  cartTotal: { type: Number, default: 0 },
  cartItemsCount: { type: Number, default: 0 },
  isTabAsideOpen: { type: Boolean, default: false }
});

const emit = defineEmits(['saved', 'cancel']);

const cartStore = useCartStore();
const shiftStore = useShiftStore();

const offcanvasRef = ref(null);
const customerPickerRef = ref(null);
const newTab = ref(true);
const saving = ref(false);

// Form
const form = ref({
  tab_name: '',
  table_id: null,
  customer_id: null,
  guest_count: 1,
  notes: '',
});

// Data
const customers = ref([]);
const availableTables = ref([]);
const openTabs = ref([]);
const selectedCustomer = ref(null);
const searchQuery = ref('');
const existingTabFilter = ref('');
const showCustomerDropdown = ref(false);
const loadingCustomers = ref(false);
const loadingOpenTabs = ref(false);
const expandedTabs = ref({});

const toggleExpandTab = (tabId) => {
  expandedTabs.value[tabId] = !expandedTabs.value[tabId];
};

const formatRelativeTime = (timestamp) => {
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
};

let searchTimer = null;

const formatMoney = (val) => {
  return Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'KES' });
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
};

const isDirty = computed(() => {
  return (
    form.value.tab_name.trim() !== '' ||
    form.value.table_id !== null ||
    form.value.customer_id !== null ||
    form.value.notes.trim() !== ''
  );
});

const canSave = computed(() => {
  return props.cart.length > 0;
});

const tableOptions = computed(() => {
  return availableTables.value.map((tbl) => ({
    label: tbl.table_number ? `Table ${tbl.table_number}${tbl.name ? ' - ' + tbl.name : ''}` : (tbl.name || 'Table'),
    value: tbl.id,
  }));
});

const formatLastSeen = (val) => {
  if (!val) {
    const now = new Date();
    return now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 8);
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};

const customerOpenTabs = computed(() => {
  if (!selectedCustomer.value?.id) return [];
  return openTabs.value.filter((t) => t.customer_id === selectedCustomer.value.id);
});

const customerUnpaidBillsCount = computed(() => {
  if (customerOpenTabs.value.length > 0) return customerOpenTabs.value.length;
  if (Number(selectedCustomer.value?.outstanding_balance || 0) > 0) return 1;
  return 0;
});

const customerOutstandingDebt = computed(() => {
  if (customerOpenTabs.value.length > 0) {
    return customerOpenTabs.value.reduce(
      (sum, t) => sum + Number(t.balance_due ?? t.total_amount ?? 0),
      0
    );
  }
  return Number(selectedCustomer.value?.outstanding_balance || 0);
});

const riskBadgeConfig = computed(() => {
  const tier = selectedCustomer.value?.risk_tier || 'new';
  if (tier === 'watch') {
    return {
      label: 'WATCH',
      icon: 'mdi mdi-alert-outline',
      class: 'bg-warning-subtle text-warning-emphasis'
    };
  }
  if (tier === 'trusted') {
    return {
      label: 'TRUSTED',
      icon: 'mdi mdi-check-decagram',
      class: 'bg-success-subtle text-success'
    };
  }
  if (tier === 'reliable') {
    return {
      label: 'RELIABLE',
      icon: 'mdi mdi-check-circle',
      class: 'bg-info-subtle text-info'
    };
  }
  if (tier === 'high_risk') {
    return {
      label: 'BLOCKED',
      icon: 'mdi mdi-alert-octagon',
      class: 'bg-danger-subtle text-danger'
    };
  }
  return {
    label: 'NEW',
    icon: 'mdi mdi-clock-outline',
    class: 'bg-secondary-subtle text-secondary'
  };
});

function switchToExistingTabs() {
  newTab.value = false;
  if (selectedCustomer.value?.name) {
    existingTabFilter.value = selectedCustomer.value.name;
  }
}

const getCustomerRecommendation = (c) => {
  if (!c) return { title: 'Standard Profile', message: 'Regular customer. Standard checkout and tab rules apply.' };
  if (c.risk_tier === 'new' || (!c.bills_issued_count && c.risk_tier !== 'high_risk')) {
    return {
      title: 'New Customer (Unverified)',
      message: 'First-time patron with no prior settlement record. Cash or mobile payment upon order is recommended; manager verification required for open tabs.'
    };
  }
  if (c.risk_tier === 'high_risk') {
    return {
      title: 'Credit Blocked',
      message: 'This customer has unpaid bills or default history. Running tabs are disabled; full upfront payment required.'
    };
  }
  if (c.risk_tier === 'watch') {
    return {
      title: 'Watch List',
      message: 'Active credit exposure or delayed settlement history. Keep tab within conservative limits or take partial deposit.'
    };
  }
  if (c.risk_tier === 'trusted') {
    return {
      title: 'Trusted Patron',
      message: 'Excellent settlement history. Approved for open running tabs and deferred checkout.'
    };
  }
  return {
    title: 'Regular Patron',
    message: 'Established settlement record. Standard checkout and open tab limits apply.'
  };
};

const filteredOpenTabs = computed(() => {
  if (!existingTabFilter.value.trim()) return openTabs.value;
  const q = existingTabFilter.value.toLowerCase();
  return openTabs.value.filter((t) => {
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.tab_number && t.tab_number.toLowerCase().includes(q)) ||
      (t.customer?.name && t.customer.name.toLowerCase().includes(q)) ||
      (t.table?.table_number && t.table.table_number.toLowerCase().includes(q))
    );
  });
});

function handleSearchInput() {
  loadingCustomers.value = true;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadCustomers();
  }, 350);
}

async function loadCustomers() {
  try {
    loadingCustomers.value = true;
    const params = { limit: 50 };
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }
    const res = await customersApi.list(params);
    customers.value = res.data?.data || [];
  } catch (err) {
    console.error('Failed to load customers:', err);
  } finally {
    loadingCustomers.value = false;
  }
}

async function loadTables() {
  try {
    const res = await tablesApi.list({ status: 'available' });
    availableTables.value = res.data?.data || [];
  } catch (err) {
    console.error('Failed to load tables:', err);
  }
}

async function loadOpenTabs() {
  try {
    loadingOpenTabs.value = true;
    const branchId =
      shiftStore.activeShift?.branch_id ||
      shiftStore.selectedBranchId ||
      (shiftStore.branches?.length ? (shiftStore.branches.find((b) => b.is_main)?.id || shiftStore.branches[0].id) : null) ||
      null;
    const params = { status: 'open' };
    if (branchId) params.branch_id = branchId;
    const res = await tabsApi.list(params);
    openTabs.value = res.data?.data || [];
  } catch (err) {
    console.error('Failed to load open tabs:', err);
  } finally {
    loadingOpenTabs.value = false;
  }
}

function selectCustomer(contact) {
  form.value.customer_id = contact.id;
  selectedCustomer.value = contact;
  searchQuery.value = contact.name;
  showCustomerDropdown.value = false;
  cartStore.setCustomer(contact);

  // Auto-fill sensible tab name if empty
  if (!form.value.tab_name.trim()) {
    form.value.tab_name = `${contact.name}'s Tab`;
  }
}

function clearSelectedCustomer() {
  form.value.customer_id = null;
  selectedCustomer.value = null;
  searchQuery.value = '';
  cartStore.clearCustomer();
}

function openCustomerProfileModal() {
  if (!selectedCustomer.value) return;
  const el = document.getElementById('saveTabCustomerProfileModal');
  if (el && window.bootstrap?.Modal) {
    const modal = window.bootstrap.Modal.getOrCreateInstance(el);
    modal.show();
  }
}

function onTableChange() {
  const tbl = availableTables.value.find((t) => t.id === form.value.table_id);
  if (tbl) {
    cartStore.setTable(tbl);
    if (!form.value.tab_name.trim() || form.value.tab_name.startsWith('Table ')) {
      form.value.tab_name = `Table ${tbl.table_number}`;
    }
  } else {
    cartStore.clearTable();
  }
}

function resetForm() {
  form.value = {
    tab_name: '',
    table_id: null,
    customer_id: null,
    guest_count: 1,
    notes: '',
  };
  selectedCustomer.value = null;
  searchQuery.value = '';
}

async function saveTab() {
  if (!canSave.value) {
    if (props.cart.length === 0) {
      alert('Please add at least one item to the cart before saving a tab.');
    }
    return;
  }
  saving.value = true;

  try {
    const pickedTable = availableTables.value.find(
      (t) => t.id === form.value.table_id
    );
    const tableNumber = pickedTable?.table_number ?? null;

    // Sensible fallback name if cashier left it blank
    const fallbackName = selectedCustomer.value
      ? `${selectedCustomer.value.name}'s Tab`
      : pickedTable
      ? `Table ${pickedTable.table_number}`
      : 'Open Tab';
    const finalName = form.value.tab_name.trim() || fallbackName;

    const branchId =
      shiftStore.activeShift?.branch_id ||
      shiftStore.selectedBranchId ||
      (shiftStore.branches?.length ? (shiftStore.branches.find((b) => b.is_main)?.id || shiftStore.branches[0].id) : null) ||
      6;

    const payload = {
      branch_id: Number(branchId),
      shift_id: shiftStore.activeShiftId || shiftStore.activeShift?.id || null,
      customer_id: form.value.customer_id || null,
      table_id: form.value.table_id || null,
      table_number: tableNumber,
      name: finalName,
      guest_count: parseInt(form.value.guest_count) || 1,
      notes: form.value.notes || '',
      discount_amount: cartStore.discountAmount || 0,
      delivery_fee: cartStore.deliveryFee || 0,
      items: props.cart.map((i) => ({
        product_id: i.product?.id || i.id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        tax_rate: i.tax_rate || 0,
        discount_amount: i.discount_amount || 0,
        notes: i.notes || '',
      })),
    };

    const res = await tabsApi.open(payload);
    const openedTab = res.data?.data || res.data;

    await loadOpenTabs();

    // Close offcanvas
    closeOffcanvas();

    // Clear cart and reset form
    cartStore.clearCart();
    resetForm();

    emit('saved', openedTab);
  } catch (err) {
    console.error('Failed to open tab:', err);
    alert(err?.response?.data?.message || 'Failed to save tab. Please check shift and try again.');
  } finally {
    saving.value = false;
  }
}

async function appendToExistingTab(tab) {
  if (props.cart.length === 0) return;
  saving.value = true;

  try {
    const items = props.cart.map((i) => ({
      product_id: i.product?.id || i.id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      tax_rate: i.tax_rate || 0,
      discount_amount: i.discount_amount || 0,
      notes: i.notes || '',
    }));

    await tabsApi.addItems(tab.id, items);

    closeOffcanvas();
    cartStore.clearCart();
    emit('saved', tab);
  } catch (err) {
    console.error('Failed to append to tab:', err);
    alert(err?.response?.data?.message || 'Failed to append to existing tab.');
  } finally {
    saving.value = false;
  }
}

function closeOffcanvas() {
  const asideEl = document.getElementById('saveTabAside');
  if (asideEl && window.bootstrap?.Offcanvas) {
    const instance = window.bootstrap.Offcanvas.getInstance(asideEl);
    if (instance) instance.hide();
  }
}

function handleClickOutside(event) {
  if (customerPickerRef.value && !customerPickerRef.value.contains(event.target)) {
    showCustomerDropdown.value = false;
  }
}

watch(
  () => props.isTabAsideOpen,
  (open) => {
    if (open) {
      loadCustomers();
      loadTables();
      loadOpenTabs();
      if (cartStore.customer) {
        selectCustomer(cartStore.customer);
      }
      if (cartStore.table) {
        form.value.table_id = cartStore.table.id;
        onTableChange();
      }
    }
  }
);

function handleOffcanvasShow() {
  loadCustomers();
  loadTables();
  loadOpenTabs();
  if (cartStore.customer) {
    selectCustomer(cartStore.customer);
  }
  if (cartStore.table) {
    form.value.table_id = cartStore.table.id;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  loadCustomers();
  loadTables();
  loadOpenTabs();

  const asideEl = document.getElementById('saveTabAside');
  if (asideEl) {
    asideEl.addEventListener('show.bs.offcanvas', handleOffcanvasShow);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  const asideEl = document.getElementById('saveTabAside');
  if (asideEl) {
    asideEl.removeEventListener('show.bs.offcanvas', handleOffcanvasShow);
  }
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.custom-popover {
  --bs-popover-border-color: #cccccc;
}

.nav-tabs-custom .nav-item .nav-link::after {
  height: 4px;
}

.progress-ring {
  --progress: 0%;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
  border-radius: 50%;
  background: conic-gradient(var(--bs-primary) var(--progress), #e9ecef var(--progress));
}

.loyalty-budge {
  position: absolute;
  bottom: -4px;
  right: -4px;
}

.badge-gold {
  background-color: #ffd700;
  color: #000;
}

.badge-silver {
  background-color: #c0c0c0;
  color: #000;
}

.badge-bronze {
  background-color: #cd7f32;
  color: #fff;
}

.badge-platinum {
  background-color: #e5e4e2;
  color: #000;
}

.badge-alt2 {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 600;
}

.text-right {
  text-align: right !important;
}
</style>
