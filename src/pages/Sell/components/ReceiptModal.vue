<template>
  <div
    class="modal fade text-dark"
    id="receiptModal"
    tabindex="-1"
    aria-labelledby="receiptModalLabel"
    aria-hidden="true"
    ref="modalRef"
    data-bs-backdrop="static"
    data-bs-keyboard="false"
  >
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 520px;">
      <div class="modal-content border bg-white overflow-hidden" style="border-radius: 12px;">
        <!-- Minimal Header with Round Close Button (matching sale.modal.vue) -->
        <div class="modal-header border-0 px-4 pt-3 pb-0 d-flex justify-content-end">
          <h5 class="visually-hidden" id="receiptModalLabel">
            {{ isPendingVerification ? 'Order Recorded' : 'Sale Completed Successfully' }}
          </h5>
          <button
            type="button"
            class="btn p-0 border-0 modal-round-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          >
            <Icon icon="ri:close-line" class="fs-5 text-dark" />
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body px-4 pt-1 pb-4">
          <!-- 1. Centered Success Hero (matching sale.modal.vue) -->
          <div class="d-flex flex-column align-items-center text-center mb-3">
            <img
              :src="isPendingVerification ? pendingImage : successImage"
              :alt="isPendingVerification ? 'Pending Verification' : 'Sale Successful'"
              style="width: 56px; height: 56px; object-fit: contain;"
              class="mb-2"
            />

            <h5 class="fw-bold text-dark mb-1 font-size-18">
              {{ isPendingVerification ? 'Order Recorded · Pending Verification' : 'Sale Completed Successfully' }}
            </h5>

            <div class="text-muted font-size-12 mb-1">
              {{ isPendingVerification ? 'Amount Pending Verification' : 'Amount Paid' }}
            </div>

            <div class="text-dark fw-bold tabular-nums lh-1 mb-2" style="font-size: 28px;">
              {{ formatMoney(currentOrder?.total_amount) }}
            </div>

            <div class="text-muted font-size-12 d-flex align-items-center justify-content-center flex-wrap gap-1">
              <span>{{ formatDate(currentOrder?.created_at) }}</span>
              <span>·</span>
              <span class="font-monospace fw-semibold text-dark">{{ currentOrder?.order_number }}</span>
            </div>

            <!-- Cash Change Pill (when applicable) -->
            <div v-if="totalChangeGiven > 0" class="mt-2">
              <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 font-size-12 fw-bold tabular-nums">
                Change Due: {{ formatMoney(totalChangeGiven) }}
              </span>
            </div>

            <!-- Payment Channels Summary Chips -->
            <div v-if="currentOrder?.payments?.length" class="d-flex align-items-center justify-content-center flex-wrap gap-1 mt-2">
              <span
                v-for="p in currentOrder.payments"
                :key="p.id"
                class="badge bg-light text-dark border font-size-11 fw-semibold"
              >
                <span class="text-uppercase">{{ p.method }}</span>
                <span> · {{ formatMoney(p.amount) }}</span>
                <span v-if="!p.is_verified && p.method !== 'cash'" class="text-warning-emphasis"> (Pending)</span>
              </span>
            </div>
          </div>

          <!-- 2. Selected Customer Card (Accumulated Points, Golden Reward & Rating) -->
          <div
            v-if="pointsAwardedBanner"
            class="golden-award-banner rounded-3 px-3 py-2 mb-2 d-flex align-items-center justify-content-between gap-2 font-size-12 fw-semibold"
            :style="pointsEarnedTheme.bannerStyle"
          >
            <div class="d-flex align-items-center gap-2 min-w-0">
              <img :src="pointsEarnedTheme.badgeIcon" alt="Reward" style="width: 22px; height: 22px; object-fit: contain;" class="flex-shrink-0" />
              <span class="text-truncate">{{ pointsAwardedBanner }}</span>
            </div>
            <button
              type="button"
              class="btn-close font-size-10 flex-shrink-0"
              aria-label="Dismiss"
              @click="pointsAwardedBanner = ''"
            ></button>
          </div>

          <div
            v-if="currentOrder?.customer"
            class="rounded-3 border p-3 mb-3 d-flex flex-column gap-2"
            style="background-color: #f8fafc; border-color: #e2e8f0 !important;"
          >
            <div class="d-flex align-items-center justify-content-between gap-3">
              <div class="d-flex align-items-center gap-2 min-w-0">
                <div
                  class="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold font-size-14 flex-shrink-0"
                  style="width: 38px; height: 38px; background-color: #e0e7ff; color: #3730a3;"
                >
                  {{ getInitials(currentOrder.customer.name) }}
                </div>
                <div class="min-w-0">
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="fw-bold font-size-13 text-dark text-truncate">{{ currentOrder.customer.name }}</span>
                    <span class="badge font-size-10 fw-semibold" :class="customerStandingBadge.class">
                      {{ customerStandingBadge.label }}
                    </span>
                  </div>
                  <div class="text-muted font-size-11 text-truncate">
                    {{ currentOrder.customer.phone || currentOrder.customer.email || 'Registered Customer' }}
                  </div>
                </div>
              </div>

              <div class="d-flex align-items-center gap-3 flex-shrink-0 text-end">
                <div>
                  <div class="fw-bold font-size-14 text-dark tabular-nums lh-1">
                    {{ Number(currentOrder.customer.loyalty_points || 0).toLocaleString('en-US') }}
                    <span class="font-size-10 fw-normal text-muted">pts</span>
                  </div>
                  <div class="font-size-10 text-muted mt-1 text-capitalize">
                    {{ currentOrder.customer.loyalty_tier || 'Silver' }} Total
                  </div>
                </div>
                <div class="border-end align-self-stretch"></div>
                <div>
                  <div class="d-inline-flex align-items-center gap-1 fw-bold font-size-14 text-dark tabular-nums lh-1">
                    <span>{{ customerRating.toFixed(1) }}</span>
                    <Icon icon="ri:star-fill" class="font-size-13" style="color: #f59e0b;" />
                  </div>
                  <div class="font-size-10 text-muted mt-1">Rating</div>
                </div>
              </div>
            </div>

            <!-- Creative Tiered Golden Points Earned Ribbon + Next Tier Progress -->
            <div
              v-if="pointsEarnedThisSale > 0"
              class="golden-points-ribbon rounded-2 px-3 py-2 d-flex flex-column gap-2"
              :style="pointsEarnedTheme.ribbonStyle"
            >
              <div class="d-flex align-items-center justify-content-between gap-2 position-relative" style="z-index: 1;">
                <div class="d-flex align-items-center gap-2">
                  <img
                    :src="pointsEarnedTheme.badgeIcon"
                    :alt="pointsEarnedTheme.label"
                    style="width: 26px; height: 26px; object-fit: contain;"
                    class="flex-shrink-0"
                  />
                  <div>
                    <div class="d-flex align-items-center gap-1 font-size-11 fw-bold" :style="{ color: pointsEarnedTheme.textColor }">
                      <Icon icon="ri:sparkling-2-fill" class="font-size-13" />
                      <span>{{ pointsEarnedTheme.label }}</span>
                    </div>
                    <div class="font-size-10" :style="{ color: pointsEarnedTheme.subTextColor }">
                      {{ nextTierProgress.caption }}
                    </div>
                  </div>
                </div>

                <span
                  class="golden-points-badge rounded-pill px-3 py-1 fw-bold font-size-13 tabular-nums d-inline-flex align-items-center gap-1"
                  :style="pointsEarnedTheme.pillStyle"
                >
                  <Icon icon="ri:coins-fill" class="font-size-14" />
                  <span>+{{ animatedPointsEarned }} pts</span>
                </span>
              </div>

              <!-- Mini Tier Progress Bar -->
              <div class="position-relative" style="z-index: 1;">
                <div class="rounded-pill overflow-hidden" style="height: 5px; background-color: rgba(180, 83, 9, 0.14);">
                  <div
                    class="h-100 rounded-pill"
                    :style="{
                      width: `${nextTierProgress.percent}%`,
                      background: pointsEarnedTheme.barGradient,
                      transition: 'width 0.55s ease',
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Thermal Printer Receipt Slip Preview (Dotted Leader Lines + Open-Tabs Fog Fade) -->
          <div class="thermal-slip-card mb-3">
            <!-- Thermal Paper Top Header -->
            <div class="text-center pb-2 mb-2 receipt-dash-bottom">
              <div class="font-monospace fw-bold font-size-13 text-uppercase text-dark lh-sm">
                {{ tenantName }}
              </div>
              <div class="font-monospace font-size-10 text-muted mt-1">
                {{ currentOrder?.branch?.name || 'Main Branch' }} · {{ formatDate(currentOrder?.created_at) }}
              </div>
              <div class="font-monospace font-size-10 text-muted d-flex align-items-center justify-content-center gap-2 mt-1 flex-wrap">
                <span>Rcpt: <strong class="text-dark">{{ currentOrder?.order_number }}</strong></span>
                <span>·</span>
                <span class="text-uppercase fw-semibold text-dark">
                  {{ formatFulfilment(currentOrder?.fulfilment_method) }}
                  <span v-if="currentOrder?.table"> ({{ currentOrder.table.name }})</span>
                </span>
              </div>
            </div>

            <!-- Itemized List with Dotted Leader Lines & Fog Fade (matching Open Tabs) -->
            <div class="position-relative pt-1">
              <div
                class="d-flex flex-column gap-2 font-monospace"
                :class="{ 'thermal-items-collapsed': !isItemsExpanded }"
              >
                <div
                  v-for="(item, idx) in currentOrder?.items"
                  :key="item.id || idx"
                  class="d-flex align-items-baseline gap-2"
                  style="color: #1e293b; font-size: 11.5px; line-height: 1.45;"
                >
                  <div class="text-truncate" style="min-width: 0;">
                    <span class="fw-semibold">{{ idx + 1 }}. {{ item.product_name }}</span>
                    <span v-if="Number(item.quantity) > 1" class="text-muted ms-1">({{ Number(item.quantity) }}×)</span>
                  </div>
                  <span class="thermal-dotted-leader flex-grow-1"></span>
                  <div class="fw-bold text-dark text-nowrap flex-shrink-0 tabular-nums">
                    KES {{ formatPlainMoney(item.total) }}
                  </div>
                </div>

                <!-- Expanded Thermal Receipt Details (Totals, Payments, Fulfilment, Footer) -->
                <div v-if="isItemsExpanded" class="mt-1 pt-2 receipt-dash-top d-flex flex-column gap-1 font-size-11">
                  <div class="d-flex justify-content-between text-muted">
                    <span>Subtotal</span>
                    <span class="tabular-nums">{{ formatMoney(currentOrder?.subtotal) }}</span>
                  </div>
                  <div v-if="Number(currentOrder?.discount_amount) > 0" class="d-flex justify-content-between text-success">
                    <span>Discount</span>
                    <span class="tabular-nums">-{{ formatMoney(currentOrder?.discount_amount) }}</span>
                  </div>
                  <div v-if="Number(currentOrder?.tax_amount) > 0" class="d-flex justify-content-between text-muted">
                    <span>VAT / Tax</span>
                    <span class="tabular-nums">{{ formatMoney(currentOrder?.tax_amount) }}</span>
                  </div>
                  <div v-if="Number(currentOrder?.delivery_fee) > 0" class="d-flex justify-content-between text-muted">
                    <span>Delivery Fee</span>
                    <span class="tabular-nums">{{ formatMoney(currentOrder?.delivery_fee) }}</span>
                  </div>

                  <!-- Payment Allocations -->
                  <div v-if="currentOrder?.payments?.length" class="mt-1 pt-2 receipt-dash-top d-flex flex-column gap-1 font-size-10">
                    <div v-for="p in currentOrder.payments" :key="p.id">
                      <div class="d-flex justify-content-between">
                        <span class="text-uppercase fw-semibold text-dark">
                          {{ p.method }}<span v-if="!p.is_verified && p.method !== 'cash'" class="text-warning-emphasis"> (Pending)</span>
                        </span>
                        <span class="fw-bold text-dark tabular-nums">{{ formatMoney(p.amount) }}</span>
                      </div>
                      <div v-if="p.external_reference" class="text-muted">Ref: {{ p.external_reference }}</div>
                    </div>
                  </div>

                  <!-- Extra Order Metadata -->
                  <div
                    v-if="currentOrder?.table || currentOrder?.delivery_address || currentOrder?.delivery?.rider_name || currentOrder?.tax_pin || currentOrder?.notes"
                    class="mt-1 pt-2 receipt-dash-top font-size-10 text-muted d-flex flex-column gap-1"
                  >
                    <div v-if="currentOrder?.table">Table: <strong class="text-dark">{{ currentOrder.table.name }}</strong></div>
                    <div v-if="currentOrder?.tax_pin">KRA PIN: <strong class="text-dark">{{ currentOrder.tax_pin }}</strong></div>
                    <div v-if="currentOrder?.delivery_address">Drop-off: {{ currentOrder.delivery_address }}</div>
                    <div v-if="currentOrder?.delivery?.rider_name">
                      Rider: {{ currentOrder.delivery.rider_name }}
                      <span v-if="currentOrder.delivery.vehicle_registration"> ({{ currentOrder.delivery.vehicle_registration }})</span>
                    </div>
                    <div v-if="currentOrder?.notes">Notes: {{ currentOrder.notes }}</div>
                  </div>

                  <div class="text-center font-size-10 text-muted mt-2 pt-2 receipt-dash-top">
                    {{ receiptSettings.footer }}
                  </div>
                </div>
              </div>

              <!-- Soft Fog Fade Overlay (gently fades items into thermal paper background) -->
              <div v-if="!isItemsExpanded" class="thermal-fog-overlay"></div>
            </div>

            <!-- Receipt Footer Row: Item Count + Show/Hide Details + Total -->
            <div class="d-flex justify-content-between align-items-center pt-2 mt-2 receipt-dash-top font-monospace">
              <div class="d-flex align-items-center gap-2">
                <span class="font-size-11 text-muted">
                  {{ itemCount }} item{{ itemCount === 1 ? '' : 's' }}
                </span>
                <span class="text-muted">·</span>
                <button
                  type="button"
                  class="btn btn-link p-0 fw-semibold font-size-11 text-primary text-decoration-none d-inline-flex align-items-center gap-1 shadow-none"
                  @click="isItemsExpanded = !isItemsExpanded"
                >
                  <span>{{ isItemsExpanded ? 'Hide details' : 'Show details' }}</span>
                  <Icon :icon="isItemsExpanded ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" class="fs-6" />
                </button>
              </div>
              <span class="fw-bold font-size-13 text-dark tabular-nums">
                {{ formatMoney(currentOrder?.total_amount) }}
              </span>
            </div>
          </div>

          <!-- 4. Optional Post-Sale Details Drawer (Add Missing Customer / Table / Delivery) -->
          <div class="rounded-3 border mb-3 overflow-hidden" style="border-color: #e2e8f0 !important;">
            <button
              type="button"
              class="btn btn-link w-100 text-decoration-none px-3 py-2 d-flex align-items-center justify-content-between text-start"
              style="background-color: #f8fafc;"
              @click="showEnrichmentForm = !showEnrichmentForm"
            >
              <div class="d-flex align-items-center gap-2 min-w-0">
                <Icon icon="ri:edit-2-line" class="text-primary flex-shrink-0" />
                <span class="font-size-12 fw-semibold text-dark text-truncate">
                  {{ hasMissingPostSaleDetails ? `Add ${missingDetailHints.join(' / ')}` : 'Update Customer / Order Details' }}
                </span>
              </div>
              <div class="d-flex align-items-center gap-1 flex-shrink-0">
                <span v-if="saveFeedback" class="badge bg-success-subtle text-success font-size-10">Updated</span>
                <Icon
                  :icon="showEnrichmentForm ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'"
                  class="text-muted fs-5"
                />
              </div>
            </button>

            <div v-if="showEnrichmentForm" class="p-3 border-top bg-white d-flex flex-column gap-2">
              <div>
                <label class="form-label font-size-11 text-muted fw-semibold mb-1">Customer</label>
                <CustomerPicker
                  :model-value="editCustomer"
                  :allow-change="true"
                  :show-callout="false"
                  :defer-modal-open="true"
                  @select="onEditCustomerSelected"
                  @register-new="$emit('register-customer')"
                />
              </div>

              <div class="pt-1">
                <div class="form-check mb-0">
                  <input
                    id="receiptIncludeKraPin"
                    v-model="includeKraPinOnReceipt"
                    type="checkbox"
                    class="form-check-input"
                  />
                  <label class="form-check-label font-size-12 fw-semibold text-dark cursor-pointer" for="receiptIncludeKraPin">
                    Include KRA PIN on receipt
                  </label>
                </div>
                <input
                  v-if="includeKraPinOnReceipt"
                  v-model="editKraPin"
                  type="text"
                  class="form-control form-control-sm text-uppercase font-monospace mt-2"
                  placeholder="e.g. P051234567X"
                  maxlength="11"
                  @input="editKraPin = editKraPin.toUpperCase()"
                />
              </div>

              <div v-if="currentOrder?.fulfilment_method === 'dine_in'">
                <label class="form-label font-size-11 text-muted fw-semibold mb-1">Table Number</label>
                <SelectSearchBox
                  v-model="editTableId"
                  :options="tableSelectOptions"
                  placeholder="Select table..."
                  input-class="form-control form-control-sm form-select form-select-sm"
                />
              </div>

              <template v-if="currentOrder?.fulfilment_method === 'delivery'">
                <div>
                  <label class="form-label font-size-11 text-muted fw-semibold mb-1">Delivery Address</label>
                  <GoogleLocationInput
                    v-model="editDeliveryAddress"
                    placeholder="Search drop-off address..."
                    @location-selected="onEditDeliveryLocationSelected"
                  />
                </div>
                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label font-size-11 text-muted fw-semibold mb-1">Arrangement</label>
                    <select v-model="editDeliveryArrangement" class="form-select form-select-sm">
                      <option value="business_rider">Business Rider</option>
                      <option value="customer_rider">Customer Rider</option>
                      <option value="customer_pickup">Self-Pickup</option>
                    </select>
                  </div>
                  <div v-if="editDeliveryArrangement !== 'customer_pickup'" class="col-6">
                    <label class="form-label font-size-11 text-muted fw-semibold mb-1">Vehicle Reg</label>
                    <input
                      v-model="editVehicleReg"
                      type="text"
                      class="form-control form-control-sm text-uppercase font-monospace"
                      placeholder="KMEE 123A"
                      @input="editVehicleReg = editVehicleReg.toUpperCase()"
                    />
                  </div>
                </div>
                <div v-if="editDeliveryArrangement === 'business_rider'">
                  <label class="form-label font-size-11 text-muted fw-semibold mb-1">Rider</label>
                  <SelectSearchBox
                    v-model="editRiderId"
                    :options="riderSelectOptions"
                    placeholder="Select rider..."
                    input-class="form-control form-control-sm form-select form-select-sm"
                  />
                </div>
                <div v-else-if="editDeliveryArrangement === 'customer_rider'" class="row g-2">
                  <div class="col-6">
                    <input v-model.trim="editCustomerRiderName" type="text" class="form-control form-control-sm" placeholder="Rider name" />
                  </div>
                  <div class="col-6">
                    <input v-model.trim="editCustomerRiderPhone" type="tel" class="form-control form-control-sm" placeholder="Rider phone" />
                  </div>
                </div>
              </template>

              <div class="d-flex justify-content-end pt-1">
                <button
                  type="button"
                  class="btn btn-sm btn-primary fw-semibold d-inline-flex align-items-center gap-1"
                  :disabled="savingDetails"
                  @click="savePostSaleDetails"
                >
                  <span v-if="savingDetails" class="spinner-border spinner-border-sm"></span>
                  <span>{{ savingDetails ? 'Saving...' : 'Save & Update' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 5. Auto-Detected Printer Selector Row (58mm / 80mm / A4) -->
          <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap px-2 py-2 mb-3 rounded-2 border" style="border-color: #e2e8f0 !important;">
            <div class="d-flex align-items-center gap-2 min-w-0">
              <Icon :icon="activePrinterProfile.icon" class="text-primary fs-5 flex-shrink-0" />
              <div class="min-w-0">
                <span class="font-size-12 fw-semibold text-dark">{{ activePrinterProfile.label }}</span>
                <span class="text-muted font-size-10 ms-1">· {{ printerDetectionSource }}</span>
              </div>
            </div>

            <div class="btn-group btn-group-sm" role="group" aria-label="Printer format">
              <button
                v-for="prof in printerProfileList"
                :key="prof.key"
                type="button"
                class="btn font-size-10 fw-semibold px-2 py-1"
                :class="selectedPrinterType === prof.key ? 'btn-primary text-white' : 'btn-white border text-dark'"
                @click="selectPrinterType(prof.key)"
              >
                {{ prof.shortLabel }}
              </button>
            </div>
          </div>

          <!-- 6. Action Buttons (matching sale.modal.vue: Secondary row + Full-width Print Primary) -->
          <div class="row g-2">
            <div class="col-12">
              <button
                type="button"
                class="btn btn-primary fw-bold w-100 py-2 d-inline-flex align-items-center justify-content-center gap-2"
                @click="printReceipt"
              >
                <Icon :icon="activePrinterProfile.icon" class="fs-5" />
                <span>Print Receipt ({{ activePrinterProfile.label }})</span>
              </button>
            </div>
            <div class="col-12">
              <button
                type="button"
                class="btn btn-light border fw-semibold w-100 py-2 d-inline-flex align-items-center justify-content-center gap-2"
                @click="handleNewSale"
              >
                <Icon icon="ri:shopping-cart-2-line" class="fs-5 text-primary" />
                <span>Continue Selling</span>
              </button>
            </div>
          </div>

          <!-- Hidden Formatted Print Template Source (adapts cleanly to 58mm, 80mm, or A4) -->
          <div class="d-none">
            <div id="printableReceiptArea">
              <!-- THERMAL 58mm & 80mm PRINT LAYOUT -->
              <div
                v-if="selectedPrinterType === 'thermal_58' || selectedPrinterType === 'thermal_80'"
                class="thermal-sheet"
              >
                <div class="text-center mb-2">
                  <div v-if="receiptSettings.logo !== 'none' && businessLogoUrl" class="mb-1">
                    <img
                      :src="businessLogoUrl"
                      alt="Logo"
                      :style="{
                        maxHeight: selectedPrinterType === 'thermal_58' ? '34px' : '44px',
                        filter: receiptSettings.logo === 'mono' ? 'grayscale(100%) contrast(150%)' : 'none',
                      }"
                    />
                  </div>
                  <div class="fw-bold text-uppercase">{{ tenantName }}</div>
                  <div class="text-muted">
                    {{ currentOrder?.branch?.name || 'Main Branch' }}
                    <span v-if="businessInfo?.address_line"> · {{ businessInfo.address_line }}</span>
                  </div>
                  <div v-if="businessInfo?.phone" class="text-muted">Tel: {{ businessInfo.phone }}</div>
                  <div v-if="receiptSettings.show_kra_pin && businessInfo?.kra_pin" class="fw-bold">
                    PIN: {{ businessInfo.kra_pin }}
                  </div>
                </div>

                <div class="receipt-dash my-2"></div>

                <div class="d-flex flex-column gap-1">
                  <div class="d-flex justify-content-between">
                    <span>Rcpt: <strong>{{ currentOrder?.order_number }}</strong></span>
                    <span>{{ formatDate(currentOrder?.created_at) }}</span>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span>Cashier: {{ currentOrder?.cashier?.name || 'Staff' }}</span>
                    <span class="text-uppercase">{{ formatFulfilment(currentOrder?.fulfilment_method) }}</span>
                  </div>
                  <div v-if="currentOrder?.table" class="d-flex justify-content-between fw-bold">
                    <span>Table:</span>
                    <span>{{ currentOrder.table.name }}</span>
                  </div>
                  <div v-if="currentOrder?.customer" class="d-flex justify-content-between">
                    <span>Cust: {{ currentOrder.customer.name }}</span>
                    <span>{{ currentOrder.customer.loyalty_points }} pts</span>
                  </div>
                  <div v-if="currentOrder?.tax_pin" class="d-flex justify-content-between">
                    <span>Cust PIN:</span>
                    <span class="fw-bold">{{ currentOrder.tax_pin }}</span>
                  </div>
                  <div v-if="currentOrder?.fulfilment_method === 'delivery'" class="pt-1 mt-1 receipt-dash-top">
                    <div v-if="currentOrder?.delivery_address">Drop-off: {{ currentOrder.delivery_address }}</div>
                    <div v-if="currentOrder?.delivery?.rider_name">
                      Rider: {{ currentOrder.delivery.rider_name }}
                      <span v-if="currentOrder.delivery.vehicle_registration"> ({{ currentOrder.delivery.vehicle_registration }})</span>
                    </div>
                  </div>
                </div>

                <div class="receipt-dash my-2"></div>

                <!-- 58mm Stacked -->
                <div v-if="selectedPrinterType === 'thermal_58'" class="d-flex flex-column gap-1">
                  <div v-for="item in currentOrder?.items" :key="item.id" class="d-flex justify-content-between">
                    <div>
                      <div class="fw-semibold">{{ item.product_name }}</div>
                      <div class="text-muted">{{ item.quantity }} x {{ formatPlainMoney(item.unit_price) }}</div>
                    </div>
                    <div class="fw-bold tabular-nums">{{ formatPlainMoney(item.total) }}</div>
                  </div>
                </div>

                <!-- 80mm Tabular -->
                <div v-else>
                  <div class="d-flex justify-content-between fw-bold pb-1 mb-1 border-bottom">
                    <span style="width: 52%;">ITEM</span>
                    <span class="text-center" style="width: 16%;">QTY</span>
                    <span class="text-end" style="width: 32%;">AMT</span>
                  </div>
                  <div v-for="item in currentOrder?.items" :key="item.id" class="d-flex justify-content-between mb-1">
                    <div style="width: 52%;">
                      <div class="fw-semibold">{{ item.product_name }}</div>
                      <div class="text-muted">@ {{ formatPlainMoney(item.unit_price) }}</div>
                    </div>
                    <div class="text-center tabular-nums" style="width: 16%;">{{ item.quantity }}</div>
                    <div class="text-end fw-bold tabular-nums" style="width: 32%;">{{ formatPlainMoney(item.total) }}</div>
                  </div>
                </div>

                <div class="receipt-dash my-2"></div>

                <div class="d-flex flex-column gap-1">
                  <div class="d-flex justify-content-between">
                    <span>Subtotal</span>
                    <span class="tabular-nums">{{ formatMoney(currentOrder?.subtotal) }}</span>
                  </div>
                  <div v-if="Number(currentOrder?.discount_amount) > 0" class="d-flex justify-content-between">
                    <span>Discount</span>
                    <span class="tabular-nums">-{{ formatMoney(currentOrder?.discount_amount) }}</span>
                  </div>
                  <div v-if="Number(currentOrder?.tax_amount) > 0" class="d-flex justify-content-between">
                    <span>VAT / Tax</span>
                    <span class="tabular-nums">{{ formatMoney(currentOrder?.tax_amount) }}</span>
                  </div>
                  <div v-if="Number(currentOrder?.delivery_fee) > 0" class="d-flex justify-content-between">
                    <span>Delivery</span>
                    <span class="tabular-nums">{{ formatMoney(currentOrder?.delivery_fee) }}</span>
                  </div>
                  <div class="d-flex justify-content-between fw-bold pt-1 mt-1 receipt-dash-top">
                    <span>TOTAL</span>
                    <span class="tabular-nums">{{ formatMoney(currentOrder?.total_amount) }}</span>
                  </div>
                </div>

                <div class="receipt-dash my-2"></div>

                <div class="d-flex flex-column gap-1">
                  <div v-for="p in currentOrder?.payments" :key="p.id">
                    <div class="d-flex justify-content-between">
                      <span class="text-uppercase fw-semibold">
                        {{ p.method }}<span v-if="!p.is_verified && p.method !== 'cash'"> (Pending)</span>
                      </span>
                      <span class="fw-bold tabular-nums">{{ formatMoney(p.amount) }}</span>
                    </div>
                    <div v-if="p.external_reference" class="text-muted">Ref: {{ p.external_reference }}</div>
                    <div v-if="p.method === 'cash' && Number(p.change_amount) > 0" class="d-flex justify-content-between text-muted">
                      <span>Change Given</span>
                      <span class="tabular-nums">{{ formatMoney(p.change_amount) }}</span>
                    </div>
                  </div>
                </div>

                <div class="receipt-dash my-2"></div>
                <div class="text-center text-muted">
                  <div>{{ receiptSettings.footer }}</div>
                  <div class="mt-1">Powered by PaySol POS</div>
                </div>
              </div>

              <!-- A4 OFFICIAL COMMERCIAL RECEIPT PRINT LAYOUT -->
              <div v-else class="a4-receipt-sheet">
                <div class="d-flex justify-content-between align-items-start pb-2 border-bottom mb-2">
                  <div>
                    <img
                      v-if="businessLogoUrl"
                      :src="businessLogoUrl"
                      alt="Business Logo"
                      style="max-height: 44px; max-width: 120px; object-fit: contain; margin-bottom: 4px;"
                    />
                    <div class="fw-bold" style="font-size: 16px;">{{ tenantName }}</div>
                    <div class="text-muted">
                      {{ currentOrder?.branch?.name || 'Main Branch' }}
                      <span v-if="businessInfo?.address_line"> · {{ businessInfo.address_line }}</span>
                    </div>
                    <div v-if="businessInfo?.phone" class="text-muted">Tel: {{ businessInfo.phone }}</div>
                    <div v-if="receiptSettings.show_kra_pin && businessInfo?.kra_pin" class="fw-bold">
                      KRA PIN: {{ businessInfo.kra_pin }}
                    </div>
                  </div>
                  <div class="text-end">
                    <div class="fw-bold text-uppercase" style="font-size: 16px;">OFFICIAL RECEIPT</div>
                    <div class="font-monospace fw-bold">{{ currentOrder?.order_number }}</div>
                    <div class="text-muted">{{ formatDate(currentOrder?.created_at) }}</div>
                  </div>
                </div>

                <div class="row mb-2 p-2 border rounded">
                  <div class="col-6">
                    <div class="text-muted text-uppercase fw-bold">Received From</div>
                    <div class="fw-bold">{{ currentOrder?.customer?.name || 'Walk-in Customer' }}</div>
                    <div v-if="currentOrder?.customer?.phone" class="text-muted">{{ currentOrder.customer.phone }}</div>
                    <div v-if="currentOrder?.tax_pin">
                      KRA PIN: {{ currentOrder.tax_pin }}
                    </div>
                  </div>
                  <div class="col-6 text-end">
                    <div class="text-muted text-uppercase fw-bold">Order Info</div>
                    <div class="fw-semibold text-uppercase">{{ formatFulfilment(currentOrder?.fulfilment_method) }}</div>
                    <div v-if="currentOrder?.table">Table: {{ currentOrder.table.name }}</div>
                    <div class="text-muted">Cashier: {{ currentOrder?.cashier?.name || 'Staff' }}</div>
                    <div v-if="currentOrder?.delivery?.rider_name">
                      Rider: {{ currentOrder.delivery.rider_name }}
                      <span v-if="currentOrder.delivery.vehicle_registration"> ({{ currentOrder.delivery.vehicle_registration }})</span>
                    </div>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Item Description</th>
                      <th class="text-center" style="width: 60px;">Qty</th>
                      <th class="text-end" style="width: 100px;">Unit Price</th>
                      <th class="text-end" style="width: 110px;">Total (KES)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in currentOrder?.items" :key="item.id">
                      <td>{{ item.product_name }}</td>
                      <td class="text-center tabular-nums">{{ item.quantity }}</td>
                      <td class="text-end tabular-nums">{{ formatPlainMoney(item.unit_price) }}</td>
                      <td class="text-end fw-bold tabular-nums">{{ formatPlainMoney(item.total) }}</td>
                    </tr>
                  </tbody>
                </table>

                <div class="row mb-2">
                  <div class="col-6">
                    <div class="fw-bold text-uppercase text-muted mb-1">Payments</div>
                    <div v-for="p in currentOrder?.payments" :key="p.id" class="d-flex justify-content-between py-1 border-bottom">
                      <span class="text-uppercase">{{ p.method }}<span v-if="p.external_reference"> ({{ p.external_reference }})</span></span>
                      <span class="fw-bold tabular-nums">{{ formatMoney(p.amount) }}</span>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="d-flex justify-content-between py-1">
                      <span class="text-muted">Subtotal</span>
                      <span class="tabular-nums">{{ formatMoney(currentOrder?.subtotal) }}</span>
                    </div>
                    <div v-if="Number(currentOrder?.discount_amount) > 0" class="d-flex justify-content-between py-1">
                      <span>Discount</span>
                      <span class="tabular-nums">-{{ formatMoney(currentOrder?.discount_amount) }}</span>
                    </div>
                    <div v-if="Number(currentOrder?.tax_amount) > 0" class="d-flex justify-content-between py-1">
                      <span class="text-muted">VAT / Tax</span>
                      <span class="tabular-nums">{{ formatMoney(currentOrder?.tax_amount) }}</span>
                    </div>
                    <div v-if="Number(currentOrder?.delivery_fee) > 0" class="d-flex justify-content-between py-1">
                      <span class="text-muted">Delivery</span>
                      <span class="tabular-nums">{{ formatMoney(currentOrder?.delivery_fee) }}</span>
                    </div>
                    <div class="d-flex justify-content-between pt-2 mt-1 border-top fw-bold" style="font-size: 14px;">
                      <span>Total Paid</span>
                      <span class="tabular-nums">{{ formatMoney(currentOrder?.total_amount) }}</span>
                    </div>
                  </div>
                </div>

                <div class="d-flex justify-content-between align-items-end pt-3 mt-2 border-top text-muted">
                  <div>
                    <div class="fw-semibold text-dark">{{ receiptSettings.footer }}</div>
                    <div>Powered by PaySol POS</div>
                  </div>
                  <div class="text-center" style="width: 140px;">
                    <div class="border-top pt-1">Authorized / Cashier</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Celebratory Success Popup for Newly Assigned Customer & Loyalty Points -->
  <Teleport to="body">
    <div style="position: relative; z-index: 1090;">
      <ImageToast
        :status="toastStatus"
        :title="toastTitle"
        :message="toastMessage"
        :image="toastImage"
        :image-height="60"
        :auto-hide-delay="5500"
        @hide="toastStatus = null"
      />
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/auth";
import { useShiftStore } from "@/stores/shift";
import { WALK_IN_CUSTOMER } from "@/stores/cart";
import businessApi from "@/api/business";
import salesApi from "@/api/sales";
import tablesApi from "@/api/tables";
import ridersApi from "@/api/riders";
import successImage from "@/assets/images/icons/check.png";
import pendingImage from "@/assets/images/icons/POS/Checklist-time.svg";
import bronzeBadge from "@/assets/images/icons/loyalty-badges/bronze.svg";
import silverBadge from "@/assets/images/icons/loyalty-badges/silver.svg";
import goldBadge from "@/assets/images/icons/loyalty-badges/gold.svg";
import platinumBadge from "@/assets/images/icons/loyalty-badges/platinum.svg";
import {
  PRINTER_PROFILES,
  detectActivePrinter,
  saveWorkstationPrinter,
} from "@/utils/printerDetection";

import CustomerPicker from "./CustomerPicker.vue";
import SelectSearchBox from "@/components/SelectSearchBox.vue";
import GoogleLocationInput from "@/components/GoogleLocationInput.vue";
import ImageToast from "@/components/ImageToast.vue";

const props = defineProps({
  order: { type: Object, default: null },
});

const emit = defineEmits(["new-sale", "order-updated", "register-customer"]);

const modalRef = ref(null);
const authStore = useAuthStore();
const shiftStore = useShiftStore();

const currentOrder = ref(null);
const businessInfo = ref(null);
const isItemsExpanded = ref(false);

// Printer Detection State
const printerProfileList = [
  PRINTER_PROFILES.thermal_58,
  PRINTER_PROFILES.thermal_80,
  PRINTER_PROFILES.a4,
];
const selectedPrinterType = ref("thermal_58");
const printerDetectionSource = ref("Business Default");
const printCopies = ref(1);
const activePrinterProfile = computed(
  () => PRINTER_PROFILES[selectedPrinterType.value] || PRINTER_PROFILES.thermal_58
);

// Post-Sale Enrichment State
const showEnrichmentForm = ref(false);
const savingDetails = ref(false);
const saveFeedback = ref("");
const pointsAwardedBanner = ref("");
const toastStatus = ref(null);
const toastTitle = ref("");
const toastMessage = ref("");
const toastImage = ref(null);

function showPointsSuccessPopup(customer, order) {
  const earned = Number(order?.points_earned ?? Math.floor(Number(order?.total_amount || 0) / 100));
  const totalPts = Number(customer?.loyalty_points || 0);
  const safeName = customer?.name || "Client";

  if (earned > 0) {
    pointsAwardedBanner.value = `${safeName} · +${earned} pts earned (${pointsEarnedTheme.value.label})`;
    toastStatus.value = "success";
    toastTitle.value = "Loyalty Points Awarded!";
    toastMessage.value = `<strong>${safeName}</strong> earned <strong style="color: #b45309;">+${earned} pt${earned === 1 ? "" : "s"}</strong> (Total: <strong>${totalPts.toLocaleString("en-US")} pts</strong>).`;
    toastImage.value = pointsEarnedTheme.value.badgeIcon;
  } else {
    pointsAwardedBanner.value = `${safeName} selected and linked to receipt ${order?.order_number || ""}`;
    toastStatus.value = "success";
    toastTitle.value = "Client Selected Successfully!";
    toastMessage.value = `<strong>${safeName}</strong> has been linked to receipt <strong>${order?.order_number || ""}</strong>.`;
    toastImage.value = successImage;
  }
}
const editCustomer = ref({ ...WALK_IN_CUSTOMER });
const editKraPin = ref("");
const includeKraPinOnReceipt = ref(false);
const editTableId = ref(null);
const editDeliveryAddress = ref("");
const editDeliveryLocation = ref(null);
const editDeliveryArrangement = ref("business_rider");
const editRiderId = ref(null);
const editCustomerRiderName = ref("");
const editCustomerRiderPhone = ref("");
const editVehicleReg = ref("");

const branchTables = ref([]);
const ridersList = ref([]);

const tenantName = computed(() => {
  return businessInfo.value?.name || authStore.activeBusiness?.name || authStore.tenant?.name || "PaySol Retail";
});

const businessLogoUrl = computed(() => {
  return businessInfo.value?.branding?.logo_url || authStore.activeBusiness?.logo_url || null;
});

const receiptSettings = computed(() => ({
  logo: businessInfo.value?.receipt?.logo || "mono",
  show_kra_pin: businessInfo.value?.receipt?.show_kra_pin ?? true,
  footer: businessInfo.value?.receipt?.footer || "Thank you for your business! Karibu tena.",
  copies: businessInfo.value?.receipt?.copies || 1,
}));

const itemCount = computed(() => currentOrder.value?.items?.length || 0);

const isPendingVerification = computed(() => {
  const status = currentOrder.value?.payment_status;
  return status === "pending_verification" || status === "partial_pending";
});

const totalChangeGiven = computed(() => {
  const payments = currentOrder.value?.payments || [];
  return payments.reduce((sum, p) => sum + (p.method === "cash" ? Number(p.change_amount || 0) : 0), 0);
});

const pointsEarnedThisSale = computed(() => {
  if (!currentOrder.value?.customer) return 0;
  return Number(
    currentOrder.value.points_earned ?? Math.floor(Number(currentOrder.value.total_amount || 0) / 100)
  );
});

// Animated roll-up counter for points earned
const animatedPointsEarned = ref(0);
let pointsAnimFrame = null;

function animatePointsRollup(target) {
  if (pointsAnimFrame) cancelAnimationFrame(pointsAnimFrame);
  const goal = Math.max(0, Math.round(Number(target) || 0));
  if (goal <= 0) {
    animatedPointsEarned.value = 0;
    return;
  }
  const duration = 520;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    animatedPointsEarned.value = Math.max(1, Math.round(eased * goal));
    if (progress < 1) {
      pointsAnimFrame = requestAnimationFrame(step);
    } else {
      animatedPointsEarned.value = goal;
    }
  };
  pointsAnimFrame = requestAnimationFrame(step);
}

watch(
  pointsEarnedThisSale,
  (val) => {
    animatePointsRollup(val);
  },
  { immediate: true }
);

// Dynamic golden intensity & badge based on points earned range
const pointsEarnedTheme = computed(() => {
  const pts = pointsEarnedThisSale.value;

  if (pts >= 200) {
    return {
      label: "VIP Platinum-Gold Reward",
      badgeIcon: platinumBadge,
      textColor: "#78350f",
      subTextColor: "#92400e",
      ribbonStyle: {
        background: "linear-gradient(135deg, #fef9c3 0%, #fde68a 52%, #fef3c7 100%)",
        border: "1px solid #d97706",
      },
      pillStyle: {
        background: "linear-gradient(135deg, #b45309 0%, #d97706 55%, #f59e0b 100%)",
        color: "#ffffff",
      },
      bannerStyle: {
        background: "linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)",
        border: "1px solid #d97706",
        color: "#78350f",
      },
      barGradient: "linear-gradient(90deg, #b45309 0%, #f59e0b 100%)",
    };
  }

  if (pts >= 50) {
    return {
      label: "Royal Gold Bonus",
      badgeIcon: goldBadge,
      textColor: "#92400e",
      subTextColor: "#a16207",
      ribbonStyle: {
        background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 60%, #fde68a 100%)",
        border: "1px solid #f59e0b",
      },
      pillStyle: {
        background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
        color: "#ffffff",
      },
      bannerStyle: {
        background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
        border: "1px solid #f59e0b",
        color: "#92400e",
      },
      barGradient: "linear-gradient(90deg, #d97706 0%, #fbbf24 100%)",
    };
  }

  if (pts >= 10) {
    return {
      label: "Golden Points Earned",
      badgeIcon: goldBadge,
      textColor: "#92400e",
      subTextColor: "#a16207",
      ribbonStyle: {
        background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
        border: "1px solid #fcd34d",
      },
      pillStyle: {
        background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
        color: "#ffffff",
      },
      bannerStyle: {
        background: "#fffbeb",
        border: "1px solid #fcd34d",
        color: "#92400e",
      },
      barGradient: "linear-gradient(90deg, #d97706 0%, #fbbf24 100%)",
    };
  }

  return {
    label: "Starter Gold Points",
    badgeIcon: pts >= 5 ? silverBadge : bronzeBadge,
    textColor: "#92400e",
    subTextColor: "#a16207",
    ribbonStyle: {
      background: "#fffbeb",
      border: "1px solid #fde68a",
    },
    pillStyle: {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #f59e0b",
    },
    bannerStyle: {
      background: "#fffbeb",
      border: "1px solid #fde68a",
      color: "#92400e",
    },
    barGradient: "linear-gradient(90deg, #d97706 0%, #fcd34d 100%)",
  };
});

// Progress toward next loyalty milestone (100 Silver -> 500 Gold -> 1,500 Platinum)
const nextTierProgress = computed(() => {
  const total = Number(currentOrder.value?.customer?.loyalty_points || 0);
  if (total < 100) {
    return {
      percent: Math.min(100, Math.max(6, Math.round((total / 100) * 100))),
      caption: `${100 - total} pts to Silver milestone`,
    };
  }
  if (total < 500) {
    return {
      percent: Math.min(100, Math.max(8, Math.round(((total - 100) / 400) * 100))),
      caption: `${500 - total} pts to Gold milestone`,
    };
  }
  if (total < 1500) {
    return {
      percent: Math.min(100, Math.max(8, Math.round(((total - 500) / 1000) * 100))),
      caption: `${1500 - total} pts to Platinum milestone`,
    };
  }
  return {
    percent: 100,
    caption: "Platinum VIP milestone unlocked!",
  };
});

const customerRating = computed(() => {
  const r = Number(currentOrder.value?.customer?.rating);
  if (Number.isFinite(r) && r > 0) return r;
  const tier = currentOrder.value?.customer?.effective_risk_tier || currentOrder.value?.customer?.risk_tier;
  if (tier === "trusted") return 4.9;
  if (tier === "reliable") return 4.5;
  if (tier === "watch") return 3.0;
  if (tier === "high_risk") return 1.8;
  return 4.0;
});

const customerStandingBadge = computed(() => {
  const tier = currentOrder.value?.customer?.effective_risk_tier || currentOrder.value?.customer?.risk_tier || "new";
  switch (tier) {
    case "trusted":
      return { label: "Trusted", class: "bg-success-subtle text-success" };
    case "reliable":
      return { label: "Reliable", class: "bg-info-subtle text-info" };
    case "watch":
      return { label: "Watch List", class: "bg-warning-subtle text-warning-emphasis" };
    case "high_risk":
      return { label: "High Risk", class: "bg-danger-subtle text-danger" };
    default:
      return { label: "New", class: "bg-white text-muted border" };
  }
});

const missingDetailHints = computed(() => {
  const hints = [];
  if (!currentOrder.value) return hints;
  if (!currentOrder.value.customer) hints.push("Customer");
  if (currentOrder.value.fulfilment_method === "dine_in" && !currentOrder.value.table) {
    hints.push("Table");
  }
  if (currentOrder.value.fulfilment_method === "delivery" && (!currentOrder.value.delivery_address || !currentOrder.value.delivery?.rider_name)) {
    hints.push("Delivery Info");
  }
  return hints;
});

const hasMissingPostSaleDetails = computed(() => missingDetailHints.value.length > 0);

const tableSelectOptions = computed(() =>
  branchTables.value.map((t) => ({
    label: `${t.name}${t.section ? ` (${t.section})` : ""}`,
    value: t.id,
  }))
);

const riderSelectOptions = computed(() =>
  ridersList.value.map((r) => ({
    label: `${r.full_name}${r.is_staff ? " [Staff]" : ""}${r.delivery_provider?.name ? ` · ${r.delivery_provider.name}` : ""}`,
    value: r.id,
  }))
);

function getInitials(name) {
  if (!name) return "C";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

function formatFulfilment(method) {
  if (method === "dine_in") return "Dine In";
  if (method === "delivery") return "Delivery";
  if (method === "collection") return "Collection";
  return "Takeaway";
}

const formatMoney = (val) =>
  Number(val || 0).toLocaleString("en-US", { style: "currency", currency: "KES" });

const formatPlainMoney = (val) =>
  Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (isoStr) => {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
};

function selectPrinterType(typeKey) {
  selectedPrinterType.value = typeKey;
  saveWorkstationPrinter(typeKey);
  printerDetectionSource.value = "This Terminal";
}

async function loadBusinessAndDetectPrinter() {
  try {
    const res = await businessApi.get();
    businessInfo.value = res.data?.data || null;
    if (businessInfo.value?.receipt?.copies) {
      printCopies.value = Number(businessInfo.value.receipt.copies) || 1;
    }
  } catch {
    // fallback gracefully
  }

  const detected = await detectActivePrinter(businessInfo.value);
  selectedPrinterType.value = detected.printerType;
  printerDetectionSource.value = detected.sourceLabel;
}

async function loadPostSaleLookups(order) {
  if (!order) return;
  const branchId = order.branch?.id || shiftStore.activeShift?.branch_id || shiftStore.selectedBranchId;

  if (order.fulfilment_method === "dine_in" && branchId) {
    try {
      const res = await tablesApi.list({ branch_id: branchId });
      branchTables.value = res.data?.data || res.data || [];
    } catch {
      branchTables.value = [];
    }
  }

  if (order.fulfilment_method === "delivery") {
    try {
      const res = await ridersApi.list({ is_active: 1 });
      ridersList.value = res.data?.data || [];
    } catch {
      ridersList.value = [];
    }
  }
}

function hydrateEditFields(order) {
  saveFeedback.value = "";
  showEnrichmentForm.value = false;
  isItemsExpanded.value = false;
  editCustomer.value = order?.customer ? { ...order.customer } : { ...WALK_IN_CUSTOMER };
  editKraPin.value = order?.tax_pin || order?.customer?.tax_pin || "";
  includeKraPinOnReceipt.value = Boolean(order?.tax_pin);
  editTableId.value = order?.table?.id || null;
  editDeliveryAddress.value = order?.delivery_address || order?.delivery?.delivery_address || "";
  editDeliveryArrangement.value = order?.delivery?.arrangement_type || "business_rider";
  editRiderId.value = order?.delivery?.rider_id || null;
  editCustomerRiderName.value = order?.delivery?.rider_name || "";
  editCustomerRiderPhone.value = order?.delivery?.rider_phone || "";
  editVehicleReg.value = order?.delivery?.vehicle_registration || "";
}

function onEditCustomerSelected(cust) {
  if (cust && cust.id) {
    editCustomer.value = cust;
    if (cust.tax_pin && !editKraPin.value) editKraPin.value = cust.tax_pin;
  } else {
    editCustomer.value = { ...WALK_IN_CUSTOMER };
  }
}

function onEditDeliveryLocationSelected(loc) {
  editDeliveryLocation.value = loc;
  if (loc?.location) editDeliveryAddress.value = loc.location;
}

async function savePostSaleDetails(forcePointsToast = false) {
  if (!currentOrder.value?.id || savingDetails.value) return;
  savingDetails.value = true;
  saveFeedback.value = "";
  const previousCustomerId = currentOrder.value?.customer?.id || null;

  try {
    const payload = {
      customer_id: editCustomer.value?.id || null,
      tax_pin: includeKraPinOnReceipt.value ? (editKraPin.value.trim() || null) : null,
    };

    if (currentOrder.value.fulfilment_method === "dine_in") {
      payload.table_id = editTableId.value || null;
    }

    if (currentOrder.value.fulfilment_method === "delivery") {
      payload.delivery_address = editDeliveryAddress.value.trim() || null;
      const chosenRider = ridersList.value.find((r) => String(r.id) === String(editRiderId.value));
      payload.delivery = {
        arrangement_type: editDeliveryArrangement.value,
        rider_id: editDeliveryArrangement.value === "business_rider" ? editRiderId.value : null,
        rider_name:
          editDeliveryArrangement.value === "business_rider"
            ? chosenRider?.full_name || null
            : editCustomerRiderName.value.trim() || null,
        rider_phone:
          editDeliveryArrangement.value === "business_rider"
            ? chosenRider?.phone || null
            : editCustomerRiderPhone.value.trim() || null,
        vehicle_registration: editVehicleReg.value.trim().toUpperCase() || null,
        delivery_address: editDeliveryAddress.value.trim() || null,
        latitude: editDeliveryLocation.value?.latitude ? Number(editDeliveryLocation.value.latitude) : null,
        longitude: editDeliveryLocation.value?.longitude ? Number(editDeliveryLocation.value.longitude) : null,
      };
    }

    const res = await salesApi.update(currentOrder.value.id, payload);
    if (res.data?.order) {
      const updated = res.data.order;
      currentOrder.value = updated;
      emit("order-updated", updated);
      saveFeedback.value = "Updated";
      showEnrichmentForm.value = false;

      // Show celebratory points/client assigned success popup when a client is attached
      const newCustomer = updated.customer;
      if (newCustomer?.id && (forcePointsToast || !previousCustomerId || String(previousCustomerId) !== String(newCustomer.id))) {
        showPointsSuccessPopup(newCustomer, updated);
      }
    }
  } catch (err) {
    console.error("Failed to update post-sale order details:", err);
  } finally {
    savingDetails.value = false;
  }
}

watch(
  () => props.order,
  (newOrder, oldOrder) => {
    currentOrder.value = newOrder ? { ...newOrder } : null;
    if (newOrder) {
      const isDifferentOrder = !oldOrder || String(oldOrder.id) !== String(newOrder.id);
      if (isDifferentOrder) {
        pointsAwardedBanner.value = "";
        hydrateEditFields(newOrder);
        loadPostSaleLookups(newOrder);
        loadBusinessAndDetectPrinter();
      }
    }
  },
  { immediate: true }
);

onMounted(() => {
  loadBusinessAndDetectPrinter();
});

const printReceipt = () => {
  const content = document.getElementById("printableReceiptArea");
  if (!content) return;

  const profile = activePrinterProfile.value;
  const isA4 = profile.key === "a4";
  const copiesHtml = Array.from({ length: Math.max(1, printCopies.value) })
    .map(
      (_, idx) =>
        `<div class="print-copy" ${idx > 0 ? 'style="page-break-before: always;"' : ""}>${content.innerHTML}</div>`
    )
    .join("");

  const winWidth = isA4 ? 900 : 420;
  const printWindow = window.open("", "_blank", `width=${winWidth},height=720`);
  if (!printWindow) return;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Receipt - ${currentOrder.value?.order_number || ""}</title>
        <style>
          ${profile.pageCss}
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: ${isA4 ? "0" : "2mm"};
            color: #000;
            background: #fff;
            font-family: ${isA4 ? "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" : "'Courier New', Courier, monospace"};
            font-size: ${profile.key === "thermal_58" ? "10px" : profile.key === "thermal_80" ? "11.5px" : "12px"};
            line-height: 1.35;
          }
          .thermal-sheet {
            width: ${profile.contentWidth} !important;
            margin: 0 auto !important;
          }
          .a4-receipt-sheet {
            width: 100% !important;
          }
          .d-flex { display: flex; }
          .flex-column { flex-direction: column; }
          .justify-content-between { justify-content: space-between; }
          .align-items-start { align-items: flex-start; }
          .align-items-end { align-items: flex-end; }
          .text-center { text-align: center; }
          .text-end { text-align: right; }
          .fw-bold { font-weight: 700; }
          .fw-semibold { font-weight: 600; }
          .text-uppercase { text-transform: uppercase; }
          .text-muted { color: #555; }
          .text-dark { color: #000; }
          .font-monospace { font-family: 'Courier New', Courier, monospace; }
          .tabular-nums { font-variant-numeric: tabular-nums; }
          .gap-1 { gap: 4px; }
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .mt-1 { margin-top: 4px; }
          .mt-2 { margin-top: 8px; }
          .my-2 { margin-top: 6px; margin-bottom: 6px; }
          .p-2 { padding: 8px; }
          .pt-1 { padding-top: 4px; }
          .pt-2 { padding-top: 8px; }
          .pt-3 { padding-top: 12px; }
          .pb-1 { padding-bottom: 4px; }
          .pb-2 { padding-bottom: 8px; }
          .py-1 { padding-top: 4px; padding-bottom: 4px; }
          .border-top { border-top: 1px solid #d1d5db; }
          .border-bottom { border-bottom: 1px solid #d1d5db; }
          .border { border: 1px solid #d1d5db; }
          .rounded { border-radius: 4px; }
          .receipt-dash { border-top: 1px dashed #333; }
          .receipt-dash-top { border-top: 1px dashed #333; }
          .row { display: flex; flex-wrap: wrap; }
          .col-6 { width: 50%; padding: 0 6px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th, td { border: 1px solid #d1d5db; padding: 5px 7px; }
          th { background: #f3f4f6; text-align: left; }
          img { max-width: 100%; }
        </style>
      </head>
      <body>${copiesHtml}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
};

const handleNewSale = () => {
  if (window.bootstrap && modalRef.value) {
    const modal = window.bootstrap.Modal.getInstance(modalRef.value);
    if (modal) modal.hide();
  }
  emit("new-sale");
};

async function attachCustomerAndSave(customer) {
  if (!customer?.id) return;
  editCustomer.value = { ...customer };
  if (customer.tax_pin && !editKraPin.value) {
    editKraPin.value = customer.tax_pin;
  }
  await savePostSaleDetails(true);
}

defineExpose({
  attachCustomerAndSave,
});
</script>

<style scoped>
.modal-round-close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  display: grid;
  place-items: center;
}

.modal-round-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.thermal-slip-card {
  position: relative;
  background-color: #fcfcfd;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 14px 16px;
  background-image: radial-gradient(circle at 6px 0, transparent 4px, transparent 4px);
}

.thermal-slip-card::before,
.thermal-slip-card::after {
  content: "";
  display: block;
  position: absolute;
  left: 10px;
  right: 10px;
  height: 4px;
  background-size: 10px 4px;
  background-repeat: repeat-x;
  pointer-events: none;
}

.thermal-slip-card::before {
  top: -1px;
  background-image: radial-gradient(circle at 5px 0, #ffffff 3px, transparent 3.5px);
}

.thermal-slip-card::after {
  bottom: -1px;
  background-image: radial-gradient(circle at 5px 4px, #ffffff 3px, transparent 3.5px);
}

.receipt-dash-top {
  border-top: 1px dashed #cbd5e1;
}

.receipt-dash-bottom {
  border-bottom: 1px dashed #cbd5e1;
}

.thermal-dotted-leader {
  border-bottom: 1px dotted rgba(100, 116, 139, 0.45);
  min-width: 14px;
  transform: translateY(-2px);
}

.thermal-items-collapsed {
  max-height: 62px;
  overflow: hidden;
}

.thermal-fog-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 34px;
  background: linear-gradient(
    to bottom,
    rgba(252, 252, 253, 0) 0%,
    rgba(252, 252, 253, 0.85) 60%,
    #fcfcfd 100%
  );
  pointer-events: none;
}

.golden-points-ribbon {
  position: relative;
  overflow: hidden;
}

.golden-points-ribbon::after {
  content: "";
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.55) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: skewX(-22deg);
  animation: goldenSheen 2.8s ease-in-out infinite;
  pointer-events: none;
}

@keyframes goldenSheen {
  0% {
    left: -75%;
  }
  45%,
  100% {
    left: 135%;
  }
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
