<template>
  <!-- Operational Shift Alert Banner (Only shown when cashier needs to join or open a shift) -->
  <Teleport to="#main-content-alert-slot">
    <!-- State 1: Active Shift Running in Branch, Cashier not yet on duty -->
    <HeaderAlertBanner
      v-if="!shiftStore.isOnDuty && shiftStore.hasActiveShift"
      tone="info"
      label="Counter Open"
      icon="mdi:account-arrow-right-outline"
      :title="`Shift ${shiftStore.activeShiftNumber} Active`"
      :message="`Shift is currently open for ${currentBranchName} (Float: ${formatMoney(shiftStore.openingFloat)} · ${shiftStore.activeMembersCount} staff active). Join this shift to ring up sales under your name.`"
      action-label="Join Counter Shift"
      action-icon="mdi:login"
      :busy="isJoiningShift"
      @action="handleDirectJoinShift"
      details-label="Shift Details"
      @details="openShiftModal"
    />

    <!-- State 2: No Active Shift Running (wait until initial shift check completes to avoid flash) -->
    <HeaderAlertBanner
      v-else-if="shiftStore.lastCheckedAt && !shiftStore.hasActiveShift"
      tone="warning"
      label="Shift Required"
      icon="mdi:alert-outline"
      title="Your counter isn't open yet"
      message="You can browse products and prepare your cart, but an active shift is required before completing checkout."
      action-label="Open Counter Shift"
      action-icon="mdi:key-outline"
      @action="openShiftModal"
    />
  </Teleport>

  <div class="container-fluid counter-pos-page">
    <!-- Main Layout: Left 8 cols (Tabs + Active Cart Counter + Products/Open Tabs) | Right 4 cols (Fixed Top-to-Bottom Cart) -->
    <div class="row g-3 align-items-start">
      <!-- LEFT COLS: HEADER TABS + ACTIVE CART COUNTER + PRODUCT CATALOGUE / OPEN TABS -->
      <div class="col-12 col-lg-8">
        <!-- Top Page Tabs Navigation (Products | Open Tabs) + Prominent Active Cart Counter to the left of Cart -->
        <div class="d-flex align-items-end justify-content-between gap-3 flex-wrap border-bottom mb-3">
          <nav class="page-tabs border-bottom-0 mb-0" role="tablist" aria-label="Counter selling sections">
            <button
              type="button"
              class="page-tab"
              :class="{ active: leftPanelTab === 'products' }"
              role="tab"
              :aria-selected="leftPanelTab === 'products'"
              @click="leftPanelTab = 'products'"
            >
              <Icon :icon="leftPanelTab === 'products' ? 'ri:store-2-fill' : 'ri:store-2-line'" class="fs-5" />
              <span>Products</span>
              <span class="badge rounded-pill font-size-11" :class="leftPanelTab === 'products' ? 'bg-primary text-white' : 'bg-light text-muted border'">
                {{ totalProductsCount }}
              </span>
            </button>

            <button
              type="button"
              class="page-tab"
              :class="{ active: leftPanelTab === 'tabs' }"
              role="tab"
              :aria-selected="leftPanelTab === 'tabs'"
              @click="switchToOpenTabs"
            >
              <Icon :icon="leftPanelTab === 'tabs' ? 'ri:bill-fill' : 'ri:bill-line'" class="fs-5" />
              <span>Open Tabs</span>
              <span class="badge rounded-pill font-size-11" :class="leftPanelTab === 'tabs' ? 'bg-primary text-white' : 'bg-light text-muted border'">
                {{ openTabs.length }}
              </span>
            </button>
          </nav>

          <!-- Prominent Active Cart Money Counter (positioned to the left of the Cart) -->
          <div
            class="header-cart-counter d-inline-flex align-items-center gap-3 px-3 py-1 rounded mb-2"
            :class="cartStore.isEditingTab ? 'is-tab-mode' : 'is-cart-mode'"
          >
            <div class="d-flex align-items-center gap-2">
              <span
                class="header-cart-icon d-inline-flex align-items-center justify-content-center rounded-circle"
                :class="cartStore.isEditingTab ? 'bg-primary text-white' : 'bg-success text-white'"
              >
                <Icon :icon="cartStore.isEditingTab ? 'ri:bill-fill' : 'ri:shopping-cart-2-fill'" class="fs-5" />
              </span>
              <div class="lh-sm">
                <div class="text-uppercase fw-bold font-size-10" :class="cartStore.isEditingTab ? 'text-primary' : 'text-success'" style="letter-spacing: 0.4px;">
                  {{ cartStore.isEditingTab ? 'Tab Balance Due' : 'Active Cart' }}
                </div>
                <div class="text-muted font-size-11">
                  {{ cartStore.itemCount }} item{{ cartStore.itemCount === 1 ? '' : 's' }}
                  <template v-if="cartStore.isEditingTab && cartStore.pendingTabAddedAmount > 0">
                    · <span class="text-primary fw-semibold">+{{ formatMoney(cartStore.pendingTabAddedAmount) }}</span>
                  </template>
                </div>
              </div>
            </div>
            <div
              class="header-cart-amount text-nowrap"
              :class="cartStore.isEditingTab ? 'text-primary' : (cartStore.totalAmount > 0 ? 'text-dark' : 'text-muted')"
            >
              {{ formatMoney(cartStore.isEditingTab ? cartStore.activeTabBalanceDue : cartStore.totalAmount) }}
            </div>
          </div>
        </div>

        <div class="card counter-main-card mb-0">
              <!-- Top Toolbar: Refresh (left) + Search + Create & View Switcher -->
              <div class="card-body border-bottom">
                <div class="row">
                  <div class="col-12 gap-2 d-flex align-items-center">
                    <!-- Refresh Button (to the left of the search bar) -->
                    <button
                      type="button"
                      class="btn btn-light waves-effect flex-shrink-0 d-inline-flex align-items-center justify-content-center"
                      :title="leftPanelTab === 'products' ? 'Refresh catalogue' : 'Refresh open tabs'"
                      @click="leftPanelTab === 'products' ? fetchProducts() : fetchOpenTabs(false)"
                    >
                      <i
                        class="mdi mdi-refresh fs-4"
                        :class="{ 'mdi-spin': leftPanelTab === 'products' ? isLoadingProducts : isLoadingOpenTabs }"
                      ></i>
                    </button>

                    <!-- Unified Search Box (Products or Open Tabs) -->
                    <div class="flex-grow-1 min-w-0">
                      <div class="search-box mb-0 me-0">
                        <div class="position-relative">
                          <form
                            v-if="leftPanelTab === 'products'"
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
                          <div v-else class="input-group bg-light rounded pb-0 flex-nowrap">
                            <div class="flex-grow-1 position-relative">
                              <input
                                style="border-radius: 0px; padding-right: 35px;"
                                type="text"
                                class="form-control bg-light rounded flex-grow-1"
                                placeholder="Search open tab, table, or customer..."
                                spellcheck="false"
                                v-model="openTabSearch"
                              />
                              <i class="bx bx-search-alt search-icon fs-4"></i>
                              <i
                                v-if="openTabSearch != ''"
                                title="Clear search"
                                style="right: 15px; left: unset;"
                                class="mdi mdi-close search-icon cursor-pointer fs-3 waves-effect"
                                @click="openTabSearch = ''"
                              ></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Create Dropdown (Matching Admin POS Reference) & View Switcher -->
                    <div class="position-relative d-flex gap-2 flex-shrink-0 align-items-stretch">
                      <!-- Create Dropdown (Add Item / Manage Products / Add Customer) -->
                      <div v-if="leftPanelTab === 'products'" class="dropdown">
                        <button
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          class="btn btn-primary d-inline-flex align-items-center justify-content-center fw-bold gap-2 flex-nowrap text-nowrap"
                        >
                          <i class="dripicons-plus fs-5 d-flex"></i>
                          <span class="d-none d-sm-inline">Create</span>
                          <i class="mdi mdi-chevron-down fs-5 d-flex"></i>
                        </button>
                        <div class="dropdown-menu dropdown-menu-end shadow-sm">
                          <router-link
                            class="dropdown-item d-flex align-items-center gap-2 py-2"
                            to="/products/add"
                          >
                            <Icon icon="ri:add-box-line" class="fs-5 text-primary" />
                            <span class="fw-medium">Add Item</span>
                          </router-link>
                          <router-link
                            class="dropdown-item d-flex align-items-center gap-2 py-2"
                            to="/products"
                          >
                            <Icon icon="ri:store-2-line" class="fs-5 text-muted" />
                            <span class="fw-medium">Manage Products</span>
                          </router-link>
                          <div class="dropdown-divider my-1"></div>
                          <button
                            type="button"
                            class="dropdown-item d-flex align-items-center gap-2 py-2"
                            @click="openCustomerModal"
                          >
                            <Icon icon="ri:user-add-line" class="fs-5 text-success" />
                            <span class="fw-medium">Add Customer</span>
                          </button>
                        </div>
                      </div>

                      <div v-if="leftPanelTab === 'products'" class="btn-group" role="group">
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

                      <template v-else>
                        <!-- Filter by Customer (PaySol dropdown button style) -->
                        <div v-if="openTabs.length > 0" class="position-relative d-none d-md-flex">
                          <button
                            class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2 text-nowrap"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <Icon icon="ri:contacts-line" class="fs-5" />
                            <span class="text-truncate" style="max-width: 110px;">{{ openTabCustomerLabel }}</span>
                            <i class="mdi mdi-chevron-down fs-5"></i>
                          </button>
                          <div class="dropdown-menu dropdown-menu-end p-2 shadow-sm" style="min-width: 230px; max-height: 280px; overflow-y: auto;">
                            <h6 class="dropdown-header">Filter by Customer</h6>
                            <a
                              href="javascript:void(0);"
                              class="dropdown-item"
                              :class="{ active: openTabCustomerFilter === 'all' }"
                              @click="openTabCustomerFilter = 'all'"
                            >
                              All Customers
                            </a>
                            <a
                              href="javascript:void(0);"
                              class="dropdown-item"
                              :class="{ active: openTabCustomerFilter === 'walkin' }"
                              @click="openTabCustomerFilter = 'walkin'"
                            >
                              Walk-in / No Customer
                            </a>
                            <div v-if="openTabCustomerOptions.length" class="dropdown-divider"></div>
                            <a
                              v-for="c in openTabCustomerOptions"
                              :key="c.id"
                              href="javascript:void(0);"
                              class="dropdown-item d-flex align-items-center gap-2"
                              :class="{ active: openTabCustomerFilter === c.id }"
                              @click="openTabCustomerFilter = c.id"
                            >
                              <span class="text-truncate">{{ c.name }}</span>
                              <span class="ms-auto text-muted small">{{ c.count }}</span>
                            </a>
                          </div>
                        </div>

                        <!-- Filter by Cashier / Staff (PaySol dropdown button style) -->
                        <div v-if="openTabs.length > 0" class="position-relative d-none d-xl-flex">
                          <button
                            class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2 text-nowrap"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <Icon icon="ri:user-line" class="fs-5" />
                            <span class="text-truncate" style="max-width: 105px;">{{ openTabCashierLabel }}</span>
                            <i class="mdi mdi-chevron-down fs-5"></i>
                          </button>
                          <div class="dropdown-menu dropdown-menu-end p-2 shadow-sm" style="min-width: 220px; max-height: 280px; overflow-y: auto;">
                            <h6 class="dropdown-header">Filter by Cashier</h6>
                            <a
                              href="javascript:void(0);"
                              class="dropdown-item"
                              :class="{ active: openTabCashierFilter === 'all' }"
                              @click="openTabCashierFilter = 'all'"
                            >
                              All Cashiers
                            </a>
                            <a
                              href="javascript:void(0);"
                              class="dropdown-item d-flex align-items-center gap-2"
                              :class="{ active: openTabCashierFilter === 'mine' }"
                              @click="openTabCashierFilter = 'mine'"
                            >
                              <span>Mine (You)</span>
                              <span class="ms-auto text-muted small">{{ tabFilterCounts.mine }}</span>
                            </a>
                            <div v-if="openTabCashierOptions.length" class="dropdown-divider"></div>
                            <a
                              v-for="u in openTabCashierOptions"
                              :key="u.id"
                              href="javascript:void(0);"
                              class="dropdown-item d-flex align-items-center gap-2"
                              :class="{ active: openTabCashierFilter === u.id }"
                              @click="openTabCashierFilter = u.id"
                            >
                              <span class="text-truncate">{{ u.name }}</span>
                              <span class="ms-auto text-muted small">{{ u.count }}</span>
                            </a>
                          </div>
                        </div>

                        <!-- Sort Open Tabs (PaySol dropdown button style) -->
                        <div v-if="openTabs.length > 0" class="position-relative d-none d-lg-flex">
                          <button
                            class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2 text-nowrap"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <Icon icon="ri:arrow-up-down-line" class="fs-5" />
                            <span>{{ openTabSortLabel }}</span>
                            <i class="mdi mdi-chevron-down fs-5"></i>
                          </button>
                          <div class="dropdown-menu dropdown-menu-end p-2 shadow-sm" style="min-width: 190px;">
                            <h6 class="dropdown-header">Sort Tabs</h6>
                            <a
                              href="javascript:void(0);"
                              class="dropdown-item"
                              :class="{ active: openTabSort === 'oldest' }"
                              @click="openTabSort = 'oldest'"
                            >
                              Oldest / Overdue
                            </a>
                            <a
                              href="javascript:void(0);"
                              class="dropdown-item"
                              :class="{ active: openTabSort === 'newest' }"
                              @click="openTabSort = 'newest'"
                            >
                              Newest First
                            </a>
                            <a
                              href="javascript:void(0);"
                              class="dropdown-item"
                              :class="{ active: openTabSort === 'highest' }"
                              @click="openTabSort = 'highest'"
                            >
                              Highest Balance
                            </a>
                          </div>
                        </div>

                        <router-link
                          to="/sell/tabs"
                          class="btn btn-outline-muted-primary d-flex align-items-center justify-content-center gap-2 fw-bold text-nowrap"
                          title="Open full Tabs & Bills management page"
                        >
                          <Icon icon="ri:external-link-line" class="fs-5" />
                          <span class="d-none d-md-inline">Manage All</span>
                        </router-link>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Open Tabs Urgency / Payment Sub-Bar (matches Products category pills strip) -->
              <div
                v-if="leftPanelTab === 'tabs' && openTabs.length > 0"
                class="px-3 py-2 border-bottom bg-white d-flex align-items-center justify-content-between gap-2 flex-wrap"
              >
                <div class="d-flex align-items-center flex-wrap gap-1">
                  <button
                    type="button"
                    class="btn btn-sm font-size-11 fw-semibold"
                    :class="openTabStatusFilter === 'all' ? 'btn-primary text-white' : 'btn-white border text-dark'"
                    @click="openTabStatusFilter = 'all'"
                  >
                    All ({{ openTabs.length }})
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm font-size-11 fw-semibold d-inline-flex align-items-center gap-1"
                    :class="openTabStatusFilter === 'overdue' ? 'btn-danger text-white' : 'btn-white border text-danger'"
                    @click="openTabStatusFilter = 'overdue'"
                  >
                    <Icon icon="ri:alarm-warning-line" />
                    <span>Overdue ({{ tabFilterCounts.overdue }})</span>
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm font-size-11 fw-semibold"
                    :class="openTabStatusFilter === 'warning' ? 'btn-warning text-dark' : 'btn-white border text-dark'"
                    @click="openTabStatusFilter = 'warning'"
                  >
                    Aging ({{ tabFilterCounts.warning }})
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm font-size-11 fw-semibold"
                    :class="openTabStatusFilter === 'fresh' ? 'btn-dark text-white' : 'btn-white border text-dark'"
                    @click="openTabStatusFilter = 'fresh'"
                  >
                    Fresh ({{ tabFilterCounts.fresh }})
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm font-size-11 fw-semibold"
                    :class="openTabStatusFilter === 'partial' ? 'btn-success text-white' : 'btn-white border text-success'"
                    @click="openTabStatusFilter = 'partial'"
                  >
                    Partial Paid ({{ tabFilterCounts.partial }})
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm font-size-11 fw-semibold d-inline-flex align-items-center gap-1"
                    :class="openTabCashierFilter === 'mine' ? 'btn-primary text-white' : 'btn-white border text-primary'"
                    @click="openTabCashierFilter = openTabCashierFilter === 'mine' ? 'all' : 'mine'"
                  >
                    <Icon icon="ri:user-star-line" />
                    <span>Mine ({{ tabFilterCounts.mine }})</span>
                  </button>
                </div>

                <button
                  v-if="hasActiveOpenTabFilters"
                  type="button"
                  class="btn btn-sm btn-link text-muted p-0 font-size-11 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                  @click="resetOpenTabFilters"
                >
                  <Icon icon="ri:close-line" />
                  <span>Reset filters</span>
                </button>
              </div>

              <!-- ==================== LEFT PANEL: OPEN TABS GRID ==================== -->
              <div v-if="leftPanelTab === 'tabs'" class="card-body">
                <!-- Skeleton Loading -->
                <div v-if="isLoadingOpenTabs && openTabs.length === 0" class="row g-3">
                  <div v-for="n in 6" :key="`left-tab-sk-${n}`" class="col-sm-6 col-xl-4">
                    <div class="p-3 rounded border bg-white h-100">
                      <div class="d-flex justify-content-between mb-2">
                        <SkeletonLoader type="text" :lines="1" height="15px" width="55%" />
                        <SkeletonLoader type="text" :lines="1" height="15px" width="28%" />
                      </div>
                      <SkeletonLoader type="text" :lines="2" height="11px" width="85%" class="mb-3" />
                      <SkeletonLoader type="text" :lines="1" height="12px" width="45%" />
                    </div>
                  </div>
                </div>

                <!-- Empty State -->
                <div v-else-if="filteredOpenTabs.length === 0" class="text-center py-5">
                  <Icon icon="ri:bill-line" class="text-muted opacity-25 mb-2" style="font-size: 88px;" />
                  <h5 class="fw-bold text-dark mb-1">
                    {{ openTabSearch ? 'No matching open tabs' : 'No open tabs right now' }}
                  </h5>
                  <p class="text-muted font-size-13 mb-3">
                    {{ openTabSearch ? 'Try another search keyword.' : 'Save an order as an Open Bill from the Cart to see it here.' }}
                  </p>
                  <button type="button" class="btn btn-primary" @click="leftPanelTab = 'products'">
                    Browse Products
                  </button>
                </div>

                <!-- Open Tabs 3-Column Card Grid -->
                <div v-else>
                  <!-- Joint Multi-Tab Settlement Strip (when 2+ tabs are shown, e.g. for a customer with multiple open tabs) -->
                  <div
                    v-if="filteredOpenTabs.length >= 2"
                    class="mb-3 p-3 rounded border d-flex align-items-center justify-content-between gap-2 flex-wrap"
                    style="background-color: #f8fafc; border-color: #cbd5e1 !important;"
                  >
                    <div class="d-flex align-items-center gap-2 min-w-0">
                      <Icon icon="ri:stack-line" class="text-primary fs-5 flex-shrink-0" />
                      <div class="min-w-0">
                        <div class="fw-bold font-size-13 text-dark">
                          {{ filteredOpenTabs.length }} Open Tabs
                          <span v-if="openTabSearch" class="fw-normal text-muted"> matching "{{ openTabSearch }}"</span>
                        </div>
                        <small class="text-muted font-size-11">
                          Combined balance: <strong class="text-dark">{{ formatMoney(filteredOpenTabsCombinedTotal) }}</strong> · Pay all in one checkout
                        </small>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="btn btn-sm btn-primary fw-semibold d-inline-flex align-items-center gap-1 flex-shrink-0"
                      @click="handleJointPaymentForShownTabs"
                    >
                      <Icon icon="ri:wallet-3-line" />
                      <span>Joint Payment ({{ filteredOpenTabs.length }} Tabs)</span>
                    </button>
                  </div>

                  <div class="row g-3">
                  <div v-for="tab in filteredOpenTabs" :key="tab.id" class="col-sm-6 col-xl-4">
                    <div
                      role="button"
                      tabindex="0"
                      class="counter-tab-card p-3 rounded border h-100 d-flex flex-column justify-content-between cursor-pointer"
                      :class="{
                        'is-active': cartStore.activeTabIds.includes(tab.id),
                        'is-menu-open': tabContextMenu.open && tabContextMenu.tab?.id === tab.id,
                      }"
                      :style="{
                        backgroundColor: getTabAgingTheme(tab).tier === 'overdue' ? '#fef2f2' : '#ffffff',
                        borderBottom: '3.5px solid ' + getTabAgingTheme(tab).bottomBorder,
                      }"
                      @click="handleTabCardClick(tab)"
                      @keydown.enter="selectOpenTab(tab)"
                      @contextmenu.prevent="openTabContextMenuAt($event.clientX, $event.clientY, tab)"
                      @touchstart.passive="onTabCardTouchStart($event, tab)"
                      @touchmove.passive="onTabCardTouchMove($event)"
                      @touchend="onTabCardTouchEnd"
                      @touchcancel="onTabCardTouchEnd"
                    >
                      <div>
                        <!-- Header: Title, Balance & Three-Dots Actions Menu -->
                        <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                          <div class="min-w-0">
                            <div class="fw-bold text-dark font-size-14 text-truncate">
                              {{ tab.name || tab.customer?.name || tab.tab_number }}
                            </div>
                            <div class="d-flex align-items-center flex-wrap gap-2 font-size-11 text-muted mt-1">
                              <span class="font-monospace fw-semibold text-dark">{{ tab.tab_number }}</span>
                              <span
                                v-if="getTabTableLabel(tab)"
                                class="badge bg-light text-dark border font-size-10 fw-semibold d-inline-flex align-items-center gap-1"
                              >
                                <Icon icon="ri:restaurant-2-line" class="text-primary" />
                                <span>{{ getTabTableLabel(tab) }}</span>
                              </span>
                            </div>
                          </div>
                          <div class="d-flex align-items-start gap-1 flex-shrink-0">
                            <div class="text-end">
                              <div class="fw-bold font-size-15 text-nowrap" :style="{ color: getTabAgingTheme(tab).priceColor }">
                                {{ formatMoney(tab.balance_due ?? tab.total_amount) }}
                              </div>
                              <span
                                class="badge font-size-10 px-2 py-1 fw-bold rounded-1 mt-1"
                                :style="{
                                  backgroundColor: getTabAgingTheme(tab).badgeBg,
                                  color: getTabAgingTheme(tab).badgeText,
                                  border: '1px solid ' + getTabAgingTheme(tab).badgeBorder,
                                }"
                              >
                                {{ getTabAgingTheme(tab).label }}
                              </span>
                            </div>
                            <button
                              type="button"
                              class="btn btn-sm btn-link text-muted p-1 lh-1 counter-tab-more-btn"
                              title="More actions (Details, Timeline, Split, Pay)"
                              aria-label="More tab actions"
                              @click.stop="openTabContextMenuFromButton($event, tab)"
                            >
                              <Icon icon="ri:more-2-fill" class="fs-5" />
                            </button>
                          </div>
                        </div>

                        <!-- Compact Itemized Preview with Dotted Leader Lines -->
                        <div class="d-flex flex-column gap-1 py-2 border-top border-bottom my-2">
                          <div
                            v-for="(item, idx) in groupTabItems(tab.items).slice(0, 3)"
                            :key="item._groupKey || item.id || idx"
                            class="d-flex align-items-baseline gap-1 font-size-12 text-dark"
                          >
                            <span class="text-truncate" style="min-width: 0;">
                              {{ item.item_name || item.name || 'Item' }}
                              <span v-if="Number(item.quantity) > 1" class="text-muted">({{ Number(item.quantity) }})</span>
                            </span>
                            <span
                              class="flex-grow-1"
                              style="border-bottom: 1px dotted rgba(100, 116, 139, 0.35); min-width: 12px; transform: translateY(-2px);"
                            ></span>
                            <span class="fw-semibold text-nowrap flex-shrink-0">
                              {{ formatMoney(item.total_amount ?? (Number(item.unit_price || 0) * Number(item.quantity || 1))) }}
                            </span>
                          </div>
                          <div v-if="groupTabItems(tab.items).length > 3" class="text-muted font-size-11">
                            +{{ groupTabItems(tab.items).length - 3 }} more item(s)
                          </div>
                          <div v-if="groupTabItems(tab.items).length === 0" class="text-muted fst-italic font-size-11">
                            No items on tab
                          </div>
                        </div>

                        <!-- Aging Timeline Progress Bar & Date/Time -->
                        <div class="mb-2">
                          <div class="d-flex align-items-center justify-content-between font-size-11 text-muted mb-1">
                            <span class="d-inline-flex align-items-center gap-1">
                              <Icon icon="ri:calendar-schedule-line" class="font-size-13 text-primary" />
                              <span>{{ formatTabDateTime(tab.opened_at || tab.created_at || tab.updated_at) }}</span>
                            </span>
                            <span
                              class="fw-medium"
                              :style="{ color: getTabAgingTheme(tab).tier === 'overdue' ? '#e11d48' : '#64748b' }"
                            >
                              {{ formatTabTimelineRight(tab) }}
                            </span>
                          </div>
                          <div class="tab-timeline-track">
                            <span
                              class="tab-timeline-dot-start"
                              :style="{ backgroundColor: getTabTimelineColor(tab) }"
                            ></span>
                            <div class="tab-timeline-rail">
                              <div
                                class="tab-timeline-fill"
                                :style="{
                                  width: getTabAgingProgress(tab) + '%',
                                  backgroundColor: getTabTimelineColor(tab),
                                }"
                              ></div>
                            </div>
                            <span
                              class="tab-timeline-dot-end"
                              :style="{
                                borderColor: getTabAgingProgress(tab) >= 100 ? getTabTimelineColor(tab) : '#cbd5e1',
                              }"
                            ></span>
                          </div>
                        </div>
                      </div>

                      <!-- Footer: Customer + Visible Common Actions -->
                      <div class="d-flex flex-column gap-2 mt-1">
                        <div class="d-flex justify-content-between align-items-center gap-2 font-size-12">
                          <span class="text-muted text-truncate min-w-0">
                            {{ tab.customer?.name || 'Walk-in' }}
                          </span>

                          <!-- Active / Joint indicator -->
                          <div
                            v-if="cartStore.isJointTabMode && cartStore.activeTabIds.includes(tab.id)"
                            class="d-inline-flex align-items-center gap-1 flex-shrink-0"
                          >
                            <span class="fw-semibold text-success d-inline-flex align-items-center gap-1">
                              <span>In Joint</span>
                              <i class="bx bx-check-circle"></i>
                            </span>
                            <button
                              type="button"
                              class="btn btn-sm btn-link text-danger p-0 ms-1 text-decoration-none d-inline-flex align-items-center"
                              title="Remove tab from Joint Payment"
                              @click.stop="cartStore.removeTabFromJoint(tab.id)"
                            >
                              <Icon icon="ri:close-circle-line" class="font-size-15" />
                            </button>
                          </div>
                          <span
                            v-else-if="cartStore.activeTabIds.includes(tab.id)"
                            class="fw-semibold text-success d-inline-flex align-items-center gap-1 flex-shrink-0"
                          >
                            <span>In Cart</span>
                            <i class="bx bx-check-circle"></i>
                          </span>
                        </div>

                        <!-- Always-visible common actions (Pay, Split, Joint Pay) -->
                        <div class="d-flex align-items-center gap-1 pt-2 border-top counter-tab-actions" @click.stop>
                          <button
                            v-if="Number(tab.balance_due ?? tab.total_amount ?? 0) > 0"
                            type="button"
                            class="btn btn-sm btn-white flex-grow-1 d-inline-flex align-items-center justify-content-center gap-1 text-nowrap px-2"
                            title="Complete payment for this tab now"
                            @click="handleCompleteTabPayment(tab)"
                          >
                            <Icon icon="ri:money-dollar-circle-line" class="font-size-14 text-primary" />
                            <span>Pay</span>
                          </button>

                          <button
                            v-if="canSplitTab(tab)"
                            type="button"
                            class="btn btn-sm btn-white d-inline-flex align-items-center justify-content-center gap-1 text-nowrap px-2"
                            title="Split Bill — move selected items or quantities onto a separate bill to pay now"
                            @click="openCounterSplitModal(tab)"
                          >
                            <Icon icon="ri:git-branch-line" class="font-size-14" />
                            <span>Split</span>
                          </button>

                          <button
                            v-if="cartStore.isEditingTab && !cartStore.activeTabIds.includes(tab.id)"
                            type="button"
                            class="btn btn-sm btn-outline-muted-primary fw-semibold d-inline-flex align-items-center justify-content-center gap-1 text-nowrap px-2"
                            title="Joint Pay — combine this tab with the active tab(s) to settle in one payment"
                            @click="handleAddTabToJoint(tab)"
                          >
                            <Icon icon="ri:add-line" class="font-size-14" />
                            <span>Joint</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>

              <!-- ==================== LEFT PANEL: PRODUCTS ==================== -->
              <template v-else>
              <!-- Prominent Banner when an Open Tab is loaded so cashier never adds to wrong customer -->
              <div
                v-if="cartStore.isEditingTab && cartStore.activeTab"
                class="px-3 py-2 border-bottom bg-primary-subtle d-flex align-items-center justify-content-between gap-2 flex-wrap"
              >
                <div class="d-flex align-items-center gap-2 min-w-0">
                  <Icon icon="ri:bill-fill" class="fs-5 text-primary flex-shrink-0" />
                  <div class="font-size-13 text-dark text-truncate">
                    <span class="fw-semibold text-primary">Adding to Open Tab:</span>
                    <strong class="ms-1">{{ cartStore.activeTab.name || cartStore.activeTab.tab_number }}</strong>
                    <span class="text-muted ms-1 font-monospace font-size-12">({{ cartStore.activeTab.tab_number }})</span>
                    <span v-if="cartStore.table?.table_number" class="text-muted ms-1 font-size-12">· Table {{ cartStore.table.table_number }}</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn btn-sm btn-white fw-semibold d-inline-flex align-items-center gap-1 flex-shrink-0"
                  @click="handleExitTab"
                >
                  <Icon icon="ri:add-circle-line" class="fs-6 text-primary" />
                  <span>Start New Sale Instead</span>
                </button>
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
                <!-- SKELETON LOADERS (Grid View) -->
                <div v-if="isLoadingProducts && viewMode === 'grid'" class="row">
                  <div
                    v-for="(_, i) in skeletonRows"
                    :key="i"
                    class="col-6 col-sm-6 col-md-6 col-lg-4 col-xl-3 mb-4 position-relative"
                  >
                    <div class="p-3 bg-light rounded border w-100 h-100 d-flex flex-column justify-content-between">
                      <div>
                        <div
                          style="height: 160px;"
                          class="img-cont d-flex align-items-center justify-content-center overflow-hidden rounded w-100 bg-white"
                        >
                          <SkeletonLoader type="text" :lines="1" height="150px" width="100%" class="mx-0" />
                        </div>
                      </div>
                      <div class="pt-3">
                        <SkeletonLoader type="text" :lines="1" height="14px" width="85%" class="mx-0 mb-2" />
                        <SkeletonLoader type="text" :lines="1" height="10px" width="55%" class="mx-0 mb-3" />
                        <div class="d-flex align-items-center justify-content-between">
                          <SkeletonLoader type="text" :lines="1" height="16px" width="40%" class="mx-0" />
                          <SkeletonLoader type="text" :lines="1" height="12px" width="35%" class="mx-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- SKELETON LOADERS (List View) -->
                <div v-else-if="isLoadingProducts && viewMode === 'list'" class="table-responsive">
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
                      <tr v-for="(_, i) in skeletonRows" :key="i">
                        <td><SkeletonLoader type="text" :lines="1" height="36px" width="36px" class="mx-0 rounded" /></td>
                        <td><SkeletonLoader type="text" :lines="1" height="14px" width="140px" class="mx-0" /></td>
                        <td><SkeletonLoader type="text" :lines="1" height="12px" width="90px" class="mx-0" /></td>
                        <td><SkeletonLoader type="text" :lines="1" height="12px" width="60px" class="mx-0" /></td>
                        <td class="text-end"><SkeletonLoader type="text" :lines="1" height="14px" width="70px" class="ms-auto" /></td>
                        <td class="text-center"><SkeletonLoader type="text" :lines="1" height="28px" width="90px" class="mx-auto rounded" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div v-else-if="filteredProducts.length === 0" class="row">
                  <div class="col-12 text-center py-5 text-muted">
                    <i class="bx bx-search fs-1 opacity-50 mb-2"></i>
                    <h5 class="fw-semibold text-dark font-size-15">No products found</h5>
                    <p class="font-size-13">Try adjusting your search query or selected category.</p>
                  </div>
                </div>

                <!-- GRID VIEW (Clean card design, no custom shadows, equal height) -->
                <div v-else-if="viewMode === 'grid'" class="row">
                  <div
                    v-for="product in filteredProducts"
                    :key="product.id"
                    @click="handleProductClick(product)"
                    class="col-6 col-sm-6 col-md-6 col-lg-4 col-xl-3 mb-4 position-relative"
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
                          <img
                            v-else
                            class="img h-auto"
                            style="width: 100%; max-height: 120px; object-fit: contain; opacity: 0.6;"
                            :src="emptyImage"
                            :alt="product.name"
                          />
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
                            <img v-else :src="emptyImage" style="max-height: 32px; object-fit: contain;" />
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
              </template>
            </div>
          </div>

          <!-- RIGHT COLS: FIXED / STICKY FULL-HEIGHT CART AT THE VERY TOP -->
          <div class="col-12 col-lg-4">
            <div
              class="card counter-cart-card mb-0"
              :class="{ 'cart-editing-tab': cartStore.isEditingTab }"
              data-pos-cart
            >
              <div class="card-header py-2 px-3 flex-shrink-0" :class="{ 'bg-primary-subtle': cartStore.isEditingTab }">
                <div class="d-flex justify-content-between align-items-center">
                  <h4 class="card-title d-flex align-items-center gap-2 mb-0">
                    <Icon v-if="cartStore.isEditingTab" icon="ri:bill-fill" class="fs-4 text-primary" />
                    <i v-else class="dripicons-cart fs-4"></i>
                    <span>{{ cartStore.isEditingTab ? `Editing Tab (${cartStore.itemCount})` : `Cart(${cartStore.itemCount})` }}</span>
                  </h4>
                  <div>
                    <button
                      v-if="cartStore.isEditingTab"
                      type="button"
                      @click="handleExitTab"
                      class="btn btn-outline-muted-danger waves-effect fw-bold flex-nowrap d-inline-flex btn-sm gap-1 align-items-center px-3"
                      title="Close loaded tab and start a new sale"
                    >
                      <Icon icon="ri:logout-box-r-line" class="fs-6" />
                      <span>Exit Tab</span>
                    </button>
                    <button
                      v-else
                      :disabled="cartStore.isEmpty"
                      type="button"
                      @click="cartStore.clearCart()"
                      class="btn btn-soft-danger waves-effect fw-bold flex-nowrap d-flex btn-sm gap-2 align-items-center"
                    >
                      <i class="dripicons-trash fs-6"></i> Clear cart
                    </button>
                  </div>
                </div>
              </div>

              <!-- Active Loaded Tab Strip -->
              <div
                v-if="cartStore.isEditingTab && cartStore.activeTab"
                class="px-3 py-2 border-bottom bg-white flex-shrink-0"
              >
                <div class="d-flex align-items-start justify-content-between gap-2">
                  <div class="min-w-0">
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                      <span
                        class="badge font-size-10 fw-semibold"
                        :class="cartStore.isJointTabMode ? 'bg-success text-white' : 'bg-primary text-white'"
                      >
                        {{ cartStore.isJointTabMode ? `JOINT · ${cartStore.activeTabs.length} TABS` : 'OPEN TAB' }}
                      </span>
                      <span class="fw-bold text-dark font-size-12 text-truncate">
                        {{ cartStore.activeTab.name || cartStore.activeTab.tab_number }}
                      </span>
                    </div>
                    <div class="d-flex align-items-center flex-wrap gap-2 text-muted font-size-11 mt-1">
                      <span class="font-monospace fw-semibold text-dark">{{ cartStore.activeTab.tab_number }}</span>
                      <span
                        v-if="activeTabTableLabel"
                        class="badge bg-white text-dark border font-size-10 fw-semibold d-inline-flex align-items-center gap-1"
                      >
                        <Icon icon="ri:restaurant-2-line" class="text-primary" />
                        <span>{{ activeTabTableLabel }}</span>
                      </span>
                      <span v-if="Number(cartStore.activeTab.paid_amount) > 0">
                        Paid: <strong class="text-success">{{ formatMoney(cartStore.activeTab.paid_amount) }}</strong>
                      </span>
                    </div>
                  </div>
                  <div class="d-flex align-items-center gap-1 flex-shrink-0">
                    <button
                      v-if="leftPanelTab === 'tabs'"
                      type="button"
                      class="btn btn-sm btn-white fw-semibold font-size-11"
                      @click="leftPanelTab = 'products'"
                    >
                      + Add Items
                    </button>
                    <span
                      v-else-if="cartStore.pendingTabItemsCount > 0"
                      class="badge bg-white text-primary border border-primary-subtle font-size-11 fw-bold"
                    >
                      +{{ cartStore.pendingTabItemsCount }} new
                    </span>
                  </div>
                </div>

                <!-- Aging Timeline Progress Bar & Date/Time -->
                <div class="mt-2 pt-1">
                  <div class="d-flex align-items-center justify-content-between font-size-11 text-muted mb-1">
                    <span class="d-inline-flex align-items-center gap-1">
                      <Icon icon="ri:calendar-schedule-line" class="font-size-13 text-primary" />
                      <span>{{ formatTabDateTime(cartStore.activeTab.opened_at || cartStore.activeTab.created_at || cartStore.activeTab.updated_at) }}</span>
                    </span>
                    <span
                      class="fw-semibold"
                      :style="{ color: getTabAgingTheme(cartStore.activeTab).tier === 'overdue' ? '#e11d48' : '#475569' }"
                    >
                      {{ formatTabTimelineRight(cartStore.activeTab) }}
                    </span>
                  </div>
                  <div class="tab-timeline-track">
                    <span
                      class="tab-timeline-dot-start"
                      :style="{ backgroundColor: getTabTimelineColor(cartStore.activeTab) }"
                    ></span>
                    <div class="tab-timeline-rail">
                      <div
                        class="tab-timeline-fill"
                        :style="{
                          width: getTabAgingProgress(cartStore.activeTab) + '%',
                          backgroundColor: getTabTimelineColor(cartStore.activeTab),
                        }"
                      ></div>
                    </div>
                    <span
                      class="tab-timeline-dot-end"
                      :style="{
                        borderColor: getTabAgingProgress(cartStore.activeTab) >= 100 ? getTabTimelineColor(cartStore.activeTab) : '#cbd5e1',
                      }"
                    ></span>
                  </div>
                </div>
              </div>

              <!-- Customer Assignment & Selected Customer Card (Shared CustomerPicker, Walk-in default) -->
              <div class="px-3 py-2 border-bottom bg-light-subtle flex-shrink-0">
                <CustomerPicker
                  :model-value="cartStore.customer"
                  :allow-change="true"
                  @select="cartStore.setCustomer($event)"
                  @open-profile="openCustomerProfileModal"
                  @view-bills="handleViewCustomerBills"
                  @register-new="openCustomerModal"
                />
              </div>

              <div ref="cartScrollRef" class="card-body cart-container bg-white py-2 px-3">
                <h4 class="card-title text-black d-none">Cart Items</h4>

                <table class="table table-s mb-0">
                  <tbody>
                    <tr
                      class="verticle-align-middle"
                      v-for="(cartItem, index) in cartStore.items"
                      :key="cartItem.id"
                      :data-cart-item-id="cartItem.id"
                    >
                      <th class="verticle-align-middle pl-0 d-none" style="width: 10px;">{{ index + 1 }}.</th>
                      <th class="verticle-align-middle d-flex gap-2 align-items-center pl-0">
                        <div class="product-img bg-light d-flex align-items-center justify-content-center">
                          <img
                            :src="cartItem.product.image_url || emptyImage"
                            class="img-fluid product-image"
                            alt="Product Icon"
                          />
                        </div>
                        <div>
                          <div class="d-flex align-items-center gap-1">
                            <p class="m-0 fw-bold text-black">{{ cartItem.product.name }}</p>
                            <span
                              v-if="cartStore.isEditingTab && (cartItem.quantity - (cartItem.originalQty || 0)) > 0"
                              class="badge bg-primary-subtle text-primary font-size-10 fw-semibold"
                            >
                              +{{ cartItem.quantity - (cartItem.originalQty || 0) }}
                            </span>
                          </div>
                          <div class="d-flex gap-2 p-0 align-items-center flex-wrap">
                            <small class="text-muted p-0 m-0 gap-2 d-flex">
                              {{ cartItem.product.size_label || '-' }}
                              <span class="p-0">|</span>
                              {{ formatMoney(cartItem.unit_price) }}
                            </small>
                            <button
                              v-if="cartItem.product?.allow_discount !== false"
                              type="button"
                              class="btn btn-link p-0 font-size-11 text-decoration-none d-inline-flex align-items-center gap-1"
                              :class="Number(cartItem.discount_amount) > 0 ? 'text-success fw-semibold' : 'text-muted'"
                              title="Add or edit item discount"
                              @click.stop="openItemDiscountModal(cartItem)"
                            >
                              <Icon icon="ri:price-tag-3-line" class="font-size-12" />
                              <span>{{ Number(cartItem.discount_amount) > 0 ? `-${formatMoney(cartItem.discount_amount)}` : 'Discount' }}</span>
                            </button>
                          </div>
                          <div
                            v-if="Number(cartItem.discount_amount) > 0"
                            class="font-size-10 text-success mt-1 text-truncate"
                            style="max-width: 190px;"
                            :title="`${cartItem.discount_reason || ''}${cartItem.discount_approved_by ? ' · Approved by ' + cartItem.discount_approved_by : ''}`"
                          >
                            {{ cartItem.discount_reason }}<template v-if="cartItem.discount_approved_by"> · ✓ {{ cartItem.discount_approved_by }}</template>
                          </div>
                        </div>
                      </th>
                      <td class="verticle-align-middle">
                        <div class="d-flex align-items-center p-0 gap-2">
                          <span
                            @click="cartStore.decreaseQty(cartItem.id)"
                            class="waves-effect p-2 cursor-pointer"
                            :class="{ 'qty-locked': cartStore.isEditingTab && Number(cartItem.originalQty || 0) > 0 && cartItem.quantity <= Number(cartItem.originalQty || 0) }"
                            :title="cartStore.isEditingTab && Number(cartItem.originalQty || 0) > 0 && cartItem.quantity <= Number(cartItem.originalQty || 0) ? 'Cannot reduce original tab items' : 'Decrease quantity'"
                          >
                            <i class="mdi mdi-minus cursor-pointer fs-6"></i>
                          </span>
                          <span class="">{{ cartItem.quantity }}</span>
                          <span
                            @click="cartStore.increaseQty(cartItem.id)"
                            class="waves-effect p-2 cursor-pointer"
                          >
                            <i class="mdi mdi-plus cursor-pointer fs-6"></i>
                          </span>
                        </div>
                      </td>
                      <th class="text-right verticle-align-middle px-0">
                        <div class="d-flex w-100 align-items-center p-0 gap-2 justify-content-end text-right">
                          <div class="p-0 text-right">
                            <span
                              v-if="Number(cartItem.discount_amount) > 0"
                              class="d-block text-muted text-decoration-line-through font-size-11"
                            >
                              {{ formatMoney(cartItem.quantity * cartItem.unit_price) }}
                            </span>
                            <span class="text-right fw-bold">
                              {{ formatMoney(Math.max(0, cartItem.quantity * cartItem.unit_price - Number(cartItem.discount_amount || 0))) }}
                            </span>
                          </div>
                          <span
                            v-if="!(cartStore.isEditingTab && Number(cartItem.originalQty || 0) > 0)"
                            title="Remove item from cart"
                            class="waves-effect px-2 align-items-center py-0 d-flex justify-content-center cursor-pointer"
                            @click="cartStore.removeItem(cartItem.id)"
                          >
                            <i class="dripicons-cross text-danger cursor-pointer fs-5 p-0 d-flex"></i>
                          </span>
                        </div>
                      </th>
                    </tr>
                  </tbody>
                </table>

                <div
                  v-if="cartStore.isEmpty"
                  class="d-flex flex-column text-center align-items-center justify-content-center w-100 h-100"
                >
                  <div class="opacity-50">
                    <div class="mb-4">
                      <img :src="emptyCart" class="img" height="50%" alt="" />
                    </div>
                    <h5 class="fw-bold text-capitalize">Tap items to add to <br /> the order</h5>
                  </div>
                </div>
              </div>

              <div class="py-2 px-3 border-top bg-white flex-shrink-0">
                <div class="p-2 px-3 bg-success-muted rounded">
                  <table class="table text-uppercase font-size-12 table-sm border-success m-0 cart-summary-table">
                    <tbody v-if="cartStore.isEditingTab && cartStore.activeTab">
                      <tr class="border-success">
                        <td class="py-1">Total Bill</td>
                        <th class="text-right py-1">
                          {{ formatMoney(Number(cartStore.activeTab.total_amount || 0) + cartStore.pendingTabAddedAmount) }}
                        </th>
                      </tr>
                      <tr v-if="Number(cartStore.activeTab.paid_amount) > 0" class="border-success">
                        <td class="py-1">Already Paid</td>
                        <th class="text-right text-success py-1">
                          {{ formatMoney(cartStore.activeTab.paid_amount) }}
                        </th>
                      </tr>
                      <tr class="fs-5 text-black border-bottom-0">
                        <th class="py-1">Balance Due</th>
                        <th class="text-right py-1">
                          {{ formatMoney(cartStore.activeTabBalanceDue) }}
                        </th>
                      </tr>
                    </tbody>
                    <tbody v-else>
                      <tr v-if="cartStore.totalDiscount > 0" class="border-success">
                        <td class="py-1 text-success">Discount</td>
                        <th class="text-right py-1 text-success">
                          -{{ formatMoney(cartStore.totalDiscount) }}
                        </th>
                      </tr>
                      <tr v-if="cartStore.taxAmount > 0" class="border-success">
                        <td class="py-1">Tax</td>
                        <th class="text-right py-1">
                          {{ formatMoney(cartStore.taxAmount) }}
                        </th>
                      </tr>
                      <tr class="fs-5 text-black border-bottom-0">
                        <th class="py-1">Total</th>
                        <th class="text-right py-1">
                          {{ formatMoney(cartStore.totalAmount) }}
                        </th>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="card-footer pt-0 bg-white px-3 pb-3 pt-1 gap-2 d-flex justify-content-between align-items-center flex-shrink-0">
                <!-- Footer when an existing Open Tab is loaded in Cart -->
                <div v-if="cartStore.isEditingTab" class="gap-2 d-flex w-100">
                  <button
                    type="button"
                    class="btn btn-outline-muted-primary btn-lg fw-bold flex-nowrap d-inline-flex align-items-center justify-content-center gap-2"
                    :disabled="isSavingActiveTab || cartStore.pendingTabItemsCount === 0"
                    @click="saveActiveTabAdditions(false)"
                  >
                    <span v-if="isSavingActiveTab" class="spinner-border spinner-border-sm" role="status"></span>
                    <Icon v-else icon="ri:save-line" class="fs-4" />
                    <span>
                      {{ cartStore.pendingTabItemsCount > 0 ? `Save (+${cartStore.pendingTabItemsCount})` : 'Saved' }}
                    </span>
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary btn-lg fw-bold flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2"
                    :disabled="isSavingActiveTab || cartStore.activeTabBalanceDue <= 0"
                    @click="handleRecordPaymentForActiveTab"
                  >
                    <Icon icon="ri:money-dollar-circle-line" class="fs-4" />
                    <span>Record Payment</span>
                  </button>
                </div>

                <!-- Default Footer for a new Counter sale -->
                <div v-else class="gap-2 d-flex w-100">
                  <button
                    data-bs-target="#saveTabAside"
                    :disabled="cartStore.isEmpty"
                    data-bs-toggle="offcanvas"
                    @click="isTabAsideOpen = true"
                    type="button"
                    class="btn btn-light waves-effect fw-bold flex-nowrap d-flex align-items-center justify-content-center btn-lg"
                  >
                    <i class="dripicons-clock bx fs-4 align-middle me-2"></i>
                    Save as Open Bill
                  </button>
                  <button
                    data-bs-target="#sellingAside"
                    :disabled="cartStore.isEmpty"
                    data-bs-toggle="offcanvas"
                    @click="handleProceedToCheckout"
                    type="button"
                    class="btn btn-primary waves-effect btn-lg fw-bold flex-grow-1"
                  >
                    <i class="mdi mdi-check-all fs-4 align-middle me-2"></i>
                    Complete Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
    </div>

    <!-- Modals & Asides -->
    <CustomerQuickModal ref="customerModalRef" @customer-created="onCustomerCreated" />

    <SellingAside
      ref="sellingAsideRef"
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
      :tab-id="cartStore.activeTabId"
      :tab-ids="cartStore.activeTabIds"
      :joint-tabs="cartStore.activeTabs"
      :tab-label="cartStore.jointTabsLabel"
      :already-paid="cartStore.isEditingTab ? Number(cartStore.activeTab?.paid_amount || 0) : 0"
      :table-id="cartStore.activeTab?.table_id || cartStore.table?.id || null"
      @sale-completed="onSaleCompleted"
      @register-customer="openCustomerModal"
      @view-customer-bills="handleViewCustomerBills"
    />

    <ItemDiscountModal
      :visible="showItemDiscountModal"
      :item="discountTargetItem"
      @close="closeItemDiscountModal"
      @applied="onItemDiscountApplied"
      @removed="onItemDiscountRemoved"
    />

    <ReceiptModal
      ref="receiptModalRef"
      :order="completedOrder"
      @order-updated="(updated) => { completedOrder = updated; }"
      @register-customer="openCustomerModalFromReceipt"
      @new-sale="cartStore.clearCart"
    />

    <SaveTabAside
      :cart="cartStore.items"
      :cart-items-count="cartStore.itemCount"
      :cart-total="cartStore.totalAmount"
      :is-tab-aside-open="isTabAsideOpen"
      @saved="onTabSaved"
    />

    <CustomerProfileModal
      v-if="cartStore.customer"
      modal-id="counterCustomerProfileModal"
      :customer="cartStore.customer"
    />

    <!-- Record Payment Modal for Active Loaded Tab -->
    <div
      v-if="showTabPaymentModal && cartStore.activeTab"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(15, 23, 42, 0.55); z-index: 1055;"
      @click.self="showTabPaymentModal = false"
    >
      <div class="modal-dialog modal-dialog-centered" style="max-width: 460px;">
        <div class="modal-content border-0 rounded-3 overflow-hidden shadow">
          <div class="modal-header bg-white border-bottom py-3 px-4">
            <div>
              <h5 class="modal-title font-size-16 fw-bold mb-0 text-dark">Record Payment on Tab</h5>
              <small class="text-muted font-size-12">
                {{ cartStore.activeTab.tab_number }} — {{ cartStore.activeTab.name }}
              </small>
            </div>
            <button type="button" class="btn-close shadow-none" :disabled="isSubmittingTabPayment" @click="showTabPaymentModal = false"></button>
          </div>

          <div class="modal-body p-4">
            <div class="p-3 bg-light rounded border mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span class="text-muted font-size-12">Total Bill:</span>
                <span class="fw-semibold font-size-13 text-dark">{{ formatMoney(cartStore.activeTab.total_amount) }}</span>
              </div>
              <div class="d-flex justify-content-between mb-1">
                <span class="text-muted font-size-12">Already Paid:</span>
                <span class="text-success font-size-13">{{ formatMoney(cartStore.activeTab.paid_amount) }}</span>
              </div>
              <div class="d-flex justify-content-between pt-2 border-top">
                <span class="fw-bold font-size-13 text-dark">Balance Due:</span>
                <span class="fw-bold font-size-16 text-danger">{{ formatMoney(cartStore.activeTab.balance_due) }}</span>
              </div>
            </div>

            <form @submit.prevent="submitTabPayment">
              <div class="mb-3">
                <label class="form-label font-size-12 fw-semibold text-muted mb-1">Payment Method</label>
                <div class="d-flex gap-2">
                  <button
                    type="button"
                    class="btn btn-sm flex-grow-1 py-2"
                    :class="tabPaymentForm.method === 'cash' ? 'btn-primary' : 'btn-light border'"
                    @click="tabPaymentForm.method = 'cash'"
                  >
                    <i class="bx bx-money me-1"></i> Cash
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm flex-grow-1 py-2"
                    :class="tabPaymentForm.method === 'mpesa' ? 'btn-primary' : 'btn-light border'"
                    @click="tabPaymentForm.method = 'mpesa'"
                  >
                    <i class="bx bx-mobile-alt me-1"></i> M-Pesa
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm flex-grow-1 py-2"
                    :class="tabPaymentForm.method === 'card' ? 'btn-primary' : 'btn-light border'"
                    @click="tabPaymentForm.method = 'card'"
                  >
                    <i class="bx bx-credit-card me-1"></i> Card
                  </button>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label font-size-12 fw-semibold text-muted mb-1">Amount to Pay (KES)</label>
                <input
                  v-model.number="tabPaymentForm.amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  :max="cartStore.activeTab.balance_due"
                  class="form-control font-size-15 fw-bold"
                  required
                />
              </div>

              <div v-if="tabPaymentForm.method === 'mpesa'" class="mb-3">
                <label class="form-label font-size-12 fw-semibold text-muted mb-1">M-Pesa Reference / Code</label>
                <input
                  v-model="tabPaymentForm.external_reference"
                  type="text"
                  class="form-control font-size-13 text-uppercase font-monospace"
                  placeholder="e.g. QK12345678"
                />
              </div>

              <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                <button type="button" class="btn btn-white" :disabled="isSubmittingTabPayment" @click="showTabPaymentModal = false">
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary fw-semibold d-inline-flex align-items-center gap-2"
                  :disabled="isSubmittingTabPayment"
                >
                  <span v-if="isSubmittingTabPayment" class="spinner-border spinner-border-sm" role="status"></span>
                  <span>{{ isSubmittingTabPayment ? 'Recording...' : 'Confirm Payment' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Unsaved Cart / Tab Switch Warning Modal -->
    <div
      v-if="showUnsavedCartWarning"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(15, 23, 42, 0.55); z-index: 1060;"
      @click.self="cancelPendingSwitch"
    >
      <div class="modal-dialog modal-dialog-centered" style="max-width: 440px;">
        <div class="modal-content border-0 rounded-3 overflow-hidden shadow">
          <div class="modal-header bg-white border-bottom py-3 px-4">
            <div class="d-flex align-items-center gap-2">
              <span class="avatar-xs rounded-circle bg-warning-subtle text-warning d-inline-flex align-items-center justify-content-center">
                <Icon icon="ri:alert-line" class="fs-5" />
              </span>
              <h5 class="modal-title font-size-16 fw-bold mb-0 text-dark">Unsaved Items in Cart</h5>
            </div>
            <button type="button" class="btn-close shadow-none" :disabled="isSavingActiveTab" @click="cancelPendingSwitch"></button>
          </div>

          <div class="modal-body p-4">
            <p v-if="cartStore.isEditingTab" class="text-dark font-size-13 mb-0">
              You added <strong>{{ cartStore.pendingTabItemsCount }} unsaved item{{ cartStore.pendingTabItemsCount === 1 ? '' : 's' }}</strong> to
              <strong>{{ cartStore.activeTab?.name || cartStore.activeTab?.tab_number }}</strong>.
              <template v-if="pendingSwitchAction?.type === 'tab'">
                Do you want to save them before switching to <strong>{{ pendingSwitchAction.tab?.name || pendingSwitchAction.tab?.tab_number }}</strong>?
              </template>
              <template v-else-if="pendingSwitchAction?.type === 'route'">
                Do you want to save them before leaving the Counter?
              </template>
              <template v-else>
                Do you want to save them before exiting this tab?
              </template>
            </p>
            <p v-else class="text-dark font-size-13 mb-0">
              You have <strong>{{ cartStore.itemCount }} unsaved item{{ cartStore.itemCount === 1 ? '' : 's' }}</strong> in your active cart.
              <template v-if="pendingSwitchAction?.type === 'route'">
                Leaving this page will discard your current cart items.
              </template>
              <template v-else>
                Opening <strong>{{ pendingSwitchAction?.tab?.name || pendingSwitchAction?.tab?.tab_number }}</strong> will replace the current cart items.
              </template>
            </p>
          </div>

          <div class="modal-footer bg-white border-top py-3 px-4 d-flex justify-content-end gap-2">
            <button
              type="button"
              class="btn btn-white"
              :disabled="isSavingActiveTab"
              @click="cancelPendingSwitch"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-outline-muted-danger"
              :disabled="isSavingActiveTab"
              @click="confirmDiscardAndSwitch"
            >
              {{ pendingSwitchAction?.type === 'exit' ? 'Discard & Exit' : pendingSwitchAction?.type === 'route' ? 'Discard & Leave' : 'Discard & Switch' }}
            </button>
            <button
              v-if="cartStore.isEditingTab"
              type="button"
              class="btn btn-primary d-inline-flex align-items-center gap-2"
              :disabled="isSavingActiveTab"
              @click="confirmSaveAndSwitch"
            >
              <span v-if="isSavingActiveTab" class="spinner-border spinner-border-sm" role="status"></span>
              <span>{{ pendingSwitchAction?.type === 'exit' ? 'Save & Exit' : pendingSwitchAction?.type === 'route' ? 'Save & Leave' : 'Save & Switch' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Tab Context Menu (Three-Dots click, Right-Click, or Touch Long-Press) -->
    <div
      v-if="tabContextMenu.open && tabContextMenu.tab"
      class="counter-tab-menu-backdrop"
      @click="closeTabContextMenu"
      @contextmenu.prevent="closeTabContextMenu"
    >
      <div
        class="counter-tab-context-menu shadow"
        :style="{ left: tabContextMenu.x + 'px', top: tabContextMenu.y + 'px' }"
        @click.stop
      >
        <div class="px-3 py-2 border-bottom bg-light d-flex align-items-center justify-content-between gap-2">
          <div class="min-w-0">
            <div class="fw-bold text-dark font-size-12 text-truncate">
              {{ tabContextMenu.tab.name || tabContextMenu.tab.customer?.name || tabContextMenu.tab.tab_number }}
            </div>
            <div class="font-monospace text-muted" style="font-size: 10px;">
              {{ tabContextMenu.tab.tab_number }} · {{ formatMoney(tabContextMenu.tab.balance_due ?? tabContextMenu.tab.total_amount) }}
            </div>
          </div>
          <button
            type="button"
            class="btn-close shadow-none"
            style="font-size: 9px;"
            aria-label="Close menu"
            @click="closeTabContextMenu"
          ></button>
        </div>

        <div class="py-1">
          <button
            type="button"
            class="counter-tab-menu-item"
            @click="openCounterTabDetails(tabContextMenu.tab, 'details')"
          >
            <Icon icon="ri:bill-line" class="font-size-15 text-muted" />
            <span>Bill Details</span>
          </button>

          <button
            type="button"
            class="counter-tab-menu-item"
            @click="openCounterTabDetails(tabContextMenu.tab, 'timeline')"
          >
            <Icon icon="ri:history-line" class="font-size-15 text-primary" />
            <span>Timeline &amp; Audit</span>
          </button>

          <div class="dropdown-divider my-1"></div>

          <button
            type="button"
            class="counter-tab-menu-item"
            @click="runContextAction(() => selectOpenTab(tabContextMenu.tab))"
          >
            <Icon icon="ri:shopping-cart-2-line" class="font-size-15 text-dark" />
            <span>Resume in Cart</span>
          </button>

          <button
            v-if="Number(tabContextMenu.tab.balance_due ?? tabContextMenu.tab.total_amount ?? 0) > 0"
            type="button"
            class="counter-tab-menu-item fw-semibold text-primary"
            @click="runContextAction(() => handleCompleteTabPayment(tabContextMenu.tab))"
          >
            <Icon icon="ri:money-dollar-circle-line" class="font-size-15 text-primary" />
            <span>Complete Payment</span>
          </button>

          <button
            v-if="canSplitTab(tabContextMenu.tab)"
            type="button"
            class="counter-tab-menu-item"
            title="Move selected items or quantities onto a separate bill to pay now"
            @click="runContextAction(() => openCounterSplitModal(tabContextMenu.tab))"
          >
            <Icon icon="ri:git-branch-line" class="font-size-15 text-warning" />
            <span>Split Bill</span>
          </button>

          <button
            v-if="cartStore.isJointTabMode && cartStore.activeTabIds.includes(tabContextMenu.tab.id)"
            type="button"
            class="counter-tab-menu-item text-danger"
            @click="runContextAction(() => cartStore.removeTabFromJoint(tabContextMenu.tab.id))"
          >
            <Icon icon="ri:close-circle-line" class="font-size-15 text-danger" />
            <span>Remove from Joint Pay</span>
          </button>
          <button
            v-else-if="!cartStore.activeTabIds.includes(tabContextMenu.tab.id)"
            type="button"
            class="counter-tab-menu-item"
            @click="runContextAction(() => handleAddTabToJoint(tabContextMenu.tab))"
          >
            <Icon icon="ri:stack-line" class="font-size-15 text-info" />
            <span>Add to Joint Pay</span>
          </button>

          <div class="dropdown-divider my-1"></div>

          <button
            type="button"
            class="counter-tab-menu-item"
            @click="runContextAction(() => copyTabNumber(tabContextMenu.tab))"
          >
            <Icon icon="ri:file-copy-line" class="font-size-15 text-muted" />
            <span>Copy Tab #</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tab Details & Audit Timeline Modal -->
    <TabDetailsModal
      :open="showCounterTabDetails"
      :tab="counterDetailsTab"
      :initial-view="counterDetailsInitialView"
      @close="showCounterTabDetails = false"
      @resume="(t) => { showCounterTabDetails = false; selectOpenTab(t); }"
      @pay="(t) => { showCounterTabDetails = false; handleCompleteTabPayment(t); }"
      @split="(t) => { showCounterTabDetails = false; openCounterSplitModal(t); }"
      @updated="handleCounterTabDetailsUpdated"
      @save-error="(msg) => showToast('error', 'Update Failed', msg)"
    />

    <!-- Split Bill Modal (Select Items/Quantities -> Split Only or Split & Pay) -->
    <SplitTabModal
      :open="showCounterSplitModal"
      :tab="counterSplitTab"
      :busy="isCounterSplittingTab"
      :error-message="counterSplitError"
      @close="closeCounterSplitModal"
      @confirm="confirmCounterSplitTab"
    />

    <ImageToast
      :status="toastStatus"
      :title="toastTitle"
      :message="toastMessage"
      :image="toastImage"
      :image-height="64"
      @hide="toastStatus = null"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { Icon } from '@iconify/vue';
import productsApi from '@/api/products';
import customersApi from '@/api/customers';
import tabsApi from '@/api/tabs';
import tablesApi from '@/api/tables';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useShiftStore } from '@/stores/shift';
import {
  getTabAgingTheme,
  getTabElapsedMinutes,
  formatMinutesShort,
  tabAgingConfig,
  groupTabItems,
} from '@/utils/tabAging';

import CustomerQuickModal from './components/CustomerQuickModal.vue';
import CustomerProfileModal from './components/CustomerProfileModal.vue';
import CustomerPicker from './components/CustomerPicker.vue';
import PaymentModal from './components/PaymentModal.vue';
import ReceiptModal from './components/ReceiptModal.vue';
import SaveTabAside from './components/SaveTabAside.vue';
import SellingAside from './components/SellingAside.vue';
import ItemDiscountModal from './components/ItemDiscountModal.vue';
import TabDetailsModal from './components/TabDetailsModal.vue';
import SplitTabModal from './components/SplitTabModal.vue';
import HeaderAlertBanner from '@/components/HeaderAlertBanner.vue';
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue';
import ImageToast from '@/components/ImageToast.vue';
import successImage from '@/assets/images/icons/check.png';
import errorImage from '@/assets/images/icons/error.png';
import emptyCart from '@/assets/images/icons/POS/empty-cart.svg';
import emptyImage from '@/assets/images/icons/packaging.svg';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const shiftStore = useShiftStore();

const isTabAsideOpen = ref(false);
const leftPanelTab = ref('products'); // 'products' | 'tabs'
const openTabs = ref([]);
const isLoadingOpenTabs = ref(false);
const openTabSearch = ref('');
const openTabStatusFilter = ref('all'); // 'all' | 'overdue' | 'warning' | 'fresh' | 'partial'
const openTabCustomerFilter = ref('all'); // 'all' | 'walkin' | <customer_id>
const openTabCashierFilter = ref('mine'); // 'mine' (default) | 'all' | <user_id>
const openTabSort = ref('oldest'); // 'oldest' | 'newest' | 'highest'
const isSavingActiveTab = ref(false);
const showUnsavedCartWarning = ref(false);
const pendingSwitchAction = ref(null); // { type: 'tab', tab } | { type: 'exit' } | { type: 'route', to }
const bypassLeaveGuard = ref(false);
const showTabPaymentModal = ref(false);
const isSubmittingTabPayment = ref(false);
const tabPaymentForm = reactive({
  method: 'cash',
  amount: 0,
  external_reference: '',
});

const toastStatus = ref(null);
const toastTitle = ref('');
const toastMessage = ref('');
const toastImage = ref(null);

function showToast(status, title, message) {
  toastStatus.value = status;
  toastTitle.value = title;
  toastMessage.value = message;
  toastImage.value = status === 'success' ? successImage : status === 'error' ? errorImage : null;
}

const currentUserId = computed(() => String(authStore.user?.id || ''));

function getTabOpenedById(tab) {
  return String(tab?.opened_by_user_id || tab?.opened_by?.id || tab?.openedBy?.id || '');
}

function getTabOpenedByName(tab) {
  return tab?.opened_by?.name || tab?.openedBy?.name || '';
}

const tabFilterCounts = computed(() => {
  let overdue = 0;
  let warning = 0;
  let fresh = 0;
  let partial = 0;
  let mine = 0;
  for (const t of openTabs.value) {
    const tier = getTabAgingTheme(t).tier;
    if (tier === 'overdue') overdue++;
    else if (tier === 'warning') warning++;
    else fresh++;
    if (Number(t.paid_amount || 0) > 0 || String(t.status || '').toLowerCase() === 'partially_paid') {
      partial++;
    }
    if (currentUserId.value && getTabOpenedById(t) === currentUserId.value) {
      mine++;
    }
  }
  return { overdue, warning, fresh, partial, mine };
});

const openTabCashierOptions = computed(() => {
  const map = new Map();
  for (const t of openTabs.value) {
    const uid = getTabOpenedById(t);
    const uname = getTabOpenedByName(t);
    if (uid && uname) {
      const existing = map.get(uid);
      if (existing) {
        existing.count++;
      } else {
        map.set(uid, { id: uid, name: uname, count: 1 });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
});

const openTabCustomerOptions = computed(() => {
  const map = new Map();
  for (const t of openTabs.value) {
    if (t.customer?.id) {
      const id = String(t.customer.id);
      const existing = map.get(id);
      if (existing) {
        existing.count++;
      } else {
        map.set(id, { id, name: t.customer.name || 'Customer', count: 1 });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
});

const hasActiveOpenTabFilters = computed(() =>
  Boolean(openTabSearch.value.trim()) ||
  openTabStatusFilter.value !== 'all' ||
  openTabCustomerFilter.value !== 'all' ||
  openTabCashierFilter.value !== 'mine' ||
  openTabSort.value !== 'oldest'
);

const openTabCustomerLabel = computed(() => {
  if (openTabCustomerFilter.value === 'all') return 'Customer';
  if (openTabCustomerFilter.value === 'walkin') return 'Walk-in';
  return openTabCustomerOptions.value.find((c) => c.id === openTabCustomerFilter.value)?.name || 'Customer';
});

const openTabCashierLabel = computed(() => {
  if (openTabCashierFilter.value === 'all') return 'All Cashiers';
  if (openTabCashierFilter.value === 'mine') return 'Mine';
  return openTabCashierOptions.value.find((u) => u.id === openTabCashierFilter.value)?.name || 'Cashier';
});

const openTabSortLabel = computed(() => {
  if (openTabSort.value === 'newest') return 'Newest';
  if (openTabSort.value === 'highest') return 'Highest';
  return 'Oldest';
});

function resetOpenTabFilters() {
  openTabSearch.value = '';
  openTabStatusFilter.value = 'all';
  openTabCustomerFilter.value = 'all';
  openTabCashierFilter.value = 'mine';
  openTabSort.value = 'oldest';
}

const filteredOpenTabs = computed(() => {
  const q = openTabSearch.value.trim().toLowerCase();
  const statusF = openTabStatusFilter.value;
  const custF = openTabCustomerFilter.value;
  const cashierF = openTabCashierFilter.value;

  const list = openTabs.value.filter((t) => {
    if (statusF === 'overdue' && getTabAgingTheme(t).tier !== 'overdue') return false;
    if (statusF === 'warning' && getTabAgingTheme(t).tier !== 'warning') return false;
    if (statusF === 'fresh' && !['fresh', 'normal'].includes(getTabAgingTheme(t).tier)) return false;
    if (
      statusF === 'partial' &&
      !(Number(t.paid_amount || 0) > 0 || String(t.status || '').toLowerCase() === 'partially_paid')
    ) {
      return false;
    }

    if (custF === 'walkin' && t.customer?.id) return false;
    if (custF !== 'all' && custF !== 'walkin' && String(t.customer?.id || '') !== custF) return false;

    if (cashierF === 'mine') {
      if (!currentUserId.value || getTabOpenedById(t) !== currentUserId.value) return false;
    } else if (cashierF !== 'all') {
      if (getTabOpenedById(t) !== cashierF) return false;
    }

    if (q) {
      const hay = [
        t.tab_number,
        t.name,
        t.customer?.name,
        t.customer?.phone,
        getTabOpenedByName(t),
        t.table?.table_number ? `table ${t.table.table_number}` : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });

  return [...list].sort((a, b) => {
    if (openTabSort.value === 'highest') {
      return Number(b.balance_due ?? b.total_amount ?? 0) - Number(a.balance_due ?? a.total_amount ?? 0);
    }
    const ta = new Date(a.opened_at || a.created_at || 0).getTime();
    const tb = new Date(b.opened_at || b.created_at || 0).getTime();
    return openTabSort.value === 'newest' ? tb - ta : ta - tb;
  });
});

function formatTabTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatTabDateTime(timestamp) {
  if (!timestamp) return 'Just now';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return 'Recently';
  const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  return `${day}, ${time}`;
}

function formatTabTimelineRight(tab) {
  const theme = getTabAgingTheme(tab);
  if (theme.tier === 'settled') return 'Settled';
  const mins = getTabElapsedMinutes(tab);
  if (theme.tier === 'overdue') return `Over ${formatMinutesShort(tabAgingConfig.overdueMinutes)}`;
  return mins < 1 ? 'Just opened' : `${formatMinutesShort(mins)} elapsed`;
}

function getTabAgingProgress(tab) {
  const theme = getTabAgingTheme(tab);
  if (theme.tier === 'settled' || theme.tier === 'overdue') return 100;
  const elapsed = getTabElapsedMinutes(tab);
  const max = Math.max(1, Number(tabAgingConfig.overdueMinutes) || 240);
  return Math.min(100, Math.max(8, Math.round((elapsed / max) * 100)));
}

function getTabTimelineColor(tab) {
  const tier = getTabAgingTheme(tab).tier;
  if (tier === 'overdue') return '#f43f5e';
  if (tier === 'extended') return '#f59e0b';
  if (tier === 'settled') return '#16a34a';
  return '#3b82f6';
}

function getTabTableLabel(tab) {
  if (!tab) return null;
  if (tab.table?.table_number) return `Table ${tab.table.table_number}`;
  if (tab.table?.label) return `Table ${tab.table.label}`;
  if (tab.table_number) return `Table ${tab.table_number}`;
  const match = (tab.name || '').match(/Table\s*([0-9A-Za-z]+)/i);
  if (match) return `Table ${match[1]}`;
  return null;
}

const activeTabTableLabel = computed(() => {
  if (cartStore.table?.table_number) return `Table ${cartStore.table.table_number}`;
  if (cartStore.table?.label) return `Table ${cartStore.table.label}`;
  return getTabTableLabel(cartStore.activeTab);
});

const filteredOpenTabsCombinedTotal = computed(() =>
  filteredOpenTabs.value.reduce((sum, t) => sum + Number(t.balance_due ?? t.total_amount ?? 0), 0)
);

function handleAddTabToJoint(tab) {
  if (!tab?.id) return;
  if (typeof cartStore.addTabToJoint === 'function') {
    cartStore.addTabToJoint(tab);
  } else {
    const existing = Array.isArray(cartStore.activeTabs) && cartStore.activeTabs.length > 0
      ? [...cartStore.activeTabs]
      : cartStore.activeTab
      ? [{ ...cartStore.activeTab }]
      : [];
    if (!existing.some((t) => t.id === tab.id)) {
      cartStore.loadMultipleTabs([...existing, { ...tab }]);
    }
  }
}

// ── Open Tab Card Context Menu (Three-Dots, Right-Click & Touch Long-Press) ──
const tabContextMenu = reactive({
  open: false,
  x: 0,
  y: 0,
  tab: null,
});

let tabLongPressTimer = null;
let tabLongPressStartX = 0;
let tabLongPressStartY = 0;
let suppressNextTabCardClick = false;

function canSplitTab(tab) {
  const items = (tab?.items || []).filter((i) => String(i.status || '').toLowerCase() !== 'voided');
  if (items.length > 1) return true;
  return items.some((i) => Number(i.quantity || 0) > 1);
}

function clampMenuPosition(rawX, rawY) {
  const menuW = 240;
  const menuH = 340;
  const pad = 12;
  const maxX = Math.max(pad, window.innerWidth - menuW - pad);
  const maxY = Math.max(pad, window.innerHeight - menuH - pad);
  return {
    x: Math.min(Math.max(pad, rawX), maxX),
    y: Math.min(Math.max(pad, rawY), maxY),
  };
}

function openTabContextMenuAt(clientX, clientY, tab) {
  if (!tab) return;
  const pos = clampMenuPosition(clientX, clientY);
  tabContextMenu.tab = tab;
  tabContextMenu.x = pos.x;
  tabContextMenu.y = pos.y;
  tabContextMenu.open = true;
}

function openTabContextMenuFromButton(event, tab) {
  const rect = event?.currentTarget?.getBoundingClientRect?.();
  if (rect) {
    openTabContextMenuAt(rect.right - 230, rect.bottom + 6, tab);
  } else {
    openTabContextMenuAt(event?.clientX || 120, event?.clientY || 120, tab);
  }
}

function closeTabContextMenu() {
  tabContextMenu.open = false;
  tabContextMenu.tab = null;
}

function runContextAction(fn) {
  closeTabContextMenu();
  if (typeof fn === 'function') fn();
}

function onTabCardTouchStart(event, tab) {
  clearTimeout(tabLongPressTimer);
  const touch = event?.touches?.[0];
  if (!touch) return;
  tabLongPressStartX = touch.clientX;
  tabLongPressStartY = touch.clientY;
  suppressNextTabCardClick = false;

  tabLongPressTimer = setTimeout(() => {
    suppressNextTabCardClick = true;
    if (navigator.vibrate) {
      try { navigator.vibrate(15); } catch {}
    }
    openTabContextMenuAt(touch.clientX - 110, touch.clientY - 24, tab);
  }, 480);
}

function onTabCardTouchMove(event) {
  if (!tabLongPressTimer) return;
  const touch = event?.touches?.[0];
  if (!touch) return;
  const dx = Math.abs(touch.clientX - tabLongPressStartX);
  const dy = Math.abs(touch.clientY - tabLongPressStartY);
  if (dx > 10 || dy > 10) {
    clearTimeout(tabLongPressTimer);
    tabLongPressTimer = null;
  }
}

function onTabCardTouchEnd() {
  if (tabLongPressTimer) {
    clearTimeout(tabLongPressTimer);
    tabLongPressTimer = null;
  }
}

function handleTabCardClick(tab) {
  if (suppressNextTabCardClick) {
    suppressNextTabCardClick = false;
    return;
  }
  selectOpenTab(tab);
}

function handleCompleteTabPayment(tab) {
  if (!tab?.id) return;
  cartStore.loadTab(tab);
  handleProceedToCheckout();
  if (window.bootstrap) {
    const asideEl = document.getElementById('sellingAside');
    if (asideEl) {
      window.bootstrap.Offcanvas.getOrCreateInstance(asideEl).show();
    }
  }
}

async function copyTabNumber(tab) {
  const num = tab?.tab_number;
  if (!num) return;
  try {
    await navigator.clipboard.writeText(num);
    showToast('success', 'Copied', `${num} copied to clipboard.`);
  } catch {
    showToast('info', 'Tab Number', num);
  }
}

// ── Counter Tab Details & Timeline Modal ──
const showCounterTabDetails = ref(false);
const counterDetailsTab = ref(null);
const counterDetailsInitialView = ref('details');

function openCounterTabDetails(tab, initialView = 'details') {
  closeTabContextMenu();
  if (!tab) return;
  counterDetailsTab.value = tab;
  counterDetailsInitialView.value = initialView;
  showCounterTabDetails.value = true;
}

async function handleCounterTabDetailsUpdated({ tab: updatedTab, addedCount, proceedToCheckout }) {
  if (updatedTab?.id) {
    counterDetailsTab.value = updatedTab;
    const idx = openTabs.value.findIndex((t) => t.id === updatedTab.id);
    if (idx !== -1) openTabs.value[idx] = updatedTab;
    if (cartStore.activeTabId === updatedTab.id) {
      cartStore.loadTab(updatedTab);
    }
  }
  showToast('success', 'Tab Updated', `Added ${addedCount} item${addedCount === 1 ? '' : 's'} to tab.`);
  await fetchOpenTabs(true);

  if (proceedToCheckout && updatedTab) {
    showCounterTabDetails.value = false;
    handleCompleteTabPayment(updatedTab);
  }
}

// ── Counter Split Bill Modal ──
const showCounterSplitModal = ref(false);
const counterSplitTab = ref(null);
const isCounterSplittingTab = ref(false);
const counterSplitError = ref('');

function openCounterSplitModal(tab) {
  closeTabContextMenu();
  if (!tab || !canSplitTab(tab)) return;
  counterSplitTab.value = tab;
  counterSplitError.value = '';
  showCounterSplitModal.value = true;
}

function closeCounterSplitModal() {
  if (isCounterSplittingTab.value) return;
  showCounterSplitModal.value = false;
  counterSplitTab.value = null;
  counterSplitError.value = '';
}

async function confirmCounterSplitTab({ tab, items, newTabName, payNow }) {
  if (!tab?.id || !items?.length || isCounterSplittingTab.value) return;
  isCounterSplittingTab.value = true;
  counterSplitError.value = '';
  try {
    const res = await tabsApi.split(tab.id, items, newTabName);
    const createdTab = res.data?.data || res.data || null;
    showCounterSplitModal.value = false;
    counterSplitTab.value = null;

    await fetchOpenTabs(true);

    if (payNow && createdTab?.id) {
      showToast('success', 'Bill Split', `Created ${createdTab.tab_number}. Opening checkout.`);
      handleCompleteTabPayment(createdTab);
      return;
    }

    showToast('success', 'Bill Split', `Created ${createdTab?.tab_number || newTabName || 'new tab'} from ${tab.tab_number}.`);
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      Object.values(err?.response?.data?.errors || {})?.flat()?.[0] ||
      'Could not split tab.';
    counterSplitError.value = msg;
    showToast('error', 'Split Failed', msg);
  } finally {
    isCounterSplittingTab.value = false;
  }
}

function handleContextMenuKeydown(e) {
  if (e.key === 'Escape' && tabContextMenu.open) {
    closeTabContextMenu();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleContextMenuKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleContextMenuKeydown);
  if (tabLongPressTimer) clearTimeout(tabLongPressTimer);
});

function handleJointPaymentForShownTabs() {
  const tabsToSettle = filteredOpenTabs.value.filter(
    (t) => Number(t.balance_due ?? t.total_amount ?? 0) > 0
  );
  if (tabsToSettle.length === 0) return;
  cartStore.loadMultipleTabs(tabsToSettle);
  handleProceedToCheckout();
  if (window.bootstrap) {
    const asideEl = document.getElementById('sellingAside');
    if (asideEl) {
      window.bootstrap.Offcanvas.getOrCreateInstance(asideEl).show();
    }
  }
}

async function fetchOpenTabs(silent = true) {
  if (!silent || openTabs.value.length === 0) {
    isLoadingOpenTabs.value = true;
  }
  try {
    const branchId = shiftStore.activeShift?.branch_id || shiftStore.selectedBranchId || null;
    const params = { status: 'active' };
    if (branchId) params.branch_id = branchId;
    const res = await tabsApi.list(params);
    if (res.data?.success && Array.isArray(res.data?.data)) {
      openTabs.value = res.data.data;
    }
  } catch (err) {
    console.warn('Failed to load open tabs:', err);
  } finally {
    isLoadingOpenTabs.value = false;
  }
}

function switchToOpenTabs() {
  leftPanelTab.value = 'tabs';
  fetchOpenTabs(true);
}

function selectOpenTab(tab) {
  if (cartStore.activeTabId === tab.id) return;

  const hasUnsavedRegularCart = !cartStore.isEditingTab && !cartStore.isEmpty;
  const hasUnsavedTabAdditions = cartStore.isEditingTab && cartStore.pendingTabItemsCount > 0;

  if (hasUnsavedRegularCart || hasUnsavedTabAdditions) {
    pendingSwitchAction.value = { type: 'tab', tab };
    showUnsavedCartWarning.value = true;
    return;
  }

  cartStore.loadTab(tab);
}

function handleExitTab() {
  if (cartStore.isEditingTab && cartStore.pendingTabItemsCount > 0) {
    pendingSwitchAction.value = { type: 'exit' };
    showUnsavedCartWarning.value = true;
    return;
  }
  cartStore.clearCart();
}

function cancelPendingSwitch() {
  if (isSavingActiveTab.value) return;
  showUnsavedCartWarning.value = false;
  pendingSwitchAction.value = null;
}

function executePendingSwitch(discard = false) {
  const action = pendingSwitchAction.value;
  showUnsavedCartWarning.value = false;
  pendingSwitchAction.value = null;

  if (!action) return;
  if (action.type === 'tab' && action.tab) {
    cartStore.loadTab(action.tab);
  } else if (action.type === 'exit') {
    cartStore.clearCart();
  } else if (action.type === 'route' && action.to) {
    if (discard) {
      cartStore.clearCart();
    }
    bypassLeaveGuard.value = true;
    router.push(action.to);
  }
}

function confirmDiscardAndSwitch() {
  executePendingSwitch(true);
}

async function confirmSaveAndSwitch() {
  const ok = await saveActiveTabAdditions(false);
  if (ok) {
    executePendingSwitch(false);
  }
}

onBeforeRouteLeave((to) => {
  if (bypassLeaveGuard.value || !cartStore.hasUnsavedCart) {
    bypassLeaveGuard.value = false;
    return true;
  }
  pendingSwitchAction.value = { type: 'route', to };
  showUnsavedCartWarning.value = true;
  return false;
});

function handleBeforeUnload(event) {
  if (!cartStore.hasUnsavedCart) return;
  event.preventDefault();
  event.returnValue = '';
}

async function saveActiveTabAdditions(openPaymentAfter = false) {
  if (!cartStore.activeTabId) return false;
  const itemsToAdd = cartStore.pendingTabItems;

  if (itemsToAdd.length === 0) {
    return true;
  }

  const addedCount = cartStore.pendingTabItemsCount;
  const tabLabel = cartStore.activeTab?.tab_number || 'tab';
  isSavingActiveTab.value = true;
  showToast('loading', 'Adding Items to Tab', `Adding ${addedCount} item${addedCount === 1 ? '' : 's'} to ${tabLabel}...`);

  try {
    await tabsApi.addItems(cartStore.activeTabId, itemsToAdd);
    await fetchOpenTabs(true);
    const refreshed = openTabs.value.find((t) => t.id === cartStore.activeTabId);
    if (refreshed) {
      cartStore.loadTab(refreshed);
    }
    showToast(
      'success',
      'Items Added to Tab',
      `Added ${addedCount} item${addedCount === 1 ? '' : 's'} to <strong>${tabLabel}</strong>.`
    );
    return true;
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      Object.values(err?.response?.data?.errors || {})?.flat()?.[0] ||
      'Failed to add items to tab.';
    showToast('error', 'Could Not Update Tab', msg);
    return false;
  } finally {
    isSavingActiveTab.value = false;
  }
}

async function handleRecordPaymentForActiveTab() {
  if (!cartStore.activeTabId) return;
  if (cartStore.pendingTabItemsCount > 0) {
    const ok = await saveActiveTabAdditions(true);
    if (!ok) return;
  }
  handleProceedToCheckout();
  if (window.bootstrap) {
    const asideEl = document.getElementById('sellingAside');
    if (asideEl) {
      window.bootstrap.Offcanvas.getOrCreateInstance(asideEl).show();
    }
  }
}

async function submitTabPayment() {
  if (!cartStore.activeTabId || isSubmittingTabPayment.value) return;
  const amount = Number(tabPaymentForm.amount || 0);
  if (amount <= 0) return;

  isSubmittingTabPayment.value = true;
  const tabLabel = cartStore.activeTab?.tab_number || 'tab';
  showToast('loading', 'Recording Payment', `Recording ${formatMoney(amount)} on ${tabLabel}...`);

  try {
    await tabsApi.recordPayment(cartStore.activeTabId, {
      amount,
      method: tabPaymentForm.method,
      shift_id: shiftStore.activeShiftId || shiftStore.activeShift?.id || null,
      external_reference: tabPaymentForm.external_reference.trim() || null,
    });

    showTabPaymentModal.value = false;
    await fetchOpenTabs(true);

    const refreshed = openTabs.value.find((t) => t.id === cartStore.activeTabId);
    if (refreshed && Number(refreshed.balance_due) > 0) {
      cartStore.loadTab(refreshed);
      showToast(
        'success',
        'Payment Recorded',
        `Recorded ${formatMoney(amount)} on <strong>${tabLabel}</strong>. Remaining balance: ${formatMoney(refreshed.balance_due)}.`
      );
    } else {
      cartStore.clearCart();
      showToast(
        'success',
        'Tab Settled',
        `<strong>${tabLabel}</strong> has been paid in full.`
      );
    }
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      Object.values(err?.response?.data?.errors || {})?.flat()?.[0] ||
      'Failed to record payment.';
    showToast('error', 'Payment Failed', msg);
  } finally {
    isSubmittingTabPayment.value = false;
  }
}
const skeletonRows = Array.from({ length: 8 });
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

const cartScrollRef = ref(null);

function scrollCartToItem(productId = null) {
  nextTick(() => {
    const container = cartScrollRef.value;
    if (!container) return;

    if (productId != null) {
      const row = container.querySelector(`[data-cart-item-id="${productId}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
    }
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  });
}

watch(
  () => cartStore.items.length,
  (nextLen, prevLen) => {
    if (nextLen > prevLen) {
      const last = cartStore.items[cartStore.items.length - 1];
      scrollCartToItem(last?.id);
    }
  }
);

const handleProductClick = (product) => {
  cartStore.addItem(product, 1);
  scrollCartToItem(product.id);
};

// Item-level Discount & OTP Approval Modal
const showItemDiscountModal = ref(false);
const discountTargetItemId = ref(null);
const discountTargetItem = computed(() =>
  cartStore.items.find((i) => i.id === discountTargetItemId.value) || null
);

function openItemDiscountModal(cartItem) {
  discountTargetItemId.value = cartItem.id;
  showItemDiscountModal.value = true;
}

function closeItemDiscountModal() {
  showItemDiscountModal.value = false;
  discountTargetItemId.value = null;
}

function onItemDiscountApplied(payload) {
  cartStore.setItemDiscount(payload.productId, payload);
  closeItemDiscountModal();
  showToast('Discount Applied', payload.message || 'Item discount applied successfully.');
}

function onItemDiscountRemoved(productId) {
  cartStore.clearItemDiscount(productId);
  closeItemDiscountModal();
  showToast('Discount Removed', 'Item restored to regular price.');
}

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

const reopenReceiptAfterCustomer = ref(false);
const pendingReceiptCustomer = ref(null);

const openCustomerModal = () => {
  showCustomerDropdown.value = false;
  if (window.bootstrap) {
    const el = document.getElementById('addCustomerModal');
    if (el) {
      const m = window.bootstrap.Modal.getOrCreateInstance(el);
      m.show();
    }
  }
};

const openCustomerModalFromReceipt = () => {
  showCustomerDropdown.value = false;
  reopenReceiptAfterCustomer.value = true;
  pendingReceiptCustomer.value = null;

  if (!window.bootstrap) return;
  const receiptEl = document.getElementById('receiptModal');
  const custEl = document.getElementById('addCustomerModal');
  if (!custEl) return;

  const openCustAndRestoreReceipt = () => {
    // When the customer modal closes (save OR cancel), cleanly reopen the receipt modal
    custEl.addEventListener(
      'hidden.bs.modal',
      async () => {
        if (!reopenReceiptAfterCustomer.value) return;
        const newlyCreated = pendingReceiptCustomer.value;
        reopenReceiptAfterCustomer.value = false;
        pendingReceiptCustomer.value = null;

        if (receiptEl) {
          const rm = window.bootstrap.Modal.getOrCreateInstance(receiptEl);
          rm.show();
        }
        if (newlyCreated) {
          await receiptModalRef.value?.attachCustomerAndSave(newlyCreated);
        }
      },
      { once: true }
    );

    const cm = window.bootstrap.Modal.getOrCreateInstance(custEl);
    cm.show();
  };

  if (receiptEl && receiptEl.classList.contains('show')) {
    receiptEl.addEventListener('hidden.bs.modal', openCustAndRestoreReceipt, { once: true });
    window.bootstrap.Modal.getOrCreateInstance(receiptEl).hide();
  } else {
    openCustAndRestoreReceipt();
  }
};

const onCustomerCreated = (customer) => {
  if (reopenReceiptAfterCustomer.value) {
    pendingReceiptCustomer.value = customer;
    return;
  }
  cartStore.setCustomer(customer);
};

const openCustomerProfileModal = () => {
  if (window.bootstrap) {
    const el = document.getElementById('counterCustomerProfileModal');
    if (el) {
      const m = window.bootstrap.Modal.getOrCreateInstance(el);
      m.show();
    }
  }
};

const handleViewCustomerBills = (targetCustomer = null) => {
  const cust = targetCustomer || cartStore.customer;
  // Close checkout drawer if open so the cashier sees the customer's Open Tabs immediately
  if (window.bootstrap) {
    const asideEl = document.getElementById('sellingAside');
    if (asideEl && asideEl.classList.contains('show')) {
      window.bootstrap.Offcanvas.getOrCreateInstance(asideEl).hide();
    }
  }
  leftPanelTab.value = 'tabs';
  openTabStatusFilter.value = 'all';
  openTabCashierFilter.value = 'all'; // Show all of this customer's tabs across all cashiers
  if (cust?.id) {
    openTabCustomerFilter.value = String(cust.id);
    openTabSearch.value = '';
  } else {
    openTabCustomerFilter.value = 'all';
    openTabSearch.value = cust?.name || cust?.phone || '';
  }
  fetchOpenTabs(true);
};

// Shift Interception Gate
const isJoiningShift = ref(false);

const openShiftModal = () => {
  shiftStore.openModal();
};

const handleDirectJoinShift = async () => {
  isJoiningShift.value = true;
  try {
    const res = await shiftStore.joinActiveShift();
    if (!res.success) {
      shiftStore.openModal();
    }
  } finally {
    isJoiningShift.value = false;
  }
};

const handleProceedToCheckout = async () => {
  if (!shiftStore.isOnDuty) {
    if (shiftStore.hasActiveShift && !shiftStore.isJoined) {
      isJoiningShift.value = true;
      try {
        const res = await shiftStore.joinActiveShift();
        if (!res.success) {
          shiftStore.openModal();
          return;
        }
      } catch (err) {
        console.warn('Could not auto-join shift:', err);
      } finally {
        isJoiningShift.value = false;
      }
    } else if (!shiftStore.hasActiveShift) {
      shiftStore.openModal();
      return;
    }
  }

  const asideEl = document.getElementById('sellingAside');
  if (asideEl && window.bootstrap?.Offcanvas) {
    const oc = window.bootstrap.Offcanvas.getOrCreateInstance(asideEl);
    oc.show();
  }
};

const onShiftUpdated = () => {
  shiftStore.checkCurrentShift();
};

const onTabSaved = () => {
  const asideEl = document.getElementById('saveTabAside');
  if (asideEl && window.bootstrap?.Offcanvas) {
    window.bootstrap.Offcanvas.getInstance(asideEl)?.hide();
  }
  fetchOpenTabs(true);
};

const onSaleCompleted = (order) => {
  completedOrder.value = order;
  fetchOpenTabs(true);
  if (window.bootstrap) {
    const el = document.getElementById('receiptModal');
    if (el) {
      const m = window.bootstrap.Modal.getOrCreateInstance(el);
      m.show();
    }
  }
};

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Fire products, open tabs, and shift status in parallel immediately (no waterfall)
  fetchProducts();
  fetchOpenTabs(true);

  const shiftPromise = shiftStore.checkCurrentShift().then(async () => {
    if (shiftStore.hasActiveShift && !shiftStore.isJoined) {
      await shiftStore.joinActiveShift();
    }
  });

  if (route.query.tab_ids) {
    leftPanelTab.value = 'tabs';
    const rawIds = String(route.query.tab_ids)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (rawIds.length > 0) {
      try {
        const responses = await Promise.all(rawIds.map((id) => tabsApi.get(id).catch(() => null)));
        const loadedTabs = responses
          .map((r) => (r?.data?.success && r?.data?.data ? r.data.data : null))
          .filter(Boolean);
        if (loadedTabs.length > 0) {
          cartStore.loadMultipleTabs(loadedTabs);
        }
      } catch (err) {
        console.error('Failed to load joint tabs from query:', err);
      }
    }
  } else if (route.query.tab_id) {
    leftPanelTab.value = 'tabs';
    try {
      const res = await tabsApi.get(route.query.tab_id);
      if (res.data?.success && res.data?.data) {
        cartStore.loadTab(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load tab from query:', err);
    }
  }

  await shiftPromise;

  if ((route.query.tab_id || route.query.tab_ids) && String(route.query.checkout) === '1' && !cartStore.isEmpty) {
    await nextTick();
    handleProceedToCheckout();
    if (window.bootstrap) {
      const asideEl = document.getElementById('sellingAside');
      if (asideEl) {
        window.bootstrap.Offcanvas.getOrCreateInstance(asideEl).show();
      }
    }
    const { checkout, ...restQuery } = route.query;
    router.replace({ query: restQuery });
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

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
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

.product-img {
  width: 50px;
  height: 50px;
  overflow: hidden;
  border-radius: 8px;
  background-color: #f8f9fa;
  min-width: 50px;
  max-width: 50px;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.border-success-muted {
  border-color: rgba(var(--bs-success-rgb, 52, 195, 143), 0.5) !important;
}

.bg-dark-muted {
  background-color: rgba(var(--bs-dark-rgb, 42, 48, 66), 0.05) !important;
}

.truncate-singleLine {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-right {
  text-align: right !important;
}

.counter-panel-tabs .btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
}

.counter-tab-card {
  transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease;
}

.counter-tab-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  border-color: #cbd5e1 !important;
}

.counter-tab-card.is-active {
  border-color: var(--bs-primary, #3b82f6) !important;
  box-shadow: 0 0 0 1px var(--bs-primary, #3b82f6);
}

.qty-locked {
  opacity: 0.28;
  cursor: not-allowed !important;
}

.cart-editing-tab {
  border: 2px solid var(--bs-primary, #3b82f6) !important;
}

.header-cart-counter.is-cart-mode {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.header-cart-counter.is-tab-mode {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
}

.header-cart-icon {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
}

.header-cart-amount {
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.3px;
  font-variant-numeric: tabular-nums;
}

.cart-container .table > :not(caption) > * > * {
  background-color: #ffffff;
}

@media (min-width: 992px) {
  .counter-main-card {
    min-height: calc(100vh - 160px);
    display: flex;
    flex-direction: column;
  }

  .counter-main-card > .card-body.border-bottom {
    flex: 0 0 auto;
  }

  .counter-main-card > .card-body:not(.border-bottom) {
    flex: 1 1 auto;
  }

  .counter-cart-card {
    position: sticky;
    top: 76px;
    height: calc(100vh - 92px);
    max-height: calc(100vh - 92px);
    display: flex;
    flex-direction: column;
  }

  .counter-cart-card .cart-container {
    flex: 1 1 0%;
    min-height: 0;
    overflow-y: auto;
  }
}

@media (max-width: 991.98px) {
  .counter-cart-card {
    position: static;
    height: auto;
    display: flex;
    flex-direction: column;
  }

  .counter-cart-card .cart-container {
    max-height: 45vh;
    overflow-y: auto;
  }
}

/* Cart scrollbar: hidden until hovered */
.counter-cart-card .cart-container {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.counter-cart-card .cart-container:hover {
  scrollbar-color: rgba(100, 116, 139, 0.4) transparent;
}

.counter-cart-card .cart-container::-webkit-scrollbar {
  width: 6px;
}

.counter-cart-card .cart-container::-webkit-scrollbar-track {
  background: transparent;
}

.counter-cart-card .cart-container::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 999px;
}

.counter-cart-card .cart-container:hover::-webkit-scrollbar-thumb {
  background-color: rgba(100, 116, 139, 0.38);
}

.counter-cart-card .cart-container:hover::-webkit-scrollbar-thumb:hover {
  background-color: rgba(100, 116, 139, 0.62);
}

.cart-summary-table td,
.cart-summary-table th {
  border-bottom-color: rgba(52, 195, 143, 0.25);
}

.cart-summary-table tr:last-child td,
.cart-summary-table tr:last-child th {
  border-bottom: 0;
}

.tab-timeline-track {
  display: flex;
  align-items: center;
  gap: 0;
}

.tab-timeline-dot-start {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tab-timeline-rail {
  flex: 1;
  height: 2px;
  background-color: #cbd5e1;
  position: relative;
  overflow: hidden;
}

.tab-timeline-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.tab-timeline-dot-end {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  background-color: #ffffff;
  flex-shrink: 0;
}

.counter-tab-card {
  user-select: none;
  -webkit-touch-callout: none;
}

.counter-tab-card.is-menu-open {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.35);
}

.counter-tab-more-btn {
  border-radius: 6px;
  color: #64748b !important;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.counter-tab-more-btn:hover {
  background-color: rgba(15, 23, 42, 0.06);
  color: #0f172a !important;
}

.counter-tab-actions {
  border-color: rgba(15, 23, 42, 0.08) !important;
}

.counter-tab-menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1080;
  background-color: rgba(15, 23, 42, 0.08);
}

.counter-tab-context-menu {
  position: fixed;
  width: 236px;
  background-color: #ffffff;
  border: 1px solid #edf0f5;
  border-radius: 10px;
  overflow: hidden;
  z-index: 1085;
  animation: tabMenuPop 0.12s ease-out;
}

.counter-tab-menu-item {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 9px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #1e293b;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.counter-tab-menu-item:hover {
  background-color: #f8fafc;
}

@keyframes tabMenuPop {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
