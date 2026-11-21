<template>
    <div class="modal fade" :class="{ show: visible }" tabindex="-1"
        :style="{ display: visible ? 'block' : 'none' }" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-fullscreen-sm-down modal-dialog-scrollable animate__animated animate__zoomInUp animate__faster">
            <div class="modal-content">
                <!-- Modal Header -->
                <div class="modal-header">
                    <div>
                        <h5 class="modal-title fw-bold text-black fs-4 mb-0">
                            {{ isEdit ? `Edit ${branch?.name}` : 'Add a Branch or Outlet' }}
                        </h5>
                        <p class="text-muted small mb-0">
                            Set up branch details, map coordinates, and Kenyan administrative boundaries.
                        </p>
                    </div>
                    <button type="button" class="btn p-0 border-0" @click="close" :disabled="submitting"
                        style="width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.05);display:grid;place-items:center;">
                        <i class="bx bx-x text-dark" style="font-size:22px;line-height:1;"></i>
                    </button>
                </div>

                <!-- Modal Body -->
                <div class="modal-body">
                    <!-- Global Server Error -->
                    <div v-if="serverError" class="alert alert-danger py-2 px-3 small mb-3">
                        <i class="bx bx-error-circle me-1"></i> {{ serverError }}
                    </div>

                    <!-- ===== Identity: Branch Name (Full Width) ===== -->
                    <div class="mb-3">
                        <label class="form-label fw-bold font-size-14">Branch name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control form-control-lg font-size-15" v-model="form.name" maxlength="120"
                            placeholder="e.g. Westlands Branch, Spur Mall Depot, Central Store" :disabled="submitting" />
                        <small class="text-muted">The trade name shown on customer receipts, till registers, and stock reports.</small>
                        <div v-if="err('name')" class="text-danger small mt-1">{{ err('name') }}</div>
                    </div>

                    <!-- ===== Active Trading Status (Prominent Big Switch) ===== -->
                    <div class="card border p-3 mb-4 rounded-3"
                        :class="form.is_active ? 'border-success-subtle bg-success bg-opacity-10' : 'bg-light bg-opacity-50'">
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                <div class="d-flex align-items-center gap-2 mb-1">
                                    <h6 class="fw-bold text-dark mb-0 font-size-14">Trading Status</h6>
                                    <span class="badge px-2 py-1 font-size-11"
                                        :class="form.is_active ? 'bg-success text-white' : 'bg-secondary text-white'">
                                        {{ form.is_active ? 'Active & Trading' : 'Inactive / Closed' }}
                                    </span>
                                </div>
                                <p class="text-muted small mb-0">
                                    {{ form.is_active 
                                        ? 'Branch is active: available for till sessions, cashier sign-in, and stock replenishment.' 
                                        : 'Branch is closed: hidden from till operations and selling.' }}
                                </p>
                            </div>
                            <div class="form-check form-switch form-switch-lg mb-0 flex-shrink-0 ms-3" dir="ltr">
                                <input class="form-check-input cursor-pointer" type="checkbox" role="switch" id="branchFormActive"
                                    v-model="form.is_active" :disabled="submitting || (isEdit && branch?.is_main)" />
                                <label class="form-check-label" for="branchFormActive"></label>
                            </div>
                        </div>
                        <small v-if="isEdit && branch?.is_main" class="text-danger small mt-2 d-block">
                            <i class="bx bx-info-circle me-1"></i> The main branch cannot be deactivated.
                        </small>
                        <div v-if="err('is_active')" class="text-danger small mt-1">{{ err('is_active') }}</div>
                    </div>

                    <!-- ===== Section 01 · Map Point & Location (Top) ===== -->
                    <div class="card border border-light-subtle shadow-none bg-light bg-opacity-25 p-3 mb-4 rounded-3">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <div>
                                <span class="badge bg-primary text-white font-size-11 mb-1">01 · Map &amp; Device Pin</span>
                                <h6 class="fw-bold text-dark mb-0 font-size-14">Pin Location on Google Maps</h6>
                            </div>

                            <!-- Map Actions: Clear Pin & Device Location -->
                            <div class="d-flex align-items-center gap-2">
                                <button v-if="hasPoint" type="button"
                                    class="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                                    @click="clearPoint" title="Remove coordinates and reset pin">
                                    <i class="bx bx-trash font-size-14"></i>
                                    <span>Clear pin</span>
                                </button>
                                <button type="button" class="btn btn-soft-primary btn-sm d-flex align-items-center gap-1 fw-semibold"
                                    @click="useMyLocation" :disabled="locating || submitting"
                                    title="Use your device GPS coordinates to auto-fill Ward, Constituency and County">
                                    <span v-if="locating" class="spinner-border spinner-border-sm" role="status"></span>
                                    <i v-else class="mdi mdi-crosshairs-gps fs-5"></i>
                                    <span>{{ locating ? 'Reading GPS...' : "I'm at this location" }}</span>
                                </button>
                            </div>
                        </div>

                        <p class="text-muted small mb-3">
                            Search for a street address, click on Google Maps, or tap <strong>"I'm at this location"</strong>.
                            Coordinates will automatically detect and prefill the County, Constituency, and Ward.
                        </p>

                        <!-- Google Places Address Search Input (Single unified Search Address field) -->
                        <div class="mb-3">
                            <label class="form-label fw-bold font-size-13">
                                Search Address / Street <span class="text-danger">*</span>
                            </label>
                            <GoogleLocationInput
                                ref="locationInput"
                                v-model="form.address_line"
                                :api-key="GOOGLE_MAPS_API_KEY"
                                placeholder="Search address, street name, or building in Kenya (e.g. Mpaka Road, Westlands)..."
                                :disabled="submitting"
                                @location-selected="onPlaceSelected"
                                @location-cleared="onAddressCleared"
                            />
                            <small class="text-muted">Type to search via Google Places (session-protected &amp; Kenya-restricted), or type your exact physical road.</small>
                            <div v-if="err('address_line')" class="text-danger small mt-1">{{ err('address_line') }}</div>
                        </div>

                        <!-- Location or GPS error alert -->
                        <div v-if="locationError" class="alert alert-warning py-2 px-3 small mb-2 d-flex align-items-center justify-content-between">
                            <span><i class="bx bx-error me-1"></i> {{ locationError }}</span>
                            <button type="button" class="btn-close btn-sm" @click="locationError = ''"></button>
                        </div>

                        <!-- Interactive Google Map Box -->
                        <div class="map-container position-relative rounded-3 border overflow-hidden mb-2 bg-white" style="height: 240px;">
                            <div ref="mapEl" class="w-100 h-100"></div>
                            <div v-if="mapError" class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center text-center text-muted p-3 bg-light bg-opacity-75">
                                <span><i class="mdi mdi-map-marker-off-outline d-block fs-2 opacity-50 mb-1"></i>{{ mapError }}</span>
                            </div>
                        </div>
                        <small class="text-muted d-block mb-3">
                            <i class="bx bx-pointer me-1"></i> Click anywhere on the map or drag the pin to adjust your branch coordinates.
                        </small>

                        <!-- Auto-detected Ward Banner -->
                        <div v-if="resolvedWard" class="alert alert-soft-success border border-success border-opacity-25 py-2 px-3 small d-flex align-items-center justify-content-between mb-3">
                            <div class="d-flex align-items-center">
                                <i class="mdi mdi-map-marker-check text-success fs-4 me-2"></i>
                                <span>
                                    Resolved boundary: <strong>{{ resolvedWard.name }} Ward</strong> · {{ resolvedWard.constituency?.name }}, {{ resolvedWard.county?.name }}
                                </span>
                            </div>
                            <span class="badge bg-success-subtle text-success font-size-10 px-2 py-1">Auto-prefilled</span>
                        </div>
                        <div v-else-if="locatingWard" class="alert alert-light border py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                            <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
                            <span class="text-muted">Resolving Kenyan ward boundary from coordinates...</span>
                        </div>

                        <!-- Coordinates Status Bar -->
                        <div v-if="hasPoint" class="d-flex align-items-center justify-content-between bg-white border rounded px-3 py-2">
                            <div class="d-flex align-items-center gap-2 font-monospace font-size-12 text-muted">
                                <i class="bx bx-map-pin text-danger font-size-16"></i>
                                <span><strong>Pinned GPS:</strong> {{ form.latitude }}, {{ form.longitude }}</span>
                            </div>
                            <button type="button" class="btn btn-link btn-sm text-danger p-0 text-decoration-none font-size-12"
                                @click="clearPoint" title="Clear pinned location">
                                <i class="bx bx-x me-1"></i>Clear pin
                            </button>
                        </div>
                    </div>

                    <!-- ===== Section 02 · Building & Physical Unit ===== -->
                    <div class="mb-4">
                        <span class="badge bg-secondary-subtle text-secondary font-size-11 mb-1">02 · Building &amp; Physical Unit</span>
                        <div class="row g-3">
                            <div class="col-md-7">
                                <label class="form-label fw-bold">Building / Mall / Landmark</label>
                                <input type="text" class="form-control" v-model="form.premises_name" maxlength="120"
                                    placeholder="e.g. Westgate Mall, Two Rivers, The Hub Karen" :disabled="submitting" />
                                <small class="text-muted">Landmark or building name.</small>
                                <div v-if="err('premises_name')" class="text-danger small mt-1">{{ err('premises_name') }}</div>
                            </div>

                            <div class="col-md-5">
                                <label class="form-label fw-bold">Shop / Stall / Unit #</label>
                                <input type="text" class="form-control" v-model="form.unit_label" maxlength="60"
                                    placeholder="e.g. Stall G-14, Shop 2B, 1st Floor" :disabled="submitting" />
                                <small class="text-muted">Door, stall or unit number.</small>
                                <div v-if="err('unit_label')" class="text-danger small mt-1">{{ err('unit_label') }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- ===== Section 03 · Kenyan Boundaries (Searchable Selects) ===== -->
                    <div>
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <span class="badge bg-secondary-subtle text-secondary font-size-11">03 · Administrative Boundaries</span>
                            <small class="text-muted">Auto-filled from map or searchable by name.</small>
                        </div>
                        <div class="row g-3">
                            <!-- County SelectSearchBox -->
                            <div class="col-md-6">
                                <label class="form-label fw-bold">County <span class="text-danger">*</span></label>
                                <SelectSearchBox
                                    :model-value="selectedCountyId"
                                    :options="countyOptions"
                                    :placeholder="loadingCounties ? 'Loading counties...' : 'Search or select county'"
                                    :disabled="submitting"
                                    @update:model-value="onCountySelect"
                                />
                            </div>

                            <!-- Constituency SelectSearchBox -->
                            <div class="col-md-6">
                                <label class="form-label fw-bold">Constituency <span class="text-danger">*</span></label>
                                <SelectSearchBox
                                    :model-value="selectedConstituencyId"
                                    :options="constituencyOptions"
                                    :placeholder="!selectedCountyId ? 'Select county first' : (loadingConstituencies ? 'Loading...' : 'Search or select constituency')"
                                    :disabled="submitting || !selectedCountyId"
                                    @update:model-value="onConstituencySelect"
                                />
                            </div>

                            <!-- Ward SelectSearchBox -->
                            <div class="col-md-6">
                                <label class="form-label fw-bold">Ward <span class="text-danger">*</span></label>
                                <SelectSearchBox
                                    :model-value="form.ward_id"
                                    :options="wardOptions"
                                    :placeholder="!selectedConstituencyId ? 'Select constituency first' : (loadingWards ? 'Loading...' : 'Search or select ward')"
                                    :disabled="submitting || !selectedConstituencyId"
                                    @update:model-value="onWardSelect"
                                />
                                <div v-if="err('ward_id')" class="text-danger small mt-1">{{ err('ward_id') }}</div>
                            </div>

                            <!-- Area / Estate SelectSearchBox -->
                            <div class="col-md-6">
                                <label class="form-label fw-bold">Area / Estate <span class="text-muted fw-normal">(Optional)</span></label>
                                <SelectSearchBox
                                    :model-value="form.area_id"
                                    :options="areaOptions"
                                    :placeholder="!form.ward_id ? 'Select ward first' : (areasList.length ? 'Search or select area' : 'No areas listed for this ward')"
                                    :disabled="submitting || !form.ward_id || !areasList.length"
                                    @update:model-value="onAreaSelect"
                                />
                                <div v-if="err('area_id')" class="text-danger small mt-1">{{ err('area_id') }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="modal-footer">
                    <button type="button" class="btn btn-white" @click="close" :disabled="submitting">Cancel</button>
                    <button type="button" class="btn btn-primary" @click="save" :disabled="submitting">
                        <span v-if="submitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
                        <span>{{ isEdit ? 'Save Changes' : 'Create Branch' }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Backdrop -->
    <div v-if="visible" class="modal-backdrop fade show" @click="close"></div>
</template>

<script setup>
// ---------------------------------------------------------------
// BranchForm.modal — add or edit a tenant branch (§5.2).
//
// Modelled on:
//   Paysol.Admin/src/pages/Banks/components/BankForm.modal.vue (modal lifecycle)
//   Paysol.Admin/src/pages/Tenants/components/Onboard.Location.step.vue (map & boundary resolution)
//
// Capabilities:
//   - Full-width branch trade name and prominent trading status switch
//   - Device GPS location capture ("I'm at this location")
//   - Google Places search for street address / building
//   - Interactive draggable marker on Google Maps with click-to-pin
//   - Auto-resolution of Kenya County, Constituency, and Ward via GET /geo/locate
//   - Searchable select dropdowns (SelectSearchBox) for administrative boundaries
//   - Sensibly positioned Clear Pin options (map toolbar + coordinates bar)
//
// Endpoints:
//   POST  /api/v1/tenant/branches       (owner, manager)
//   PATCH /api/v1/tenant/branches/{id}  (owner, manager)
//   GET   /api/v1/geo/locate            (any role / public)
// ---------------------------------------------------------------
import { ref, reactive, computed, nextTick } from "vue";
import branchesApi from "@/api/branches";
import geoApi from "@/api/geography";
import GoogleLocationInput from "@/components/GoogleLocationInput.vue";
import SelectSearchBox from "@/components/SelectSearchBox.vue";
import { GOOGLE_MAPS_API_KEY, loadGoogleMaps } from "@/utils/googleMaps.js";

const emit = defineEmits(["saved"]);

// Nairobi CBD fallback center
const DEFAULT_CENTER = { lat: -1.286389, lng: 36.817223 };
const KENYA_BOUNDS = { minLat: -5.5, maxLat: 5.5, minLng: 33.5, maxLng: 42.5 };

// Modal state
const visible = ref(false);
const submitting = ref(false);
const locating = ref(false);
const locatingWard = ref(false);
const loadingCounties = ref(false);
const loadingConstituencies = ref(false);
const loadingWards = ref(false);
const branch = ref(null);
const errors = ref({});
const serverError = ref("");
const locationError = ref("");

// Map & Location state
const locationInput = ref(null);
const mapEl = ref(null);
const mapError = ref("");
const resolvedWard = ref(null);
let googleMap = null;
let googleMarker = null;

// Geo Cascaders raw lists
const countiesList = ref([]);
const constituenciesList = ref([]);
const wardsList = ref([]);
const areasList = ref([]);
const selectedCountyId = ref(null);
const selectedConstituencyId = ref(null);

const form = reactive({
    name: "",
    premises_name: "",
    unit_label: "",
    address_line: "",
    ward_id: null,
    area_id: null,
    latitude: null,
    longitude: null,
    is_active: true,
});

const isEdit = computed(() => branch.value !== null);
const hasPoint = computed(() => form.latitude != null && form.longitude != null);

// SelectSearchBox option adapters
const countyOptions = computed(() =>
    countiesList.value.map((c) => ({ value: c.id, label: c.name }))
);
const constituencyOptions = computed(() =>
    constituenciesList.value.map((co) => ({ value: co.id, label: co.name }))
);
const wardOptions = computed(() =>
    wardsList.value.map((w) => ({ value: w.id, label: w.name }))
);
const areaOptions = computed(() =>
    areasList.value.map((a) => ({ value: a.id, label: a.name }))
);

function err(field) {
    return errors.value[field]?.[0] || "";
}

function inKenya(lat, lng) {
    return lat >= KENYA_BOUNDS.minLat && lat <= KENYA_BOUNDS.maxLat &&
           lng >= KENYA_BOUNDS.minLng && lng <= KENYA_BOUNDS.maxLng;
}

// ---- Google Maps Integration ----
async function initMap() {
    if (!mapEl.value) return;
    mapError.value = "";

    try {
        const google = await loadGoogleMaps();
        if (!mapEl.value) return;

        const startPos = (form.latitude != null && form.longitude != null)
            ? { lat: Number(form.latitude), lng: Number(form.longitude) }
            : DEFAULT_CENTER;

        googleMap = new google.maps.Map(mapEl.value, {
            center: startPos,
            zoom: form.latitude != null ? 16 : 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        });

        googleMap.addListener("click", (event) => {
            if (event.latLng) {
                onPointChanged(event.latLng.lat(), event.latLng.lng(), {
                    pan: false,
                });
            }
        });

        if (form.latitude != null && form.longitude != null) {
            placeMarker(form.latitude, form.longitude, false);
        }
    } catch (err) {
        console.error("Error loading Google Maps in Branch modal:", err);
        mapError.value = "Google Maps could not load. You can still type coordinates or select boundaries manually.";
    }
}

function placeMarker(lat, lng, pan = true) {
    if (!googleMap || !window.google?.maps) return;
    const position = { lat: Number(lat), lng: Number(lng) };

    if (!googleMarker) {
        googleMarker = new window.google.maps.Marker({
            position,
            map: googleMap,
            draggable: true,
            title: form.name || "Branch Location",
        });

        googleMarker.addListener("dragend", (event) => {
            if (event.latLng) {
                onPointChanged(event.latLng.lat(), event.latLng.lng(), {
                    pan: false,
                });
            }
        });
    } else {
        googleMarker.setPosition(position);
    }

    if (pan) {
        googleMap.panTo(position);
        if (googleMap.getZoom() < 15) googleMap.setZoom(16);
    }
}

// Point changed handler: updates form, places marker, and auto-resolves Kenyan boundaries via /geo/locate
async function onPointChanged(lat, lng, { pan = true, placeName = null, formattedAddress = null } = {}) {
    locationError.value = "";
    if (!inKenya(lat, lng)) {
        locationError.value = "Selected point is outside Kenya boundary coordinates.";
        return;
    }

    const roundedLat = Math.round(Number(lat) * 1e6) / 1e6;
    const roundedLng = Math.round(Number(lng) * 1e6) / 1e6;
    form.latitude = roundedLat;
    form.longitude = roundedLng;

    placeMarker(roundedLat, roundedLng, pan);

    // Apply place details if passed from Places search
    if (formattedAddress) {
        form.address_line = formattedAddress;
    }
    if (placeName && !form.premises_name && placeName !== formattedAddress) {
        form.premises_name = placeName;
    }

    // Resolve Kenyan Ward Boundary via local DB API (/geo/locate) - 0 billable Google requests
    await resolveWardFromPoint(roundedLat, roundedLng);
}

// Resolve Ward from /geo/locate and prefill County, Constituency, and Ward
async function resolveWardFromPoint(lat, lng) {
    locatingWard.value = true;
    try {
        const res = await geoApi.locate({ lat, lng, limit: 1 });
        const wardData = res.data?.data?.[0];

        if (wardData) {
            resolvedWard.value = wardData;

            // Auto-fill County
            if (wardData.county?.id) {
                selectedCountyId.value = wardData.county.id;
                await fetchConstituencies(wardData.county.id);
            }

            // Auto-fill Constituency
            if (wardData.constituency?.id) {
                selectedConstituencyId.value = wardData.constituency.id;
                await fetchWards(wardData.constituency.id);
            }

            // Auto-fill Ward
            if (wardData.id) {
                form.ward_id = wardData.id;
                await fetchAreas(wardData.id);
            }
        }
    } catch (e) {
        console.error("Error resolving ward from coordinates:", e);
    } finally {
        locatingWard.value = false;
    }
}

// Use device GPS location
function useMyLocation() {
    if (!navigator.geolocation) {
        locationError.value = "Geolocation is not supported by your browser.";
        return;
    }

    locating.value = true;
    locationError.value = "";

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            locating.value = false;
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            onPointChanged(lat, lng, { pan: true });
        },
        (err) => {
            locating.value = false;
            console.warn("Device geolocation failed:", err);
            locationError.value = "Could not get your device location: " + (err.message || "Permission denied");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
}

// Place selected from GoogleLocationInput
function onPlaceSelected(placeData) {
    if (!placeData?.latitude || !placeData?.longitude) return;
    onPointChanged(Number(placeData.latitude), Number(placeData.longitude), {
        pan: true,
        placeName: placeData.name || null,
        formattedAddress: placeData.formatted_address || placeData.location || null,
    });
}

function onAddressCleared() {
    form.address_line = "";
}

function clearPoint() {
    form.latitude = null;
    form.longitude = null;
    resolvedWard.value = null;
    if (googleMarker) {
        googleMarker.setMap(null);
        googleMarker = null;
    }
}

// ---- Geo cascading loaders ----
async function loadCounties() {
    if (countiesList.value.length) return;
    loadingCounties.value = true;
    try {
        const res = await geoApi.counties();
        countiesList.value = res.data?.data || res.data || [];
    } catch (e) {
        console.error("Error loading counties:", e);
    } finally {
        loadingCounties.value = false;
    }
}

async function fetchConstituencies(countyId) {
    constituenciesList.value = [];
    if (!countyId) return;
    loadingConstituencies.value = true;
    try {
        const res = await geoApi.constituencies(countyId);
        constituenciesList.value = res.data?.data || res.data || [];
    } catch (e) {
        console.error("Error loading constituencies:", e);
    } finally {
        loadingConstituencies.value = false;
    }
}

async function fetchWards(constituencyId) {
    wardsList.value = [];
    if (!constituencyId) return;
    loadingWards.value = true;
    try {
        const res = await geoApi.wards(constituencyId);
        wardsList.value = res.data?.data || res.data || [];
    } catch (e) {
        console.error("Error loading wards:", e);
    } finally {
        loadingWards.value = false;
    }
}

async function fetchAreas(wardId) {
    areasList.value = [];
    if (!wardId) return;
    try {
        const res = await geoApi.wardAreas(wardId);
        areasList.value = res.data?.data || res.data || [];
    } catch (e) {
        console.error("Error loading areas:", e);
    }
}

async function onCountySelect(id) {
    selectedCountyId.value = id;
    selectedConstituencyId.value = null;
    form.ward_id = null;
    form.area_id = null;
    constituenciesList.value = [];
    wardsList.value = [];
    areasList.value = [];
    resolvedWard.value = null;

    if (id) {
        await fetchConstituencies(id);
    }
}

async function onConstituencySelect(id) {
    selectedConstituencyId.value = id;
    form.ward_id = null;
    form.area_id = null;
    wardsList.value = [];
    areasList.value = [];
    resolvedWard.value = null;

    if (id) {
        await fetchWards(id);
    }
}

async function onWardSelect(id) {
    form.ward_id = id;
    form.area_id = null;
    areasList.value = [];

    if (id) {
        await fetchAreas(id);
    }
}

function onAreaSelect(id) {
    form.area_id = id;
}

// ---- Open / Close ----
async function open(row = null) {
    errors.value = {};
    serverError.value = "";
    locationError.value = "";
    submitting.value = false;
    resolvedWard.value = null;
    branch.value = row;

    await loadCounties();

    if (row) {
        form.name = row.name || "";
        form.premises_name = row.premises_name || "";
        form.unit_label = row.unit_label || "";
        form.address_line = row.address_line || "";
        form.ward_id = row.ward_id || null;
        form.area_id = row.area_id || null;
        form.latitude = row.latitude != null ? Number(row.latitude) : null;
        form.longitude = row.longitude != null ? Number(row.longitude) : null;
        form.is_active = Boolean(row.is_active);

        // Pre-fill geographic cascaders if row has ward attached
        if (row.ward) {
            const county = countiesList.value.find(
                (c) => c.name?.toLowerCase() === row.ward.county?.toLowerCase()
            );
            if (county) {
                selectedCountyId.value = county.id;
                await fetchConstituencies(county.id);
                const consti = constituenciesList.value.find(
                    (co) => co.name?.toLowerCase() === row.ward.constituency?.toLowerCase()
                );
                if (consti) {
                    selectedConstituencyId.value = consti.id;
                    await fetchWards(consti.id);
                }
            }
            if (form.ward_id) {
                await fetchAreas(form.ward_id);
            }
        }
    } else {
        form.name = "";
        form.premises_name = "";
        form.unit_label = "";
        form.address_line = "";
        form.ward_id = null;
        form.area_id = null;
        form.latitude = null;
        form.longitude = null;
        form.is_active = true;
        selectedCountyId.value = null;
        selectedConstituencyId.value = null;
        constituenciesList.value = [];
        wardsList.value = [];
        areasList.value = [];
    }

    visible.value = true;

    // Initialize Map and ensure location autocomplete is bound to the visible DOM input
    await nextTick();
    setTimeout(() => {
        initMap();
        locationInput.value?.init?.();
    }, 200);
}

function close() {
    if (submitting.value) return;
    visible.value = false;
    if (googleMarker) {
        googleMarker.setMap(null);
        googleMarker = null;
    }
}

// ---- Save ----
async function save() {
    errors.value = {};
    serverError.value = "";
    submitting.value = true;

    const payload = {
        name: form.name.trim(),
        premises_name: form.premises_name ? form.premises_name.trim() : null,
        unit_label: form.unit_label ? form.unit_label.trim() : null,
        address_line: form.address_line ? form.address_line.trim() : null,
        ward_id: form.ward_id || null,
        area_id: form.area_id || null,
        latitude: form.latitude !== null && form.latitude !== "" ? Number(form.latitude) : null,
        longitude: form.longitude !== null && form.longitude !== "" ? Number(form.longitude) : null,
        is_active: form.is_active,
    };

    try {
        let res;
        if (isEdit.value) {
            res = await branchesApi.update(branch.value.id, payload);
        } else {
            res = await branchesApi.create(payload);
        }
        visible.value = false;
        emit("saved", res.data?.data);
    } catch (err) {
        console.error("Error saving branch:", err);
        if (err.response?.status === 422) {
            errors.value = err.response.data?.errors || {};
            serverError.value = err.response.data?.message || "Please correct the highlighted fields.";
        } else {
            serverError.value = err.response?.data?.message || "Failed to save branch. Please try again.";
        }
    } finally {
        submitting.value = false;
    }
}

defineExpose({ open, close });
</script>

<style scoped>
.btn-white {
    background-color: #fff;
    border: 1px solid #ced4da;
    color: #495057;
}
.btn-white:hover {
    background-color: #f8f9fa;
    color: #212529;
}
.map-container {
    box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.05);
}
.form-switch-lg .form-check-input {
    width: 3rem;
    height: 1.5rem;
}
</style>
