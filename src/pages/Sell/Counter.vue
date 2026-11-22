<template>
  <div class="container-fluid">
    <!-- Non-blocking Counter Shift Notice (if not currently on duty) -->
    <div
      v-if="!shiftStore.isOnDuty"
      class="alert alert-warning border border-warning-subtle d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 my-3"
      role="alert"
    >
      <div class="d-flex align-items-center gap-2">
        <i class="bx bx-info-circle fs-4 text-warning"></i>
        <div>
          <strong class="font-size-14 text-dark">Your counter isn't open yet.</strong>
          <span class="text-muted font-size-13 ms-1 d-none d-md-inline">
            You can browse products and prepare your cart, but you'll need an active shift before completing checkout.
          </span>
        </div>
      </div>
      <button
        type="button"
        class="btn btn-sm btn-primary text-nowrap d-inline-flex align-items-center gap-1 font-size-13 px-3 py-2"
        @click="openShiftModal"
      >
        <i class="bx bx-key font-size-16"></i>
        <span>Open Counter Shift</span>
      </button>
    </div>

    <!-- Active Shift Status Bar (if on duty) -->
    <div
      v-else
      class="d-flex align-items-center justify-content-between my-2 px-3 py-2 bg-light border rounded font-size-12"
    >
      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-success font-size-12 px-2 py-1">
          <i class="bx bx-check-circle me-1"></i> Active Shift: {{ shiftStore.activeShiftNumber }}
        </span>
        <span class="text-muted">Branch: <strong>{{ currentBranchName }}</strong></span>
      </div>
      <div class="d-flex align-items-center gap-2 text-muted">
        <span>Float: <strong>KES {{ Number(shiftStore.openingFloat).toLocaleString() }}</strong></span>
        <span>•</span>
        <span>{{ shiftStore.activeMembersCount }} cashier{{ shiftStore.activeMembersCount === 1 ? '' : 's' }} on duty</span>
      </div>
    </div>

    <!-- Main Layout: Row 8 cols (Products) + 4 cols (Cart) -->
    <div class="row justify-content-center">
      <div class="col-12">
        <div class="row">
          <!-- LEFT 7/8 COLS: PRODUCT CATALOGUE -->
          <div class="col-12 col-lg-7 col-xl-7 col-xxl-8">
            <div class="card">
              <!-- Top Toolbar: Search & Action Buttons -->
              <div class="card-body border-bottom">
                <div class="row">
                  <div class="col-12 gap-3 d-flex">
                    <div class="flex-grow-1">
                      <div class="search-box mb-0 me-0">
                        <div class="position-relative">
                          <form
                            @submit.prevent="handleSearchInput()"
                            class="input-group bg-light rounded pb-0 flex-nowrap"
                          >
                            <div class="flex-grow-1 position-relative">
                              <input
                                style="border-radius: 0px; padding-right: 35px;"
                                type="text"
                                class="form-control bg-light rounded flex-grow-1"
                                placeholder="Search products by name, SKU, or barcode..."
                                spellcheck="false"
                                v-model="searchQuery"
                                @input="handleSearchInput"
                              />
                              <i class="bx bx-search-alt search-icon fs-4"></i>
                              <i
                                v-if="searchQuery != ''"
                                title="Clear search"
                                style="right: 15px; left: unset;"
                                class="mdi mdi-close search-icon cursor-pointer fs-3 waves-effect"
                                @click="searchQuery = ''; handleSearchInput()"
                              ></i>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>

                    <!-- View Switcher & Refresh buttons -->
                    <div class="position-relative d-flex gap-2">
                      <div class="btn-group" role="group">
                        <button
                          type="button"
                          class="btn btn-light waves-effect"
                          :class="{ 'btn-dark text-white': viewMode === 'grid' }"
                          title="Grid view"
                          @click="viewMode = 'grid'"
                        >
                          <i class="bx bx-grid-alt fs-5"></i>
                        </button>
                        <button
                          type="button"
                          class="btn btn-light waves-effect"
                          :class="{ 'btn-dark text-white': viewMode === 'list' }"
                          title="List view"
                          @click="viewMode = 'list'"
                        >
                          <i class="bx bx-list-ul fs-5"></i>
                        </button>
                      </div>

                      <button
                        type="button"
                        class="btn btn-light waves-effect"
                        title="Refresh catalogue"
                        @click="fetchProducts"
                      >
                        <i class="bx bx-refresh fs-4" :class="{ 'bx-spin': isLoadingProducts }"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Category Pills Horizontal Scroll -->
              <div class="card-body py-2 border-bottom">
                <div class="row mb-0">
                  <div class="col-12">
                    <div
                      class="d-flex flex-row flex-nowrap py-2 category-scroll gap-2"
                      style="overflow-x: auto; overflow-y: hidden; scrollbar-width: none; -ms-overflow-style: none;"
                    >
                      <button
                        type="button"
                        class="btn text-capitalize btn-sm fw-bold btn-light btn-rounded waves-effect px-3 text-nowrap flex-shrink-0"
                        :class="{ 'btn-dark text-light': selectedCategory === '' }"
                        @click="selectCategory('')"
                      >
                        All <span class="opacity-50">({{ totalProductsCount }})</span>
                      </button>

                      <button
                        v-for="cat in categories"
                        :key="cat.name"
                        type="button"
                        class="btn btn-sm fw-bold btn-light btn-rounded text-capitalize waves-effect px-3 text-nowrap flex-shrink-0"
                        :class="{ 'btn-dark text-light': selectedCategory === cat.name }"
                        @click="selectCategory(cat.name)"
                      >
                        {{ cat.name }} <span class="opacity-50">({{ cat.count }})</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Product Grid Cards Body -->
              <div class="card-body">
                <div v-if="isLoadingProducts" class="row">
                  <div class="col-12 text-center py-5">
                    <div class="spinner-border text-primary spinner-border-sm mb-2" role="status"></div>
                    <p class="text-muted font-size-13 mb-0">Loading products...</p>
                  </div>
                </div>

                <div v-else-if="filteredProducts.length === 0" class="row">
                  <div class="col-12 text-center py-5 text-muted">
                    <i class="bx bx-search fs-1 opacity-50 mb-2"></i>
                    <h5 class="fw-semibold text-dark font-size-15">No products found</h5>
                    <p class="font-size-13">Try adjusting your search query or selected category.</p>
                  </div>
                </div>

                <!-- GRID VIEW (Direct match to POS Make a sale) -->
                <div v-else-if="viewMode === 'grid'" class="row">
                  <div
                    v-for="product in filteredProducts"
                    :key="product.id"
                    @click="handleProductClick(product)"
                    class="col-6 col-sm-6 col-md-6 col-lg-6 col-xl-4 col-xxl-3 mb-4 position-relative"
                  >
                    <!-- Quantity Badge -->
                    <div v-if="cartStore.getItemQuantity(product.id) > 0">
                      <div
                        class="avatar-xs mx-auto position-absolute"
                        style="z-index: 30; right: 0px; top: -15px;"
                      >
                        <span class="avatar-title rounded-circle bg-success font-size-14 fw-bold text-white shadow-none">
                          {{ cartStore.getItemQuantity(product.id) }}
                        </span>
                      </div>
                    </div>

                    <!-- Card Body -->
                    <div
                      class="p-3 bg-light rounded border cursor-pointer waves-effect w-100 h-100 d-flex flex-column justify-content-between"
                      :class="[
                        cartStore.getItemQuantity(product.id) > 0 ? 'border-success border-2' : ''
                      ]"
                    >
                      <div>
                        <div
                          style="height: 160px;"
                          class="img-cont d-flex align-items-center justify-content-center overflow-hidden rounded w-100 bg-white"
                        >
                          <img
                            v-if="product.image_url"
                            class="img h-auto"
                            style="width: 100%; max-height: 150px; object-fit: contain;"
                            :src="product.image_url"
                            :alt="product.name"
                          />
                          <i v-else class="bx bx-package fs-1 text-muted opacity-50"></i>
                        </div>
                      </div>

                      <div class="pt-4">
                        <h5 class="text-capitalize text-truncate mb-0 font-size-14 fw-semibold text-dark" :title="product.name">
                          {{ product.name || "Unknown" }}
                        </h5>
                        <p class="mb-2">
                          <small class="text-muted">{{ product.size_label || product.sku || product.barcode || '' }}</small>
                        </p>
                        <div class="d-flex gap-1 align-items-center justify-content-between">
                          <div>
                            <h5 class="my-0 font-size-13 font-size-md-14 fw-bold text-dark text-nowrap">
                              {{ formatMoney(product.selling_price) }}
                            </h5>
                          </div>
                          <span class="text-end font-size-11 text-nowrap">
                            <span :class="product.stock_on_hand > 0 ? 'text-muted' : 'text-danger fw-semibold'">
                              {{ product.stock_on_hand > 0 ? `${product.stock_on_hand - cartStore.getItemQuantity(product.id)} In stock` : 'Out of stock' }}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- LIST VIEW -->
                <div v-else-if="viewMode === 'list'" class="table-responsive">
                  <table class="table table-hover align-middle mb-0 font-size-13">
                    <thead class="table-light">
                      <tr>
                        <th style="width: 50px;"></th>
                        <th>Product</th>
                        <th>SKU / Barcode</th>
                        <th>Stock</th>
                        <th class="text-end">Price</th>
                        <th class="text-center" style="width: 140px;">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="product in filteredProducts" :key="product.id">
                        <td>
                          <div class="rounded bg-light d-flex align-items-center justify-content-center overflow-hidden" style="width: 36px; height: 36px;">
                            <img v-if="product.image_url" :src="product.image_url" style="max-height: 32px; object-fit: contain;" />
                            <i v-else class="bx bx-package text-muted"></i>
                          </div>
                        </td>
                        <td>
                          <strong class="text-dark">{{ product.name }}</strong>
                        </td>
                        <td class="text-muted font-monospace font-size-12">
                          {{ product.sku || product.barcode || '-' }}
                        </td>
                        <td>
                          <span
                            class="badge font-size-11"
                            :class="product.stock_on_hand > 0 ? 'bg-light text-muted border' : 'bg-danger text-white'"
                          >
                            {{ product.stock_on_hand > 0 ? `${product.stock_on_hand - cartStore.getItemQuantity(product.id)} in stock` : 'Out of stock' }}
                          </span>
                        </td>
                        <td class="text-end fw-bold text-dark">
                          {{ formatMoney(product.selling_price) }}
                        </td>
                        <td class="text-center">
                          <button
                            type="button"
                            class="btn btn-sm btn-primary px-3"
                            @click="handleProductClick(product)"
                          >
                            <i class="bx bx-plus me-1"></i> Add
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT 5/4 COLS: STICKY CART (Direct match to POS Make a sale) -->
          <div class="col-12 col-lg-5 col-xl-5 col-xxl-4">
            <div class="card position-sticky" style="top: 20px;">
              <!-- Cart Header -->
              <div class="card-header bg-white border-bottom">
                <div class="d-flex justify-content-between align-items-center">
                  <h4 class="card-title d-flex align-items-center gap-2 mb-0 font-size-15">
                    <i class="bx bx-cart fs-4"></i>
                    <span>Cart ({{ cartStore.itemCount }})</span>
                  </h4>
                  <div>
                    <button
                      :disabled="cartStore.isEmpty"
                      type="button"
                      @click="cartStore.clearCart()"
                      class="btn btn-soft-danger waves-effect fw-bold flex-nowrap d-flex btn-sm gap-1 align-items-center"
                    >
                      <i class="bx bx-trash fs-6"></i> Clear cart
                    </button>
                  </div>
                </div>
              </div>

              <!-- Table & Customer Bar -->
              <div class="card-body py-2 px-3 bg-light border-bottom">
                <!-- Assigned Table Pill -->
                <div
                  v-if="cartStore.table"
                  class="mb-2 p-2 bg-white rounded border d-flex align-items-center justify-content-between font-size-12"
                >
                  <div class="d-flex align-items-center gap-2">
                    <i class="bx bx-restaurant text-primary fs-5"></i>
                    <div>
                      <strong>Table {{ cartStore.table.table_number }}</strong>
                      <span v-if="cartStore.table.label" class="text-muted ms-1">({{ cartStore.table.label }})</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-light p-1"
                    title="Remove Table"
                    @click="cartStore.clearTable"
                  >
                    <i class="bx bx-x fs-6"></i>
                  </button>
                </div>

                <!-- Customer Info -->
                <div
                  v-if="cartStore.customer"
                  class="p-2 bg-white rounded border d-flex align-items-center justify-content-between font-size-12"
                >
                  <div class="d-flex align-items-center gap-2 text-truncate me-2">
                    <i class="bx bx-user-check text-success fs-5"></i>
                    <div class="text-truncate">
                      <strong class="text-dark">{{ cartStore.customer.name }}</strong>
                      <div class="text-muted font-size-11">
                        {{ cartStore.customer.phone || 'No phone' }} • {{ cartStore.customer.loyalty_points }} pts
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-light p-1"
                    title="Change Customer"
                    @click="cartStore.clearCustomer"
                  >
                    <i class="bx bx-x fs-6"></i>
                  </button>
                </div>

                <!-- Customer Picker Input -->
                <div v-else class="d-flex gap-2">
                  <div class="flex-grow-1 position-relative">
                    <input
                      v-model="customerSearch"
                      type="text"
                      class="form-control form-control-sm bg-white"
                      placeholder="Search Customer or Walk-in..."
                      @focus="showCustomerDropdown = true"
                      @input="searchCustomers"
                    />
                    <!-- Dropdown search results -->
                    <div
                      v-if="showCustomerDropdown && (customersList.length > 0 || isSearchingCustomers)"
                      class="position-absolute start-0 end-0 mt-1 bg-white border rounded p-1"
                      style="z-index: 1000; max-height: 220px; overflow-y: auto;"
                    >
                      <div
                        class="p-2 hover-bg cursor-pointer rounded font-size-12 text-muted border-bottom"
                        @click="selectWalkIn"
                      >
                        <i class="bx bx-user me-1"></i> Walk-in Customer (Default)
                      </div>
                      <div
                        v-for="c in customersList"
                        :key="c.id"
                        class="p-2 hover-bg cursor-pointer rounded font-size-12 d-flex justify-content-between align-items-center"
                        @click="selectCustomer(c)"
                      >
                        <div>
                          <strong class="text-dark">{{ c.name }}</strong>
                          <div class="text-muted font-size-11">{{ c.phone || 'No phone' }}</div>
                        </div>
                        <span class="badge bg-light text-muted border font-size-10">{{ c.loyalty_points }} pts</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
                    title="Register Customer"
                    @click="openCustomerModal"
                  >
                    <i class="bx bx-user-plus"></i>
                    <span>New</span>
                  </button>
                </div>
              </div>

              <!-- Cart Line Items Container (Table styling from reference) -->
              <div class="card-body cart-container pt-1 px-3 py-2" style="height: 38vh; overflow-y: auto; overflow-x: hidden;">
                <table v-if="!cartStore.isEmpty" class="table table-sm align-middle mb-0 w-100" style="table-layout: auto;">
                  <tbody>
                    <tr
                      v-for="(cartItem, index) in cartStore.items"
                      :key="cartItem.id"
                      class="table-striped"
                    >
                      <td class="align-middle border-0 ps-0 pe-1">
                        <div class="d-flex gap-2 align-items-center">
                          <div
                            class="product-img bg-light d-flex align-items-center justify-content-center rounded overflow-hidden flex-shrink-0"
                            style="width: 36px; height: 36px; min-width: 36px;"
                          >
                            <img
                              v-if="cartItem.product.image_url"
                              :src="cartItem.product.image_url"
                              class="img-fluid"
                              style="width: 100%; height: 100%; object-fit: cover;"
                              alt=""
                            />
                            <i v-else class="bx bx-package text-muted"></i>
                          </div>
                          <div class="text-truncate" style="max-width: 110px;">
                            <p class="m-0 fw-bold text-black font-size-13 text-truncate">
                              {{ cartItem.product.name }}
                            </p>
                            <small class="text-muted">{{ formatMoney(cartItem.unit_price) }}</small>
                          </div>
                        </div>
                      </td>
                      <td class="align-middle border-0 px-0 text-center text-nowrap" style="width: 65px;">
                        <div class="d-flex align-items-center justify-content-center p-0 gap-1">
                          <span
                            @click="cartStore.decreaseQty(cartItem.id)"
                            class="waves-effect p-1 cursor-pointer"
                          >
                            <i class="mdi mdi-minus fs-6"></i>
                          </span>
                          <span class="fw-bold font-size-12 px-1">{{ cartItem.quantity }}</span>
                          <span
                            @click="cartStore.increaseQty(cartItem.id)"
                            class="waves-effect p-1 cursor-pointer"
                          >
                            <i class="mdi mdi-plus fs-6"></i>
                          </span>
                        </div>
                      </td>
                      <td class="align-middle text-end border-0 pe-0 ps-1 text-nowrap" style="width: 80px;">
                        <div class="d-flex align-items-center gap-1 justify-content-end text-end">
                          <span class="fw-bold font-size-12 text-dark">
                            {{ formatMoney(cartItem.quantity * cartItem.unit_price) }}
                          </span>
                          <span
                            title="Remove item from cart"
                            class="waves-effect p-1 d-flex cursor-pointer text-danger ms-1"
                            @click="cartStore.removeItem(cartItem.id)"
                          >
                            <i class="mdi mdi-close fs-5"></i>
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div
                  v-else
                  class="d-flex flex-column text-center align-items-center justify-content-center w-100 h-100 py-4 opacity-50"
                >
                  <i class="bx bx-shopping-bag fs-1 mb-2"></i>
                  <h5 class="fw-bold text-capitalize font-size-14 mb-0">Tap items to add to <br /> the order</h5>
                </div>
              </div>

              <!-- Sale Summary Box (From reference) -->
              <div class="card-body pt-2 border-top border-2">
                <div class="p-3 pb-1 bg-light rounded border">
                  <h5 class="card-title d-flex gap-2 align-items-center font-size-13 fw-bold mb-2">
                    <i class="bx bx-purchase-tag fs-5 text-primary"></i>
                    <span>Sale Summary</span>
                  </h5>
                  <table class="table text-uppercase fs-6 table-sm m-0 font-size-12">
                    <tbody>
                      <tr v-if="cartStore.discountAmount > 0" class="border-bottom">
                        <td>Discount</td>
                        <th class="text-end text-danger">-{{ formatMoney(cartStore.discountAmount) }}</th>
                      </tr>
                      <tr class="border-bottom">
                        <td>Subtotal</td>
                        <th class="text-end">{{ formatMoney(cartStore.subtotal) }}</th>
                      </tr>
                      <tr v-if="cartStore.taxAmount > 0" class="border-bottom">
                        <td>Tax / VAT</td>
                        <th class="text-end">{{ formatMoney(cartStore.taxAmount) }}</th>
                      </tr>
                      <tr class="fs-5 text-black">
                        <th class="pt-2">TOTAL</th>
                        <th class="text-end pt-2 fw-bold text-primary">{{ formatMoney(cartStore.totalAmount) }}</th>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Card Footer Action Buttons (From reference) -->
              <div class="card-footer pt-0 bg-white p-3 gap-2 d-flex justify-content-between align-items-center">
                <button
                  :disabled="cartStore.isEmpty"
                  type="button"
                  class="btn btn-light waves-effect fw-bold flex-nowrap d-flex align-items-center justify-content-center btn-lg border"
                  @click="openSaveTabModal"
                >
                  <i class="bx bx-time fs-4 align-middle me-1"></i>
                  Save as Open Bill
                </button>
                <button
                  :disabled="cartStore.isEmpty"
                  type="button"
                  class="btn btn-primary waves-effect btn-lg fw-bold flex-grow-1 d-flex align-items-center justify-content-center"
                  @click="handleProceedToCheckout"
                >
                  <i class="mdi mdi-check-all fs-4 align-middle me-1"></i>
                  Complete Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CustomerQuickModal ref="customerModalRef" @customer-created="onCustomerCreated" />

    <PaymentModal
      ref="paymentModalRef"
      :cart-items="cartStore.items"
      :total-amount="cartStore.totalAmount"
      :subtotal="cartStore.subtotal"
      :tax-amount="cartStore.taxAmount"
      :discount-amount="cartStore.discountAmount"
      :delivery-fee="cartStore.deliveryFee"
      :item-count="cartStore.itemCount"
      :customer="cartStore.customer"
      :channel="cartStore.channel"
      :fulfilment-method="cartStore.fulfilmentMethod"
      @sale-completed="onSaleCompleted"
    />

    <ReceiptModal
      ref="receiptModalRef"
      :order="completedOrder"
      @new-sale="cartStore.clearCart"
    />

    <SaveTabModal
      ref="saveTabModalRef"
      @tab-saved="onTabSaved"
    />

    <!-- Shift Action Modal (reused from Shifts system) -->
    <ShiftActionModal @shift-updated="onShiftUpdated" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import productsApi from '@/api/products';
import customersApi from '@/api/customers';
import tabsApi from '@/api/tabs';
import tablesApi from '@/api/tables';
import { useCartStore } from '@/stores/cart';
import { useShiftStore } from '@/stores/shift';

import CustomerQuickModal from './components/CustomerQuickModal.vue';
import PaymentModal from './components/PaymentModal.vue';
import ReceiptModal from './components/ReceiptModal.vue';
import SaveTabModal from './components/SaveTabModal.vue';
import ShiftActionModal from '@/components/Shifts/ShiftActionModal.vue';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const shiftStore = useShiftStore();

const saveTabModalRef = ref(null);
const viewMode = ref('grid'); // 'grid' | 'list'
const searchQuery = ref('');
const selectedCategory = ref('');
const isLoadingProducts = ref(false);
const products = ref([]);
const categories = ref([]);

// Customer search in cart
const customerSearch = ref('');
const showCustomerDropdown = ref(false);
const isSearchingCustomers = ref(false);
const customersList = ref([]);

// Completed order state for receipt modal
const completedOrder = ref(null);

const currentBranchName = computed(() => {
  const branch = shiftStore.branches.find((b) => b.id === shiftStore.selectedBranchId);
  return branch?.name || shiftStore.activeShift?.branch?.name || 'Main Branch';
});

const totalProductsCount = computed(() => products.value.length);

const filteredProducts = computed(() => {
  let list = products.value;

  if (selectedCategory.value) {
    list = list.filter((p) => p.category === selectedCategory.value || p.category_name === selectedCategory.value);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter((p) => {
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    });
  }

  return list;
});

const formatMoney = (val) => {
  return Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'KES' });
};

const fetchProducts = async () => {
  isLoadingProducts.value = true;
  try {
    const branchId = shiftStore.selectedBranchId || shiftStore.activeShift?.branch_id || null;
    const params = { per_page: 100 };
    if (branchId) params.branch_id = branchId;
    const res = await productsApi.list(params);
    const data = res.data?.data || res.data || [];
    products.value = data.map((p) => {
      const stock = Number(p.stock_on_hand ?? p.branch_stock ?? p.total_stock ?? p.stockLevel ?? 0);
      return {
        ...p,
        name: p.name || p.productname,
        selling_price: Number(p.selling_price || p.sellingPrice || 0),
        stock_on_hand: stock,
        stockLevel: stock,
        size_label: p.size_label || p.unit || '',
        category_name: typeof p.category === 'object' && p.category !== null ? p.category.name : (p.category || 'Uncategorized'),
      };
    });

    // Extract categories with counts
    const catMap = {};
    for (const p of products.value) {
      const cat = p.category_name || 'Uncategorized';
      catMap[cat] = (catMap[cat] || 0) + 1;
    }
    categories.value = Object.keys(catMap).map((k) => ({ name: k, count: catMap[k] }));
  } catch (err) {
    console.error('Failed to load products:', err);
  } finally {
    isLoadingProducts.value = false;
  }
};

const selectCategory = (catName) => {
  selectedCategory.value = catName;
};

let searchDebounce = null;
const handleSearchInput = () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    // reactive filter handles it
  }, 250);
};

const handleProductClick = (product) => {
  cartStore.addItem(product, 1);
};

// Customer Selection Logic
let customerSearchDebounce = null;
const searchCustomers = () => {
  clearTimeout(customerSearchDebounce);
  if (!customerSearch.value.trim()) {
    customersList.value = [];
    return;
  }
  isSearchingCustomers.value = true;
  customerSearchDebounce = setTimeout(async () => {
    try {
      const res = await customersApi.list({ search: customerSearch.value.trim() });
      const raw = res.data?.data || res.data || [];
      customersList.value = raw.map((c) => ({
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.name,
        phone: c.phone,
        loyalty_points: c.loyalty_points_balance || c.loyalty_points || 0,
      }));
    } catch (err) {
      console.error('Failed searching customers:', err);
    } finally {
      isSearchingCustomers.value = false;
    }
  }, 300);
};

const selectCustomer = (c) => {
  cartStore.setCustomer(c);
  customerSearch.value = '';
  showCustomerDropdown.value = false;
};

const selectWalkIn = () => {
  cartStore.clearCustomer();
  customerSearch.value = '';
  showCustomerDropdown.value = false;
};

const openCustomerModal = () => {
  showCustomerDropdown.value = false;
  if (window.bootstrap) {
    const el = document.getElementById('quickCustomerModal');
    if (el) {
      const m = new window.bootstrap.Modal(el);
      m.show();
    }
  }
};

const onCustomerCreated = (customer) => {
  cartStore.setCustomer(customer);
};

// Shift Interception Gate
const openShiftModal = () => {
  shiftStore.openModal();
};

const handleProceedToCheckout = () => {
  if (!shiftStore.isOnDuty) {
    shiftStore.openModal();
    return;
  }

  if (window.bootstrap) {
    const el = document.getElementById('paymentModal');
    if (el) {
      const m = new window.bootstrap.Modal(el);
      m.show();
    }
  }
};

const onShiftUpdated = () => {
  shiftStore.checkCurrentShift();
};

const openSaveTabModal = () => {
  saveTabModalRef.value?.open({
    branchId: shiftStore.selectedBranchId || shiftStore.activeShift?.branch_id || 4,
    shiftId: shiftStore.activeShift?.id || null,
  });
};

const onTabSaved = (savedTab) => {
  const viewTabs = confirm(`Tab ${savedTab.tab_number} (${savedTab.name}) saved successfully!\n\nWould you like to open the Open Tabs & Bills list?`);
  if (viewTabs) {
    router.push('/sell/tabs');
  }
};

const onSaleCompleted = (order) => {
  completedOrder.value = order;
  if (window.bootstrap) {
    const el = document.getElementById('receiptModal');
    if (el) {
      const m = new window.bootstrap.Modal(el);
      m.show();
    }
  }
};

onMounted(async () => {
  shiftStore.checkCurrentShift();
  fetchProducts();

  if (route.query.tab_id) {
    try {
      const res = await tabsApi.get(route.query.tab_id);
      if (res.data?.success && res.data?.data) {
        cartStore.loadTab(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load tab from query:', err);
    }
  }

  if (route.query.table_id) {
    try {
      const res = await tablesApi.list({ branch_id: shiftStore.selectedBranchId || 4 });
      if (res.data?.success && res.data?.data) {
        const found = res.data.data.find((t) => t.id === route.query.table_id);
        if (found) {
          cartStore.setTable(found);
        }
      }
    } catch (err) {
      console.error('Failed to load table from query:', err);
    }
  }
});
</script>

<style scoped>
.cart-container {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 transparent;
}

.cart-container::-webkit-scrollbar {
  width: 6px;
}

.cart-container::-webkit-scrollbar-track {
  background: transparent;
}

.cart-container::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 10px;
}

.cursor-pointer {
  cursor: pointer;
}

.hover-bg:hover {
  background-color: #f8f9fa;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}
</style>
