<template>
  <div>
    <!-- Page title, matching Staff.List.vue and Products.List.vue -->
    <div class="row">
      <div class="col-12">
        <div class="page-title-box d-flex align-items-center justify-content-between gap-2">
          <div>
            <h4 class="mb-sm-0 font-size-18 pb-2">Register Shifts</h4>
            <div class="page-title-right">
              <ol class="breadcrumb m-0">
                <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
                <li class="breadcrumb-item">Selling</li>
                <li class="breadcrumb-item active">Register Shifts</li>
              </ol>
            </div>
          </div>
          <div class="d-flex gap-2 flex-shrink-0 align-items-center">
            <button
              type="button"
              class="btn d-flex align-items-center justify-content-center gap-2 flex-nowrap"
              :class="shiftStore.hasActiveShift ? 'btn-success text-white' : 'btn-primary text-white'"
              @click="shiftStore.openModal"
            >
              <i :class="shiftStore.hasActiveShift ? 'mdi mdi-clock-check-outline fs-4' : 'dripicons-plus fs-4 d-flex'"></i>
              <span class="d-none d-sm-inline">{{ shiftStore.hasActiveShift ? 'Manage Active Shift' : 'Open Shift' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Key Shift Statistics Grid (Spanning full width across 4 columns) -->
    <div class="shift-stats-grid mb-4" aria-label="Shift statistics">
      <MetricCard
        label="Active Shift"
        icon="ri:time-line"
        iconActive="ri:time-fill"
        :value="shiftStore.hasActiveShift ? 1 : 0"
        :format="() => shiftStore.hasActiveShift ? (shiftStore.activeShiftNumber || 'Active') : 'Closed'"
        :change-tone="shiftStore.hasActiveShift ? 'positive' : 'neutral'"
        :change-text="shiftStore.hasActiveShift ? `${shiftStore.activeMembersCount} on duty` : 'Drawer locked'"
        :loading="loading && !shifts.length"
      />

      <MetricCard
        label="Total Shifts"
        icon="ri:calendar-event-line"
        iconActive="ri:calendar-event-fill"
        :value="total"
        :format="(n) => (n || 0).toLocaleString('en-KE')"
        change-tone="neutral"
        change-text="All records"
        :period="dateFrom ? 'in period' : 'to date'"
        :loading="loading && !shifts.length"
      />

      <MetricCard
        label="Period Sales"
        icon="ri:money-cny-circle-line"
        iconActive="ri:money-cny-circle-fill"
        :value="totalPeriodSales"
        :format="(n) => 'KES ' + Math.round(n).toLocaleString('en-KE')"
        change-tone="positive"
        change-text="Total rung"
        :loading="loading && !shifts.length"
      />

      <MetricCard
        label="Cash Variance"
        icon="ri:scales-3-line"
        iconActive="ri:scales-3-fill"
        :value="totalPeriodVariance"
        :format="(n) => (n > 0 ? '+' : '') + 'KES ' + Math.round(n).toLocaleString('en-KE')"
        :change-tone="totalPeriodVariance < 0 ? 'negative' : (totalPeriodVariance > 0 ? 'positive' : 'neutral')"
        :change-marker="totalPeriodVariance < 0 ? '▼' : (totalPeriodVariance > 0 ? '▲' : '•')"
        :change-text="totalPeriodVariance === 0 ? 'Balanced' : (totalPeriodVariance < 0 ? 'Shortage' : 'Surplus')"
        :loading="loading && !shifts.length"
      />
    </div>

    <!-- ONE Single main card — identical to Staff.List.vue and Products.List.vue -->
    <div class="row">
      <div class="col-12">
        <div class="card flat-card">
          <!-- Toolbar: refresh, search, status, branch, dates, export -->
          <div class="card-body border-bottom">
            <div class="d-flex gap-2 gap-md-3 align-items-center">
              <!-- Refresh button -->
              <div>
                <button
                  @click="reload()"
                  type="button"
                  class="btn waves-effect btn-lg btn-light position-relative p-0 avatar-sm rounded-circle"
                  :disabled="loading"
                >
                  <span class="avatar-title bg-transparent text-reset">
                    <Icon title="Refresh shifts" icon="boxicons:refresh-ccw" class="fs-4" :class="{ 'spin-anim': loading }" />
                  </span>
                </button>
              </div>

              <!-- Search -->
              <div class="flex-grow-1" style="min-width: 0;">
                <div class="search-box mb-0 me-0">
                  <div class="position-relative">
                    <form @submit.prevent="reload()" class="input-group bg-light rounded pb-0 flex-nowrap">
                      <div class="flex-grow-1">
                        <input
                          style="border-radius: 0px; padding-right: 35px;"
                          type="text"
                          class="form-control bg-light rounded flex-grow-1"
                          placeholder="Search by shift #, staff name, branch..."
                          spellcheck="false"
                          aria-label="Search shifts"
                          v-model="searchQuery"
                          @input="onSearch"
                        />
                        <i class="bx bx-search-alt search-icon fs-4"></i>
                        <i
                          v-if="searchQuery != ''"
                          title="Clear search"
                          style="right: 15px; left:unset;"
                          class="mdi mdi-close search-icon cursor-pointer fs-3 waves-effect"
                          @click="searchQuery = ''; reload();"
                        ></i>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <!-- Phones & tablets: filters in one menu (matching Staff.List.vue) -->
              <div class="position-relative d-flex d-lg-none">
                <button
                  type="button"
                  title="Filter shifts"
                  class="btn btn-light waves-effect position-relative p-0 avatar-sm rounded-circle"
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                  aria-expanded="false"
                >
                  <span class="avatar-title bg-transparent text-reset"><i class="mdi mdi-filter-variant fs-4"></i></span>
                  <span v-if="statusFilter || branchFilter" class="filter-dot"></span>
                </button>
                <div class="dropdown-menu dropdown-menu-end p-2" style="min-width: 220px;">
                  <h6 class="dropdown-header">Status</h6>
                  <a
                    v-for="s in statusOptions"
                    :key="`m-s-${s.key}`"
                    href="javascript:void(0);"
                    class="dropdown-item"
                    :class="{ active: statusFilter === s.key }"
                    @click="setStatus(s.key)"
                  >
                    {{ s.label }}
                  </a>
                  <template v-if="branches.length > 1">
                    <div class="dropdown-divider"></div>
                    <h6 class="dropdown-header">Branch</h6>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item"
                      :class="{ active: !branchFilter }"
                      @click="setBranch(null)"
                    >
                      All Branches
                    </a>
                    <a
                      v-for="b in branches"
                      :key="`m-b-${b.id}`"
                      href="javascript:void(0);"
                      class="dropdown-item"
                      :class="{ active: branchFilter === b.id }"
                      @click="setBranch(b.id)"
                    >
                      {{ b.name }}
                    </a>
                  </template>
                </div>
              </div>

              <!-- Status filter (Desktop) -->
              <div class="position-relative d-none d-lg-flex">
                <button
                  class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i class="mdi mdi-toggle-switch-outline fs-4"></i>
                  <span>{{ statusFilter ? statusLabel(statusFilter) : 'Status' }}</span>
                  <i class="mdi mdi-chevron-down fs-4"></i>
                </button>
                <div class="dropdown-menu p-2" style="min-width: 180px;">
                  <a
                    v-for="s in statusOptions"
                    :key="s.key"
                    href="javascript:void(0);"
                    class="dropdown-item d-flex align-items-center gap-2"
                    :class="{ active: statusFilter === s.key }"
                    @click="setStatus(s.key)"
                  >
                    {{ s.label }}
                    <span v-if="s.count != null" class="ms-auto text-muted small">{{ s.count }}</span>
                  </a>
                </div>
              </div>

              <!-- Branch filter (Desktop, if multi-branch) -->
              <div v-if="branches.length > 1" class="position-relative d-none d-lg-flex">
                <button
                  class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i class="bx bx-store-alt fs-4"></i>
                  <span class="text-truncate" style="max-width: 160px;">{{ branchFilterLabel }}</span>
                  <i class="mdi mdi-chevron-down fs-4"></i>
                </button>
                <div class="dropdown-menu p-2" style="min-width: 200px;">
                  <a
                    href="javascript:void(0);"
                    class="dropdown-item"
                    :class="{ active: !branchFilter }"
                    @click="setBranch(null)"
                  >
                    All Branches
                  </a>
                  <div class="dropdown-divider"></div>
                  <a
                    v-for="b in branches"
                    :key="b.id"
                    href="javascript:void(0);"
                    class="dropdown-item d-flex align-items-center justify-content-between"
                    :class="{ active: branchFilter === b.id }"
                    @click="setBranch(b.id)"
                  >
                    <span>{{ b.name }}</span>
                    <small v-if="b.is_main" class="text-muted">(Main)</small>
                  </a>
                </div>
              </div>

              <!-- Date Range Picker (Existing Facebook style shared component) -->
              <div class="position-relative d-flex align-items-center flex-shrink-0 text-nowrap">
                <DateRangePicker v-model:dateFrom="dateFrom" v-model:dateTo="dateTo" @change="reload()" />
              </div>

              <!-- Export CSV Button -->
              <div class="d-none d-lg-flex">
                <button
                  type="button"
                  class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2"
                  :disabled="!shifts.length || loading"
                  @click="exportCsv"
                  title="Download shifts as a CSV"
                >
                  <i class="bx bx-download fs-4"></i>
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          <!-- "Showing X of Y" and the filters in use (matching Staff.List.vue) -->
          <div class="card-body py-2 border-bottom d-flex flex-wrap align-items-center gap-2 font-size-13">
            <div v-if="loading && !shifts.length">
              <SkeletonLoader type="text" :lines="1" height="10px" width="150px" />
            </div>
            <span v-else class="text-muted">
              Showing <span class="fw-bold text-black">{{ shifts.length }}</span> of <span class="fw-bold text-black">{{ total }}</span> {{ total === 1 ? 'shift' : 'shifts' }}
            </span>

            <template v-if="chips.length">
              <span class="text-muted">· Filters in use:</span>
              <span
                v-for="c in chips"
                :key="c.key"
                class="badge rounded-pill bg-primary bg-soft text-primary font-size-12 fw-medium px-2 py-1 d-inline-flex align-items-center gap-1"
              >
                {{ c.label }}
                <a href="javascript:void(0);" class="text-primary" :title="`Remove ${c.label}`" @click="c.clear()">
                  <i class="mdi mdi-close"></i>
                </a>
              </span>
              <a v-if="chips.length > 1" href="javascript:void(0);" class="ms-1 font-size-12" @click="clearAll">Clear all</a>
            </template>
          </div>

          <!-- Main Table Body (matching Staff.List.vue) -->
          <div class="card-body p-0" style="min-height: 55vh;">
            <!-- Empty state -->
            <div v-if="!loading && !shifts.length" class="text-center p-5">
              <Icon icon="ri:time-line" class="text-black opacity-25" style="font-size: 120px;" />
              <h4 class="fw-bold text-dark mb-2">{{ hasFilters ? 'No shifts match' : 'No shifts yet' }}</h4>
              <p class="text-muted mb-3">
                {{ hasFilters ? 'No shifts match your search or filter settings.' : 'Open your first cash register shift to start ringing sales with your team.' }}
              </p>
              <button
                v-if="!hasFilters && !shiftStore.hasActiveShift"
                type="button"
                class="btn btn-primary"
                @click="shiftStore.openModal"
              >
                Open First Shift
              </button>
            </div>

            <template v-else>
              <!-- Tablets and up: the table -->
              <div class="table-responsive d-none d-md-block">
                <table class="table verticle-middle table-hover mb-0">
                  <thead class="table-light text-nowrap">
                    <tr>
                      <th>Shift Number</th>
                      <th>Branch</th>
                      <th>Shift Lead</th>
                      <th>On Duty</th>
                      <th>Opened</th>
                      <th>Duration</th>
                      <th class="text-end">Float</th>
                      <th class="text-end">Sales Total</th>
                      <th class="text-end">Drawer Variance</th>
                      <th></th>
                    </tr>
                  </thead>

                  <!-- Rows -->
                  <tbody v-if="!(loading && page === 1)">
                    <tr
                      v-for="s in filteredShifts"
                      :key="s.id"
                      class="shift-row cursor-pointer"
                      @click="openDetails(s)"
                    >
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <span
                            class="badge rounded-pill font-size-11 px-2"
                            :class="s.status === 'open' ? 'bg-success bg-soft text-success' : 'bg-secondary bg-soft text-secondary'"
                          >
                            {{ s.status === 'open' ? 'Active' : 'Closed' }}
                          </span>
                          <span class="font-monospace fw-bold text-dark">{{ s.shift_number }}</span>
                        </div>
                      </td>

                      <td class="text-nowrap text-muted">
                        {{ s.branch?.name || 'Main Branch' }}
                      </td>

                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <div class="avatar-xs flex-shrink-0">
                            <span class="avatar-title rounded-circle fw-semibold font-size-11 bg-light text-muted">
                              {{ initialsOf(s.opened_by?.name) }}
                            </span>
                          </div>
                          <span class="fw-medium text-dark text-truncate">{{ s.opened_by?.name || '—' }}</span>
                        </div>
                      </td>

                      <td class="text-nowrap">
                        <span class="text-muted font-size-12">
                          {{ s.active_members_count || 1 }} {{ (s.active_members_count || 1) === 1 ? 'person' : 'people' }}
                        </span>
                      </td>

                      <td class="text-nowrap font-size-12 text-muted">
                        {{ formatDateTime(s.opened_at) }}
                      </td>

                      <td class="text-nowrap font-size-12 text-muted">
                        {{ getShiftDuration(s) }}
                      </td>

                      <td class="text-end text-nowrap font-size-12 fw-medium text-dark">
                        {{ formatMoney(s.opening_float) }}
                      </td>

                      <td class="text-end text-nowrap font-size-12 fw-bold text-dark">
                        {{ formatMoney(s.total_sales_amount) }}
                      </td>

                      <td class="text-end text-nowrap font-size-12">
                        <template v-if="s.status === 'closed'">
                          <span
                            class="fw-bold"
                            :class="s.cash_variance < 0 ? 'text-danger' : (s.cash_variance > 0 ? 'text-success' : 'text-muted')"
                          >
                            {{ s.cash_variance > 0 ? '+' : '' }}{{ formatMoney(s.cash_variance || 0) }}
                          </span>
                        </template>
                        <template v-else>
                          <span class="text-muted font-size-11">Running</span>
                        </template>
                      </td>

                      <!-- Action menu -->
                      <td @click.stop class="text-end">
                        <button
                          type="button"
                          class="btn btn-sm btn-light waves-effect"
                          @click="openDetails(s)"
                          title="View shift details"
                        >
                          <Icon icon="ri:information-line" class="fs-5 align-middle" />
                          <span class="ms-1">Details</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>

                  <!-- Skeleton rows -->
                  <tbody v-if="loading">
                    <tr v-for="n in (page === 1 ? 6 : 2)" :key="`sk-${n}`">
                      <td><SkeletonLoader type="text" :lines="1" height="12px" width="130px" /></td>
                      <td><SkeletonLoader type="text" :lines="1" height="12px" width="80px" /></td>
                      <td><SkeletonLoader type="text" :lines="1" height="12px" width="100px" /></td>
                      <td><SkeletonLoader type="text" :lines="1" height="12px" width="60px" /></td>
                      <td><SkeletonLoader type="text" :lines="1" height="12px" width="90px" /></td>
                      <td><SkeletonLoader type="text" :lines="1" height="12px" width="70px" /></td>
                      <td class="text-end"><SkeletonLoader type="text" :lines="1" height="12px" width="70px" /></td>
                      <td class="text-end"><SkeletonLoader type="text" :lines="1" height="12px" width="70px" /></td>
                      <td class="text-end"><SkeletonLoader type="text" :lines="1" height="12px" width="60px" /></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Phones: cards (matching Staff.List.vue mobile list pattern) -->
              <div class="d-md-none">
                <template v-if="loading && page === 1">
                  <div v-for="n in 4" :key="`skc-${n}`" class="p-3 border-bottom">
                    <SkeletonLoader type="text" :lines="2" height="12px" />
                  </div>
                </template>
                <div
                  v-for="s in filteredShifts"
                  :key="`m-${s.id}`"
                  class="p-3 border-bottom cursor-pointer shift-card-item"
                  @click="openDetails(s)"
                >
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="font-monospace fw-bold text-dark font-size-13">{{ s.shift_number }}</span>
                    <span
                      class="badge rounded-pill font-size-11 px-2"
                      :class="s.status === 'open' ? 'bg-success bg-soft text-success' : 'bg-secondary bg-soft text-secondary'"
                    >
                      {{ s.status === 'open' ? 'Active' : 'Closed' }}
                    </span>
                  </div>

                  <div class="text-muted font-size-12 mb-2">
                    {{ s.branch?.name || 'Main Branch' }} · Lead: {{ s.opened_by?.name || '—' }} · {{ formatDateTime(s.opened_at) }}
                  </div>

                  <div class="d-flex justify-content-between font-size-12 pt-1 border-top">
                    <span>Float: <strong class="text-dark">{{ formatMoney(s.opening_float) }}</strong></span>
                    <span>Sales: <strong class="text-dark">{{ formatMoney(s.total_sales_amount) }}</strong></span>
                    <span v-if="s.status === 'closed'">
                      Diff:
                      <strong :class="s.cash_variance < 0 ? 'text-danger' : (s.cash_variance > 0 ? 'text-success' : 'text-muted')">
                        {{ s.cash_variance > 0 ? '+' : '' }}{{ formatMoney(s.cash_variance || 0) }}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Pagination Footer (matching Staff.List.vue / Products.List.vue) -->
          <div
            v-if="!loading && total > perPage"
            class="card-body border-top py-3 d-flex flex-wrap align-items-center justify-content-between gap-2"
          >
            <span class="text-muted font-size-13">
              Showing {{ paginationStart }} to {{ paginationEnd }} of {{ total }} shifts
            </span>
            <div class="d-flex align-items-center gap-1">
              <button
                type="button"
                class="btn btn-sm btn-light waves-effect"
                :disabled="page <= 1"
                @click="goToPage(page - 1)"
              >
                Previous
              </button>
              <span class="px-2 font-size-13 text-muted">
                Page {{ page }} of {{ lastPage }}
              </span>
              <button
                type="button"
                class="btn btn-sm btn-light waves-effect"
                :disabled="page >= lastPage"
                @click="goToPage(page + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- SHIFT DETAILS OFFCANVAS (Modelled on ActivityEvent.aside.vue) -->
    <!-- ========================================================= -->
    <div
      v-if="activeShiftDetail"
      class="offcanvas-backdrop fade show"
      @click="activeShiftDetail = null"
    ></div>

    <div
      class="offcanvas offcanvas-end"
      :class="{ show: !!activeShiftDetail }"
      tabindex="-1"
      :style="{ visibility: activeShiftDetail ? 'visible' : 'hidden', width: '560px', maxWidth: '100vw' }"
    >
      <div v-if="activeShiftDetail" class="d-flex flex-column h-100">
        <!-- Offcanvas Header (matching ActivityEvent.aside.vue) -->
        <div class="offcanvas-header border-bottom align-items-start gap-3 p-3">
          <div class="avatar-sm flex-shrink-0">
            <span class="avatar-title rounded-circle fw-semibold font-size-14 bg-light text-primary">
              {{ initialsOf(activeShiftDetail.opened_by?.name) }}
            </span>
          </div>
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex align-items-center gap-2 mb-1">
              <h5 class="panel-title mb-0 font-monospace fw-bold">{{ activeShiftDetail.shift_number }}</h5>
              <span
                class="badge rounded-pill font-size-11 px-2"
                :class="activeShiftDetail.status === 'open' ? 'bg-success bg-soft text-success' : 'bg-secondary bg-soft text-secondary'"
              >
                {{ activeShiftDetail.status === 'open' ? 'Active' : 'Closed' }}
              </span>
            </div>
            <span class="d-block text-muted font-size-12">
              {{ activeShiftDetail.branch?.name || 'Main Branch' }} · Opened by <span class="text-dark fw-medium">{{ activeShiftDetail.opened_by?.name || '—' }}</span>
            </span>
            <span class="d-block text-muted font-size-12">
              {{ formatDateTime(activeShiftDetail.opened_at) }}
              <template v-if="activeShiftDetail.closed_at">
                · Closed {{ formatDateTime(activeShiftDetail.closed_at) }}
              </template>
            </span>
          </div>
          <button type="button" class="btn-close" aria-label="Close" @click="activeShiftDetail = null"></button>
        </div>

        <!-- Offcanvas Body: Flat sections with border-bottom, zero shadows -->
        <div class="offcanvas-body p-0 custom-scroll" style="overflow-y: auto;">
          <!-- Section 1: Cash Balancing -->
          <div class="p-3 bg-light border-bottom font-size-11 fw-bold text-uppercase text-muted letter-spacing-1">
            Cash Drawer Balancing
          </div>
          <div class="p-3 border-bottom">
            <div class="row g-3">
              <div class="col-6">
                <span class="text-muted font-size-11 d-block">Starting Float</span>
                <span class="fw-bold font-size-14 text-dark">{{ formatMoney(activeShiftDetail.opening_float) }}</span>
              </div>
              <div class="col-6">
                <span class="text-muted font-size-11 d-block">Expected in Drawer</span>
                <span class="fw-bold font-size-14 text-dark">
                  {{ activeShiftDetail.expected_cash !== null ? formatMoney(activeShiftDetail.expected_cash) : 'In progress' }}
                </span>
              </div>
              <div class="col-6">
                <span class="text-muted font-size-11 d-block">Actual Counted</span>
                <span class="fw-bold font-size-14 text-dark">
                  {{ activeShiftDetail.actual_cash !== null ? formatMoney(activeShiftDetail.actual_cash) : 'Pending close' }}
                </span>
              </div>
              <div class="col-6">
                <span class="text-muted font-size-11 d-block">Over / Short Variance</span>
                <span
                  class="fw-bold font-size-14"
                  :class="activeShiftDetail.cash_variance < 0 ? 'text-danger' : (activeShiftDetail.cash_variance > 0 ? 'text-success' : 'text-muted')"
                >
                  <template v-if="activeShiftDetail.status === 'closed'">
                    {{ activeShiftDetail.cash_variance > 0 ? '+' : '' }}{{ formatMoney(activeShiftDetail.cash_variance || 0) }}
                  </template>
                  <template v-else>
                    <span class="text-muted font-size-12">Unbalanced</span>
                  </template>
                </span>
              </div>
            </div>

            <!-- Remarks -->
            <div v-if="activeShiftDetail.opening_notes || activeShiftDetail.closing_notes" class="mt-3 pt-2 border-top font-size-12 text-muted">
              <div v-if="activeShiftDetail.opening_notes" class="mb-1">
                <strong class="text-dark">Opening Remark:</strong> {{ activeShiftDetail.opening_notes }}
              </div>
              <div v-if="activeShiftDetail.closing_notes">
                <strong class="text-dark">Closing Remark:</strong> {{ activeShiftDetail.closing_notes }}
              </div>
            </div>
          </div>

          <!-- Section 2: Sales Summary -->
          <div class="p-3 bg-light border-bottom font-size-11 fw-bold text-uppercase text-muted letter-spacing-1">
            Sales Channels Summary
          </div>
          <div class="p-3 border-bottom font-size-12">
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-muted">Total Sales Rung</span>
              <span class="fw-bold text-dark font-size-14">{{ formatMoney(activeShiftDetail.total_sales_amount) }}</span>
            </div>
            <div class="d-flex justify-content-between py-1.5 border-bottom">
              <span class="text-muted">Cash</span>
              <span class="fw-medium text-dark">{{ formatMoney(activeShiftDetail.total_cash_sales) }}</span>
            </div>
            <div class="d-flex justify-content-between py-1.5 border-bottom">
              <span class="text-muted">M-Pesa</span>
              <span class="fw-medium text-dark">{{ formatMoney(activeShiftDetail.total_mpesa_sales) }}</span>
            </div>
            <div class="d-flex justify-content-between py-1.5 border-bottom">
              <span class="text-muted">Bank / Card</span>
              <span class="fw-medium text-dark">{{ formatMoney(activeShiftDetail.total_bank_sales) }}</span>
            </div>
            <div class="d-flex justify-content-between py-1.5">
              <span class="text-muted">Credit / Tabs</span>
              <span class="fw-medium text-dark">{{ formatMoney(activeShiftDetail.total_credit_sales) }}</span>
            </div>
          </div>

          <!-- Section 3: Opening Denominations (if counted) -->
          <template v-if="activeShiftDetail.opening_denominations && Object.keys(activeShiftDetail.opening_denominations).length">
            <div class="p-3 bg-light border-bottom font-size-11 fw-bold text-uppercase text-muted letter-spacing-1">
              Opening Float Breakdown
            </div>
            <div class="p-3 border-bottom font-size-12">
              <div class="row g-2 text-center">
                <div
                  v-for="(count, note) in activeShiftDetail.opening_denominations"
                  :key="note"
                  class="col-4"
                >
                  <div class="p-2 border rounded bg-light">
                    <span class="text-muted font-size-11 d-block">{{ note === 'coins' ? 'Loose Coins' : 'KES ' + note }}</span>
                    <strong class="text-dark font-size-12">{{ note === 'coins' ? formatMoney(count) : count + ' pcs' }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Section 4: Team Members on Duty -->
          <div class="p-3 bg-light border-bottom font-size-11 fw-bold text-uppercase text-muted letter-spacing-1">
            Team Members on Duty ({{ (activeShiftDetail.all_members || activeShiftDetail.active_members || []).length }})
          </div>
          <div class="p-0">
            <div
              v-for="m in (activeShiftDetail.all_members || activeShiftDetail.active_members || [])"
              :key="m.id"
              class="p-3 border-bottom d-flex align-items-center justify-content-between font-size-12"
            >
              <div class="d-flex align-items-center gap-2">
                <div class="avatar-xs flex-shrink-0">
                  <span class="avatar-title rounded-circle fw-semibold font-size-11 bg-light text-muted">
                    {{ initialsOf(m.name) }}
                  </span>
                </div>
                <div>
                  <div class="fw-bold text-dark d-flex align-items-center gap-1.5">
                    {{ m.name }}
                    <span v-if="m.role === 'lead'" class="badge bg-warning bg-soft text-warning font-size-10 px-1 py-0">Lead</span>
                    <span v-if="m.status === 'active'" class="badge bg-success bg-soft text-success font-size-10 px-1 py-0">Active</span>
                  </div>
                  <small class="text-muted">Joined: {{ formatDateTime(m.joined_at) }}</small>
                </div>
              </div>

              <div class="text-end">
                <span class="text-muted font-size-11 d-block">Cash Collected</span>
                <span class="fw-bold text-dark">{{ formatMoney(m.cash_collected || 0) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Offcanvas Footer -->
        <div class="p-3 border-top d-flex justify-content-between align-items-center bg-light">
          <button type="button" class="btn btn-white waves-effect" @click="activeShiftDetail = null">
            Close
          </button>
          <button
            v-if="activeShiftDetail.status === 'open'"
            type="button"
            class="btn btn-primary waves-effect"
            @click="shiftStore.openModal"
          >
            Manage Active Shift
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { Icon } from "@iconify/vue";
import MetricCard from "@/components/Data-tools/Metric.Card.vue";
import shiftsApi from "@/api/shifts";
import { useShiftStore } from "@/stores/shift";
import DateRangePicker from "@/components/DatePickers/datePicker.facebookstyle.vue";
import SkeletonLoader from "@/components/Loaders/SkeletonLoader.vue";

const shiftStore = useShiftStore();

// State
const loading = ref(false);
const shifts = ref([]);
const total = ref(0);
const page = ref(1);
const perPage = ref(20);
const lastPage = ref(1);

const searchQuery = ref("");
let searchTimer = null;

const statusFilter = ref(""); // '' | 'open' | 'closed'
const branchFilter = ref(null);
const dateFrom = ref("");
const dateTo = ref("");

const activeShiftDetail = ref(null);

const branches = computed(() => shiftStore.branches || []);

const statusOptions = [
  { key: "", label: "All Shifts" },
  { key: "open", label: "Active Only" },
  { key: "closed", label: "Closed Only" },
];

const branchFilterLabel = computed(() => {
  if (!branchFilter.value) return "Branch";
  const b = branches.value.find((x) => x.id === branchFilter.value);
  return b ? b.name : "Branch";
});

function statusLabel(key) {
  return statusOptions.find((s) => s.key === key)?.label || "Status";
}

const hasFilters = computed(() => {
  return !!(searchQuery.value || statusFilter.value || branchFilter.value || dateFrom.value || dateTo.value);
});

// Active filter chips (matching Staff.List.vue)
const chips = computed(() => {
  const list = [];
  if (statusFilter.value) {
    list.push({
      key: "status",
      label: `Status: ${statusLabel(statusFilter.value)}`,
      clear: () => setStatus(""),
    });
  }
  if (branchFilter.value) {
    list.push({
      key: "branch",
      label: `Branch: ${branchFilterLabel.value}`,
      clear: () => setBranch(null),
    });
  }
  if (searchQuery.value) {
    list.push({
      key: "search",
      label: `Search: "${searchQuery.value}"`,
      clear: () => {
        searchQuery.value = "";
        reload();
      },
    });
  }
  if (dateFrom.value || dateTo.value) {
    list.push({
      key: "dates",
      label: `Dates: ${dateFrom.value || "Start"} to ${dateTo.value || "Now"}`,
      clear: () => {
        dateFrom.value = "";
        dateTo.value = "";
        reload();
      },
    });
  }
  return list;
});

const filteredShifts = computed(() => {
  if (!searchQuery.value) return shifts.value;
  const q = searchQuery.value.toLowerCase().trim();
  return shifts.value.filter((s) => {
    return (
      s.shift_number?.toLowerCase().includes(q) ||
      s.opened_by?.name?.toLowerCase().includes(q) ||
      s.branch?.name?.toLowerCase().includes(q)
    );
  });
});

const paginationStart = computed(() => {
  if (!total.value) return 0;
  return (page.value - 1) * perPage.value + 1;
});

const paginationEnd = computed(() => {
  const end = page.value * perPage.value;
  return Math.min(end, total.value);
});

// Important Period Statistics (used in MetricCard strip)
const totalPeriodSales = computed(() => {
  return shifts.value.reduce((acc, s) => acc + (Number(s.total_sales_amount) || 0), 0);
});

const totalPeriodVariance = computed(() => {
  return shifts.value.reduce((acc, s) => {
    if (s.status === 'closed' && s.cash_variance !== null && s.cash_variance !== undefined) {
      return acc + Number(s.cash_variance);
    }
    return acc;
  }, 0);
});

// Data fetching
async function getShifts() {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
    };
    if (statusFilter.value) params.status = statusFilter.value;
    if (branchFilter.value) params.branch_id = branchFilter.value;
    if (dateFrom.value) params.date_from = dateFrom.value;
    if (dateTo.value) params.date_to = dateTo.value;

    const res = await shiftsApi.list(params);
    if (res.data) {
      shifts.value = res.data.data || [];
      if (res.data.meta) {
        page.value = res.data.meta.current_page;
        lastPage.value = res.data.meta.last_page;
        perPage.value = res.data.meta.per_page;
        total.value = res.data.meta.total;
      } else {
        total.value = shifts.value.length;
      }
    }
  } catch (err) {
    console.error("Failed to fetch shifts:", err);
  } finally {
    loading.value = false;
  }
}

function reload() {
  page.value = 1;
  getShifts();
}

function onSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    reload();
  }, 300);
}

function setStatus(key) {
  statusFilter.value = key;
  reload();
}

function setBranch(id) {
  branchFilter.value = id;
  reload();
}

function clearAll() {
  searchQuery.value = "";
  statusFilter.value = "";
  branchFilter.value = null;
  dateFrom.value = "";
  dateTo.value = "";
  reload();
}

function goToPage(p) {
  if (p >= 1 && p <= lastPage.value) {
    page.value = p;
    getShifts();
  }
}

async function openDetails(shift) {
  try {
    const res = await shiftsApi.get(shift.id);
    if (res.data?.shift) {
      activeShiftDetail.value = res.data.shift;
    } else {
      activeShiftDetail.value = shift;
    }
  } catch {
    activeShiftDetail.value = shift;
  }
}

// Helpers
function formatMoney(amount) {
  const num = Number(amount) || 0;
  return "KES " + num.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function initialsOf(name) {
  if (!name) return "S";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatDateTime(isoStr) {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

function getShiftDuration(shift) {
  if (!shift.opened_at) return "—";
  const start = new Date(shift.opened_at).getTime();
  const end = shift.closed_at ? new Date(shift.closed_at).getTime() : Date.now();
  const diffMinutes = Math.max(0, Math.floor((end - start) / 60000));
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  if (shift.status === 'open') {
    return `Running (${hours}h ${mins}m)`;
  }
  return `${hours}h ${mins}m`;
}

function exportCsv() {
  if (!shifts.value.length) return;
  const headers = [
    "Shift Number",
    "Branch",
    "Status",
    "Opened By",
    "Opened At",
    "Closed At",
    "Opening Float (KES)",
    "Total Sales (KES)",
    "Cash Sales (KES)",
    "M-Pesa Sales (KES)",
    "Actual Cash (KES)",
    "Variance (KES)",
  ];
  const rows = shifts.value.map((s) => [
    `"${s.shift_number}"`,
    `"${s.branch?.name || 'Main'}"`,
    `"${s.status}"`,
    `"${s.opened_by?.name || ''}"`,
    `"${s.opened_at || ''}"`,
    `"${s.closed_at || ''}"`,
    s.opening_float || 0,
    s.total_sales_amount || 0,
    s.total_cash_sales || 0,
    s.total_mpesa_sales || 0,
    s.actual_cash !== null ? s.actual_cash : "",
    s.cash_variance !== null ? s.cash_variance : "",
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `shifts_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

onMounted(async () => {
  await shiftStore.fetchBranches();
  await shiftStore.checkCurrentShift();
  getShifts();
});

onBeforeUnmount(() => {
  clearTimeout(searchTimer);
});
</script>

<style scoped>
/* Strictly flat card with 1px border and ZERO drop shadows */
.flat-card {
  box-shadow: none !important;
  border: 1px solid #ced4da !important;
}

/* ==========================================================================
   Responsive 4-column Stats Grid spanning full width (ZERO drop shadows)
   ========================================================================== */
.shift-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;
}

@media (max-width: 991.98px) {
  .shift-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 575.98px) {
  .shift-stats-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

/* Ensure each metric tile fills its 1/4 column with balanced spacing & zero shadow */
:deep(.shift-stats-grid .metric-tile) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  flex: 1 1 auto !important;
  padding: 16px 18px !important;
  border: 1px solid #ced4da !important;
  border-radius: 8px !important;
  background: #ffffff !important;
  box-shadow: none !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  min-height: 114px !important;
  transition: border-color 0.2s ease, background-color 0.2s ease !important;
  cursor: default !important;
  text-align: left !important;
}

:deep(.shift-stats-grid .metric-tile:hover) {
  transform: none !important;
}

:deep(.shift-stats-grid .metric-tile.is-active) {
  border-color: #556ee6 !important;
  background-color: #f7f8ff !important;
  box-shadow: none !important;
}

/* Header: Label on the left, Icon on the right */
:deep(.shift-stats-grid .metric-tile-head) {
  display: flex !important;
  flex-direction: row-reverse !important;
  justify-content: space-between !important;
  align-items: center !important;
  width: 100% !important;
  gap: 8px !important;
  margin-bottom: 4px !important;
}

:deep(.shift-stats-grid .metric-tile-head > span:first-child) {
  width: auto !important;
}

:deep(.shift-stats-grid .metric-tile-head > .metric-tile-label) {
  flex-grow: 1 !important;
  width: auto !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  color: #74788d !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

:deep(.shift-stats-grid .metric-tile-icon) {
  width: 36px !important;
  height: 36px !important;
  font-size: 20px !important;
  border-radius: 6px !important;
  background-color: #f8f9fa !important;
  color: #495057 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
}

:deep(.shift-stats-grid .metric-tile.is-active .metric-tile-icon) {
  background-color: #eef1fd !important;
  color: #556ee6 !important;
}

/* Number: prominent typography */
:deep(.shift-stats-grid .metric-tile-value) {
  font-size: 22px !important;
  font-weight: 700 !important;
  color: #2a3042 !important;
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  letter-spacing: -0.02em !important;
  line-height: 1.2 !important;
}

/* Change / Subtitle: clean font, zero top margin */
:deep(.shift-stats-grid .metric-tile-change) {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  margin-top: 0 !important;
  padding-top: 0 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.shift-row:hover {
  background-color: #f8f9fa;
}

.shift-card-item:hover {
  background-color: #f8f9fa;
}

.cursor-pointer {
  cursor: pointer;
}

.spin-anim {
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

.letter-spacing-1 {
  letter-spacing: 0.5px;
}

.custom-scroll::-webkit-scrollbar {
  width: 5px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: #f8f9fa;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: #ced4da;
  border-radius: 4px;
}
</style>
