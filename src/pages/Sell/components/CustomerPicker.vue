<template>
  <div class="customer-picker">
    <!-- Unified Customer Search Box (identical across Counter & SaveTabAside) -->
    <div class="search-box position-relative mb-2" ref="pickerRef">
      <div class="w-100 position-relative">
        <div class="d-flex align-items-stretch gap-2">
          <div class="input-group bg-light rounded pb-0 flex-nowrap flex-grow-1">
            <div class="flex-grow-1 position-relative">
              <Icon
                icon="ri:user-search-line"
                class="position-absolute top-50 translate-middle-y text-muted fs-5"
                style="left: 12px; pointer-events: none; z-index: 5;"
              />
              <input
                ref="searchInputRef"
                style="border-radius: 0px; padding-left: 38px; padding-right: 35px;"
                type="text"
                class="form-control bg-light rounded flex-grow-1"
                :placeholder="placeholder"
                spellcheck="false"
                v-model="searchQuery"
                @input="handleSearchInput"
                @focus="handleFocus"
              />
              <i
                v-if="searchQuery !== ''"
                title="Clear search"
                style="right: 12px; left: unset;"
                class="mdi mdi-close search-icon cursor-pointer fs-4 waves-effect"
                @click="clearSearch"
              ></i>
            </div>
          </div>

          <button
            type="button"
            class="btn btn-white text-nowrap d-inline-flex align-items-center gap-1 fw-semibold flex-shrink-0"
            title="Register New Customer"
            @click="triggerRegisterNew"
          >
            <Icon icon="ri:add-line" class="fs-5" />
            <span>New</span>
          </button>
        </div>

        <!-- Customer Search Dropdown -->
        <div
          v-if="showDropdown"
          class="w-100 rounded bg-white border shadow-sm position-absolute start-0 mt-1"
          style="z-index: 1060; max-height: 290px; overflow-y: auto;"
        >
          <div class="p-2">
            <ul class="list-group list-group-flush mb-0">
              <!-- Register New Customer -->
              <li
                class="list-group-item list-group-item-action cursor-pointer p-2 rounded mb-1"
                @click="triggerRegisterNew"
              >
                <div class="d-flex justify-content-between align-items-center">
                  <div class="d-flex align-items-center gap-2">
                    <span class="bg-primary-subtle text-primary btn-sm p-1 px-2 rounded">
                      <i class="mdi mdi-plus fs-5"></i>
                    </span>
                    <span class="fw-bold font-size-13 text-primary">Register New Customer</span>
                  </div>
                  <i class="bx bx-chevron-right fs-5 text-muted"></i>
                </div>
              </li>

              <!-- Walk-in Customer (Default) -->
              <li
                class="list-group-item list-group-item-action border rounded cursor-pointer mb-1 p-2"
                :class="{ 'border-primary border-2 bg-primary-subtle': isWalkInSelected }"
                @click="selectWalkIn"
              >
                <div class="d-flex align-items-center justify-content-between gap-2">
                  <div class="d-flex align-items-center gap-2 min-w-0">
                    <div class="avatar-xs flex-shrink-0">
                      <span class="avatar-title rounded-circle bg-light text-secondary font-size-14 border">
                        <i class="mdi mdi-account-outline"></i>
                      </span>
                    </div>
                    <div class="min-w-0">
                      <p class="m-0 fw-bold text-dark font-size-13 text-truncate">Walk-in Customer</p>
                      <small class="text-muted font-size-11">Default counter customer</small>
                    </div>
                  </div>
                  <input
                    type="radio"
                    class="form-check-input flex-shrink-0"
                    :checked="isWalkInSelected"
                  />
                </div>
              </li>

              <!-- Skeleton Loading -->
              <li v-if="isLoading" class="list-group-item border-0 py-2">
                <div v-for="n in 3" :key="`cust-sk-${n}`" class="d-flex align-items-center gap-2 mb-2">
                  <SkeletonLoader type="circle" width="32px" height="32px" />
                  <div class="flex-grow-1">
                    <SkeletonLoader type="text" :lines="1" height="12px" width="60%" />
                    <SkeletonLoader type="text" :lines="1" height="10px" width="40%" class="mt-1" />
                  </div>
                </div>
              </li>

              <!-- Empty Search Result -->
              <li
                v-else-if="customers.length === 0 && searchQuery.trim()"
                class="list-group-item text-center text-muted py-3 border-0 font-size-13"
              >
                No customers found for "<strong>{{ searchQuery }}</strong>"
              </li>

              <!-- Registered Customers -->
              <li
                v-for="contact in customers"
                :key="contact.id"
                class="list-group-item list-group-item-action border rounded cursor-pointer mb-1 p-2"
                :class="{ 'border-primary border-2 bg-primary-subtle': String(selectedCustomer?.id) === String(contact.id) }"
                @click="selectCustomer(contact)"
              >
                <div class="d-flex align-items-center justify-content-between gap-2">
                  <div class="d-flex align-items-center gap-2 min-w-0">
                    <div class="avatar-xs flex-shrink-0">
                      <span class="avatar-title rounded-circle bg-dark-subtle text-dark font-size-12 fw-bold">
                        {{ getInitials(contact.name) }}
                      </span>
                    </div>
                    <div class="min-w-0">
                      <p class="m-0 fw-bold text-dark font-size-13 text-truncate">{{ contact.name }}</p>
                      <small class="text-muted font-size-11 text-truncate d-block">
                        {{ contact.phone || 'No phone' }}{{ contact.email ? ` · ${contact.email}` : '' }}
                      </small>
                    </div>
                  </div>
                  <input
                    type="radio"
                    class="form-check-input flex-shrink-0"
                    :checked="String(selectedCustomer?.id) === String(contact.id)"
                  />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Compact Expandable Selected Customer Card (Always visible; defaults to Walk-in) -->
    <SelectedCustomerCard
      :customer="selectedCustomer"
      :unpaid-bills-count="unpaidBillsCount"
      :outstanding-amount="outstandingAmount"
      :show-callout="showCallout"
      :allow-change="allowChange"
      @change-customer="selectWalkIn"
      @open-profile="$emit('open-profile', $event)"
      @view-bills="$emit('view-bills', $event)"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { Icon } from "@iconify/vue";
import customersApi from "@/api/customers";
import { WALK_IN_CUSTOMER } from "@/stores/cart";
import SkeletonLoader from "@/components/Loaders/SkeletonLoader.vue";
import SelectedCustomerCard from "./SelectedCustomerCard.vue";

const props = defineProps({
  modelValue: { type: Object, default: null },
  placeholder: { type: String, default: "Search Existing Customers..." },
  unpaidBillsCount: { type: Number, default: null },
  outstandingAmount: { type: Number, default: null },
  showCallout: { type: Boolean, default: true },
  allowChange: { type: Boolean, default: true },
  deferModalOpen: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:modelValue",
  "select",
  "open-profile",
  "view-bills",
  "register-new",
]);

const pickerRef = ref(null);
const searchInputRef = ref(null);
const searchQuery = ref("");
const showDropdown = ref(false);
const isLoading = ref(false);
const customers = ref([]);
let hasLoadedOnce = false;
let searchTimer = null;

const selectedCustomer = computed(() =>
  props.modelValue && props.modelValue.id ? props.modelValue : WALK_IN_CUSTOMER
);

const isWalkInSelected = computed(() => !selectedCustomer.value?.id);

function getInitials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function normalizeCustomer(c) {
  return {
    ...c,
    name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.name || "Customer",
    phone: c.phone || "",
    email: c.email || "",
    loyalty_tier: c.loyalty_tier || "Silver",
    loyalty_points: c.loyalty_points_balance ?? c.loyalty_points ?? 0,
    risk_tier: c.effective_risk_tier || c.risk_tier || "new",
    effective_risk_tier: c.effective_risk_tier || c.risk_tier || "new",
    open_tabs_count: Number(c.open_tabs_count || 0),
    overdue_tabs_count: Number(c.overdue_tabs_count || 0),
    active_tab_balance: Number(c.active_tab_balance || 0),
  };
}

async function fetchCustomers(query = "") {
  isLoading.value = true;
  try {
    const params = { per_page: 20 };
    if (query.trim()) params.search = query.trim();
    const res = await customersApi.list(params);
    const list = res.data?.data?.data || res.data?.data || res.data || [];
    customers.value = Array.isArray(list) ? list.map(normalizeCustomer) : [];
    hasLoadedOnce = true;
  } catch (err) {
    console.warn("Could not load customers:", err);
  } finally {
    isLoading.value = false;
  }
}

function handleFocus() {
  showDropdown.value = true;
  if (!hasLoadedOnce) {
    fetchCustomers(searchQuery.value);
  }
}

function handleSearchInput() {
  showDropdown.value = true;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    fetchCustomers(searchQuery.value);
  }, 250);
}

function clearSearch() {
  searchQuery.value = "";
  fetchCustomers("");
}

function selectWalkIn() {
  const walkIn = { ...WALK_IN_CUSTOMER };
  searchQuery.value = "";
  showDropdown.value = false;
  emit("update:modelValue", walkIn);
  emit("select", walkIn);
}

function selectCustomer(contact) {
  const normalized = normalizeCustomer(contact);
  searchQuery.value = "";
  showDropdown.value = false;
  emit("update:modelValue", normalized);
  emit("select", normalized);
}

function triggerRegisterNew() {
  showDropdown.value = false;
  emit("register-new");
  if (props.deferModalOpen) return;
  const modalEl = document.getElementById("addCustomerModal");
  if (modalEl && window.bootstrap?.Modal) {
    window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
}

function handleClickOutside(event) {
  if (pickerRef.value && !pickerRef.value.contains(event.target)) {
    showDropdown.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  clearTimeout(searchTimer);
});
</script>
