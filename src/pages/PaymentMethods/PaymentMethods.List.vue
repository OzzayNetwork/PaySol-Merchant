<template>
  <div class="container-fluid">
    <!-- Page Title -->
    <div class="row">
      <div class="col-12">
        <div class="page-title-box d-flex align-items-center justify-content-between gap-2">
          <div class="min-w-0">
            <h4 class="mb-sm-0 font-size-18 pb-2 text-truncate">How You Get Paid (Payment Modes)</h4>
            <div class="page-title-right">
              <ol class="breadcrumb m-0 flex-nowrap">
                <li class="breadcrumb-item d-none d-sm-block">
                  <router-link to="/">Dashboard</router-link>
                </li>
                <li class="breadcrumb-item active">Money</li>
                <li class="breadcrumb-item active text-truncate">How You Get Paid</li>
              </ol>
            </div>
          </div>
          <div class="d-flex gap-2 flex-shrink-0">
            <button
              type="button"
              @click="openAddModal()"
              title="Add a payment account"
              aria-label="Add a payment account"
              class="btn btn-primary header-btn d-flex flex-nowrap align-items-center justify-content-center gap-2 text-white"
            >
              <i class="dripicons-plus fs-4 d-flex"></i>
              <span class="d-none d-lg-inline">Add Payment Mode</span>
              <span class="d-none d-sm-inline d-lg-none">Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Metrics Summary Cards -->
    <div class="row mb-3 g-3">
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card h-100 mb-0 shadow-sm border">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted fs-12 fw-medium text-uppercase">Total Accounts</span>
                <h3 class="fw-bold text-dark mt-1 mb-0">{{ counts.total || 0 }}</h3>
              </div>
              <div class="avatar-sm rounded-circle bg-primary-subtle d-flex align-items-center justify-content-center text-primary">
                <Icon icon="ri:bank-card-line" class="fs-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card h-100 mb-0 shadow-sm border">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted fs-12 fw-medium text-uppercase">Active Receiving</span>
                <h3 class="fw-bold text-success mt-1 mb-0">{{ counts.active || 0 }}</h3>
              </div>
              <div class="avatar-sm rounded-circle bg-success-subtle d-flex align-items-center justify-content-center text-success">
                <Icon icon="ri:checkbox-circle-line" class="fs-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card h-100 mb-0 shadow-sm border">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted fs-12 fw-medium text-uppercase">M-Pesa & Mobile</span>
                <h3 class="fw-bold text-dark mt-1 mb-0">{{ counts.by_category?.mobile_money || 0 }}</h3>
              </div>
              <div class="avatar-sm rounded-circle bg-info-subtle d-flex align-items-center justify-content-center text-info">
                <Icon icon="ri:smartphone-line" class="fs-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card h-100 mb-0 shadow-sm border">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <span class="text-muted fs-12 fw-medium text-uppercase">Banks & Cards</span>
                <h3 class="fw-bold text-dark mt-1 mb-0">{{ (counts.by_category?.bank || 0) + (counts.by_category?.card || 0) }}</h3>
              </div>
              <div class="avatar-sm rounded-circle bg-warning-subtle d-flex align-items-center justify-content-center text-warning">
                <Icon icon="ri:bank-line" class="fs-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="row justify-content-center">
      <div class="col-12">
        <div class="card">
          <!-- Toolbar (Matching Branches.List.vue pattern) -->
          <div class="card-body border-bottom">
            <div class="row">
              <div class="col-12 gap-2 gap-md-3 d-flex align-items-center">
                <!-- Refresh -->
                <div>
                  <button
                    @click="loadData()"
                    type="button"
                    class="btn waves-effect btn-lg btn-light position-relative p-0 avatar-sm rounded-circle"
                    title="Refresh payment accounts"
                  >
                    <span class="avatar-title bg-transparent text-reset">
                      <Icon icon="boxicons:refresh-ccw" class="fs-4" :class="{ 'spin-icon': loading }" />
                    </span>
                  </button>
                </div>

                <!-- Search Box (Exact same placement and layout) -->
                <div class="flex-grow-1">
                  <div class="search-box mb-0 me-0">
                    <div class="position-relative">
                      <form @submit.prevent="handleSearchSubmit()" class="input-group bg-light rounded mb04 pb-0 flex-nowrap">
                        <div class="flex-grow-1">
                          <input
                            style="border-radius: 0px; padding-right: 35px;"
                            type="text"
                            class="form-control bg-light rounded flex-grow-1"
                            placeholder="Search by account name, till number, paybill, bank..."
                            spellcheck="false"
                            aria-label="Search payment accounts"
                            v-model="searchQuery"
                            @input="onSearchInput"
                          />
                          <i class="bx bx-search-alt search-icon fs-4"></i>
                          <i
                            v-if="searchQuery !== ''"
                            title="Clear search"
                            style="right: 15px; left: unset;"
                            class="mdi mdi-close search-icon cursor-pointer fs-3 waves-effect"
                            @click="clearSearch"
                          ></i>
                        </div>
                        <button
                          type="submit"
                          @click="handleSearchSubmit()"
                          title="Click to search"
                          class="btn btn-primary px-4 d-md-flex d-none align-items-center fw-bold"
                        >
                          <i class="bx bx-search-alt search-icon fs-4"></i>
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                <!-- Channel / Category Filter -->
                <div class="position-relative d-flex d-lg-flex d-none flex-shrink-0">
                  <button
                    class="d-lg-flex d-flex align-items-center fw-bold btn btn-light waves-effect gap-2 text-nowrap"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i class="mdi mdi-filter-variant fs-4 align-middle"></i>
                    <span class="d-md-inline-block d-none">{{ categoryFilterLabel }}</span>
                    <i class="mdi mdi-chevron-down fs-4"></i>
                  </button>
                  <div class="dropdown-menu p-2" style="min-width: 190px;">
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item"
                      :class="{ active: selectedCategory === '' }"
                      @click="setCategory('')"
                    >
                      All Channels ({{ counts.total || 0 }})
                    </a>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item"
                      :class="{ active: selectedCategory === 'mobile_money' }"
                      @click="setCategory('mobile_money')"
                    >
                      M-Pesa & Mobile ({{ counts.by_category?.mobile_money || 0 }})
                    </a>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item"
                      :class="{ active: selectedCategory === 'bank' }"
                      @click="setCategory('bank')"
                    >
                      Bank & PesaLink ({{ counts.by_category?.bank || 0 }})
                    </a>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item"
                      :class="{ active: selectedCategory === 'cash' }"
                      @click="setCategory('cash')"
                    >
                      Cash Drawers ({{ counts.by_category?.cash || 0 }})
                    </a>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item"
                      :class="{ active: selectedCategory === 'card' }"
                      @click="setCategory('card')"
                    >
                      Card PDQs ({{ counts.by_category?.card || 0 }})
                    </a>
                  </div>
                </div>

                <!-- Status Filter -->
                <div class="position-relative d-flex d-lg-flex d-none flex-shrink-0">
                  <button
                    class="d-lg-flex d-flex align-items-center fw-bold btn btn-light waves-effect gap-2 text-nowrap"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i class="mdi mdi-toggle-switch-outline fs-4 align-middle"></i>
                    <span class="d-md-inline-block d-none">{{ statusFilterLabel }}</span>
                    <i class="mdi mdi-chevron-down fs-4"></i>
                  </button>
                  <div class="dropdown-menu p-2" style="min-width: 160px;">
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item"
                      :class="{ active: statusFilter === 'all' }"
                      @click="setStatusFilter('all')"
                    >
                      All Accounts
                    </a>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item"
                      :class="{ active: statusFilter === '1' }"
                      @click="setStatusFilter('1')"
                    >
                      Active Only
                    </a>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item"
                      :class="{ active: statusFilter === '0' }"
                      @click="setStatusFilter('0')"
                    >
                      Inactive Only
                    </a>
                  </div>
                </div>

                <!-- Branch Filter (if branches loaded) -->
                <div v-if="branches.length > 0" class="position-relative d-flex d-lg-flex d-none flex-shrink-0">
                  <button
                    class="d-lg-flex d-flex align-items-center fw-bold btn btn-light waves-effect gap-2 text-nowrap"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i class="mdi mdi-storefront-outline fs-4 align-middle"></i>
                    <span class="d-md-inline-block d-none">{{ branchFilterLabel }}</span>
                    <i class="mdi mdi-chevron-down fs-4"></i>
                  </button>
                  <div class="dropdown-menu p-2" style="min-width: 180px;">
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item"
                      :class="{ active: branchFilter === '' }"
                      @click="setBranchFilter('')"
                    >
                      All Branches
                    </a>
                    <a
                      v-for="br in branches"
                      :key="br.id"
                      href="javascript:void(0);"
                      class="dropdown-item"
                      :class="{ active: branchFilter === br.id }"
                      @click="setBranchFilter(br.id)"
                    >
                      {{ br.name }}
                    </a>
                  </div>
                </div>

                <!-- Columns Visibility -->
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
                  <div class="dropdown-menu dropdown-menu-end p-3" style="min-width: 210px;">
                    <div v-for="col in columns" :key="col.key" class="form-check mb-2">
                      <input
                        class="form-check-input cursor-pointer"
                        type="checkbox"
                        :id="`col-${col.key}`"
                        v-model="col.visible"
                      />
                      <label class="form-check-label small cursor-pointer" :for="`col-${col.key}`">
                        {{ col.label }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Table Area -->
          <div class="card-body p-0" style="min-height: 60vh;">
            <!-- Empty state -->
            <div
              class="p-4 d-flex align-items-center justify-content-center h-100 w-100"
              v-if="!loading && filteredMethods.length === 0"
            >
              <div class="text-center p-4 w-100 h-100">
                <div class="empty-state-icon mb-0">
                  <i style="font-size: 130px;" class="bx bx-credit-card text-black opacity-25"></i>
                </div>
                <h4 class="fw-bold text-dark mb-2 text-capitalize">
                  {{ searchQuery || statusFilter !== 'all' || selectedCategory ? 'No payment modes match your filters' : "No payment accounts configured yet" }}
                </h4>
                <p v-if="searchQuery || statusFilter !== 'all' || selectedCategory" class="text-muted mb-3 mx-auto" style="max-width: 440px;">
                  We couldn't find any payment accounts matching your query. Check spelling or reset filters.
                </p>
                <p v-else class="text-muted mb-3 mx-auto" style="max-width: 440px;">
                  Set up your M-Pesa Till, Bank Paybill, or Cash drawer so your business can receive customer payments.
                </p>
                <button
                  v-if="!searchQuery && statusFilter === 'all' && !selectedCategory"
                  type="button"
                  class="btn btn-primary"
                  @click="openAddModal()"
                >
                  <i class="dripicons-plus me-1"></i> Add Payment Mode
                </button>
                <button v-else type="button" class="btn btn-soft-secondary" @click="resetFilters">
                  Clear filters
                </button>
              </div>
            </div>

            <!-- Table: tablets and desktop -->
            <div v-else class="table-responsive d-none d-md-block" style="min-height: 340px;">
              <!-- Showing Bar (Standard doc-table pattern) -->
              <table class="table verticle-middle table-hover mb-0 doc-table">
                <thead>
                  <tr>
                    <td>
                      <template v-if="!loading">
                        Showing <span class="fw-bold text-black">{{ filteredMethods.length }}</span> of
                        <span class="fw-bold text-black">{{ methods.length }}</span> Payment Accounts
                      </template>
                      <template v-else>
                        <div class="d-flex align-items-center gap-2">
                          <div
                            style="height: 20px; width: 20px;"
                            class="spinner-border text-secondary m-1"
                            role="status"
                          >
                            <span class="sr-only">Loading...</span>
                          </div>
                          <span>Loading accounts...</span>
                        </div>
                      </template>
                    </td>
                  </tr>
                </thead>
              </table>

              <table class="table verticle-middle table-hover mb-0 doc-table">
                <thead class="table-light text-nowrap">
                  <tr>
                    <th>Payment Account</th>
                    <th v-if="isColVisible('type')">Channel Type</th>
                    <th v-if="isColVisible('identifier')">Account / Till / PayBill</th>
                    <th v-if="isColVisible('bank')">Bank / Details</th>
                    <th v-if="isColVisible('branch')">Scope (Branch)</th>
                    <th v-if="isColVisible('primary')" class="text-center">Primary</th>
                    <th v-if="isColVisible('status')" class="text-center">Status</th>
                    <th class="text-end" style="width: 100px;">Actions</th>
                  </tr>
                </thead>

                <!-- Rows -->
                <tbody v-if="!loading">
                  <tr
                    v-for="item in filteredMethods"
                    :key="item.id"
                    class="cursor-pointer"
                    @click="openEditModal(item)"
                    title="Click to edit account details"
                  >
                    <!-- Account Name & Channel Avatar -->
                    <td>
                      <div class="d-flex gap-3 align-items-center" :title="item.name">
                        <div class="avatar-xs d-flex flex-shrink-0">
                          <div
                            class="avatar-xs rounded-circle d-flex align-items-center justify-content-center"
                            :style="getChannelBadgeStyle(item)"
                          >
                            <Icon :icon="getChannelIcon(item)" class="fs-5" />
                          </div>
                        </div>
                        <div class="min-w-0">
                          <div class="d-flex align-items-center gap-2">
                            <span class="d-block fw-bold text-dark truncate-singleLine hover-primary">
                              {{ item.name }}
                            </span>
                            <span
                              v-if="item.is_primary"
                              class="badge bg-warning text-dark font-size-10 px-2 py-0.5 d-flex align-items-center gap-1"
                            >
                              <Icon icon="ri:star-fill" class="font-size-11" /> Primary
                            </span>
                          </div>
                          <span style="font-size: 12px;" class="text-muted text-nowrap d-block">
                            {{ item.instructions || item.type_label }}
                          </span>
                        </div>
                      </div>
                    </td>

                    <!-- Channel Type Badge -->
                    <td v-if="isColVisible('type')">
                      <span class="badge px-2 py-1 font-size-11 fw-semibold" :style="getCategoryBadgeStyle(item)">
                        {{ item.type_label }}
                      </span>
                    </td>

                    <!-- Identifier / Till / PayBill / A/C -->
                    <td v-if="isColVisible('identifier')" @click.stop>
                      <div class="d-flex align-items-center gap-2">
                        <div class="min-w-0">
                          <span v-if="item.type === 'mpesa_till'" class="d-block font-size-13 fw-bold text-dark font-monospace">
                            Till: {{ item.identifier }}
                          </span>
                          <span v-else-if="item.type === 'mpesa_paybill' || item.type === 'bank_paybill'" class="d-block font-size-13 text-dark">
                            <span class="fw-bold font-monospace">PayBill {{ item.identifier }}</span>
                            <template v-if="item.account_number">
                              · A/C: <span class="fw-semibold">{{ item.account_number }}</span>
                            </template>
                          </span>
                          <span v-else-if="item.type === 'pochi_la_biashara'" class="d-block font-size-13 fw-bold text-dark font-monospace">
                            Phone: {{ item.identifier }}
                          </span>
                          <span v-else-if="item.type === 'bank_account'" class="d-block font-size-13 text-dark">
                            A/C: <span class="fw-bold font-monospace">{{ item.account_number }}</span>
                          </span>
                          <span v-else-if="item.type === 'card'" class="d-block font-size-13 text-dark">
                            TID: <span class="fw-bold font-monospace">{{ item.identifier || '—' }}</span>
                          </span>
                          <span v-else class="d-block font-size-13 text-dark font-monospace">
                            KES Cash Drawer
                          </span>
                        </div>

                        <!-- Copy Button -->
                        <button
                          v-if="item.identifier || item.account_number"
                          type="button"
                          class="btn btn-sm btn-link p-0 text-muted hover-primary"
                          @click="copyText(item.identifier || item.account_number, item.type_label)"
                          title="Copy identifier"
                        >
                          <Icon icon="ri:file-copy-line" class="fs-5" />
                        </button>
                      </div>
                    </td>

                    <!-- Bank Details -->
                    <td v-if="isColVisible('bank')">
                      <div v-if="item.bank">
                        <span class="d-block text-dark font-size-13 truncate-singleLine" :title="item.bank.name">
                          {{ item.bank.name }}
                        </span>
                        <span v-if="item.bank.ussd_code" style="font-size: 11px;" class="text-muted">
                          USSD: {{ item.bank.ussd_code }}
                        </span>
                      </div>
                      <span v-else class="text-muted font-size-13 opacity-50">—</span>
                    </td>

                    <!-- Scope (Branch) -->
                    <td v-if="isColVisible('branch')">
                      <span v-if="item.branch" class="d-block text-dark font-size-13 truncate-singleLine">
                        {{ item.branch.name }}
                      </span>
                      <span v-else class="badge bg-light text-secondary font-size-11">
                        All Branches
                      </span>
                    </td>

                    <!-- Primary -->
                    <td v-if="isColVisible('primary')" class="text-center text-nowrap" @click.stop>
                      <span
                        v-if="item.is_primary"
                        class="badge bg-warning text-dark px-2 py-1 font-size-11"
                      >
                        ★ Primary
                      </span>
                      <button
                        v-else-if="item.is_active"
                        type="button"
                        class="btn btn-sm btn-soft-warning font-size-11 py-0 px-2"
                        @click="setAsPrimary(item)"
                        title="Set as primary receiving account"
                      >
                        Set Primary
                      </button>
                      <span v-else class="text-muted font-size-11">—</span>
                    </td>

                    <!-- Status Toggle (Isolated switch pill) -->
                    <td v-if="isColVisible('status')" class="text-center text-nowrap" @click.stop>
                      <div class="d-inline-flex align-items-center gap-2 py-1 px-2 rounded-pill border bg-light bg-opacity-75" style="border-color: #e5e7eb !important;">
                        <div class="form-check form-switch mb-0" style="padding-left: 2.2em;">
                          <input
                            class="form-check-input cursor-pointer"
                            type="checkbox"
                            role="switch"
                            :id="'active_tb_' + item.id"
                            :checked="item.is_active"
                            @change="toggleStatus(item)"
                          />
                        </div>
                        <label
                          :for="'active_tb_' + item.id"
                          class="form-check-label font-size-11 fw-semibold mb-0 cursor-pointer"
                          :class="item.is_active ? 'text-success' : 'text-muted'"
                        >
                          {{ item.is_active ? 'Active' : 'Disabled' }}
                        </label>
                      </div>
                    </td>

                    <!-- Actions Dropdown -->
                    <td class="text-end" @click.stop>
                      <div class="dropdown">
                        <button
                          class="btn btn-light btn-sm dropdown-toggle p-1 px-2"
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <i class="mdi mdi-dots-horizontal fs-5"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end p-2" data-bs-auto-close="true">
                          <li>
                            <a
                              class="dropdown-item d-flex py-2 align-items-center"
                              href="javascript:void(0);"
                              @click="openEditModal(item)"
                            >
                              <i class="bx bx-edit-alt me-2 fs-5 text-muted"></i>
                              <span>Edit Account</span>
                            </a>
                          </li>
                          <li v-if="!item.is_primary && item.is_active">
                            <a
                              class="dropdown-item d-flex py-2 align-items-center text-warning"
                              href="javascript:void(0);"
                              @click="setAsPrimary(item)"
                            >
                              <i class="bx bx-star me-2 fs-5"></i>
                              <span>Set as Primary</span>
                            </a>
                          </li>
                          <li><hr class="dropdown-divider my-1" /></li>
                          <li>
                            <a
                              class="dropdown-item d-flex py-2 align-items-center text-danger"
                              href="javascript:void(0);"
                              @click="confirmDelete(item)"
                            >
                              <i class="bx bx-trash me-2 fs-5"></i>
                              <span>Deactivate</span>
                            </a>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                </tbody>

                <!-- Skeleton Loader when loading -->
                <tbody v-if="loading">
                  <tr v-for="n in 3" :key="`sk-${n}`">
                    <td>
                      <div class="d-flex gap-3 align-items-center">
                        <div class="avatar-xs rounded-circle bg-light"></div>
                        <div class="d-flex flex-column gap-1">
                          <div style="height: 12px; width: 140px; background: #f3f4f6; border-radius: 4px;"></div>
                          <div style="height: 10px; width: 90px; background: #f3f4f6; border-radius: 4px;"></div>
                        </div>
                      </div>
                    </td>
                    <td v-if="isColVisible('type')"><div style="height: 12px; width: 80px; background: #f3f4f6; border-radius: 4px;"></div></td>
                    <td v-if="isColVisible('identifier')"><div style="height: 12px; width: 110px; background: #f3f4f6; border-radius: 4px;"></div></td>
                    <td v-if="isColVisible('bank')"><div style="height: 12px; width: 100px; background: #f3f4f6; border-radius: 4px;"></div></td>
                    <td v-if="isColVisible('branch')"><div style="height: 12px; width: 90px; background: #f3f4f6; border-radius: 4px;"></div></td>
                    <td v-if="isColVisible('primary')" class="text-center"><div style="height: 12px; width: 50px; background: #f3f4f6; border-radius: 4px; margin: 0 auto;"></div></td>
                    <td v-if="isColVisible('status')" class="text-center"><div style="height: 18px; width: 60px; background: #f3f4f6; border-radius: 10px; margin: 0 auto;"></div></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile cards view (phones, < 768px) -->
            <div class="d-block d-md-none p-2">
              <div
                v-for="item in filteredMethods"
                :key="`mb-${item.id}`"
                class="card border mb-2 shadow-none p-3 cursor-pointer"
                :class="{ 'bg-warning-subtle bg-opacity-10': item.is_primary }"
                @click="openEditModal(item)"
              >
                <div class="d-flex align-items-start justify-content-between mb-2">
                  <div class="min-w-0 me-2">
                    <div class="d-flex align-items-center gap-2">
                      <h5 class="fw-bold text-dark mb-0 font-size-14 text-truncate">{{ item.name }}</h5>
                      <span v-if="item.is_primary" class="badge bg-warning text-dark font-size-10">Primary</span>
                    </div>
                    <span class="text-muted font-size-11 d-block text-truncate mt-1">
                      {{ item.type_label }}
                      <template v-if="item.identifier"> · {{ item.identifier }}</template>
                      <template v-if="item.account_number"> · {{ item.account_number }}</template>
                    </span>
                  </div>
                  <span
                    class="badge font-size-10 flex-shrink-0"
                    :class="item.is_active ? 'bg-success-subtle text-success' : 'bg-light text-muted'"
                  >
                    {{ item.is_active ? 'Active' : 'Disabled' }}
                  </span>
                </div>

                <div class="d-flex align-items-center justify-content-between pt-2 border-top font-size-12">
                  <span class="text-muted">{{ item.branch?.name || 'All Branches' }}</span>
                  <button
                    type="button"
                    class="btn btn-sm btn-link p-0 text-primary fw-semibold"
                    @click.stop="openEditModal(item)"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <PaymentMethodFormModal
      :visible="showModal"
      :method="selectedMethod"
      :banks="banks"
      :branches="branches"
      @close="closeModal"
      @saved="onMethodSaved"
    />

    <!-- Feedback Toast -->
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
import { ref, reactive, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import paymentMethodsApi from "@/api/paymentMethods";
import PaymentMethodFormModal from "./components/PaymentMethodForm.modal.vue";
import ImageToast from "@/components/ImageToast.vue";
import successImage from "@/assets/images/icons/check.png";
import errorImage from "@/assets/images/icons/error.png";

// State
const loading = ref(false);
const methods = ref([]);
const counts = reactive({
  total: 0,
  active: 0,
  by_category: {
    cash: 0,
    mobile_money: 0,
    bank: 0,
    card: 0,
  },
});

const banks = ref([]);
const branches = ref([]);

// Filters
const selectedCategory = ref("");
const searchQuery = ref("");
const statusFilter = ref("all");
const branchFilter = ref("");

// Columns configuration
const columns = ref([
  { key: "type", label: "Channel Type", visible: true },
  { key: "identifier", label: "Till / PayBill / A/C", visible: true },
  { key: "bank", label: "Bank Details", visible: true },
  { key: "branch", label: "Branch Scope", visible: true },
  { key: "primary", label: "Primary Account", visible: true },
  { key: "status", label: "Active Status", visible: true },
]);

function isColVisible(key) {
  const c = columns.value.find((col) => col.key === key);
  return c ? c.visible : true;
}

// Dropdown Labels
const categoryFilterLabel = computed(() => {
  switch (selectedCategory.value) {
    case "mobile_money":
      return "M-Pesa & Mobile";
    case "bank":
      return "Bank & PesaLink";
    case "cash":
      return "Cash Drawers";
    case "card":
      return "Card PDQs";
    default:
      return "All Channels";
  }
});

const statusFilterLabel = computed(() => {
  switch (statusFilter.value) {
    case "1":
      return "Active Only";
    case "0":
      return "Inactive Only";
    default:
      return "All Accounts";
  }
});

const branchFilterLabel = computed(() => {
  if (!branchFilter.value) return "All Branches";
  const br = branches.value.find((b) => b.id === branchFilter.value);
  return br ? br.name : "Branch";
});

// Modal state
const showModal = ref(false);
const selectedMethod = ref(null);

// Toast state
const toastStatus = ref(null);
const toastTitle = ref("");
const toastMessage = ref("");
const toastImage = ref(successImage);

function showToast(title, message, isError = false) {
  toastStatus.value = isError ? "error" : "success";
  toastTitle.value = title;
  toastMessage.value = message;
  toastImage.value = isError ? errorImage : successImage;
}

// Initial Data Load
onMounted(() => {
  loadOptions();
  loadMethods();
});

async function loadData() {
  await Promise.all([loadOptions(), loadMethods()]);
}

async function loadOptions() {
  try {
    const res = await paymentMethodsApi.options();
    if (res.data) {
      banks.value = res.data.banks || [];
      branches.value = res.data.branches || [];
      if (res.data.counts) {
        Object.assign(counts, res.data.counts);
      }
    }
  } catch (err) {
    console.error("Failed to load payment options:", err);
  }
}

async function loadMethods() {
  loading.value = true;
  try {
    const params = { per_page: 100 };
    if (selectedCategory.value) {
      params.category = selectedCategory.value;
    }
    if (statusFilter.value !== "all") {
      params.is_active = statusFilter.value;
    }
    if (branchFilter.value) {
      params.branch_id = branchFilter.value;
    }
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }

    const res = await paymentMethodsApi.list(params);
    methods.value = res.data?.data || [];
    if (res.data?.meta?.counts) {
      Object.assign(counts, res.data.meta.counts);
    }
  } catch (err) {
    showToast("Error", "Could not load payment accounts.", true);
  } finally {
    loading.value = false;
  }
}

const filteredMethods = computed(() => {
  return methods.value;
});

function setCategory(cat) {
  selectedCategory.value = cat;
  loadMethods();
}

function setStatusFilter(st) {
  statusFilter.value = st;
  loadMethods();
}

function setBranchFilter(bId) {
  branchFilter.value = bId;
  loadMethods();
}

let searchDebounceTimer = null;
function onSearchInput() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    loadMethods();
  }, 300);
}

function handleSearchSubmit() {
  clearTimeout(searchDebounceTimer);
  loadMethods();
}

function clearSearch() {
  searchQuery.value = "";
  loadMethods();
}

function resetFilters() {
  selectedCategory.value = "";
  searchQuery.value = "";
  statusFilter.value = "all";
  branchFilter.value = "";
  loadMethods();
}

// Modal Handlers
function openAddModal() {
  selectedMethod.value = null;
  showModal.value = true;
}

function openEditModal(item) {
  selectedMethod.value = item;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedMethod.value = null;
}

function onMethodSaved(data) {
  const isEditing = !!selectedMethod.value;
  showModal.value = false;
  selectedMethod.value = null;
  showToast(
    isEditing ? "Account Updated" : "Account Added",
    `Payment account "${data.name}" has been saved.`
  );
  loadMethods();
  loadOptions();
}

// Toggles & Actions
async function toggleStatus(item) {
  const nextStatus = !item.is_active;
  try {
    await paymentMethodsApi.toggleActive(item.id, nextStatus);
    item.is_active = nextStatus;
    showToast(
      nextStatus ? "Account Activated" : "Account Suspended",
      `"${item.name}" is now ${nextStatus ? "active" : "disabled"}.`
    );
    loadOptions();
  } catch (err) {
    showToast("Update Failed", "Could not change account status.", true);
  }
}

async function setAsPrimary(item) {
  try {
    await paymentMethodsApi.setPrimary(item.id);
    methods.value.forEach((m) => {
      if (m.category === item.category) {
        m.is_primary = m.id === item.id;
      }
    });
    item.is_primary = true;
    showToast(
      "Primary Updated",
      `"${item.name}" is now the primary ${item.type_label} account.`
    );
  } catch (err) {
    showToast("Error", "Could not set as primary account.", true);
  }
}

async function confirmDelete(item) {
  if (
    confirm(
      `Are you sure you want to deactivate "${item.name}"? It will be removed from checkout screens.`
    )
  ) {
    try {
      await paymentMethodsApi.delete(item.id);
      item.is_active = false;
      showToast("Account Deactivated", `"${item.name}" has been deactivated.`);
      loadMethods();
      loadOptions();
    } catch (err) {
      showToast("Error", "Could not deactivate account.", true);
    }
  }
}

// Clipboard Copy
async function copyText(text, label) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied to Clipboard", `${label} "${text}" copied.`);
  } catch (err) {
    showToast("Copy", text);
  }
}

// Styling helpers
function getChannelIcon(item) {
  switch (item.type) {
    case "mpesa_till":
      return "ri:smartphone-line";
    case "mpesa_paybill":
      return "ri:qr-code-line";
    case "pochi_la_biashara":
      return "material-symbols:phone-android-rounded";
    case "bank_paybill":
      return "ri:bank-card-2-line";
    case "bank_account":
      return "ri:bank-line";
    case "card":
      return "ri:bank-card-line";
    case "cash":
    default:
      return "ri:cash-line";
  }
}

function getChannelBadgeStyle(item) {
  switch (item.category) {
    case "mobile_money":
      return { background: "#ecfdf5", color: "#059669" };
    case "bank":
      return { background: "#f5f3ff", color: "#7c3aed" };
    case "card":
      return { background: "#f0fdfa", color: "#0d9488" };
    case "cash":
    default:
      return { background: "#fffbeb", color: "#d97706" };
  }
}

function getCategoryBadgeStyle(item) {
  switch (item.category) {
    case "mobile_money":
      return { background: "#d1fae5", color: "#065f46" };
    case "bank":
      return { background: "#ede9fe", color: "#5b21b6" };
    case "card":
      return { background: "#ccfbf1", color: "#115e59" };
    case "cash":
    default:
      return { background: "#fef3c7", color: "#92400e" };
  }
}
</script>

<style scoped>
.hover-primary:hover {
  color: var(--bs-primary) !important;
}
.cursor-pointer {
  cursor: pointer;
}
.header-btn {
  height: 38px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
}
.truncate-singleLine {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
