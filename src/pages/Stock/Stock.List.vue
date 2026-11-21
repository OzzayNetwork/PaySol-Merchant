<template>
  <div class="stock-page">
    <!-- Page title and Top Controls -->
    <div class="row">
      <div class="col-12">
        <div class="page-title-box d-flex align-items-center justify-content-between gap-2">
          <div>
            <h4 class="mb-sm-0 font-size-18 pb-1">Stock &amp; Inventory</h4>
            <div class="page-title-right">
              <ol class="breadcrumb m-0 flex-nowrap">
                <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
                <li class="breadcrumb-item">Products &amp; stock</li>
                <li class="breadcrumb-item active text-truncate">Stock</li>
              </ol>
            </div>
          </div>

          <div class="d-flex gap-2 flex-shrink-0 align-items-center">
            <!-- Branch Selector -->
            <div v-if="branches.length > 1" class="dropdown">
              <button
                type="button"
                class="btn btn-white d-flex align-items-center gap-2 waves-effect"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i class="bx bx-store-alt fs-5 text-primary"></i>
                <span class="fw-semibold d-none d-sm-inline">{{ activeBranch?.name || 'Select branch' }}</span>
                <i class="mdi mdi-chevron-down fs-5 text-muted"></i>
              </button>
              <div class="dropdown-menu dropdown-menu-end shadow-sm">
                <button
                  v-for="b in branches"
                  :key="b.id"
                  type="button"
                  class="dropdown-item d-flex align-items-center justify-content-between gap-3"
                  :class="{ active: selectedBranchId === b.id }"
                  @click="changeBranch(b.id)"
                >
                  <span>{{ b.name }} <small v-if="b.is_main" class="text-muted">(Main)</small></span>
                  <i v-if="selectedBranchId === b.id" class="bx bx-check fs-5 text-primary"></i>
                </button>
              </div>
            </div>

            <!-- Export Dropdown Button -->
            <div class="dropdown">
              <button
                type="button"
                class="btn btn-white header-btn d-flex align-items-center justify-content-center gap-2 flex-nowrap waves-effect"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                title="Export stock data"
              >
                <i class="bx bx-export fs-4 d-flex"></i>
                <span class="d-none d-sm-inline">Export</span>
                <i class="mdi mdi-chevron-down fs-5 d-none d-sm-flex text-muted"></i>
              </button>
              <div class="dropdown-menu dropdown-menu-end shadow-sm p-2" style="min-width: 210px;">
                <h6 class="dropdown-header">Export Options</h6>
                <a
                  class="dropdown-item d-flex align-items-center py-2"
                  href="javascript:void(0);"
                  @click="exportCsv('all')"
                >
                  <i class="bx bx-file me-2 fs-5 text-success"></i>
                  <span>Export all items (CSV)</span>
                </a>
                <a
                  class="dropdown-item d-flex align-items-center py-2"
                  href="javascript:void(0);"
                  @click="exportCsv('low')"
                >
                  <i class="bx bx-error-circle me-2 fs-5 text-warning"></i>
                  <span>Export reorder list (CSV)</span>
                </a>
                <div class="dropdown-divider my-1"></div>
                <a
                  class="dropdown-item d-flex align-items-center py-2"
                  href="javascript:void(0);"
                  @click="printStockSheet"
                >
                  <i class="bx bx-printer me-2 fs-5 text-primary"></i>
                  <span>Print stock count sheet</span>
                </a>
              </div>
            </div>

            <!-- Stock Count Action Button -->
            <button
              type="button"
              class="btn btn-white header-btn d-flex align-items-center justify-content-center gap-2 flex-nowrap fw-semibold waves-effect"
              title="Stock Count (Shelf stocktake across goods)"
              aria-label="Stock Count"
              @click="openCountModal"
            >
              <i class="bx bx-list-check fs-4 d-flex text-primary"></i>
              <span class="d-none d-lg-inline">Stock Count</span>
              <span class="d-none d-sm-inline d-lg-none">Count</span>
            </button>

            <!-- Receive Goods Action Button (Matching Catalogue header-btn pattern) -->
            <button
              type="button"
              class="btn btn-primary header-btn d-flex align-items-center justify-content-center gap-2 flex-nowrap fw-bold text-white"
              title="Receive Goods / Delivery"
              aria-label="Receive Delivery"
              @click="openReceiveModal"
            >
              <i class="bx bx-archive-in fs-4 d-flex"></i>
              <span class="d-none d-lg-inline">Receive Delivery</span>
              <span class="d-none d-sm-inline d-lg-none">Receive</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Card (Matching Catalogue Table View) -->
    <div class="card shadow-sm border">
      <!-- Toolbar -->
      <div class="card-body border-bottom">
        <div class="row">
          <div class="col-12 gap-2 gap-md-3 d-flex align-items-center">
            <!-- Refresh avatar button -->
            <div>
              <button
                type="button"
                class="btn waves-effect btn-lg btn-light position-relative p-0 avatar-sm rounded-circle"
                title="Refresh the inventory list"
                aria-label="Refresh the inventory list"
                @click="reload()"
              >
                <span class="avatar-title bg-transparent text-reset">
                  <i class="mdi mdi-refresh fs-4" :class="{ 'spin-anim': loading }"></i>
                </span>
              </button>
            </div>

            <!-- Search input group with search button -->
            <div class="flex-grow-1">
              <div class="search-box mb-0 me-0">
                <div class="position-relative">
                  <form
                    @submit.prevent="onSearch()"
                    class="input-group bg-light rounded mb04 pb-0 flex-nowrap"
                  >
                    <div class="flex-grow-1">
                      <input
                        style="border-radius: 0px; padding-right: 35px;"
                        type="text"
                        class="form-control bg-light rounded flex-grow-1"
                        placeholder="Search products by barcode, name, brand or SKU..."
                        spellcheck="false"
                        aria-label="Search stock"
                        v-model="searchQuery"
                        @input="onSearchInput"
                      />
                      <i class="bx bx-search-alt search-icon fs-4"></i>
                      <i
                        v-if="searchQuery !== ''"
                        title="Clear search"
                        style="right: 15px; left: unset;"
                        class="mdi mdi-close search-icon cursor-pointer fs-3 waves-effect"
                        @click="searchQuery = ''; reload();"
                      ></i>
                    </div>
                    <button
                      type="submit"
                      @click="onSearch()"
                      title="Click to search"
                      class="btn btn-primary px-4 d-md-flex d-none align-items-center fw-bold"
                    >
                      <i class="bx bx-search-alt search-icon fs-4"></i>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <!-- Mobile all-in-one filter dropdown (d-lg-none) -->
            <div class="position-relative d-flex d-lg-none">
              <button
                type="button"
                title="Filter stock"
                class="btn btn-light waves-effect position-relative p-0 avatar-sm rounded-circle"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                aria-expanded="false"
              >
                <span class="avatar-title bg-transparent text-reset">
                  <i class="mdi mdi-filter-variant fs-4"></i>
                </span>
                <span v-if="selectedStatus !== 'all' || sortBy !== 'urgency'" class="filter-dot"></span>
              </button>
              <div class="dropdown-menu dropdown-menu-end p-2 filter-menu" style="min-width: 250px;">
                <h6 class="dropdown-header">Stock Status</h6>
                <a
                  v-for="tab in statusTabs"
                  :key="`m-s-${tab.key}`"
                  href="javascript:void(0);"
                  class="dropdown-item d-flex align-items-center justify-content-between"
                  :class="{ active: selectedStatus === tab.key }"
                  @click="setStatus(tab.key)"
                >
                  <span>
                    <i class="mdi mdi-record me-2" :class="statusDotOf(tab.key)"></i>
                    {{ tab.label }}
                  </span>
                  <span v-if="tab.count !== null" class="badge rounded-pill bg-light text-dark">{{ tab.count }}</span>
                </a>
                <div class="dropdown-divider"></div>
                <h6 class="dropdown-header">Sort By</h6>
                <a
                  v-for="opt in sortOptions"
                  :key="`m-so-${opt.key}`"
                  href="javascript:void(0);"
                  class="dropdown-item"
                  :class="{ active: sortBy === opt.key }"
                  @click="setSort(opt.key)"
                >
                  {{ opt.label }}
                </a>
              </div>
            </div>

            <!-- Desktop Sort dropdown (d-lg-flex d-none) -->
            <div class="position-relative d-flex d-lg-flex d-none">
              <button
                class="d-lg-flex d-flex align-items-center fw-bold btn btn-light waves-effect gap-2"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i class="mdi mdi-sort-variant fs-4 align-middle"></i>
                <span class="d-md-inline-block d-none">{{ sortLabel }}</span>
                <i class="mdi mdi-chevron-down fs-4"></i>
              </button>
              <div class="dropdown-menu dropdown-menu-end p-2" style="min-width: 230px;">
                <a
                  v-for="opt in sortOptions"
                  :key="`so-${opt.key}`"
                  href="javascript:void(0);"
                  class="dropdown-item d-flex align-items-center justify-content-between"
                  :class="{ active: sortBy === opt.key }"
                  @click="setSort(opt.key)"
                >
                  <span>{{ opt.label }}</span>
                  <i v-if="sortBy === opt.key" class="bx bx-check fs-5 text-primary"></i>
                </a>
              </div>
            </div>

            <!-- Desktop Columns toggle (d-lg-flex d-none) -->
            <div class="position-relative d-flex d-lg-flex d-none">
              <button
                title="Edit columns to view on the table"
                class="d-lg-flex d-flex align-items-center fw-bold btn btn-light waves-effect gap-2"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i class="mdi mdi-format-columns fs-4 align-middle"></i>
                <span class="d-md-inline-block d-none">Columns</span>
                <i class="mdi mdi-chevron-down fs-4"></i>
              </button>
              <div class="dropdown-menu dropdown-menu-end p-3" style="min-width: 220px;">
                <div v-for="column in columns" :key="column.key" class="form-check mb-3">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    :id="`col-${column.key}`"
                    v-model="column.visible"
                  />
                  <label class="form-check-label" :for="`col-${column.key}`">
                    {{ column.label }}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Filter Pills (in card-header with border) -->
      <div class="card-header bg-white border-bottom py-2">
        <div
          class="d-flex flex-row flex-nowrap category-scroll gap-2"
          style="overflow-x: auto; overflow-y: hidden; scrollbar-width: none; -ms-overflow-style: none;"
        >
          <button
            v-for="tab in statusTabs"
            :key="tab.key"
            type="button"
            class="btn btn-sm fw-semibold btn-light btn-rounded waves-effect px-3 py-1 text-nowrap flex-shrink-0 d-inline-flex align-items-center border font-size-12"
            :class="{ 'btn-dark text-light border-dark': selectedStatus === tab.key }"
            @click="setStatus(tab.key)"
          >
            <i v-if="tab.key !== 'all'" class="mdi mdi-record me-1 font-size-10" :class="statusDotOf(tab.key)"></i>
            <span>{{ tab.label }}</span>
            <span v-if="tab.count !== null && tab.count !== undefined" class="opacity-50 ms-1 font-size-11">({{ tab.count }})</span>
          </button>
        </div>
      </div>

      <!-- Active Filters (Left) & Showing Count (Right) Row -->
      <div class="card-body py-2 px-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2 font-size-13 bg-white">
        <!-- Left: Active Filters -->
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <template v-if="chips.length">
            <span class="text-muted small">Active filters:</span>
            <span
              v-for="c in chips"
              :key="c.key"
              class="badge bg-primary-subtle text-primary d-inline-flex align-items-center gap-1 px-2 py-1 font-size-12 fw-medium"
            >
              <span>{{ c.label }}</span>
              <i class="bx bx-x cursor-pointer fs-6" :title="`Remove ${c.label}`" @click="c.clear()"></i>
            </span>
            <a v-if="chips.length > 1" href="javascript:void(0);" class="small text-primary ms-1" @click="clearAll">Clear all</a>
          </template>
        </div>

        <!-- Right: Showing Count -->
        <div class="ms-auto text-muted small text-nowrap">
          <template v-if="!loading">
            Showing <span class="fw-bold text-black">{{ items.length }}</span> of
            <span class="fw-bold text-black">{{ total }}</span> Stock Items
          </template>
          <template v-else>
            <div class="d-flex align-items-center gap-2">
              <div style="height: 16px; width: 16px;" class="spinner-border spinner-border-sm text-secondary" role="status">
                <span class="sr-only">Loading...</span>
              </div>
              <span>Loading ...</span>
            </div>
          </template>
        </div>
      </div>

      <!-- Table Area -->
      <div class="card-body p-0" style="min-height: 60vh;">
        <!-- Empty State -->
        <div
          v-if="!loading && items.length === 0"
          class="p-4 d-flex align-items-center justify-content-center h-100 w-100"
        >
          <div class="text-center p-4 w-100 h-100">
            <div class="empty-state-icon mb-0">
              <i style="font-size: 145px;" class="bx bxs-package text-black opacity-25"></i>
            </div>
            <h4 class="fw-bold text-dark mb-3 text-capitalize">It's empty in here</h4>
            <p v-if="hasFilters" class="text-muted">
              We couldn't find any stock items matching your search or filters.
            </p>
            <p v-else class="text-muted">No stock-tracked products found for this branch.</p>
            <button
              v-if="hasFilters"
              type="button"
              class="btn btn-soft-primary mt-2"
              @click="clearAll"
            >
              <i class="bx bx-x me-1"></i>Clear all filters
            </button>
          </div>
        </div>

        <!-- Table View: Desktop & Tablets -->
        <div v-else class="table-responsive d-none d-md-block">
          <!-- Main Table -->
          <table class="table verticle-middle table-hover mb-0 doc-table">
            <thead class="table-light text-nowrap">
              <tr>
                <th class="sortable" @click="toggleSortOrder('name', 'asc')">
                  <span>Product</span>
                  <i v-if="sortBy === 'name'" class="mdi ms-1" :class="sortOrder === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'"></i>
                </th>
                <th v-if="isCol('barcode')" class="sortable" @click="toggleSortOrder('barcode', 'asc')">
                  <span>Barcode</span>
                  <i v-if="sortBy === 'barcode'" class="mdi ms-1" :class="sortOrder === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'"></i>
                </th>
                <th v-if="isCol('quantity')" class="sortable text-center" @click="toggleSortOrder('quantity', 'asc')">
                  <span>On Hand</span>
                  <i v-if="sortBy === 'quantity'" class="mdi ms-1" :class="sortOrder === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'"></i>
                </th>
                <th v-if="isCol('reorder')" class="sortable text-center" @click="toggleSortOrder('reorder_point', 'asc')">
                  <span>Reorder Point</span>
                  <i v-if="sortBy === 'reorder_point'" class="mdi ms-1" :class="sortOrder === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'"></i>
                </th>
                <th v-if="isCol('days_left')" class="sortable text-center" @click="toggleSortOrder('days_left', 'asc')">
                  <span>Velocity</span>
                  <i v-if="sortBy === 'days_left'" class="mdi ms-1" :class="sortOrder === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'"></i>
                </th>
                <th v-if="isCol('valuation')" class="text-end">
                  <span>Valuation</span>
                </th>
                <th v-if="isCol('status')" class="text-center sortable" @click="toggleSortOrder('urgency', 'asc')">
                  <span>Status</span>
                  <i v-if="sortBy === 'urgency'" class="mdi ms-1" :class="sortOrder === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'"></i>
                </th>
                <th></th>
              </tr>
            </thead>

            <!-- Rows -->
            <tbody v-if="!(loading && page === 1)">
              <tr
                v-for="row in items"
                :key="row.product.id"
                class="cursor-pointer"
                @click="openHistory(row)"
              >
                <!-- Product Column (Avatar Tile + Truncated Name + Brand) -->
                <td>
                  <div class="d-flex gap-2 align-items-center" :title="row.product.name">
                    <div class="avatar-xs d-flex flex-shrink-0">
                      <img
                        v-if="row.product.image_url"
                        :src="row.product.image_url"
                        :alt="row.product.name"
                        class="avatar-xs product-thumb"
                        loading="lazy"
                        @error="row.product.image_url = null"
                      />
                      <div v-else class="avatar-xs product-thumb d-flex align-items-center justify-content-center text-muted">
                        <i class="bx fs-5 bx-package"></i>
                      </div>
                    </div>
                    <div class="min-w-0">
                      <span class="d-block fw-bold truncate-singleLine" style="max-width: 240px;">
                        {{ row.product.name }}
                      </span>
                      <span style="font-size: 12px;" class="text-muted text-nowrap">
                        {{ [row.product.brand, row.product.category].filter(Boolean).join(' · ') || 'General' }}
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Barcode: Monospace chip with copy on click -->
                <td v-if="isCol('barcode')" class="text-nowrap">
                  <button
                    v-if="row.product.barcode"
                    type="button"
                    class="barcode-chip waves-effect"
                    title="Click to copy barcode"
                    @click.stop="copyText(row.product.barcode, `Barcode ${row.product.barcode}`)"
                  >
                    {{ row.product.barcode }}
                  </button>
                  <span v-else class="text-muted">No barcode</span>
                </td>

                <!-- On Hand / Health Progress Bar -->
                <td v-if="isCol('quantity')" class="text-center text-nowrap">
                  <div v-if="row.quantity !== null" class="d-inline-flex flex-column align-items-center">
                    <div class="d-flex align-items-baseline gap-1">
                      <span class="fw-bold fs-14 text-dark">{{ formatQty(row.quantity) }}</span>
                      <span class="fs-11 text-muted">{{ row.product.unit || 'pcs' }}</span>
                    </div>
                    <div class="progress mt-1" style="height: 5px; width: 100px;" :title="healthOf(row).label">
                      <div
                        class="progress-bar"
                        :class="healthOf(row).barClass"
                        role="progressbar"
                        :style="{ width: healthOf(row).percent + '%' }"
                        :aria-valuenow="row.quantity"
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                    <span class="fs-10 fw-semibold mt-1" :class="healthOf(row).textClass">
                      {{ healthOf(row).label }}
                    </span>
                  </div>
                  <span v-else class="text-muted font-size-12 fst-italic">
                    Uncounted
                  </span>
                </td>

                <!-- Reorder Point (ROL) & AI Suggestion Button -->
                <td v-if="isCol('reorder')" class="text-center text-nowrap">
                  <div>
                    <span v-if="row.reorder_point !== null" class="fw-semibold text-dark fs-13">
                      {{ formatQty(row.reorder_point) }} <small class="text-muted fw-normal">{{ row.product.unit || 'pcs' }}</small>
                    </span>
                    <span v-else class="text-muted font-size-12">Not set</span>

                    <div v-if="row.has_new_suggestion && row.suggested_reorder_point !== null" class="mt-1">
                      <button
                        type="button"
                        class="btn btn-outline-soft-warning btn-sm py-0 px-2 fw-bold font-size-11"
                        title="Accept suggested reorder point from sales history"
                        @click.stop="acceptOneSuggestion(row)"
                      >
                        <i class="mdi mdi-creation text-warning align-middle me-1"></i>
                        <span>Take {{ formatQty(row.suggested_reorder_point) }}</span>
                      </button>
                    </div>
                  </div>
                </td>

                <!-- Days Left / Velocity -->
                <td v-if="isCol('days_left')" class="text-center text-nowrap">
                  <div v-if="row.days_left !== null">
                    <span
                      class="badge"
                      :class="row.days_left <= 3 ? 'bg-danger bg-soft text-danger' : row.days_left <= 7 ? 'bg-warning bg-soft text-dark' : 'bg-light text-muted'"
                    >
                      {{ row.days_left }}d left
                    </span>
                    <small v-if="row.avg_daily_out" class="text-muted d-block font-size-10 mt-1">
                      {{ formatQty(row.avg_daily_out) }}/day
                    </small>
                  </div>
                  <span v-else class="text-muted font-size-12">—</span>
                </td>

                <!-- Valuation -->
                <td v-if="isCol('valuation')" class="text-end text-nowrap fw-semibold text-dark">
                  {{ formatMoney(row.valuation_kes) }}
                </td>

                <!-- Status Badge (Subtle colors) -->
                <td v-if="isCol('status')" class="text-nowrap text-center">
                  <span
                    class="badge font-size-12 px-2 py-1 fw-medium"
                    :class="statusBadgeClass(row.status)"
                  >
                    <i class="mdi mdi-record me-1 font-size-11" :class="statusDotOf(row.status)"></i>
                    {{ badgeMeta(row.status).label }}
                  </span>
                </td>

                <!-- Actions: Adjust button + Catalogue 3-dots dropdown -->
                <td class="text-end text-nowrap pe-3" @click.stop>
                  <div class="d-inline-flex align-items-center gap-1">
                    <button
                      type="button"
                      class="btn btn-white btn-sm waves-effect"
                      title="Adjust count, waste or staff drink"
                      @click="openAdjust(row)"
                    >
                      <i class="bx bx-slider-alt font-size-13 align-middle me-1"></i>
                      <span>Adjust</span>
                    </button>

                    <ul class="list-inline font-size-20 mb-0 d-inline-block">
                      <li class="list-inline-item px-1 dropdown d-flex justify-content-center align-items-center">
                        <a
                          href="javascript:void(0);"
                          title="More actions"
                          class="text-decoration-none text-black waves-effect px-2 rounded"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <i class="bx bx-dots-horizontal-rounded"></i>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end p-2" data-bs-auto-close="true">
                          <li>
                            <a
                              class="dropdown-item d-flex py-2 align-items-center"
                              href="javascript:void(0);"
                              @click="openAdjust(row)"
                            >
                              <i class="bx bx-slider-alt me-2 fs-5 text-primary"></i>
                              <span>Adjust count / waste</span>
                            </a>
                          </li>
                          <li>
                            <a
                              class="dropdown-item d-flex py-2 align-items-center"
                              href="javascript:void(0);"
                              @click="openReceiveModal"
                            >
                              <i class="bx bx-archive-in me-2 fs-5 text-success"></i>
                              <span>Receive delivery</span>
                            </a>
                          </li>
                          <li>
                            <a
                              class="dropdown-item d-flex py-2 align-items-center"
                              href="javascript:void(0);"
                              @click="openReorder(row)"
                            >
                              <i class="bx bx-bell me-2 fs-5 text-warning"></i>
                              <span>Set reorder point</span>
                            </a>
                          </li>
                          <li><hr class="dropdown-divider my-1"></li>
                          <li>
                            <a
                              class="dropdown-item d-flex py-2 align-items-center"
                              href="javascript:void(0);"
                              @click="openHistory(row)"
                            >
                              <i class="bx bx-history me-2 fs-5 text-info"></i>
                              <span>Movement ledger</span>
                            </a>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>

            <!-- Skeleton Rows -->
            <tbody v-if="loading && page === 1">
              <tr v-for="i in 6" :key="`sk-${i}`">
                <td>
                  <div class="d-flex align-items-center">
                    <SkeletonLoader width="36px" height="36px" />
                    <div class="d-flex flex-column gap-1 ms-2">
                      <SkeletonLoader type="text" :lines="1" height="10px" width="140px" class="mx-2" />
                      <SkeletonLoader type="text" :lines="1" height="10px" width="80px" class="mx-2" />
                    </div>
                  </div>
                </td>
                <td v-if="isCol('barcode')"><SkeletonLoader type="text" :lines="1" height="10px" width="100px" class="mx-2" /></td>
                <td v-if="isCol('quantity')"><SkeletonLoader type="text" :lines="1" height="10px" width="80px" class="mx-auto" /></td>
                <td v-if="isCol('reorder')"><SkeletonLoader type="text" :lines="1" height="10px" width="60px" class="mx-auto" /></td>
                <td v-if="isCol('days_left')"><SkeletonLoader type="text" :lines="1" height="10px" width="50px" class="mx-auto" /></td>
                <td v-if="isCol('valuation')"><SkeletonLoader type="text" :lines="1" height="10px" width="70px" class="ms-auto" /></td>
                <td v-if="isCol('status')"><SkeletonLoader type="text" :lines="1" height="10px" width="70px" class="mx-auto" /></td>
                <td><SkeletonLoader type="text" :lines="1" height="10px" width="20px" class="ms-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards View: Phones (d-md-none) -->
        <div v-if="loading || items.length" class="d-md-none">
          <!-- Skeleton cards -->
          <template v-if="loading && page === 1">
            <div v-for="i in 6" :key="`sk-card-${i}`" class="px-3 py-3 border-bottom d-flex gap-3">
              <SkeletonLoader width="48px" height="48px" />
              <div class="d-flex flex-column gap-2 flex-grow-1">
                <SkeletonLoader type="text" :lines="1" height="10px" width="160px" />
                <SkeletonLoader type="text" :lines="1" height="10px" width="110px" />
                <SkeletonLoader type="text" :lines="1" height="10px" width="130px" />
              </div>
            </div>
          </template>

          <!-- Real Mobile Cards -->
          <template v-else>
            <div
              v-for="row in items"
              :key="`card-${row.product.id}`"
              class="product-card px-3 py-3 border-bottom"
              @click="openHistory(row)"
            >
              <div class="d-flex gap-3 align-items-start">
                <img
                  v-if="row.product.image_url"
                  :src="row.product.image_url"
                  :alt="row.product.name"
                  class="product-thumb card-thumb flex-shrink-0"
                  loading="lazy"
                  @error="row.product.image_url = null"
                />
                <div v-else class="product-thumb card-thumb d-flex align-items-center justify-content-center text-muted flex-shrink-0">
                  <i class="bx fs-4 bx-package"></i>
                </div>

                <div class="flex-grow-1 min-w-0">
                  <span class="fw-bold text-black d-block text-truncate">{{ row.product.name }}</span>
                  <small class="text-muted d-block text-truncate">
                    {{ [row.product.brand, row.product.category].filter(Boolean).join(' · ') || 'General' }}
                  </small>

                  <!-- Barcode, on hand, and status on one line -->
                  <div class="d-flex flex-wrap align-items-center gap-2 mt-2 small">
                    <button
                      v-if="row.product.barcode"
                      type="button"
                      class="barcode-chip waves-effect"
                      @click.stop="copyText(row.product.barcode, `Barcode ${row.product.barcode}`)"
                    >
                      {{ row.product.barcode }}
                    </button>
                    <span class="text-black fw-semibold">
                      {{ row.quantity !== null ? `${formatQty(row.quantity)} ${row.product.unit || 'pcs'}` : 'Uncounted' }}
                    </span>
                    <span
                      class="badge font-size-11 px-2 py-1 fw-medium ms-auto"
                      :class="statusBadgeClass(row.status)"
                    >
                      <i class="mdi mdi-record me-1 font-size-10" :class="statusDotOf(row.status)"></i>
                      {{ badgeMeta(row.status).label }}
                    </span>
                  </div>
                </div>

                <!-- Dropdown Actions -->
                <div class="dropdown flex-shrink-0" @click.stop>
                  <a
                    href="javascript:void(0);"
                    title="more actions"
                    class="text-black fs-4 px-1 waves-effect"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i class="bx bx-dots-vertical-rounded"></i>
                  </a>
                  <ul class="dropdown-menu dropdown-menu-end p-2">
                    <li>
                      <a class="dropdown-item d-flex py-2 align-items-center" href="javascript:void(0);" @click="openAdjust(row)">
                        <i class="bx bx-slider-alt me-2 fs-5 text-primary"></i><span>Adjust count</span>
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item d-flex py-2 align-items-center" href="javascript:void(0);" @click="openReceiveModal">
                        <i class="bx bx-archive-in me-2 fs-5 text-success"></i><span>Receive delivery</span>
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item d-flex py-2 align-items-center" href="javascript:void(0);" @click="openReorder(row)">
                        <i class="bx bx-bell me-2 fs-5 text-warning"></i><span>Set reorder point</span>
                      </a>
                    </li>
                    <li><hr class="dropdown-divider my-1"></li>
                    <li>
                      <a class="dropdown-item d-flex py-2 align-items-center" href="javascript:void(0);" @click="openHistory(row)">
                        <i class="bx bx-history me-2 fs-5 text-info"></i><span>Movement ledger</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer / Load More (Catalogue pattern) -->
        <div class="w-100 d-flex align-items-center justify-content-center text-center p-3">
          <div v-if="!hasMore && items.length > 0" class="w-100 text-center">
            <p class="text-muted mb-0 small">
              <i class="bx bx-check-circle text-success me-1"></i>
              Showing all {{ total }} stock items
            </p>
          </div>
          <div v-if="hasMore" class="flex-grow-1 align-items-center justify-content-center text-center">
            <button
              class="btn btn-primary"
              :disabled="loading"
              @click="loadMore()"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
              Load more
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals & Drawers -->
    <StockAdjustModal
      ref="adjustModal"
      :branch-id="selectedBranchId"
      :branch-name="activeBranch?.name"
      @saved="onAdjustSaved"
      @error="showErrorToast"
    />

    <StockCountModal
      ref="countModal"
      :branch-id="selectedBranchId"
      :branch-name="activeBranch?.name"
      @saved="onCountSaved"
      @error="showErrorToast"
    />

    <ReorderPointModal
      ref="reorderModal"
      :branch-id="selectedBranchId"
      :branch-name="activeBranch?.name"
      @saved="onReorderSaved"
      @error="showErrorToast"
    />

    <StockReceiveModal
      ref="receiveModal"
      :branch-id="selectedBranchId"
      :branch-name="activeBranch?.name"
      :available-products="items.map(i => i.product)"
      @saved="onReceiveSaved"
      @error="showErrorToast"
    />

    <StockHistoryAside ref="historyAside" />

    <!-- Shared Image Toast -->
    <ImageToast
      :status="toastStatus"
      :title="toastTitle"
      :message="toastMessage"
      :image="toastImage"
      :imageHeight="70"
      @hide="toastStatus = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import StockAPI from "@/api/stock";
import BranchesAPI from "@/api/branches";
import {
  calculateStockHealth,
  formatQty,
  formatMoney,
} from "./helpers/stockMeta";

// Child components
import StockAdjustModal from "./components/StockAdjust.modal.vue";
import StockCountModal from "./components/StockCount.modal.vue";
import ReorderPointModal from "./components/ReorderPoint.modal.vue";
import StockReceiveModal from "./components/StockReceive.modal.vue";
import StockHistoryAside from "./components/StockHistory.aside.vue";
import SkeletonLoader from "@/components/Loaders/SkeletonLoader.vue";
import ImageToast from "@/components/ImageToast.vue";

import successImage from "@/assets/images/icons/check.png";
import errorImage from "@/assets/images/icons/error.png";

const route = useRoute();

// Branch State
const branches = ref([]);
const selectedBranchId = ref(null);
const activeBranch = computed(() => {
  return branches.value.find((b) => b.id === selectedBranchId.value) || branches.value[0] || null;
});

// Data State
const items = ref([]);
const summary = ref(null);
const loading = ref(false);
const refreshing = ref(false);
const acceptingAll = ref(false);

// Filters and Paging
const page = ref(1);
const perPage = ref(25);
const lastPage = ref(1);
const total = ref(0);
const searchQuery = ref("");
const selectedStatus = ref("all");
const sortBy = ref("urgency");
const sortOrder = ref("asc");

// Modals
const adjustModal = ref(null);
const countModal = ref(null);
const reorderModal = ref(null);
const receiveModal = ref(null);
const historyAside = ref(null);

// Toast
const toastStatus = ref(null);
const toastTitle = ref("");
const toastMessage = ref("");
const toastImage = ref(null);

// Column toggles
const columns = ref([
  { key: "barcode", label: "Barcode", visible: true },
  { key: "quantity", label: "On Hand / Health", visible: true },
  { key: "reorder", label: "Reorder Point", visible: true },
  { key: "days_left", label: "Velocity", visible: true },
  { key: "valuation", label: "Valuation", visible: true },
  { key: "status", label: "Status Badge", visible: true },
]);

function isCol(key) {
  return columns.value.find((c) => c.key === key)?.visible ?? true;
}

const statusTabs = computed(() => {
  const counts = summary.value?.counts || {};
  return [
    { key: "all", label: "All Items", count: counts.all ?? null },
    { key: "needs_order", label: "Needs Order", count: counts.needs_order ?? null },
    { key: "out", label: "Out of Stock", count: counts.out ?? null },
    { key: "low", label: "Low Stock", count: counts.low ?? null },
    { key: "ok", label: "In Stock", count: counts.ok ?? null },
    { key: "no_point", label: "No ROL", count: counts.no_point ?? null },
    { key: "not_counted", label: "Uncounted", count: counts.not_counted ?? null },
  ];
});

const sortOptions = [
  { key: "urgency", label: "Stock Urgency (Default)" },
  { key: "name", label: "Product Name" },
  { key: "barcode", label: "Barcode" },
  { key: "quantity", label: "Quantity on Hand" },
  { key: "reorder_point", label: "Reorder Point (ROL)" },
  { key: "days_left", label: "Velocity / Days Left" },
];

const statusFilterLabel = computed(() => {
  if (!selectedStatus.value || selectedStatus.value === "all") return "All status";
  const found = statusTabs.value.find((t) => t.key === selectedStatus.value);
  return found ? found.label : selectedStatus.value;
});

const sortLabel = computed(() => {
  const found = sortOptions.find((o) => o.key === sortBy.value);
  return found ? found.label : "Sort";
});

function toggleSortOrder(colKey, defaultOrder = "asc") {
  if (sortBy.value === colKey) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = colKey;
    sortOrder.value = defaultOrder;
  }
  reload();
}

function statusDotOf(status) {
  switch (status) {
    case "ok":
      return "text-success";
    case "low":
      return "text-warning";
    case "out":
    case "needs_order":
      return "text-danger";
    case "no_point":
      return "text-info";
    case "not_counted":
    default:
      return "text-muted";
  }
}

function statusBadgeClass(status) {
  switch (status) {
    case "ok":
      return "bg-success-subtle text-success";
    case "low":
      return "bg-warning-subtle text-warning";
    case "out":
    case "needs_order":
      return "bg-danger-subtle text-danger";
    case "no_point":
      return "bg-secondary-subtle text-secondary";
    case "not_counted":
    default:
      return "bg-light text-muted";
  }
}

const hasFilters = computed(() => !!(searchQuery.value.trim() || (selectedStatus.value && selectedStatus.value !== "all")));

const chips = computed(() => {
  const out = [];
  if (selectedStatus.value && selectedStatus.value !== "all") {
    const tab = statusTabs.value.find((t) => t.key === selectedStatus.value);
    out.push({
      key: "status",
      label: tab ? tab.label : selectedStatus.value,
      clear: () => setStatus("all"),
    });
  }
  if (searchQuery.value.trim()) {
    out.push({
      key: "q",
      label: `"${searchQuery.value.trim()}"`,
      clear: () => {
        searchQuery.value = "";
        reload();
      },
    });
  }
  return out;
});

function clearAll() {
  selectedStatus.value = "all";
  searchQuery.value = "";
  reload();
}

function healthOf(row) {
  return calculateStockHealth(row.quantity, row.reorder_point);
}

function badgeMeta(status) {
  switch (status) {
    case "ok":
      return {
        badgeClass: "bg-success-subtle text-success",
        icon: "mdi mdi-check-circle",
        label: "In Stock",
      };
    case "low":
      return {
        badgeClass: "bg-warning-subtle text-warning",
        icon: "mdi mdi-alert",
        label: "Low Stock",
      };
    case "out":
      return {
        badgeClass: "bg-danger-subtle text-danger",
        icon: "mdi mdi-close-circle",
        label: "Out of Stock",
      };
    case "needs_order":
      return {
        badgeClass: "bg-danger-subtle text-danger",
        icon: "mdi mdi-alert-circle",
        label: "Needs Order",
      };
    case "no_point":
      return {
        badgeClass: "bg-secondary-subtle text-secondary",
        icon: "mdi mdi-information",
        label: "No ROL",
      };
    case "not_counted":
    default:
      return {
        badgeClass: "bg-light text-muted",
        icon: "mdi mdi-help-circle",
        label: "Uncounted",
      };
  }
}

async function copyText(text, label = "Text") {
  try {
    await navigator.clipboard.writeText(text);
    showSuccessToast("Copied", `${label} copied to clipboard.`);
  } catch (err) {
    console.error("Clipboard copy failed:", err);
  }
}

// ---- Data fetching ----
async function loadBranches() {
  try {
    const { data } = await BranchesAPI.list();
    branches.value = data.data || [];
    if (branches.value.length) {
      const main = branches.value.find((b) => b.is_main) || branches.value[0];
      selectedBranchId.value = main.id;
    }
  } catch (err) {
    console.error("Error loading branches:", err);
  }
}

async function fetchStock(more = false) {
  if (!selectedBranchId.value) return;

  loading.value = true;
  try {
    const params = {
      branch_id: selectedBranchId.value,
      page: page.value,
      per_page: perPage.value,
      sort_by: sortBy.value,
      sort_order: sortOrder.value,
    };

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }
    if (selectedStatus.value && selectedStatus.value !== "all") {
      params.status = selectedStatus.value;
    }

    const { data } = await StockAPI.list(params);
    const newItems = data.data || [];
    if (more) {
      items.value.push(...newItems);
    } else {
      items.value = newItems;
    }
    summary.value = data.meta?.summary || null;
    total.value = data.meta?.total || items.value.length;
    lastPage.value = data.meta?.last_page || 1;
  } catch (err) {
    console.error("Error fetching stock:", err);
    showErrorToast(err.response?.data?.message || "Failed to load stock data.");
  } finally {
    loading.value = false;
  }
}

const hasMore = computed(() => page.value < lastPage.value);

function loadMore() {
  if (hasMore.value && !loading.value) {
    page.value++;
    fetchStock(true);
  }
}

function reload() {
  page.value = 1;
  fetchStock(false);
}

function changeBranch(id) {
  selectedBranchId.value = id;
  reload();
}

function setStatus(key) {
  selectedStatus.value = key;
  reload();
}

function setSort(key) {
  sortBy.value = key;
  reload();
}

let searchDebounce = null;
function onSearchInput() {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(reload, 350);
}

function onSearch() {
  clearTimeout(searchDebounce);
  reload();
}

// ---- Actions ----
function openAdjust(row) {
  adjustModal.value?.open(row);
}

function openCountModal() {
  countModal.value?.open(null);
}

function openReorder(row) {
  reorderModal.value?.open(row);
}

function openReceiveModal() {
  receiveModal.value?.open();
}

function openHistory(row) {
  historyAside.value?.open(row.product.id);
}

function exportCsv(type = "all") {
  const dataset = type === "low"
    ? items.value.filter((i) => i.status === "out" || i.status === "low")
    : items.value;

  if (!dataset.length) {
    showErrorToast("Export Failed", "No stock items available to export.");
    return;
  }

  const rows = [
    [
      "Product Name",
      "Barcode",
      "Category",
      "Brand",
      "Stock Level",
      "Unit",
      "Reorder Point",
      "Status",
      "Valuation (KES)",
    ],
  ];

  for (const item of dataset) {
    rows.push([
      item.product.name,
      item.product.barcode || "",
      item.product.category || "",
      item.product.brand || "",
      item.quantity !== null ? item.quantity : "",
      item.product.unit || "pcs",
      item.reorder_point !== null ? item.reorder_point : "",
      item.status,
      item.valuation_kes ?? 0,
    ]);
  }

  const csv = rows
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  const prefix = type === "low" ? "reorder-list" : "stock-inventory";
  a.download = `${prefix}-${activeBranch.value?.name || "branch"}-${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showSuccessToast("Export Completed", `Exported ${dataset.length} items to CSV.`);
}

function printStockSheet() {
  window.print();
}

async function acceptOneSuggestion(row) {
  if (!row.suggested_reorder_point) return;
  try {
    await StockAPI.acceptSuggestions({
      branch_id: selectedBranchId.value,
      product_ids: [row.product.id],
    });
    showSuccessToast("Suggestion Accepted", `Reorder point updated to ${formatQty(row.suggested_reorder_point)}.`);
    fetchStock(false);
  } catch (err) {
    showErrorToast(err.response?.data?.message || "Failed to accept suggestion.");
  }
}

async function acceptAllSuggestions() {
  const waitingIds = items.value
    .filter((i) => i.has_new_suggestion && i.suggested_reorder_point !== null)
    .map((i) => i.product.id);

  if (!waitingIds.length) return;

  acceptingAll.value = true;
  try {
    const { data } = await StockAPI.acceptSuggestions({
      branch_id: selectedBranchId.value,
      product_ids: waitingIds,
    });
    showSuccessToast("Suggestions Accepted", data.message || "All pending suggestions updated.");
    fetchStock(false);
  } catch (err) {
    showErrorToast(err.response?.data?.message || "Failed to accept suggestions.");
  } finally {
    acceptingAll.value = false;
  }
}

async function refreshSuggestions() {
  refreshing.value = true;
  try {
    const { data } = await StockAPI.refreshSuggestions();
    showSuccessToast("Suggestions Updated", data.message || "Velocity recalculated from sales history.");
    fetchStock(false);
  } catch (err) {
    showErrorToast(err.response?.data?.message || "Failed to recalculate suggestions.");
  } finally {
    refreshing.value = false;
  }
}

function onAdjustSaved({ message }) {
  showSuccessToast("Stock Adjusted", message);
  fetchStock(false);
}

function onCountSaved({ message }) {
  showSuccessToast("Stock Count Saved", message);
  fetchStock(false);
}

function onReorderSaved({ message }) {
  showSuccessToast("Reorder Point Saved", message);
  fetchStock(false);
}

function onReceiveSaved({ message }) {
  showSuccessToast("Delivery Received", message);
  fetchStock(false);
}

function showSuccessToast(title, message) {
  toastStatus.value = "success";
  toastTitle.value = title;
  toastMessage.value = message;
  toastImage.value = successImage;
}

function showErrorToast(message) {
  toastStatus.value = "error";
  toastTitle.value = "Action Failed";
  toastMessage.value = message;
  toastImage.value = errorImage;
}

onMounted(async () => {
  await loadBranches();
  await fetchStock(false);

  if (route.query.action === "receive") {
    receiveModal.value?.open({
      supplier_id: route.query.supplier_id || null,
      supplier_name: route.query.supplier_name || "",
    });
  }
});
</script>

<style scoped>
th.sortable {
  cursor: pointer;
  user-select: none;
}
th.sortable:hover {
  opacity: 0.75;
}

/* Product photos: a rounded white tile, the photo fitted inside */
.product-thumb {
  object-fit: contain;
  border-radius: 8px;
  background: #fff;
  border: 1px solid var(--bs-border-color);
}

.min-w-0 {
  min-width: 0;
}

.truncate-singleLine {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Phones: one card per product */
.product-card {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.product-card:active {
  background-color: var(--bs-light);
}

.card-thumb {
  width: 48px;
  height: 48px;
}

/* Header buttons: round, icon-only on phones */
@media (max-width: 575.98px) {
  .header-btn {
    width: 42px;
    height: 42px;
    padding: 0;
    border-radius: 50%;
  }
}

/* A dot on the filter button while a filter is on */
.filter-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bs-primary);
}

.filter-menu {
  max-height: 70vh;
  overflow-y: auto;
}

/* A barcode: monospace chip, click to copy */
.barcode-chip {
  font-family: var(--bs-font-monospace);
  font-size: 12px;
  line-height: 1;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid var(--bs-border-color);
  background: var(--bs-light);
  color: var(--bs-body-color);
  cursor: pointer;
}

/* Pill filters (Blog Articles style) */
.btn-rounded {
  border-radius: 30px;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.spin-anim {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

@media print {
  .page-title-box,
  .category-scroll,
  .search-box,
  .header-btn,
  .dropdown,
  .barcode-chip,
  td:last-child,
  th:last-child {
    display: none !important;
  }
}
</style>
