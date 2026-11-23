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
    class="offcanvas offcanvas-end w-25"
    tabindex="-1"
    id="saveTabAside"
    ref="offcanvasRef"
  >
    <!-- Header -->
    <div class="offcanvas-header border-bottom py-0 pr-0">
      <div class="d-flex align-items-center gap-2">
        <button
          type="button"
          class="btn btn-white position-relative p-0 avatar-sm rounded-circle"
          data-bs-dismiss="offcanvas"
          aria-label="Close"
        >
          <span class="avatar-title bg-transparent text-reset">
            <i class="bx bx-arrow-back font-size-22"></i>
          </span>
        </button>
        <div class="d-flex flex-column py-3">
          <h5 class="mb-0 fw-bold">Save As open bill</h5>
          <p class="m-0 text-muted"><small>Save this sale as a tab for your customer.</small></p>
        </div>
      </div>
      <button type="button" class="btn-close text-reset d-none" data-bs-dismiss="offcanvas"></button>
    </div>

    <!-- Navigation Tabs: New vs Existing Tab -->
    <div class="offcanvas-header border-bottom p-0">
      <ul class="nav nav-tabs nav-tabs-custom nav-justified w-100" role="tablist">
        <li @click="newTab = true" class="nav-item cursor-pointer" role="presentation">
          <a
            class="nav-link py-3 cursor-pointer"
            :class="newTab ? 'active bg-primary-muted fw-bold' : ''"
          >
            <span class="d-block d-sm-none"><i class="fas fa-home"></i></span>
            <span class="d-none d-sm-block">New Tab/Bill</span>
          </a>
        </li>
        <li @click="newTab = false" class="nav-item cursor-pointer" role="presentation">
          <a
            class="nav-link py-3 cursor-pointer"
            :class="!newTab ? 'active bg-primary-muted fw-bold' : ''"
          >
            <span class="d-block d-sm-none"><i class="far fa-user"></i></span>
            <span class="d-none d-sm-block">Existing Tab/Bill ({{ openTabs.length }})</span>
          </a>
        </li>
      </ul>
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
            <div class="col-12 mb-3">
              <label class="form-label fw-bold font-size-13 text-dark">
                Bill Name/Label (Optional)
              </label>
              <input
                type="text"
                class="form-control"
                placeholder="e.g. John-Table 4 (Optional)"
                v-model="form.tab_name"
              />
              <small class="text-muted font-size-12">Leave blank to auto-generate from customer or table</small>
            </div>

            <!-- Guest Count -->
            <div class="col-12 mb-3">
              <label class="form-label fw-bold font-size-13 text-dark">
                Number of Guests <span class="text-danger fw-bold">*</span>
              </label>
              <input
                type="text"
                class="form-control"
                placeholder="e.g. 4"
                v-model="form.guest_count"
                pattern="^[0-9]+$"
                required
              />
              <small class="text-muted font-size-12">Enter the number of guests for this table</small>
            </div>

            <!-- Notes -->
            <div class="col-12 mb-3">
              <label class="form-label fw-bold font-size-13 text-dark">Notes (Optional)</label>
              <textarea
                class="form-control"
                rows="3"
                placeholder="Start typing..."
                v-model="form.notes"
              ></textarea>
            </div>

            <!-- Dine-In badge -->
            <div class="col-12 mt-3">
              <div class="p-3 text-muted text-center border border-1 fw-bold border-dark-subtle bg-light rounded d-flex gap-2 justify-content-center align-items-center">
                <span class="bx bx-info-circle fs-3"></span>
                <div>This tab will be created as Dine-In</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Billing Summary -->
        <div class="p-3">
          <div class="p-3 pb-1 bg-success-muted rounded border border-2 border-success-subtle">
            <h4 class="card-title d-flex gap-2 align-items-center">
              <i class="dripicons-tags fs-5"></i>
              <span>Billing Summary</span>
            </h4>
            <table class="table text-uppercase fs-6 table-sm border-success m-0">
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
                <tr class="fs-4 text-black">
                  <th>Sub Total</th>
                  <th class="text-right">{{ formatMoney(cartTotal) }}</th>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-3 d-flex flex-column gap-3">
          <!-- Save as Tab — primary action -->
          <button
            type="submit"
            :disabled="!canSave || saving"
            class="btn btn-primary waves-effect btn-lg fw-bold flex-grow-1"
          >
            <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status"></span>
            <template v-if="saving">Saving...</template>
            <template v-if="!saving">
              <i class="mdi mdi-bookmark-outline fs-3 align-middle me-2"></i>
              Save As Tab
            </template>
          </button>

          <!-- Cancel — dismisses offcanvas -->
          <button
            type="button"
            data-bs-dismiss="offcanvas"
            class="btn btn-light waves-effect fw-bold flex-nowrap d-flex align-items-center justify-content-center btn-lg"
            @click="resetForm"
          >
            <i class="mdi mdi-close fs-4 align-middle me-2"></i>
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- Offcanvas Body: EXISTING TABS -->
    <div v-else class="offcanvas-body p-3">
      <div class="mb-3">
        <input
          type="text"
          class="form-control"
          placeholder="Filter open tabs by name, customer, table..."
          v-model="existingTabFilter"
        />
      </div>

      <div v-if="loadingOpenTabs" class="text-center py-4">
        <div class="spinner-border text-primary spinner-border-sm mb-2" role="status"></div>
        <p class="text-muted font-size-13 mb-0">Loading open tabs...</p>
      </div>

      <div v-else-if="filteredOpenTabs.length === 0" class="text-center py-5 text-muted">
        <i class="bx bx-receipt fs-1 opacity-50 mb-2"></i>
        <h6 class="fw-semibold text-dark">No open tabs found</h6>
        <p class="font-size-13">Create a new tab or check another shift.</p>
      </div>

      <div v-else class="d-flex flex-column gap-2">
        <div
          v-for="tab in filteredOpenTabs"
          :key="tab.id"
          class="card border mb-2 shadow-none"
        >
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h6 class="fw-bold mb-0 text-dark">{{ tab.name || tab.tab_number }}</h6>
                <small class="text-muted font-size-12">
                  {{ tab.table ? `Table ${tab.table.table_number}` : 'No Table' }} ·
                  {{ tab.customer ? tab.customer.name : 'Walk-in' }}
                </small>
              </div>
              <span class="badge bg-warning font-size-11">OPEN</span>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="text-muted font-size-12">{{ tab.active_items_count || (tab.items ? tab.items.length : 0) }} items</span>
              <span class="fw-bold font-size-14 text-dark">{{ formatMoney(tab.total_amount) }}</span>
            </div>

            <button
              type="button"
              class="btn btn-sm btn-outline-primary w-100 fw-bold"
              :disabled="saving || cartItemsCount === 0"
              @click="appendToExistingTab(tab)"
            >
              <i class="bx bx-plus me-1"></i> Append Cart ({{ cartItemsCount }} items) to this Tab
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
