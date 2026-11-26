<template>
    <div class="tabs-page">
        <!-- Page title (matching Shifts.List.vue, Team.List.vue & Overview.Dashboard.vue) -->
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

                    <div class="d-flex align-items-center gap-2 flex-shrink-0 flex-wrap">
                        <!-- Role-based Aging Settings button (Owners & Managers only) -->
                        <button
                            v-if="canManageAgingSettings"
                            type="button"
                            class="btn btn-white d-flex align-items-center justify-content-center gap-2 flex-nowrap"
                            title="Configure tab aging definitions"
                            @click="showAgingSettingsModal = true"
                        >
                            <Icon icon="ri:settings-3-line" class="fs-5 d-flex" />
                            <span class="d-none d-sm-inline">Aging Settings</span>
                        </button>

                        <router-link
                            to="/sell/tables"
                            class="btn btn-white d-flex align-items-center justify-content-center gap-2 flex-nowrap"
                        >
                            <i class="bx bx-restaurant fs-5"></i>
                            <span class="d-none d-md-inline">Floor &amp; Tables</span>
                        </router-link>

                        <router-link
                            to="/sell"
                            class="btn btn-primary text-white d-flex align-items-center justify-content-center gap-2 flex-nowrap"
                        >
                            <i class="bx bx-cart fs-5"></i>
                            <span class="d-none d-sm-inline">Open Counter POS</span>
                        </router-link>
                    </div>
                </div>
            </div>
        </div>

        <div class="d-flex flex-column gap-3">
            <!-- Overview-style page tabs navigation -->
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

            <!-- KPI stat cards (matching Shifts.List.vue with SkeletonLoader) -->
            <div class="row g-3">
                <div v-for="k in kpiCards" :key="k.key" class="col-sm-6 col-xl-3">
                    <div class="card mini-stats-wid flat-card mb-0 h-100">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="flex-grow-1 min-w-0">
                                    <p class="text-muted fw-medium mb-1 text-truncate">{{ k.label }}</p>
                                    <template v-if="isLoading && !allTabs.length">
                                        <SkeletonLoader type="text" width="65%" height="22px" class="my-1" />
                                        <SkeletonLoader type="text" width="45%" height="11px" />
                                    </template>
                                    <template v-else>
                                        <h4 class="mb-0 text-truncate font-size-20">{{ k.value }}</h4>
                                        <p class="font-size-12 mb-0 mt-1 text-muted text-truncate">{{ k.note }}</p>
                                    </template>
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

            <!-- Main card: toolbar, showing strip, grid/table content -->
            <div class="card flat-card">
                <!-- Toolbar: grid/table toggle, search & filters -->
                <div class="card-body border-bottom">
                    <div class="d-flex gap-2 gap-md-3 align-items-center">
                        <!-- Grid / Table View Toggle on the left -->
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

                        <!-- Search -->
                        <div class="flex-grow-1" style="min-width: 0;">
                            <div class="search-box mb-0 me-0">
                                <div class="position-relative">
                                    <form @submit.prevent class="input-group bg-light rounded pb-0 flex-nowrap">
                                        <div class="flex-grow-1">
                                            <input
                                                v-model="searchQuery"
                                                style="border-radius: 0px; padding-right: 35px;"
                                                type="text"
                                                class="form-control bg-light rounded flex-grow-1"
                                                placeholder="Search by tab #, name, customer, table, or staff..."
                                                spellcheck="false"
                                                aria-label="Search tabs"
                                            />
                                            <i class="bx bx-search-alt search-icon fs-4"></i>
                                            <i
                                                v-if="searchQuery !== ''"
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

                        <!-- Phones & tablets: all filters folded into one menu -->
                        <div class="position-relative d-flex d-xl-none">
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
                                <div class="mb-2">
                                    <label class="form-label font-size-11 fw-bold text-uppercase text-muted mb-1">Staff / Opened By</label>
                                    <select v-model="selectedUserId" class="form-select form-select-sm font-size-12">
                                        <option value="all">All Staff</option>
                                        <option v-for="u in userOptions" :key="`m-u-${u.id}`" :value="u.id">{{ u.name }} ({{ u.count }})</option>
                                    </select>
                                </div>
                                <div class="mb-2">
                                    <label class="form-label font-size-11 fw-bold text-uppercase text-muted mb-1">Customer</label>
                                    <select v-model="selectedCustomerId" class="form-select form-select-sm font-size-12">
                                        <option value="all">All Customers</option>
                                        <option value="walkin">Walk-in / No Customer</option>
                                        <option v-for="c in customerOptions" :key="`m-c-${c.id}`" :value="c.id">{{ c.name }} ({{ c.count }})</option>
                                    </select>
                                </div>
                                <div class="mb-2">
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
                                    class="btn btn-sm btn-light border w-100 mt-1"
                                    @click="clearAllFilters"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        </div>

                        <!-- Desktop Filters (exact button size & style as Shifts.List.vue) -->
                        <!-- Filter by Staff / User -->
                        <div class="position-relative d-none d-xl-flex">
                            <button
                                class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <Icon icon="ri:user-line" class="fs-4" />
                                <span class="text-truncate" style="max-width: 110px;">{{ selectedUserLabel }}</span>
                                <i class="mdi mdi-chevron-down fs-4"></i>
                            </button>
                            <div class="dropdown-menu dropdown-menu-end p-2" style="min-width: 210px; max-height: 280px; overflow-y: auto;">
                                <h6 class="dropdown-header">Filter by Staff</h6>
                                <a
                                    href="javascript:void(0);"
                                    class="dropdown-item"
                                    :class="{ active: selectedUserId === 'all' }"
                                    @click="selectedUserId = 'all'"
                                >
                                    All Staff
                                </a>
                                <a
                                    v-for="u in userOptions"
                                    :key="u.id"
                                    href="javascript:void(0);"
                                    class="dropdown-item d-flex align-items-center gap-2"
                                    :class="{ active: selectedUserId === u.id }"
                                    @click="selectedUserId = u.id"
                                >
                                    <span class="text-truncate">{{ u.name }}</span>
                                    <span class="ms-auto text-muted small">{{ u.count }}</span>
                                </a>
                            </div>
                        </div>

                        <!-- Filter by Customer -->
                        <div class="position-relative d-none d-xl-flex">
                            <button
                                class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <Icon icon="ri:contacts-line" class="fs-4" />
                                <span class="text-truncate" style="max-width: 120px;">{{ selectedCustomerLabel }}</span>
                                <i class="mdi mdi-chevron-down fs-4"></i>
                            </button>
                            <div class="dropdown-menu dropdown-menu-end p-2" style="min-width: 230px; max-height: 280px; overflow-y: auto;">
                                <h6 class="dropdown-header">Filter by Customer</h6>
                                <a
                                    href="javascript:void(0);"
                                    class="dropdown-item"
                                    :class="{ active: selectedCustomerId === 'all' }"
                                    @click="selectedCustomerId = 'all'"
                                >
                                    All Customers
                                </a>
                                <a
                                    href="javascript:void(0);"
                                    class="dropdown-item"
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
                                    class="dropdown-item d-flex align-items-center gap-2"
                                    :class="{ active: selectedCustomerId === c.id }"
                                    @click="selectedCustomerId = c.id"
                                >
                                    <span class="text-truncate">{{ c.name }}</span>
                                    <span class="ms-auto text-muted small">{{ c.count }}</span>
                                </a>
                            </div>
                        </div>

                        <!-- Filter by Figure Range -->
                        <div class="position-relative d-none d-xl-flex">
                            <button
                                class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2"
                                type="button"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="false"
                            >
                                <Icon icon="ri:money-dollar-circle-line" class="fs-4" />
                                <span>{{ amountFilterLabel }}</span>
                                <i class="mdi mdi-chevron-down fs-4"></i>
                            </button>
                            <div class="dropdown-menu dropdown-menu-end p-3" style="min-width: 270px;">
                                <h6 class="dropdown-header px-0 pt-0">Amount Range (KES)</h6>
                                <div class="d-flex flex-wrap gap-1 mb-3">
                                    <button
                                        v-for="p in amountPresets"
                                        :key="p.key"
                                        type="button"
                                        class="btn btn-sm px-2 py-0.5 font-size-11 rounded-1"
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
                                    <a
                                        href="javascript:void(0);"
                                        class="font-size-12 text-muted"
                                        @click="minAmount = ''; maxAmount = ''"
                                    >
                                        Clear range
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- Filter by Aging Tier -->
                        <div class="position-relative d-none d-xl-flex">
                            <button
                                class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <Icon icon="ri:time-line" class="fs-4" />
                                <span>{{ selectedAgingLabel }}</span>
                                <i class="mdi mdi-chevron-down fs-4"></i>
                            </button>
                            <div class="dropdown-menu dropdown-menu-end p-2" style="min-width: 220px;">
                                <h6 class="dropdown-header">Filter by Aging</h6>
                                <a
                                    v-for="opt in agingOptions"
                                    :key="opt.key"
                                    href="javascript:void(0);"
                                    class="dropdown-item d-flex align-items-center gap-2"
                                    :class="{ active: selectedAging === opt.key }"
                                    @click="selectedAging = opt.key"
                                >
                                    <span
                                        v-if="opt.dot"
                                        class="rounded-circle d-inline-block flex-shrink-0"
                                        :style="{ width: '8px', height: '8px', backgroundColor: opt.dot }"
                                    ></span>
                                    <span>{{ opt.label }}</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- File Manager-style Selection Actions Bar (appears when 1+ tabs are ticked) -->
                <SelectionActionsBar
                    v-if="selectedTabIds.length > 0"
                    :count="selectedTabIds.length"
                    :actions="selectionActions"
                    :busy="isMergingTabs"
                    @action="handleSelectionAction"
                    @clear="clearSelection"
                >
                    <template #right>
                        <span class="text-muted font-size-12 d-none d-md-inline">
                            {{ selectedOpenTabs.length >= 2 ? 'Ready to merge selected open tabs' : 'Select multiple open tabs to merge' }}
                        </span>
                    </template>
                </SelectionActionsBar>

                <!-- "Showing X of Y", active filter chips & refresh -->
                <div v-else class="card-body py-2 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2 font-size-13">
                    <div class="d-flex flex-wrap align-items-center gap-2">
                        <div v-if="isLoading && !allTabs.length">
                            <SkeletonLoader type="text" :lines="1" height="10px" width="150px" />
                        </div>
                        <span v-else class="text-muted">
                            Showing <span class="fw-bold text-black">{{ sortedTabs.length }}</span> of
                            <span class="fw-bold text-black">{{ tabsForCurrentSection.length }}</span>
                            {{ tabsForCurrentSection.length === 1 ? 'tab' : 'tabs' }}
                        </span>

                        <template v-if="activeFilterChips.length">
                            <span class="text-muted">· Filters in use:</span>
                            <span
                                v-for="chip in activeFilterChips"
                                :key="chip.key"
                                class="badge rounded-pill bg-primary bg-soft text-primary font-size-12 fw-medium px-2 py-1 d-inline-flex align-items-center gap-1"
                            >
                                {{ chip.label }}
                                <a href="javascript:void(0);" class="text-primary" :title="`Remove ${chip.label}`" @click="chip.clear()">
                                    <i class="mdi mdi-close"></i>
                                </a>
                            </span>
                            <a v-if="activeFilterChips.length > 1" href="javascript:void(0);" class="ms-1 font-size-12" @click="clearAllFilters">
                                Clear all
                            </a>
                        </template>
                    </div>

                    <!-- Refresh button on the count row -->
                    <button
                        type="button"
                        class="btn btn-sm btn-light waves-effect d-inline-flex align-items-center gap-1.5 flex-shrink-0"
                        :disabled="isLoading"
                        title="Refresh tabs"
                        @click="fetchTabs()"
                    >
                        <Icon icon="boxicons:refresh-ccw" class="fs-5" :class="{ 'spin-anim': isLoading }" />
                        <span>Refresh</span>
                    </button>
                </div>

                <!-- Main Body -->
                <div class="card-body p-0" style="min-height: 55vh;">
                    <!-- Empty State (only after loading completes) -->
                    <div v-if="!isLoading && sortedTabs.length === 0" class="text-center p-5">
                        <Icon icon="ri:bill-line" class="text-black opacity-25" style="font-size: 110px;" />
                        <h4 class="fw-bold text-dark mb-2">
                            {{ activeFilterCount > 0 || searchQuery ? 'No matching tabs' : emptyStateTitle }}
                        </h4>
                        <p class="text-muted mb-3">
                            {{ activeFilterCount > 0 || searchQuery ? 'No tabs match your current search or filter settings.' : emptyStateSubtitle }}
                        </p>
                        <div class="d-flex justify-content-center gap-2">
                            <button
                                v-if="activeFilterCount > 0 || searchQuery"
                                type="button"
                                class="btn btn-light border"
                                @click="clearAllFilters"
                            >
                                Clear Filters
                            </button>
                            <router-link to="/sell" class="btn btn-primary text-white">
                                Start a Sale at Counter
                            </router-link>
                        </div>
                    </div>

                    <!-- ==================== GRID VIEW (Reference Card Design) ==================== -->
                    <div v-else-if="viewMode === 'grid'" class="p-3">
                        <!-- Grid Skeleton Loading (4-column card shapes) -->
                        <div v-if="isLoading && !allTabs.length" class="row g-3">
                            <div v-for="n in 8" :key="`sk-card-${n}`" class="col-12 col-sm-6 col-lg-4 col-xl-3">
                                <div class="card border shadow-none mb-0" style="border-radius: 6px;">
                                    <div class="card-body p-3">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <SkeletonLoader type="text" :lines="1" height="13px" width="55%" />
                                            <SkeletonLoader type="text" :lines="1" height="13px" width="28%" />
                                        </div>
                                        <SkeletonLoader type="text" :lines="2" height="12px" class="mb-3" />
                                        <div class="d-flex justify-content-between mb-1">
                                            <SkeletonLoader type="text" :lines="1" height="10px" width="35%" />
                                            <SkeletonLoader type="text" :lines="1" height="10px" width="30%" />
                                        </div>
                                        <SkeletonLoader type="text" :lines="1" height="4px" width="100%" class="mb-3" />
                                        <div class="d-flex align-items-center justify-content-between pt-1">
                                            <div class="d-flex align-items-center gap-2 flex-grow-1">
                                                <SkeletonLoader type="avatar" width="32px" height="32px" />
                                                <div class="flex-grow-1">
                                                    <SkeletonLoader type="text" :lines="1" height="12px" width="60%" class="mb-1" />
                                                    <SkeletonLoader type="text" :lines="1" height="10px" width="40%" />
                                                </div>
                                            </div>
                                            <SkeletonLoader type="avatar" width="30px" height="30px" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Reference Grid Cards -->
                        <div v-else class="row g-3">
                            <div
                                v-for="tab in sortedTabs"
                                :key="tab.id"
                                class="col-12 col-sm-6 col-lg-4 col-xl-3"
                            >
                                <div
                                    class="card tab-ref-card shadow-none text-start position-relative h-100 mb-0 cursor-pointer"
                                    :class="{ 'is-selected': isTabSelected(tab.id) }"
                                    :style="{
                                        backgroundColor: getRefCardStyle(tab).bg,
                                        border: '1px solid ' + (isTabSelected(tab.id) ? 'var(--bs-primary)' : getRefCardStyle(tab).border),
                                        borderBottom: '3.5px solid ' + getRefCardStyle(tab).accent,
                                    }"
                                    @click="openTabDetails(tab)"
                                >
                                    <div class="card-body p-3 d-flex flex-column justify-content-between">
                                        <div>
                                            <!-- Band 1: Inline Hover Checkbox (inside card) + Tab Title & Meta + Amount & Status -->
                                            <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
                                                <div class="d-flex align-items-start min-w-0 flex-grow-1">
                                                    <div
                                                        class="tab-card-check flex-shrink-0"
                                                        :class="{ 'is-visible': isTabSelected(tab.id) }"
                                                        @click.stop
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            class="form-check-input m-0 cursor-pointer"
                                                            :checked="isTabSelected(tab.id)"
                                                            :aria-label="`Select ${tab.tab_number}`"
                                                            @change="toggleTabSelection(tab.id)"
                                                        />
                                                    </div>
                                                    <div class="overflow-hidden pe-1 min-w-0">
                                                        <h6
                                                            class="fw-bold mb-1.5 text-dark font-size-14 text-truncate"
                                                            style="line-height: 1.3;"
                                                            :title="tab.name || tab.tab_number"
                                                        >
                                                            {{ tab.name || (tab.customer?.name ? `${tab.customer.name}'s Tab` : tab.tab_number) }}
                                                        </h6>
                                                        <div class="d-flex align-items-center flex-wrap gap-1 font-size-11" style="color: #64748b;">
                                                            <span class="font-monospace fw-semibold text-dark">{{ tab.tab_number }}</span>
                                                            <template v-if="getTabTableDisplay(tab)">
                                                                <span class="mx-0.5">•</span>
                                                                <i class="mdi mdi-map-marker font-size-13 text-secondary"></i>
                                                                <span class="fw-medium text-dark">{{ getTabTableDisplay(tab) }}</span>
                                                            </template>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="text-end flex-shrink-0">
                                                    <div
                                                        class="fw-bold font-size-14 text-nowrap"
                                                        :style="{ color: getRefCardStyle(tab).amountColor, lineHeight: 1.2 }"
                                                    >
                                                        {{ formatKES(Number(tab.balance_due) > 0 ? tab.balance_due : tab.total_amount) }}
                                                    </div>
                                                    <span
                                                        class="d-inline-flex align-items-center gap-1 font-size-11 fw-semibold mt-1"
                                                        :style="{ color: getRefCardStyle(tab).statusColor }"
                                                    >
                                                        <Icon :icon="getRefCardStyle(tab).icon" class="font-size-12 flex-shrink-0" />
                                                        <span>{{ getRefCardStyle(tab).statusText }}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <!-- Band 2: Itemized Menu Items List with Fog Fade (Kelvin's design integrated into reference card) -->
                                            <div class="pt-1 mt-1 mb-2">
                                                <div class="position-relative">
                                                    <div
                                                        class="d-flex flex-column gap-2 transition-all"
                                                        :style="(!expandedTabs[tab.id] && (groupTabItems(tab.items).length > 2)) ? 'max-height: 48px; overflow: hidden;' : 'min-height: 44px;'"
                                                    >
                                                        <div
                                                            v-for="(item, idx) in groupTabItems(tab.items)"
                                                            :key="item.id || idx"
                                                            class="d-flex align-items-baseline gap-1.5"
                                                            style="color: #334155; font-size: 11px; line-height: 1.45;"
                                                        >
                                                            <div class="text-truncate" style="min-width: 0;">
                                                                <span class="fw-medium">{{ idx + 1 }}. {{ item.item_name || item.name || 'Item' }}</span>
                                                                <span v-if="item.quantity && Number(item.quantity) > 1" class="text-muted ms-1">({{ Number(item.quantity) }})</span>
                                                            </div>
                                                            <span
                                                                class="flex-grow-1"
                                                                style="border-bottom: 1px dotted rgba(100, 116, 139, 0.35); min-width: 14px; transform: translateY(-2px);"
                                                            ></span>
                                                            <div class="fw-semibold text-dark text-nowrap flex-shrink-0" style="font-size: 11px;">
                                                                {{ formatKES(item.total_amount ?? (Number(item.unit_price || 0) * Number(item.quantity || 1))) }}
                                                            </div>
                                                        </div>

                                                        <div v-if="groupTabItems(tab.items).length === 0" class="text-muted fst-italic py-0.5" style="font-size: 11px;">
                                                            No items recorded
                                                        </div>
                                                    </div>

                                                    <!-- Fog Fade Overlay matching card background -->
                                                    <div
                                                        v-if="!expandedTabs[tab.id] && (groupTabItems(tab.items).length > 2)"
                                                        class="position-absolute bottom-0 start-0 end-0 pointer-events-none"
                                                        :style="{
                                                            height: '24px',
                                                            background: getRefCardStyle(tab).fadeGradient,
                                                        }"
                                                    ></div>
                                                </div>

                                                <!-- Items count & expand/collapse toggle -->
                                                <div class="d-flex align-items-center justify-content-between font-size-11 mt-1.5" style="color: #64748b;">
                                                    <span>
                                                        {{ groupTabItems(tab.items).length }} item{{ groupTabItems(tab.items).length === 1 ? '' : 's' }}
                                                        <template v-if="Number(tab.paid_amount) > 0">
                                                            · Paid {{ formatKES(tab.paid_amount) }}
                                                        </template>
                                                    </span>
                                                    <button
                                                        v-if="groupTabItems(tab.items).length > 2"
                                                        type="button"
                                                        class="btn btn-link p-0 fw-semibold font-size-11 text-decoration-none d-inline-flex align-items-center gap-0.5 shadow-none"
                                                        :style="{ color: getRefCardStyle(tab).statusColor }"
                                                        @click.stop="toggleExpandTab(tab.id)"
                                                    >
                                                        <span>{{ expandedTabs[tab.id] ? 'Hide' : 'Show all' }}</span>
                                                        <i :class="expandedTabs[tab.id] ? 'bx bx-chevron-up' : 'bx bx-chevron-down'"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            <!-- Band 3: Aging Timeline Progress Bar -->
                                            <div class="mb-3">
                                                <div class="d-flex align-items-center justify-content-between font-size-11 text-muted mb-1.5">
                                                    <span>{{ formatOpenedShort(tab.opened_at || tab.created_at || tab.updated_at) }}</span>
                                                    <span
                                                        class="fw-medium"
                                                        :style="{ color: getTabAgingTheme(tab).tier === 'overdue' ? '#e11d48' : '#64748b' }"
                                                    >
                                                        {{ formatTimelineRight(tab) }}
                                                    </span>
                                                </div>

                                                <!-- Progress Track with Start Dot & End Ring -->
                                                <div class="tab-timeline-track">
                                                    <span
                                                        class="tab-timeline-dot-start"
                                                        :style="{ backgroundColor: getRefCardStyle(tab).lineColor }"
                                                    ></span>
                                                    <div class="tab-timeline-rail">
                                                        <div
                                                            class="tab-timeline-fill"
                                                            :style="{
                                                                width: getTabAgingProgress(tab) + '%',
                                                                backgroundColor: getRefCardStyle(tab).lineColor,
                                                            }"
                                                        ></div>
                                                    </div>
                                                    <span
                                                        class="tab-timeline-dot-end"
                                                        :style="{
                                                            borderColor: getTabAgingProgress(tab) >= 100
                                                                ? getRefCardStyle(tab).lineColor
                                                                : '#cbd5e1',
                                                        }"
                                                    ></span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Band 4: Customer/Tab Avatar Footer + Hover Action Buttons (Record Payment & smaller Resume) -->
                                        <div class="tab-card-footer position-relative pt-1">
                                            <!-- Default Footer (Customer/Tab Avatar & Name + Circular Action Trigger) -->
                                            <div class="tab-card-footer-default d-flex align-items-center justify-content-between gap-2">
                                                <div class="d-flex align-items-center gap-2 min-w-0">
                                                    <span
                                                        class="tab-avatar flex-shrink-0"
                                                        :style="{
                                                            backgroundColor: getAvatarTone(getCardDisplayName(tab)).bg,
                                                            color: getAvatarTone(getCardDisplayName(tab)).text,
                                                        }"
                                                    >
                                                        {{ getInitials(getCardDisplayName(tab)) }}
                                                    </span>
                                                    <div class="min-w-0">
                                                        <div
                                                            class="fw-bold text-dark font-size-13 text-truncate"
                                                            style="line-height: 1.25;"
                                                            :title="getCardDisplayName(tab)"
                                                        >
                                                            {{ getCardDisplayName(tab) }}
                                                        </div>
                                                        <div class="text-muted text-truncate" style="font-size: 11px; line-height: 1.3;">
                                                            <template v-if="getTabTableDisplay(tab)">
                                                                {{ getTabTableDisplay(tab) }}
                                                                <template v-if="tab.opened_by?.name"> · {{ tab.opened_by.name }}</template>
                                                            </template>
                                                            <template v-else-if="tab.opened_by?.name">
                                                                Opened by {{ tab.opened_by.name }}
                                                            </template>
                                                            <template v-else>
                                                                {{ tab.items?.length || 0 }} item{{ (tab.items?.length || 0) === 1 ? '' : 's' }}
                                                            </template>
                                                        </div>
                                                    </div>
                                                </div>

                                                <span
                                                    v-if="['open', 'partially_paid'].includes(tab.status)"
                                                    class="tab-circle-action flex-shrink-0"
                                                    title="View tab details"
                                                >
                                                    <i class="bx bx-chevron-right fs-5"></i>
                                                </span>
                                                <span
                                                    v-else
                                                    class="tab-circle-settled flex-shrink-0"
                                                    title="Settled bill"
                                                >
                                                    <i class="bx bx-check fs-5"></i>
                                                </span>
                                            </div>

                                            <!-- Hover Action Buttons (full-size btn-primary + subtle btn-soft-primary, identical height) -->
                                            <div
                                                v-if="['open', 'partially_paid'].includes(tab.status)"
                                                class="tab-card-footer-hover d-flex align-items-center gap-2"
                                                @click.stop
                                            >
                                                <button
                                                    v-if="Number(tab.balance_due) > 0"
                                                    type="button"
                                                    class="btn btn-primary flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2"
                                                    title="Record Payment"
                                                    @click="openPaymentModal(tab)"
                                                >
                                                    <Icon icon="ri:money-dollar-circle-line" class="fs-5" />
                                                    <span>Record Payment</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    class="btn btn-outline-muted-primary flex-shrink-0 d-inline-flex align-items-center justify-content-center gap-1.5"
                                                    :class="{ 'flex-grow-1': Number(tab.balance_due) <= 0 }"
                                                    title="Resume in Cart"
                                                    @click="resumeTabInCart(tab)"
                                                >
                                                    <Icon icon="ri:shopping-cart-2-line" class="fs-5" />
                                                    <span>Resume</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ==================== TABLE VIEW ==================== -->
                    <div v-else class="table-responsive">
                        <table class="table verticle-middle table-hover align-middle mb-0">
                            <thead class="table-light text-nowrap">
                                <tr>
                                    <th style="width: 40px;" class="ps-3">
                                        <input
                                            type="checkbox"
                                            class="form-check-input cursor-pointer"
                                            :checked="allVisibleSelected"
                                            :indeterminate="someVisibleSelected && !allVisibleSelected"
                                            aria-label="Select all visible tabs"
                                            @change="toggleSelectAllVisible"
                                        />
                                    </th>
                                    <th class="cursor-pointer" style="width: 135px;" @click="toggleSort('tab_number')">
                                        <span>Tab #</span>
                                        <i v-if="sortKey === 'tab_number'" :class="sortIconClass" class="ms-1"></i>
                                    </th>
                                    <th class="cursor-pointer" @click="toggleSort('name')">
                                        <span>Tab Reference</span>
                                        <i v-if="sortKey === 'name'" :class="sortIconClass" class="ms-1"></i>
                                    </th>
                                    <th class="cursor-pointer" @click="toggleSort('opened_at')">
                                        <span>Table &amp; Opened</span>
                                        <i v-if="sortKey === 'opened_at'" :class="sortIconClass" class="ms-1"></i>
                                    </th>
                                    <th class="cursor-pointer" @click="toggleSort('opened_by')">
                                        <span>Opened By</span>
                                        <i v-if="sortKey === 'opened_by'" :class="sortIconClass" class="ms-1"></i>
                                    </th>
                                    <th class="cursor-pointer" @click="toggleSort('customer')">
                                        <span>Customer</span>
                                        <i v-if="sortKey === 'customer'" :class="sortIconClass" class="ms-1"></i>
                                    </th>
                                    <th class="text-center cursor-pointer" @click="toggleSort('items')">
                                        <span>Items</span>
                                        <i v-if="sortKey === 'items'" :class="sortIconClass" class="ms-1"></i>
                                    </th>
                                    <th class="text-end cursor-pointer" @click="toggleSort('total_amount')">
                                        <span>Total</span>
                                        <i v-if="sortKey === 'total_amount'" :class="sortIconClass" class="ms-1"></i>
                                    </th>
                                    <th class="text-end cursor-pointer" @click="toggleSort('paid_amount')">
                                        <span>Paid</span>
                                        <i v-if="sortKey === 'paid_amount'" :class="sortIconClass" class="ms-1"></i>
                                    </th>
                                    <th class="text-end cursor-pointer" @click="toggleSort('balance_due')">
                                        <span>Balance Due</span>
                                        <i v-if="sortKey === 'balance_due'" :class="sortIconClass" class="ms-1"></i>
                                    </th>
                                    <th class="text-center">Aging / Status</th>
                                    <th class="text-end" style="min-width: 210px;">Actions</th>
                                </tr>
                            </thead>

                            <!-- Skeleton rows (matching Shifts.List.vue) -->
                            <tbody v-if="isLoading && !allTabs.length">
                                <tr v-for="n in 6" :key="`sk-row-${n}`">
                                    <td class="ps-3"><SkeletonLoader type="text" :lines="1" height="14px" width="14px" /></td>
                                    <td><SkeletonLoader type="text" :lines="1" height="12px" width="110px" /></td>
                                    <td><SkeletonLoader type="text" :lines="1" height="12px" width="130px" /></td>
                                    <td><SkeletonLoader type="text" :lines="1" height="12px" width="90px" /></td>
                                    <td><SkeletonLoader type="text" :lines="1" height="12px" width="95px" /></td>
                                    <td><SkeletonLoader type="text" :lines="1" height="12px" width="105px" /></td>
                                    <td class="text-center"><SkeletonLoader type="text" :lines="1" height="12px" width="32px" /></td>
                                    <td class="text-end"><SkeletonLoader type="text" :lines="1" height="12px" width="75px" /></td>
                                    <td class="text-end"><SkeletonLoader type="text" :lines="1" height="12px" width="65px" /></td>
                                    <td class="text-end"><SkeletonLoader type="text" :lines="1" height="12px" width="75px" /></td>
                                    <td class="text-center"><SkeletonLoader type="text" :lines="1" height="18px" width="80px" /></td>
                                    <td class="text-end"><SkeletonLoader type="text" :lines="1" height="24px" width="140px" /></td>
                                </tr>
                            </tbody>

                            <!-- Data rows -->
                            <tbody v-else>
                                <tr
                                    v-for="tab in sortedTabs"
                                    :key="tab.id"
                                    class="cursor-pointer"
                                    :class="{ 'table-active': isTabSelected(tab.id) }"
                                    @click="openTabDetails(tab)"
                                >
                                    <td class="ps-3" @click.stop>
                                        <input
                                            type="checkbox"
                                            class="form-check-input cursor-pointer"
                                            :checked="isTabSelected(tab.id)"
                                            :aria-label="`Select ${tab.tab_number}`"
                                            @change="toggleTabSelection(tab.id)"
                                        />
                                    </td>
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
                                            {{ groupTabItems(tab.items).length }}
                                        </span>
                                    </td>
                                    <td class="text-end fw-semibold text-dark text-nowrap">
                                        {{ formatKES(tab.total_amount) }}
                                    </td>
                                    <td class="text-end text-success text-nowrap">
                                        {{ formatKES(tab.paid_amount) }}
                                    </td>
                                    <td
                                        class="text-end fw-bold text-nowrap"
                                        :style="{ color: Number(tab.balance_due) > 0 ? getTabAgingTheme(tab).priceColor : '#15803d' }"
                                    >
                                        {{ formatKES(tab.balance_due) }}
                                    </td>
                                    <td class="text-center">
                                        <span
                                            class="badge font-size-10 px-2 py-1 fw-bold rounded-1"
                                            :style="{
                                                backgroundColor: getTabAgingTheme(tab).badgeBg,
                                                color: getTabAgingTheme(tab).badgeText,
                                                border: '1px solid ' + getTabAgingTheme(tab).badgeBorder,
                                            }"
                                        >
                                            {{ getTabAgingTheme(tab).label }}
                                        </span>
                                    </td>
                                    <td class="text-end" @click.stop>
                                        <div v-if="['open', 'partially_paid'].includes(tab.status)" class="d-inline-flex align-items-center gap-2">
                                            <button
                                                v-if="Number(tab.balance_due) > 0"
                                                type="button"
                                                class="btn btn-sm btn-white d-inline-flex align-items-center justify-content-center gap-1 text-nowrap"
                                                title="Record Payment"
                                                @click="openPaymentModal(tab)"
                                            >
                                                <Icon icon="ri:money-dollar-circle-line" class="fs-6 text-primary" />
                                                <span>Record Payment</span>
                                            </button>

                                            <button
                                                type="button"
                                                class="btn btn-sm btn-white d-inline-flex align-items-center justify-content-center gap-1 text-nowrap"
                                                title="Resume in Cart (Add items or checkout)"
                                                @click="resumeTabInCart(tab)"
                                            >
                                                <Icon icon="ri:shopping-cart-2-line" class="fs-6" />
                                                <span>Resume</span>
                                            </button>

                                            <button
                                                v-if="canSplitTab(tab)"
                                                type="button"
                                                class="btn btn-sm btn-white d-inline-flex align-items-center justify-content-center"
                                                title="Split Bill"
                                                aria-label="Split Bill"
                                                @click="openSplitModal(tab)"
                                            >
                                                <Icon icon="ri:git-branch-line" class="fs-6" />
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
            @saved="onAgingSettingsSaved"
        />

        <!-- Tab Details Modal (opens when clicking a single tab) -->
        <TabDetailsModal
            :open="showDetailsModal"
            :tab="detailsTab"
            @close="showDetailsModal = false"
            @resume="(t) => { showDetailsModal = false; resumeTabInCart(t); }"
            @pay="(t) => { showDetailsModal = false; openPaymentModal(t); }"
            @split="(t) => { showDetailsModal = false; openSplitModal(t); }"
            @saving="handleTabItemsSaving"
            @updated="handleTabItemsUpdated"
            @save-error="handleTabItemsSaveError"
        />

        <!-- Merge Tabs Modal (opens when 2+ open tabs are selected and Merge is clicked) -->
        <MergeTabsModal
            :open="showMergeModal"
            :tabs="selectedOpenTabs"
            :busy="isMergingTabs"
            @close="showMergeModal = false"
            @confirm="confirmMergeTabs"
        />

        <!-- Split Tab Modal (select items/quantities to split & optionally pay immediately) -->
        <SplitTabModal
            :open="showSplitModal"
            :tab="splitTargetTab"
            :busy="isSplittingTab"
            :error-message="splitError"
            @close="closeSplitModal"
            @confirm="confirmSplitTab"
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
                                <span class="fw-semibold font-size-13 text-dark">{{ formatKES(activeTab?.total_amount) }}</span>
                            </div>
                            <div class="d-flex justify-content-between mb-1">
                                <span class="text-muted font-size-12">Already Paid:</span>
                                <span class="text-success font-size-13">{{ formatKES(activeTab?.paid_amount) }}</span>
                            </div>
                            <div class="d-flex justify-content-between pt-2 border-top">
                                <span class="fw-bold font-size-13 text-dark">Balance Due:</span>
                                <span class="fw-bold font-size-16 text-danger">{{ formatKES(activeTab?.balance_due) }}</span>
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
                                        class="btn btn-sm flex-grow-1 py-2"
                                        :class="paymentForm.method === 'cash' ? 'btn-primary' : 'btn-light border'"
                                        @click="paymentForm.method = 'cash'"
                                    >
                                        <i class="bx bx-money me-1"></i> Cash
                                    </button>
                                    <button
                                        type="button"
                                        class="btn btn-sm flex-grow-1 py-2"
                                        :class="paymentForm.method === 'mpesa' ? 'btn-success text-white' : 'btn-light border'"
                                        @click="paymentForm.method = 'mpesa'"
                                    >
                                        <i class="bx bx-mobile-alt me-1"></i> M-Pesa
                                    </button>
                                    <button
                                        type="button"
                                        class="btn btn-sm flex-grow-1 py-2"
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

                            <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                                <button type="button" class="btn btn-light border" @click="showPaymentModal = false">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    class="btn btn-success fw-semibold d-inline-flex align-items-center gap-1"
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

        <!-- Toast -->
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
// ---------------------------------------------------------------
// Open Tabs & Bills — Sell/Tabs.List.vue (route "/sell/tabs").
// Modelled on Overview.Dashboard.vue (.page-tabs), Shifts.List.vue
// (KPI cards, toolbar, SkeletonLoader, showing strip), and
// Team.List.vue (DataViewToggle).
//
// Reads:
//   GET  /api/v1/tenant/shifts/current   active shift & branch scope
//   GET  /api/v1/tenant/tabs             tabs list (status=all for live counts)
// Writes:
//   POST /api/v1/tenant/tabs/{id}/payments   record payment
//   POST /api/v1/tenant/tabs/{id}/settle     settle & close tab
//   POST /api/v1/tenant/tabs/{id}/split      split tab
//
// Roles: owner, manager, cashier, waiter (Aging Settings: owner, manager only).
// ---------------------------------------------------------------

// API
import tabsApi from "@/api/tabs";
import shiftsApi from "@/api/shifts";

// Components
import { ref, computed, onMounted, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import SkeletonLoader from "@/components/Loaders/SkeletonLoader.vue";
import SelectionActionsBar from "@/components/Data-tools/Selection.Actions.bar.vue";
import ImageToast from "@/components/ImageToast.vue";
import TabAgingSettingsModal from "./components/TabAgingSettingsModal.vue";
import TabDetailsModal from "./components/TabDetailsModal.vue";
import MergeTabsModal from "./components/MergeTabsModal.vue";
import SplitTabModal from "./components/SplitTabModal.vue";

// Utils
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useShiftStore } from "@/stores/shift";
import { formatKES } from "@/utils/currency";
import {
    tabAgingConfig,
    reloadTabAgingConfig,
    getTabAgingTheme,
    getTabElapsedMinutes,
    formatTabRelativeTime,
    formatMinutesShort,
    groupTabItems,
} from "@/utils/tabAging";
import successImage from "@/assets/images/icons/check.png";
import errorImage from "@/assets/images/icons/error.png";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const shiftStore = useShiftStore();

// ---- Roles ----
const canManageAgingSettings = computed(() => authStore.hasRole(["owner", "manager"]));

// ---- Data ----
const allTabs = ref([]);
const isLoading = ref(true);
const currentShift = ref(null);
const branchId = ref(null);
const expandedTabs = ref({});

// ---- Page state ----
const validTabs = ["active", "settled", "all"];
const statusFilter = ref(validTabs.includes(route.query.tab) ? route.query.tab : "active");

const VIEW_STORAGE_KEY = "psTabsViewMode";
let initialView = "grid";
try {
    if (localStorage.getItem(VIEW_STORAGE_KEY) === "table") initialView = "table";
} catch {
    // Ignore storage errors
}
const viewMode = ref(initialView);

function setViewMode(mode) {
    viewMode.value = mode;
    try {
        localStorage.setItem(VIEW_STORAGE_KEY, mode);
    } catch {
        // Ignore storage errors
    }
}

// ---- Filters & sorting ----
const searchQuery = ref("");
const selectedUserId = ref("all");
const selectedCustomerId = ref("all");
const selectedAging = ref("all");
const minAmount = ref("");
const maxAmount = ref("");

const sortKey = ref("opened_at");
const sortDir = ref("desc");

const sortIconClass = computed(() =>
    sortDir.value === "asc" ? "mdi mdi-chevron-up" : "mdi mdi-chevron-down"
);

function toggleSort(key) {
    if (sortKey.value === key) {
        sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
    } else {
        sortKey.value = key;
        sortDir.value = key === "opened_at" || key === "total_amount" || key === "balance_due" ? "desc" : "asc";
    }
}

// ---- Modals & toast ----
const showAgingSettingsModal = ref(false);
const showDetailsModal = ref(false);
const detailsTab = ref(null);
const showMergeModal = ref(false);
const isMergingTabs = ref(false);
const selectedTabIds = ref([]);
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

const toastStatus = ref(null);
const toastTitle = ref("");
const toastMessage = ref("");
const toastImage = ref(null);

function showToast(status, title, message) {
    toastStatus.value = status;
    toastTitle.value = title;
    toastMessage.value = message;
    toastImage.value = status === "success" ? successImage : status === "error" ? errorImage : null;
}

// ---- Helpers ----
const toggleExpandTab = (tabId) => {
    expandedTabs.value[tabId] = !expandedTabs.value[tabId];
};

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

// ---- Reference card helpers ----
const AVATAR_TONES = [
    { bg: "#d1fae5", text: "#047857" },
    { bg: "#dbeafe", text: "#1d4ed8" },
    { bg: "#ede9fe", text: "#6d28d9" },
    { bg: "#fef3c7", text: "#b45309" },
    { bg: "#fce7f3", text: "#be185d" },
    { bg: "#cffafe", text: "#0e7490" },
];

function shortTabNumber(tabNumber) {
    if (!tabNumber) return "—";
    return String(tabNumber).replace(/^TAB-0*/i, "") || String(tabNumber);
}

function getCardDisplayName(tab) {
    if (tab?.customer?.name) return tab.customer.name;
    if (tab?.name) return tab.name;
    return tab?.tab_number || "Walk-in";
}

function getInitials(name) {
    if (!name) return "?";
    return String(name)
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function getAvatarTone(name) {
    const str = String(name || "A");
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
        hash = (hash * 31 + str.charCodeAt(i)) % AVATAR_TONES.length;
    }
    return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

function formatItemsSummary(tab) {
    const items = tab?.items || [];
    if (!items.length) return "No items recorded yet";
    return items
        .map((item) => {
            const label = item.item_name || item.name || "Item";
            const qty = Number(item.quantity || 1);
            return `${label} (${qty}x)`;
        })
        .join("; ");
}

function formatOpenedShort(timestamp) {
    if (!timestamp) return "Just now";
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return "Recently";
    const day = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
    return `${day}, ${time}`;
}

function formatTimelineRight(tab) {
    const theme = getTabAgingTheme(tab);
    if (theme.tier === "settled") return "Settled";
    const mins = getTabElapsedMinutes(tab);
    if (theme.tier === "overdue") return `Over ${formatMinutesShort(tabAgingConfig.overdueMinutes)}`;
    return mins < 1 ? "Just opened" : `${formatMinutesShort(mins)} elapsed`;
}

function getTabAgingProgress(tab) {
    const theme = getTabAgingTheme(tab);
    if (theme.tier === "settled" || theme.tier === "overdue") return 100;
    const elapsed = getTabElapsedMinutes(tab);
    const max = Math.max(1, Number(tabAgingConfig.overdueMinutes) || 240);
    return Math.min(100, Math.max(8, Math.round((elapsed / max) * 100)));
}

function getRefCardStyle(tab) {
    const theme = getTabAgingTheme(tab);
    const whiteFade = "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.9) 65%, #ffffff 100%)";
    const roseFade = "linear-gradient(to bottom, rgba(254, 242, 242, 0) 0%, rgba(254, 242, 242, 0.9) 65%, #fef2f2 100%)";
    switch (theme.tier) {
        case "overdue":
            return {
                bg: "#fef2f2",
                border: "#fecdd3",
                accent: "#f43f5e",
                statusColor: "#e11d48",
                statusText: "Over Time",
                icon: "ri:error-warning-fill",
                lineColor: "#f43f5e",
                amountColor: "#be123c",
                fadeGradient: roseFade,
            };
        case "extended":
            return {
                bg: "#ffffff",
                border: "#e2e8f0",
                accent: "#f59e0b",
                statusColor: "#d97706",
                statusText: `Active (${formatMinutesShort(tabAgingConfig.extendedMinutes)}+)`,
                icon: "ri:hourglass-2-fill",
                lineColor: "#f59e0b",
                amountColor: "#0f172a",
                fadeGradient: whiteFade,
            };
        case "partial":
            return {
                bg: "#ffffff",
                border: "#e2e8f0",
                accent: "#f59e0b",
                statusColor: "#b45309",
                statusText: "Partial",
                icon: "ri:pie-chart-2-fill",
                lineColor: "#d97706",
                amountColor: "#0f172a",
                fadeGradient: whiteFade,
            };
        case "settled":
            return {
                bg: "#ffffff",
                border: "#e2e8f0",
                accent: "#22c55e",
                statusColor: "#16a34a",
                statusText: "Settled",
                icon: "ri:checkbox-circle-fill",
                lineColor: "#16a34a",
                amountColor: "#15803d",
                fadeGradient: whiteFade,
            };
        case "fresh":
        default:
            return {
                bg: "#ffffff",
                border: "#e2e8f0",
                accent: "#38bdf8",
                statusColor: "#0284c7",
                statusText: "Active",
                icon: "ri:flashlight-fill",
                lineColor: "#0f172a",
                amountColor: "#0f172a",
                fadeGradient: whiteFade,
            };
    }
}

// ---- Section slices & counts ----
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

// ---- KPI cards ----
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
        value: formatKES(totalOutstandingBalance.value),
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

// ---- Filter options ----
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

// ---- Filtered & sorted tabs ----
const filteredTabs = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    const minVal = minAmount.value !== "" ? Number(minAmount.value) : null;
    const maxVal = maxAmount.value !== "" ? Number(maxAmount.value) : null;

    return tabsForCurrentSection.value.filter((tab) => {
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

        if (selectedUserId.value !== "all") {
            const uid = String(tab.opened_by?.id ?? tab.opened_by_id ?? "");
            if (uid !== selectedUserId.value) return false;
        }

        if (selectedCustomerId.value === "walkin") {
            if (tab.customer?.id) return false;
        } else if (selectedCustomerId.value !== "all") {
            if (String(tab.customer?.id ?? "") !== selectedCustomerId.value) return false;
        }

        const figure = Number(tab.total_amount ?? tab.balance_due ?? 0);
        if (minVal !== null && Number.isFinite(minVal) && figure < minVal) return false;
        if (maxVal !== null && Number.isFinite(maxVal) && figure > maxVal) return false;

        if (selectedAging.value !== "all") {
            if (getTabAgingTheme(tab).tier !== selectedAging.value) return false;
        }

        return true;
    });
});

const sortedTabs = computed(() => {
    const dir = sortDir.value === "asc" ? 1 : -1;
    return [...filteredTabs.value].sort((a, b) => {
        switch (sortKey.value) {
            case "tab_number":
                return String(a.tab_number || "").localeCompare(String(b.tab_number || "")) * dir;
            case "name":
                return String(a.name || "").localeCompare(String(b.name || "")) * dir;
            case "opened_by":
                return String(a.opened_by?.name || "").localeCompare(String(b.opened_by?.name || "")) * dir;
            case "customer":
                return getCustomerName(a).localeCompare(getCustomerName(b)) * dir;
            case "items":
                return ((a.items?.length || 0) - (b.items?.length || 0)) * dir;
            case "total_amount":
                return (Number(a.total_amount || 0) - Number(b.total_amount || 0)) * dir;
            case "paid_amount":
                return (Number(a.paid_amount || 0) - Number(b.paid_amount || 0)) * dir;
            case "balance_due":
                return (Number(a.balance_due || 0) - Number(b.balance_due || 0)) * dir;
            case "opened_at":
            default: {
                const ta = new Date(a.opened_at || a.created_at || 0).getTime();
                const tb = new Date(b.opened_at || b.created_at || 0).getTime();
                return (ta - tb) * dir;
            }
        }
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

// ---- Fetch tabs ----
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
    } catch (error) {
        console.error("Error fetching tabs:", error);
        showToast("error", "Could not load tabs", error?.response?.data?.message || "Please try again.");
    } finally {
        isLoading.value = false;
    }
}

function changeStatusFilter(status) {
    statusFilter.value = status;
    router.replace({ query: { ...route.query, tab: status } });
}

function onAgingSettingsSaved(saved) {
    showToast(
        "success",
        "Aging Rules Updated",
        `Extended after ${formatMinutesShort(saved.extendedMinutes)} · Overdue after ${formatMinutesShort(saved.overdueMinutes)}.`
    );
}

// ---- Selection & multi-tab merge (File Manager pattern) ----
const isTabSelected = (tabId) => selectedTabIds.value.includes(tabId);

function toggleTabSelection(tabId) {
    const idx = selectedTabIds.value.indexOf(tabId);
    if (idx === -1) {
        selectedTabIds.value.push(tabId);
    } else {
        selectedTabIds.value.splice(idx, 1);
    }
}

function clearSelection() {
    selectedTabIds.value = [];
}

const allVisibleSelected = computed(() =>
    sortedTabs.value.length > 0 && sortedTabs.value.every((t) => selectedTabIds.value.includes(t.id))
);

const someVisibleSelected = computed(() =>
    sortedTabs.value.some((t) => selectedTabIds.value.includes(t.id))
);

function toggleSelectAllVisible() {
    if (allVisibleSelected.value) {
        selectedTabIds.value = [];
    } else {
        selectedTabIds.value = sortedTabs.value.map((t) => t.id);
    }
}

const selectedTabs = computed(() =>
    allTabs.value.filter((t) => selectedTabIds.value.includes(t.id))
);

const selectedOpenTabs = computed(() =>
    selectedTabs.value.filter((t) => ["open", "partially_paid"].includes(String(t.status || "").toLowerCase()))
);

const singleSelectedTab = computed(() =>
    selectedTabs.value.length === 1 ? selectedTabs.value[0] : null
);

const selectionActions = computed(() => {
    const single = singleSelectedTab.value;
    const isSingleOpen = single && ["open", "partially_paid"].includes(String(single.status || "").toLowerCase());
    return [
        {
            key: "details",
            label: "View Details",
            icon: "ri:eye-line",
            hidden: !single,
        },
        {
            key: "pay",
            label: "Record Payment",
            icon: "ri:money-dollar-circle-line",
            hidden: !(isSingleOpen && Number(single?.balance_due) > 0),
        },
        {
            key: "resume",
            label: "Resume in Cart",
            icon: "ri:shopping-cart-2-line",
            hidden: !isSingleOpen,
        },
        {
            key: "joint_pay",
            label: `Joint Payment (${selectedOpenTabs.value.length})`,
            icon: "ri:wallet-3-line",
            hidden: selectedOpenTabs.value.length < 2,
        },
        {
            key: "merge",
            label: `Merge Tabs (${selectedOpenTabs.value.length})`,
            icon: "ri:git-merge-line",
            hidden: selectedOpenTabs.value.length < 2,
        },
    ];
});

function startJointPayment(tabs) {
    const payable = (tabs || []).filter((t) => t?.id && Number(t.balance_due ?? t.total_amount ?? 0) > 0);
    if (payable.length < 2) {
        if (payable.length === 1) openPaymentModal(payable[0]);
        return;
    }
    cartStore.loadMultipleTabs(payable);
    router.push({
        path: "/sell",
        query: {
            tab_ids: payable.map((t) => t.id).join(","),
            checkout: "1",
        },
    });
}

function handleSelectionAction(key) {
    if (key === "joint_pay" && selectedOpenTabs.value.length >= 2) {
        startJointPayment(selectedOpenTabs.value);
        return;
    }
    if (key === "merge" && selectedOpenTabs.value.length >= 2) {
        showMergeModal.value = true;
        return;
    }
    const tab = singleSelectedTab.value;
    if (!tab) return;
    if (key === "details") openTabDetails(tab);
    else if (key === "pay") openPaymentModal(tab);
    else if (key === "resume") resumeTabInCart(tab);
}

function openTabDetails(tab) {
    detailsTab.value = tab;
    showDetailsModal.value = true;
}

function handleTabItemsSaving({ tab, addedCount }) {
    showToast(
        "loading",
        "Adding Items to Tab",
        `Adding ${addedCount} item${addedCount === 1 ? "" : "s"} to ${tab?.tab_number || "tab"}...`
    );
}

function handleTabItemsSaveError(message) {
    showToast("error", "Could Not Add Items", message || "Failed to add items to tab.");
}

async function handleTabItemsUpdated({ tab: updatedTab, addedCount, proceedToCheckout }) {
    await fetchTabs(true);
    const tabId = updatedTab?.id || detailsTab.value?.id;
    const freshTab = allTabs.value.find((t) => t.id === tabId) || updatedTab || detailsTab.value;

    if (freshTab) {
        detailsTab.value = freshTab;
    }

    showToast(
        "success",
        "Items Added to Tab",
        `Added ${addedCount} item${addedCount === 1 ? "" : "s"} to <strong>${freshTab?.tab_number || "tab"}</strong>.`
    );

    if (proceedToCheckout && freshTab) {
        showDetailsModal.value = false;
        openPaymentModal(freshTab);
    }
}

async function confirmMergeTabs(targetTabId) {
    const sources = selectedOpenTabs.value.filter((t) => t.id !== targetTabId);
    if (!targetTabId || sources.length === 0) return;

    isMergingTabs.value = true;
    try {
        for (const src of sources) {
            await tabsApi.merge(src.id, targetTabId);
        }
        const targetTab = selectedOpenTabs.value.find((t) => t.id === targetTabId);
        showMergeModal.value = false;
        clearSelection();
        showToast(
            "success",
            "Tabs Merged",
            `Merged ${sources.length} tab${sources.length === 1 ? "" : "s"} into ${targetTab?.tab_number || "target tab"}.`
        );
        await fetchTabs(true);
    } catch (error) {
        console.error("Error merging tabs:", error);
        showToast("error", "Merge Failed", error?.response?.data?.message || "Could not merge selected tabs.");
    } finally {
        isMergingTabs.value = false;
    }
}

// ---- Tab actions ----
function resumeTabInCart(tab) {
    cartStore.loadTab(tab);
    router.push({ path: "/sell", query: { tab_id: tab.id } });
}

function openPaymentModal(tab) {
    if (!tab?.id) return;
    // Direct cashier to Counter checkout with Open Tabs selected, items prepopulated, and checkout drawer ready
    cartStore.loadTab(tab);
    router.push({ path: "/sell", query: { tab_id: tab.id, checkout: "1" } });
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
            showToast("success", "Payment Recorded", `Recorded ${formatKES(paymentForm.amount)} on ${activeTab.value.tab_number}.`);
            await fetchTabs(true);
        } else {
            paymentError.value = res.data?.message || "Failed to record payment.";
        }
    } catch (error) {
        console.error("Error recording tab payment:", error);
        paymentError.value = error?.response?.data?.message || "An unexpected error occurred.";
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
            const tabNum = activeTab.value.tab_number;
            showSettleModal.value = false;
            showToast("success", "Tab Settled", `${tabNum} has been finalized as a completed sale.`);
            await fetchTabs(true);
        }
    } catch (error) {
        console.error("Error settling tab:", error);
        showToast("error", "Settlement Failed", error?.response?.data?.message || "Could not settle tab.");
    } finally {
        isSubmittingSettle.value = false;
    }
}

const showSplitModal = ref(false);
const splitTargetTab = ref(null);
const isSplittingTab = ref(false);
const splitError = ref("");

function canSplitTab(tab) {
    const items = (tab?.items || []).filter((i) => String(i.status || "").toLowerCase() !== "voided");
    if (items.length > 1) return true;
    return items.some((i) => Number(i.quantity || 0) > 1);
}

function openSplitModal(tab) {
    if (!tab || !canSplitTab(tab)) return;
    splitTargetTab.value = tab;
    splitError.value = "";
    showSplitModal.value = true;
}

function closeSplitModal() {
    if (isSplittingTab.value) return;
    showSplitModal.value = false;
    splitTargetTab.value = null;
    splitError.value = "";
}

async function confirmSplitTab({ tab, items, newTabName, payNow }) {
    if (!tab?.id || !items?.length || isSplittingTab.value) return;
    isSplittingTab.value = true;
    splitError.value = "";
    try {
        const res = await tabsApi.split(tab.id, items, newTabName);
        const createdTab = res.data?.data || res.data || null;
        showSplitModal.value = false;
        splitTargetTab.value = null;

        if (payNow && createdTab?.id) {
            showToast(
                "success",
                "Bill Split — Opening Checkout",
                `Created ${createdTab.tab_number}. Opening checkout to collect payment.`
            );
            router.push({
                path: "/sell",
                query: { tab_id: createdTab.id, checkout: "1" },
            });
            return;
        }

        showToast(
            "success",
            "Bill Split",
            `Created ${createdTab?.tab_number || newTabName || "new tab"} from ${tab.tab_number}.`
        );
        await fetchTabs(true);
    } catch (error) {
        console.error("Error splitting tab:", error);
        const msg =
            error?.response?.data?.message ||
            Object.values(error?.response?.data?.errors || {})?.flat()?.[0] ||
            "Could not split tab.";
        splitError.value = msg;
        showToast("error", "Split Failed", msg);
    } finally {
        isSplittingTab.value = false;
    }
}

onMounted(() => {
    reloadTabAgingConfig(authStore.tenant?.id);
    if (route.query.customer_id) {
        selectedCustomerId.value = String(route.query.customer_id);
    }
    if (route.query.search) {
        searchQuery.value = String(route.query.search);
    }
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

.tab-ref-card {
    border-radius: 6px;
    transition: box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
}

.tab-ref-card:hover {
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06) !important;
    transform: translateY(-1px);
}

.tab-ref-card.is-selected {
    box-shadow: 0 0 0 2px rgba(85, 110, 230, 0.22) !important;
}

/* Inline hover / selected checkbox inside top-left of each grid card */
.tab-card-check {
    max-width: 0;
    margin-right: 0;
    opacity: 0;
    overflow: hidden;
    padding-top: 2px;
    transition: max-width 0.16s ease, margin-right 0.16s ease, opacity 0.15s ease;
}

.tab-ref-card:hover .tab-card-check,
.tab-card-check.is-visible {
    max-width: 22px;
    margin-right: 8px;
    opacity: 1;
}

/* Smooth hover swap between default avatar footer and quick action buttons */
.tab-card-footer {
    min-height: 44px;
    display: flex;
    align-items: center;
}

.tab-card-footer-default {
    width: 100%;
    transition: opacity 0.15s ease;
}

.tab-card-footer-hover {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
}

.tab-card-footer-hover .btn {
    min-height: 40px;
}

.tab-ref-card:hover .tab-card-footer:has(.tab-card-footer-hover) .tab-card-footer-default {
    opacity: 0;
}

.tab-ref-card:hover .tab-card-footer-hover {
    opacity: 1;
    pointer-events: auto;
}

.tab-items-summary {
    color: #1e293b;
    font-size: 13px;
    line-height: 1.45;
    min-height: 38px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
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
    background-color: #e2e8f0;
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

.tab-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3px;
}

.tab-circle-action {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 0;
    background-color: #0f172a;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.15s ease, transform 0.15s ease;
}

.tab-circle-action:hover {
    background-color: #334155;
    transform: scale(1.05);
}

.tab-circle-settled {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #dcfce7;
    color: #15803d;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

/* Sharper, less-rounded page & toolbar buttons (Aging Settings, Floor & Tables, filters, etc.) */
.tabs-page :deep(.btn:not(.rounded-circle)) {
    border-radius: 4px;
}

.tabs-page :deep(.btn-group > .btn:first-child) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.tabs-page :deep(.btn-group > .btn:last-child) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}
</style>
