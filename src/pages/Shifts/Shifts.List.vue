<template>
  <div class="shifts-page">
    <!-- Page Title & Header Controls -->
    <div class="row">
      <div class="col-12">
        <div class="page-title-box d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div>
            <h4 class="mb-sm-0 font-size-18 pb-1">Register Shifts &amp; History</h4>
            <div class="page-title-right">
              <ol class="breadcrumb m-0 flex-nowrap">
                <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
                <li class="breadcrumb-item">Selling</li>
                <li class="breadcrumb-item active text-truncate">Shifts</li>
              </ol>
            </div>
          </div>

          <div class="d-flex flex-wrap gap-2 align-items-center">
            <!-- Launch / Current Shift Action Pill -->
            <button
              v-if="shiftStore.hasActiveShift"
              type="button"
              class="btn btn-outline-success d-flex align-items-center gap-2 fw-medium border"
              style="border-color: #34c38f !important;"
              @click="shiftStore.openModal"
            >
              <span class="spinner-grow spinner-grow-sm text-success" style="width: 8px; height: 8px;" role="status"></span>
              <span>Active Shift: {{ shiftStore.activeShiftNumber }}</span>
            </button>
            <button
              v-else
              type="button"
              class="btn btn-primary d-flex align-items-center gap-2 fw-medium"
              @click="shiftStore.openModal"
            >
              <Icon icon="ri:cash-line" class="fs-5" />
              <span>Open Shift</span>
            </button>

            <!-- Export to CSV -->
            <button
              type="button"
              class="btn btn-white d-flex align-items-center gap-2 border text-secondary"
              style="border-color: #e2e8f0 !important;"
              @click="exportCsv"
              :disabled="loading || !shifts.length"
              title="Export shift history to CSV"
            >
              <Icon icon="ri:download-line" class="fs-5" />
              <span class="d-none d-sm-inline">Export</span>
            </button>

            <!-- Refresh Button -->
            <button
              type="button"
              class="btn btn-white d-flex align-items-center justify-content-center p-0 rounded-circle border text-secondary"
              style="width: 36px; height: 36px; border-color: #e2e8f0 !important;"
              @click="loadShifts"
              :disabled="loading"
              title="Refresh shifts"
            >
              <Icon icon="ri:refresh-line" :class="{ 'spin-animation': loading }" class="fs-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Metrics Overview Cards -->
    <div class="row g-3 mb-4">
      <!-- Card 1: Shift Status -->
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card h-100 mb-0 border" style="border-color: #eef0f4 !important; border-radius: 10px;">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-uppercase letter-spacing-1 fs-11 text-muted fw-bold">Live Status</span>
              <span
                class="badge rounded-pill px-2 py-1 fs-10"
                :class="shiftStore.hasActiveShift ? 'bg-success-subtle text-success' : 'bg-light text-secondary border'"
              >
                {{ shiftStore.hasActiveShift ? 'Open Running' : 'Closed' }}
              </span>
            </div>
            <div class="fw-bold fs-5 text-dark font-monospace mb-1">
              {{ shiftStore.hasActiveShift ? shiftStore.activeShiftNumber : 'No Active Shift' }}
            </div>
            <div class="text-muted fs-11 d-flex align-items-center gap-1">
              <Icon :icon="shiftStore.hasActiveShift ? 'ri:user-star-line' : 'ri:lock-line'" class="text-secondary" />
              <span v-if="shiftStore.hasActiveShift">
                Lead: {{ shiftStore.activeShift?.opened_by?.name || 'On Duty' }} ({{ shiftStore.activeMembersCount }} staff)
              </span>
              <span v-else>Register drawer is locked</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 2: Shifts Recorded -->
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card h-100 mb-0 border" style="border-color: #eef0f4 !important; border-radius: 10px;">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-uppercase letter-spacing-1 fs-11 text-muted fw-bold">Total Shifts</span>
              <div class="avatar-xs rounded-circle bg-primary-subtle d-flex align-items-center justify-content-center text-primary" style="width: 28px; height: 28px;">
                <Icon icon="ri:time-line" class="fs-5" />
              </div>
            </div>
            <div class="fw-bold fs-4 text-dark mb-1">
              {{ pagination.total || 0 }}
            </div>
            <div class="text-muted fs-11">
              {{ selectedStatus ? (selectedStatus === 'open' ? 'Active shifts' : 'Closed shifts') : 'Total sessions' }} in period
            </div>
          </div>
        </div>
      </div>

      <!-- Card 3: Total Sales Recorded -->
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card h-100 mb-0 border" style="border-color: #eef0f4 !important; border-radius: 10px;">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-uppercase letter-spacing-1 fs-11 text-muted fw-bold">Period Sales</span>
              <div class="avatar-xs rounded-circle bg-success-subtle d-flex align-items-center justify-content-center text-success" style="width: 28px; height: 28px;">
                <Icon icon="ri:shopping-bag-3-line" class="fs-5" />
              </div>
            </div>
            <div class="fw-bold fs-4 text-dark mb-1">
              {{ formatMoney(totalPeriodSales) }}
            </div>
            <div class="text-muted fs-11">
              Across {{ shifts.length }} displayed shifts
            </div>
          </div>
        </div>
      </div>

      <!-- Card 4: Drawer Variance -->
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card h-100 mb-0 border" style="border-color: #eef0f4 !important; border-radius: 10px;">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-uppercase letter-spacing-1 fs-11 text-muted fw-bold">Cash Variance</span>
              <div
                class="avatar-xs rounded-circle d-flex align-items-center justify-content-center"
                :class="totalPeriodVariance < 0 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'"
                style="width: 28px; height: 28px;"
              >
                <Icon :icon="totalPeriodVariance < 0 ? 'ri:arrow-down-line' : 'ri:scales-3-line'" class="fs-5" />
              </div>
            </div>
            <div
              class="fw-bold fs-4 mb-1"
              :class="totalPeriodVariance < 0 ? 'text-danger' : (totalPeriodVariance > 0 ? 'text-success' : 'text-dark')"
            >
              {{ totalPeriodVariance > 0 ? '+' : '' }}{{ formatMoney(totalPeriodVariance) }}
            </div>
            <div class="text-muted fs-11">
              {{ totalPeriodVariance === 0 ? 'Drawers perfectly balanced' : (totalPeriodVariance < 0 ? 'Net drawer shortage' : 'Net drawer surplus') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters & Toolbar -->
    <div class="card mb-4 border" style="border-color: #eef0f4 !important; border-radius: 10px;">
      <div class="card-body p-3">
        <div class="d-flex flex-wrap gap-2 gap-md-3 align-items-center justify-content-between">
          <!-- Left: Status Tabs -->
          <div class="d-flex flex-wrap gap-1 bg-light p-1 rounded-3 border" style="border-color: #e2e8f0 !important;">
            <button
              type="button"
              class="btn btn-sm px-3 rounded-2 fw-medium transition-all"
              :class="selectedStatus === null ? 'btn-white bg-white text-dark shadow-none' : 'text-muted border-0 bg-transparent'"
              @click="setStatusFilter(null)"
            >
              All Shifts
            </button>
            <button
              type="button"
              class="btn btn-sm px-3 rounded-2 fw-medium transition-all"
              :class="selectedStatus === 'open' ? 'btn-white bg-white text-success shadow-none' : 'text-muted border-0 bg-transparent'"
              @click="setStatusFilter('open')"
            >
              Active Now
            </button>
            <button
              type="button"
              class="btn btn-sm px-3 rounded-2 fw-medium transition-all"
              :class="selectedStatus === 'closed' ? 'btn-white bg-white text-dark shadow-none' : 'text-muted border-0 bg-transparent'"
              @click="setStatusFilter('closed')"
            >
              Closed
            </button>
          </div>

          <!-- Right: Search, Branch Selector & Date Picker -->
          <div class="d-flex flex-wrap gap-2 align-items-center flex-grow-1 justify-content-sm-end">
            <!-- Search Input -->
            <div class="position-relative" style="min-width: 200px; max-width: 280px;">
              <input
                type="text"
                class="form-control form-control-sm ps-4 bg-light border"
                style="border-color: #e2e8f0 !important;"
                placeholder="Search shift #, staff..."
                v-model="searchQuery"
              />
              <Icon icon="ri:search-line" class="position-absolute text-muted fs-13" style="left: 10px; top: 8px;" />
              <button
                v-if="searchQuery"
                type="button"
                class="btn btn-link btn-sm p-0 position-absolute text-secondary"
                style="right: 8px; top: 4px;"
                @click="searchQuery = ''"
              >
                &times;
              </button>
            </div>

            <!-- Branch Selector (if multi-branch) -->
            <div v-if="shiftStore.branches.length > 1" class="dropdown">
              <button
                type="button"
                class="btn btn-sm btn-white border d-flex align-items-center gap-1.5"
                style="border-color: #e2e8f0 !important;"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <Icon icon="ri:store-2-line" class="text-primary fs-13" />
                <span class="fs-12 fw-medium">{{ activeBranchName }}</span>
                <Icon icon="ri:arrow-down-s-line" class="text-muted fs-13" />
              </button>
              <div class="dropdown-menu dropdown-menu-end p-1 border" style="border-color: #e2e8f0 !important;">
                <button
                  type="button"
                  class="dropdown-item fs-12 py-1.5 rounded-1"
                  :class="{ active: selectedBranchId === null }"
                  @click="setBranchFilter(null)"
                >
                  All Branches
                </button>
                <button
                  v-for="b in shiftStore.branches"
                  :key="b.id"
                  type="button"
                  class="dropdown-item fs-12 py-1.5 rounded-1"
                  :class="{ active: selectedBranchId === b.id }"
                  @click="setBranchFilter(b.id)"
                >
                  {{ b.name }} <span v-if="b.is_main" class="text-muted">(Main)</span>
                </button>
              </div>
            </div>

            <!-- Date Range Picker Component -->
            <div class="d-flex align-items-center">
              <DateRangePicker v-model:dateFrom="dateFrom" v-model:dateTo="dateTo" @change="loadShifts" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Shifts Data Container -->
    <div class="card border" style="border-color: #eef0f4 !important; border-radius: 10px;">
      <!-- Loading Skeleton -->
      <div v-if="loading" class="p-5 text-center">
        <div class="spinner-border text-primary mb-3" role="status"></div>
        <p class="text-muted fs-12 mb-0">Loading shifts history...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!filteredShifts.length" class="p-5 text-center">
        <div
          class="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
          style="width: 56px; height: 56px; background: rgba(85, 110, 230, 0.08); color: #556ee6;"
        >
          <Icon icon="ri:time-line" class="fs-2" />
        </div>
        <h5 class="fw-bold text-dark fs-15 mb-1">No shifts found</h5>
        <p class="text-muted fs-12 mb-3" style="max-width: 380px; margin: 0 auto;">
          {{ searchQuery || selectedStatus || selectedBranchId || dateFrom ? 'No shifts match your selected filter criteria. Try adjusting your dates or keywords.' : 'No cash register shifts have been opened yet. Kick off your first shift to begin ringing sales.' }}
        </p>
        <button
          v-if="!shiftStore.hasActiveShift"
          type="button"
          class="btn btn-primary btn-sm px-3 fw-medium"
          @click="shiftStore.openModal"
        >
          Open First Shift
        </button>
      </div>

      <!-- Data Table (Desktop View) -->
      <div v-else class="d-none d-lg-block">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light fs-11 text-uppercase text-muted border-bottom">
              <tr>
                <th class="ps-3 py-2.5">Shift Number</th>
                <th class="py-2.5">Branch</th>
                <th class="py-2.5">Shift Lead</th>
                <th class="py-2.5">Staff On Duty</th>
                <th class="py-2.5">Opened / Duration</th>
                <th class="py-2.5 text-end">Float</th>
                <th class="py-2.5 text-end">Sales Recorded</th>
                <th class="py-2.5 text-end">Variance</th>
                <th class="pe-3 py-2.5 text-end">Action</th>
              </tr>
            </thead>
            <tbody class="fs-12">
              <tr
                v-for="shift in filteredShifts"
                :key="shift.id"
                class="cursor-pointer"
                @click="openShiftDetail(shift)"
              >
                <!-- Shift # & Status Badge -->
                <td class="ps-3 py-3">
                  <div class="d-flex align-items-center gap-2">
                    <span
                      class="badge rounded-pill px-2 py-0.5 fs-10"
                      :class="shift.status === 'open' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-light text-secondary border'"
                    >
                      <span v-if="shift.status === 'open'" class="spinner-grow spinner-grow-sm me-0.5" style="width: 6px; height: 6px;" role="status"></span>
                      {{ shift.status === 'open' ? 'Active' : 'Closed' }}
                    </span>
                    <span class="fw-bold font-monospace text-dark">{{ shift.shift_number }}</span>
                  </div>
                </td>

                <!-- Branch -->
                <td class="py-3 text-secondary">
                  {{ shift.branch?.name || 'Main Branch' }}
                </td>

                <!-- Shift Lead -->
                <td class="py-3">
                  <div class="d-flex align-items-center gap-2">
                    <span
                      class="avatar-title rounded-circle bg-primary-subtle text-primary fw-bold fs-11"
                      style="width: 26px; height: 26px;"
                    >
                      {{ getInitials(shift.opened_by?.name) }}
                    </span>
                    <span class="text-dark fw-medium">{{ shift.opened_by?.name || 'Unknown' }}</span>
                  </div>
                </td>

                <!-- Staff on Duty -->
                <td class="py-3">
                  <span class="badge bg-light text-secondary border px-2 py-1 rounded-pill fs-11">
                    {{ shift.active_members_count || shift.active_members?.length || 1 }} on duty
                  </span>
                </td>

                <!-- Opened & Duration -->
                <td class="py-3">
                  <div class="text-dark fw-medium">{{ formatDateTime(shift.opened_at) }}</div>
                  <div class="text-muted fs-11">
                    {{ getShiftDuration(shift) }}
                  </div>
                </td>

                <!-- Opening Float -->
                <td class="py-3 text-end fw-medium text-dark">
                  {{ formatMoney(shift.opening_float) }}
                </td>

                <!-- Sales Recorded -->
                <td class="py-3 text-end">
                  <div class="fw-bold text-dark">{{ formatMoney(shift.total_sales_amount) }}</div>
                  <div class="text-muted fs-11" v-if="shift.total_cash_sales > 0 || shift.total_mpesa_sales > 0">
                    Cash: {{ formatMoney(shift.total_cash_sales) }} · M-Pesa: {{ formatMoney(shift.total_mpesa_sales) }}
                  </div>
                </td>

                <!-- Variance -->
                <td class="py-3 text-end">
                  <template v-if="shift.status === 'closed'">
                    <span
                      class="fw-bold"
                      :class="shift.cash_variance < 0 ? 'text-danger' : (shift.cash_variance > 0 ? 'text-success' : 'text-muted')"
                    >
                      {{ shift.cash_variance > 0 ? '+' : '' }}{{ formatMoney(shift.cash_variance || 0) }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="text-muted fs-11 italic">In progress</span>
                  </template>
                </td>

                <!-- Action Button -->
                <td class="pe-3 py-3 text-end" @click.stop>
                  <button
                    type="button"
                    class="btn btn-sm btn-white border px-2.5 py-1 text-secondary"
                    style="border-color: #e2e8f0 !important;"
                    @click="openShiftDetail(shift)"
                    title="View full shift audit"
                  >
                    <Icon icon="ri:eye-line" class="fs-13 me-1" />
                    Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile / Tablet Cards View -->
      <div v-if="!loading && filteredShifts.length" class="d-lg-none p-3">
        <div class="d-flex flex-column gap-3">
          <div
            v-for="shift in filteredShifts"
            :key="shift.id"
            class="card mb-0 p-3 rounded-3 border bg-white"
            style="border-color: #e2e8f0 !important;"
            @click="openShiftDetail(shift)"
          >
            <!-- Card Header -->
            <div class="d-flex align-items-center justify-content-between mb-2">
              <div class="d-flex align-items-center gap-1.5">
                <span
                  class="badge rounded-pill px-2 py-0.5 fs-10"
                  :class="shift.status === 'open' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-light text-secondary border'"
                >
                  {{ shift.status === 'open' ? 'Active' : 'Closed' }}
                </span>
                <span class="fw-bold font-monospace text-dark fs-13">{{ shift.shift_number }}</span>
              </div>
              <span class="badge bg-light text-secondary border fs-10">
                {{ shift.branch?.name || 'Main Branch' }}
              </span>
            </div>

            <!-- Lead & Time -->
            <div class="d-flex justify-content-between align-items-center py-2 border-top border-bottom my-1.5" style="border-color: #f1f3f7 !important;">
              <div class="d-flex align-items-center gap-2">
                <span class="avatar-title rounded-circle bg-primary-subtle text-primary fw-bold fs-10" style="width: 24px; height: 24px;">
                  {{ getInitials(shift.opened_by?.name) }}
                </span>
                <span class="fs-12 text-dark fw-medium">{{ shift.opened_by?.name }}</span>
              </div>
              <div class="text-muted fs-11 text-end">
                {{ formatDateTime(shift.opened_at) }}
              </div>
            </div>

            <!-- Financials Grid -->
            <div class="row g-2 pt-1 text-center">
              <div class="col-4">
                <div class="fs-10 text-muted text-uppercase">Float</div>
                <div class="fw-bold text-dark fs-12 mt-0.5">{{ formatMoney(shift.opening_float) }}</div>
              </div>
              <div class="col-4">
                <div class="fs-10 text-muted text-uppercase">Sales</div>
                <div class="fw-bold text-dark fs-12 mt-0.5">{{ formatMoney(shift.total_sales_amount) }}</div>
              </div>
              <div class="col-4">
                <div class="fs-10 text-muted text-uppercase">Variance</div>
                <div
                  class="fw-bold fs-12 mt-0.5"
                  :class="shift.cash_variance < 0 ? 'text-danger' : (shift.cash_variance > 0 ? 'text-success' : 'text-muted')"
                >
                  {{ shift.status === 'closed' ? ((shift.cash_variance > 0 ? '+' : '') + formatMoney(shift.cash_variance || 0)) : 'Running' }}
                </div>
              </div>
            </div>

            <!-- Footer Details Button -->
            <div class="pt-2 mt-2 border-top d-flex justify-content-between align-items-center" style="border-color: #f1f3f7 !important;">
              <span class="fs-11 text-muted">
                {{ shift.active_members_count || 1 }} on duty
              </span>
              <button
                type="button"
                class="btn btn-sm btn-light border px-2.5 py-0.5 fs-11"
                style="border-color: #e2e8f0 !important;"
              >
                View Details &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination Footer -->
      <div
        v-if="!loading && pagination.total > pagination.per_page"
        class="card-footer bg-white border-top p-3 d-flex flex-wrap align-items-center justify-content-between gap-2"
        style="border-color: #eef0f4 !important;"
      >
        <span class="text-muted fs-12">
          Showing {{ paginationStart }} to {{ paginationEnd }} of {{ pagination.total }} shifts
        </span>
        <div class="d-flex align-items-center gap-1">
          <button
            type="button"
            class="btn btn-sm btn-white border px-2"
            style="border-color: #e2e8f0 !important;"
            :disabled="pagination.current_page <= 1"
            @click="changePage(pagination.current_page - 1)"
          >
            Prev
          </button>
          <span class="px-2 fs-12 text-muted">
            Page {{ pagination.current_page }} of {{ pagination.last_page }}
          </span>
          <button
            type="button"
            class="btn btn-sm btn-white border px-2"
            style="border-color: #e2e8f0 !important;"
            :disabled="pagination.current_page >= pagination.last_page"
            @click="changePage(pagination.current_page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- SHIFT DETAILS SLIDE-OVER DRAWER (OFFCANVAS)                -->
    <!-- ========================================================= -->
    <div
      v-if="selectedShift"
      class="offcanvas-backdrop fade show"
      @click="selectedShift = null"
    ></div>

    <div
      class="offcanvas offcanvas-end custom-drawer"
      :class="{ show: !!selectedShift }"
      tabindex="-1"
      :style="{ visibility: selectedShift ? 'visible' : 'hidden' }"
    >
      <div v-if="selectedShift" class="d-flex flex-column h-100">
        <!-- Drawer Header -->
        <div class="offcanvas-header p-3 px-4 border-bottom bg-light bg-opacity-50" style="border-color: #eef0f4 !important;">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span
                class="badge rounded-pill px-2 py-0.5 fs-10"
                :class="selectedShift.status === 'open' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-light text-secondary border'"
              >
                {{ selectedShift.status === 'open' ? 'Active' : 'Closed' }}
              </span>
              <h5 class="offcanvas-title fw-bold text-dark font-monospace fs-15 mb-0">
                {{ selectedShift.shift_number }}
              </h5>
            </div>
            <div class="text-muted fs-11">
              {{ selectedShift.branch?.name || 'Main Branch' }} · Opened {{ formatDateTime(selectedShift.opened_at) }}
            </div>
          </div>
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="selectedShift = null"
          ></button>
        </div>

        <!-- Drawer Body -->
        <div class="offcanvas-body p-4 custom-scroll" style="overflow-y: auto;">
          <!-- Cash Drawer Reconciliation Summary Card -->
          <div class="p-3 rounded-3 bg-light border mb-4" style="border-color: #e2e8f0 !important;">
            <div class="text-uppercase letter-spacing-1 fs-11 text-muted fw-bold mb-3 pb-2 border-bottom" style="border-color: #e2e8f0 !important;">
              Cash Drawer Balancing
            </div>

            <div class="row g-2 mb-2">
              <div class="col-6">
                <div class="fs-11 text-muted">Opening Float</div>
                <div class="fw-bold fs-14 text-dark mt-0.5">{{ formatMoney(selectedShift.opening_float) }}</div>
              </div>
              <div class="col-6">
                <div class="fs-11 text-muted">Expected in Drawer</div>
                <div class="fw-bold fs-14 text-dark mt-0.5">
                  {{ selectedShift.expected_cash !== null ? formatMoney(selectedShift.expected_cash) : 'In progress' }}
                </div>
              </div>
              <div class="col-6 mt-2">
                <div class="fs-11 text-muted">Actual Cash Counted</div>
                <div class="fw-bold fs-14 text-dark mt-0.5">
                  {{ selectedShift.actual_cash !== null ? formatMoney(selectedShift.actual_cash) : 'Pending close' }}
                </div>
              </div>
              <div class="col-6 mt-2">
                <div class="fs-11 text-muted">Variance (Over / Short)</div>
                <div
                  class="fw-bold fs-14 mt-0.5"
                  :class="selectedShift.cash_variance < 0 ? 'text-danger' : (selectedShift.cash_variance > 0 ? 'text-success' : 'text-dark')"
                >
                  <template v-if="selectedShift.status === 'closed'">
                    {{ selectedShift.cash_variance > 0 ? '+' : '' }}{{ formatMoney(selectedShift.cash_variance || 0) }}
                  </template>
                  <template v-else>
                    <span class="text-muted fs-12">Unbalanced</span>
                  </template>
                </div>
              </div>
            </div>

            <!-- Notes if present -->
            <div v-if="selectedShift.opening_notes || selectedShift.closing_notes" class="mt-3 pt-2 border-top fs-11" style="border-color: #e2e8f0 !important;">
              <div v-if="selectedShift.opening_notes" class="mb-1 text-muted">
                <strong class="text-dark">Opening Remark:</strong> {{ selectedShift.opening_notes }}
              </div>
              <div v-if="selectedShift.closing_notes" class="text-muted">
                <strong class="text-dark">Closing Remark:</strong> {{ selectedShift.closing_notes }}
              </div>
            </div>
          </div>

          <!-- Sales By Payment Method Card -->
          <div class="card p-3 rounded-3 border mb-4" style="border-color: #eef0f4 !important;">
            <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style="border-color: #eef0f4 !important;">
              <span class="text-uppercase letter-spacing-1 fs-11 text-muted fw-bold">Sales Channels</span>
              <span class="fw-bold text-dark fs-14">{{ formatMoney(selectedShift.total_sales_amount) }}</span>
            </div>

            <div class="d-flex flex-column gap-2 fs-12">
              <div class="d-flex justify-content-between align-items-center py-1">
                <div class="d-flex align-items-center gap-2">
                  <Icon icon="ri:money-cny-box-line" class="text-success fs-14" />
                  <span class="text-secondary">Cash Sales</span>
                </div>
                <span class="fw-semibold text-dark">{{ formatMoney(selectedShift.total_cash_sales) }}</span>
              </div>

              <div class="d-flex justify-content-between align-items-center py-1">
                <div class="d-flex align-items-center gap-2">
                  <Icon icon="ri:smartphone-line" class="text-success fs-14" />
                  <span class="text-secondary">M-Pesa Sales</span>
                </div>
                <span class="fw-semibold text-dark">{{ formatMoney(selectedShift.total_mpesa_sales) }}</span>
              </div>

              <div class="d-flex justify-content-between align-items-center py-1">
                <div class="d-flex align-items-center gap-2">
                  <Icon icon="ri:bank-card-line" class="text-primary fs-14" />
                  <span class="text-secondary">Card / Bank Sales</span>
                </div>
                <span class="fw-semibold text-dark">{{ formatMoney(selectedShift.total_bank_sales) }}</span>
              </div>

              <div class="d-flex justify-content-between align-items-center py-1">
                <div class="d-flex align-items-center gap-2">
                  <Icon icon="ri:file-text-line" class="text-warning fs-14" />
                  <span class="text-secondary">Credit / Tabs</span>
                </div>
                <span class="fw-semibold text-dark">{{ formatMoney(selectedShift.total_credit_sales) }}</span>
              </div>
            </div>
          </div>

          <!-- Opening Denominations Breakdown (if logged) -->
          <div v-if="selectedShift.opening_denominations && Object.keys(selectedShift.opening_denominations).length" class="card p-3 rounded-3 border mb-4" style="border-color: #eef0f4 !important;">
            <div class="text-uppercase letter-spacing-1 fs-11 text-muted fw-bold mb-2 pb-2 border-bottom" style="border-color: #eef0f4 !important;">
              Opening Float Count Breakdown
            </div>
            <div class="row g-2 text-center fs-11">
              <div
                v-for="(count, note) in selectedShift.opening_denominations"
                :key="note"
                class="col-4"
              >
                <div class="p-2 rounded-2 bg-light border" style="border-color: #e2e8f0 !important;">
                  <span class="text-muted d-block">{{ note === 'coins' ? 'Loose Coins' : 'KES ' + note }}</span>
                  <span class="fw-bold text-dark fs-12 mt-0.5 d-block">
                    {{ note === 'coins' ? formatMoney(count) : count + ' pcs' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Staff On Duty Section -->
          <div class="card p-3 rounded-3 border mb-3" style="border-color: #eef0f4 !important;">
            <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style="border-color: #eef0f4 !important;">
              <span class="text-uppercase letter-spacing-1 fs-11 text-muted fw-bold">Team Members on Duty</span>
              <span class="badge bg-light text-secondary border fs-11">
                {{ (selectedShift.all_members || selectedShift.active_members || []).length }} staff
              </span>
            </div>

            <div class="d-flex flex-column gap-2.5">
              <div
                v-for="member in (selectedShift.all_members || selectedShift.active_members || [])"
                :key="member.id"
                class="p-2.5 rounded-3 border bg-light d-flex align-items-center justify-content-between"
                style="border-color: #e2e8f0 !important;"
              >
                <div class="d-flex align-items-center gap-2.5">
                  <span class="avatar-title rounded-circle bg-white text-primary border fw-bold fs-11" style="width: 32px; height: 32px;">
                    {{ getInitials(member.name) }}
                  </span>
                  <div>
                    <div class="fw-bold text-dark fs-12 d-flex align-items-center gap-1.5">
                      {{ member.name }}
                      <span v-if="member.role === 'lead'" class="badge bg-warning-subtle text-warning fs-10 px-1 py-0">Lead</span>
                      <span v-if="member.status === 'active'" class="badge bg-success-subtle text-success fs-10 px-1 py-0">Active</span>
                    </div>
                    <div class="text-muted fs-11">
                      Joined: {{ formatDateTime(member.joined_at) }}
                    </div>
                  </div>
                </div>

                <div class="text-end">
                  <div class="fs-10 text-muted">Cash Collected</div>
                  <div class="fw-bold text-dark fs-12">{{ formatMoney(member.cash_collected || 0) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Drawer Footer -->
        <div class="offcanvas-footer p-3 px-4 border-top bg-light bg-opacity-25 d-flex justify-content-between" style="border-color: #eef0f4 !important;">
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm px-3"
            @click="selectedShift = null"
          >
            Close
          </button>
          <button
            v-if="selectedShift.status === 'open'"
            type="button"
            class="btn btn-primary btn-sm px-3"
            @click="shiftStore.openModal"
          >
            Manage Live Shift
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { Icon } from "@iconify/vue";
import shiftsApi from "@/api/shifts";
import { useShiftStore } from "@/stores/shift";
import DateRangePicker from "@/components/DatePickers/datePicker.facebookstyle.vue";

const shiftStore = useShiftStore();

// State
const loading = ref(false);
const shifts = ref([]);
const selectedShift = ref(null);
const searchQuery = ref("");
const selectedStatus = ref(null); // null | 'open' | 'closed'
const selectedBranchId = ref(null);
const dateFrom = ref("");
const dateTo = ref("");

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
});

// Computed Filters
const activeBranchName = computed(() => {
  if (!selectedBranchId.value) return "All Branches";
  const branch = shiftStore.branches.find((b) => b.id === selectedBranchId.value);
  return branch ? branch.name : "Branch";
});

const filteredShifts = computed(() => {
  if (!searchQuery.value) return shifts.value;
  const q = searchQuery.value.toLowerCase().trim();
  return shifts.value.filter((s) => {
    return (
      s.shift_number?.toLowerCase().includes(q) ||
      s.opened_by?.name?.toLowerCase().includes(q) ||
      s.branch?.name?.toLowerCase().includes(q) ||
      s.opening_notes?.toLowerCase().includes(q)
    );
  });
});

const totalPeriodSales = computed(() => {
  return shifts.value.reduce((acc, s) => acc + (Number(s.total_sales_amount) || 0), 0);
});

const totalPeriodVariance = computed(() => {
  return shifts.value.reduce((acc, s) => {
    if (s.status === 'closed' && s.cash_variance !== null) {
      return acc + Number(s.cash_variance);
    }
    return acc;
  }, 0);
});

const paginationStart = computed(() => {
  if (!pagination.value.total) return 0;
  return (pagination.value.current_page - 1) * pagination.value.per_page + 1;
});

const paginationEnd = computed(() => {
  const end = pagination.value.current_page * pagination.value.per_page;
  return Math.min(end, pagination.value.total);
});

// Actions
async function loadShifts(page = 1) {
  loading.value = true;
  try {
    const params = {
      page,
      per_page: pagination.value.per_page,
    };

    if (selectedStatus.value) params.status = selectedStatus.value;
    if (selectedBranchId.value) params.branch_id = selectedBranchId.value;
    if (dateFrom.value) params.date_from = dateFrom.value;
    if (dateTo.value) params.date_to = dateTo.value;

    const res = await shiftsApi.list(params);
    if (res.data) {
      shifts.value = res.data.data || [];
      if (res.data.meta) {
        pagination.value = {
          current_page: res.data.meta.current_page,
          last_page: res.data.meta.last_page,
          per_page: res.data.meta.per_page,
          total: res.data.meta.total,
        };
      }
    }
  } catch (err) {
    console.error("Failed to load shifts:", err);
  } finally {
    loading.value = false;
  }
}

function setStatusFilter(status) {
  selectedStatus.value = status;
  loadShifts(1);
}

function setBranchFilter(branchId) {
  selectedBranchId.value = branchId;
  loadShifts(1);
}

function changePage(page) {
  if (page >= 1 && page <= pagination.value.last_page) {
    loadShifts(page);
  }
}

async function openShiftDetail(shift) {
  try {
    const res = await shiftsApi.get(shift.id);
    if (res.data?.shift) {
      selectedShift.value = res.data.shift;
    } else {
      selectedShift.value = shift;
    }
  } catch {
    selectedShift.value = shift;
  }
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

// Helpers
function formatMoney(amount) {
  const num = Number(amount) || 0;
  return "KES " + num.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function getInitials(name) {
  if (!name) return "S";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatDateTime(isoStr) {
  if (!isoStr) return "-";
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
  if (!shift.opened_at) return "-";
  const start = new Date(shift.opened_at).getTime();
  const end = shift.closed_at ? new Date(shift.closed_at).getTime() : Date.now();
  const diffMinutes = Math.max(0, Math.floor((end - start) / 60000));

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;

  if (shift.status === 'open') {
    return `Running (${hours}h ${mins}m)`;
  }
  return `Ended (${hours}h ${mins}m)`;
}

// Watchers & Lifecycle
watch(
  () => shiftStore.selectedBranchId,
  (newBranchId) => {
    if (newBranchId && !selectedBranchId.value) {
      selectedBranchId.value = newBranchId;
    }
  }
);

onMounted(async () => {
  await shiftStore.fetchBranches();
  if (shiftStore.selectedBranchId) {
    selectedBranchId.value = shiftStore.selectedBranchId;
  }
  await shiftStore.checkCurrentShift();
  await loadShifts(1);
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.letter-spacing-1 {
  letter-spacing: 0.5px;
}
.spin-animation {
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

/* Offcanvas custom drawer */
.custom-drawer {
  width: 100%;
  max-width: 460px;
  border-left: 1px solid #eef0f4;
  box-shadow: none !important;
}

.custom-scroll::-webkit-scrollbar {
  width: 5px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 4px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.fs-10 {
  font-size: 10px;
}
.fs-11 {
  font-size: 11px;
}
.fs-12 {
  font-size: 12px;
}
.fs-13 {
  font-size: 13px;
}
.fs-14 {
  font-size: 14px;
}
.fs-15 {
  font-size: 15px;
}
</style>
