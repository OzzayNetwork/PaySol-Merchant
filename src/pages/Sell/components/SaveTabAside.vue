<template>
  <!-- Toggle Button (Hidden, triggered via data-bs-target or script) -->
  <button
    class="btn btn-primary d-none"
    type="button"
    data-bs-toggle="offcanvas"
    data-bs-target="#saveTabAside"
    ref="toggleBtnRef"
  >
    Toggle right offcanvas
  </button>

  <!-- Save Tab Offcanvas Sidebar (Matches Cart width on desktop, responsive on tablet/mobile) -->
  <div
    class="offcanvas offcanvas-end save-tab-offcanvas"
    tabindex="-1"
    id="saveTabAside"
    ref="offcanvasRef"
  >
    <!-- Header (Consistent Open Tabs icon) -->
    <div class="offcanvas-header border-bottom py-3 px-3 d-flex align-items-center justify-content-between bg-white">
      <div class="d-flex align-items-center gap-2">
        <div class="d-flex align-items-center justify-content-center rounded-2 bg-primary-subtle text-primary border border-primary-subtle flex-shrink-0" style="width: 36px; height: 36px;">
          <Icon icon="ri:bill-line" class="fs-5" />
        </div>
        <div>
          <h5 class="mb-0 fw-bold font-size-15 text-dark">Open Tabs</h5>
          <p class="m-0 text-muted font-size-11">Select an existing tab or create a new one.</p>
        </div>
      </div>
      <button type="button" class="btn-close text-reset shadow-none font-size-11" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>

    <!-- Navigation Tabs: Segmented Control (Matching Reference Design) -->
    <div class="p-3 pt-2.5 pb-2.5 bg-white border-bottom mb-2">
      <div class="d-flex p-1 bg-light rounded-3 border" style="background-color: #f1f5f9 !important; border-radius: 10px; padding: 4px !important; margin: 0 2px;">
        <button
          type="button"
          @click="newTab = true"
          class="btn flex-fill py-1.5 font-size-12 fw-semibold border-0 transition-all rounded-2 shadow-none"
          :style="newTab
            ? 'background-color: #ffffff; color: #0f172a; box-shadow: 0 1px 2px rgba(0,0,0,0.06); font-weight: 600;'
            : 'background-color: transparent; color: #64748b; font-weight: 500;'"
        >
          New Tab/Bill
        </button>
        <button
          type="button"
          @click="newTab = false"
          class="btn flex-fill py-1.5 font-size-12 fw-semibold border-0 transition-all rounded-2 shadow-none"
          :style="!newTab
            ? 'background-color: #dbeafe; color: #1d4ed8; box-shadow: 0 1px 2px rgba(29, 78, 216, 0.12); font-weight: 600;'
            : 'background-color: transparent; color: #64748b; font-weight: 500;'"
        >
          Existing Tab/Bill ({{ openTabs.length }})
        </button>
      </div>
    </div>

    <!-- Offcanvas Body: NEW TAB -->
    <div v-if="newTab" class="offcanvas-body p-0">
      <form id="saveTabForm" @submit.prevent="saveTab">
        <!-- Section: Customer Details -->
        <div class="px-3 py-2 fw-bold text-dark sticky-top bg-light border-top" style="z-index: 1020;">
          <div class="d-flex gap-2 align-items-center justify-content-between">
            <span>Customer Details</span>
            <span v-if="selectedCustomer" class="badge bg-soft-success text-success font-size-11">Selected</span>
          </div>
        </div>

        <div class="p-3">
          <CustomerPicker
            :model-value="selectedCustomer"
            :unpaid-bills-count="customerUnpaidBillsCount"
            :outstanding-amount="customerOutstandingDebt"
            :allow-change="true"
            @select="onCustomerPicked"
            @view-bills="switchToExistingTabs"
            @open-profile="openCustomerProfileModal"
          />
        </div>

        <!-- Section: Dynamic Order / Service & Bill Details -->
        <div class="px-3 py-2 fw-bold text-dark sticky-top bg-light border-top" style="z-index: 1020;">
          <div class="d-flex gap-2 align-items-center justify-content-between">
            <span>{{ orderTypeProfile.sectionTitle }}</span>
          </div>
        </div>

        <div class="p-3">
          <div class="row">
            <!-- Dynamic Order / Service Type Selector -->
            <div class="col-12 mb-3">
              <label class="form-label fw-bold font-size-12 text-dark mb-2">
                {{ orderTypeProfile.fieldTitle }} <span class="text-danger">*</span>
              </label>
              <div class="row g-2">
                <div v-for="opt in orderTypeProfile.options" :key="opt.key" class="col-6">
                  <button
                    type="button"
                    class="btn w-100 py-2 px-2 d-flex align-items-center justify-content-center gap-2 font-size-12 fw-semibold order-type-btn"
                    :class="form.order_type === opt.key ? 'btn-outline-muted-primary is-active' : 'btn-white text-dark'"
                    @click="selectOrderType(opt.key)"
                  >
                    <Icon :icon="opt.icon" class="fs-5 flex-shrink-0" />
                    <span class="text-truncate">{{ opt.label }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Table No./Name + Guests side-by-side (when business/option uses tables) -->
            <div v-if="activeOrderTypeOption.usesTables" class="col-12 mb-3">
              <div class="row g-2 align-items-start">
                <div class="col-8">
                  <label class="form-label fw-bold font-size-12 text-dark mb-1">Table No./Name (Optional)</label>
                  <SelectSearchBox
                    :options="tableOptions"
                    v-model="form.table_id"
                    placeholder="Select Table"
                    show-create
                    create-text="Add New Table"
                    create-modal-id="addTableModal"
                    input-class="form-control form-select"
                    :is-multi="false"
                    @update:modelValue="onTableChange"
                  />
                </div>
                <div v-if="activeOrderTypeOption.usesGuests" class="col-4">
                  <label class="form-label fw-bold font-size-12 text-dark mb-1">
                    Guests <span class="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    class="form-control font-size-13"
                    placeholder="e.g. 4"
                    v-model.number="form.guest_count"
                    required
                  />
                </div>
              </div>
            </div>

            <!-- Station / Chair / Room / Bay + Attendant side-by-side (Salon, Spa, Car Wash, Turf) -->
            <div v-if="activeOrderTypeOption.usesStation" class="col-12 mb-3">
              <div class="row g-2">
                <div class="col-7">
                  <label class="form-label fw-bold font-size-12 text-dark mb-1">
                    {{ activeOrderTypeOption.stationLabel || 'Station / Area' }}
                  </label>
                  <input
                    v-model="form.service_station"
                    type="text"
                    class="form-control font-size-12"
                    :placeholder="activeOrderTypeOption.stationPlaceholder || 'e.g. Chair 2'"
                  />
                </div>
                <div class="col-5">
                  <label class="form-label fw-bold font-size-12 text-dark mb-1">
                    {{ activeOrderTypeOption.attendantLabel || 'Attendant' }}
                  </label>
                  <input
                    v-model="form.service_attendant"
                    type="text"
                    class="form-control font-size-12"
                    :placeholder="activeOrderTypeOption.attendantPlaceholder || 'Optional'"
                  />
                </div>
              </div>
            </div>

            <!-- Delivery / Mobile Service Location & Rider Assignment -->
            <div v-if="activeOrderTypeOption.usesDelivery" class="col-12 mb-3">
              <div class="p-3 rounded border" style="background-color: #f8fafc;">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <Icon icon="ri:map-pin-2-line" class="fs-5 text-primary" />
                  <span class="fw-bold font-size-12 text-dark">
                    {{ activeOrderTypeOption.deliveryLabel || 'Delivery Location' }}
                  </span>
                </div>

                <div class="mb-2">
                  <GoogleLocationInput
                    v-model="form.delivery_address"
                    placeholder="Search delivery address or landmark..."
                    @location-selected="onDeliveryLocationSelected"
                    @location-cleared="onDeliveryLocationCleared"
                  />
                </div>

                <GoogleMapPreview
                  v-if="deliveryLocation?.latitude && deliveryLocation?.longitude"
                  :latitude="deliveryLocation.latitude"
                  :longitude="deliveryLocation.longitude"
                  :label="form.delivery_address || 'Delivery Destination'"
                  height="120"
                  class="mb-2"
                />

                <!-- Delivery Distance & ETA Strip -->
                <div
                  v-if="deliveryLocation?.latitude && deliveryLocation?.longitude"
                  class="mb-2"
                >
                  <div
                    v-if="deliveryEstimateLoading"
                    class="p-2 rounded border bg-white d-flex align-items-center gap-2 font-size-12 text-muted"
                  >
                    <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
                    <span>Calculating distance &amp; travel time...</span>
                  </div>
                  <div
                    v-else-if="deliveryEstimate"
                    class="p-2 rounded border bg-white d-flex align-items-center justify-content-between gap-2 flex-wrap"
                  >
                    <div class="d-flex align-items-center gap-3">
                      <span class="d-inline-flex align-items-center gap-1 font-size-12 fw-bold text-dark">
                        <Icon icon="ri:route-line" class="fs-6 text-primary" />
                        <span>{{ deliveryEstimate.distanceText }}</span>
                      </span>
                      <span class="d-inline-flex align-items-center gap-1 font-size-12 fw-bold text-dark">
                        <Icon icon="ri:time-line" class="fs-6 text-success" />
                        <span>{{ deliveryEstimate.durationText }}</span>
                      </span>
                    </div>
                    <small class="text-muted font-size-11">
                      from {{ deliveryOrigin?.name || 'Branch' }}
                    </small>
                  </div>
                  <div
                    v-else
                    class="p-2 rounded border bg-white font-size-11 text-muted d-flex align-items-center gap-1"
                  >
                    <Icon icon="ri:information-line" class="fs-6 flex-shrink-0" />
                    <span>Set branch GPS coordinates in Branches to calculate distance &amp; ETA.</span>
                  </div>
                </div>

                <div class="row g-2 mb-3">
                  <div class="col-7">
                    <label class="form-label font-size-11 text-muted fw-semibold mb-1">Building / Door / Directions</label>
                    <input
                      v-model="form.delivery_directions"
                      type="text"
                      class="form-control form-control-sm"
                      placeholder="e.g. Apt 4B, Gate 2"
                    />
                  </div>
                  <div class="col-5">
                    <label class="form-label font-size-11 text-muted fw-semibold mb-1">Delivery Fee (KES)</label>
                    <input
                      v-model.number="form.delivery_fee"
                      type="number"
                      min="0"
                      step="any"
                      class="form-control form-control-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <!-- Assigned Rider (Business Rider vs Customer's Rider) -->
                <div class="border-top pt-3">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <Icon icon="ri:e-bike-2-line" class="fs-5 text-primary" />
                    <span class="fw-bold font-size-12 text-dark">Assigned Rider</span>
                  </div>

                  <div class="btn-group btn-group-sm w-100 mb-2" role="group">
                    <button
                      type="button"
                      class="btn fw-semibold"
                      :class="form.rider_source === 'business' ? 'btn-primary' : 'btn-white'"
                      @click="form.rider_source = 'business'"
                    >
                      Business Rider
                    </button>
                    <button
                      type="button"
                      class="btn fw-semibold"
                      :class="form.rider_source === 'customer' ? 'btn-primary' : 'btn-white'"
                      @click="form.rider_source = 'customer'"
                    >
                      Customer's Rider
                    </button>
                  </div>
                  <small class="text-muted d-block font-size-11 mb-2">
                    {{ form.rider_source === 'business'
                      ? 'Rider arranged by the business on behalf of the customer.'
                      : 'Rider brought or sent directly by the customer.' }}
                  </small>

                  <div class="row g-2">
                    <div class="col-6">
                      <label class="form-label font-size-11 text-muted fw-semibold mb-1">Rider Name</label>
                      <input
                        v-model="form.rider_name"
                        type="text"
                        class="form-control form-control-sm"
                        placeholder="e.g. Peter Mwangi"
                      />
                    </div>
                    <div class="col-6">
                      <label class="form-label font-size-11 text-muted fw-semibold mb-1">Rider Phone</label>
                      <input
                        v-model="form.rider_phone"
                        type="text"
                        class="form-control form-control-sm"
                        placeholder="e.g. 0712 345 678"
                      />
                    </div>
                    <div class="col-12">
                      <label class="form-label font-size-11 text-muted fw-semibold mb-1">
                        Bike Plate / Courier <span class="fw-normal">(Optional)</span>
                      </label>
                      <input
                        v-model="form.rider_reference"
                        type="text"
                        class="form-control form-control-sm"
                        placeholder="e.g. KMFQ 123A or Glovo / Uber Package"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab Name -->
            <div class="col-12 mb-3">
              <label class="form-label fw-bold font-size-12 text-dark mb-1">
                Bill Name/Label (Optional)
              </label>
              <input
                type="text"
                class="form-control font-size-12"
                placeholder="e.g. John-Table 4 (Optional)"
                v-model="form.tab_name"
              />
              <small class="text-muted font-size-11">Leave blank to auto-generate with time &amp; customer/table</small>
            </div>

            <!-- Notes -->
            <div class="col-12 mb-3">
              <label class="form-label fw-bold font-size-12 text-dark mb-1">Notes (Optional)</label>
              <textarea
                class="form-control font-size-12"
                rows="2"
                placeholder="Start typing..."
                v-model="form.notes"
              ></textarea>
            </div>

            <!-- Dynamic Order Type Summary Strip -->
            <div class="col-12 mt-1">
              <div class="p-2 text-muted text-center border fw-medium bg-light rounded d-flex gap-2 justify-content-center align-items-center font-size-12">
                <Icon :icon="activeOrderTypeOption.icon" class="fs-5 text-primary flex-shrink-0" />
                <div>
                  This tab will be created as <strong class="text-dark">{{ activeOrderTypeOption.label }}</strong>
                  <template v-if="activeOrderTypeOption.usesDelivery">
                    · {{ form.rider_source === 'business' ? 'Business Rider' : "Customer's Rider" }}
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Billing Summary -->
        <div class="p-3">
          <div class="p-3 pb-1 bg-success-muted rounded border-success-subtle border border-2">
            <h4 class="card-title d-flex gap-2 align-items-center">
              <i class="dripicons-tags fs-5"></i>
              <span>Billing Summary</span>
            </h4>
            <table class="table text-uppercase fs-6 table-sm border-success m-0">
              <tbody>
                <tr class="border-success">
                  <td>Total Items</td>
                  <th class="text-right">{{ cartItemsCount || 0 }} (Items)</th>
                </tr>
                <tr class="border-success">
                  <td>Discount</td>
                  <th class="text-right">Kes 0.00</th>
                </tr>
                <tr class="border-success">
                  <td>Total</td>
                  <th class="text-right">{{ formatMoney(cartTotal) }}</th>
                </tr>
                <tr>
                  <td>Tax</td>
                  <th class="text-right">Kes 0.00</th>
                </tr>
                <tr class="fs-4 text-black">
                  <th>Sub Total</th>
                  <th class="text-right">{{ formatMoney(cartTotal) }}</th>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-3 pt-2 d-flex flex-column gap-2">
          <!-- Save as Tab — primary action -->
          <button
            type="submit"
            :disabled="!canSave || saving"
            class="btn btn-primary waves-effect fw-bold font-size-13 py-2.5 rounded-2"
          >
            <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status"></span>
            <template v-if="saving">Saving...</template>
            <template v-if="!saving">
              <i class="mdi mdi-bookmark-outline font-size-16 align-middle me-1.5"></i>
              Save As Tab
            </template>
          </button>

          <!-- Cancel — dismisses offcanvas -->
          <button
            type="button"
            data-bs-dismiss="offcanvas"
            class="btn btn-light waves-effect fw-semibold font-size-12 py-2 rounded-2 d-flex align-items-center justify-content-center"
            @click="resetForm"
          >
            <i class="mdi mdi-close font-size-15 align-middle me-1.5"></i>
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- Offcanvas Body: EXISTING TABS -->
    <div v-else class="offcanvas-body p-3">
      <!-- Search Input with Search Icon (Matching Reference Design) -->
      <div class="mb-3 position-relative">
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0 pe-1 text-muted rounded-start-3 py-1">
            <i class="bx bx-search font-size-15"></i>
          </span>
          <input
            type="text"
            class="form-control border-start-0 ps-1 rounded-end-3 font-size-12 py-1.5"
            placeholder="Search tabs by customer, table..."
            v-model="existingTabFilter"
          />
        </div>
      </div>

      <div v-if="loadingOpenTabs" class="d-flex flex-column gap-3 p-1">
        <div
          v-for="n in 3"
          :key="`sk-tab-${n}`"
          class="card border shadow-none mb-0"
          style="border-radius: 6px;"
        >
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div class="flex-grow-1 pe-3">
                <SkeletonLoader type="text" :lines="1" height="14px" width="65%" class="mb-2" />
                <SkeletonLoader type="text" :lines="1" height="10px" width="45%" />
              </div>
              <div style="width: 80px;">
                <SkeletonLoader type="text" :lines="1" height="14px" width="100%" class="mb-1" />
                <SkeletonLoader type="text" :lines="1" height="14px" width="75%" />
              </div>
            </div>
            <SkeletonLoader type="text" :lines="2" height="10px" class="mb-3" />
            <SkeletonLoader type="text" :lines="1" height="32px" width="100%" />
          </div>
        </div>
      </div>

      <div v-else-if="filteredOpenTabs.length === 0" class="text-center py-5 text-muted">
        <i class="bx bx-receipt fs-1 opacity-50 mb-2"></i>
        <h6 class="fw-semibold text-dark font-size-14">No open tabs found</h6>
        <p class="font-size-12">Create a new tab or check another shift.</p>
      </div>

      <div v-else class="d-flex flex-column gap-3 p-1">
        <!-- Reference Design: Open Tab Card with Muted Colors & Subtle Aging Bottom Border -->
        <div
          v-for="tab in filteredOpenTabs"
          :key="tab.id"
          class="card border-0 shadow-none text-start overflow-hidden position-relative transition-all"
          :style="{
            backgroundColor: getTabAgingTheme(tab).cardBg,
            borderRadius: '6px',
            border: '1px solid ' + getTabAgingTheme(tab).cardBorder + ' !important',
            borderBottom: '3.5px solid ' + getTabAgingTheme(tab).bottomBorder + ' !important',
            marginBottom: '14px !important',
          }"
        >
          <div class="card-body p-3.5">
            <!-- Top Section: Tab Name / Table Pin & Pending Balance -->
            <div class="d-flex justify-content-between align-items-start mb-3.5">
              <div class="overflow-hidden pe-2">
                <h6 class="fw-bold mb-1.5 text-dark font-size-14 text-truncate" style="line-height: 1.3;" :title="tab.name || tab.tab_number">
                  {{ tab.name || (tab.customer ? `${tab.customer.name}'s Tab` : tab.tab_number) }}
                </h6>
                <div class="d-flex align-items-center gap-1 font-size-11" style="color: #64748b;">
                  <template v-if="getTabTableDisplay(tab)">
                    <i class="mdi mdi-map-marker font-size-13 text-secondary"></i>
                    <span class="fw-medium text-dark">{{ getTabTableDisplay(tab) }}</span>
                    <span class="mx-1">•</span>
                  </template>
                  <i class="mdi mdi-clock-outline font-size-12 text-secondary"></i>
                  <span>{{ formatRelativeTime(tab.created_at || tab.updated_at) }}</span>
                </div>
              </div>

              <div class="text-end flex-shrink-0">
                <div class="fw-bold font-size-15" :style="{ color: getTabAgingTheme(tab).priceColor, lineHeight: 1.2 }">
                  KES {{ Number(tab.total_amount || tab.pending_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) }}
                </div>
                <span
                  class="badge font-size-10 px-2.5 py-0.5 fw-bold rounded-pill"
                  :style="{
                    backgroundColor: getTabAgingTheme(tab).badgeBg,
                    color: getTabAgingTheme(tab).badgeText,
                    border: '1px solid ' + getTabAgingTheme(tab).badgeBorder,
                    letterSpacing: '0.2px',
                    marginTop: '3px',
                    display: 'inline-block'
                  }"
                >
                  {{ getTabAgingTheme(tab).label }}
                </span>
              </div>
            </div>

            <!-- Middle Section: Itemized List with Increased Top Spacing & Fog Fade Effect -->
            <div class="position-relative pt-1 mt-1 mb-3">
              <div
                class="d-flex flex-column gap-2 transition-all"
                :style="(!expandedTabs[tab.id] && (groupTabItems(tab.items).length > 2)) ? 'max-height: 52px; overflow: hidden;' : ''"
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
                    KES {{ Number(item.total_amount ?? (Number(item.unit_price || 0) * Number(item.quantity || 1))).toFixed(2) }}
                  </div>
                </div>

                <!-- Fallback if no items array -->
                <div v-if="groupTabItems(tab.items).length === 0" class="text-muted fst-italic py-0.5" style="font-size: 11px;">
                  {{ tab.active_items_count || 0 }} item(s) on tab
                </div>
              </div>

              <!-- Fog Fade Overlay: gently fades the 2nd/3rd item into the muted card background -->
              <div
                v-if="!expandedTabs[tab.id] && (groupTabItems(tab.items).length > 2)"
                class="position-absolute bottom-0 start-0 end-0 pointer-events-none"
                :style="{
                  height: '28px',
                  background: getTabAgingTheme(tab).fadeGradient
                }"
              ></div>
            </div>

            <!-- Items Count & Show Details Toggle -->
            <div class="d-flex justify-content-between align-items-center font-size-11 pt-1 mb-3" style="color: #64748b;">
              <span class="fw-medium">
                {{ (groupTabItems(tab.items).length || tab.active_items_count || 1) }} item{{ (groupTabItems(tab.items).length || tab.active_items_count || 1) === 1 ? '' : 's' }}
              </span>

              <button
                v-if="groupTabItems(tab.items).length > 2"
                type="button"
                class="btn btn-link p-0 fw-semibold font-size-11 text-decoration-none d-inline-flex align-items-center gap-1 shadow-none"
                :style="{ color: getTabAgingTheme(tab).priceColor }"
                @click="toggleExpandTab(tab.id)"
              >
                <span>{{ expandedTabs[tab.id] ? 'Hide details' : 'Show details' }}</span>
                <i :class="expandedTabs[tab.id] ? 'bx bx-chevron-up' : 'bx bx-chevron-down'"></i>
              </button>
            </div>

            <!-- Action Button: Outline Style -->
            <button
              type="button"
              class="btn w-100 fw-semibold font-size-12 py-2 rounded-1 d-flex align-items-center justify-content-center gap-1.5 shadow-none transition-all"
              :style="{
                backgroundColor: 'transparent',
                color: getTabAgingTheme(tab).outlineBtnColor || getTabAgingTheme(tab).priceColor,
                border: '1.5px solid ' + (getTabAgingTheme(tab).outlineBtnBorder || getTabAgingTheme(tab).priceColor),
                opacity: (saving || cartItemsCount === 0) ? 0.6 : 1
              }"
              :disabled="saving || cartItemsCount === 0"
              @click="appendToExistingTab(tab)"
            >
              <i class="bx bx-plus font-size-15"></i>
              <span>Add {{ cartItemsCount }} item{{ cartItemsCount === 1 ? '' : 's' }} to this tab</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Customer Profile, Classification & Progress Modal -->
  <CustomerProfileModal
    modal-id="saveTabCustomerProfileModal"
    :customer="selectedCustomer"
  />

  <TableAddModal
    :existing-tables="availableTables"
    show-select
    @table-added="onTableAddedFromModal"
    @table-selected="onTableSelectedFromModal"
  />

  <Teleport to="body">
    <ImageToast
      :status="toastStatus"
      :title="toastTitle"
      :message="toastMessage"
      :image="toastImage"
      :image-height="64"
      @hide="toastStatus = null"
    />
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { Icon } from '@iconify/vue';
import customersApi from '@/api/customers';
import tablesApi from '@/api/tables';
import tabsApi from '@/api/tabs';
import SelectSearchBox from '@/components/SelectSearchBox.vue';
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue';
import GoogleLocationInput from '@/components/GoogleLocationInput.vue';
import GoogleMapPreview from '@/components/GoogleMapPreview.vue';
import ImageToast from '@/components/ImageToast.vue';
import successImage from '@/assets/images/icons/check.png';
import errorImage from '@/assets/images/icons/error.png';
import CustomerProfileModal from './CustomerProfileModal.vue';
import CustomerPicker from './CustomerPicker.vue';
import TableAddModal from './TableAddModal.vue';
import { useAuthStore } from '@/stores/auth';
import { useCartStore, WALK_IN_CUSTOMER } from '@/stores/cart';
import { useShiftStore } from '@/stores/shift';
import { getTabAgingTheme, formatTabRelativeTime, groupTabItems } from '@/utils/tabAging';
import { resolveOrderTypeProfile } from '@/utils/orderTypes';
import { resolveBranchOrigin, calculateDeliveryEstimate } from '@/utils/deliveryEstimate';

const props = defineProps({
  cart: { type: Array, default: () => [] },
  cartTotal: { type: Number, default: 0 },
  cartItemsCount: { type: Number, default: 0 },
  isTabAsideOpen: { type: Boolean, default: false }
});

const emit = defineEmits(['saved', 'cancel']);

const authStore = useAuthStore();
const cartStore = useCartStore();
const shiftStore = useShiftStore();

const orderTypeProfile = computed(() =>
  resolveOrderTypeProfile(authStore.tenant?.business_type)
);

const offcanvasRef = ref(null);
const customerPickerRef = ref(null);
const newTab = ref(true);
const saving = ref(false);

// Toast state (ImageToast handles circular loader on 'loading', check/error on result)
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

// Form
const form = ref({
  order_type: orderTypeProfile.value.defaultType,
  tab_name: '',
  table_id: null,
  customer_id: null,
  guest_count: 1,
  service_station: '',
  service_attendant: '',
  notes: '',
  delivery_address: '',
  delivery_directions: '',
  delivery_fee: 0,
  rider_source: 'business', // 'business' | 'customer'
  rider_name: '',
  rider_phone: '',
  rider_reference: '',
});

const deliveryLocation = ref(null);
const deliveryEstimate = ref(null);
const deliveryEstimateLoading = ref(false);
const deliveryOrigin = computed(() => resolveBranchOrigin(shiftStore));

async function refreshDeliveryEstimate(dest) {
  if (!dest?.latitude || !dest?.longitude) {
    deliveryEstimate.value = null;
    return;
  }
  let origin = resolveBranchOrigin(shiftStore);
  if (!origin) {
    await shiftStore.fetchBranches(true);
    origin = resolveBranchOrigin(shiftStore);
  }
  if (!origin) {
    deliveryEstimate.value = null;
    return;
  }
  deliveryEstimateLoading.value = true;
  try {
    deliveryEstimate.value = await calculateDeliveryEstimate(origin, dest);
  } finally {
    deliveryEstimateLoading.value = false;
  }
}

function applyCustomerSavedLocation(contact, { overwrite = false } = {}) {
  if (!contact?.addresses?.length) return;
  if (!overwrite && (form.value.delivery_address.trim() || deliveryLocation.value)) return;

  const addr = contact.addresses.find((a) => a.is_default) || contact.addresses[0];
  if (!addr) return;

  const formatted = [addr.building, addr.street, addr.estate_area, addr.town_city]
    .filter(Boolean)
    .join(', ');
  if (formatted) {
    form.value.delivery_address = formatted;
  }
  if (addr.additional_directions) {
    form.value.delivery_directions = addr.additional_directions;
  }
  if (addr.latitude && addr.longitude) {
    deliveryLocation.value = {
      latitude: Number(addr.latitude),
      longitude: Number(addr.longitude),
      formatted_address: formatted,
    };
    refreshDeliveryEstimate(deliveryLocation.value);
  }
}

const activeOrderTypeOption = computed(
  () =>
    orderTypeProfile.value.options.find((o) => o.key === form.value.order_type) ||
    orderTypeProfile.value.options[0]
);

watch(
  () => orderTypeProfile.value.defaultType,
  (nextDefault) => {
    if (!orderTypeProfile.value.options.some((o) => o.key === form.value.order_type)) {
      form.value.order_type = nextDefault;
    }
  }
);

function selectOrderType(typeKey) {
  form.value.order_type = typeKey;
  const opt = orderTypeProfile.value.options.find((o) => o.key === typeKey);
  if (!opt?.usesTables) {
    form.value.table_id = null;
  }
  if (opt?.usesDelivery && selectedCustomer.value?.id) {
    applyCustomerSavedLocation(selectedCustomer.value, { overwrite: false });
  }
}

function onDeliveryLocationSelected(data) {
  if (data?.formatted_address) {
    form.value.delivery_address = data.formatted_address;
  }
  if (data?.latitude && data?.longitude) {
    deliveryLocation.value = data;
    refreshDeliveryEstimate(data);
  }
}

function onDeliveryLocationCleared() {
  deliveryLocation.value = null;
  deliveryEstimate.value = null;
}

// Data
const customers = ref([]);
const availableTables = ref([]);
const openTabs = ref([]);
const selectedCustomer = ref({ ...WALK_IN_CUSTOMER });

function onCustomerPicked(customer) {
  if (customer && customer.id) {
    selectCustomer(customer);
  } else {
    selectedCustomer.value = { ...WALK_IN_CUSTOMER };
    form.value.customer_id = null;
    cartStore.clearCustomer();
  }
}
const searchQuery = ref('');
const existingTabFilter = ref('');
const showCustomerDropdown = ref(false);
const loadingCustomers = ref(false);
const loadingOpenTabs = ref(false);
const expandedTabs = ref({});

const toggleExpandTab = (tabId) => {
  expandedTabs.value[tabId] = !expandedTabs.value[tabId];
};

const formatRelativeTime = formatTabRelativeTime;

const getTabTableDisplay = (tab) => {
  if (tab?.table?.table_number) return `Table ${tab.table.table_number}`;
  if (tab?.table?.label) return `Table ${tab.table.label}`;
  if (tab?.table_number) return `Table ${tab.table_number}`;
  
  if (tab?.table_id && availableTables.value?.length) {
    const tbl = availableTables.value.find((t) => t.id === tab.table_id);
    if (tbl?.table_number) return `Table ${tbl.table_number}`;
    if (tbl?.label) return `Table ${tbl.label}`;
  }

  const match = (tab?.name || '').match(/Table\s*([0-9A-Za-z]+)/i);
  if (match) return `Table ${match[1]}`;

  return null;
};

let searchTimer = null;
let lastRefreshTime = 0;

const formatMoney = (val) => {
  return Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'KES' });
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
};

const isDirty = computed(() => {
  return (
    form.value.tab_name.trim() !== '' ||
    form.value.table_id !== null ||
    form.value.customer_id !== null ||
    form.value.notes.trim() !== ''
  );
});

const canSave = computed(() => {
  return props.cart.length > 0;
});

const tableOptions = computed(() => {
  return availableTables.value.map((tbl) => {
    const base = tbl.table_number
      ? `Table ${tbl.table_number}${tbl.label ? ' - ' + tbl.label : tbl.name ? ' - ' + tbl.name : ''}`
      : (tbl.label || tbl.name || 'Table');
    const statusTag = tbl.status && tbl.status !== 'available' ? ` (${tbl.status})` : '';
    return {
      label: `${base}${statusTag}`,
      value: tbl.id,
    };
  });
});

async function onTableAddedFromModal(createdTable) {
  if (createdTable?.id && !availableTables.value.some((t) => t.id === createdTable.id)) {
    availableTables.value = [...availableTables.value, createdTable];
  }
  await loadTables();
}

function onTableSelectedFromModal(tableId) {
  if (!tableId) return;
  form.value.table_id = tableId;
  onTableChange();
}

const formatLastSeen = (val) => {
  if (!val) {
    const now = new Date();
    return now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 8);
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};

const customerOpenTabs = computed(() => {
  if (!selectedCustomer.value?.id) return [];
  return openTabs.value.filter((t) => t.customer_id === selectedCustomer.value.id);
});

const customerUnpaidBillsCount = computed(() => {
  if (customerOpenTabs.value.length > 0) return customerOpenTabs.value.length;
  if (Number(selectedCustomer.value?.outstanding_balance || 0) > 0) return 1;
  return 0;
});

const customerOutstandingDebt = computed(() => {
  if (customerOpenTabs.value.length > 0) {
    return customerOpenTabs.value.reduce(
      (sum, t) => sum + Number(t.balance_due ?? t.total_amount ?? 0),
      0
    );
  }
  return Number(selectedCustomer.value?.outstanding_balance || 0);
});

const riskBadgeConfig = computed(() => {
  const tier = selectedCustomer.value?.risk_tier || 'new';
  if (tier === 'watch') {
    return {
      label: 'WATCH',
      icon: 'mdi mdi-alert-outline',
      class: 'bg-warning-subtle text-warning-emphasis'
    };
  }
  if (tier === 'trusted') {
    return {
      label: 'TRUSTED',
      icon: 'mdi mdi-check-decagram',
      class: 'bg-success-subtle text-success'
    };
  }
  if (tier === 'reliable') {
    return {
      label: 'RELIABLE',
      icon: 'mdi mdi-check-circle',
      class: 'bg-info-subtle text-info'
    };
  }
  if (tier === 'high_risk') {
    return {
      label: 'BLOCKED',
      icon: 'mdi mdi-alert-octagon',
      class: 'bg-danger-subtle text-danger'
    };
  }
  return {
    label: 'NEW',
    icon: 'mdi mdi-clock-outline',
    class: 'bg-secondary-subtle text-secondary'
  };
});

function switchToExistingTabs() {
  newTab.value = false;
  if (selectedCustomer.value?.name) {
    existingTabFilter.value = selectedCustomer.value.name;
  }
}

const getCustomerRecommendation = (c) => {
  if (!c) return { title: 'Standard Profile', message: 'Regular customer. Standard checkout and tab rules apply.' };
  if (c.risk_tier === 'new' || (!c.bills_issued_count && c.risk_tier !== 'high_risk')) {
    return {
      title: 'New Customer (Unverified)',
      message: 'First-time patron with no prior settlement record. Cash or mobile payment upon order is recommended; manager verification required for open tabs.'
    };
  }
  if (c.risk_tier === 'high_risk') {
    return {
      title: 'Credit Blocked',
      message: 'This customer has unpaid bills or default history. Running tabs are disabled; full upfront payment required.'
    };
  }
  if (c.risk_tier === 'watch') {
    return {
      title: 'Watch List',
      message: 'Active credit exposure or delayed settlement history. Keep tab within conservative limits or take partial deposit.'
    };
  }
  if (c.risk_tier === 'trusted') {
    return {
      title: 'Trusted Patron',
      message: 'Excellent settlement history. Approved for open running tabs and deferred checkout.'
    };
  }
  return {
    title: 'Regular Patron',
    message: 'Established settlement record. Standard checkout and open tab limits apply.'
  };
};

const filteredOpenTabs = computed(() => {
  if (!existingTabFilter.value.trim()) return openTabs.value;
  const q = existingTabFilter.value.toLowerCase();
  return openTabs.value.filter((t) => {
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.tab_number && t.tab_number.toLowerCase().includes(q)) ||
      (t.customer?.name && t.customer.name.toLowerCase().includes(q)) ||
      (t.table?.table_number && t.table.table_number.toLowerCase().includes(q))
    );
  });
});

function handleSearchInput() {
  loadingCustomers.value = true;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadCustomers();
  }, 350);
}

async function loadCustomers(silent = false) {
  try {
    if (!silent || customers.value.length === 0) {
      loadingCustomers.value = true;
    }
    const params = { limit: 50 };
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }
    const res = await customersApi.list(params);
    customers.value = res.data?.data || [];
  } catch (err) {
    console.error('Failed to load customers:', err);
  } finally {
    loadingCustomers.value = false;
  }
}

async function loadTables() {
  try {
    if (
      !shiftStore.activeShift?.branch_id &&
      !shiftStore.selectedBranchId &&
      !shiftStore.branches?.length
    ) {
      await shiftStore.fetchBranches();
    }
    const branchId =
      shiftStore.activeShift?.branch_id ||
      shiftStore.selectedBranchId ||
      (shiftStore.branches?.length
        ? shiftStore.branches.find((b) => b.is_main)?.id || shiftStore.branches[0].id
        : null);

    if (!branchId) return;

    const res = await tablesApi.list({ branch_id: branchId });
    availableTables.value = res.data?.data || [];
  } catch (err) {
    console.error('Failed to load tables:', err);
  }
}

async function loadOpenTabs(silent = false) {
  try {
    if (!silent && openTabs.value.length === 0) {
      loadingOpenTabs.value = true;
    }
    const branchId =
      shiftStore.activeShift?.branch_id ||
      shiftStore.selectedBranchId ||
      (shiftStore.branches?.length ? (shiftStore.branches.find((b) => b.is_main)?.id || shiftStore.branches[0].id) : null) ||
      null;
    const params = { status: 'open' };
    if (branchId) params.branch_id = branchId;
    const res = await tabsApi.list(params);
    openTabs.value = res.data?.data || [];
  } catch (err) {
    console.error('Failed to load open tabs:', err);
  } finally {
    loadingOpenTabs.value = false;
  }
}

function selectCustomer(contact) {
  form.value.customer_id = contact.id;
  selectedCustomer.value = contact;
  searchQuery.value = contact.name;
  showCustomerDropdown.value = false;
  cartStore.setCustomer(contact);

  // Auto-fill sensible tab name if empty
  if (!form.value.tab_name.trim()) {
    form.value.tab_name = `${contact.name}'s Tab`;
  }

  // Pre-fill customer's saved delivery location if available
  applyCustomerSavedLocation(contact, { overwrite: true });
}

function clearSelectedCustomer() {
  form.value.customer_id = null;
  selectedCustomer.value = null;
  searchQuery.value = '';
  cartStore.clearCustomer();
}

function openCustomerProfileModal() {
  if (!selectedCustomer.value) return;
  const el = document.getElementById('saveTabCustomerProfileModal');
  if (el && window.bootstrap?.Modal) {
    const modal = window.bootstrap.Modal.getOrCreateInstance(el);
    modal.show();
  }
}

function onTableChange() {
  const tbl = availableTables.value.find((t) => t.id === form.value.table_id);
  if (tbl) {
    cartStore.setTable(tbl);
    if (!form.value.tab_name.trim() || form.value.tab_name.startsWith('Table ')) {
      form.value.tab_name = `Table ${tbl.table_number}`;
    }
  } else {
    cartStore.clearTable();
  }
}

function resetForm() {
  form.value = {
    order_type: orderTypeProfile.value.defaultType,
    tab_name: '',
    table_id: null,
    customer_id: null,
    guest_count: 1,
    service_station: '',
    service_attendant: '',
    notes: '',
    delivery_address: '',
    delivery_directions: '',
    delivery_fee: 0,
    rider_source: 'business',
    rider_name: '',
    rider_phone: '',
    rider_reference: '',
  };
  deliveryLocation.value = null;
  deliveryEstimate.value = null;
  selectedCustomer.value = { ...WALK_IN_CUSTOMER };
  searchQuery.value = '';
}

async function saveTab() {
  if (!canSave.value) {
    if (props.cart.length === 0) {
      showToast('error', 'Cart is Empty', 'Please add at least one item to the cart before saving a tab.');
    }
    return;
  }
  saving.value = true;
  showToast('loading', 'Saving Open Bill', 'Creating the tab and adding your items...');

  try {
    const pickedTable = availableTables.value.find(
      (t) => t.id === form.value.table_id
    );
    const tableNumber = pickedTable?.table_number ?? null;

    // Sensible time-prefixed fallback name if cashier left it blank
    const timePrefix = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const fallbackName = selectedCustomer.value?.id
      ? `${timePrefix} · ${selectedCustomer.value.name}`
      : pickedTable
      ? `${timePrefix} · Table ${pickedTable.table_number}`
      : form.value.service_station.trim()
      ? `${timePrefix} · ${form.value.service_station.trim()}`
      : `${timePrefix} · ${activeOrderTypeOption.value.label}`;
    const finalName = form.value.tab_name.trim() || fallbackName;

    // Compose structured order/service type & delivery metadata into notes so nothing is lost
    const metaParts = [`Type: ${activeOrderTypeOption.value.label}`];
    if (activeOrderTypeOption.value.usesGuests && form.value.guest_count) {
      metaParts.push(`Guests: ${form.value.guest_count}`);
    }
    if (activeOrderTypeOption.value.usesStation) {
      if (form.value.service_station.trim()) {
        metaParts.push(`${activeOrderTypeOption.value.stationLabel || 'Station'}: ${form.value.service_station.trim()}`);
      }
      if (form.value.service_attendant.trim()) {
        metaParts.push(`${activeOrderTypeOption.value.attendantLabel || 'Attendant'}: ${form.value.service_attendant.trim()}`);
      }
    }
    if (activeOrderTypeOption.value.usesDelivery) {
      const addr = [form.value.delivery_address.trim(), form.value.delivery_directions.trim()]
        .filter(Boolean)
        .join(', ');
      if (addr) metaParts.push(`Location: ${addr}`);
      if (deliveryEstimate.value) {
        metaParts.push(`${deliveryEstimate.value.distanceText} · ${deliveryEstimate.value.durationText}`);
      }
      const riderKind = form.value.rider_source === 'business' ? 'Business Rider' : "Customer's Rider";
      const riderInfo = [
        form.value.rider_name.trim(),
        form.value.rider_phone.trim(),
        form.value.rider_reference.trim(),
      ]
        .filter(Boolean)
        .join(' · ');
      metaParts.push(riderInfo ? `${riderKind}: ${riderInfo}` : riderKind);
    }
    const combinedNotes = [metaParts.join(' | '), form.value.notes.trim()]
      .filter(Boolean)
      .join(' — ')
      .slice(0, 500);

    const branchId =
      shiftStore.activeShift?.branch_id ||
      shiftStore.selectedBranchId ||
      (shiftStore.branches?.length ? (shiftStore.branches.find((b) => b.is_main)?.id || shiftStore.branches[0].id) : null) ||
      6;

    const payload = {
      branch_id: Number(branchId),
      shift_id: shiftStore.activeShiftId || shiftStore.activeShift?.id || null,
      customer_id: form.value.customer_id || null,
      table_id: activeOrderTypeOption.value.usesTables ? (form.value.table_id || null) : null,
      table_number: activeOrderTypeOption.value.usesTables ? tableNumber : null,
      name: finalName,
      guest_count: parseInt(form.value.guest_count) || 1,
      notes: combinedNotes,
      discount_amount: cartStore.discountAmount || 0,
      delivery_fee: activeOrderTypeOption.value.usesDelivery ? (Number(form.value.delivery_fee) || 0) : (cartStore.deliveryFee || 0),
      items: props.cart.map((i) => ({
        product_id: i.product?.id || i.id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        tax_rate: i.tax_rate || 0,
        discount_amount: i.discount_amount || 0,
        notes: i.notes || '',
      })),
    };

    const res = await tabsApi.open(payload);
    const openedTab = res.data?.data || res.data;

    await loadOpenTabs(true);

    // Close offcanvas
    closeOffcanvas();

    // Clear cart and reset form
    cartStore.clearCart();
    resetForm();

    showToast(
      'success',
      'Tab Saved',
      `<strong>${openedTab?.tab_number || finalName}</strong> has been saved.`
    );
    emit('saved', openedTab);
  } catch (err) {
    console.error('Failed to open tab:', err);
    showToast(
      'error',
      'Could Not Save Tab',
      err?.response?.data?.message || 'Failed to save tab. Please check shift and try again.'
    );
  } finally {
    saving.value = false;
  }
}

async function appendToExistingTab(tab) {
  if (props.cart.length === 0) return;
  const itemCount = props.cart.reduce((sum, i) => sum + Number(i.quantity || 1), 0);
  const tabLabel = tab.tab_number || tab.name || 'tab';

  saving.value = true;
  showToast('loading', 'Adding Items to Tab', `Adding ${itemCount} item${itemCount === 1 ? '' : 's'} to ${tabLabel}...`);

  try {
    const items = props.cart.map((i) => ({
      product_id: i.product?.id || i.id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      tax_rate: i.tax_rate || 0,
      discount_amount: i.discount_amount || 0,
      notes: i.notes || '',
    }));

    await tabsApi.addItems(tab.id, items);

    closeOffcanvas();
    cartStore.clearCart();
    await loadOpenTabs(true);

    showToast(
      'success',
      'Items Added to Tab',
      `Added ${itemCount} item${itemCount === 1 ? '' : 's'} to <strong>${tabLabel}</strong>.`
    );
    emit('saved', tab);
  } catch (err) {
    console.error('Failed to append to tab:', err);
    showToast(
      'error',
      'Could Not Add Items',
      err?.response?.data?.message || 'Failed to append to existing tab.'
    );
  } finally {
    saving.value = false;
  }
}

function closeOffcanvas() {
  const asideEl = document.getElementById('saveTabAside');
  if (asideEl && window.bootstrap?.Offcanvas) {
    const instance = window.bootstrap.Offcanvas.getInstance(asideEl);
    if (instance) instance.hide();
  }
}

function handleClickOutside(event) {
  if (customerPickerRef.value && !customerPickerRef.value.contains(event.target)) {
    showCustomerDropdown.value = false;
  }
}

function refreshDrawerData(silent = true) {
  const now = Date.now();
  if (now - lastRefreshTime < 2000) return; // Debounce rapid back-to-back triggers
  lastRefreshTime = now;

  loadCustomers(silent);
  loadTables();
  loadOpenTabs(silent);

  if (cartStore.customer) {
    selectCustomer(cartStore.customer);
  }
  if (cartStore.table) {
    form.value.table_id = cartStore.table.id;
    onTableChange();
  }
}

watch(
  () => props.isTabAsideOpen,
  (open) => {
    if (open) {
      refreshDrawerData(true);
    }
  }
);

function syncAsideWidthToCart() {
  const asideEl = offcanvasRef.value || document.getElementById('saveTabAside');
  if (!asideEl) return;

  if (window.innerWidth < 992) {
    asideEl.style.removeProperty('--pos-cart-width');
    return;
  }

  const cartEl = document.querySelector('[data-pos-cart]');
  if (cartEl) {
    const width = Math.round(cartEl.getBoundingClientRect().width);
    if (width >= 360) {
      asideEl.style.setProperty('--pos-cart-width', `${width}px`);
      return;
    }
  }
  asideEl.style.removeProperty('--pos-cart-width');
}

function handleOffcanvasShow() {
  syncAsideWidthToCart();
  refreshDrawerData(true);
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', syncAsideWidthToCart);

  // Lazy-load customers, tables, and open tabs only when the drawer opens
  const asideEl = document.getElementById('saveTabAside');
  if (asideEl) {
    asideEl.addEventListener('show.bs.offcanvas', handleOffcanvasShow);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', syncAsideWidthToCart);
  const asideEl = document.getElementById('saveTabAside');
  if (asideEl) {
    asideEl.removeEventListener('show.bs.offcanvas', handleOffcanvasShow);
  }
});
</script>

<style scoped>
.save-tab-offcanvas {
  --bs-offcanvas-width: var(--pos-cart-width, clamp(430px, 33.33vw, 560px));
  width: var(--bs-offcanvas-width);
  max-width: 95vw;
}

@media (max-width: 991.98px) {
  .save-tab-offcanvas {
    --bs-offcanvas-width: min(500px, 92vw);
    width: var(--bs-offcanvas-width);
    max-width: 92vw;
  }
}

@media (max-width: 575.98px) {
  .save-tab-offcanvas {
    --bs-offcanvas-width: 100vw;
    width: 100vw;
    max-width: 100vw;
  }
}

.order-type-btn.is-active,
.order-type-btn.is-active:hover,
.order-type-btn.is-active:focus,
.order-type-btn.is-active:focus-visible,
.order-type-btn.is-active:active {
  color: var(--bs-primary) !important;
  background-color: color-mix(in srgb, var(--bs-primary) 12%, #fff) !important;
  border-color: color-mix(in srgb, var(--bs-primary) 55%, #fff) !important;
  box-shadow: none;
}

.cursor-pointer {
  cursor: pointer;
}

.custom-popover {
  --bs-popover-border-color: #cccccc;
}

.nav-tabs-custom .nav-item .nav-link::after {
  height: 4px;
}

.progress-ring {
  --progress: 0%;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
  border-radius: 50%;
  background: conic-gradient(var(--bs-primary) var(--progress), #e9ecef var(--progress));
}

.loyalty-budge {
  position: absolute;
  bottom: -4px;
  right: -4px;
}

.badge-gold {
  background-color: #ffd700;
  color: #000;
}

.badge-silver {
  background-color: #c0c0c0;
  color: #000;
}

.badge-bronze {
  background-color: #cd7f32;
  color: #fff;
}

.badge-platinum {
  background-color: #e5e4e2;
  color: #000;
}

.badge-alt2 {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 600;
}

.text-right {
  text-align: right !important;
}
</style>
