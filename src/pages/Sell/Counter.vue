<template>
  <div class="container-fluid px-3 py-2">
    <!-- Non-blocking Counter Shift Notice (if not currently on duty) -->
    <div
      v-if="!shiftStore.isOnDuty"
      class="alert alert-warning border border-warning-subtle d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 mb-3 flat-card"
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
      class="d-flex align-items-center justify-content-between mb-2 px-3 py-2 bg-light border rounded flat-card font-size-12"
    >
      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
          <i class="bx bx-check-circle me-1 font-size-13"></i> Active Shift: {{ shiftStore.activeShiftNumber }}
        </span>
        <span class="text-muted">Branch: <strong>{{ currentBranchName }}</strong></span>
      </div>
      <div class="d-flex align-items-center gap-2 text-muted">
        <span>Float: <strong>KES {{ Number(shiftStore.openingFloat).toLocaleString() }}</strong></span>
        <span>•</span>
        <span>{{ shiftStore.activeMembersCount }} cashier{{ shiftStore.activeMembersCount === 1 ? '' : 's' }} on duty</span>
      </div>
    </div>

    <!-- Main POS Grid -->
    <div class="row g-3">
      <!-- LEFT: Product Catalogue -->
      <div class="col-12 col-lg-7 col-xl-8">
        <div class="card flat-card border mb-3">
          <!-- Toolbar: Search & View Switcher -->
          <div class="card-body border-bottom p-3">
            <div class="row g-2 align-items-center">
              <div class="col">
                <div class="position-relative">
                  <input
                    v-model="searchQuery"
                    type="text"
                    class="form-control ps-4"
                    placeholder="Search product name, SKU, or scan barcode..."
                    @input="handleSearch"
                  />
                  <i class="bx bx-search position-absolute top-50 start-0 translate-middle-y ms-2 text-muted fs-5"></i>
                  <button
                    v-if="searchQuery"
                    type="button"
                    class="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-1 p-0 text-muted"
                    @click="clearSearch"
                  >
                    <i class="bx bx-x fs-4"></i>
                  </button>
                </div>
              </div>

              <!-- View Switcher -->
              <div class="col-auto d-flex align-items-center gap-2">
                <div class="btn-group" role="group">
                  <button
                    type="button"
                    class="btn btn-sm px-3 py-1 font-size-13 d-inline-flex align-items-center justify-content-center"
                    :class="viewMode === 'grid' ? 'btn-primary' : 'btn-white'"
                    title="Grid view"
                    @click="viewMode = 'grid'"
                  >
                    <i class="bx bx-grid-alt fs-5"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm px-3 py-1 font-size-13 d-inline-flex align-items-center justify-content-center"
                    :class="viewMode === 'compact' ? 'btn-primary' : 'btn-white'"
                    title="Compact grid"
                    @click="viewMode = 'compact'"
                  >
                    <i class="bx bx-grid fs-5"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm px-3 py-1 font-size-13 d-inline-flex align-items-center justify-content-center"
                    :class="viewMode === 'list' ? 'btn-primary' : 'btn-white'"
                    title="List view"
                    @click="viewMode = 'list'"
                  >
                    <i class="bx bx-list-ul fs-5"></i>
                  </button>
                </div>

                <button
                  type="button"
                  class="btn btn-sm btn-white px-2 py-1 font-size-13 d-inline-flex align-items-center justify-content-center"
                  title="Refresh catalog"
                  @click="fetchProducts"
                >
                  <i class="bx bx-refresh fs-5" :class="{ 'bx-spin': isLoadingProducts }"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Category Chips Horizontal Bar -->
          <div class="card-body py-2 px-3 border-bottom bg-light">
            <div
              class="d-flex gap-2 overflow-auto category-scroll py-1"
              style="scrollbar-width: none; -ms-overflow-style: none;"
            >
              <button
                type="button"
                class="btn btn-sm text-nowrap rounded-pill px-3"
                :class="selectedCategory === '' ? 'btn-dark text-white' : 'btn-white'"
                @click="selectCategory('')"
              >
                All Products <span class="opacity-75">({{ totalProductsCount }})</span>
              </button>
              <button
                v-for="cat in categories"
                :key="cat.name"
                type="button"
                class="btn btn-sm text-nowrap rounded-pill px-3"
                :class="selectedCategory === cat.name ? 'btn-dark text-white' : 'btn-white'"
                @click="selectCategory(cat.name)"
              >
                {{ cat.name }} <span class="opacity-75">({{ cat.count }})</span>
              </button>
            </div>
          </div>

          <!-- Product Cards Grid / List Area -->
          <div class="card-body p-3" style="min-height: 520px; max-height: calc(100vh - 270px); overflow-y: auto;">
            <!-- Loading Skeletons -->
            <div v-if="isLoadingProducts" class="row g-3">
              <div v-for="i in 8" :key="i" class="col-6 col-md-4 col-xl-3">
                <div class="p-3 bg-light rounded border flat-card text-center">
                  <div class="bg-white rounded mb-2" style="height: 110px;"></div>
                  <div class="bg-white rounded mb-1" style="height: 14px; width: 80%;"></div>
                  <div class="bg-white rounded" style="height: 16px; width: 50%;"></div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-else-if="filteredProducts.length === 0"
              class="d-flex flex-column align-items-center justify-content-center py-5 text-center"
            >
              <div class="tone-chip tone-chip-primary p-3 mb-3" style="width: 64px; height: 64px;">
                <i class="ri-shopping-basket-line fs-2"></i>
              </div>
              <h5 class="fw-bold text-dark mb-1">No products found</h5>
              <p class="text-muted font-size-13 mb-3">
                {{ searchQuery ? `No matches for "${searchQuery}" in this category.` : 'No products available for this branch.' }}
              </p>
              <button v-if="searchQuery" type="button" class="btn btn-sm btn-white" @click="clearSearch">
                Clear Search Filter
              </button>
            </div>

            <!-- GRID VIEW (Default) -->
            <div v-else-if="viewMode === 'grid'" class="row g-3">
              <div
                v-for="product in filteredProducts"
                :key="product.id"
                class="col-6 col-md-4 col-xl-3"
              >
                <div
                  class="card h-100 p-2 border rounded flat-card cursor-pointer product-card position-relative transition"
                  :class="{ 'border-primary border-2 bg-primary-subtle': cartStore.getItemQuantity(product.id) > 0 }"
                  @click="handleProductClick(product)"
                >
                  <!-- Cart Quantity Badge -->
                  <span
                    v-if="cartStore.getItemQuantity(product.id) > 0"
                    class="position-absolute top-0 end-0 translate-middle-y me-2 badge rounded-pill bg-primary font-size-12 px-2 py-1"
                    style="z-index: 10;"
                  >
                    {{ cartStore.getItemQuantity(product.id) }} in cart
                  </span>

                  <!-- Thumbnail -->
                  <div
                    class="d-flex align-items-center justify-content-center bg-light rounded mb-2 overflow-hidden"
                    style="height: 120px;"
                  >
                    <img
                      v-if="product.image_url"
                      :src="product.image_url"
                      class="img-fluid"
                      style="max-height: 110px; object-fit: contain;"
                      :alt="product.name"
                    />
                    <i v-else class="ri-image-line fs-1 text-muted opacity-50"></i>
                  </div>

                  <!-- Details -->
                  <div class="px-1 d-flex flex-column justify-content-between flex-grow-1">
                    <h6 class="font-size-13 fw-bold text-dark text-truncate mb-2" :title="product.name">
                      {{ product.name }}
                    </h6>
                    <div class="mt-auto pt-2 border-top border-light">
                      <div class="d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <span class="font-size-14 fw-bold text-dark text-nowrap">
                          {{ formatMoney(product.selling_price) }}
                        </span>
                        <span
                          class="badge font-size-10 px-2 py-1 text-nowrap"
                          :class="product.stock_on_hand > 0 ? 'bg-light text-muted border' : 'bg-danger-subtle text-danger border border-danger-subtle'"
                        >
                          {{ product.stock_on_hand > 0 ? `${product.stock_on_hand} in stock` : 'Out of stock' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- COMPACT GRID VIEW -->
            <div v-else-if="viewMode === 'compact'" class="row g-2">
              <div
                v-for="product in filteredProducts"
                :key="product.id"
                class="col-6 col-sm-4 col-md-3 col-xl-2"
              >
                <div
                  class="card h-100 p-2 border rounded flat-card cursor-pointer product-card position-relative"
                  :class="{ 'border-primary border-2 bg-primary-subtle': cartStore.getItemQuantity(product.id) > 0 }"
                  @click="handleProductClick(product)"
                >
                  <span
                    v-if="cartStore.getItemQuantity(product.id) > 0"
                    class="position-absolute top-0 end-0 badge rounded-pill bg-primary font-size-10 px-1"
                    style="z-index: 10;"
                  >
                    {{ cartStore.getItemQuantity(product.id) }}
                  </span>

                  <div
                    class="d-flex align-items-center justify-content-center bg-light rounded mb-1 overflow-hidden"
                    style="height: 70px;"
                  >
                    <img
                      v-if="product.image_url"
                      :src="product.image_url"
                      class="img-fluid"
                      style="max-height: 65px; object-fit: contain;"
                      :alt="product.name"
                    />
                    <i v-else class="ri-image-line fs-3 text-muted opacity-50"></i>
                  </div>

                  <div class="text-truncate font-size-12 fw-semibold text-dark mb-1" :title="product.name">
                    {{ product.name }}
                  </div>
                  <div class="fw-bold font-size-13 text-dark">
                    {{ formatMoney(product.selling_price) }}
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
                        <i v-else class="ri-image-line text-muted"></i>
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
                        :class="product.stock_on_hand > 0 ? 'bg-light text-muted border' : 'bg-danger-subtle text-danger border'"
                      >
                        {{ product.stock_on_hand }}
                      </span>
                    </td>
                    <td class="text-end fw-bold text-dark">
                      {{ formatMoney(product.selling_price) }}
                    </td>
                    <td class="text-center">
                      <div v-if="cartStore.getItemQuantity(product.id) > 0" class="d-inline-flex align-items-center gap-1">
                        <button type="button" class="btn btn-sm btn-white px-2 py-0" @click.stop="cartStore.decreaseQty(product.id)">
                          <i class="bx bx-minus"></i>
                        </button>
                        <span class="fw-bold px-2">{{ cartStore.getItemQuantity(product.id) }}</span>
                        <button type="button" class="btn btn-sm btn-white px-2 py-0" @click.stop="cartStore.increaseQty(product.id)">
                          <i class="bx bx-plus"></i>
                        </button>
                      </div>
                      <button
                        v-else
                        type="button"
                        class="btn btn-sm btn-white d-inline-flex align-items-center gap-1"
                        @click="handleProductClick(product)"
                      >
                        <i class="bx bx-cart"></i>
                        <span>Add</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Sticky Cart Panel -->
      <div class="col-12 col-lg-5 col-xl-4">
        <div class="card flat-card border position-sticky" style="top: 15px;">
          <!-- Cart Header -->
          <div class="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
              <div class="tone-chip tone-chip-primary">
                <i class="bx bx-cart fs-5"></i>
              </div>
              <h5 class="card-title font-size-15 fw-bold mb-0">
                Cart ({{ cartStore.itemCount }})
              </h5>
            </div>
            <button
              v-if="!cartStore.isEmpty"
              type="button"
              class="btn btn-sm btn-white text-danger border-0 d-inline-flex align-items-center gap-1"
              @click="cartStore.clearCart"
            >
              <i class="bx bx-trash"></i>
              <span>Clear</span>
            </button>
          </div>

          <!-- Customer Bar -->
          <div class="card-body p-2 border-bottom bg-light">
            <div v-if="cartStore.customer" class="p-2 bg-white rounded border d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2 text-truncate me-2">
                <div class="tone-chip tone-chip-emerald" style="width: 32px; height: 32px;">
                  <i class="bx bx-user-check fs-5"></i>
                </div>
                <div class="text-truncate">
                  <div class="fw-bold text-dark font-size-13 text-truncate">{{ cartStore.customer.name }}</div>
                  <div class="text-muted font-size-11">
                    {{ cartStore.customer.phone || 'No phone' }} • {{ cartStore.customer.loyalty_points }} pts
                  </div>
                </div>
              </div>
              <button type="button" class="btn btn-sm btn-white p-1 text-muted" title="Change Customer" @click="cartStore.clearCustomer">
                <i class="bx bx-x fs-5"></i>
              </button>
            </div>

            <!-- Customer Picker Dropdown / Quick Add -->
            <div v-else class="d-flex gap-2">
              <div class="flex-grow-1 position-relative">
                <input
                  v-model="customerSearch"
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="Select Customer or Walk-in..."
                  @focus="showCustomerDropdown = true"
                  @input="searchCustomers"
                />
                <!-- Dropdown results -->
                <div
                  v-if="showCustomerDropdown && (customersList.length > 0 || isSearchingCustomers)"
                  class="position-absolute start-0 end-0 mt-1 bg-white border rounded shadow-sm p-1"
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
                class="btn btn-sm btn-white d-inline-flex align-items-center gap-1 text-nowrap"
                title="Register Customer"
                @click="openCustomerModal"
              >
                <i class="bx bx-user-plus"></i>
                <span class="d-none d-xl-inline">New</span>
              </button>
            </div>
          </div>

          <!-- Cart Line Items -->
          <div
            class="card-body p-0"
            style="min-height: 240px; max-height: 380px; overflow-y: auto;"
          >
            <!-- Empty Cart Notice -->
            <div
              v-if="cartStore.isEmpty"
              class="d-flex flex-column align-items-center justify-content-center text-center p-4 text-muted"
              style="min-height: 240px;"
            >
              <i class="bx bx-shopping-bag fs-1 opacity-25 mb-2"></i>
              <p class="mb-1 fw-semibold text-dark font-size-14">Your cart is empty</p>
              <small class="text-muted">Tap products on the left to add items to this sale</small>
            </div>

            <!-- Items List -->
            <ul v-else class="list-group list-group-flush mb-0 font-size-13">
              <li
                v-for="item in cartStore.items"
                :key="item.id"
                class="list-group-item p-3 border-bottom d-flex align-items-center justify-content-between"
              >
                <div class="d-flex align-items-center gap-2 text-truncate me-2" style="max-width: 60%;">
                  <div
                    class="rounded bg-light d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
                    style="width: 38px; height: 38px;"
                  >
                    <img
                      v-if="item.product.image_url"
                      :src="item.product.image_url"
                      style="max-height: 34px; object-fit: contain;"
                    />
                    <i v-else class="bx bx-image text-muted"></i>
                  </div>
                  <div class="text-truncate">
                    <strong class="text-dark d-block text-truncate">{{ item.product.name }}</strong>
                    <span class="text-muted font-size-12">{{ formatMoney(item.unit_price) }}</span>
                  </div>
                </div>

                <div class="d-flex align-items-center gap-2">
                  <!-- Stepper -->
                  <div class="d-inline-flex align-items-center border rounded bg-white">
                    <button
                      type="button"
                      class="btn btn-sm btn-link text-dark p-1 px-2 border-0"
                      @click="cartStore.decreaseQty(item.id)"
                    >
                      <i class="bx bx-minus font-size-12"></i>
                    </button>
                    <span class="fw-bold font-size-13 px-1" style="min-width: 24px; text-align: center;">
                      {{ item.quantity }}
                    </span>
                    <button
                      type="button"
                      class="btn btn-sm btn-link text-dark p-1 px-2 border-0"
                      @click="cartStore.increaseQty(item.id)"
                    >
                      <i class="bx bx-plus font-size-12"></i>
                    </button>
                  </div>

                  <!-- Line Total -->
                  <span class="fw-bold text-dark font-size-14" style="min-width: 65px; text-align: right;">
                    {{ formatMoney(item.quantity * item.unit_price) }}
                  </span>

                  <!-- Delete Item -->
                  <button
                    type="button"
                    class="btn btn-sm btn-link text-danger p-0 ms-1"
                    title="Remove item"
                    @click="cartStore.removeItem(item.id)"
                  >
                    <i class="bx bx-x-circle fs-5"></i>
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <!-- Billing Summary -->
          <div class="card-footer bg-light border-top p-3">
            <div class="d-flex justify-content-between font-size-13 text-muted mb-1">
              <span>Subtotal</span>
              <span>{{ formatMoney(cartStore.subtotal) }}</span>
            </div>
            <div v-if="cartStore.discountAmount > 0" class="d-flex justify-content-between font-size-13 text-danger mb-1">
              <span>Discount</span>
              <span>-{{ formatMoney(cartStore.discountAmount) }}</span>
            </div>
            <div v-if="cartStore.taxAmount > 0" class="d-flex justify-content-between font-size-13 text-muted mb-1">
              <span>VAT / Tax</span>
              <span>{{ formatMoney(cartStore.taxAmount) }}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
              <span class="fw-bold text-dark font-size-14">TOTAL AMOUNT</span>
              <span class="fw-bold text-dark font-size-18">{{ formatMoney(cartStore.totalAmount) }}</span>
            </div>

            <!-- Checkout Action Buttons (Clean single-line wrap-resistant layout) -->
            <div class="row g-2 mt-2">
              <div class="col-6">
                <button
                  type="button"
                  class="btn btn-white w-100 font-size-13 fw-semibold text-nowrap py-2 d-inline-flex align-items-center justify-content-center gap-1"
                  :disabled="cartStore.isEmpty"
                  @click="handleSaveTabNotice"
                >
                  <i class="bx bx-bookmark"></i>
                  <span>Save Tab</span>
                </button>
              </div>
              <div class="col-6">
                <button
                  type="button"
                  class="btn btn-primary w-100 font-size-13 fw-bold text-nowrap py-2 d-inline-flex align-items-center justify-content-center gap-1"
                  :disabled="cartStore.isEmpty"
                  @click="handleProceedToCheckout"
                >
                  <i class="bx bx-credit-card"></i>
                  <span>Checkout</span>
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

    <!-- Shift Action Modal (reused from Shifts system) -->
    <ShiftActionModal @shift-updated="onShiftUpdated" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import productsApi from '@/api/products';
import customersApi from '@/api/customers';
import { useCartStore } from '@/stores/cart';
import { useShiftStore } from '@/stores/shift';

import CustomerQuickModal from './components/CustomerQuickModal.vue';
import PaymentModal from './components/PaymentModal.vue';
import ReceiptModal from './components/ReceiptModal.vue';
import ShiftActionModal from '@/components/Shifts/ShiftActionModal.vue';

const cartStore = useCartStore();
const shiftStore = useShiftStore();

const viewMode = ref('grid'); // 'grid' | 'compact' | 'list'
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
    const res = await productsApi.list();
    const rawData = res.data?.data || res.data || [];
    products.value = rawData.map((p) => {
      let catName = 'General';
      if (p.category && typeof p.category === 'object' && p.category.name) {
        catName = p.category.name;
      } else if (typeof p.category === 'string' && p.category) {
        catName = p.category;
      } else if (p.category_name) {
        catName = p.category_name;
      }

      return {
        id: p.id,
        name: p.name || p.productname,
        sku: p.sku || '',
        barcode: p.barcode || '',
        selling_price: Number(p.selling_price || p.sellingPrice || 0),
        stock_on_hand: p.stock_on_hand ?? p.stockLevel ?? 0,
        image_url: p.image_url || p.image || null,
        category: catName,
        tax_rate: Number(p.tax_rate || 0),
      };
    });

    // Extract categories
    const catMap = {};
    products.value.forEach((p) => {
      const cat = p.category || 'General';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    categories.value = Object.keys(catMap).map((k) => ({ name: k, count: catMap[k] }));
  } catch (err) {
    console.error('Error loading products for POS:', err);
  } finally {
    isLoadingProducts.value = false;
  }
};

const handleSearch = () => {
  // Reactive via computed
};

const clearSearch = () => {
  searchQuery.value = '';
};

const selectCategory = (catName) => {
  selectedCategory.value = catName;
};

const handleProductClick = (product) => {
  cartStore.addItem(product, 1);
};

// Customer Typeahead
let searchTimeout = null;
const searchCustomers = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    if (!customerSearch.value.trim()) {
      customersList.value = [];
      return;
    }
    isSearchingCustomers.value = true;
    try {
      const res = await customersApi.list({ search: customerSearch.value.trim(), limit: 5 });
      customersList.value = res.data?.data || res.data || [];
    } catch (e) {
      console.warn('Customer search failed:', e);
    } finally {
      isSearchingCustomers.value = false;
    }
  }, 250);
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
  // Check if cashier is on duty in an active shift
  if (!shiftStore.isOnDuty) {
    // Intercept checkout: prompt to open or join shift without clearing cart!
    shiftStore.openModal();
    return;
  }

  // Active shift confirmed: proceed directly to payment modal
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

const handleSaveTabNotice = () => {
  alert('Customer Tabs & Running Bills are scheduled for Phase 3. You can complete the sale directly or keep the cart ready.');
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
});
</script>

<style scoped>
.product-card {
  transition: transform 0.12s ease, border-color 0.12s ease;
}
.product-card:hover {
  border-color: #adb5bd;
}
.cursor-pointer {
  cursor: pointer;
}
.hover-bg:hover {
  background-color: #f8f9fa;
}
</style>
