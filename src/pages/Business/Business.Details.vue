<template>
    <div class="container-fluid business-details-page">
        <!-- Page Title & Breadcrumbs -->
        <div class="row">
            <div class="col-12">
                <div class="page-title-box d-flex align-items-center justify-content-between gap-2 py-3">
                    <div class="min-w-0">
                        <h4 class="mb-sm-0 font-size-18 pb-1 text-truncate fw-bold text-dark">Business Details</h4>
                        <div class="page-title-right">
                            <ol class="breadcrumb m-0 flex-nowrap font-size-12">
                                <li class="breadcrumb-item">
                                    <router-link to="/" class="text-decoration-none">Dashboard</router-link>
                                </li>
                                <li class="breadcrumb-item text-muted">Business</li>
                                <li class="breadcrumb-item active text-dark fw-semibold">Business Details</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading Skeleton -->
        <div v-if="loading && !business" class="row g-3">
            <div class="col-12">
                <div class="card border rounded-2 p-4 bg-white">
                    <div class="d-flex gap-3 align-items-center">
                        <div class="skeleton-box rounded-3" style="width: 64px; height: 64px;"></div>
                        <div class="flex-grow-1">
                            <div class="skeleton-box rounded mb-2" style="width: 240px; height: 22px;"></div>
                            <div class="skeleton-box rounded" style="width: 160px; height: 16px;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-else-if="business" class="tenant-details-content">
            <!--
                Header card: matching [Arsenal Sports Bar · Tenants] (route /tenants/:id):
                brand strip on top, head logo, identity badges, stats, action buttons,
                and nav-tabs nav-tabs-custom attached seamlessly to the bottom.
            -->
            <div class="card tenant-head mb-3">
                <!-- Brand strip on top with business primary brand color -->
                <div class="brand-strip" :style="{ background: form.primary_color || '#2b59ff' }"></div>

                <div class="card-body d-flex flex-wrap align-items-center gap-3">
                    <!-- Head Logo with cropper upload trigger -->
                    <div class="position-relative">
                        <img v-if="business.branding?.logo_url" :src="business.branding.logo_url"
                            :alt="`${business.name} logo`" class="head-logo" />
                        <span v-else class="head-logo no-logo d-flex flex-column align-items-center justify-content-center"
                            title="No logo yet">
                            <Icon icon="ri:image-line" class="fs-4" />
                            <small>No logo</small>
                        </span>

                        <!-- Camera button triggers ImageUploader modal -->
                        <label for="tenant-logo-cropper-upload"
                            class="btn btn-sm btn-white border rounded-circle shadow-none position-absolute bottom-0 end-0 p-1 d-flex align-items-center justify-content-center logo-edit-btn mb-0 cursor-pointer"
                            title="Crop &amp; upload business logo">
                            <Icon icon="ri:camera-line" class="font-size-12 text-dark" />
                        </label>
                    </div>

                    <!-- Business Identity Info -->
                    <div class="flex-grow-1 min-w-0">
                        <div class="d-flex flex-wrap align-items-center gap-2">
                            <h4 class="mb-0 text-black text-truncate fw-bold">{{ business.name }}</h4>

                            <!-- Status Badge matching Tenants Page -->
                            <span class="text-uppercase badge-alt2 bg-gray-200 text-dark bg-primary-soft w-auto font-size-11">
                                <i class="mdi-record mdi text-success"></i> Active
                            </span>

                            <!-- Business Plan Badge -->
                            <span class="badge rounded-pill font-size-12 fw-medium px-2 py-1 d-inline-flex align-items-center gap-1 plan-badge bg-primary-subtle text-primary border border-primary-subtle">
                                <Icon icon="ri:vip-crown-2-line" /> {{ business.stats?.plan || 'Standard' }}
                            </span>
                        </div>

                        <!-- Subtitle line -->
                        <p class="text-muted mb-0 mt-1 text-truncate font-size-13">
                            <span class="font-monospace text-dark fw-semibold">{{ business.human_code }}</span> ·
                            <span class="text-primary fw-medium">@{{ business.short_name }}</span> ·
                            <span v-if="business.business_type?.name"><Icon icon="ri:store-2-line" class="align-middle" /> {{ business.business_type.name }} · </span>
                            <span>{{ business.ward?.constituency?.county?.name || business.city || 'Kenya' }}</span> ·
                            <template v-if="form.kra_pin">
                                <span>KRA: <strong class="text-dark">{{ form.kra_pin }}</strong> · </span>
                            </template>
                            <a :href="`https://paysol.co.ke/s/${business.short_name}`" target="_blank" rel="noopener noreferrer" class="text-primary">
                                paysol.co.ke/s/{{ business.short_name }}
                            </a>
                        </p>
                    </div>

                    <!-- Middle: Stats & Metrics Divider -->
                    <div class="d-none d-lg-flex gap-4 px-4 border-start border-end">
                        <div>
                            <small class="text-muted d-block font-size-11">Branches</small>
                            <span class="text-black fw-medium font-size-15">{{ business.stats?.branches_count ?? 0 }}</span>
                        </div>
                        <div>
                            <small class="text-muted d-block font-size-11">Active Staff</small>
                            <span class="text-black fw-medium font-size-15">{{ business.stats?.staff_count ?? 0 }}</span>
                        </div>
                        <div>
                            <small class="text-muted d-block font-size-11">Products</small>
                            <span class="text-black fw-medium font-size-15">{{ business.stats?.products_count ?? 0 }}</span>
                        </div>
                    </div>

                    <!-- Right: Action Buttons -->
                    <div class="d-flex align-items-center gap-2">
                        <button type="button" @click="fetchBusinessDetails" :disabled="loading"
                            title="Reload details"
                            class="btn btn-light waves-effect d-flex align-items-center gap-2 font-size-13">
                            <Icon icon="ri:refresh-line" class="fs-5" :class="{ 'bx-spin': loading }" />
                            <span>Reload</span>
                        </button>

                        <button type="button" @click="saveChanges" :disabled="saving || loading || !isDirty"
                            class="btn btn-primary waves-effect d-flex align-items-center gap-2 text-white font-size-13 shadow-none">
                            <span v-if="saving" class="spinner-border spinner-border-sm" role="status"></span>
                            <Icon v-else icon="ri:check-double-line" class="fs-5" />
                            <span class="fw-semibold">{{ saving ? 'Saving...' : 'Save Changes' }}</span>
                        </button>
                    </div>
                </div>

                <!-- Unsaved Changes Alert Pill (inside card-body) -->
                <div v-if="isDirty" class="mx-4 mb-3 alert alert-warning border py-2 px-3 d-flex align-items-center justify-content-between rounded-2 font-size-12">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bx bx-info-circle font-size-16 text-warning"></i>
                        <span>You have unsaved changes. Remember to click <strong>Save Changes</strong> to apply your updates.</span>
                    </div>
                    <button type="button" @click="resetForm" class="btn btn-link btn-sm text-decoration-none p-0 text-muted">
                        Discard Changes
                    </button>
                </div>

                <!-- Navigation Tabs: Matching [Arsenal Sports Bar · Tenants] -->
                <ul class="nav nav-tabs nav-tabs-custom px-3 border-top flex-nowrap border-bottom-0" role="tablist">
                    <li v-for="tab in tabs" :key="tab.key" class="nav-item">
                        <a href="javascript:void(0);" class="nav-link text-nowrap p-3 px-4 font-size-13"
                            :class="{ active: tab.key === activeTab }" @click="setTab(tab.key)">
                            <Icon :icon="tab.icon" class="me-1 fs-5 align-middle" />
                            {{ tab.label }}
                        </a>
                    </li>
                </ul>
            </div>

            <!-- Tab Contents -->
            <div class="row g-3">
                <!-- Tab 1: Identity & Legal -->
                <div v-show="activeTab === 'identity'" class="col-12">
                    <div class="card border rounded-2 bg-white p-4">
                        <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                            <Icon icon="ri:building-2-line" class="fs-4 text-primary" />
                            <div>
                                <h5 class="fw-bold text-dark mb-0 font-size-15">Business Identity &amp; Legal Registration</h5>
                                <p class="text-muted font-size-12 mb-0">Official business trade name, store handle, and tax identification.</p>
                            </div>
                        </div>

                        <div class="row g-3">
                            <!-- Trade Name -->
                            <div class="col-md-6">
                                <label class="form-label fw-bold font-size-12">
                                    Business Trade Name <span class="text-danger">*</span>
                                </label>
                                <input type="text" v-model="form.name" class="form-control"
                                    placeholder="e.g. Arsenal Sports Bar" maxlength="120" />
                                <div class="text-muted font-size-11 mt-1">Appears on receipt headers, invoices, customer display, and notifications.</div>
                            </div>

                            <!-- Short Name / Handle with live validation -->
                            <div class="col-md-6">
                                <label class="form-label fw-bold font-size-12 d-flex align-items-center justify-content-between">
                                    <span>Business Handle / Short Name <span class="text-danger">*</span></span>
                                    <span v-if="checkingShortName" class="spinner-border spinner-border-sm text-primary" role="status"></span>
                                    <span v-else-if="shortNameStatus.checked"
                                        class="font-size-11 fw-medium"
                                        :class="shortNameStatus.available ? 'text-success' : 'text-danger'">
                                        <i :class="shortNameStatus.available ? 'bx bx-check-circle' : 'bx bx-x-circle'"></i>
                                        {{ shortNameStatus.message }}
                                    </span>
                                </label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light border text-muted">@</span>
                                    <input type="text" v-model="form.short_name" class="form-control"
                                        @input="onShortNameInput"
                                        placeholder="arsenal-sports-bar" maxlength="63" />
                                </div>
                                <div class="text-muted font-size-11 mt-1">
                                    Used for your custom URL and customer payments:
                                    <strong class="text-primary font-monospace">paysol.co.ke/s/{{ form.short_name || 'your-business' }}</strong>
                                </div>
                            </div>

                            <!-- KRA PIN -->
                            <div class="col-md-6">
                                <label class="form-label fw-bold font-size-12">
                                    KRA Tax Identification PIN (Kenya)
                                </label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light border text-muted"><Icon icon="ri:barcode-line" /></span>
                                    <input type="text" v-model="form.kra_pin" class="form-control font-monospace text-uppercase"
                                        placeholder="e.g. P051234567Z" maxlength="20" />
                                </div>
                                <div class="text-muted font-size-11 mt-1">
                                    Required for electronic tax compliance and printed receipts.
                                </div>
                            </div>

                            <!-- Human Code (Read-Only) -->
                            <div class="col-md-6">
                                <label class="form-label fw-bold font-size-12">
                                    PaySol Account Reference Code
                                </label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light border text-muted"><Icon icon="ri:hashtag" /></span>
                                    <input type="text" :value="business.human_code" readonly class="form-control bg-light font-monospace" />
                                </div>
                                <div class="text-muted font-size-11 mt-1">Unique immutable PaySol account identifier for billing and support inquiries.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab 2: Contact & Headquarters -->
                <div v-show="activeTab === 'contact'" class="col-12">
                    <div class="row g-3">
                        <!-- Left: Contact & Headquarters Form -->
                        <div class="col-lg-7">
                            <div class="card border rounded-2 bg-white p-4 h-100">
                                <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                    <Icon icon="ri:map-pin-2-line" class="fs-4 text-primary" />
                                    <div>
                                        <h5 class="fw-bold text-dark mb-0 font-size-15">Contact &amp; Physical Headquarters</h5>
                                        <p class="text-muted font-size-12 mb-0">Official contact channels and administrative location in Kenya.</p>
                                    </div>
                                </div>

                                <div class="row g-3">
                                    <!-- Phone -->
                                    <div class="col-md-6">
                                        <label class="form-label fw-bold font-size-12">Business Phone Number</label>
                                        <div class="input-group">
                                            <span class="input-group-text bg-light border text-muted"><Icon icon="ri:phone-line" /></span>
                                            <input type="text" v-model="form.phone" class="form-control"
                                                placeholder="e.g. +254 712 345 678" maxlength="30" />
                                        </div>
                                        <div class="text-muted font-size-11 mt-1">Customer support and receipt contact.</div>
                                    </div>

                                    <!-- Email -->
                                    <div class="col-md-6">
                                        <label class="form-label fw-bold font-size-12">Business Email Address</label>
                                        <div class="input-group">
                                            <span class="input-group-text bg-light border text-muted"><Icon icon="ri:mail-line" /></span>
                                            <input type="email" v-model="form.email" class="form-control"
                                                placeholder="e.g. contact@business.co.ke" maxlength="120" />
                                        </div>
                                        <div class="text-muted font-size-11 mt-1">Receives daily summaries and billing receipts.</div>
                                    </div>

                                    <!-- Website -->
                                    <div class="col-12">
                                        <label class="form-label fw-bold font-size-12">Website / Online Catalog</label>
                                        <div class="input-group">
                                            <span class="input-group-text bg-light border text-muted"><Icon icon="ri:external-link-line" /></span>
                                            <input type="text" v-model="form.website" class="form-control"
                                                placeholder="e.g. https://mybusiness.co.ke" maxlength="255" />
                                        </div>
                                        <div class="text-muted font-size-11 mt-1">Printed on receipts and QR checkout links.</div>
                                    </div>

                                    <!-- Street Address -->
                                    <div class="col-12">
                                        <label class="form-label fw-bold font-size-12">Physical Street / Building Address</label>
                                        <div class="input-group">
                                            <span class="input-group-text bg-light border text-muted"><Icon icon="ri:map-pin-line" /></span>
                                            <input type="text" v-model="form.address_line" class="form-control"
                                                placeholder="e.g. 3rd Floor, Sarit Centre, Karuna Road" maxlength="255" />
                                        </div>
                                    </div>

                                    <!-- City & P.O. Box -->
                                    <div class="col-md-6">
                                        <label class="form-label fw-bold font-size-12">City / Town</label>
                                        <input type="text" v-model="form.city" class="form-control"
                                            placeholder="e.g. Nairobi" maxlength="100" />
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label fw-bold font-size-12">P.O. Box &amp; Postal Code</label>
                                        <input type="text" v-model="form.po_box" class="form-control"
                                            placeholder="e.g. P.O. Box 45678-00100" maxlength="100" />
                                    </div>

                                    <!-- Kenya Administrative Cascaders -->
                                    <div class="col-12 mt-4 pt-3 border-top">
                                        <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
                                            <div class="d-flex align-items-center gap-2">
                                                <Icon icon="ri:compass-3-line" class="fs-5 text-primary" />
                                                <h6 class="fw-bold text-dark mb-0 font-size-13">Kenyan Administrative Jurisdiction</h6>
                                            </div>
                                            <span
                                                v-if="mainBranchRecord"
                                                class="badge bg-primary-subtle text-primary border border-primary-subtle font-size-11 fw-semibold d-inline-flex align-items-center gap-1"
                                            >
                                                <Icon icon="ri:store-2-line" />
                                                <span>Main Branch: {{ mainBranchRecord.name }}</span>
                                            </span>
                                        </div>

                                        <div class="row g-3">
                                            <!-- County -->
                                            <div class="col-md-6">
                                                <label class="form-label fw-bold font-size-12">County</label>
                                                <SelectSearchBox
                                                    :model-value="selectedCountyId"
                                                    :options="countyOptions"
                                                    :placeholder="loadingCounties ? 'Loading counties...' : 'Select County'"
                                                    @update:model-value="onCountySelect"
                                                />
                                            </div>

                                            <!-- Constituency -->
                                            <div class="col-md-6">
                                                <label class="form-label fw-bold font-size-12">Constituency</label>
                                                <SelectSearchBox
                                                    :model-value="selectedConstituencyId"
                                                    :options="constituencyOptions"
                                                    :placeholder="!selectedCountyId ? 'Select county first' : (loadingConstituencies ? 'Loading...' : 'Select Constituency')"
                                                    :disabled="!selectedCountyId"
                                                    @update:model-value="onConstituencySelect"
                                                />
                                            </div>

                                            <!-- Ward -->
                                            <div class="col-md-6">
                                                <label class="form-label fw-bold font-size-12">Ward</label>
                                                <SelectSearchBox
                                                    :model-value="form.ward_id"
                                                    :options="wardOptions"
                                                    :placeholder="!selectedConstituencyId ? 'Select constituency first' : (loadingWards ? 'Loading...' : 'Select Ward')"
                                                    :disabled="!selectedConstituencyId"
                                                    @update:model-value="onWardSelect"
                                                />
                                            </div>

                                            <!-- Area / Estate -->
                                            <div class="col-md-6">
                                                <label class="form-label fw-bold font-size-12">Area / Estate <span class="text-muted fw-normal">(Optional)</span></label>
                                                <SelectSearchBox
                                                    :model-value="form.area_id"
                                                    :options="areaOptions"
                                                    :placeholder="!form.ward_id ? 'Select ward first' : (areasList.length ? 'Select Area' : 'No areas listed for this ward')"
                                                    :disabled="!form.ward_id || !areasList.length"
                                                    @update:model-value="(val) => form.area_id = val"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Branch Physical Location Map Card -->
                        <div class="col-lg-5">
                            <div class="card border rounded-2 bg-white p-4 h-100 d-flex flex-column">
                                <div class="d-flex align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
                                    <div class="d-flex align-items-center gap-2 min-w-0">
                                        <Icon icon="ri:map-2-line" class="fs-4 text-primary flex-shrink-0" />
                                        <div class="min-w-0">
                                            <h5 class="fw-bold text-dark mb-0 font-size-15 text-truncate">Branch Physical Location</h5>
                                            <p class="text-muted font-size-12 mb-0 text-truncate">Map pin used for delivery distance &amp; ETA.</p>
                                        </div>
                                    </div>
                                    <router-link
                                        to="/branches"
                                        class="btn btn-white btn-sm font-size-11 fw-semibold text-nowrap d-inline-flex align-items-center gap-1"
                                    >
                                        <span>Branches</span>
                                        <Icon icon="ri:arrow-right-up-line" class="fs-6" />
                                    </router-link>
                                </div>

                                <!-- Loading branches -->
                                <div v-if="loadingBranches" class="py-2">
                                    <SkeletonLoader variant="card" :count="1" />
                                </div>

                                <template v-else-if="activeMapBranch">
                                    <!-- Branch selector (multi-branch) or branch pill (single-branch) -->
                                    <div class="mb-3">
                                        <div v-if="branchesList.length > 1">
                                            <label class="form-label fw-bold font-size-12 mb-1">Viewing Branch</label>
                                            <select
                                                v-model="selectedMapBranchId"
                                                class="form-select form-select-sm"
                                                @change="onMapBranchChanged"
                                            >
                                                <option v-for="b in branchesList" :key="b.id" :value="b.id">
                                                    {{ b.name }}{{ b.is_main ? ' (Main Branch)' : '' }}
                                                </option>
                                            </select>
                                        </div>
                                        <div
                                            v-else
                                            class="d-flex align-items-center justify-content-between gap-2 p-2 rounded border"
                                            style="background-color: #f8fafc;"
                                        >
                                            <div class="d-flex align-items-center gap-2 min-w-0">
                                                <Icon icon="ri:store-2-line" class="fs-5 text-primary flex-shrink-0" />
                                                <span class="fw-bold font-size-13 text-dark text-truncate">{{ activeMapBranch.name }}</span>
                                            </div>
                                            <span v-if="activeMapBranch.is_main" class="badge bg-primary-subtle text-primary font-size-11">
                                                Main Branch
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Map Preview or Empty Pin State -->
                                    <div v-if="mapPreviewCoords" class="mb-3">
                                        <GoogleMapPreview
                                            :latitude="mapPreviewCoords.latitude"
                                            :longitude="mapPreviewCoords.longitude"
                                            :label="mapPreviewLabel"
                                            height="240"
                                            :zoom="16"
                                        />

                                        <div class="d-flex align-items-center justify-content-between gap-2 mt-2 flex-wrap">
                                            <span class="font-monospace font-size-11 text-muted">
                                                {{ Number(mapPreviewCoords.latitude).toFixed(5) }}, {{ Number(mapPreviewCoords.longitude).toFixed(5) }}
                                            </span>
                                            <a
                                                :href="`https://www.google.com/maps?q=${mapPreviewCoords.latitude},${mapPreviewCoords.longitude}`"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="font-size-11 fw-semibold text-primary text-decoration-none d-inline-flex align-items-center gap-1"
                                            >
                                                <span>Open in Google Maps</span>
                                                <Icon icon="ri:external-link-line" />
                                            </a>
                                        </div>
                                    </div>

                                    <div
                                        v-else
                                        class="rounded border d-flex flex-column align-items-center justify-content-center text-center p-4 mb-3"
                                        style="background-color: #f8fafc; min-height: 200px;"
                                    >
                                        <Icon icon="ri:map-pin-off-line" class="fs-1 text-muted mb-2" />
                                        <div class="fw-bold font-size-13 text-dark mb-1">No map pin set yet</div>
                                        <p class="text-muted font-size-12 mb-0" style="max-width: 260px;">
                                            Search for <strong>{{ activeMapBranch.name }}</strong> below to pin its physical GPS location on the map.
                                        </p>
                                    </div>

                                    <!-- Quick Location Search & Pin Update -->
                                    <div class="mt-auto pt-3 border-top">
                                        <label class="form-label fw-bold font-size-12 mb-1">
                                            {{ mapPreviewCoords ? 'Update Branch Map Pin' : 'Pin Branch Location' }}
                                        </label>
                                        <GoogleLocationInput
                                            v-model="branchLocationQuery"
                                            placeholder="Search building, street or landmark..."
                                            @location-selected="onBranchMapPinSelected"
                                            @location-cleared="onBranchMapPinCleared"
                                        />

                                        <div
                                            v-if="pendingBranchPin"
                                            class="d-flex align-items-center justify-content-between gap-2 mt-2 pt-1"
                                        >
                                            <button
                                                type="button"
                                                class="btn btn-white btn-sm font-size-12"
                                                :disabled="savingBranchPin"
                                                @click="onBranchMapPinCleared"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                class="btn btn-primary btn-sm font-size-12 fw-semibold d-inline-flex align-items-center gap-1"
                                                :disabled="savingBranchPin"
                                                @click="saveBranchLocationPin"
                                            >
                                                <span v-if="savingBranchPin" class="spinner-border spinner-border-sm" role="status"></span>
                                                <Icon v-else icon="ri:map-pin-add-line" class="fs-6" />
                                                <span>{{ savingBranchPin ? 'Saving Pin...' : 'Save Location Pin' }}</span>
                                            </button>
                                        </div>
                                        <div v-else class="text-muted font-size-11 mt-1">
                                            Used as the starting point for POS delivery distance and ETA estimates.
                                        </div>
                                    </div>
                                </template>

                                <div
                                    v-else
                                    class="rounded border d-flex flex-column align-items-center justify-content-center text-center p-4 flex-grow-1"
                                    style="background-color: #f8fafc;"
                                >
                                    <Icon icon="ri:store-2-line" class="fs-1 text-muted mb-2" />
                                    <div class="fw-bold font-size-13 text-dark mb-1">No branches found</div>
                                    <p class="text-muted font-size-12 mb-3">Create a branch to set its physical location on the map.</p>
                                    <router-link to="/branches" class="btn btn-primary btn-sm font-size-12">
                                        Go to Branches
                                    </router-link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab 3: Branding & Colors -->
                <div v-show="activeTab === 'branding'" class="col-12">
                    <div class="row g-3">
                        <!-- Left: Branding controls -->
                        <div class="col-lg-7">
                            <div class="card border rounded-2 bg-white p-4 h-100">
                                <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                    <Icon icon="ri:palette-line" class="fs-4 text-primary" />
                                    <div>
                                        <h5 class="fw-bold text-dark mb-0 font-size-15">Brand Identity &amp; Colors</h5>
                                        <p class="text-muted font-size-12 mb-0">Custom branding applied across POS tills, customer displays, and receipts.</p>
                                    </div>
                                </div>

                                <!-- Logo Management with Cropper -->
                                <div class="mb-4">
                                    <label class="form-label fw-bold font-size-12">Business Logo</label>
                                    <div class="d-flex align-items-center gap-3">
                                        <div class="head-logo d-flex align-items-center justify-content-center bg-light overflow-hidden flex-shrink-0"
                                            style="width: 76px; height: 76px;">
                                            <img v-if="business.branding?.logo_url" :src="business.branding.logo_url"
                                                alt="Logo" class="img-fluid object-fit-contain" style="max-height: 64px; max-width: 64px;" />
                                            <Icon v-else icon="ri:image-line" class="fs-3 text-muted" />
                                        </div>

                                        <div>
                                            <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                                                <label for="tenant-logo-cropper-upload"
                                                    class="btn btn-light waves-effect btn-sm px-3 py-1 font-size-12 d-flex align-items-center gap-1 mb-0 cursor-pointer"
                                                    :class="{ disabled: uploadingLogo }">
                                                    <span v-if="uploadingLogo" class="spinner-border spinner-border-sm me-1" role="status"></span>
                                                    <Icon v-else icon="ri:crop-line" />
                                                    <span>{{ uploadingLogo ? 'Saving...' : (business.branding?.logo_url ? 'Change & Crop Logo' : 'Upload & Crop Logo') }}</span>
                                                </label>

                                                <button v-if="business.branding?.logo_url" type="button" @click="removeLogo" :disabled="uploadingLogo"
                                                    class="btn btn-soft-danger waves-effect btn-sm px-3 py-1 font-size-12 d-flex align-items-center gap-1">
                                                    <Icon icon="ri:delete-bin-line" />
                                                    <span>Remove Logo</span>
                                                </button>
                                            </div>
                                            <div class="text-muted font-size-11">
                                                Accepted formats: PNG, JPG, or WebP. An interactive square crop dialog will let you scale and position your image perfectly.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Brand Primary Color -->
                                <div class="mb-3">
                                    <label class="form-label fw-bold font-size-12">Primary Brand Color</label>
                                    <div class="d-flex align-items-center gap-2">
                                        <input type="color" v-model="form.primary_color" class="form-control form-control-color border"
                                            style="width: 48px; height: 38px; padding: 2px;" />
                                        <input type="text" v-model="form.primary_color" class="form-control font-monospace"
                                            placeholder="#2b59ff" style="max-width: 140px;" maxlength="7" />

                                        <!-- Preset Swatches -->
                                        <div class="d-flex align-items-center gap-1 ms-2">
                                            <button v-for="color in ['#2b59ff', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0f172a']"
                                                :key="color" type="button" @click="form.primary_color = color"
                                                class="color-swatch-btn rounded-circle border"
                                                :style="{ backgroundColor: color }" :title="color">
                                            </button>
                                        </div>
                                    </div>
                                    <div class="text-muted font-size-11 mt-1">Main color for navigation headers, buttons, and customer displays.</div>
                                </div>

                                <!-- Accent Color -->
                                <div class="mb-3">
                                    <label class="form-label fw-bold font-size-12">Accent Brand Color</label>
                                    <div class="d-flex align-items-center gap-2">
                                        <input type="color" v-model="form.accent_color" class="form-control form-control-color border"
                                            style="width: 48px; height: 38px; padding: 2px;" />
                                        <input type="text" v-model="form.accent_color" class="form-control font-monospace"
                                            placeholder="#10b981" style="max-width: 140px;" maxlength="7" />

                                        <div class="d-flex align-items-center gap-1 ms-2">
                                            <button v-for="color in ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#6366f1']"
                                                :key="color" type="button" @click="form.accent_color = color"
                                                class="color-swatch-btn rounded-circle border"
                                                :style="{ backgroundColor: color }" :title="color">
                                            </button>
                                        </div>
                                    </div>
                                    <div class="text-muted font-size-11 mt-1">Secondary highlight color for badges, success states, and quick action chips.</div>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Live Customer Display & Branding Preview -->
                        <div class="col-lg-5">
                            <div class="card border rounded-2 bg-white p-4 h-100">
                                <h6 class="fw-bold text-dark font-size-13 mb-3 d-flex align-items-center gap-2">
                                    <Icon icon="ri:eye-line" class="fs-5 text-primary" />
                                    <span>Live Brand Preview</span>
                                </h6>

                                <!-- Mockup Customer Display Header -->
                                <div class="rounded-2 border overflow-hidden p-3 mb-3"
                                    :style="{ borderTop: `4px solid ${form.primary_color || '#2b59ff'}` }">
                                    <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                        <div class="d-flex align-items-center gap-2">
                                            <div class="rounded-2 bg-light border p-1 d-flex align-items-center justify-content-center"
                                                style="width: 32px; height: 32px;">
                                                <img v-if="business.branding?.logo_url" :src="business.branding.logo_url"
                                                    alt="Preview" class="img-fluid object-fit-contain" style="max-height: 24px;" />
                                                <Icon v-else icon="ri:store-2-line" class="fs-5" :style="{ color: form.primary_color }" />
                                            </div>
                                            <div>
                                                <div class="fw-bold font-size-13 text-dark lh-1">{{ form.name || 'Your Business Name' }}</div>
                                                <small class="text-muted font-size-10">@{{ form.short_name || 'handle' }}</small>
                                            </div>
                                        </div>
                                        <span class="badge font-size-10 px-2 py-1"
                                            :style="{ backgroundColor: form.accent_color || '#10b981', color: '#fff' }">
                                            Verified
                                        </span>
                                    </div>

                                    <div class="p-2 rounded bg-light font-size-11 text-muted mb-2">
                                        <div class="d-flex justify-content-between">
                                            <span>POS Register #1</span>
                                            <span class="fw-bold text-dark">Total: KES 1,450.00</span>
                                        </div>
                                    </div>

                                    <button type="button" class="btn btn-sm w-100 text-white font-size-12 fw-semibold"
                                        :style="{ backgroundColor: form.primary_color || '#2b59ff' }">
                                        Sample Action Button
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab 4: Documents, Invoices & Printing (With Vertical Side Menu) -->
                <div v-show="activeTab === 'documents'" class="col-12">
                    <div class="row g-3">
                        <!-- Left: Vertical Sub-Navigation Menu -->
                        <div class="col-lg-3 col-md-4">
                            <div class="card border rounded-2 bg-white overflow-hidden mb-3">
                                <div class="p-3 border-bottom bg-light">
                                    <h6 class="fw-bold text-dark mb-0 font-size-13 d-flex align-items-center gap-2">
                                        <Icon icon="ri:file-list-3-line" class="fs-5 text-primary" />
                                        <span>Document Layouts</span>
                                    </h6>
                                    <small class="text-muted font-size-11">Configure prints &amp; templates</small>
                                </div>

                                <div class="p-2 d-flex flex-column gap-1">
                                    <button v-for="doc in docTypes" :key="doc.key" type="button"
                                        class="doc-menu-btn text-start p-2 px-3 rounded-2 border-0 bg-transparent d-flex align-items-center justify-content-between"
                                        :class="{ active: activeDocType === doc.key }"
                                        @click="activeDocType = doc.key">
                                        <div class="d-flex align-items-center gap-2 min-w-0">
                                            <div class="doc-menu-icon-box rounded-2 d-flex align-items-center justify-content-center"
                                                :class="activeDocType === doc.key ? 'bg-primary text-white' : 'bg-light text-muted'">
                                                <Icon :icon="doc.icon" class="fs-5" />
                                            </div>
                                            <div class="min-w-0">
                                                <div class="fw-semibold font-size-12 text-dark text-truncate doc-title">{{ doc.label }}</div>
                                                <small class="text-muted font-size-10 text-truncate d-block">{{ doc.desc }}</small>
                                            </div>
                                        </div>
                                        <span class="badge font-size-9 px-1 py-0 border flex-shrink-0"
                                            :class="activeDocType === doc.key ? 'bg-primary-subtle text-primary border-primary-subtle' : 'bg-light text-muted'">
                                            {{ doc.badge }}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Document Content Pane -->
                        <div class="col-lg-9 col-md-8">
                            <!-- 1. POS Thermal Receipts (58mm / 80mm) -->
                            <div v-show="activeDocType === 'thermal'" class="row g-3">
                                <div class="col-lg-7">
                                    <div class="card border rounded-2 bg-white p-4 h-100">
                                        <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                            <Icon icon="ri:printer-line" class="fs-4 text-primary" />
                                            <div>
                                                <h5 class="fw-bold text-dark mb-0 font-size-15">POS Thermal Receipts</h5>
                                                <p class="text-muted font-size-12 mb-0">Roll printer width, logo mode, KRA PIN display, and footer notes.</p>
                                            </div>
                                        </div>

                                        <!-- Default POS Printer Type (58mm / 80mm / A4) -->
                                        <div class="mb-3">
                                            <label class="form-label fw-bold font-size-12">Default POS Printer &amp; Receipt Format</label>
                                            <div class="row g-2">
                                                <div class="col-md-4">
                                                    <div class="paper-width-card p-3 rounded-2 border cursor-pointer h-100"
                                                        :class="{ 'border-primary bg-primary-subtle': form.receipt_printer_type === 'thermal_58' }"
                                                        @click="form.receipt_printer_type = 'thermal_58'; form.receipt_paper_width = '58mm'">
                                                        <div class="d-flex align-items-center justify-content-between mb-1">
                                                            <span class="fw-bold font-size-13 text-dark">58mm Thermal</span>
                                                            <Icon class="fs-5"
                                                                :icon="form.receipt_printer_type === 'thermal_58' ? 'ri:checkbox-circle-fill' : 'ri:checkbox-blank-circle-line'"
                                                                :class="form.receipt_printer_type === 'thermal_58' ? 'text-primary' : 'text-muted'" />
                                                        </div>
                                                        <p class="text-muted font-size-11 mb-0">2-inch handheld / bluetooth roll printers.</p>
                                                    </div>
                                                </div>

                                                <div class="col-md-4">
                                                    <div class="paper-width-card p-3 rounded-2 border cursor-pointer h-100"
                                                        :class="{ 'border-primary bg-primary-subtle': form.receipt_printer_type === 'thermal_80' }"
                                                        @click="form.receipt_printer_type = 'thermal_80'; form.receipt_paper_width = '80mm'">
                                                        <div class="d-flex align-items-center justify-content-between mb-1">
                                                            <span class="fw-bold font-size-13 text-dark">80mm Thermal</span>
                                                            <Icon class="fs-5"
                                                                :icon="form.receipt_printer_type === 'thermal_80' ? 'ri:checkbox-circle-fill' : 'ri:checkbox-blank-circle-line'"
                                                                :class="form.receipt_printer_type === 'thermal_80' ? 'text-primary' : 'text-muted'" />
                                                        </div>
                                                        <p class="text-muted font-size-11 mb-0">3-inch desktop thermal receipt printers.</p>
                                                    </div>
                                                </div>

                                                <div class="col-md-4">
                                                    <div class="paper-width-card p-3 rounded-2 border cursor-pointer h-100"
                                                        :class="{ 'border-primary bg-primary-subtle': form.receipt_printer_type === 'a4' }"
                                                        @click="form.receipt_printer_type = 'a4'">
                                                        <div class="d-flex align-items-center justify-content-between mb-1">
                                                            <span class="fw-bold font-size-13 text-dark">A4 Sheet</span>
                                                            <Icon class="fs-5"
                                                                :icon="form.receipt_printer_type === 'a4' ? 'ri:checkbox-circle-fill' : 'ri:checkbox-blank-circle-line'"
                                                                :class="form.receipt_printer_type === 'a4' ? 'text-primary' : 'text-muted'" />
                                                        </div>
                                                        <p class="text-muted font-size-11 mb-0">Standard laser / inkjet office printers.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Logo Display Mode -->
                                        <div class="mb-3">
                                            <label class="form-label fw-bold font-size-12">Receipt Logo Rendering</label>
                                            <div class="d-flex align-items-center gap-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" value="mono" v-model="form.receipt_logo" id="r_logo_mono" />
                                                    <label class="form-check-label font-size-12" for="r_logo_mono">
                                                        Monochrome (Recommended)
                                                    </label>
                                                </div>
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" value="full" v-model="form.receipt_logo" id="r_logo_full" />
                                                    <label class="form-check-label font-size-12" for="r_logo_full">
                                                        Full Color
                                                    </label>
                                                </div>
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" value="none" v-model="form.receipt_logo" id="r_logo_none" />
                                                    <label class="form-check-label font-size-12" for="r_logo_none">
                                                        No Logo (Text Only)
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Show KRA PIN toggle -->
                                        <div class="mb-3 d-flex align-items-center justify-content-between p-3 rounded-2 border bg-light">
                                            <div>
                                                <div class="fw-bold text-dark font-size-12">Print KRA PIN on Receipts</div>
                                                <div class="text-muted font-size-11">Prints the business KRA PIN on customer receipts for tax records.</div>
                                            </div>
                                            <div class="form-check form-switch m-0">
                                                <input class="form-check-input" type="checkbox" role="switch" v-model="form.receipt_show_kra_pin" />
                                            </div>
                                        </div>

                                        <!-- Printed Copies -->
                                        <div class="mb-3">
                                            <label class="form-label fw-bold font-size-12">Default Printed Copies</label>
                                            <div class="d-flex align-items-center gap-2">
                                                <button v-for="num in [1, 2, 3]" :key="num" type="button"
                                                    @click="form.receipt_copies = num"
                                                    class="btn btn-sm px-3 py-1 font-size-12 border"
                                                    :class="form.receipt_copies === num ? 'btn-primary text-white' : 'btn-light'">
                                                    {{ num }} {{ num === 1 ? 'Copy (Customer)' : (num === 2 ? 'Copies (Customer + Kitchen)' : 'Copies') }}
                                                </button>
                                            </div>
                                        </div>

                                        <!-- Footer Note -->
                                        <div class="mb-0">
                                            <label class="form-label fw-bold font-size-12">Custom Footer Message</label>
                                            <textarea v-model="form.receipt_footer" class="form-control" rows="3"
                                                placeholder="Thank you for your business! Karibu tena." maxlength="500"></textarea>
                                        </div>
                                    </div>
                                </div>

                                <!-- Right: Thermal Receipt Preview -->
                                <div class="col-lg-5">
                                    <div class="card border rounded-2 bg-white p-4 h-100 d-flex flex-column align-items-center">
                                        <h6 class="fw-bold text-dark font-size-13 mb-3 align-self-start d-flex align-items-center gap-2">
                                            <Icon icon="ri:printer-line" class="fs-5 text-primary" />
                                            <span>Thermal Paper Live Preview</span>
                                        </h6>

                                        <div class="thermal-receipt-sheet p-3 rounded-1 border shadow-none"
                                            :style="{ width: form.receipt_paper_width === '80mm' ? '300px' : '250px' }">
                                            <div class="text-center mb-2">
                                                <div v-if="form.receipt_logo !== 'none' && business.branding?.logo_url" class="mb-1">
                                                    <img :src="business.branding.logo_url" alt="Receipt Logo" class="img-fluid"
                                                        :style="{
                                                            maxHeight: '44px',
                                                            filter: form.receipt_logo === 'mono' ? 'grayscale(100%) contrast(150%)' : 'none'
                                                        }" />
                                                </div>
                                                <div class="fw-bold font-size-14 text-dark text-uppercase tracking-wider lh-1">
                                                    {{ form.name || 'YOUR BUSINESS NAME' }}
                                                </div>
                                                <div class="font-size-10 text-muted mt-1">
                                                    {{ form.address_line || 'Main Branch, Nairobi' }}
                                                </div>
                                                <div v-if="form.phone" class="font-size-10 text-muted">
                                                    Tel: {{ form.phone }}
                                                </div>
                                                <div v-if="form.receipt_show_kra_pin && form.kra_pin" class="font-size-10 text-dark fw-bold mt-1">
                                                    KRA PIN: {{ form.kra_pin }}
                                                </div>
                                            </div>

                                            <div class="receipt-divider border-top border-dashed my-2"></div>

                                            <div class="font-size-10 text-muted d-flex justify-content-between">
                                                <span>Rcpt #10492</span>
                                                <span>20/11/2026 14:32</span>
                                            </div>
                                            <div class="font-size-10 text-muted d-flex justify-content-between">
                                                <span>Cashier: Jane</span>
                                                <span>Till: Counter 1</span>
                                            </div>

                                            <div class="receipt-divider border-top border-dashed my-2"></div>

                                            <div class="receipt-items font-size-11">
                                                <div class="d-flex justify-content-between mb-1">
                                                    <span class="text-truncate" style="max-width: 65%;">1x Tusker Lager 500ml</span>
                                                    <span class="fw-bold">KES 300.00</span>
                                                </div>
                                                <div class="d-flex justify-content-between mb-1">
                                                    <span class="text-truncate" style="max-width: 65%;">2x White Cap 500ml</span>
                                                    <span class="fw-bold">KES 600.00</span>
                                                </div>
                                                <div class="d-flex justify-content-between">
                                                    <span class="text-truncate" style="max-width: 65%;">1x Mineral Water 500ml</span>
                                                    <span class="fw-bold">KES 100.00</span>
                                                </div>
                                            </div>

                                            <div class="receipt-divider border-top border-dashed my-2"></div>

                                            <div class="receipt-totals font-size-11">
                                                <div class="d-flex justify-content-between text-muted font-size-10">
                                                    <span>Subtotal</span>
                                                    <span>KES 862.07</span>
                                                </div>
                                                <div class="d-flex justify-content-between text-muted font-size-10">
                                                    <span>VAT (16% Included)</span>
                                                    <span>KES 137.93</span>
                                                </div>
                                                <div class="d-flex justify-content-between fw-bold font-size-13 text-dark mt-1 pt-1 border-top">
                                                    <span>TOTAL</span>
                                                    <span>KES 1,000.00</span>
                                                </div>
                                                <div class="d-flex justify-content-between text-muted font-size-10 mt-1">
                                                    <span>Paid: M-PESA</span>
                                                    <span>KES 1,000.00</span>
                                                </div>
                                            </div>

                                            <div class="receipt-divider border-top border-dashed my-2"></div>

                                            <div class="text-center font-size-10 text-muted mt-2">
                                                {{ form.receipt_footer || 'Thank you for shopping with us! Karibu tena.' }}
                                            </div>

                                            <div class="text-center mt-2 opacity-75">
                                                <div class="font-monospace font-size-8 text-muted">|||| | | ||| |||| | ||| ||</div>
                                                <div class="font-size-8 text-muted">PAY-{{ business.human_code }}-10492</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 2. Commercial Tax Invoices (A4) with Template Selection -->
                            <div v-show="activeDocType === 'invoice'" class="row g-3">
                                <div class="col-12">
                                    <div class="card border rounded-2 bg-white p-4">
                                        <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                            <div class="d-flex align-items-center gap-2">
                                                <Icon icon="ri:file-text-line" class="fs-4 text-primary" />
                                                <div>
                                                    <h5 class="fw-bold text-dark mb-0 font-size-15">Commercial Tax Invoice (A4)</h5>
                                                    <p class="text-muted font-size-12 mb-0">Select an A4 invoice design template and configure corporate billing rules.</p>
                                                </div>
                                            </div>
                                            <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-size-11 px-2 py-1">
                                                A4 Standard Format
                                            </span>
                                        </div>

                                        <!-- A4 Invoice Template Grid -->
                                        <label class="form-label fw-bold font-size-12 mb-2">Choose Invoice Layout Template</label>
                                        <div class="row g-3 mb-4">
                                            <div v-for="tpl in a4Templates" :key="tpl.id" class="col-md-3 col-sm-6">
                                                <div class="template-card p-2 rounded-2 border cursor-pointer h-100 position-relative transition-all"
                                                    :class="{ 'active-template border-primary': form.invoice_template === tpl.id }"
                                                    @click="form.invoice_template = tpl.id">
                                                    <div class="d-flex align-items-center justify-content-between mb-2">
                                                        <span class="badge font-size-10 px-2 py-1"
                                                            :class="form.invoice_template === tpl.id ? 'bg-primary text-white' : 'bg-light text-muted'">
                                                            {{ tpl.badge }}
                                                        </span>
                                                        <Icon class="fs-5"
                                                            :icon="form.invoice_template === tpl.id ? 'ri:checkbox-circle-fill' : 'ri:checkbox-blank-circle-line'"
                                                            :class="form.invoice_template === tpl.id ? 'text-primary' : 'text-muted'" />
                                                    </div>

                                                    <!-- Live Appropriate Document Rendered in the Select Button at 0.15 micro-scale -->
                                                    <div class="template-thumbnail-box rounded border bg-light mb-2 d-flex align-items-start justify-content-center position-relative overflow-hidden"
                                                        style="height: 145px; cursor: pointer; user-select: none;">
                                                        <div class="micro-doc-preview w-100 d-flex justify-content-center"
                                                            style="zoom: 0.145; width: 794px; pointer-events: none; transform-origin: top center;">
                                                            <component :is="templateComponentMap[tpl.id] || InvoiceTwo"
                                                                :business="liveBusinessData" :items="invoiceItems" />
                                                        </div>
                                                    </div>

                                                    <div class="fw-bold font-size-12 text-dark">{{ tpl.name }}</div>
                                                    <p class="text-muted font-size-11 mb-0 mt-1 lh-sm">{{ tpl.desc }}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Invoice Parameters -->
                                        <div class="row g-3">
                                            <div class="col-md-4">
                                                <label class="form-label fw-bold font-size-12">Invoice Number Prefix</label>
                                                <input type="text" v-model="form.invoice_prefix" class="form-control"
                                                    placeholder="INV-" maxlength="20" />
                                                <small class="text-muted font-size-11">e.g. INV-2026-0001</small>
                                            </div>

                                            <div class="col-md-4">
                                                <label class="form-label fw-bold font-size-12">Default Payment Terms</label>
                                                <select v-model="form.invoice_payment_terms" class="form-select font-size-12">
                                                    <option value="Due on Receipt">Due on Receipt</option>
                                                    <option value="Net 7 days">Net 7 days</option>
                                                    <option value="Net 14 days">Net 14 days</option>
                                                    <option value="Net 30 days">Net 30 days</option>
                                                    <option value="Net 60 days">Net 60 days</option>
                                                </select>
                                            </div>

                                            <div class="col-md-4">
                                                <label class="form-label fw-bold font-size-12">Bank &amp; M-Pesa Remittance</label>
                                                <div class="d-flex align-items-center justify-content-between p-2 rounded border bg-light">
                                                    <span class="font-size-12 text-dark">Print Bank Accounts</span>
                                                    <div class="form-check form-switch m-0">
                                                        <input class="form-check-input" type="checkbox" role="switch" v-model="form.invoice_show_bank" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="col-12">
                                                <label class="form-label fw-bold font-size-12">Invoice Terms &amp; Conditions Note</label>
                                                <textarea v-model="form.invoice_terms" class="form-control font-size-12" rows="3"
                                                    placeholder="e.g. Payment is due within 14 days. Goods remain property of the seller until paid in full."></textarea>
                                            </div>
                                        </div>

                                        <!-- A4 Interactive Live Preview Box with the Project Invoices Designs -->
                                        <div class="mt-4 pt-3 border-top">
                                            <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                                                <div>
                                                    <h6 class="fw-bold text-dark font-size-13 mb-0 d-flex align-items-center gap-2">
                                                        <Icon icon="ri:eye-line" class="fs-5 text-primary" />
                                                        <span>Live Template Render: {{ currentTemplateName }}</span>
                                                    </h6>
                                                    <small class="text-muted font-size-11">Direct rendering of the actual invoice template component from the project</small>
                                                </div>

                                                <div class="d-flex align-items-center gap-2 flex-wrap">
                                                    <button type="button" @click="showDocPreviewModal = true"
                                                        class="btn btn-sm btn-primary d-flex align-items-center gap-1 font-size-12 shadow-none px-3">
                                                        <Icon icon="ri:file-text-line" class="fs-5" />
                                                        <span>Preview as Document</span>
                                                    </button>
                                                    <button type="button" @click="showItemEditor = !showItemEditor"
                                                        class="btn btn-sm btn-white border d-flex align-items-center gap-1 font-size-12 shadow-none">
                                                        <Icon icon="ri:list-settings-line" class="text-primary" />
                                                        <span>{{ showItemEditor ? 'Hide Line Items' : 'Customize Line Items' }}</span>
                                                    </button>
                                                    <router-link to="/invoices/templates" target="_blank"
                                                        class="btn btn-sm btn-white border d-flex align-items-center gap-1 font-size-12 shadow-none">
                                                        <Icon icon="ri:external-link-line" class="text-primary" />
                                                        <span>Templates Center</span>
                                                    </router-link>
                                                    <span class="badge bg-light text-muted border font-size-11">210mm × 297mm (A4)</span>
                                                </div>
                                            </div>

                                            <!-- Optional Live Line Items Editor for Realistic Dynamic Invoices -->
                                            <div v-if="showItemEditor" class="mb-3 p-3 bg-light rounded-2 border">
                                                <div class="d-flex align-items-center justify-content-between mb-2">
                                                    <div>
                                                        <div class="fw-bold font-size-12 text-dark">Dynamic Invoice Line Items</div>
                                                        <small class="text-muted font-size-11">Add or adjust items to see dynamic totals, taxes, and layouts adapt in real time</small>
                                                    </div>
                                                    <button type="button" class="btn btn-sm btn-white border font-size-11 shadow-none" @click="addItem">
                                                        <Icon icon="ri:add-line" class="text-primary me-1" /> Add Item
                                                    </button>
                                                </div>
                                                <div class="table-responsive">
                                                    <table class="table table-sm border bg-white mb-0 font-size-12 align-middle">
                                                        <thead class="table-light">
                                                            <tr>
                                                                <th>Item Name / Title</th>
                                                                <th>Description</th>
                                                                <th class="text-center" style="width: 80px;">Qty</th>
                                                                <th class="text-end" style="width: 140px;">Price (KES)</th>
                                                                <th class="text-end" style="width: 140px;">Total (KES)</th>
                                                                <th style="width: 40px;"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr v-for="(it, idx) in invoiceItems" :key="it.id">
                                                                <td>
                                                                    <input type="text" v-model="it.name" class="form-control form-control-sm font-size-12" placeholder="Item name" />
                                                                </td>
                                                                <td>
                                                                    <input type="text" v-model="it.description" class="form-control form-control-sm font-size-12" placeholder="Item description" />
                                                                </td>
                                                                <td>
                                                                    <input type="number" v-model.number="it.qty" min="1" class="form-control form-control-sm font-size-12 text-center" />
                                                                </td>
                                                                <td>
                                                                    <input type="number" v-model.number="it.price" step="100" class="form-control form-control-sm font-size-12 text-end" />
                                                                </td>
                                                                <td class="text-end fw-semibold text-dark">
                                                                    {{ (it.qty * it.price).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                                                                </td>
                                                                <td class="text-center">
                                                                    <button type="button" class="btn btn-sm btn-link text-danger p-0" @click="removeItem(idx)" :disabled="invoiceItems.length <= 1">
                                                                        <Icon icon="ri:delete-bin-line" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            <!-- Scaled A4 Preview Container with the Actual Imported Vue Template Components -->
                                            <div class="a4-preview-viewport p-4 rounded-2 border bg-light overflow-auto d-flex justify-content-center">
                                                <div class="user-template-canvas w-100 d-flex justify-content-center" style="zoom: 0.9;">
                                                    <component :is="templateComponentMap[form.invoice_template] || InvoiceTwo"
                                                        :business="liveBusinessData" :items="invoiceItems" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 3. Official Payment Receipts (A4) -->
                            <div v-show="activeDocType === 'receipt'" class="row g-3">
                                <div class="col-12">
                                    <div class="card border rounded-2 bg-white p-4">
                                        <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                            <div class="d-flex align-items-center gap-2">
                                                <Icon icon="ri:file-shield-2-line" class="fs-4 text-primary" />
                                                <div>
                                                    <h5 class="fw-bold text-dark mb-0 font-size-15">Official Payment Receipts (A4)</h5>
                                                    <p class="text-muted font-size-12 mb-0">Formal stamped receipts for cash, cheque, bank transfer (EFT/RTGS), and bulk settlements.</p>
                                                </div>
                                            </div>
                                            <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-size-11 px-2 py-1">
                                                A4 Stamped Voucher
                                            </span>
                                        </div>

                                        <div class="row g-3 mb-4">
                                            <div class="col-md-6">
                                                <label class="form-label fw-bold font-size-12">Receipt Number Prefix</label>
                                                <input type="text" v-model="form.receipt_prefix" class="form-control"
                                                    placeholder="RCT-" maxlength="20" />
                                                <small class="text-muted font-size-11">e.g. RCT-2026-0001</small>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label fw-bold font-size-12">Supported Payment Instruments</label>
                                                <div class="d-flex align-items-center gap-2 flex-wrap pt-1">
                                                    <span class="badge bg-light text-dark border font-size-11 py-1 px-2"><Icon icon="ri:money-dollar-circle-line" class="me-1 text-success" /> Cash</span>
                                                    <span class="badge bg-light text-dark border font-size-11 py-1 px-2"><Icon icon="ri:smartphone-line" class="me-1 text-success" /> M-Pesa</span>
                                                    <span class="badge bg-light text-dark border font-size-11 py-1 px-2"><Icon icon="ri:bank-line" class="me-1 text-primary" /> EFT / RTGS</span>
                                                    <span class="badge bg-light text-dark border font-size-11 py-1 px-2"><Icon icon="ri:file-paper-2-line" class="me-1 text-secondary" /> Cheque</span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Live A4 Official Receipt Mockup -->
                                        <div class="a4-preview-viewport p-4 rounded-2 border bg-light overflow-auto d-flex justify-content-center">
                                            <div class="a4-paper-sheet bg-white p-5 rounded-1 border shadow-none"
                                                :style="{ borderColor: form.primary_color || '#2b59ff' }">
                                                <div class="d-flex justify-content-between align-items-start pb-3 border-bottom mb-4">
                                                    <div class="d-flex align-items-center gap-3">
                                                        <img v-if="business.branding?.logo_url" :src="business.branding.logo_url"
                                                            alt="Logo" class="img-fluid" style="max-height: 52px;" />
                                                        <div v-else class="rounded-2 p-2 bg-light border text-primary">
                                                            <Icon icon="ri:building-2-line" class="fs-2" />
                                                        </div>
                                                        <div>
                                                            <h4 class="fw-bold text-dark mb-0">{{ form.name || 'YOUR BUSINESS NAME' }}</h4>
                                                            <div class="text-muted font-size-12">{{ form.address_line || 'Main Headquarters, Nairobi, Kenya' }}</div>
                                                            <div class="text-muted font-size-11">Tel: {{ form.phone || '+254 700 000 000' }}</div>
                                                            <div v-if="form.kra_pin" class="text-dark font-size-11 fw-bold mt-1">KRA PIN: {{ form.kra_pin }}</div>
                                                        </div>
                                                    </div>
                                                    <div class="text-end">
                                                        <h3 class="fw-bold text-uppercase tracking-wider mb-0 text-success">OFFICIAL RECEIPT</h3>
                                                        <div class="font-size-13 fw-semibold text-dark mt-1">{{ form.receipt_prefix || 'RCT-' }}2026-0819</div>
                                                        <div class="text-muted font-size-11">Date: 20 Nov 2026</div>
                                                    </div>
                                                </div>

                                                <div class="bg-light p-3 rounded-2 border mb-4 font-size-12">
                                                    <div class="row g-2">
                                                        <div class="col-8">
                                                            <div class="text-muted font-size-11">Received with thanks from:</div>
                                                            <div class="fw-bold text-dark font-size-13">Highland Logistics Ltd</div>
                                                            <div class="text-muted font-size-11">PIN: P051239870B · P.O. Box 4500-00100 Nairobi</div>
                                                        </div>
                                                        <div class="col-4 text-end">
                                                            <div class="text-muted font-size-11">Payment Method:</div>
                                                            <div class="fw-bold text-dark font-size-13">M-PESA / Bank EFT</div>
                                                            <small class="text-muted">Ref: QBG78912301</small>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="p-3 border rounded-2 mb-4 font-size-12 bg-white">
                                                    <div class="d-flex justify-content-between pb-2 border-bottom mb-2">
                                                        <span class="text-muted">Payment For / Allocation:</span>
                                                        <span class="fw-bold text-dark">Invoice #INV-2026-0042 (Full Settlement)</span>
                                                    </div>
                                                    <div class="d-flex justify-content-between pb-2 border-bottom mb-2">
                                                        <span class="text-muted">Amount in Words:</span>
                                                        <span class="fst-italic text-dark fw-semibold">Fifty-One Thousand Kenyan Shillings Only</span>
                                                    </div>
                                                    <div class="d-flex justify-content-between align-items-center pt-2">
                                                        <span class="fw-bold font-size-14 text-dark">Total Amount Received:</span>
                                                        <span class="fw-bold font-size-16 text-success">KES 51,000.00</span>
                                                    </div>
                                                </div>

                                                <div class="d-flex justify-content-between align-items-end pt-4 mt-4 border-top">
                                                    <div class="text-center" style="width: 180px;">
                                                        <div class="border-top border-dark pt-1 font-size-11 text-muted">Received By</div>
                                                    </div>
                                                    <div class="text-center p-2 rounded border border-success border-2 bg-success-subtle" style="width: 160px; transform: rotate(-5deg);">
                                                        <div class="fw-bold text-success font-size-13 text-uppercase">PAID &amp; RECEIVED</div>
                                                        <div class="font-size-9 text-success opacity-75">OFFICIAL CASH OFFICE</div>
                                                    </div>
                                                    <div class="text-center" style="width: 180px;">
                                                        <div class="border-top border-dark pt-1 font-size-11 text-muted">Cashier Signature</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 4. Quotations & Estimates (A4) -->
                            <div v-show="activeDocType === 'quote'" class="row g-3">
                                <div class="col-12">
                                    <div class="card border rounded-2 bg-white p-4">
                                        <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                            <div class="d-flex align-items-center gap-2">
                                                <Icon icon="ri:file-list-3-line" class="fs-4 text-primary" />
                                                <div>
                                                    <h5 class="fw-bold text-dark mb-0 font-size-15">Price Quotations &amp; Proforma Estimates (A4)</h5>
                                                    <p class="text-muted font-size-12 mb-0">Pre-sale pricing quotations, tender bids, event packages, and customer proposals.</p>
                                                </div>
                                            </div>
                                            <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-size-11 px-2 py-1">
                                                A4 Quotation Format
                                            </span>
                                        </div>

                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label fw-bold font-size-12">Quotation Number Prefix</label>
                                                <input type="text" v-model="form.quote_prefix" class="form-control"
                                                    placeholder="QT-" maxlength="20" />
                                                <small class="text-muted font-size-11">e.g. QT-2026-0001</small>
                                            </div>

                                            <div class="col-md-6">
                                                <label class="form-label fw-bold font-size-12">Default Quote Validity Period</label>
                                                <select v-model="form.quote_validity" class="form-select font-size-12">
                                                    <option value="7 days">7 days</option>
                                                    <option value="14 days">14 days</option>
                                                    <option value="30 days">30 days</option>
                                                    <option value="60 days">60 days</option>
                                                </select>
                                                <small class="text-muted font-size-11">Prices remain guaranteed for this duration from date of issuance.</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 5. Delivery Notes & Waybills (A4) -->
                            <div v-show="activeDocType === 'delivery'" class="row g-3">
                                <div class="col-12">
                                    <div class="card border rounded-2 bg-white p-4">
                                        <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                            <div class="d-flex align-items-center gap-2">
                                                <Icon icon="ri:truck-line" class="fs-4 text-primary" />
                                                <div>
                                                    <h5 class="fw-bold text-dark mb-0 font-size-15">Delivery Notes &amp; Dispatch Waybills (A4)</h5>
                                                    <p class="text-muted font-size-12 mb-0">Merchandise transit documents with vehicle registration, driver details, and received-by signature.</p>
                                                </div>
                                            </div>
                                            <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-size-11 px-2 py-1">
                                                A4 Dispatch Slips
                                            </span>
                                        </div>

                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label fw-bold font-size-12">Delivery Note Prefix</label>
                                                <input type="text" v-model="form.delivery_prefix" class="form-control"
                                                    placeholder="DN-" maxlength="20" />
                                                <small class="text-muted font-size-11">e.g. DN-2026-0001</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 6. Credit Notes & Returns (A4) -->
                            <div v-show="activeDocType === 'credit_note'" class="row g-3">
                                <div class="col-12">
                                    <div class="card border rounded-2 bg-white p-4">
                                        <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                            <div class="d-flex align-items-center gap-2">
                                                <Icon icon="ri:refund-2-line" class="fs-4 text-primary" />
                                                <div>
                                                    <h5 class="fw-bold text-dark mb-0 font-size-15">Credit Notes &amp; Sales Returns (A4)</h5>
                                                    <p class="text-muted font-size-12 mb-0">Issued against previous invoices for returned goods, damaged inventory, or billing price adjustments.</p>
                                                </div>
                                            </div>
                                            <span class="badge bg-danger-subtle text-danger border border-danger-subtle font-size-11 px-2 py-1">
                                                A4 Credit Adjustment
                                            </span>
                                        </div>

                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label fw-bold font-size-12">Credit Note Prefix</label>
                                                <input type="text" v-model="form.credit_note_prefix" class="form-control"
                                                    placeholder="CN-" maxlength="20" />
                                                <small class="text-muted font-size-11">e.g. CN-2026-0001</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 7. Purchase Orders (LPO - A4) -->
                            <div v-show="activeDocType === 'purchase_order'" class="row g-3">
                                <div class="col-12">
                                    <div class="card border rounded-2 bg-white p-4">
                                        <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                            <div class="d-flex align-items-center gap-2">
                                                <Icon icon="ri:shopping-bag-3-line" class="fs-4 text-primary" />
                                                <div>
                                                    <h5 class="fw-bold text-dark mb-0 font-size-15">Local Purchase Orders (LPO - A4)</h5>
                                                    <p class="text-muted font-size-12 mb-0">Official procurement purchase orders sent to beverage, food, and inventory suppliers.</p>
                                                </div>
                                            </div>
                                            <span class="badge bg-primary-subtle text-primary border border-primary-subtle font-size-11 px-2 py-1">
                                                A4 Purchase Order
                                            </span>
                                        </div>

                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label fw-bold font-size-12">Purchase Order (LPO) Prefix</label>
                                                <input type="text" v-model="form.purchase_order_prefix" class="form-control"
                                                    placeholder="LPO-" maxlength="20" />
                                                <small class="text-muted font-size-11">e.g. LPO-2026-0001</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 8. Bank & Remittance Accounts -->
                            <div v-show="activeDocType === 'banking'" class="row g-3">
                                <div class="col-12">
                                    <div class="card border rounded-2 bg-white p-4">
                                        <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                            <Icon icon="ri:bank-card-line" class="fs-4 text-primary" />
                                            <div>
                                                <h5 class="fw-bold text-dark mb-0 font-size-15">Bank Accounts &amp; M-Pesa Remittance</h5>
                                                <p class="text-muted font-size-12 mb-0">Official payment accounts printed on A4 invoices and quotations for direct customer EFT and M-Pesa transfers.</p>
                                            </div>
                                        </div>

                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label fw-bold font-size-12">Bank Name</label>
                                                <input type="text" v-model="form.bank_name" class="form-control"
                                                    placeholder="e.g. KCB Bank Kenya Ltd" maxlength="100" />
                                            </div>

                                            <div class="col-md-6">
                                                <label class="form-label fw-bold font-size-12">Bank Branch</label>
                                                <input type="text" v-model="form.bank_branch" class="form-control"
                                                    placeholder="e.g. Sarit Centre Branch, Westlands" maxlength="100" />
                                            </div>

                                            <div class="col-md-6">
                                                <label class="form-label fw-bold font-size-12">Account Name</label>
                                                <input type="text" v-model="form.bank_account_name" class="form-control"
                                                    placeholder="e.g. Arsenal Sports Bar Ltd" maxlength="120" />
                                            </div>

                                            <div class="col-md-6">
                                                <label class="form-label fw-bold font-size-12">Account Number</label>
                                                <input type="text" v-model="form.bank_account_number" class="form-control font-monospace"
                                                    placeholder="e.g. 1234567890" maxlength="50" />
                                            </div>

                                            <div class="col-md-4">
                                                <label class="form-label fw-bold font-size-12">SWIFT / BIC Code</label>
                                                <input type="text" v-model="form.bank_swift" class="form-control font-monospace"
                                                    placeholder="e.g. KCBLKENX" maxlength="30" />
                                            </div>

                                            <div class="col-md-4">
                                                <label class="form-label fw-bold font-size-12">M-Pesa Buy Goods Till No</label>
                                                <input type="text" v-model="form.bank_mpesa_till" class="form-control font-monospace"
                                                    placeholder="e.g. 543210" maxlength="30" />
                                            </div>

                                            <div class="col-md-4">
                                                <label class="form-label fw-bold font-size-12">M-Pesa Paybill &amp; Account</label>
                                                <div class="input-group">
                                                    <input type="text" v-model="form.bank_mpesa_paybill" class="form-control font-monospace"
                                                        placeholder="Paybill No" style="max-width: 45%;" maxlength="30" />
                                                    <input type="text" v-model="form.bank_mpesa_account" class="form-control font-monospace"
                                                        placeholder="Account No / Invoice #" maxlength="60" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab: Tab & Credit Security Rules -->
                <div v-show="activeTab === 'tabs_rules'" class="col-12">
                    <div class="card border rounded-2 bg-white p-4">
                        <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
                            <div class="d-flex align-items-center gap-2">
                                <Icon icon="ri:shield-check-line" class="fs-4 text-primary" />
                                <div>
                                    <h5 class="fw-bold text-dark mb-0 font-size-15">Tab &amp; Open Bill Security Rules</h5>
                                    <p class="text-muted font-size-12 mb-0">Control running bar bills, unpaid exposure limits, cashier quotas, and sensible hospitality timing.</p>
                                </div>
                            </div>
                            <div class="form-check form-switch form-switch-md">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="tabsEnabledSwitch"
                                    v-model="form.tabs_enabled"
                                />
                                <label class="form-check-label fw-bold font-size-12 ms-1" for="tabsEnabledSwitch">
                                    {{ form.tabs_enabled ? 'Open Tabs Enabled' : 'Open Tabs Disabled' }}
                                </label>
                            </div>
                        </div>

                        <!-- Hospitality Context Banner -->
                        <div class="alert alert-info border-0 rounded-2 p-3 mb-4 d-flex align-items-start gap-3" style="background-color: #f0f9ff; border-left: 4px solid #0284c7 !important;">
                            <div class="flex-shrink-0 mt-0.5">
                                <Icon icon="ri:beer-line" class="fs-4 text-primary" />
                            </div>
                            <div class="flex-grow-1 font-size-12" style="color: #0369a1;">
                                <strong class="d-block mb-1 font-size-13">Sensible Hospitality &amp; Bar Timing</strong>
                                In bars, lounges, and restaurants, patrons often run up orders over an entire evening. The <strong>Settlement Window</strong> is configured in hours (e.g. 12 hours) so tabs stay smoothly open across night shifts without prematurely expiring or locking staff out.
                            </div>
                        </div>

                        <div class="row g-4" :class="{ 'opacity-50 pe-none': !form.tabs_enabled }">
                            <!-- Tab Payment Window (Settlement Window) -->
                            <div class="col-md-6">
                                <label class="form-label fw-bold font-size-12">
                                    Tab Settlement Window (Hours)
                                    <span class="text-danger">*</span>
                                </label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light"><Icon icon="ri:time-line" /></span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="72"
                                        v-model.number="form.tab_payment_window_hours"
                                        class="form-control"
                                        placeholder="12"
                                    />
                                    <span class="input-group-text bg-light font-size-12">Hours</span>
                                </div>
                                <div class="d-flex gap-2 mt-1.5 flex-wrap">
                                    <button type="button" class="btn btn-xs btn-outline-secondary font-size-11 py-0 px-2" @click="form.tab_payment_window_hours = 6">6h (Short shift)</button>
                                    <button type="button" class="btn btn-xs btn-outline-primary font-size-11 py-0 px-2 fw-semibold" @click="form.tab_payment_window_hours = 12">12h (Bar / Night shift)</button>
                                    <button type="button" class="btn btn-xs btn-outline-secondary font-size-11 py-0 px-2" @click="form.tab_payment_window_hours = 24">24h (Full day)</button>
                                    <button type="button" class="btn btn-xs btn-outline-secondary font-size-11 py-0 px-2" @click="form.tab_payment_window_hours = 48">48h (Weekend)</button>
                                </div>
                                <small class="text-muted font-size-11 d-block mt-1">
                                    How long a tab remains active before it is flagged as overdue.
                                </small>
                            </div>

                            <!-- Maximum Tab Balance Limit -->
                            <div class="col-md-6">
                                <label class="form-label fw-bold font-size-12">
                                    Default Tab Balance Limit (KES)
                                    <span class="text-danger">*</span>
                                </label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light fw-bold font-size-12">KES</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="500"
                                        v-model.number="form.tab_limit"
                                        class="form-control"
                                        placeholder="10000"
                                    />
                                </div>
                                <div class="d-flex gap-2 mt-1.5 flex-wrap">
                                    <button type="button" class="btn btn-xs btn-outline-secondary font-size-11 py-0 px-2" @click="form.tab_limit = 5000">5,000</button>
                                    <button type="button" class="btn btn-xs btn-outline-primary font-size-11 py-0 px-2 fw-semibold" @click="form.tab_limit = 10000">10,000 (Default)</button>
                                    <button type="button" class="btn btn-xs btn-outline-secondary font-size-11 py-0 px-2" @click="form.tab_limit = 25000">25,000</button>
                                    <button type="button" class="btn btn-xs btn-outline-secondary font-size-11 py-0 px-2" @click="form.tab_limit = 50000">50,000</button>
                                </div>
                                <small class="text-muted font-size-11 d-block mt-1">
                                    Highest unpaid total allowed on a tab before requiring partial or full settlement. Individual customers can have customized credit limits.
                                </small>
                            </div>

                            <!-- Max Open Tabs per Customer -->
                            <div class="col-md-6">
                                <label class="form-label fw-bold font-size-12">
                                    Max Open Tabs per Customer
                                    <span class="text-danger">*</span>
                                </label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light"><Icon icon="ri:user-shared-line" /></span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        v-model.number="form.max_open_tabs_per_customer"
                                        class="form-control"
                                        placeholder="2"
                                    />
                                    <span class="input-group-text bg-light font-size-12">Tabs</span>
                                </div>
                                <small class="text-muted font-size-11 d-block mt-1">
                                    Allows a patron to run a personal tab and a group/table tab without opening endless unpaid bills.
                                </small>
                            </div>

                            <!-- Max Unpaid Tabs per Cashier -->
                            <div class="col-md-6">
                                <label class="form-label fw-bold font-size-12">
                                    Max Open Tabs per Cashier / Shift
                                    <span class="text-danger">*</span>
                                </label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light"><Icon icon="ri:user-star-line" /></span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        v-model.number="form.max_unpaid_tabs_per_cashier"
                                        class="form-control"
                                        placeholder="15"
                                    />
                                    <span class="input-group-text bg-light font-size-12">Tabs</span>
                                </div>
                                <small class="text-muted font-size-11 d-block mt-1">
                                    Prevents a cashier or bartender from leaving dozens of abandoned open tabs across a single shift.
                                </small>
                            </div>

                            <!-- Enforcement Policy Action -->
                            <div class="col-12">
                                <label class="form-label fw-bold font-size-12 mb-2">Limit Enforcement Action</label>
                                <div class="row g-3">
                                    <div class="col-md-4">
                                        <div
                                            class="card border p-3 rounded-2 cursor-pointer h-100 transition-all"
                                            :class="form.tab_limit_action === 'warn' ? 'border-primary bg-primary-subtle' : 'bg-light'"
                                            @click="form.tab_limit_action = 'warn'"
                                        >
                                            <div class="form-check mb-1">
                                                <input class="form-check-input" type="radio" value="warn" v-model="form.tab_limit_action" id="actionWarn">
                                                <label class="form-check-label fw-bold font-size-13 text-dark" for="actionWarn">
                                                    Warn Cashier Only (Default)
                                                </label>
                                            </div>
                                            <p class="text-muted font-size-11 mb-0 ps-3">
                                                Shows a soft warning on the POS counter but allows the cashier to proceed during busy rush hours.
                                            </p>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div
                                            class="card border p-3 rounded-2 cursor-pointer h-100 transition-all"
                                            :class="form.tab_limit_action === 'require_manager_pin' ? 'border-primary bg-primary-subtle' : 'bg-light'"
                                            @click="form.tab_limit_action = 'require_manager_pin'"
                                        >
                                            <div class="form-check mb-1">
                                                <input class="form-check-input" type="radio" value="require_manager_pin" v-model="form.tab_limit_action" id="actionPin">
                                                <label class="form-check-label fw-bold font-size-13 text-dark" for="actionPin">
                                                    Require Manager PIN
                                                </label>
                                            </div>
                                            <p class="text-muted font-size-11 mb-0 ps-3">
                                                Cashier cannot exceed tab balance or open extra tabs unless an active manager or owner enters their PIN.
                                            </p>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div
                                            class="card border p-3 rounded-2 cursor-pointer h-100 transition-all"
                                            :class="form.tab_limit_action === 'block' ? 'border-danger bg-danger-subtle' : 'bg-light'"
                                            @click="form.tab_limit_action = 'block'"
                                        >
                                            <div class="form-check mb-1">
                                                <input class="form-check-input" type="radio" value="block" v-model="form.tab_limit_action" id="actionBlock">
                                                <label class="form-check-label fw-bold font-size-13 text-dark" for="actionBlock">
                                                    Strict Block
                                                </label>
                                            </div>
                                            <p class="text-muted font-size-11 mb-0 ps-3">
                                                Completely stops further tab opening or item additions until prior open bills are settled.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab 5: Localization & Regional -->
                <div v-show="activeTab === 'locale'" class="col-12">
                    <div class="card border rounded-2 bg-white p-4">
                        <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                            <Icon icon="ri:global-line" class="fs-4 text-primary" />
                            <div>
                                <h5 class="fw-bold text-dark mb-0 font-size-15">Localization, Currency &amp; Regional Formatting</h5>
                                <p class="text-muted font-size-12 mb-0">Currency symbols, timezones, and display formatting for timestamps.</p>
                            </div>
                        </div>

                        <div class="row g-3">
                            <!-- Currency -->
                            <div class="col-md-6">
                                <label class="form-label fw-bold font-size-12">Base Operating Currency</label>
                                <select v-model="form.currency" class="form-select">
                                    <option value="KES">KES - Kenyan Shilling (Ksh)</option>
                                    <option value="USD">USD - US Dollar ($)</option>
                                    <option value="EUR">EUR - Euro (€)</option>
                                    <option value="GBP">GBP - British Pound (£)</option>
                                    <option value="UGX">UGX - Ugandan Shilling</option>
                                    <option value="TZS">TZS - Tanzanian Shilling</option>
                                </select>
                                <div class="text-muted font-size-11 mt-1">Default billing and pricing currency used across products, reports, and tills.</div>
                            </div>

                            <!-- Timezone -->
                            <div class="col-md-6">
                                <label class="form-label fw-bold font-size-12">Business Timezone</label>
                                <select v-model="form.timezone" class="form-select">
                                    <option value="Africa/Nairobi">Africa/Nairobi (EAT, UTC+03:00)</option>
                                    <option value="Africa/Kampala">Africa/Kampala (EAT, UTC+03:00)</option>
                                    <option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam (EAT, UTC+03:00)</option>
                                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                                </select>
                                <div class="text-muted font-size-11 mt-1">Calculates midnight end-of-day sales cutoffs and audit log timestamps.</div>
                            </div>

                            <!-- Date Format -->
                            <div class="col-md-6">
                                <label class="form-label fw-bold font-size-12">Date Display Format</label>
                                <select v-model="form.date_format" class="form-select">
                                    <option value="d M Y">20 Nov 2026 (d M Y)</option>
                                    <option value="d/m/Y">20/11/2026 (d/m/Y)</option>
                                    <option value="Y-m-d">2026-11-20 (ISO standard)</option>
                                    <option value="M d, Y">Nov 20, 2026 (M d, Y)</option>
                                </select>
                            </div>

                            <!-- Time Format -->
                            <div class="col-md-6">
                                <label class="form-label fw-bold font-size-12">Time Display Format</label>
                                <select v-model="form.time_format" class="form-select">
                                    <option value="12h">12-hour clock (e.g. 02:30 PM)</option>
                                    <option value="24h">24-hour clock (e.g. 14:30)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Fallback if business data is not yet loaded or request failed -->
        <div v-else class="card border rounded-2 p-5 text-center bg-white my-4 shadow-none">
            <div class="mb-3">
                <Icon icon="ri:building-2-line" class="fs-1 text-primary opacity-50" />
            </div>
            <h5 class="fw-bold text-dark">Business Profile Unavailable</h5>
            <p class="text-muted font-size-13 mb-3">We couldn't retrieve your business details. Please ensure you are logged into an active business session.</p>
            <div>
                <button type="button" class="btn btn-primary btn-sm px-3 shadow-none" @click="fetchBusinessDetails" :disabled="loading">
                    <Icon icon="ri:refresh-line" class="me-1" :class="{ 'bx-spin': loading }" /> Reload Details
                </button>
            </div>
        </div>

        <!-- Hidden ImageUploader component for interactive picture cropping -->
        <ImageUploader
            inputId="tenant-logo-cropper-upload"
            :aspect-ratio="1"
            @image-selected="onCroppedLogoSelected"
        />

        <!-- Feedback Image Toast -->
        <ImageToast :status="toastStatus" :title="toastTitle" :message="toastMessage" :image="toastImage"
            :imageHeight="70" @hide="toastStatus = null" />

        <!-- Full Document Preview Modal (A4 Standard Document Viewer) -->
        <div v-if="showDocPreviewModal"
                class="doc-preview-modal-backdrop position-fixed top-0 start-0 w-100 h-100 d-flex flex-column"
                style="z-index: 99999; background-color: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px);">
                
                <!-- Modal Top Navigation Bar -->
                <div class="doc-modal-topbar bg-white px-4 py-2 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2 shadow-sm">
                    <div class="d-flex align-items-center gap-3">
                        <div class="d-flex align-items-center gap-2">
                            <Icon icon="ri:file-text-line" class="fs-4 text-primary" />
                            <div>
                                <h6 class="fw-bold text-dark mb-0 font-size-14">{{ currentTemplateName }} · Document View</h6>
                                <small class="text-muted font-size-11">A4 Standard Format (210mm × 297mm) · {{ (docModalZoom * 100).toFixed(0) }}% Scale</small>
                            </div>
                        </div>

                        <div class="d-flex align-items-center gap-2 ms-2">
                            <span class="text-muted font-size-12">Template:</span>
                            <select v-model="form.invoice_template" class="form-select form-select-sm font-size-12" style="width: 220px;">
                                <option v-for="tpl in a4Templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
                            </select>
                        </div>
                    </div>

                    <div class="d-flex align-items-center gap-2">
                        <!-- Zoom Controls -->
                        <div class="btn-group btn-group-sm border rounded bg-light">
                            <button type="button" class="btn btn-light font-size-12 px-2"
                                @click="docModalZoom = Math.max(0.4, Number((docModalZoom - 0.1).toFixed(1)))" title="Zoom Out">
                                <Icon icon="ri:zoom-out-line" />
                            </button>
                            <button type="button" class="btn btn-light font-size-12 px-2 fw-semibold"
                                @click="docModalZoom = 1.0" title="100% Original Size">
                                {{ (docModalZoom * 100).toFixed(0) }}%
                            </button>
                            <button type="button" class="btn btn-light font-size-12 px-2"
                                @click="docModalZoom = Math.min(2.0, Number((docModalZoom + 0.1).toFixed(1)))" title="Zoom In">
                                <Icon icon="ri:zoom-in-line" />
                            </button>
                            <button type="button" class="btn btn-light font-size-12 px-2"
                                @click="docModalZoom = 0.85" title="Fit to Window">
                                Fit
                            </button>
                        </div>

                        <!-- Print Action -->
                        <button type="button" class="btn btn-sm btn-primary d-flex align-items-center gap-1 font-size-12 shadow-none px-3"
                            @click="printActiveDoc">
                            <Icon icon="ri:printer-line" class="fs-5" />
                            <span>Print Document</span>
                        </button>

                        <!-- Close Action -->
                        <button type="button" class="btn btn-sm btn-white border d-flex align-items-center gap-1 font-size-12 shadow-none"
                            @click="showDocPreviewModal = false">
                            <Icon icon="ri:close-line" class="fs-5" />
                            <span>Close</span>
                        </button>
                    </div>
                </div>

                <!-- Document Canvas Area (Document Viewer with floating A4 Paper) -->
                <div class="doc-canvas-container flex-grow-1 overflow-auto d-flex justify-content-center p-4"
                    style="background-color: #334155;">
                    <div class="doc-paper-sheet-holder d-flex justify-content-center my-auto transition-all"
                        :style="{ zoom: docModalZoom }">
                        <div class="printable-invoice-wrapper bg-white shadow-lg rounded-1 overflow-hidden"
                            style="width: 210mm; min-height: 297mm;">
                            <component :is="templateComponentMap[form.invoice_template] || InvoiceTwo"
                                :business="liveBusinessData" :items="invoiceItems" />
                        </div>
                    </div>
                </div>
            </div>
    </div>
</template>

<script setup>
// ---------------------------------------------------------------
// PaySol Tenant Business Details View (§5.1).
// Top navigation styled exactly like [Arsenal Sports Bar · Tenants] (route /tenants/:id).
// Includes vertical side-menu for Document Types:
//   - POS Thermal Receipts (58mm / 80mm)
//   - Commercial Tax Invoices (A4) with 4 selectable templates
//   - Price Quotations & Proformas (A4)
//   - Delivery Notes & Waybills (A4)
//   - Bank & Remittance Accounts
// ---------------------------------------------------------------
import { Icon } from "@iconify/vue";
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useShiftStore } from "@/stores/shift";
import businessApi from "@/api/business";
import branchesApi from "@/api/branches";
import geoApi from "@/api/geography";
import SelectSearchBox from "@/components/SelectSearchBox.vue";
import GoogleLocationInput from "@/components/GoogleLocationInput.vue";
import GoogleMapPreview from "@/components/GoogleMapPreview.vue";
import SkeletonLoader from "@/components/Loaders/SkeletonLoader.vue";
import ImageUploader from "@/components/ImageUploader.vue";
import ImageToast from "@/components/ImageToast.vue";
import successImage from "@/assets/images/icons/check.png";
import errorImage from "@/assets/images/icons/error.png";

// User's actual Invoice Templates from src/pages/Invoices/sigleInvoicesTemplates
import InvoiceOne from "@/pages/Invoices/sigleInvoicesTemplates/Invoice.one.vue";
import InvoiceTwo from "@/pages/Invoices/sigleInvoicesTemplates/Invoice.two.vue";
import InvoiceThree from "@/pages/Invoices/sigleInvoicesTemplates/Invoice.three.vue";
import InvoiceFour from "@/pages/Invoices/sigleInvoicesTemplates/Invoice.four.vue";
import InvoiceFive from "@/components/Invoices/templates/Invoice.five.vue";
import InvoiceSix from "@/components/Invoices/templates/Invoice.six.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const shiftStore = useShiftStore();
const logoPreview = ref("");

// Branch physical location map state
const branchesList = ref([]);
const loadingBranches = ref(false);
const selectedMapBranchId = ref(null);
const branchLocationQuery = ref("");
const pendingBranchPin = ref(null);
const savingBranchPin = ref(false);

const mainBranchRecord = computed(() => {
    if (branchesList.value.length) {
        return branchesList.value.find((b) => b.is_main) || branchesList.value[0];
    }
    return business.value?.main_branch || null;
});

const activeMapBranch = computed(() => {
    if (!branchesList.value.length) return null;
    return (
        branchesList.value.find((b) => b.id === selectedMapBranchId.value) ||
        branchesList.value.find((b) => b.is_main) ||
        branchesList.value[0]
    );
});

const mapPreviewCoords = computed(() => {
    if (pendingBranchPin.value?.latitude && pendingBranchPin.value?.longitude) {
        return {
            latitude: pendingBranchPin.value.latitude,
            longitude: pendingBranchPin.value.longitude,
        };
    }
    const b = activeMapBranch.value;
    if (b?.latitude != null && b?.longitude != null && Number(b.latitude) && Number(b.longitude)) {
        return {
            latitude: Number(b.latitude),
            longitude: Number(b.longitude),
        };
    }
    return null;
});

const mapPreviewLabel = computed(() => {
    if (pendingBranchPin.value?.formatted_address) {
        return pendingBranchPin.value.formatted_address;
    }
    const b = activeMapBranch.value;
    if (!b) return "";
    return b.address_line || b.premises_name || b.name || "";
});

async function fetchBranchesForMap() {
    loadingBranches.value = true;
    try {
        const res = await branchesApi.list();
        const list = res.data?.data || res.data || [];
        branchesList.value = Array.isArray(list) ? list : [];
        if (branchesList.value.length && !selectedMapBranchId.value) {
            const preferred =
                branchesList.value.find((b) => b.is_main) ||
                branchesList.value[0];
            selectedMapBranchId.value = preferred?.id || null;
            branchLocationQuery.value = preferred?.address_line || "";
        }
    } catch (err) {
        console.warn("Could not load branches for map preview:", err);
    } finally {
        loadingBranches.value = false;
    }
}

function onMapBranchChanged() {
    pendingBranchPin.value = null;
    branchLocationQuery.value = activeMapBranch.value?.address_line || "";
}

function onBranchMapPinSelected(data) {
    if (data?.latitude && data?.longitude) {
        pendingBranchPin.value = data;
        if (data.formatted_address) {
            branchLocationQuery.value = data.formatted_address;
        }
    }
}

function onBranchMapPinCleared() {
    pendingBranchPin.value = null;
    branchLocationQuery.value = activeMapBranch.value?.address_line || "";
}

async function saveBranchLocationPin() {
    if (!activeMapBranch.value || !pendingBranchPin.value) return;
    savingBranchPin.value = true;
    try {
        const payload = {
            latitude: Number(pendingBranchPin.value.latitude),
            longitude: Number(pendingBranchPin.value.longitude),
        };
        if (pendingBranchPin.value.formatted_address) {
            payload.address_line = pendingBranchPin.value.formatted_address;
        }
        const res = await branchesApi.update(activeMapBranch.value.id, payload);
        const updated = res.data?.data;
        if (updated) {
            const idx = branchesList.value.findIndex((b) => b.id === updated.id);
            if (idx !== -1) branchesList.value[idx] = updated;
        }
        pendingBranchPin.value = null;
        // Refresh shift store branches so POS delivery distance/ETA immediately sees the new pin
        shiftStore.fetchBranches?.(true).catch(() => {});
        showToast("Location Pin Saved", `Updated map coordinates for ${activeMapBranch.value.name}.`);
    } catch (err) {
        console.error("Failed to save branch map pin:", err);
        showErrorToast(
            "Save Failed",
            err.response?.data?.message || "Could not update branch GPS coordinates."
        );
    } finally {
        savingBranchPin.value = false;
    }
}

// Top Tabs
const tabs = [
    { key: "identity", label: "Identity & Legal", icon: "ri:building-2-line" },
    { key: "contact", label: "Contact & Headquarters", icon: "ri:map-pin-2-line" },
    { key: "branding", label: "Branding & Colors", icon: "ri:palette-line" },
    { key: "documents", label: "Documents & Printing", icon: "ri:file-list-3-line" },
    { key: "tabs_rules", label: "Tabs & Credit Rules", icon: "ri:shield-check-line" },
    { key: "locale", label: "Localization & Regional", icon: "ri:global-line" },
];

const VALID_TABS = tabs.map((t) => t.key);
const activeTab = computed(() => (VALID_TABS.includes(route.query.tab) ? route.query.tab : "identity"));

function setTab(key) {
    router.replace({
        query: {
            ...route.query,
            tab: key === "identity" ? undefined : key,
        },
    });
}

// Vertical Side Menu for Document Types
const docTypes = [
    { key: "thermal", label: "POS Thermal Receipts", desc: "Roll receipts (58mm / 80mm)", icon: "ri:printer-line", badge: "Roll" },
    { key: "invoice", label: "Commercial Invoices", desc: "A4 Tax & corporate invoices", icon: "ri:file-text-line", badge: "A4" },
    { key: "receipt", label: "Official Receipts", desc: "A4 Cash & payment vouchers", icon: "ri:file-shield-2-line", badge: "A4" },
    { key: "quote", label: "Quotations & Estimates", desc: "A4 Price quotes & tenders", icon: "ri:file-list-3-line", badge: "A4" },
    { key: "delivery", label: "Delivery Notes", desc: "A4 Dispatch transit slips", icon: "ri:truck-line", badge: "A4" },
    { key: "credit_note", label: "Credit Notes & Returns", desc: "A4 Return vouchers & credits", icon: "ri:refund-2-line", badge: "A4" },
    { key: "purchase_order", label: "Purchase Orders (LPO)", desc: "A4 Official orders to suppliers", icon: "ri:shopping-bag-3-line", badge: "A4" },
    { key: "banking", label: "Bank & Remittance", desc: "Bank accounts & M-Pesa", icon: "ri:bank-card-line", badge: "Accounts" },
];
const activeDocType = ref("thermal");

// Available A4 Templates (including designs from graphics/invoices folder)
const templateComponentMap = {
    "invoice-two": InvoiceTwo,
    "invoice-three": InvoiceThree,
    "invoice-four": InvoiceFour,
    "invoice-one": InvoiceOne,
    "invoice-odpc": InvoiceFive,
    "invoice-paysol-319": InvoiceSix,
    "invoice-lsk-sacco": InvoiceSix,
};

const a4Templates = [
    { id: "invoice-two", name: "Modern Minimalist", desc: "Gold/primary accent with circular contact icons and clean ledger lines.", badge: "Template 1" },
    { id: "invoice-three", name: "Brand Sidebar Accent", desc: "Full-height colored left banner with client details & remittance notes.", badge: "Template 2" },
    { id: "invoice-four", name: "Corporate Top Bar", desc: "Icon header strip, agreement box, and structured total-due box.", badge: "Template 3" },
    { id: "invoice-one", name: "Institutional / County", desc: "Official seal header with dual logos and QR verification code block.", badge: "Template 4" },
    { id: "invoice-odpc", name: "Tech & Corporate Cyan (222222)", desc: "Solid top-right INVOICE block, clean column breakdown, and prominent Total block.", badge: "Template 5" },
    { id: "invoice-paysol-319", name: "Paysol Commercial (319)", desc: "Paysol signature design with multi-line item scope, annual note, and SBM/Bank remittance.", badge: "Template 6" },
    { id: "invoice-lsk-sacco", name: "Sacco & Financial Billing", desc: "LSK & Kanisa Sacco format with multi-currency banking, phone/email header, and allocation lines.", badge: "Template 7" },
];

const currentTemplateName = computed(() => {
    return a4Templates.find((t) => t.id === form.invoice_template)?.name || "Modern Minimalist";
});

// Loading states
const loading = ref(false);
const saving = ref(false);
const uploadingLogo = ref(false);
const checkingShortName = ref(false);

// Document Preview Modal State
const showDocPreviewModal = ref(false);
const docModalZoom = ref(0.9);
const showItemEditor = ref(false);

// Dynamic sample items for realistic A4 preview
const invoiceItems = ref([
    { id: 1, name: "Enterprise Cloud POS Subscription", description: "Monthly seat tier with dedicated cloud sync node", qty: 1, price: 10000 },
    { id: 2, name: "Fiscal Device Integration (TIMS / eTIMS)", description: "Standard KRA compliance API gateway license", qty: 1, price: 2500 },
    { id: 3, name: "Thermal Receipt Rolls & Accessories", description: "80mm BPA-free high density rolls (Box of 50)", qty: 2, price: 1200 },
]);

function addItem() {
    const nextId = invoiceItems.value.length ? Math.max(...invoiceItems.value.map((i) => i.id)) + 1 : 1;
    invoiceItems.value.push({
        id: nextId,
        name: `Service / Merchandise Item #${nextId}`,
        description: "Standard retail or commercial line item",
        qty: 1,
        price: 1500,
    });
}

function removeItem(index) {
    if (invoiceItems.value.length > 1) {
        invoiceItems.value.splice(index, 1);
    }
}

function printActiveDoc() {
    window.print();
}

// Reactive business details for dynamic invoice rendering
const liveBusinessData = computed(() => ({
    name: form.name || business.value?.name || "YOUR BUSINESS NAME",
    logo: business.value?.branding?.logo_url || logoPreview.value || "",
    address_line: form.address_line || business.value?.address_line || "Main Headquarters, Nairobi, Kenya",
    phone: form.phone || business.value?.phone || "+254 700 000 000",
    email: form.email || business.value?.email || "billing@business.co.ke",
    kra_pin: form.kra_pin || business.value?.kra_pin || "",
    primary_color: form.primary_color || "#2b59ff",
    invoice_prefix: form.invoice_prefix || "INV-",
    invoice_terms: form.invoice_terms || "Payment is due within agreed terms. Direct bank transfer is preferred.",
    invoice_payment_terms: form.invoice_payment_terms || "Due on Receipt",
    invoice_show_bank: form.invoice_show_bank ?? true,
    bank_name: form.bank_name || business.value?.settings?.banking?.bank_name || "",
    bank_account_no: form.bank_account_number || business.value?.settings?.banking?.bank_account_no || "",
    mpesa_paybill: form.bank_mpesa_paybill || business.value?.settings?.banking?.mpesa_paybill || "",
    mpesa_account_no: form.bank_mpesa_account || business.value?.settings?.banking?.mpesa_account_no || "",
}));

// Master business data from API (with instant initial fallback from auth session)
const business = ref(
    authStore.tenant
        ? {
              ...authStore.tenant,
              branding: { primary_color: "#2b59ff" },
              stats: { plan: authStore.tenant?.plan || "Standard", branches_count: 0, staff_count: 0, products_count: 0 },
          }
        : null
);

// Form state
const form = reactive({
    name: authStore.tenant?.name || "",
    short_name: authStore.tenant?.short_name || "",
    kra_pin: "",
    phone: "",
    email: "",
    website: "",
    address_line: "",
    po_box: "",
    city: "",
    ward_id: null,
    area_id: null,
    primary_color: "#2b59ff",
    accent_color: "#10b981",

    // Receipts
    receipt_printer_type: "thermal_58",
    receipt_paper_width: "58mm",
    receipt_logo: "mono",
    receipt_footer: "Thank you for shopping with us! Karibu tena.",
    receipt_show_kra_pin: true,
    receipt_copies: 1,

    // A4 Invoices & Documents
    invoice_template: "invoice-two",
    invoice_prefix: "INV-",
    invoice_payment_terms: "Net 14 days",
    invoice_show_bank: true,
    invoice_terms: "Payment is due within 14 days from date of invoice. Goods remain property of the seller until paid in full.",
    receipt_prefix: "RCT-",
    quote_prefix: "QT-",
    quote_validity: "30 days",
    delivery_prefix: "DN-",
    credit_note_prefix: "CN-",
    purchase_order_prefix: "LPO-",

    // Bank Accounts & Remittance
    bank_name: "",
    bank_branch: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_swift: "",
    bank_mpesa_paybill: "",
    bank_mpesa_account: "",
    bank_mpesa_till: "",

    // Locale
    currency: "KES",
    timezone: "Africa/Nairobi",
    date_format: "d M Y",
    time_format: "12h",

    // Tab & Credit Security Rules
    tabs_enabled: true,
    tab_limit: 10000,
    tab_payment_window_hours: 12,
    max_open_tabs_per_customer: 2,
    max_unpaid_tabs_per_cashier: 15,
    tab_limit_action: "warn",
});

// Snapshot for dirty checking
const originalFormSnapshot = ref("");

// Toast notification state
const toastStatus = ref(null);
const toastTitle = ref("");
const toastMessage = ref("");
const toastImage = ref(null);

// Short-name live validation state
const shortNameStatus = reactive({
    checked: false,
    available: true,
    message: "",
});
let shortNameDebounceTimer = null;

// Geographic cascaders
const countiesList = ref([]);
const constituenciesList = ref([]);
const wardsList = ref([]);
const areasList = ref([]);
const selectedCountyId = ref(null);
const selectedConstituencyId = ref(null);
const loadingCounties = ref(false);
const loadingConstituencies = ref(false);
const loadingWards = ref(false);

// Computed options for SelectSearchBox
const countyOptions = computed(() =>
    countiesList.value.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))
);
const constituencyOptions = computed(() =>
    constituenciesList.value.map((c) => ({ value: c.id, label: c.name }))
);
const wardOptions = computed(() =>
    wardsList.value.map((w) => ({ value: w.id, label: w.name }))
);
const areaOptions = computed(() =>
    areasList.value.map((a) => ({ value: a.id, label: a.name }))
);

const isDirty = computed(() => {
    return originalFormSnapshot.value && JSON.stringify(form) !== originalFormSnapshot.value;
});

// ---- Fetch Data ----
async function fetchBusinessDetails() {
    loading.value = true;
    try {
        const response = await businessApi.get();
        const data = response.data?.data || {};
        business.value = data;

        // Populate form
        form.name = data.name || "";
        form.short_name = data.short_name || "";
        form.kra_pin = data.kra_pin || "";
        form.phone = data.phone || "";
        form.email = data.email || "";
        form.website = data.website || "";
        form.address_line = data.address_line || "";
        form.po_box = data.po_box || "";
        form.city = data.city || "";
        form.ward_id = data.ward_id || null;
        form.area_id = data.area_id || null;

        // Branding
        form.primary_color = data.branding?.primary_color || "#2b59ff";
        form.accent_color = data.branding?.accent_color || "#10b981";

        // Receipts
        form.receipt_paper_width = data.receipt?.paper_width || "58mm";
        form.receipt_printer_type = data.receipt?.printer_type || (form.receipt_paper_width === "80mm" ? "thermal_80" : "thermal_58");
        form.receipt_logo = data.receipt?.logo || "mono";
        form.receipt_footer = data.receipt?.footer || "Thank you for shopping with us! Karibu tena.";
        form.receipt_show_kra_pin = data.receipt?.show_kra_pin ?? true;
        form.receipt_copies = data.receipt?.copies || 1;

        // A4 Invoices & Documents
        form.invoice_template = data.documents?.invoice_template || "invoice-two";
        form.invoice_prefix = data.documents?.invoice_prefix || "INV-";
        form.invoice_payment_terms = data.documents?.invoice_payment_terms || "Net 14 days";
        form.invoice_show_bank = data.documents?.invoice_show_bank ?? true;
        form.invoice_terms = data.documents?.invoice_terms || "Payment is due within 14 days from date of invoice. Goods remain property of the seller until paid in full.";
        form.receipt_prefix = data.documents?.receipt_prefix || "RCT-";
        form.quote_prefix = data.documents?.quote_prefix || "QT-";
        form.quote_validity = data.documents?.quote_validity || "30 days";
        form.delivery_prefix = data.documents?.delivery_prefix || "DN-";
        form.credit_note_prefix = data.documents?.credit_note_prefix || "CN-";
        form.purchase_order_prefix = data.documents?.purchase_order_prefix || "LPO-";

        // Bank Accounts & Remittance
        form.bank_name = data.bank?.name || "";
        form.bank_branch = data.bank?.branch || "";
        form.bank_account_name = data.bank?.account_name || data.name || "";
        form.bank_account_number = data.bank?.account_number || "";
        form.bank_swift = data.bank?.swift || "";
        form.bank_mpesa_paybill = data.bank?.mpesa_paybill || "";
        form.bank_mpesa_account = data.bank?.mpesa_account || "";
        form.bank_mpesa_till = data.bank?.mpesa_till || "";

        // Locale
        form.currency = data.locale?.currency || "KES";
        form.timezone = data.locale?.timezone || "Africa/Nairobi";
        form.date_format = data.locale?.date_format || "d M Y";
        form.time_format = data.locale?.time_format || "12h";

        // Tab & Credit Security Rules
        form.tabs_enabled = data.tab_settings?.tabs_enabled ?? true;
        form.tab_limit = data.tab_settings?.tab_limit ?? 10000;
        form.tab_payment_window_hours = data.tab_settings?.tab_payment_window_hours ?? 12;
        form.max_open_tabs_per_customer = data.tab_settings?.max_open_tabs_per_customer ?? 2;
        form.max_unpaid_tabs_per_cashier = data.tab_settings?.max_unpaid_tabs_per_cashier ?? 15;
        form.tab_limit_action = data.tab_settings?.tab_limit_action || "warn";

        originalFormSnapshot.value = JSON.stringify(form);

        if (form.ward_id) {
            initJurisdictionFromWard(form.ward_id);
        }
    } catch (err) {
        console.error("Failed to fetch business details:", err);
        showErrorToast("Load Failed", err.response?.data?.message || "Could not retrieve business details.");
    } finally {
        loading.value = false;
    }
}

function resetForm() {
    if (originalFormSnapshot.value) {
        Object.assign(form, JSON.parse(originalFormSnapshot.value));
    }
}

// ---- Save Changes ----
async function saveChanges() {
    saving.value = true;
    try {
        const payload = { ...form };
        const response = await businessApi.update(payload);
        const updated = response.data?.data || {};

        business.value = updated;
        originalFormSnapshot.value = JSON.stringify(form);
        fetchBranchesForMap();
        showToast("Details Saved", "Business details, document settings, and bank accounts updated successfully.");
    } catch (err) {
        console.error("Failed to update business details:", err);
        showErrorToast("Save Failed", err.response?.data?.message || "Could not update business details.");
    } finally {
        saving.value = false;
    }
}

// ---- Crop & Logo Handling with ImageUploader ----
const MIME_EXTENSIONS = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
};

function dataUrlToFile(dataUrl, filename = "business-logo") {
    const [header, base64] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
    const binary = atob(base64);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        buffer[i] = binary.charCodeAt(i);
    }
    const ext = MIME_EXTENSIONS[mime] || "png";
    return new File([buffer], `${filename}.${ext}`, { type: mime });
}

async function onCroppedLogoSelected(croppedDataUrl) {
    if (!croppedDataUrl) return;

    uploadingLogo.value = true;
    try {
        const logoFile = dataUrlToFile(croppedDataUrl, `logo-${Date.now()}`);
        const formData = new FormData();
        formData.append("file", logoFile);

        const response = await businessApi.uploadLogo(formData);
        const data = response.data?.data || {};

        if (business.value) {
            if (!business.value.branding) business.value.branding = {};
            business.value.branding.logo_url = data.logo_url;
        }

        showToast("Logo Updated", "Your cropped business logo has been saved.");
    } catch (err) {
        console.error("Failed to upload cropped logo:", err);
        showErrorToast("Upload Failed", err.response?.data?.message || "Invalid logo image format.");
    } finally {
        uploadingLogo.value = false;
    }
}

async function removeLogo() {
    if (!confirm("Are you sure you want to remove the business logo?")) return;

    uploadingLogo.value = true;
    try {
        await businessApi.deleteLogo();
        if (business.value?.branding) {
            business.value.branding.logo_url = null;
        }
        showToast("Logo Removed", "The business logo has been cleared.");
    } catch (err) {
        console.error("Failed to remove logo:", err);
        showErrorToast("Removal Failed", err.response?.data?.message || "Could not remove logo.");
    } finally {
        uploadingLogo.value = false;
    }
}

// ---- Short Name Check ----
function onShortNameInput() {
    if (shortNameDebounceTimer) clearTimeout(shortNameDebounceTimer);

    const val = form.short_name?.trim();
    if (!val || val.length < 3) {
        shortNameStatus.checked = false;
        return;
    }

    if (business.value && val === business.value.short_name) {
        shortNameStatus.checked = true;
        shortNameStatus.available = true;
        shortNameStatus.message = "Current Handle";
        return;
    }

    checkingShortName.value = true;
    shortNameDebounceTimer = setTimeout(async () => {
        try {
            const res = await businessApi.checkShortName(val);
            const checkData = res.data?.data || {};
            shortNameStatus.checked = true;
            shortNameStatus.available = checkData.available;
            shortNameStatus.message = checkData.available ? "Available" : (checkData.reason || "Not available");
        } catch (err) {
            shortNameStatus.checked = true;
            shortNameStatus.available = false;
            shortNameStatus.message = "Unavailable";
        } finally {
            checkingShortName.value = false;
        }
    }, 400);
}

// ---- Geography Helpers ----
async function loadCounties() {
    loadingCounties.value = true;
    try {
        const res = await geoApi.counties();
        countiesList.value = res.data?.data || res.data || [];
    } catch (err) {
        console.error("Failed to load counties:", err);
    } finally {
        loadingCounties.value = false;
    }
}

async function onCountySelect(countyId) {
    selectedCountyId.value = countyId;
    selectedConstituencyId.value = null;
    form.ward_id = null;
    form.area_id = null;
    constituenciesList.value = [];
    wardsList.value = [];
    areasList.value = [];

    if (!countyId) return;

    loadingConstituencies.value = true;
    try {
        const res = await geoApi.constituencies(countyId);
        constituenciesList.value = res.data?.data || res.data || [];
    } catch (err) {
        console.error("Failed to load constituencies:", err);
    } finally {
        loadingConstituencies.value = false;
    }
}

async function onConstituencySelect(constituencyId) {
    selectedConstituencyId.value = constituencyId;
    form.ward_id = null;
    form.area_id = null;
    wardsList.value = [];
    areasList.value = [];

    if (!constituencyId) return;

    loadingWards.value = true;
    try {
        const res = await geoApi.wards(constituencyId);
        wardsList.value = res.data?.data || res.data || [];
    } catch (err) {
        console.error("Failed to load wards:", err);
    } finally {
        loadingWards.value = false;
    }
}

async function onWardSelect(wardId) {
    form.ward_id = wardId;
    form.area_id = null;
    areasList.value = [];

    if (!wardId) return;

    try {
        const res = await geoApi.wardAreas(wardId);
        areasList.value = res.data?.data || res.data || [];
    } catch (err) {
        console.error("Failed to load areas:", err);
    }
}

async function initJurisdictionFromWard(wardId) {
    if (!wardId) return;
    try {
        const res = await geoApi.locate({ ward_id: wardId });
        const loc = res.data?.data || res.data;
        if (loc?.county_id) {
            selectedCountyId.value = loc.county_id;
            const constRes = await geoApi.constituencies(loc.county_id);
            constituenciesList.value = constRes.data?.data || constRes.data || [];
        }
        if (loc?.constituency_id) {
            selectedConstituencyId.value = loc.constituency_id;
            const wardRes = await geoApi.wards(loc.constituency_id);
            wardsList.value = wardRes.data?.data || wardRes.data || [];
        }
        if (wardId) {
            const areaRes = await geoApi.wardAreas(wardId);
            areasList.value = areaRes.data?.data || areaRes.data || [];
        }
    } catch (err) {
        console.warn("Could not auto-populate jurisdiction chain:", err);
    }
}

// ---- Toast Helpers ----
function showToast(title, message) {
    toastStatus.value = "success";
    toastTitle.value = title;
    toastMessage.value = message;
    toastImage.value = successImage;
}

function showErrorToast(title, message) {
    toastStatus.value = "danger";
    toastTitle.value = title;
    toastMessage.value = message;
    toastImage.value = errorImage;
}

onMounted(() => {
    fetchBusinessDetails();
    loadCounties();
    fetchBranchesForMap();
});
</script>

<style scoped>
.business-details-page {
    padding-bottom: 3rem;
}

/* Zero drop shadows */
.card,
.btn,
.badge,
.thermal-receipt-sheet,
.paper-width-card,
.template-card,
.a4-paper-sheet {
    box-shadow: none !important;
}

.card,
.border {
    border-color: #eef0f4 !important;
}

/* Header Card & Brand Strip from [Arsenal Sports Bar · Tenants] */
.tenant-head {
    overflow: hidden;
    background: #fff;
    border-radius: 12px;
}

.brand-strip {
    height: 6px;
    width: 100%;
}

.head-logo {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    border: 1px solid var(--bs-border-color);
    background: #fff;
    object-fit: contain;
    padding: 6px;
    flex-shrink: 0;
}

.head-logo.no-logo {
    border: 1.5px dashed #c3c8d2;
    background: var(--bs-light);
    color: #8a93a5;
    font-size: 11px;
}

.logo-edit-btn {
    width: 24px;
    height: 24px;
    border-color: #cbd5e1 !important;
    background: #fff;
    cursor: pointer;
}

/* Custom Nav Tabs from [Arsenal Sports Bar · Tenants] */
.nav-tabs-custom {
    border-bottom: 2px solid var(--bs-gray-300);
}

.nav-tabs-custom .nav-item {
    position: relative;
    color: var(--bs-dark);
}

.nav-tabs-custom .nav-item .nav-link {
    border: none;
    color: #495057;
    font-weight: 500;
    transition: all 0.2s ease;
}

.nav-tabs-custom .nav-item .nav-link:hover {
    color: #2b59ff;
}

.nav-tabs-custom .nav-item .nav-link::after {
    content: "";
    background: #2b59ff;
    height: 2px;
    position: absolute;
    width: 100%;
    left: 0;
    bottom: -1px;
    transition: all 250ms ease 0s;
    transform: scale(0);
}

.nav-tabs-custom .nav-item .nav-link.active {
    color: #2b59ff;
    font-weight: 600;
}

.nav-tabs-custom .nav-item .nav-link.active::after {
    transform: scale(1);
}

/* Vertical Side Menu */
.doc-menu-btn {
    transition: all 0.15s ease;
    border-radius: 6px;
}

.doc-menu-btn:hover {
    background-color: #f8fafc !important;
}

.doc-menu-btn.active {
    background-color: #eff6ff !important;
    border-left: 3px solid #2b59ff !important;
}

.doc-menu-btn.active .doc-title {
    color: #2b59ff !important;
}

.doc-menu-icon-box {
    width: 32px;
    height: 32px;
}

/* Template Cards */
.template-card {
    transition: border-color 0.2s ease;
}

.template-card:hover {
    border-color: #93c5fd !important;
}

.template-card.active-template {
    border-color: #2b59ff !important;
    background-color: #fafcff;
}

/* Color Swatches */
.color-swatch-btn {
    width: 22px;
    height: 22px;
    padding: 0;
    cursor: pointer;
    transition: transform 0.1s ease;
}

.color-swatch-btn:hover {
    transform: scale(1.15);
}

/* Paper width cards */
.paper-width-card {
    transition: all 0.15s ease;
}

.paper-width-card:hover {
    border-color: #93c5fd !important;
}

/* Thermal receipt mockup */
.thermal-receipt-sheet {
    background-color: #fdfdfd;
    border: 1px solid #e2e8f0;
    font-family: 'Courier New', Courier, monospace;
    color: #1e293b;
    box-shadow: none !important;
}

.receipt-divider {
    border-top: 1px dashed #cbd5e1 !important;
}

/* A4 Paper Sheet Live Preview */
.a4-preview-viewport {
    min-height: 480px;
    max-height: 680px;
}

.a4-paper-sheet {
    width: 100%;
    max-width: 780px;
    min-height: 980px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    border-top: 5px solid #2b59ff !important;
}

/* Skeleton loader */
.skeleton-box {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.4s infinite;
}

@keyframes skeleton-loading {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}
</style>
