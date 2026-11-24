<template>
  <div class="tabs-page">
    <!-- Page Title (Consistent with Overview & Shifts.List.vue) -->
    <div class="row">
      <div class="col-12">
        <div class="page-title-box d-flex align-items-center justify-content-between gap-2 flex-wrap">
          <div class="min-w-0">
            <h4 class="mb-sm-0 font-size-18 pb-2 text-truncate">Open Tabs &amp; Bills</h4>
            <div class="page-title-right">
              <ol class="breadcrumb m-0 flex-nowrap">
                <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
                <li class="breadcrumb-item"><router-link to="/sell">Selling</router-link></li>
                <li class="breadcrumb-item active text-truncate">Tabs &amp; Bills</li>
              </ol>
            </div>
          </div>

          <div class="d-flex align-items-center gap-2 flex-shrink-0">
            <!-- Role-Based Aging Settings Button (Owners & Managers only) -->
            <button
              v-if="canManageAgingSettings"
              type="button"
              class="btn btn-white border d-inline-flex align-items-center gap-1.5"
              title="Configure tab aging thresholds"
              @click="showAgingSettingsModal = true"
            >
              <Icon icon="ri:settings-3-line" class="fs-5" />
              <span class="d-none d-sm-inline">Aging Settings</span>
            </button>

            <router-link
              to="/sell/tables"
              class="btn btn-white border d-inline-flex align-items-center gap-1.5"
            >
              <i class="bx bx-restaurant fs-5"></i>
              <span class="d-none d-md-inline">Floor &amp; Tables</span>
            </router-link>

            <router-link
              to="/sell"
              class="btn btn-primary text-white d-inline-flex align-items-center gap-1.5"
            >
              <i class="bx bx-cart fs-5"></i>
              <span class="d-none d-sm-inline">Open Counter POS</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <div class="d-flex flex-column gap-3">
      <!-- Purpose & Active Aging Threshold Line (Matching Overview) -->
      <p class="text-muted mb-0 font-size-13">
        Track running customer tabs, monitor unpaid bill aging, and settle open orders.
        <span class="small text-nowrap ms-1">
          · Aging rules: Extended {{ formatMinutesShort(tabAgingConfig.extendedMinutes) }}+ · Overdue {{ formatMinutesShort(tabAgingConfig.overdueMinutes) }}+
        </span>
      </p>

      <!-- Overview-style Page Tabs Navigation -->
      <nav class="page-tabs" role="tablist" aria-label="Tab status sections">
        <button
          v-for="nav in navTabs"
          :key="nav.key"
          type="button"
          class="page-tab"
          :class="{ active: statusFilter === nav.key }"
          role="tab"
          :aria-selected="statusFilter === nav.key"
          @click="changeStatusFilter(nav.key)"
        >
          <Icon :icon="statusFilter === nav.key ? nav.activeIcon : nav.icon" class="fs-5" />
          <span>{{ nav.label }}</span>
          <span class="count" :class="{ 'is-zero': nav.count === 0 }">{{ nav.count }}</span>
        </button>
      </nav>

      <!-- KPI Cards (Consistent with Shifts.List.vue) -->
      <div class="row g-3">
        <div v-for="k in kpiCards" :key="k.key" class="col-sm-6 col-xl-3">
          <div class="card mini-stats-wid flat-card mb-0 h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="flex-grow-1 min-w-0">
                  <p class="text-muted fw-medium mb-1 text-truncate font-size-13">{{ k.label }}</p>
                  <h4 class="mb-0 text-truncate font-size-20 fw-bold">{{ k.value }}</h4>
                  <p class="font-size-12 mb-0 mt-1 text-muted text-truncate">{{ k.note }}</p>
                </div>
                <span class="avatar-sm flex-shrink-0 ms-2">
                  <span class="avatar-title rounded-circle tone-chip font-size-22" :style="{ '--tone': k.color }">
                    <Icon :icon="k.icon" />
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Tabs Content Card -->
      <div class="card flat-card">
        <!-- Toolbar: Refresh, Search, Filters, View Toggle -->
        <div class="card-body border-bottom">
          <div class="d-flex gap-2 align-items-center flex-wrap flex-lg-nowrap">
            <!-- Refresh Button -->
            <button
              type="button"
              class="btn waves-effect btn-light position-relative p-0 avatar-sm rounded-circle flex-shrink-0"
              :disabled="isLoading"
              title="Refresh tabs"
              @click="fetchTabs()"
            >
              <span class="avatar-title bg-transparent text-reset">
                <Icon icon="boxicons:refresh-ccw" class="fs-4" :class="{ 'spin-anim': isLoading }" />
              </span>
            </button>

            <!-- Search Input -->
            <div class="flex-grow-1" style="min-width: 200px;">
              <div class="search-box mb-0 me-0">
                <div class="position-relative">
                  <form @submit.prevent class="input-group bg-light rounded pb-0 flex-nowrap">
                    <div class="flex-grow-1 position-relative">
                      <input
                        v-model="searchQuery"
                        style="border-radius: 0px; padding-right: 35px;"
                        type="text"
                        class="form-control bg-light rounded flex-grow-1"
                        placeholder="Search tab #, name, customer, table, or staff..."
                        spellcheck="false"
                        aria-label="Search tabs"
                      />
                      <i class="bx bx-search-alt search-icon fs-4"></i>
                      <i
                        v-if="searchQuery"
                        title="Clear search"
                        style="right: 15px; left: unset;"
                        class="mdi mdi-close search-icon cursor-pointer fs-3 waves-effect"
                        @click="searchQuery = ''"
                      ></i>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <!-- Desktop Filters -->
            <div class="d-none d-xl-flex align-items-center gap-2 flex-shrink-0">
              <!-- Filter by User (Staff / Opened By) -->
              <div class="dropdown">
                <button
                  class="btn btn-light waves-effect d-flex align-items-center gap-1.5 fw-semibold font-size-13"
                  :class="{ 'border-primary text-primary bg-primary-subtle': selectedUserId !== 'all' }"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <Icon icon="ri:user-line" class="fs-5" />
                  <span class="text-truncate" style="max-width: 110px;">{{ selectedUserLabel }}</span>
                  <i class="mdi mdi-chevron-down"></i>
                </button>
                <div class="dropdown-menu dropdown-menu-end p-1" style="min-width: 210px; max-height: 280px; overflow-y: auto;">
                  <h6 class="dropdown-header font-size-11 text-uppercase">Filter by Staff</h6>
                  <a
                    href="javascript:void(0);"
                    class="dropdown-item rounded font-size-13"
                    :class="{ active: selectedUserId === 'all' }"
                    @click="selectedUserId = 'all'"
                  >
                    All Staff
                  </a>
                  <a
                    v-for="u in userOptions"
                    :key="u.id"
                    href="javascript:void(0);"
                    class="dropdown-item rounded font-size-13 d-flex justify-content-between align-items-center"
                    :class="{ active: selectedUserId === u.id }"
                    @click="selectedUserId = u.id"
                  >
                    <span class="text-truncate">{{ u.name }}</span>
                    <span class="badge bg-light text-muted ms-2">{{ u.count }}</span>
                  </a>
                </div>
              </div>

              <!-- Filter by Customer -->
              <div class="dropdown">
                <button
                  class="btn btn-light waves-effect d-flex align-items-center gap-1.5 fw-semibold font-size-13"
                  :class="{ 'border-primary text-primary bg-primary-subtle': selectedCustomerId !== 'all' }"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <Icon icon="ri:contacts-line" class="fs-5" />
                  <span class="text-truncate" style="max-width: 120px;">{{ selectedCustomerLabel }}</span>
                  <i class="mdi mdi-chevron-down"></i>
                </button>
                <div class="dropdown-menu dropdown-menu-end p-1" style="min-width: 230px; max-height: 280px; overflow-y: auto;">
                  <h6 class="dropdown-header font-size-11 text-uppercase">Filter by Customer</h6>
                  <a
                    href="javascript:void(0);"
                    class="dropdown-item rounded font-size-13"
                    :class="{ active: selectedCustomerId === 'all' }"
                    @click="selectedCustomerId = 'all'"
                  >
                    All Customers
                  </a>
                  <a
                    href="javascript:void(0);"
                    class="dropdown-item rounded font-size-13"
                    :class="{ active: selectedCustomerId === 'walkin' }"
                    @click="selectedCustomerId = 'walkin'"
                  >
                    Walk-in / No Customer
                  </a>
                  <div v-if="customerOptions.length" class="dropdown-divider"></div>
                  <a
                    v-for="c in customerOptions"
                    :key="c.id"
                    href="javascript:void(0);"
                    class="dropdown-item rounded font-size-13 d-flex justify-content-between align-items-center"
                    :class="{ active: selectedCustomerId === c.id }"
                    @click="selectedCustomerId = c.id"
                  >
                    <span class="text-truncate">{{ c.name }}</span>
                    <span class="badge bg-light text-muted ms-2">{{ c.count }}</span>
                  </a>
                </div>
              </div>

              <!-- Filter by Figure Range (Amount) -->
              <div class="dropdown">
                <button
                  class="btn btn-light waves-effect d-flex align-items-center gap-1.5 fw-semibold font-size-13"
                  :class="{ 'border-primary text-primary bg-primary-subtle': hasAmountFilter }"
                  type="button"
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                  aria-expanded="false"
                >
                  <Icon icon="ri:money-dollar-circle-line" class="fs-5" />
                  <span>{{ amountFilterLabel }}</span>
                  <i class="mdi mdi-chevron-down"></i>
                </button>
                <div class="dropdown-menu dropdown-menu-end p-3" style="min-width: 270px;">
                  <h6 class="dropdown-header px-0 pt-0 font-size-11 text-uppercase">Amount Range (KES)</h6>
                  <div class="d-flex flex-wrap gap-1.5 mb-3">
                    <button
                      v-for="p in amountPresets"
                      :key="p.key"
                      type="button"
                      class="btn btn-xs px-2 py-1 font-size-11 rounded-pill"
                      :class="isAmountPresetActive(p) ? 'btn-primary' : 'btn-light border'"
                      @click="applyAmountPreset(p)"
                    >
                      {{ p.label }}
                    </button>
                  </div>
                  <div class="row g-2 mb-2">
                    <div class="col-6">
                      <label class="form-label font-size-11 text-muted mb-1">Min (KES)</label>
                      <input
                        v-model="minAmount"
                        type="number"
                        min="0"
                        placeholder="0"
                        class="form-control form-control-sm font-size-12"
                      />
                    </div>
                    <div class="col-6">
                      <label class="form-label font-size-11 text-muted mb-1">Max (KES)</label>
                      <input
                        v-model="maxAmount"
                        type="number"
                        min="0"
                        placeholder="Any"
                        class="form-control form-control-sm font-size-12"
                      />
                    </div>
                  </div>
                  <div v-if="hasAmountFilter" class="text-end">
                    <button
                      type="button"
                      class="btn btn-link btn-sm p-0 text-decoration-none font-size-11"
                      @click="minAmount = ''; maxAmount = ''"
                    >
                      Clear range
                    </button>
                  </div>
                </div>
              </div>

              <!-- Filter by Aging -->
              <div class="dropdown">
                <button
                  class="btn btn-light waves-effect d-flex align-items-center gap-1.5 fw-semibold font-size-13"
                  :class="{ 'border-primary text-primary bg-primary-subtle': selectedAging !== 'all' }"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <Icon icon="ri:time-line" class="fs-5" />
                  <span>{{ selectedAgingLabel }}</span>
                  <i class="mdi mdi-chevron-down"></i>
                </button>
                <div class="dropdown-menu dropdown-menu-end p-1" style="min-width: 220px;">
                  <h6 class="dropdown-header font-size-11 text-uppercase">Filter by Aging Tier</h6>
                  <a
                    v-for="opt in agingOptions"
                    :key="opt.key"
                    href="javascript:void(0);"
                    class="dropdown-item rounded font-size-13 d-flex align-items-center justify-content-between"
                    :class="{ active: selectedAging === opt.key }"
                    @click="selectedAging = opt.key"
                  >
                    <span class="d-flex align-items-center gap-2">
                      <span
                        v-if="opt.dot"
                        class="rounded-circle d-inline-block"
                        :style="{ width: '8px', height: '8px', backgroundColor: opt.dot }"
                      ></span>
                      <span>{{ opt.label }}</span>
                    </span>
                  </a>
                </div>
              </div>
            </div>

            <!-- Compact Mobile / Tablet Filters Dropdown (< xl) -->
            <div class="dropdown d-flex d-xl-none flex-shrink-0">
              <button
                type="button"
                title="Filter tabs"
                class="btn btn-light waves-effect position-relative p-0 avatar-sm rounded-circle"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                aria-expanded="false"
              >
                <span class="avatar-title bg-transparent text-reset">
                  <i class="mdi mdi-filter-variant fs-4"></i>
                </span>
                <span v-if="activeFilterCount > 0" class="filter-dot"></span>
              </button>
              <div class="dropdown-menu dropdown-menu-end p-3" style="min-width: 280px; max-height: 75vh; overflow-y: auto;">
                <div class="mb-2.5">
                  <label class="form-label font-size-11 fw-bold text-uppercase text-muted mb-1">Staff / Opened By</label>
                  <select v-model="selectedUserId" class="form-select form-select-sm font-size-12">
                    <option value="all">All Staff</option>
                    <option v-for="u in userOptions" :key="`m-u-${u.id}`" :value="u.id">{{ u.name }} ({{ u.count }})</option>
                  </select>
                </div>
                <div class="mb-2.5">
                  <label class="form-label font-size-11 fw-bold text-uppercase text-muted mb-1">Customer</label>
                  <select v-model="selectedCustomerId" class="form-select form-select-sm font-size-12">
                    <option value="all">All Customers</option>
                    <option value="walkin">Walk-in / No Customer</option>
                    <option v-for="c in customerOptions" :key="`m-c-${c.id}`" :value="c.id">{{ c.name }} ({{ c.count }})</option>
                  </select>
                </div>
                <div class="mb-2.5">
                  <label class="form-label font-size-11 fw-bold text-uppercase text-muted mb-1">Aging Tier</label>
                  <select v-model="selectedAging" class="form-select form-select-sm font-size-12">
                    <option v-for="opt in agingOptions" :key="`m-a-${opt.key}`" :value="opt.key">{{ opt.label }}</option>
                  </select>
                </div>
                <div class="row g-2 mb-2">
                  <div class="col-6">
                    <label class="form-label font-size-11 fw-bold text-uppercase text-muted mb-1">Min KES</label>
                    <input v-model="minAmount" type="number" min="0" placeholder="0" class="form-control form-control-sm font-size-12" />
                  </div>
                  <div class="col-6">
                    <label class="form-label font-size-11 fw-bold text-uppercase text-muted mb-1">Max KES</label>
                    <input v-model="maxAmount" type="number" min="0" placeholder="Any" class="form-control form-control-sm font-size-12" />
                  </div>
                </div>
                <button
                  v-if="activeFilterCount > 0"
                  type="button"
                  class="btn btn-sm btn-light border w-100 font-size-12 mt-1"
                  @click="clearAllFilters"
                >
                  Clear All Filters
                </button>
              </div>
            </div>

            <!-- View Toggle: Grid vs Table (Matching Counter.vue) -->
            <div class="btn-group flex-shrink-0" role="group" aria-label="View mode">
              <button
                type="button"
                class="btn btn-light waves-effect"
                :class="{ 'btn-dark text-white': viewMode === 'grid' }"
                title="Grid view"
                @click="setViewMode('grid')"
              >
                <i class="bx bx-grid-alt fs-5"></i>
              </button>
              <button
                type="button"
                class="btn btn-light waves-effect"
                :class="{ 'btn-dark text-white': viewMode === 'table' }"
                title="Table view"
                @click="setViewMode('table')"
              >
                <i class="bx bx-list-ul fs-5"></i>
              </button>
            </div>
          </div>

          <!-- Active Filter Chips Strip -->
          <div
            v-if="activeFilterChips.length > 0"
            class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-2.5 pt-2.5 border-top"
          >
            <div class="d-flex align-items-center flex-wrap gap-1.5">
              <span class="font-size-11 text-muted fw-semibold me-1">Active filters:</span>
              <span
                v-for="chip in activeFilterChips"
                :key="chip.key"
                class="badge bg-primary-subtle text-primary border border-primary-subtle font-size-11 px-2.5 py-1 rounded-pill d-inline-flex align-items-center gap-1.5"
              >
                <span>{{ chip.label }}</span>
                <i class="mdi mdi-close cursor-pointer" @click="chip.clear()"></i>
              </span>
              <button
                type="button"
                class="btn btn-link btn-sm p-0 ms-1 font-size-11 text-muted text-decoration-none"
                @click="clearAllFilters"
              >
                Clear all
              </button>
            </div>
            <span class="font-size-12 text-muted">
              Showing <strong>{{ filteredTabs.length }}</strong> of {{ tabsForCurrentSection.length }}
            </span>
          </div>
        </div>

        <!-- Card Body: Loading / Empty / Grid / Table -->
        <div class="card-body p-0">
          <!-- Initial Loading -->
          <div v-if="isLoading && allTabs.length === 0" class="text-center py-5">
            <div class="spinner-border text-primary spinner-border-sm mb-2" role="status"></div>
            <p class="text-muted font-size-13 mb-0">Loading tabs...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredTabs.length === 0" class="text-center py-5 px-3">
            <i class="bx bx-receipt fs-1 text-muted opacity-50 mb-2"></i>
            <h5 class="fw-semibold text-dark font-size-15 mb-1">
              {{ activeFilterCount > 0 || searchQuery ? 'No matching tabs found' : emptyStateTitle }}
            </h5>
            <p class="text-muted font-size-13 mb-3">
              {{ activeFilterCount > 0 || searchQuery ? 'Try adjusting or clearing your filters to see more tabs.' : emptyStateSubtitle }}
            </p>
            <div class="d-flex justify-content-center gap-2">
              <button
                v-if="activeFilterCount > 0 || searchQuery"
                type="button"
                class="btn btn-sm btn-light border px-3"
                @click="clearAllFilters"
              >
                Clear Filters
              </button>
              <router-link to="/sell" class="btn btn-sm btn-primary px-3">
                <i class="bx bx-plus me-1"></i> Start a Sale at Counter
              </router-link>
            </div>
          </div>

          <!-- ==================== GRID VIEW (Consistent with SaveTabAside.vue) ==================== -->
          <div v-else-if="viewMode === 'grid'" class="p-3">
            <div class="row g-3">
              <div
                v-for="tab in filteredTabs"
                :key="tab.id"
                class="col-12 col-md-6 col-xl-4"
              >
                <div
                  class="card border-0 shadow-none text-start overflow-hidden position-relative h-100 mb-0 transition-all"
                  :style="{
                    backgroundColor: getTabAgingTheme(tab).cardBg,
                    borderRadius: '14px',
                    border: '1px solid ' + getTabAgingTheme(tab).cardBorder + ' !important',
                    borderBottom: '3.5px solid ' + getTabAgingTheme(tab).bottomBorder + ' !important',
                  }"
                >
                  <div class="card-body p-3.5 d-flex flex-column justify-content-between">
                    <div>
                      <!-- Card Header: Tab Name / Table & Time / Balance & Aging Badge -->
                      <div class="d-flex justify-content-between align-items-start mb-3.5">
                        <div class="overflow-hidden pe-2">
                          <h6
                            class="fw-bold mb-1.5 text-dark font-size-14 text-truncate"
                            style="line-height: 1.3;"
                            :title="tab.name || tab.tab_number"
                          >
                            {{ tab.name || (tab.customer?.name ? `${tab.customer.name}'s Tab` : tab.tab_number) }}
                          </h6>
                          <div class="d-flex align-items-center flex-wrap gap-1 font-size-11" style="color: #64748b;">
                            <span class="font-monospace fw-semibold text-dark">{{ tab.tab_number }}</span>
                            <span class="mx-0.5">•</span>
                            <template v-if="getTabTableDisplay(tab)">
                              <i class="mdi mdi-map-marker font-size-13 text-secondary"></i>
                              <span class="fw-medium text-dark">{{ getTabTableDisplay(tab) }}</span>
                              <span class="mx-0.5">•</span>
                            </template>
                            <i class="mdi mdi-clock-outline font-size-12 text-secondary"></i>
                            <span>{{ formatTabRelativeTime(tab.opened_at || tab.created_at || tab.updated_at) }}</span>
                          </div>
                        </div>

                        <div class="text-end flex-shrink-0">
                          <div
                            class="fw-bold font-size-15"
                            :style="{ color: getTabAgingTheme(tab).priceColor, lineHeight: 1.2 }"
                          >
                            KES {{ formatMoney(tab.balance_due > 0 ? tab.balance_due : tab.total_amount) }}
                          </div>
                          <span
                            class="badge font-size-10 px-2.5 py-0.5 fw-bold rounded-pill"
                            :style="{
                              backgroundColor: getTabAgingTheme(tab).badgeBg,
                              color: getTabAgingTheme(tab).badgeText,
                              border: '1px solid ' + getTabAgingTheme(tab).badgeBorder,
                              letterSpacing: '0.2px',
                              marginTop: '3px',
                              display: 'inline-block',
                            }"
                          >
                            {{ getTabAgingTheme(tab).label }}
                          </span>
                        </div>
                      </div>

                      <!-- Staff & Customer Attribution -->
                      <div class="d-flex align-items-center justify-content-between gap-2 font-size-11 mb-2 pb-2" style="color: #64748b; border-bottom: 1px dashed rgba(100, 116, 139, 0.2);">
                        <div class="text-truncate" :title="getCustomerName(tab)">
                          <i class="mdi mdi-account-outline me-1"></i>
                          <span class="fw-medium text-dark">{{ getCustomerName(tab) }}</span>
                        </div>
                        <div v-if="tab.opened_by?.name" class="text-truncate flex-shrink-0" :title="`Opened by ${tab.opened_by.name}`">
                          <i class="mdi mdi-badge-account-outline me-1"></i>
                          <span>{{ tab.opened_by.name }}</span>
                        </div>
                      </div>

                      <!-- Itemized List with Increased Top Spacing & Fog Fade -->
                      <div class="position-relative pt-1 mt-1 mb-2.5">
                        <div
                          class="d-flex flex-column gap-2 transition-all"
                          :style="(!expandedTabs[tab.id] && (tab.items?.length > 2)) ? 'max-height: 52px; overflow: hidden;' : ''"
                        >
                          <div
                            v-for="(item, idx) in (tab.items || [])"
                            :key="item.id || idx"
                            class="d-flex justify-content-between align-items-baseline"
                            style="color: #334155; font-size: 11px; line-height: 1.45;"
                          >
                            <div class="text-truncate pe-2">
                              <span class="fw-medium">{{ idx + 1 }}. {{ item.item_name || item.name || 'Item' }}</span>
                              <span v-if="item.quantity && Number(item.quantity) > 1" class="text-muted ms-1">({{ Number(item.quantity) }})</span>
                            </div>
                            <div class="fw-semibold text-dark text-nowrap" style="font-size: 11px;">
                              KES {{ Number(item.total_amount ?? (Number(item.unit_price || 0) * Number(item.quantity || 1))).toFixed(2) }}
                            </div>
                          </div>

                          <div v-if="!tab.items || tab.items.length === 0" class="text-muted fst-italic py-0.5" style="font-size: 11px;">
                            No items recorded
                          </div>
                        </div>

                        <!-- Fog Fade Overlay -->
                        <div
                          v-if="!expandedTabs[tab.id] && (tab.items?.length > 2)"
                          class="position-absolute bottom-0 start-0 end-0 pointer-events-none"
                          :style="{
                            height: '28px',
                            background: getTabAgingTheme(tab).fadeGradient,
                          }"
                        ></div>
                      </div>

                      <!-- Items Count & Show Details Toggle -->
                      <div class="d-flex justify-content-between align-items-center font-size-11 pt-1 mb-3" style="color: #64748b;">
                        <span class="fw-medium">
                          {{ tab.items?.length || 0 }} item{{ (tab.items?.length || 0) === 1 ? '' : 's' }}
                          <template v-if="Number(tab.paid_amount) > 0">
                            · Paid KES {{ formatMoney(tab.paid_amount) }}
                          </template>
                        </span>

                        <button
                          v-if="tab.items && tab.items.length > 2"
                          type="button"
                          class="btn btn-link p-0 fw-semibold font-size-11 text-decoration-none d-inline-flex align-items-center gap-1 shadow-none"
                          :style="{ color: getTabAgingTheme(tab).priceColor }"
                          @click="toggleExpandTab(tab.id)"
                        >
                          <span>{{ expandedTabs[tab.id] ? 'Hide details' : 'Show details' }}</span>
                          <i :class="expandedTabs[tab.id] ? 'bx bx-chevron-up' : 'bx bx-chevron-down'"></i>
                        </button>
                      </div>
                    </div>

                    <!-- Card Actions: Outline Buttons -->
                    <div
                      v-if="['open', 'partially_paid'].includes(tab.status)"
                      class="d-flex align-items-center gap-1.5 pt-1"
                    >
                      <button
                        type="button"
                        class="btn btn-sm flex-grow-1 fw-semibold font-size-12 py-1.5 rounded-2 d-inline-flex align-items-center justify-content-center gap-1 shadow-none"
                        :style="{
                          backgroundColor: 'transparent',
                          color: getTabAgingTheme(tab).outlineBtnColor,
                          border: '1.5px solid ' + getTabAgingTheme(tab).outlineBtnBorder,
                        }"
                        title="Resume in Cart"
                        @click="resumeTabInCart(tab)"
                      >
                        <i class="bx bx-cart-add font-size-14"></i>
                        <span>Resume</span>
                      </button>

                      <button
                        v-if="Number(tab.balance_due) > 0"
                        type="button"
                        class="btn btn-sm fw-semibold font-size-12 py-1.5 px-2.5 rounded-2 d-inline-flex align-items-center justify-content-center gap-1 shadow-none"
                        style="background-color: transparent; color: #15803d; border: 1.5px solid #16a34a;"
                        title="Record Payment"
                        @click="openPaymentModal(tab)"
                      >
                        <i class="bx bx-money font-size-14"></i>
                        <span>Pay</span>
                      </button>

                      <button
                        type="button"
                        class="btn btn-sm fw-semibold font-size-12 py-1.5 px-2.5 rounded-2 d-inline-flex align-items-center justify-content-center gap-1 shadow-none"
                        :style="{
                          backgroundColor: 'transparent',
                          color: getTabAgingTheme(tab).outlineBtnColor,
                          border: '1.5px solid ' + getTabAgingTheme(tab).outlineBtnBorder,
                        }"
                        title="Settle & Close Bill"
                        @click="openSettleConfirm(tab)"
                      >
                        <span>Settle</span>
                      </button>

                      <button
                        v-if="tab.items?.length > 1"
                        type="button"
                        class="btn btn-sm font-size-12 py-1.5 px-2 rounded-2 d-inline-flex align-items-center justify-content-center shadow-none"
                        style="background-color: transparent; color: #64748b; border: 1.5px solid #cbd5e1;"
                        title="Split Bill"
                        @click="openSplitModal(tab)"
                      >
                        <i class="bx bx-git-repo-forked"></i>
                      </button>
                    </div>
                    <div v-else class="d-flex align-items-center justify-content-between pt-1 font-size-11 text-muted">
                      <span><i class="mdi mdi-check-circle-outline text-success me-1"></i>Bill finalized</span>
                      <span class="fw-semibold text-dark">Total KES {{ formatMoney(tab.total_amount) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== TABLE VIEW ==================== -->
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0 font-size-13">
              <thead class="table-light">
                <tr>
                  <th style="width: 135px;">Tab #</th>
                  <th>Tab Reference</th>
                  <th>Table &amp; Opened</th>
                  <th>Opened By</th>
                  <th>Customer</th>
                  <th class="text-center">Items</th>
                  <th class="text-end">Total</th>
                  <th class="text-end">Paid</th>
                  <th class="text-end">Balance Due</th>
                  <th class="text-center">Aging / Status</th>
                  <th class="text-end" style="min-width: 210px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tab in filteredTabs" :key="tab.id">
                  <td class="font-monospace fw-bold text-dark">
                    {{ tab.tab_number }}
                  </td>
                  <td>
                    <strong class="text-dark">
                      {{ tab.name || (tab.customer?.name ? `${tab.customer.name}'s Tab` : tab.tab_number) }}
                    </strong>
                    <div v-if="tab.notes" class="text-muted font-size-11 text-truncate" style="max-width: 190px;">
                      {{ tab.notes }}
                    </div>
                  </td>
                  <td>
                    <div class="d-flex flex-column gap-0.5">
                      <span
                        v-if="getTabTableDisplay(tab)"
                        class="badge bg-primary-subtle text-primary border border-primary-subtle font-size-11 align-self-start"
                      >
                        <i class="mdi mdi-map-marker me-0.5"></i> {{ getTabTableDisplay(tab) }}
                      </span>
                      <span class="text-muted font-size-11 d-inline-flex align-items-center gap-1">
                        <i class="mdi mdi-clock-outline"></i>
                        <span>{{ formatTabRelativeTime(tab.opened_at || tab.created_at || tab.updated_at) }}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span class="text-dark font-size-12 fw-medium">
                      {{ tab.opened_by?.name || '—' }}
                    </span>
                  </td>
                  <td>
                    <div v-if="tab.customer">
                      <div class="fw-semibold text-dark font-size-12">{{ getCustomerName(tab) }}</div>
                      <small class="text-muted font-size-11">{{ tab.customer.phone || 'No phone' }}</small>
                    </div>
                    <span v-else class="text-muted font-size-12">Walk-in</span>
                  </td>
                  <td class="text-center">
                    <span class="badge bg-light text-dark border font-size-11">
                      {{ tab.items?.length || 0 }}
                    </span>
                  </td>
                  <td class="text-end fw-semibold text-dark text-nowrap">
                    KES {{ formatMoney(tab.total_amount) }}
                  </td>
                  <td class="text-end text-success text-nowrap">
                    KES {{ formatMoney(tab.paid_amount) }}
                  </td>
                  <td
                    class="text-end fw-bold text-nowrap"
                    :style="{ color: Number(tab.balance_due) > 0 ? getTabAgingTheme(tab).priceColor : '#15803d' }"
                  >
                    KES {{ formatMoney(tab.balance_due) }}
                  </td>
                  <td class="text-center">
                    <span
                      class="badge font-size-10 px-2.5 py-1 fw-bold rounded-pill"
                      :style="{
                        backgroundColor: getTabAgingTheme(tab).badgeBg,
                        color: getTabAgingTheme(tab).badgeText,
                        border: '1px solid ' + getTabAgingTheme(tab).badgeBorder,
                      }"
                    >
                      {{ getTabAgingTheme(tab).label }}
                    </span>
                  </td>
                  <td class="text-end">
                    <div v-if="['open', 'partially_paid'].includes(tab.status)" class="d-inline-flex align-items-center gap-1">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 font-size-12 py-1 px-2 shadow-none"
                        title="Resume in Cart (Add items or checkout)"
                        @click="resumeTabInCart(tab)"
                      >
                        <i class="bx bx-cart-add"></i>
                        <span>Resume</span>
                      </button>

                      <button
                        v-if="Number(tab.balance_due) > 0"
                        type="button"
                        class="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1 font-size-12 py-1 px-2 shadow-none"
                        title="Record Payment"
                        @click="openPaymentModal(tab)"
                      >
                        <i class="bx bx-money"></i>
                        <span>Pay</span>
                      </button>

                      <button
                        type="button"
                        class="btn btn-sm btn-outline-dark font-size-12 py-1 px-2 shadow-none"
                        title="Settle and close bill"
                        @click="openSettleConfirm(tab)"
                      >
                        <span>Settle</span>
                      </button>

                      <button
                        v-if="tab.items?.length > 1"
                        type="button"
                        class="btn btn-sm btn-outline-secondary font-size-12 py-1 px-2 shadow-none"
                        title="Split Bill"
                        @click="openSplitModal(tab)"
                      >
                        <i class="bx bx-git-repo-forked"></i>
                      </button>
                    </div>
                    <span v-else class="text-muted font-size-12">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Role-Based Tab Aging Settings Modal -->
    <TabAgingSettingsModal
      :open="showAgingSettingsModal"
      @close="showAgingSettingsModal = false"
    />

    <!-- Partial Payment Modal -->
    <div
      v-if="showPaymentModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(15, 23, 42, 0.55); z-index: 1055;"
      @click.self="showPaymentModal = false"
    >
      <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
        <div class="modal-content border-0 rounded flat-card overflow-hidden">
          <div class="modal-header bg-white border-bottom py-3 px-4">
            <div class="d-flex align-items-center gap-2">
              <div class="tone-chip tone-chip-success">
                <i class="bx bx-money fs-5"></i>
              </div>
              <div>
                <h5 class="modal-title font-size-16 fw-bold mb-0">Record Payment on Tab</h5>
                <small class="text-muted font-size-12">{{ activeTab?.tab_number }} — {{ activeTab?.name }}</small>
              </div>
            </div>
            <button type="button" class="btn-close" @click="showPaymentModal = false"></button>
          </div>

          <div class="modal-body p-4">
            <div class="p-3 bg-light rounded border mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span class="text-muted font-size-12">Total Bill:</span>
                <span class="fw-semibold font-size-13 text-dark">KES {{ formatMoney(activeTab?.total_amount) }}</span>
              </div>
              <div class="d-flex justify-content-between mb-1">
                <span class="text-muted font-size-12">Already Paid:</span>
                <span class="text-success font-size-13">KES {{ formatMoney(activeTab?.paid_amount) }}</span>
              </div>
              <div class="d-flex justify-content-between pt-2 border-top">
                <span class="fw-bold font-size-13 text-dark">Balance Due:</span>
                <span class="fw-bold font-size-16 text-danger">KES {{ formatMoney(activeTab?.balance_due) }}</span>
              </div>
            </div>

            <div v-if="paymentError" class="alert alert-danger py-2 px-3 font-size-13 mb-3">
              {{ paymentError }}
            </div>

            <form @submit.prevent="submitTabPayment">
              <div class="mb-3">
                <label class="form-label font-size-12 fw-semibold text-muted mb-1">Payment Method</label>
                <div class="d-flex gap-2">
                  <button
                    type="button"
                    class="btn btn-sm flex-grow-1 font-size-12 py-2"
                    :class="paymentForm.method === 'cash' ? 'btn-primary' : 'btn-light border'"
                    @click="paymentForm.method = 'cash'"
                  >
                    <i class="bx bx-money me-1"></i> Cash
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm flex-grow-1 font-size-12 py-2"
                    :class="paymentForm.method === 'mpesa' ? 'btn-success text-white' : 'btn-light border'"
                    @click="paymentForm.method = 'mpesa'"
                  >
                    <i class="bx bx-mobile-alt me-1"></i> M-Pesa
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm flex-grow-1 font-size-12 py-2"
                    :class="paymentForm.method === 'card' ? 'btn-primary' : 'btn-light border'"
                    @click="paymentForm.method = 'card'"
                  >
                    <i class="bx bx-credit-card me-1"></i> Card
                  </button>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label font-size-12 fw-semibold text-muted mb-1">Amount to Pay (KES)</label>
                <input
                  v-model.number="paymentForm.amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  :max="activeTab?.balance_due"
                  class="form-control font-size-15 fw-bold"
                  required
                />
              </div>

              <div v-if="paymentForm.method === 'mpesa'" class="mb-3">
                <label class="form-label font-size-12 fw-semibold text-muted mb-1">M-Pesa Reference / Code</label>
                <input
                  v-model="paymentForm.external_reference"
                  type="text"
                  class="form-control font-size-13"
                  placeholder="e.g. QK12345678"
                />
              </div>

              <div class="d-flex justify-content-end gap-2 pt-2 border-top">
                <button type="button" class="btn btn-light border px-3 font-size-13" @click="showPaymentModal = false">
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-success px-4 font-size-13 fw-semibold d-inline-flex align-items-center gap-1"
                  :disabled="isSubmittingPayment"
                >
                  <i v-if="isSubmittingPayment" class="bx bx-loader-alt bx-spin"></i>
                  <span>{{ isSubmittingPayment ? 'Processing...' : 'Confirm Payment' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Settle Tab Confirmation Modal -->
    <div
      v-if="showSettleModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(15, 23, 42, 0.55); z-index: 1055;"
      @click.self="showSettleModal = false"
    >
      <div class="modal-dialog modal-dialog-centered" style="max-width: 460px;">
        <div class="modal-content border-0 rounded overflow-hidden">
          <div class="modal-header bg-white border-bottom py-3 px-4">
            <h5 class="modal-title font-size-16 fw-bold mb-0">Settle Tab as Completed Sale</h5>
            <button type="button" class="btn-close" @click="showSettleModal = false"></button>
          </div>
          <div class="modal-body p-4 text-center">
            <div class="avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center text-primary mx-auto mb-3" style="width: 50px; height: 50px;">
              <i class="bx bx-check-circle fs-2"></i>
            </div>
            <h5 class="fw-bold text-dark mb-1">Settle {{ activeTab?.tab_number }}?</h5>
            <p class="text-muted font-size-13 mb-3">
              This will deduct inventory stock and finalize the bill as a completed Sales Order<template v-if="activeTab?.table?.table_number">, releasing Table {{ activeTab.table.table_number }}</template>.
            </p>
            <div class="p-3 bg-light rounded border text-start mb-3">
              <div class="d-flex justify-content-between font-size-13 mb-1">
                <span class="text-muted">Total:</span>
                <span class="fw-bold text-dark">KES {{ formatMoney(activeTab?.total_amount) }}</span>
              </div>
              <div class="d-flex justify-content-between font-size-13">
                <span class="text-muted">Paid:</span>
                <span class="fw-bold text-success">KES {{ formatMoney(activeTab?.paid_amount) }}</span>
              </div>
            </div>
            <div class="d-flex justify-content-center gap-2">
              <button type="button" class="btn btn-light border px-3" @click="showSettleModal = false">
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-primary px-4 fw-semibold"
                :disabled="isSubmittingSettle"
                @click="confirmSettleTab"
              >
                <i v-if="isSubmittingSettle" class="bx bx-loader-alt bx-spin me-1"></i>
                <span>{{ isSubmittingSettle ? 'Settling...' : 'Complete Settlement' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useShiftStore } from "@/stores/shift";
import tabsApi from "@/api/tabs";
import shiftsApi from "@/api/shifts";
import TabAgingSettingsModal from "./components/TabAgingSettingsModal.vue";
import {
  tabAgingConfig,
  reloadTabAgingConfig,
  getTabAgingTheme,
  formatTabRelativeTime,
  formatMinutesShort,
} from "@/utils/tabAging";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const shiftStore = useShiftStore();

// Role-based access for Aging Settings
const canManageAgingSettings = computed(() => authStore.hasRole(["owner", "manager"]));

// Data
const allTabs = ref([]);
const isLoading = ref(false);
const currentShift = ref(null);
const branchId = ref(null);
const expandedTabs = ref({});

// Navigation Tab (synced with ?tab=active|settled|all)
const validTabs = ["active", "settled", "all"];
const statusFilter = ref(validTabs.includes(route.query.tab) ? route.query.tab : "active");

// View Toggle (Grid vs Table, persisted)
const VIEW_STORAGE_KEY = "psTabsViewMode";
const viewMode = ref(localStorage.getItem(VIEW_STORAGE_KEY) === "table" ? "table" : "grid");

function setViewMode(mode) {
  viewMode.value = mode;
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, mode);
  } catch {
    // Ignore storage errors
  }
}

// Filters
const searchQuery = ref("");
const selectedUserId = ref("all");
const selectedCustomerId = ref("all");
const selectedAging = ref("all");
const minAmount = ref("");
const maxAmount = ref("");

// Modals
const showAgingSettingsModal = ref(false);
const showPaymentModal = ref(false);
const isSubmittingPayment = ref(false);
const paymentError = ref("");
const activeTab = ref(null);
const paymentForm = reactive({
  method: "cash",
  amount: 0,
  external_reference: "",
});
const showSettleModal = ref(false);
const isSubmittingSettle = ref(false);

// Helpers
const toggleExpandTab = (tabId) => {
  expandedTabs.value[tabId] = !expandedTabs.value[tabId];
};

function formatMoney(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getCustomerName(tab) {
  if (!tab?.customer) return "Walk-in";
  if (tab.customer.name) return tab.customer.name;
  const combined = `${tab.customer.first_name || ""} ${tab.customer.last_name || ""}`.trim();
  return combined || "Walk-in";
}

function getTabTableDisplay(tab) {
  if (tab?.table?.table_number) return `Table ${tab.table.table_number}`;
  if (tab?.table?.label) return `Table ${tab.table.label}`;
  if (tab?.table_number) return `Table ${tab.table_number}`;
  const match = (tab?.name || "").match(/Table\s*([0-9A-Za-z]+)/i);
  if (match) return `Table ${match[1]}`;
  return null;
}

// Section slices & counts (always live across all 3 tabs)
const activeTabsList = computed(() =>
  allTabs.value.filter((t) => ["open", "partially_paid"].includes(String(t.status || "").toLowerCase()))
);

const settledTabsList = computed(() =>
  allTabs.value.filter((t) => ["settled", "paid"].includes(String(t.status || "").toLowerCase()))
);

const navTabs = computed(() => [
  {
    key: "active",
    label: "Active Tabs",
    icon: "ri:bill-line",
    activeIcon: "ri:bill-fill",
    count: activeTabsList.value.length,
  },
  {
    key: "settled",
    label: "Settled Bills",
    icon: "ri:checkbox-circle-line",
    activeIcon: "ri:checkbox-circle-fill",
    count: settledTabsList.value.length,
  },
  {
    key: "all",
    label: "All Tabs",
    icon: "ri:stack-line",
    activeIcon: "ri:stack-fill",
    count: allTabs.value.length,
  },
]);

const tabsForCurrentSection = computed(() => {
  if (statusFilter.value === "active") return activeTabsList.value;
  if (statusFilter.value === "settled") return settledTabsList.value;
  return allTabs.value;
});

// KPI Cards
const totalOutstandingBalance = computed(() =>
  activeTabsList.value.reduce((sum, t) => sum + Number(t.balance_due ?? t.total_amount ?? 0), 0)
);

const overdueTabsCount = computed(() =>
  activeTabsList.value.filter((t) => getTabAgingTheme(t).tier === "overdue").length
);

const partiallyPaidCount = computed(() =>
  activeTabsList.value.filter((t) => getTabAgingTheme(t).tier === "partial").length
);

const kpiCards = computed(() => [
  {
    key: "active",
    label: "Active Open Tabs",
    value: activeTabsList.value.length,
    note: "Awaiting final checkout",
    icon: "ri:bill-line",
    color: "#556ee6",
  },
  {
    key: "outstanding",
    label: "Total Outstanding",
    value: `KES ${formatMoney(totalOutstandingBalance.value)}`,
    note: "Unpaid bill balance",
    icon: "ri:money-dollar-circle-line",
    color: "#f1b44c",
  },
  {
    key: "overdue",
    label: `Overdue (${formatMinutesShort(tabAgingConfig.overdueMinutes)}+)`,
    value: overdueTabsCount.value,
    note: overdueTabsCount.value > 0 ? "Needs cashier follow-up" : "All tabs within threshold",
    icon: "ri:alarm-warning-line",
    color: overdueTabsCount.value > 0 ? "#f46a6a" : "#34c38f",
  },
  {
    key: "partial",
    label: "Partially Paid",
    value: partiallyPaidCount.value,
    note: `${settledTabsList.value.length} settled bill${settledTabsList.value.length === 1 ? "" : "s"}`,
    icon: "ri:pie-chart-2-line",
    color: "#50a5f1",
  },
]);

// Dynamic Filter Options (built from loaded tabs)
const userOptions = computed(() => {
  const map = new Map();
  allTabs.value.forEach((t) => {
    const id = t.opened_by?.id ?? t.opened_by_id;
    const name = t.opened_by?.name;
    if (id && name) {
      const existing = map.get(String(id));
      map.set(String(id), { id: String(id), name, count: (existing?.count || 0) + 1 });
    }
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
});

const customerOptions = computed(() => {
  const map = new Map();
  allTabs.value.forEach((t) => {
    if (t.customer?.id) {
      const id = String(t.customer.id);
      const name = getCustomerName(t);
      const existing = map.get(id);
      map.set(id, { id, name, count: (existing?.count || 0) + 1 });
    }
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
});

const agingOptions = computed(() => [
  { key: "all", label: "All Aging Tiers", dot: null },
  {
    key: "fresh",
    label: `Fresh (< ${formatMinutesShort(tabAgingConfig.extendedMinutes)})`,
    dot: "#3b82f6",
  },
  {
    key: "extended",
    label: `Extended (${formatMinutesShort(tabAgingConfig.extendedMinutes)} – ${formatMinutesShort(tabAgingConfig.overdueMinutes)})`,
    dot: "#d97706",
  },
  {
    key: "overdue",
    label: `Overdue (${formatMinutesShort(tabAgingConfig.overdueMinutes)}+)`,
    dot: "#e11d48",
  },
  { key: "partial", label: "Partially Paid", dot: "#f59e0b" },
  { key: "settled", label: "Settled", dot: "#16a34a" },
]);

const amountPresets = [
  { key: "any", label: "Any", min: "", max: "" },
  { key: "under1k", label: "< 1,000", min: "", max: "1000" },
  { key: "1k-5k", label: "1k – 5k", min: "1000", max: "5000" },
  { key: "5k-15k", label: "5k – 15k", min: "5000", max: "15000" },
  { key: "over15k", label: "15,000+", min: "15000", max: "" },
];

function applyAmountPreset(p) {
  minAmount.value = p.min;
  maxAmount.value = p.max;
}

function isAmountPresetActive(p) {
  return String(minAmount.value) === p.min && String(maxAmount.value) === p.max;
}

// Filter Labels
const selectedUserLabel = computed(() => {
  if (selectedUserId.value === "all") return "Staff";
  return userOptions.value.find((u) => u.id === selectedUserId.value)?.name || "Staff";
});

const selectedCustomerLabel = computed(() => {
  if (selectedCustomerId.value === "all") return "Customer";
  if (selectedCustomerId.value === "walkin") return "Walk-in";
  return customerOptions.value.find((c) => c.id === selectedCustomerId.value)?.name || "Customer";
});

const hasAmountFilter = computed(() => minAmount.value !== "" || maxAmount.value !== "");

const amountFilterLabel = computed(() => {
  if (!hasAmountFilter.value) return "Amount";
  if (minAmount.value !== "" && maxAmount.value !== "") {
    return `KES ${Number(minAmount.value).toLocaleString()} – ${Number(maxAmount.value).toLocaleString()}`;
  }
  if (minAmount.value !== "") return `≥ KES ${Number(minAmount.value).toLocaleString()}`;
  return `≤ KES ${Number(maxAmount.value).toLocaleString()}`;
});

const selectedAgingLabel = computed(() => {
  if (selectedAging.value === "all") return "Aging";
  return agingOptions.value.find((a) => a.key === selectedAging.value)?.label || "Aging";
});

const activeFilterChips = computed(() => {
  const chips = [];
  if (selectedUserId.value !== "all") {
    chips.push({
      key: "user",
      label: `Staff: ${selectedUserLabel.value}`,
      clear: () => { selectedUserId.value = "all"; },
    });
  }
  if (selectedCustomerId.value !== "all") {
    chips.push({
      key: "customer",
      label: `Customer: ${selectedCustomerLabel.value}`,
      clear: () => { selectedCustomerId.value = "all"; },
    });
  }
  if (hasAmountFilter.value) {
    chips.push({
      key: "amount",
      label: `Amount: ${amountFilterLabel.value}`,
      clear: () => { minAmount.value = ""; maxAmount.value = ""; },
    });
  }
  if (selectedAging.value !== "all") {
    chips.push({
      key: "aging",
      label: `Aging: ${selectedAgingLabel.value}`,
      clear: () => { selectedAging.value = "all"; },
    });
  }
  return chips;
});

const activeFilterCount = computed(() => activeFilterChips.value.length);

function clearAllFilters() {
  searchQuery.value = "";
  selectedUserId.value = "all";
  selectedCustomerId.value = "all";
  selectedAging.value = "all";
  minAmount.value = "";
  maxAmount.value = "";
}

// Final Filtered List
const filteredTabs = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const minVal = minAmount.value !== "" ? Number(minAmount.value) : null;
  const maxVal = maxAmount.value !== "" ? Number(maxAmount.value) : null;

  return tabsForCurrentSection.value.filter((tab) => {
    // Search
    if (q) {
      const hay = [
        tab.tab_number,
        tab.name,
        tab.notes,
        getCustomerName(tab),
        tab.customer?.phone,
        getTabTableDisplay(tab),
        tab.opened_by?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    // Staff / User filter
    if (selectedUserId.value !== "all") {
      const uid = String(tab.opened_by?.id ?? tab.opened_by_id ?? "");
      if (uid !== selectedUserId.value) return false;
    }

    // Customer filter
    if (selectedCustomerId.value === "walkin") {
      if (tab.customer?.id) return false;
    } else if (selectedCustomerId.value !== "all") {
      if (String(tab.customer?.id ?? "") !== selectedCustomerId.value) return false;
    }

    // Amount range filter (checks total_amount)
    const figure = Number(tab.total_amount ?? tab.balance_due ?? 0);
    if (minVal !== null && Number.isFinite(minVal) && figure < minVal) return false;
    if (maxVal !== null && Number.isFinite(maxVal) && figure > maxVal) return false;

    // Aging tier filter
    if (selectedAging.value !== "all") {
      if (getTabAgingTheme(tab).tier !== selectedAging.value) return false;
    }

    return true;
  });
});

const emptyStateTitle = computed(() => {
  if (statusFilter.value === "settled") return "No settled bills yet";
  if (statusFilter.value === "all") return "No tabs found";
  return "No active open tabs";
});

const emptyStateSubtitle = computed(() => {
  if (statusFilter.value === "settled") return "Settled customer tabs will appear here once closed.";
  return "There are currently no active customer tabs or running orders.";
});

// Actions
async function fetchTabs(silent = false) {
  if (!silent && allTabs.value.length === 0) {
    isLoading.value = true;
  }
  try {
    const shiftRes = await shiftsApi.current();
    if (shiftRes.data?.success && shiftRes.data?.shift) {
      currentShift.value = shiftRes.data.shift;
      branchId.value = currentShift.value.branch_id;
    } else {
      branchId.value =
        shiftStore.selectedBranchId ||
        (shiftStore.branches?.length
          ? shiftStore.branches.find((b) => b.is_main)?.id || shiftStore.branches[0].id
          : null) ||
        null;
    }

    const params = { status: "all" };
    if (branchId.value) {
      params.branch_id = branchId.value;
    }

    const res = await tabsApi.list(params);
    if (res.data?.success) {
      allTabs.value = res.data.data || [];
    }
  } catch (err) {
    console.error("Failed to load tabs:", err);
  } finally {
    isLoading.value = false;
  }
}

function changeStatusFilter(status) {
  statusFilter.value = status;
  router.replace({ query: { ...route.query, tab: status } });
}

function resumeTabInCart(tab) {
  cartStore.loadTab(tab);
  router.push({ path: "/sell", query: { tab_id: tab.id } });
}

function openPaymentModal(tab) {
  activeTab.value = tab;
  paymentForm.method = "cash";
  paymentForm.amount = Number(tab.balance_due) || 0;
  paymentForm.external_reference = "";
  paymentError.value = "";
  showPaymentModal.value = true;
}

async function submitTabPayment() {
  if (!activeTab.value) return;
  isSubmittingPayment.value = true;
  paymentError.value = "";

  try {
    const res = await tabsApi.recordPayment(activeTab.value.id, {
      amount: paymentForm.amount,
      method: paymentForm.method,
      shift_id: currentShift.value?.id || null,
      external_reference: paymentForm.external_reference || null,
    });

    if (res.data?.success) {
      showPaymentModal.value = false;
      await fetchTabs(true);
    } else {
      paymentError.value = res.data?.message || "Failed to record payment.";
    }
  } catch (err) {
    console.error("Payment error:", err);
    paymentError.value = err.response?.data?.message || "An unexpected error occurred.";
  } finally {
    isSubmittingPayment.value = false;
  }
}

function openSettleConfirm(tab) {
  activeTab.value = tab;
  showSettleModal.value = true;
}

async function confirmSettleTab() {
  if (!activeTab.value) return;
  isSubmittingSettle.value = true;

  try {
    const res = await tabsApi.settle(activeTab.value.id, {
      shift_id: currentShift.value?.id || null,
    });
    if (res.data?.success) {
      showSettleModal.value = false;
      await fetchTabs(true);
    }
  } catch (err) {
    console.error("Settlement error:", err);
    alert(err.response?.data?.message || "Failed to settle tab.");
  } finally {
    isSubmittingSettle.value = false;
  }
}

function openSplitModal(tab) {
  const newName = prompt(`Enter new tab name to split from ${tab.tab_number}:`, `Split - ${tab.name}`);
  if (!newName) return;
  if (tab.items && tab.items.length > 1) {
    const firstItemId = tab.items[0].id;
    tabsApi.split(tab.id, [firstItemId], newName).then(() => {
      fetchTabs(true);
    });
  }
}

onMounted(() => {
  reloadTabAgingConfig(authStore.tenant?.id);
  fetchTabs();
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.spin-anim {
  animation: tabsSpin 0.9s linear infinite;
}

@keyframes tabsSpin {
  to {
    transform: rotate(360deg);
  }
}

.filter-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--bs-primary);
  border: 1.5px solid #fff;
}
</style>
