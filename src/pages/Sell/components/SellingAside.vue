<template>
  <!-- Hidden toggle button for programmatic triggering -->
  <button
    class="btn btn-primary d-none"
    type="button"
    data-bs-toggle="offcanvas"
    data-bs-target="#sellingAside"
    ref="toggleBtnRef"
  >
    Toggle Selling Aside
  </button>

  <!-- Redesigned PaySol Checkout & Payment Offcanvas (Matches Cart width on desktop, responsive on tablet/mobile) -->
  <div
    class="offcanvas offcanvas-end selling-checkout-offcanvas"
    tabindex="-1"
    id="sellingAside"
    ref="offcanvasRef"
  >
    <!-- Header -->
    <div class="offcanvas-header border-bottom py-3 px-4 bg-white gap-2">
      <div class="d-flex align-items-center gap-2 min-w-0 flex-grow-1 overflow-hidden">
        <div
          class="d-flex align-items-center justify-content-center rounded-2 bg-primary-subtle text-primary border border-primary-subtle flex-shrink-0"
          style="width: 36px; height: 36px;"
        >
          <Icon icon="ri:secure-payment-line" class="fs-5" />
        </div>
        <div class="min-w-0 flex-grow-1">
          <div class="d-flex align-items-center gap-2 flex-wrap min-w-0">
            <h5 class="mb-0 fw-bold font-size-15 text-dark text-nowrap">Checkout &amp; Payment</h5>
            <span
              v-if="tabId"
              class="badge bg-primary-subtle text-primary border border-primary-subtle font-size-10 fw-semibold text-truncate"
              style="max-width: 100%;"
              :title="tabLabel || 'Open Tab'"
            >
              {{ jointTabs.length > 1 ? `Settling ${jointTabs.length} Tabs` : `Settling ${tabLabel || 'Open Tab'}` }}
            </span>
          </div>
          <p class="m-0 text-muted font-size-11 text-truncate">
            Confirm order details, fulfilment &amp; payment allocation
          </p>
        </div>
      </div>
      <button
        type="button"
        class="btn-close text-reset shadow-none font-size-11 flex-shrink-0 ms-1"
        data-bs-dismiss="offcanvas"
        aria-label="Close"
        :disabled="isSubmitting"
      ></button>
    </div>

    <!-- Scrollable Body -->
    <div class="offcanvas-body p-0 d-flex flex-column" style="overflow-y: auto; background-color: #ffffff;">
      <div class="p-3 d-flex flex-column gap-3">
        <!-- 0. JOINT MULTI-TAB SETTLEMENT BREAKDOWN (when settling 2+ Open Tabs together) -->
        <div
          v-if="jointTabs.length > 1"
          class="rounded border p-3 d-flex flex-column gap-2"
          style="background-color: #f8fafc; border-color: #cbd5e1 !important;"
        >
          <div class="d-flex align-items-center justify-content-between">
            <span class="text-uppercase fw-bold font-size-11 text-primary d-inline-flex align-items-center gap-1" style="letter-spacing: 0.4px;">
              <Icon icon="ri:stack-line" class="fs-6" />
              <span>Joint Tab Settlement ({{ jointTabs.length }} Tabs)</span>
            </span>
            <span class="badge bg-primary-subtle text-primary font-size-10 fw-semibold">Oldest First</span>
          </div>
          <div class="d-flex flex-column gap-1 font-size-12">
            <div
              v-for="jt in jointTabs"
              :key="jt.id"
              class="d-flex align-items-center justify-content-between gap-2 py-1 border-bottom"
            >
              <div class="min-w-0 text-truncate">
                <span class="font-monospace fw-bold text-dark">{{ jt.tab_number }}</span>
                <span v-if="jt.customer?.name || jt.name" class="text-muted ms-1">
                  · {{ jt.customer?.name || jt.name }}
                </span>
              </div>
              <span class="fw-bold text-dark tabular-nums flex-shrink-0">
                {{ formatMoney(jt.balance_due ?? jt.total_amount) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 1. PROMINENT FINANCIAL PAYMENT SUMMARY -->
        <div class="rounded overflow-hidden checkout-section-box">
          <div class="px-3 py-2 border-bottom d-flex align-items-center justify-content-between" style="background-color: #f8fafc; border-color: #dbe2ea !important;">
            <span class="text-uppercase fw-bold font-size-11 text-muted" style="letter-spacing: 0.4px;">
              Payment Summary
            </span>
            <span class="badge bg-white text-dark border font-size-11 fw-semibold rounded-pill">
              {{ itemCount }} item{{ itemCount === 1 ? '' : 's' }}
            </span>
          </div>

          <div class="px-3 py-2 d-flex flex-column gap-1 font-size-12">
            <div class="d-flex justify-content-between text-muted py-1 checkout-summary-row">
              <span>Subtotal</span>
              <span class="fw-semibold text-dark tabular-nums">{{ formatMoney(subtotal) }}</span>
            </div>
            <div v-if="totalDiscounts > 0" class="d-flex justify-content-between text-success py-1 checkout-summary-row">
              <span>Discounts</span>
              <span class="fw-semibold tabular-nums">-{{ formatMoney(totalDiscounts) }}</span>
            </div>
            <div v-if="taxAmount > 0" class="d-flex justify-content-between text-muted py-1 checkout-summary-row">
              <span>Tax</span>
              <span class="fw-semibold text-dark tabular-nums">{{ formatMoney(taxAmount) }}</span>
            </div>
            <div
              v-if="activeOrderTypeOption.usesDelivery && Number(deliveryFeeInput) > 0"
              class="d-flex justify-content-between text-muted py-1 checkout-summary-row"
            >
              <span>Delivery Fee</span>
              <span class="fw-semibold text-dark tabular-nums">{{ formatMoney(deliveryFeeInput) }}</span>
            </div>
            <div
              v-if="Number(alreadyPaid) > 0"
              class="d-flex justify-content-between text-success py-1 checkout-summary-row"
            >
              <span>Already Paid on Tab{{ jointTabs.length > 1 ? 's' : '' }}</span>
              <span class="fw-semibold tabular-nums">-{{ formatMoney(alreadyPaid) }}</span>
            </div>
          </div>

          <div
            class="px-3 py-3 border-top d-flex align-items-center justify-content-between"
            style="background-color: #f8fafc; border-color: #dbe2ea !important;"
          >
            <div>
              <div class="text-uppercase fw-bold font-size-11 text-primary" style="letter-spacing: 0.5px;">
                Amount Payable
              </div>
              <small v-if="isSplitPayment && remainingSplitBalance > 0" class="text-danger font-size-11 fw-semibold">
                Remaining: {{ formatMoney(remainingSplitBalance) }}
              </small>
              <small v-else-if="isSplitPayment" class="text-success font-size-11 fw-semibold">
                Fully allocated ({{ splitTenders.length }} methods)
              </small>
            </div>
            <div class="fw-bold text-dark tabular-nums" style="font-size: 24px; line-height: 1;">
              {{ formatMoney(effectiveTotal) }}
            </div>
          </div>
        </div>

        <!-- 2. ORDER TYPE SELECTION (Consistent with Open Tabs Aside 2-col button selector) -->
        <div class="rounded checkout-section-box bg-white">
          <div class="p-3">
            <label class="form-label fw-bold font-size-12 text-dark mb-2">
              {{ orderTypeProfile.fieldTitle }} <span class="text-danger">*</span>
            </label>
            <div class="row g-2">
              <div v-for="opt in orderTypeProfile.options" :key="opt.key" class="col-6">
                <button
                  type="button"
                  class="btn w-100 py-2 px-2 d-flex align-items-center justify-content-center gap-2 font-size-12 fw-semibold order-type-btn"
                  :class="selectedOrderTypeKey === opt.key ? 'btn-outline-muted-primary is-active' : 'btn-white text-dark'"
                  @click="selectOrderType(opt)"
                >
                  <Icon :icon="opt.icon" class="fs-5 flex-shrink-0" />
                  <span class="text-truncate">{{ opt.label }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 3. DELIVERY MANAGEMENT & REUSABLE RIDER ASSIGNMENT (Shown only for Delivery) -->
          <div v-if="activeOrderTypeOption.usesDelivery" class="p-3 border-top d-flex flex-column gap-3" style="background-color: #f8fafc; border-color: #dbe2ea !important;">
            <!-- Delivery Location + Map + Distance/ETA -->
            <div>
              <label class="form-label font-size-12 fw-bold text-dark d-flex align-items-center gap-1 mb-1">
                <Icon icon="ri:map-pin-2-line" class="fs-5 text-primary" />
                <span>{{ activeOrderTypeOption.deliveryLabel || 'Delivery Address' }}</span>
              </label>
              <GoogleLocationInput
                v-model="deliveryAddress"
                placeholder="Search delivery address or landmark..."
                @location-selected="onDeliveryLocationSelected"
                @location-cleared="onDeliveryLocationCleared"
              />

              <GoogleMapPreview
                v-if="deliveryLocation?.latitude && deliveryLocation?.longitude"
                :latitude="deliveryLocation.latitude"
                :longitude="deliveryLocation.longitude"
                :label="deliveryAddress || 'Delivery Destination'"
                height="120"
                class="mt-2"
              />

              <!-- Live Distance & ETA Strip -->
              <div v-if="deliveryLocation?.latitude && deliveryLocation?.longitude" class="mt-2">
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
                  <small class="text-muted font-size-11">from {{ deliveryOrigin?.name || 'Branch' }}</small>
                </div>
              </div>

              <div class="row g-2 mt-2">
                <div class="col-5">
                  <label class="form-label font-size-11 text-muted mb-1 fw-semibold">Delivery Fee (KES)</label>
                  <input
                    v-model.number="deliveryFeeInput"
                    type="number"
                    min="0"
                    step="any"
                    class="form-control form-control-sm"
                    placeholder="0.00"
                  />
                </div>
                <div class="col-7">
                  <label class="form-label font-size-11 text-muted mb-1 fw-semibold">Building / Door / Directions</label>
                  <input
                    v-model="deliveryDirections"
                    type="text"
                    class="form-control form-control-sm"
                    placeholder="e.g. Apt 4B, Gate 2"
                  />
                </div>
              </div>
            </div>

            <!-- Delivery Arrangement & Reusable Rider Selector -->
            <div class="pt-3 border-top" style="border-color: #dbe2ea !important;">
              <label class="form-label font-size-12 fw-bold text-dark d-flex align-items-center gap-1 mb-2">
                <Icon icon="ri:e-bike-2-line" class="fs-5 text-primary" />
                <span>Delivery Fulfilment &amp; Rider</span>
              </label>

              <div class="d-flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  class="btn btn-sm btn-rounded fw-semibold px-3"
                  :class="deliveryArrangement === 'business_rider' ? 'btn-primary text-white' : 'btn-white border text-dark'"
                  @click="deliveryArrangement = 'business_rider'"
                >
                  Registered Rider
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-rounded fw-semibold px-3"
                  :class="deliveryArrangement === 'customer_rider' ? 'btn-primary text-white' : 'btn-white border text-dark'"
                  @click="deliveryArrangement = 'customer_rider'"
                >
                  Customer's Transport
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-rounded fw-semibold px-3"
                  :class="deliveryArrangement === 'customer_pickup' ? 'btn-primary text-white' : 'btn-white border text-dark'"
                  @click="deliveryArrangement = 'customer_pickup'"
                >
                  Customer Pickup
                </button>
              </div>

              <!-- Mode A: Registered Rider (Searchable + Quick Register + Multi-Vehicle) -->
              <template v-if="deliveryArrangement === 'business_rider'">
                <div v-if="loadingRiders" class="py-1">
                  <SkeletonLoader type="text" :lines="2" height="16px" />
                </div>
                <div v-else class="d-flex flex-column gap-2">
                  <div>
                    <div class="d-flex align-items-center justify-content-between mb-1">
                      <label class="form-label font-size-11 text-muted fw-semibold mb-0">Select Rider</label>
                      <button
                        type="button"
                        class="btn btn-link btn-sm p-0 font-size-11 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                        @click="showRiderModal = true"
                      >
                        <Icon icon="ri:add-line" />
                        <span>Register Rider</span>
                      </button>
                    </div>
                    <SelectSearchBox
                      v-model="selectedRiderId"
                      :options="riderSelectOptions"
                      placeholder="Search rider by name, phone or plate..."
                      show-create
                      create-text="Register New Rider"
                      create-modal-id=""
                      input-class="form-control form-select"
                      @update:modelValue="onRiderSelected"
                      @create="showRiderModal = true"
                    />
                  </div>

                  <!-- Selected Rider Details + Staff & Delivery Provider badges -->
                  <div v-if="selectedRider" class="p-2 px-3 rounded border bg-white d-flex flex-column gap-2">
                    <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                      <div class="d-flex align-items-center gap-2 min-w-0">
                        <span class="fw-bold font-size-13 text-dark text-truncate">{{ selectedRider.full_name }}</span>
                        <span
                          v-if="selectedRider.is_staff"
                          class="badge bg-success-subtle text-success border border-success-subtle font-size-10 fw-semibold"
                        >
                          Staff
                        </span>
                        <span
                          v-else
                          class="badge bg-light text-muted border font-size-10 fw-semibold"
                        >
                          External
                        </span>
                      </div>
                      <span v-if="selectedRider.delivery_provider" class="font-size-11 text-muted">
                        {{ selectedRider.delivery_provider.name }}
                      </span>
                    </div>

                    <!-- Vehicle Registration Input with Rider's Associated Plates -->
                    <div class="pt-2 border-top" style="border-color: #eef2f7 !important;">
                      <label class="form-label font-size-11 text-muted fw-semibold mb-1">
                        Vehicle Number Plate <span class="fw-normal">(Optional)</span>
                      </label>
                      <input
                        v-model="vehicleRegistrationInput"
                        type="text"
                        list="riderVehicleSuggestions"
                        class="form-control form-control-sm text-uppercase font-monospace"
                        placeholder="Type or select plate e.g. KMFQ 123A"
                        maxlength="40"
                        @input="vehicleRegistrationInput = vehicleRegistrationInput.toUpperCase()"
                      />
                      <datalist id="riderVehicleSuggestions">
                        <option
                          v-for="v in selectedRider.vehicles || []"
                          :key="v.id"
                          :value="v.registration_number"
                        />
                      </datalist>

                      <!-- Clickable Associated Vehicle Chips -->
                      <div v-if="(selectedRider.vehicles || []).length > 0" class="d-flex flex-wrap gap-1 mt-2">
                        <button
                          v-for="v in selectedRider.vehicles"
                          :key="v.id"
                          type="button"
                          class="btn btn-sm btn-rounded font-monospace font-size-11 py-0 px-2"
                          :class="vehicleRegistrationInput.trim().toUpperCase() === v.registration_number ? 'btn-primary text-white' : 'btn-light border text-dark'"
                          @click="vehicleRegistrationInput = v.registration_number"
                        >
                          {{ v.registration_number }}
                        </button>
                      </div>

                      <!-- Optional: Save new plate to rider -->
                      <div v-if="isNewVehicleForRider" class="form-check mt-2 mb-0">
                        <input
                          id="saveVehicleToRiderChk"
                          v-model="saveVehicleToRider"
                          type="checkbox"
                          class="form-check-input"
                        />
                        <label class="form-check-label font-size-11 text-muted" for="saveVehicleToRiderChk">
                          Save <strong>{{ vehicleRegistrationInput.trim() }}</strong> to {{ selectedRider.full_name }}'s vehicles for future orders
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Mode B: Customer's Own Rider / Transport -->
              <template v-else-if="deliveryArrangement === 'customer_rider'">
                <div class="row g-2">
                  <div class="col-12">
                    <label class="form-label font-size-11 text-muted fw-semibold mb-1">Delivery Provider</label>
                    <SelectSearchBox
                      v-model="customerDeliveryProviderId"
                      :options="providerSelectOptions"
                      placeholder="e.g. Customer-Arranged Transport / Taxi"
                    />
                  </div>
                  <div class="col-6">
                    <label class="form-label font-size-11 text-muted fw-semibold mb-1">Rider / Driver Name</label>
                    <input
                      v-model.trim="customerRiderName"
                      type="text"
                      class="form-control form-control-sm"
                      placeholder="Optional"
                    />
                  </div>
                  <div class="col-6">
                    <label class="form-label font-size-11 text-muted fw-semibold mb-1">Phone</label>
                    <input
                      v-model.trim="customerRiderPhone"
                      type="text"
                      class="form-control form-control-sm"
                      placeholder="Optional"
                    />
                  </div>
                  <div class="col-12">
                    <label class="form-label font-size-11 text-muted fw-semibold mb-1">Vehicle Plate (Optional)</label>
                    <input
                      v-model="vehicleRegistrationInput"
                      type="text"
                      class="form-control form-control-sm text-uppercase font-monospace"
                      placeholder="e.g. KDA 456B"
                      @input="vehicleRegistrationInput = vehicleRegistrationInput.toUpperCase()"
                    />
                  </div>
                </div>
              </template>

              <!-- Mode C: Customer Pickup -->
              <template v-else>
                <ReferenceAlert
                  tone="info"
                  bordered
                  icon="ri:shopping-bag-3-line"
                  title="Customer Pickup"
                  message="Customer will collect this order directly. No rider assignment required."
                />
              </template>
            </div>
          </div>
        </div>

        <!-- 4. PAYMENT METHOD SELECTION & SPLIT PAYMENTS (Primary Action Section) -->
        <div class="rounded checkout-payment-box bg-white overflow-hidden">
          <div class="checkout-payment-header px-3 py-2 d-flex align-items-center justify-content-between gap-2 flex-wrap">
            <div class="d-flex align-items-center gap-2">
              <span class="checkout-payment-icon rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0">
                <Icon icon="ri:wallet-3-line" class="fs-6" />
              </span>
              <div class="d-flex align-items-center gap-2">
                <span class="fw-bold font-size-13 text-dark">
                  Payment Method
                </span>
                <span v-if="configuredMethods.length" class="badge bg-white text-primary border border-primary-subtle font-size-10 fw-semibold">
                  {{ configuredMethods.length }} active
                </span>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2">
              <button
                v-if="canManagePaymentMethods"
                type="button"
                class="btn btn-sm btn-white border font-size-11 fw-semibold d-inline-flex align-items-center gap-1"
                @click="showPaymentMethodModal = true"
              >
                <Icon icon="ri:add-line" />
                <span>Add Channel</span>
              </button>
              <button
                type="button"
                class="btn btn-sm font-size-11 fw-semibold d-inline-flex align-items-center gap-1"
                :class="isSplitPayment ? 'btn-primary text-white' : 'btn-white border text-dark'"
                :disabled="!canSplitPayment"
                :title="canSplitPayment ? 'Split payment across multiple channels' : 'Add at least 2 payment channels to split a payment'"
                @click="toggleSplitPayment"
              >
                <Icon icon="ri:split-cells-horizontal" />
                <span>Split Payment</span>
              </button>
            </div>
          </div>

          <div class="p-3 d-flex flex-column gap-3">
            <!-- Loading Skeleton for Payment Methods -->
            <div v-if="loadingMethods" class="py-1">
              <SkeletonLoader type="text" :lines="3" height="18px" />
            </div>

            <!-- No payment methods configured yet -->
            <div v-else-if="configuredMethods.length === 0">
              <ReferenceAlert
                tone="warning"
                bordered
                icon="ri:bank-card-line"
                title="No Payment Channels Configured"
                message="Configure at least one payment channel (Cash, M-Pesa, Bank, or Card) to receive payments."
              />
              <div class="mt-2 d-flex gap-2">
                <button
                  v-if="canManagePaymentMethods"
                  type="button"
                  class="btn btn-sm btn-primary fw-semibold"
                  @click="showPaymentMethodModal = true"
                >
                  + Add Payment Channel
                </button>
                <router-link to="/payment-methods" class="btn btn-sm btn-white border fw-semibold">
                  Go to Payment Settings
                </router-link>
              </div>
            </div>

            <!-- SINGLE PAYMENT MODE -->
            <template v-else-if="!isSplitPayment">
              <!-- Searchable Payment Channel Dropdown (with M-PESA / Bank logos, Cash icon & Account Numbers) -->
              <div>
                <SelectSearchBox
                  v-model="selectedMethodId"
                  :options="paymentMethodSelectOptions"
                  :show-images="true"
                  placeholder="Search or select payment channel..."
                  :show-create="canManagePaymentMethods"
                  create-text="Add Payment Method"
                  create-modal-id=""
                  input-class="form-control form-select"
                  @update:modelValue="onPaymentMethodDropdownSelect"
                  @create="showPaymentMethodModal = true"
                />
              </div>

              <!-- M-PESA INTELLIGENT CHANNEL PANEL (Circular Logos/Icons for Configured M-PESA Types) -->
              <div v-if="activeTypeCategory === 'mpesa'" class="d-flex flex-column gap-3">
                <!-- M-PESA Sub-channels with circular logos/icons -->
                <div v-if="mpesaMethods.length > 0">
                  <label class="form-label font-size-11 text-muted fw-semibold mb-2">
                    Configured M-PESA Channels
                  </label>
                  <div class="d-flex flex-column gap-2">
                    <div
                      v-for="m in mpesaMethods"
                      :key="m.id"
                      role="button"
                      tabindex="0"
                      class="p-2 px-3 rounded border d-flex align-items-center justify-content-between gap-2 cursor-pointer"
                      :class="selectedMethodId === m.id ? 'border-primary bg-primary-subtle' : 'bg-white'"
                      @click="selectPaymentMethod(m)"
                    >
                      <div class="d-flex align-items-center gap-2 min-w-0">
                        <img
                          v-if="getChannelLogo(m)"
                          :src="getChannelLogo(m)"
                          :alt="m.name"
                          class="rounded-circle flex-shrink-0"
                          style="width: 34px; height: 34px; object-fit: contain;"
                        />
                        <span
                          v-else
                          class="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0"
                          :class="getMpesaCircleClass(m.type)"
                          style="width: 34px; height: 34px;"
                        >
                          <Icon :icon="getMpesaIcon(m.type)" class="fs-5" />
                        </span>
                        <div class="min-w-0">
                          <div class="fw-bold font-size-13 text-dark text-truncate">{{ m.name }}</div>
                          <small class="text-muted font-size-11 d-block text-truncate">
                            {{ getMpesaTypeSubtitle(m) }}
                          </small>
                        </div>
                      </div>
                      <span
                        v-if="m.integration_status?.stk_push_available"
                        class="badge bg-success-subtle text-success font-size-10 fw-semibold flex-shrink-0"
                      >
                        STK Ready
                      </span>
                      <span
                        v-else
                        class="badge bg-light text-muted border font-size-10 fw-semibold flex-shrink-0"
                      >
                        Manual
                      </span>
                    </div>
                  </div>
                </div>

                <!-- STK Push vs Manual Code Tabs -->
                <div class="rounded border bg-white" style="border-color: #cbd5e1 !important;">
                  <ul class="nav nav-tabs nav-tabs-custom nav-justified border-bottom mb-0" role="tablist">
                    <li class="nav-item">
                      <button
                        type="button"
                        class="nav-link fw-semibold font-size-12 py-2 d-flex align-items-center justify-content-center gap-1"
                        :class="{ active: mpesaEntryMode === 'stk' }"
                        @click="mpesaEntryMode = 'stk'"
                      >
                        <Icon icon="ri:smartphone-line" class="fs-6" />
                        <span>STK Push</span>
                      </button>
                    </li>
                    <li class="nav-item">
                      <button
                        type="button"
                        class="nav-link fw-semibold font-size-12 py-2 d-flex align-items-center justify-content-center gap-1"
                        :class="{ active: mpesaEntryMode === 'manual' }"
                        @click="mpesaEntryMode = 'manual'"
                      >
                        <Icon icon="ri:receipt-line" class="fs-6" />
                        <span>Transaction Code</span>
                      </button>
                    </li>
                  </ul>

                  <!-- STK Push Pane -->
                  <div v-if="mpesaEntryMode === 'stk'" class="p-3 d-flex flex-column gap-2">
                    <template v-if="selectedMethodObject?.integration_status?.stk_push_available">
                      <div>
                        <label class="form-label font-size-12 fw-bold text-dark mb-1">Customer M-PESA Number</label>
                        <input
                          v-model.trim="mpesaPhone"
                          type="tel"
                          class="form-control font-monospace"
                          placeholder="0712 345 678"
                        />
                      </div>
                      <div class="d-flex justify-content-between font-size-12 text-muted">
                        <span>Amount to Request</span>
                        <strong class="text-dark">{{ formatMoney(effectiveTotal) }}</strong>
                      </div>
                    </template>
                    <template v-else>
                      <ReferenceAlert
                        tone="info"
                        bordered
                        icon="ri:plug-line"
                        title="M-PESA Integration Required"
                        message="STK Push requires an active Safaricom Daraja integration for this channel. Configure it in Payment Settings or use Transaction Code to record a manual reference."
                      />
                      <div class="d-flex align-items-center justify-content-between gap-2 pt-1">
                        <router-link
                          to="/payment-methods"
                          class="btn btn-sm btn-white border fw-semibold d-inline-flex align-items-center gap-1"
                        >
                          <Icon icon="ri:settings-3-line" />
                          <span>Configure Integration</span>
                        </router-link>
                        <button
                          type="button"
                          class="btn btn-sm btn-primary fw-semibold"
                          @click="mpesaEntryMode = 'manual'"
                        >
                          Enter Transaction Code
                        </button>
                      </div>
                    </template>
                  </div>

                  <!-- Manual M-PESA Transaction Code Pane -->
                  <div v-else class="p-3 d-flex flex-column gap-2">
                    <div>
                      <label class="form-label font-size-12 fw-bold text-dark mb-1">
                        M-PESA Transaction Code <span class="text-danger">*</span>
                      </label>
                      <input
                        v-model="mpesaReference"
                        type="text"
                        class="form-control font-monospace text-uppercase fw-bold"
                        placeholder="e.g. UFK89A2B1C"
                        maxlength="30"
                        @input="mpesaReference = mpesaReference.toUpperCase()"
                      />
                    </div>
                    <ReferenceAlert
                      tone="warning"
                      bordered
                      icon="ri:time-line"
                      title="Pending Verification"
                      message="Without live M-PESA integration, this payment will be recorded as Pending Verification until confirmed during reconciliation."
                    />
                  </div>
                </div>
              </div>

              <!-- CASH PANEL -->
              <div v-else-if="activeTypeCategory === 'cash'" class="p-3 rounded border d-flex flex-column gap-3" style="background-color: #f8fafc; border-color: #cbd5e1 !important;">
                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label font-size-12 fw-bold text-dark mb-1">Amount Received (KES)</label>
                    <input
                      v-model.number="cashTendered"
                      type="number"
                      min="0"
                      step="any"
                      class="form-control fw-bold font-size-16 tabular-nums"
                      placeholder="0.00"
                      ref="cashInputRef"
                    />
                  </div>
                  <div class="col-6">
                    <label class="form-label font-size-12 fw-bold text-dark mb-1">Change Due (KES)</label>
                    <input
                      :value="formatPlainMoney(cashChange)"
                      type="text"
                      class="form-control fw-bold font-size-16 bg-white tabular-nums"
                      :class="cashChange > 0 ? 'text-success' : 'text-dark'"
                      readonly
                    />
                  </div>
                </div>

                <div v-if="cashShortfall > 0" class="text-danger font-size-12 fw-semibold d-flex align-items-center gap-1">
                  <Icon icon="ri:error-warning-line" />
                  <span>Short by {{ formatMoney(cashShortfall) }}. Enter full amount or use Split Payment.</span>
                </div>

                <div class="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="btn btn-sm btn-rounded fw-bold px-3"
                    :class="Number(cashTendered) === effectiveTotal ? 'btn-primary text-white' : 'btn-white border text-dark'"
                    @click="cashTendered = effectiveTotal"
                  >
                    Exact ({{ formatPlainMoney(effectiveTotal) }})
                  </button>
                  <button
                    v-for="preset in kenyanCashPresets"
                    :key="preset"
                    type="button"
                    class="btn btn-sm btn-rounded fw-semibold px-3 tabular-nums"
                    :class="Number(cashTendered) === preset ? 'btn-primary text-white' : 'btn-white border text-dark'"
                    @click="cashTendered = preset"
                  >
                    KES {{ preset.toLocaleString('en-US') }}
                  </button>
                </div>
              </div>

              <!-- BANK / CARD PANEL -->
              <div v-else class="p-3 rounded border d-flex flex-column gap-2" style="background-color: #f8fafc; border-color: #cbd5e1 !important;">
                <div class="font-size-12 text-muted">
                  Channel: <strong class="text-dark">{{ selectedMethodObject?.name }}</strong>
                  <span v-if="selectedMethodObject?.identifier"> · {{ selectedMethodObject.identifier }}</span>
                </div>
                <div>
                  <label class="form-label font-size-12 fw-bold text-dark mb-1">
                    Transaction / Approval Reference <span class="text-danger">*</span>
                  </label>
                  <input
                    v-model="bankReference"
                    type="text"
                    class="form-control font-monospace text-uppercase"
                    placeholder="e.g. AUTH / Slip / Transfer Ref"
                    maxlength="40"
                    @input="bankReference = bankReference.toUpperCase()"
                  />
                </div>
                <small class="text-muted font-size-11">
                  Recorded as Pending Verification with reference preserved for reconciliation.
                </small>
              </div>
            </template>

            <!-- SPLIT PAYMENT MODE -->
            <template v-else>
              <div class="d-flex flex-column gap-2">
                <div
                  v-for="(split, idx) in splitTenders"
                  :key="idx"
                  class="p-3 rounded border bg-white d-flex flex-column gap-2"
                  style="border-color: #cbd5e1 !important;"
                >
                  <div class="d-flex align-items-center justify-content-between gap-2">
                    <div class="d-flex align-items-center gap-2">
                      <span class="badge bg-light text-dark border font-size-11 fw-bold">Payment #{{ idx + 1 }}</span>
                      <span
                        class="badge font-size-10 fw-semibold"
                        :class="split.method === 'cash' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'"
                      >
                        {{ split.method === 'cash' ? 'Instant (Cash)' : 'Pending Verification' }}
                      </span>
                    </div>
                    <button
                      v-if="splitTenders.length > 1"
                      type="button"
                      class="btn btn-link btn-sm text-danger p-0 text-decoration-none font-size-11 fw-semibold"
                      @click="removeSplitRow(idx)"
                    >
                      Remove
                    </button>
                  </div>

                  <div class="row g-2">
                    <div class="col-7">
                      <label class="form-label font-size-11 text-muted fw-semibold mb-1">Payment Channel</label>
                      <select
                        v-model="split.payment_method_id"
                        class="form-select form-select-sm"
                        @change="onSplitMethodChange(split)"
                      >
                        <option v-for="m in configuredMethods" :key="m.id" :value="m.id">
                          {{ m.name }}{{ getChannelSubtitle(m) ? ` (${getChannelSubtitle(m)})` : '' }}
                        </option>
                      </select>
                    </div>
                    <div class="col-5">
                      <label class="form-label font-size-11 text-muted fw-semibold mb-1">Amount (KES)</label>
                      <input
                        v-model.number="split.amount"
                        type="number"
                        min="0"
                        step="any"
                        class="form-control form-control-sm fw-bold tabular-nums"
                      />
                    </div>
                  </div>

                  <div v-if="split.method === 'cash'" class="row g-2">
                    <div class="col-6">
                      <label class="form-label font-size-11 text-muted fw-semibold mb-1">Cash Received</label>
                      <input
                        v-model.number="split.tendered_amount"
                        type="number"
                        min="0"
                        step="any"
                        class="form-control form-control-sm tabular-nums"
                      />
                    </div>
                    <div class="col-6">
                      <label class="form-label font-size-11 text-muted fw-semibold mb-1">Change Due</label>
                      <input
                        :value="formatPlainMoney(Math.max(0, (Number(split.tendered_amount) || 0) - (Number(split.amount) || 0)))"
                        type="text"
                        class="form-control form-control-sm bg-light tabular-nums"
                        readonly
                      />
                    </div>
                  </div>

                  <div v-else>
                    <label class="form-label font-size-11 text-muted fw-semibold mb-1">
                      Transaction Reference <span class="text-danger">*</span>
                    </label>
                    <input
                      v-model="split.external_reference"
                      type="text"
                      class="form-control form-control-sm font-monospace text-uppercase"
                      placeholder="e.g. M-PESA Code / Slip Ref"
                      @input="split.external_reference = split.external_reference.toUpperCase()"
                    />
                  </div>
                </div>

                <div class="d-flex align-items-center justify-content-between pt-1">
                  <button
                    type="button"
                    class="btn btn-sm btn-white border fw-semibold d-inline-flex align-items-center gap-1"
                    @click="addSplitRow"
                  >
                    <Icon icon="ri:add-line" />
                    <span>Add Payment Method</span>
                  </button>
                  <div class="font-size-12">
                    <span class="text-muted">Allocated: </span>
                    <strong :class="Math.abs(splitAllocatedTotal - effectiveTotal) < 0.01 ? 'text-success' : 'text-danger'">
                      {{ formatMoney(splitAllocatedTotal) }}
                    </strong>
                    <span class="text-muted"> / {{ formatMoney(effectiveTotal) }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 5. CUSTOMER & TAX DETAILS (Clearly Optional & Collapsible) -->
        <div class="rounded checkout-optional-box p-3 d-flex flex-column gap-2">
          <button
            type="button"
            class="btn btn-link p-0 text-decoration-none d-flex align-items-center justify-content-between gap-2 w-100 text-start"
            @click="showCustomerDetails = !showCustomerDetails"
          >
            <div class="d-flex align-items-center gap-2 min-w-0">
              <Icon icon="ri:user-line" class="text-muted flex-shrink-0" />
              <span class="text-uppercase fw-bold font-size-11 text-muted" style="letter-spacing: 0.4px;">
                Customer &amp; Tax Details
              </span>
              <span class="badge bg-white text-muted border font-size-10 fw-semibold">
                Optional
              </span>
            </div>
            <div class="d-flex align-items-center gap-1 flex-shrink-0">
              <span class="font-size-11 text-muted text-truncate" style="max-width: 150px;">
                {{ activeCustomer?.id ? activeCustomer.name : (kraPin ? `PIN: ${kraPin}` : 'Walk-in') }}
              </span>
              <Icon
                :icon="showCustomerDetails ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'"
                class="text-muted fs-5"
              />
            </div>
          </button>

          <div v-if="showCustomerDetails" class="d-flex flex-column gap-2 pt-2 border-top">
            <CustomerPicker
              :model-value="activeCustomer"
              :allow-change="true"
              :show-callout="true"
              @select="onCheckoutCustomerSelected"
              @open-profile="openCustomerProfileModal"
              @view-bills="$emit('view-customer-bills', activeCustomer)"
              @register-new="$emit('register-customer')"
            />

            <div class="pt-1">
              <div class="form-check mb-0">
                <input
                  id="sellingIncludeKraPin"
                  v-model="includeKraPinOnReceipt"
                  type="checkbox"
                  class="form-check-input"
                />
                <label class="form-check-label font-size-12 fw-semibold text-dark cursor-pointer" for="sellingIncludeKraPin">
                  Include KRA PIN on receipt
                </label>
              </div>
              <div v-if="includeKraPinOnReceipt" class="mt-2">
                <input
                  v-model="kraPin"
                  type="text"
                  class="form-control form-control-sm text-uppercase font-monospace bg-white"
                  placeholder="e.g. P051234567X"
                  maxlength="11"
                  @input="kraPin = kraPin.toUpperCase()"
                />
                <small class="text-muted font-size-10 d-block mt-1">
                  Printed on the customer receipt and saved to the customer profile.
                </small>
              </div>
            </div>
          </div>
        </div>

        <!-- 6. OPTIONAL CHECKOUT NOTES (Visually secondary) -->
        <div>
          <label class="form-label font-size-11 text-muted fw-semibold mb-1">
            Order / Payment Notes <span class="fw-normal">(Optional)</span>
          </label>
          <textarea
            v-model="saleNotes"
            rows="2"
            class="form-control form-control-sm"
            placeholder="Delivery remarks, payment notes, or special customer requests..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Pinned Checkout Action Footer -->
    <div class="offcanvas-footer border-top p-3 bg-white flex-shrink-0">
      <div class="d-flex align-items-center justify-content-between gap-2">
        <button
          type="button"
          class="btn btn-white border fw-semibold"
          data-bs-dismiss="offcanvas"
          :disabled="isSubmitting"
        >
          Cancel
        </button>

        <button
          type="button"
          class="btn btn-primary fw-bold flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2 py-2"
          :disabled="isSubmitting || !isFormValid"
          @click="handleCompleteSale"
        >
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status"></span>
          <Icon v-else icon="ri:check-double-line" class="fs-5" />
          <span>
            {{ isSubmitting ? 'Processing...' : submitButtonLabel }}
          </span>
        </button>
      </div>
    </div>
  </div>

  <!-- Sub-modals mounted cleanly at body level -->
  <Teleport to="body">
    <CustomerProfileModal
      v-if="activeCustomer && activeCustomer.id"
      modal-id="sellingCustomerProfileModal"
      :customer="activeCustomer"
    />

    <RiderQuickModal
      :visible="showRiderModal"
      :providers="deliveryProviders"
      :staff-list="staffMembers"
      :branch-id="activeBranchId"
      @close="showRiderModal = false"
      @created="onRiderCreated"
      @provider-created="onProviderCreated"
    />

    <QuickPaymentMethodModal
      :visible="showPaymentMethodModal"
      :branch-id="activeBranchId"
      @close="showPaymentMethodModal = false"
      @created="onPaymentMethodCreated"
    />

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
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/auth";
import { useShiftStore } from "@/stores/shift";
import { useCartStore, WALK_IN_CUSTOMER } from "@/stores/cart";
import { resolveOrderTypeProfile } from "@/utils/orderTypes";
import { resolveBranchOrigin, calculateDeliveryEstimate } from "@/utils/deliveryEstimate";
import salesApi from "@/api/sales";
import paymentMethodsApi from "@/api/paymentMethods";
import ridersApi from "@/api/riders";

import GoogleLocationInput from "@/components/GoogleLocationInput.vue";
import GoogleMapPreview from "@/components/GoogleMapPreview.vue";
import SelectSearchBox from "@/components/SelectSearchBox.vue";
import ReferenceAlert from "@/components/ReferenceAlert.vue";
import SkeletonLoader from "@/components/Loaders/SkeletonLoader.vue";
import ImageToast from "@/components/ImageToast.vue";
import CustomerPicker from "./CustomerPicker.vue";
import CustomerProfileModal from "./CustomerProfileModal.vue";
import RiderQuickModal from "./RiderQuickModal.vue";
import QuickPaymentMethodModal from "./QuickPaymentMethodModal.vue";
import successImage from "@/assets/images/icons/check.png";
import errorImage from "@/assets/images/icons/error.png";
import mpesaBadgeImg from "@/assets/images/icons/mpesa-badge.svg";

const props = defineProps({
  cartItems: { type: Array, default: () => [] },
  totalAmount: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  itemCount: { type: Number, default: 0 },
  customer: { type: Object, default: null },
  channel: { type: String, default: "counter" },
  fulfilmentMethod: { type: String, default: "takeaway" },
  tabId: { type: String, default: null },
  tabIds: { type: Array, default: () => [] },
  jointTabs: { type: Array, default: () => [] },
  tabLabel: { type: String, default: "" },
  alreadyPaid: { type: Number, default: 0 },
  tableId: { type: String, default: null },
});

const emit = defineEmits(["sale-completed", "view-customer-bills", "register-customer"]);

const authStore = useAuthStore();
const shiftStore = useShiftStore();
const cartStore = useCartStore();

const toggleBtnRef = ref(null);
const offcanvasRef = ref(null);
const cashInputRef = ref(null);

const isSubmitting = ref(false);
const loadingMethods = ref(false);
const loadingRiders = ref(false);
const configuredMethods = ref([]);
const ridersList = ref([]);
const deliveryProviders = ref([]);
const staffMembers = ref([]);

const showRiderModal = ref(false);
const showPaymentMethodModal = ref(false);

// Toast state
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

// Idempotency key per checkout session
const idempotencyKey = ref("");
function regenerateIdempotencyKey() {
  idempotencyKey.value = `chk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

const activeBranchId = computed(() => {
  return (
    shiftStore.activeShift?.branch_id ||
    shiftStore.selectedBranchId ||
    shiftStore.branches?.find((b) => b.is_main)?.id ||
    shiftStore.branches?.[0]?.id ||
    null
  );
});

const canManagePaymentMethods = computed(() => {
  const role = (authStore.role || authStore.membership?.role || "").toLowerCase();
  return role === "owner" || role === "manager";
});

// Customer (synced with cartStore so selecting/adding here persists)
const activeCustomer = computed(() => cartStore.customer || props.customer || { ...WALK_IN_CUSTOMER });
const kraPin = ref("");
const includeKraPinOnReceipt = ref(false);
const showCustomerDetails = ref(false);

function onCheckoutCustomerSelected(cust) {
  if (cust && cust.id) {
    cartStore.setCustomer(cust);
    if (cust.tax_pin) {
      kraPin.value = cust.tax_pin;
    }
    applyCustomerSavedAddress(cust);
  } else {
    cartStore.clearCustomer();
  }
}

const openCustomerProfileModal = () => {
  const el = document.getElementById("sellingCustomerProfileModal");
  if (el && window.bootstrap) {
    window.bootstrap.Modal.getOrCreateInstance(el).show();
  }
};

// Dynamic Order Types
const orderTypeProfile = computed(() => resolveOrderTypeProfile(authStore.tenant?.business_type));
const selectedOrderTypeKey = ref(orderTypeProfile.value.defaultType);
const activeOrderTypeOption = computed(
  () =>
    orderTypeProfile.value.options.find((o) => o.key === selectedOrderTypeKey.value) ||
    orderTypeProfile.value.options[0]
);
const selectedFulfilment = computed(() => activeOrderTypeOption.value.fulfilment || "takeaway");

function selectOrderType(opt) {
  selectedOrderTypeKey.value = opt.key;
  if (opt.usesDelivery) {
    ensureRidersLoaded();
    if (activeCustomer.value?.id && !deliveryAddress.value.trim()) {
      applyCustomerSavedAddress(activeCustomer.value);
    }
  }
}

// Delivery & Reusable Rider State
const deliveryAddress = ref("");
const deliveryDirections = ref("");
const deliveryFeeInput = ref(props.deliveryFee || 0);
const deliveryLocation = ref(null);
const deliveryEstimate = ref(null);
const deliveryEstimateLoading = ref(false);
const deliveryOrigin = computed(() => resolveBranchOrigin(shiftStore));

const deliveryArrangement = ref("business_rider"); // business_rider | customer_rider | customer_pickup
const selectedRiderId = ref(null);
const vehicleRegistrationInput = ref("");
const saveVehicleToRider = ref(true);
const customerDeliveryProviderId = ref(null);
const customerRiderName = ref("");
const customerRiderPhone = ref("");

const selectedRider = computed(() =>
  ridersList.value.find((r) => String(r.id) === String(selectedRiderId.value)) || null
);

const riderSelectOptions = computed(() =>
  ridersList.value.map((r) => {
    const providerTag = r.delivery_provider?.name ? ` · ${r.delivery_provider.name}` : "";
    const staffTag = r.is_staff ? " [Staff]" : "";
    return {
      label: `${r.full_name}${staffTag}${providerTag}`,
      value: r.id,
    };
  })
);

const providerSelectOptions = computed(() =>
  deliveryProviders.value.map((p) => ({ label: p.name, value: p.id }))
);

const isNewVehicleForRider = computed(() => {
  if (!selectedRider.value) return false;
  const plate = vehicleRegistrationInput.value.trim().toUpperCase();
  if (plate.length < 3) return false;
  const existing = (selectedRider.value.vehicles || []).map((v) => v.registration_number.toUpperCase());
  return !existing.includes(plate);
});

function onRiderSelected(riderId) {
  selectedRiderId.value = riderId;
  const rider = ridersList.value.find((r) => String(r.id) === String(riderId));
  if (rider?.vehicles?.length) {
    vehicleRegistrationInput.value = rider.vehicles[0].registration_number;
  } else {
    vehicleRegistrationInput.value = "";
  }
}

function onRiderCreated(newRider) {
  if (newRider?.id) {
    ridersList.value = [newRider, ...ridersList.value.filter((r) => r.id !== newRider.id)];
    onRiderSelected(newRider.id);
    showToast("Rider Registered", `${newRider.full_name} is now available for deliveries.`);
  }
  showRiderModal.value = false;
}

function onProviderCreated(newProvider) {
  if (newProvider?.id && !deliveryProviders.value.some((p) => p.id === newProvider.id)) {
    deliveryProviders.value = [...deliveryProviders.value, newProvider];
  }
}

let ridersLoadedOnce = false;
async function ensureRidersLoaded(force = false) {
  if (ridersLoadedOnce && !force) return;
  loadingRiders.value = true;
  try {
    const [rRes, pRes] = await Promise.all([
      ridersApi.list({ branch_id: activeBranchId.value || undefined }),
      ridersApi.providers(),
    ]);
    ridersList.value = rRes.data?.data || [];
    deliveryProviders.value = pRes.data?.data || [];
    staffMembers.value = pRes.data?.staff || [];
    if (!customerDeliveryProviderId.value) {
      const custProv = deliveryProviders.value.find((p) => p.code === "customer_arranged");
      if (custProv) customerDeliveryProviderId.value = custProv.id;
    }
    ridersLoadedOnce = true;
  } catch (err) {
    console.warn("Could not load riders/providers:", err);
  } finally {
    loadingRiders.value = false;
  }
}

// Delivery Estimate Calculation
let deliveryEstimateSeq = 0;
async function refreshDeliveryEstimate(dest) {
  const seq = ++deliveryEstimateSeq;
  deliveryEstimate.value = null;

  if (!dest?.latitude || !dest?.longitude) {
    deliveryEstimateLoading.value = false;
    return;
  }

  let origin = deliveryOrigin.value;
  if (!origin) {
    await shiftStore.fetchBranches(true);
    origin = resolveBranchOrigin(shiftStore);
  }
  if (!origin) {
    deliveryEstimateLoading.value = false;
    return;
  }

  deliveryEstimateLoading.value = true;
  try {
    const result = await calculateDeliveryEstimate(origin, {
      latitude: Number(dest.latitude),
      longitude: Number(dest.longitude),
    });
    if (seq === deliveryEstimateSeq) {
      deliveryEstimate.value = result;
    }
  } finally {
    if (seq === deliveryEstimateSeq) {
      deliveryEstimateLoading.value = false;
    }
  }
}

function applyCustomerSavedAddress(cust) {
  if (!cust?.addresses?.length) return;
  const a = cust.addresses.find((addr) => addr.is_default) || cust.addresses[0];
  if (!a) return;
  const formatted = [a.building, a.street, a.estate_area, a.town_city].filter(Boolean).join(", ");
  if (formatted) deliveryAddress.value = formatted;
  if (a.additional_directions) deliveryDirections.value = a.additional_directions;
  if (a.latitude && a.longitude) {
    deliveryLocation.value = { latitude: Number(a.latitude), longitude: Number(a.longitude) };
    refreshDeliveryEstimate(deliveryLocation.value);
  }
}

const onDeliveryLocationSelected = (data) => {
  if (data?.formatted_address) deliveryAddress.value = data.formatted_address;
  if (data?.latitude && data?.longitude) {
    deliveryLocation.value = data;
    refreshDeliveryEstimate(data);
  }
};

const onDeliveryLocationCleared = () => {
  deliveryLocation.value = null;
  deliveryEstimate.value = null;
  deliveryEstimateLoading.value = false;
};

// Totals Calculation
const itemDiscountsTotal = computed(() =>
  props.cartItems.reduce((sum, item) => sum + Number(item.discount_amount || 0), 0)
);
const totalDiscounts = computed(
  () => Math.round((itemDiscountsTotal.value + Number(props.discountAmount || 0)) * 100) / 100
);
const effectiveTotal = computed(() => {
  const base = props.subtotal - totalDiscounts.value + props.taxAmount;
  const delivery = selectedFulfilment.value === "delivery" ? Number(deliveryFeeInput.value) || 0 : 0;
  const priorPaid = Math.max(0, Number(props.alreadyPaid) || 0);
  return Math.max(0, Math.round((base + delivery - priorPaid) * 100) / 100);
});

// Dynamic Payment Methods (strictly from business configuration)
const selectedMethodId = ref(null);
const activeTypeCategory = ref("cash");
const isSplitPayment = ref(false);
const splitTenders = ref([]);

const mpesaEntryMode = ref("manual"); // 'stk' | 'manual'
const mpesaPhone = ref("");
const mpesaReference = ref("");
const bankReference = ref("");
const cashTendered = ref(0);
const saleNotes = ref("");

const MPESA_TYPES = ["mpesa_till", "mpesa_paybill", "pochi_la_biashara", "mpesa_send_money", "bank_paybill"];

const mpesaMethods = computed(() =>
  configuredMethods.value.filter((m) => MPESA_TYPES.includes(m.type))
);

const canSplitPayment = computed(() => configuredMethods.value.length >= 2);

function getChannelLogo(m) {
  if (!m) return null;
  if (m.bank?.icon_url || m.bank?.logo_url) {
    return m.bank.icon_url || m.bank.logo_url;
  }
  if (["mpesa_till", "mpesa_paybill", "pochi_la_biashara", "mpesa_send_money"].includes(m.type)) {
    return mpesaBadgeImg;
  }
  return null;
}

function getChannelIconMeta(m) {
  if (!m) return { icon: "ri:cash-line", iconBg: "#fffbeb", iconColor: "#d97706" };
  if (m.type === "cash") return { icon: "ri:cash-line", iconBg: "#fffbeb", iconColor: "#d97706" };
  if (m.type === "card") return { icon: "ri:bank-card-line", iconBg: "#f0fdfa", iconColor: "#0d9488" };
  if (m.type === "bank_paybill" || m.type === "bank_account") {
    return { icon: "ri:bank-line", iconBg: "#f5f3ff", iconColor: "#7c3aed" };
  }
  return { icon: "ri:smartphone-line", iconBg: "#ecfdf5", iconColor: "#059669" };
}

function getChannelSubtitle(m) {
  if (!m) return "";
  if (m.type === "cash") return "Cash in Drawer";
  if (m.type === "card") return "Card Terminal / PDQ";
  if (m.type === "mpesa_till") return m.identifier ? `Till ${m.identifier}` : "Buy Goods Till";
  if (m.type === "mpesa_paybill") {
    return [m.identifier ? `PayBill ${m.identifier}` : "PayBill", m.account_number ? `Acc ${m.account_number}` : ""]
      .filter(Boolean)
      .join(" · ");
  }
  if (m.type === "bank_paybill") {
    return [
      m.bank?.short_name || m.bank?.name || "",
      m.identifier ? `PayBill ${m.identifier}` : "",
      m.account_number ? `Acc ${m.account_number}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (m.type === "bank_account") {
    return [m.bank?.short_name || m.bank?.name || "", m.account_number || m.identifier || ""]
      .filter(Boolean)
      .join(" · ");
  }
  if (m.type === "pochi_la_biashara") return m.identifier ? `Pochi · ${m.identifier}` : "Pochi la Biashara";
  if (m.type === "mpesa_send_money") return m.identifier ? `Send Money · ${m.identifier}` : "Send Money";
  return m.identifier || m.type_label || "";
}

const paymentMethodSelectOptions = computed(() =>
  configuredMethods.value.map((m) => {
    const logo = getChannelLogo(m);
    const meta = getChannelIconMeta(m);
    return {
      label: m.name,
      value: m.id,
      subtitle: getChannelSubtitle(m),
      image: logo,
      icon: logo ? null : meta.icon,
      iconBg: meta.iconBg,
      iconColor: meta.iconColor,
    };
  })
);

const selectedMethodObject = computed(
  () => configuredMethods.value.find((m) => m.id === selectedMethodId.value) || configuredMethods.value[0] || null
);

function getMpesaIcon(type) {
  if (type === "mpesa_till") return "ri:store-2-line";
  if (type === "mpesa_paybill") return "ri:bill-line";
  if (type === "pochi_la_biashara") return "ri:wallet-3-line";
  if (type === "mpesa_send_money") return "ri:send-plane-line";
  if (type === "bank_paybill") return "ri:bank-line";
  return "ri:smartphone-line";
}

function getMpesaCircleClass(type) {
  if (type === "bank_paybill") return "bg-primary-subtle text-primary";
  if (type === "pochi_la_biashara") return "bg-info-subtle text-info";
  if (type === "mpesa_send_money") return "bg-warning-subtle text-warning";
  return "bg-success-subtle text-success";
}

function getMpesaTypeSubtitle(m) {
  if (m.type === "mpesa_till") return `Buy Goods Till · ${m.identifier || "Configured"}`;
  if (m.type === "mpesa_paybill") return `Business PayBill ${m.identifier || ""}${m.account_number ? ` · Acc ${m.account_number}` : ""}`;
  if (m.type === "bank_paybill") return `${m.bank?.name || "Bank"} PayBill ${m.identifier || ""}${m.account_number ? ` · Acc ${m.account_number}` : ""}`;
  if (m.type === "pochi_la_biashara") return `Pochi la Biashara · ${m.identifier || "Phone"}`;
  if (m.type === "mpesa_send_money") return `Send Money · ${m.identifier || "Phone"}`;
  return m.type_label || "M-PESA";
}

function mapToBackendMethod(type) {
  if (type === "cash") return "cash";
  if (MPESA_TYPES.includes(type)) return "mpesa";
  if (type === "card") return "card";
  return "bank";
}

function selectPaymentMethod(method) {
  if (!method) return;
  selectedMethodId.value = method.id;
  const type = method.type || "cash";
  if (type === "cash") {
    activeTypeCategory.value = "cash";
  } else if (MPESA_TYPES.includes(type)) {
    activeTypeCategory.value = "mpesa";
    mpesaEntryMode.value = method.integration_status?.stk_push_available ? "stk" : "manual";
  } else if (type === "card") {
    activeTypeCategory.value = "card";
  } else {
    activeTypeCategory.value = "bank";
  }
}

function onPaymentMethodDropdownSelect(methodId) {
  const found = configuredMethods.value.find((m) => m.id === methodId);
  if (found) selectPaymentMethod(found);
}

async function fetchPaymentMethods() {
  loadingMethods.value = true;
  try {
    if (!activeBranchId.value) {
      await shiftStore.fetchBranches();
    }
    const params = { is_active: 1, per_page: 50 };
    if (activeBranchId.value) {
      params.branch_id = activeBranchId.value;
    }
    const res = await paymentMethodsApi.list(params);
    const list = res.data?.data?.data || res.data?.data || [];
    configuredMethods.value = Array.isArray(list) ? list.filter((m) => m.is_active !== false) : [];
    if (configuredMethods.value.length < 2) {
      isSplitPayment.value = false;
    }
    if (configuredMethods.value.length > 0) {
      const stillExists = configuredMethods.value.find((m) => m.id === selectedMethodId.value);
      const primary = stillExists || configuredMethods.value.find((m) => m.is_primary) || configuredMethods.value[0];
      selectPaymentMethod(primary);
    }
  } catch (err) {
    console.warn("Failed to load payment methods:", err);
  } finally {
    loadingMethods.value = false;
  }
}

function onPaymentMethodCreated(newMethod) {
  if (newMethod?.id) {
    configuredMethods.value = [...configuredMethods.value, newMethod];
    selectPaymentMethod(newMethod);
    showToast("Payment Channel Added", `${newMethod.name} is ready for checkout.`);
  }
  showPaymentMethodModal.value = false;
}

// Cash helpers
const cashChange = computed(() => {
  if (activeTypeCategory.value !== "cash") return 0;
  return Math.max(0, Math.round((Number(cashTendered.value || 0) - effectiveTotal.value) * 100) / 100);
});
const cashShortfall = computed(() => {
  if (activeTypeCategory.value !== "cash") return 0;
  return Math.max(0, Math.round((effectiveTotal.value - Number(cashTendered.value || 0)) * 100) / 100);
});
// Smart Kenyan cash tender presets based on real KES coins (1, 5, 10, 20, 40) & notes (50, 100, 200, 500, 1000)
const kenyanCashPresets = computed(() => {
  const total = Number(effectiveTotal.value || 0);
  if (total <= 0) return [50, 100, 200, 500, 1000];

  const denoms = total < 50 ? [5, 10, 20, 40, 50, 100] : [50, 100, 200, 500, 1000];
  const candidates = new Set();

  for (const d of denoms) {
    const next = Math.ceil(total / d) * d;
    if (next > total) {
      candidates.add(next);
    }
  }

  // Also include the next whole 1,000 note above total (e.g. KES 1,000 -> KES 2,000)
  if (candidates.size < 4) {
    const nextThousand = (Math.floor(total / 1000) + 1) * 1000;
    if (nextThousand > total) candidates.add(nextThousand);
  }

  return Array.from(candidates)
    .sort((a, b) => a - b)
    .slice(0, 4);
});

// Split Payment helpers
const splitAllocatedTotal = computed(() =>
  Math.round(splitTenders.value.reduce((s, r) => s + (Number(r.amount) || 0), 0) * 100) / 100
);
const remainingSplitBalance = computed(() =>
  Math.max(0, Math.round((effectiveTotal.value - splitAllocatedTotal.value) * 100) / 100)
);

function toggleSplitPayment() {
  if (!canSplitPayment.value) {
    isSplitPayment.value = false;
    return;
  }
  isSplitPayment.value = !isSplitPayment.value;
  if (isSplitPayment.value && configuredMethods.value.length >= 2) {
    const first = configuredMethods.value[0];
    const second = configuredMethods.value[1];
    const half1 = Math.floor(effectiveTotal.value / 2);
    const half2 = Math.round((effectiveTotal.value - half1) * 100) / 100;
    splitTenders.value = [
      {
        payment_method_id: first.id,
        payment_channel_type: first.type,
        method: mapToBackendMethod(first.type),
        amount: half1,
        tendered_amount: half1,
        external_reference: "",
      },
      {
        payment_method_id: second.id,
        payment_channel_type: second.type,
        method: mapToBackendMethod(second.type),
        amount: half2,
        tendered_amount: half2,
        external_reference: "",
      },
    ];
  }
}

function onSplitMethodChange(split) {
  const found = configuredMethods.value.find((m) => m.id === split.payment_method_id);
  if (found) {
    split.payment_channel_type = found.type;
    split.method = mapToBackendMethod(found.type);
  }
}

function addSplitRow() {
  const m = configuredMethods.value[0];
  if (!m) return;
  const rem = remainingSplitBalance.value;
  splitTenders.value.push({
    payment_method_id: m.id,
    payment_channel_type: m.type,
    method: mapToBackendMethod(m.type),
    amount: rem,
    tendered_amount: rem,
    external_reference: "",
  });
}

function removeSplitRow(idx) {
  if (splitTenders.value.length > 1) splitTenders.value.splice(idx, 1);
}

// Validation
const isFormValid = computed(() => {
  if (!configuredMethods.value.length) return false;
  if (effectiveTotal.value <= 0) return true;

  if (isSplitPayment.value) {
    if (Math.abs(splitAllocatedTotal.value - effectiveTotal.value) > 0.01) return false;
    return splitTenders.value.every((s) => {
      const amt = Number(s.amount || 0);
      if (amt <= 0) return false;
      if (s.method === "cash") return Number(s.tendered_amount || 0) >= amt;
      return (s.external_reference || "").trim().length >= 4;
    });
  }

  if (activeTypeCategory.value === "cash") {
    return Number(cashTendered.value || 0) >= effectiveTotal.value;
  }

  if (activeTypeCategory.value === "mpesa") {
    if (mpesaEntryMode.value === "stk") {
      return Boolean(selectedMethodObject.value?.integration_status?.stk_push_available) && mpesaPhone.value.trim().length >= 9;
    }
    return mpesaReference.value.trim().length >= 4;
  }

  return bankReference.value.trim().length >= 3;
});

const submitButtonLabel = computed(() => {
  if (isSplitPayment.value) {
    const hasUnverified = splitTenders.value.some((s) => s.method !== "cash");
    return hasUnverified
      ? `Record Split Order (${formatMoney(effectiveTotal.value)})`
      : `Complete Payment (${formatMoney(effectiveTotal.value)})`;
  }
  if (activeTypeCategory.value === "cash") {
    return `Complete Cash Sale (${formatMoney(effectiveTotal.value)})`;
  }
  return `Record Payment · Pending Verification (${formatMoney(effectiveTotal.value)})`;
});

// Keep totals & customer in sync
watch(
  effectiveTotal,
  (val) => {
    cashTendered.value = val;
  },
  { immediate: true }
);

watch(
  activeCustomer,
  (cust) => {
    if (cust?.id) {
      kraPin.value = cust.tax_pin || "";
      if (cust.phone) mpesaPhone.value = cust.phone;
      showCustomerDetails.value = true;
      applyCustomerSavedAddress(cust);
    } else {
      kraPin.value = "";
      showCustomerDetails.value = false;
    }
  },
  { immediate: true }
);

const formatMoney = (val) =>
  Number(val || 0).toLocaleString("en-US", { style: "currency", currency: "KES" });
const formatPlainMoney = (val) =>
  Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Submit Sale
const handleCompleteSale = async () => {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;
  try {
    const items = props.cartItems.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate || 0,
      discount_amount: Number(item.discount_amount || 0),
      notes: item.notes || null,
    }));

    let payments = [];
    if (isSplitPayment.value) {
      payments = splitTenders.value.map((s) => {
        const ch = configuredMethods.value.find((m) => m.id === s.payment_method_id);
        return {
          method: s.method,
          payment_method_id: s.payment_method_id || null,
          payment_channel_type: s.payment_channel_type || ch?.type || null,
          amount: Number(s.amount),
          tendered_amount: s.method === "cash" ? Number(s.tendered_amount || s.amount) : Number(s.amount),
          external_reference: s.method !== "cash" ? s.external_reference.trim().toUpperCase() : null,
          notes: ch?.name ? `Channel: ${ch.name}` : null,
        };
      });
    } else {
      const currentMethod = selectedMethodObject.value;
      const backendMethod = mapToBackendMethod(currentMethod.type);
      payments = [
        {
          method: backendMethod,
          payment_method_id: currentMethod.id,
          payment_channel_type: currentMethod.type,
          amount: effectiveTotal.value,
          tendered_amount: backendMethod === "cash" ? Number(cashTendered.value) : effectiveTotal.value,
          external_reference:
            backendMethod === "mpesa"
              ? mpesaReference.value.trim().toUpperCase() || null
              : backendMethod === "bank" || backendMethod === "card"
              ? bankReference.value.trim().toUpperCase() || null
              : null,
          payer_phone: backendMethod === "mpesa" ? mpesaPhone.value.trim() || null : null,
          notes: currentMethod.name ? `Channel: ${currentMethod.name}` : null,
        },
      ];
    }

    const payload = {
      branch_id: activeBranchId.value,
      customer_id: activeCustomer.value?.id || null,
      tab_id: props.tabId || null,
      tab_ids: props.tabIds?.length ? props.tabIds : null,
      table_id: props.tableId || null,
      channel: props.tabIds?.length || props.tabId ? "tab" : props.channel || "counter",
      fulfilment_method: selectedFulfilment.value,
      tax_pin: includeKraPinOnReceipt.value ? (kraPin.value.trim() || null) : null,
      delivery_address: selectedFulfilment.value === "delivery" ? deliveryAddress.value.trim() || null : null,
      delivery_fee: selectedFulfilment.value === "delivery" ? Number(deliveryFeeInput.value) || 0 : 0,
      discount_amount: Number(props.discountAmount || 0),
      idempotency_key: idempotencyKey.value,
      notes: saleNotes.value.trim() || null,
      items,
      payments,
    };

    if (selectedFulfilment.value === "delivery") {
      const custProv = deliveryProviders.value.find((p) => p.id === customerDeliveryProviderId.value);
      payload.delivery = {
        arrangement_type: deliveryArrangement.value,
        delivery_provider_id:
          deliveryArrangement.value === "business_rider"
            ? selectedRider.value?.delivery_provider_id || null
            : customerDeliveryProviderId.value || null,
        provider_name:
          deliveryArrangement.value === "business_rider"
            ? selectedRider.value?.delivery_provider?.name || null
            : custProv?.name || null,
        rider_id: deliveryArrangement.value === "business_rider" ? selectedRiderId.value : null,
        rider_name:
          deliveryArrangement.value === "business_rider"
            ? selectedRider.value?.full_name || null
            : customerRiderName.value.trim() || null,
        rider_phone:
          deliveryArrangement.value === "business_rider"
            ? selectedRider.value?.phone || null
            : customerRiderPhone.value.trim() || null,
        vehicle_registration: vehicleRegistrationInput.value.trim().toUpperCase() || null,
        save_vehicle_to_rider: deliveryArrangement.value === "business_rider" && isNewVehicleForRider.value && saveVehicleToRider.value,
        delivery_address: deliveryAddress.value.trim() || null,
        delivery_directions: deliveryDirections.value.trim() || null,
        latitude: deliveryLocation.value?.latitude ? Number(deliveryLocation.value.latitude) : null,
        longitude: deliveryLocation.value?.longitude ? Number(deliveryLocation.value.longitude) : null,
        distance_text: deliveryEstimate.value?.distanceText || null,
        duration_text: deliveryEstimate.value?.durationText || null,
      };
    }

    const res = await salesApi.create(payload);
    if (res.data?.order) {
      // Reset checkout inputs & regenerate idempotency key for next sale
      mpesaReference.value = "";
      bankReference.value = "";
      saleNotes.value = "";
      includeKraPinOnReceipt.value = false;
      isSplitPayment.value = false;
      splitTenders.value = [];
      regenerateIdempotencyKey();

      const el = document.getElementById("sellingAside");
      if (el && window.bootstrap?.Offcanvas) {
        window.bootstrap.Offcanvas.getInstance(el)?.hide();
      }
      emit("sale-completed", res.data.order);
    }
  } catch (err) {
    console.error("Failed to complete sale order:", err);
    const msg =
      err.response?.data?.message ||
      Object.values(err.response?.data?.errors || {})?.[0]?.[0] ||
      "Sale transaction failed. Please check payment details and try again.";
    showToast("Checkout Failed", msg);
  } finally {
    isSubmitting.value = false;
  }
};

// Match Cart width on desktop (>= 992px), responsive on tablet/mobile
function syncAsideWidthToCart() {
  const asideEl = offcanvasRef.value || document.getElementById("sellingAside");
  if (!asideEl) return;

  if (window.innerWidth < 992) {
    asideEl.style.removeProperty("--pos-cart-width");
    return;
  }

  const cartEl = document.querySelector("[data-pos-cart]");
  if (cartEl) {
    const width = Math.round(cartEl.getBoundingClientRect().width);
    if (width >= 380) {
      asideEl.style.setProperty("--pos-cart-width", `${width}px`);
      return;
    }
  }
  asideEl.style.removeProperty("--pos-cart-width");
}

function handleOffcanvasShow() {
  syncAsideWidthToCart();
  regenerateIdempotencyKey();
  fetchPaymentMethods();
  cashTendered.value = effectiveTotal.value;
  if (activeOrderTypeOption.value.usesDelivery) {
    ensureRidersLoaded();
  }
}

onMounted(() => {
  window.addEventListener("resize", syncAsideWidthToCart);
  const el = document.getElementById("sellingAside");
  if (el) {
    el.addEventListener("show.bs.offcanvas", handleOffcanvasShow);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", syncAsideWidthToCart);
  const el = document.getElementById("sellingAside");
  if (el) {
    el.removeEventListener("show.bs.offcanvas", handleOffcanvasShow);
  }
});
</script>

<style scoped>
.selling-checkout-offcanvas {
  --bs-offcanvas-width: var(--pos-cart-width, clamp(460px, 34vw, 560px));
  width: var(--bs-offcanvas-width);
  max-width: 95vw;
}

@media (max-width: 991.98px) {
  .selling-checkout-offcanvas {
    --bs-offcanvas-width: min(520px, 92vw);
    width: var(--bs-offcanvas-width);
    max-width: 92vw;
  }
}

@media (max-width: 575.98px) {
  .selling-checkout-offcanvas {
    --bs-offcanvas-width: 100vw;
    width: 100vw;
    max-width: 100vw;
  }
}

.checkout-section-box {
  border: 1px solid #cbd5e1;
}

.checkout-payment-box {
  border: 1.5px solid color-mix(in srgb, var(--bs-primary) 42%, #cbd5e1);
}

.checkout-payment-header {
  background-color: color-mix(in srgb, var(--bs-primary) 6%, #ffffff);
  border-bottom: 1px solid color-mix(in srgb, var(--bs-primary) 18%, #e2e8f0);
}

.checkout-payment-icon {
  width: 28px;
  height: 28px;
  color: var(--bs-primary);
  background-color: color-mix(in srgb, var(--bs-primary) 14%, #ffffff);
}

.checkout-optional-box {
  border: 1px dashed #cbd5e1;
  background-color: #f8fafc;
}

.checkout-summary-row {
  border-bottom: 1px solid #eef2f7;
}

.checkout-summary-row:last-child {
  border-bottom: 0;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}

.cursor-pointer {
  cursor: pointer;
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
</style>
