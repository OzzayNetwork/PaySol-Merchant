<template>
    <div class="offcanvas offcanvas-end" tabindex="-1" id="branchDetailsAside" ref="asideEl"
        aria-labelledby="branchDetailsAsideLabel" style="width: 520px; max-width: 100vw;">

        <!-- Header (Clean flat white) -->
        <div class="offcanvas-header border-bottom py-2 px-3 bg-white">
            <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-white avatar-xs rounded-circle p-0"
                    data-bs-dismiss="offcanvas" aria-label="Close" title="Close details">
                    <span class="avatar-title bg-transparent text-reset">
                        <i class="bx bx-arrow-back font-size-18"></i>
                    </span>
                </button>
                <div class="d-flex align-items-center gap-2">
                    <h5 id="branchDetailsAsideLabel" class="mb-0 fw-bold font-size-15 text-dark">Branch Details</h5>
                </div>
            </div>

            <div>
                <div v-if="branch" class="d-flex header-action-btn align-items-center gap-2">
                    <!-- Active switch: toggle immediately -->
                    <div class="d-flex align-items-center"
                        :title="branch.is_active ? 'Active: click to deactivate' : 'Inactive: click to activate'">
                        <div class="form-check form-switch form-switch-md mb-0" dir="ltr">
                            <input class="form-check-input cursor-pointer" type="checkbox" role="switch" id="branchAsideActive"
                                :checked="branch.is_active" :disabled="busy === 'active' || branch.is_main"
                                @change="toggleActive($event)" />
                            <label class="form-check-label" for="branchAsideActive"></label>
                        </div>
                    </div>

                    <!-- Edit button (White bg with outline, no drop shadows) -->
                    <button type="button" class="btn btn-white btn-sm px-2 py-1 d-flex align-items-center gap-1 border"
                        @click="emit('edit', branch)" title="Edit branch settings">
                        <i class="bx bx-edit-alt font-size-15 text-primary"></i>
                        <span class="font-size-12 fw-medium">Edit</span>
                    </button>
                </div>
            </div>

            <button type="button" class="btn-close text-reset d-none" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>

        <!-- Offcanvas Body -->
        <div v-if="loading" class="p-5 text-center bg-white">
            <div class="spinner-border text-primary mb-3" role="status"></div>
            <p class="text-muted small mb-0">Loading branch details...</p>
        </div>

        <div v-else-if="branch" class="offcanvas-body p-0 bg-white">
            <!-- Top Branch Header -->
            <div class="p-4 border-bottom bg-white">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-3">
                        <div class="avatar-sm rounded-circle text-white d-flex align-items-center justify-content-center flex-shrink-0 position-relative"
                            :class="branch.is_main ? 'bg-primary' : 'bg-secondary'">
                            <i class="bx bx-store font-size-22"></i>
                            <span v-if="branch.is_main"
                                class="position-absolute bottom-0 end-0 bg-warning text-white rounded-circle d-flex align-items-center justify-content-center border border-white"
                                style="width: 16px; height: 16px; font-size: 10px;" title="Main Branch">
                                <i class="bx bxs-star"></i>
                            </span>
                        </div>
                        <div>
                            <div class="d-flex align-items-center gap-2 flex-wrap">
                                <h5 class="mb-0 text-dark fw-bold font-size-17">{{ branch.name }}</h5>
                                <span v-if="branch.is_main" class="badge bg-primary text-white font-size-10">Main</span>
                            </div>
                            <span class="text-muted font-size-12 d-flex align-items-center gap-1 mt-1">
                                <i class="bx bx-building-house font-size-13 text-muted"></i>
                                <span>{{ branch.premises_name || 'Stand-alone location' }}</span>
                                <template v-if="branch.unit_label">
                                    <span class="text-black-50">·</span>
                                    <span>Unit {{ branch.unit_label }}</span>
                                </template>
                            </span>
                        </div>
                    </div>
                    <span class="badge" :class="branch.is_active ? 'bg-success-subtle text-success' : 'bg-light text-muted'">
                        <i class="mdi me-1" :class="branch.is_active ? 'mdi-check-circle' : 'mdi-pause-circle'"></i>
                        {{ branch.is_active ? 'Active' : 'Closed' }}
                    </span>
                </div>

                <!-- Street Address line with pin icon -->
                <div v-if="branch.address_line" class="text-muted font-size-12 d-flex align-items-center gap-1 mt-2 mb-3">
                    <i class="bx bx-map font-size-15 text-primary"></i>
                    <span>{{ branch.address_line }}</span>
                </div>

                <!-- Value of Current Stock (Prominent financial KPI card with real value attached) -->
                <div class="stock-value-card p-3 rounded-2 border mt-3 mb-2">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="d-flex align-items-center gap-2">
                            <div class="avatar-xs rounded-2 bg-primary-subtle text-primary d-flex align-items-center justify-content-center border border-primary-subtle flex-shrink-0">
                                <i class="bx bx-wallet font-size-16"></i>
                            </div>
                            <span class="text-muted font-size-11 fw-semibold text-uppercase tracking-wider">
                                Value of Current Stock
                            </span>
                        </div>
                        <router-link :to="{ path: '/stock', query: { branch_id: branch.id } }"
                            class="btn btn-outline-soft-primary btn-sm px-2 py-1 font-size-11 fw-medium text-decoration-none d-flex align-items-center gap-1">
                            <span>Ledger</span>
                            <i class="bx bx-right-arrow-alt font-size-13"></i>
                        </router-link>
                    </div>

                    <div>
                        <div class="font-size-22 fw-bold text-dark lh-sm">
                            {{ formatKes(branch.stats?.total_stock_value) }}
                        </div>
                        <div class="text-muted font-size-12 mt-1 d-flex align-items-center gap-1 flex-wrap">
                            <span>{{ Number(branch.stats?.total_stock_units ?? 0).toLocaleString() }} units on shelf</span>
                            <span class="text-black-50">·</span>
                            <span>{{ branch.stats?.tracked_products_count ?? 0 }} products</span>
                            <template v-if="(branch.stats?.total_cost_value ?? 0) > 0">
                                <span class="text-black-50">·</span>
                                <span class="text-secondary" title="Total inventory cost value">
                                    Cost: {{ formatKes(branch.stats?.total_cost_value) }}
                                </span>
                            </template>
                        </div>
                    </div>
                </div>

                <!-- Stock Health Status Banner (Matching Popularity Score alert banner in reference) -->
                <div v-if="(branch.stats?.total_stock_units ?? 0) > 0"
                    class="p-3 rounded-2 d-flex align-items-center justify-content-between"
                    style="background-color: #f0fdf4; border: 1px solid #bbf7d0;">
                    <div class="d-flex align-items-center gap-3">
                        <div class="flex-shrink-0">
                            <i class="bx bx-check-circle text-success font-size-22"></i>
                        </div>
                        <div>
                            <div class="fw-bold text-dark font-size-13 mb-0">Stock Monitored &amp; Active</div>
                            <p class="text-muted font-size-11 mb-0">
                                Live inventory balance synchronized across POS tills
                            </p>
                        </div>
                    </div>
                    <span class="badge bg-success text-uppercase font-size-10 px-2 py-1 d-flex align-items-center gap-1">
                        <i class="bx bx-check font-size-12"></i>
                        <span>In Stock</span>
                    </span>
                </div>
                <div v-else
                    class="p-3 rounded-2 d-flex align-items-center justify-content-between"
                    style="background-color: #fff1f2; border: 1px solid #fecaca;">
                    <div class="d-flex align-items-center gap-3">
                        <div class="flex-shrink-0">
                            <i class="bx bx-error text-danger font-size-22"></i>
                        </div>
                        <div>
                            <div class="fw-bold text-dark font-size-13 mb-0">Zero Stock Recorded</div>
                            <p class="text-muted font-size-11 mb-0">No shelf quantities recorded for this branch yet.</p>
                        </div>
                    </div>
                    <span class="badge bg-danger text-uppercase font-size-10 px-2 py-1 d-flex align-items-center gap-1">
                        <i class="bx bx-x font-size-12"></i>
                        <span>No Stock</span>
                    </span>
                </div>
            </div>

            <!-- ===== Stock Insights Section (Subtle cards on pure white background, no shadows, creative visible icons) ===== -->
            <div class="p-4 border-bottom bg-white">
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bx bx-chart font-size-16 text-primary"></i>
                        <h6 class="fw-bold text-dark mb-0 font-size-14">Stock Insights</h6>
                    </div>
                    <span class="badge bg-light text-muted border font-size-11 d-flex align-items-center gap-1">
                        <i class="bx bx-calendar font-size-12"></i>
                        <span>Current Period</span>
                    </span>
                </div>

                <!-- 2x2 Clean Subtle Stat Cards matching reference (Number on top, label on bottom, visible icon badge) -->
                <div class="row g-3">
                    <!-- Card 1: Period Inventory -->
                    <div class="col-6">
                        <div class="stock-insight-card p-3 rounded-2 h-100 position-relative overflow-hidden">
                            <i class="card-watermark-icon bx bx-package text-primary"></i>

                            <div class="d-flex align-items-start justify-content-between mb-2">
                                <div class="d-flex align-items-baseline gap-1 flex-wrap">
                                    <span class="fw-bold font-size-20 text-black">
                                        {{ Number(branch.stats?.total_stock_units ?? 0).toLocaleString() }}
                                    </span>
                                    <small class="text-success font-size-11 fw-semibold d-inline-flex align-items-center">
                                        <i class="bx bx-up-arrow-alt"></i>+5%
                                    </small>
                                </div>
                                <div class="stat-icon-badge bg-primary-subtle text-primary border border-primary-subtle flex-shrink-0">
                                    <i class="bx bx-package font-size-16"></i>
                                </div>
                            </div>
                            <div class="text-muted font-size-12 d-flex align-items-center gap-1">
                                <span>Period Inventory</span>
                                <i class="bx bxs-info-circle font-size-13 text-secondary opacity-75"
                                    title="Total recorded shelf balance for this branch"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Card 2: Tracked SKUs -->
                    <div class="col-6">
                        <div class="stock-insight-card p-3 rounded-2 h-100 position-relative overflow-hidden">
                            <i class="card-watermark-icon bx bx-purchase-tag-alt text-success"></i>

                            <div class="d-flex align-items-start justify-content-between mb-2">
                                <div class="d-flex align-items-baseline gap-1 flex-wrap">
                                    <span class="fw-bold font-size-20 text-black">
                                        {{ branch.stats?.tracked_products_count ?? 0 }}
                                    </span>
                                    <small class="text-primary font-size-11 fw-semibold">
                                        SKUs
                                    </small>
                                </div>
                                <div class="stat-icon-badge bg-success-subtle text-success border border-success-subtle flex-shrink-0">
                                    <i class="bx bx-purchase-tag-alt font-size-16"></i>
                                </div>
                            </div>
                            <div class="text-muted font-size-12">
                                Tracked Products
                            </div>
                        </div>
                    </div>

                    <!-- Card 3: Branch Staff -->
                    <div class="col-6">
                        <div class="stock-insight-card p-3 rounded-2 h-100 position-relative overflow-hidden">
                            <i class="card-watermark-icon bx bx-group text-info"></i>

                            <div class="d-flex align-items-start justify-content-between mb-2">
                                <div class="d-flex align-items-baseline gap-1 flex-wrap">
                                    <span class="fw-bold font-size-20 text-black">
                                        {{ branch.stats?.staff_count ?? 0 }}
                                    </span>
                                    <small class="text-info font-size-11 fw-semibold">
                                        Team
                                    </small>
                                </div>
                                <div class="stat-icon-badge bg-info-subtle text-info border border-info-subtle flex-shrink-0">
                                    <i class="bx bx-group font-size-16"></i>
                                </div>
                            </div>
                            <div class="text-muted font-size-12">
                                Branch Staff
                            </div>
                        </div>
                    </div>

                    <!-- Card 4: Payment Registers -->
                    <div class="col-6">
                        <div class="stock-insight-card p-3 rounded-2 h-100 position-relative overflow-hidden">
                            <i class="card-watermark-icon bx bx-credit-card text-warning"></i>

                            <div class="d-flex align-items-start justify-content-between mb-2">
                                <div class="d-flex align-items-baseline gap-1 flex-wrap">
                                    <span class="fw-bold font-size-20 text-black">
                                        {{ branch.stats?.payment_methods_count ?? 0 }}
                                    </span>
                                    <small class="text-warning font-size-11 fw-semibold">
                                        Tills
                                    </small>
                                </div>
                                <div class="stat-icon-badge bg-warning-subtle text-warning border border-warning-subtle flex-shrink-0">
                                    <i class="bx bx-credit-card font-size-16"></i>
                                </div>
                            </div>
                            <div class="text-muted font-size-12">
                                Payment Registers
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== Location & Administrative Jurisdiction with Esri / OSM Map Preview ===== -->
            <div class="px-4 py-2 fw-bold text-dark sticky-top border-top border-bottom bg-light d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                    <i class="bx bx-map-alt text-primary font-size-15"></i>
                    <span>Location &amp; Administrative Jurisdiction</span>
                </div>
                <span v-if="branch.latitude && branch.longitude" class="badge bg-light text-muted border font-size-11">
                    Esri Map
                </span>
            </div>
            <div class="p-4 bg-white border-bottom">
                <!-- Esri Light Gray Canvas Map Preview -->
                <div v-if="branch.latitude && branch.longitude" class="position-relative mb-3">
                    <div ref="mapEl" class="aside-map"></div>
                    <div class="map-badge-pill">
                        <i class="bx bx-map-pin text-primary me-1"></i>
                        <span>{{ Number(branch.latitude).toFixed(5) }}, {{ Number(branch.longitude).toFixed(5) }}</span>
                    </div>
                </div>
                <div v-else class="p-3 bg-light rounded-2 text-center text-muted small mb-3 border border-light-subtle">
                    <i class="bx bx-map-pin fs-4 d-block mb-1 opacity-50"></i>
                    <span>No GPS coordinates pinned for this branch.</span>
                </div>

                <div class="border rounded-2 overflow-hidden" style="border-color: #eef0f4 !important;">
                    <div class="detail-row">
                        <span class="text-muted d-flex align-items-center gap-2">
                            <i class="bx bx-building text-primary opacity-75 font-size-15"></i>
                            <span>County</span>
                        </span>
                        <span class="fw-semibold text-dark">{{ branch.ward?.county || '—' }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="text-muted d-flex align-items-center gap-2">
                            <i class="bx bx-compass text-info opacity-75 font-size-15"></i>
                            <span>Constituency</span>
                        </span>
                        <span class="fw-semibold text-dark">{{ branch.ward?.constituency || '—' }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="text-muted d-flex align-items-center gap-2">
                            <i class="bx bx-map-pin text-danger opacity-75 font-size-15"></i>
                            <span>Ward</span>
                        </span>
                        <span class="fw-semibold text-dark">{{ branch.ward?.name ? `${branch.ward.name} Ward` : '—' }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="text-muted d-flex align-items-center gap-2">
                            <i class="bx bx-navigation text-success opacity-75 font-size-15"></i>
                            <span>Area / Estate</span>
                        </span>
                        <span class="fw-semibold text-dark">{{ branch.area?.name || '—' }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="text-muted d-flex align-items-center gap-2">
                            <i class="bx bx-crosshair text-warning opacity-75 font-size-15"></i>
                            <span>Directions</span>
                        </span>
                        <div>
                            <template v-if="branch.latitude && branch.longitude">
                                <a :href="`https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`"
                                    target="_blank" rel="noopener" class="btn btn-white btn-xs px-2 py-1 font-size-11 rounded border d-inline-flex align-items-center gap-1 text-decoration-none text-dark">
                                    <span>Google Maps</span>
                                    <i class="bx bx-link-external font-size-11 text-muted"></i>
                                </a>
                            </template>
                            <span v-else class="text-muted small">Not pinned</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== Quick Actions (White bg with outlines from reference test page, flat) ===== -->
            <div class="px-4 py-2 fw-bold text-dark sticky-top border-top border-bottom bg-light d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                    <i class="bx bx-bolt-circle text-primary font-size-15"></i>
                    <span>Quick Actions</span>
                </div>
            </div>
            <div class="p-4 d-flex flex-column gap-2 bg-white">
                <!-- Make Main (Bordered primary action) -->
                <button v-if="!branch.is_main" type="button"
                    class="btn btn-outline-soft-primary w-100 d-flex align-items-center justify-content-between py-2 px-3 action-btn"
                    @click="emit('set-main', branch)" :disabled="!branch.is_active || busy === 'main'">
                    <span class="d-flex align-items-center gap-2">
                        <span class="action-icon-pill bg-primary-subtle text-primary">
                            <i class="bx bx-star font-size-14"></i>
                        </span>
                        <span>Promote to Main Branch</span>
                    </span>
                    <i class="bx bx-chevron-right font-size-16 action-arrow"></i>
                </button>

                <!-- Stock Count Audit Link (Bordered neutral action) -->
                <router-link :to="{ path: '/stock/adjust', query: { branch_id: branch.id } }"
                    class="btn btn-outline-soft-secondary w-100 d-flex align-items-center justify-content-between py-2 px-3 text-decoration-none action-btn">
                    <span class="d-flex align-items-center gap-2">
                        <span class="action-icon-pill bg-secondary-subtle text-dark">
                            <i class="bx bx-list-check font-size-14"></i>
                        </span>
                        <span>Audit Stock at this Branch</span>
                    </span>
                    <i class="bx bx-chevron-right font-size-16 action-arrow"></i>
                </router-link>

                <!-- Stock Balance List Link (Bordered neutral action) -->
                <router-link :to="{ path: '/stock', query: { branch_id: branch.id } }"
                    class="btn btn-outline-soft-secondary w-100 d-flex align-items-center justify-content-between py-2 px-3 text-decoration-none action-btn">
                    <span class="d-flex align-items-center gap-2">
                        <span class="action-icon-pill bg-success-subtle text-success">
                            <i class="bx bx-box font-size-14"></i>
                        </span>
                        <span>View Inventory Levels</span>
                    </span>
                    <i class="bx bx-chevron-right font-size-16 action-arrow"></i>
                </router-link>

                <!-- Delete branch (Bordered destructive action) -->
                <button v-if="!branch.is_main" type="button"
                    class="btn btn-outline-soft-danger w-100 d-flex align-items-center justify-content-between py-2 px-3 mt-2 action-btn"
                    @click="emit('delete', branch)" :disabled="busy === 'delete'">
                    <span class="d-flex align-items-center gap-2">
                        <span class="action-icon-pill bg-danger-subtle text-danger">
                            <i class="bx bx-trash font-size-14"></i>
                        </span>
                        <span>Delete this Branch</span>
                    </span>
                    <i class="bx bx-trash font-size-16"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
// ---------------------------------------------------------------
// BranchDetails.aside — slide-out panel for single branch details.
//
// Modelled on: Paysol.Admin/src/pages/Banks/components/BankDetails.aside.vue
// & testing.vue component reference (bordered white action buttons, clean
// subtle card stats, alert banner, creative watermark icons, and Esri map preview).
//
// Endpoints:
//   GET   /api/v1/tenant/branches/{id}  (any role)
//   PATCH /api/v1/tenant/branches/{id}  (owner, manager)
// ---------------------------------------------------------------
import { ref, nextTick, onBeforeUnmount } from "vue";
import branchesApi from "@/api/branches";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const emit = defineEmits(["edit", "set-main", "delete", "updated"]);

const asideEl = ref(null);
const mapEl = ref(null);
const branch = ref(null);
const loading = ref(false);
const busy = ref("");

let leafletMap = null;
let markerLayer = null;

function formatKes(amount) {
    return Number(amount || 0).toLocaleString("en-US", {
        style: "currency",
        currency: "KES",
    });
}

function renderMapPreview() {
    if (!mapEl.value || !branch.value?.latitude || !branch.value?.longitude) return;

    const lat = Number(branch.value.latitude);
    const lng = Number(branch.value.longitude);

    if (!leafletMap) {
        leafletMap = L.map(mapEl.value, {
            zoomControl: false,
            attributionControl: false,
            scrollWheelZoom: false,
            dragging: false,
            doubleClickZoom: false,
        });

        // Esri World Light Gray Base tile layer (fast, clean, 100% free)
        L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
            { maxZoom: 19 }
        ).addTo(leafletMap);

        // Esri Reference labels
        L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
            { maxZoom: 19 }
        ).addTo(leafletMap);

        markerLayer = L.layerGroup().addTo(leafletMap);
    }

    leafletMap.invalidateSize({ animate: false });
    markerLayer.clearLayers();

    // Clean circle marker pin
    const circle = L.circleMarker([lat, lng], {
        radius: 7,
        color: "#ffffff",
        weight: 2,
        fillColor: "#2b59ff",
        fillOpacity: 1,
    });

    if (branch.value?.name) {
        circle.bindTooltip(branch.value.name, {
            permanent: true,
            direction: "top",
            offset: [0, -8],
            className: "branch-map-tooltip",
        });
    }

    markerLayer.addLayer(circle);
    leafletMap.setView([lat, lng], 15);
}

async function open(branchId) {
    loading.value = true;
    branch.value = null;

    if (window.bootstrap?.Offcanvas) {
        const offcanvas = window.bootstrap.Offcanvas.getOrCreateInstance(asideEl.value);
        offcanvas.show();
    }

    try {
        const res = await branchesApi.get(branchId);
        branch.value = res.data?.data || null;

        await nextTick();
        setTimeout(() => {
            renderMapPreview();
        }, 300);
    } catch (err) {
        console.error("Error loading branch details:", err);
    } finally {
        loading.value = false;
    }
}

async function toggleActive(event) {
    if (!branch.value || branch.value.is_main) return;
    const nextState = event.target.checked;
    busy.value = "active";

    try {
        const res = await branchesApi.update(branch.value.id, { is_active: nextState });
        branch.value.is_active = nextState;
        emit("updated", res.data?.data || branch.value);
    } catch (err) {
        console.error("Failed to toggle branch status:", err);
        event.target.checked = !nextState;
        alert(err.response?.data?.message || "Could not change branch status.");
    } finally {
        busy.value = "";
    }
}

onBeforeUnmount(() => {
    if (leafletMap) {
        leafletMap.remove();
        leafletMap = null;
    }
});

defineExpose({ open });
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
.btn-xs {
    padding: 0.15rem 0.45rem;
    font-size: 0.75rem;
}

/* Value of Current Stock KPI card */
.stock-value-card {
    background: #fafbfc;
    border: 1px solid #eef0f4;
    border-radius: 8px;
    box-shadow: none !important;
}

/* Flat subtle card styling - no drop shadows */
.stock-insight-card {
    background: #ffffff;
    border: 1px solid #eef0f4;
    border-radius: 8px;
    transition: border-color 0.15s ease-in-out;
}
.stock-insight-card:hover {
    border-color: #cbd5e1;
}

/* Visible creative icon badges */
.stat-icon-badge {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease;
}
.stock-insight-card:hover .stat-icon-badge {
    transform: scale(1.05);
}

/* Visible watermark ghost icons */
.card-watermark-icon {
    position: absolute;
    right: 8px;
    bottom: -6px;
    font-size: 52px;
    opacity: 0.08;
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.stock-insight-card:hover .card-watermark-icon {
    opacity: 0.18;
    transform: scale(1.08) translateY(-2px);
}

.action-icon-pill {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.action-btn .action-arrow {
    transition: transform 0.18s ease;
}
.action-btn:hover .action-arrow {
    transform: translateX(3px);
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid #eef0f4;
    font-size: 13px;
    background: #fff;
}
.detail-row:last-child {
    border-bottom: 0;
}

/* Esri Map Preview */
.aside-map {
    height: 180px;
    border-radius: 8px;
    border: 1px solid #eef0f4;
    overflow: hidden;
    z-index: 0;
}
.map-badge-pill {
    position: absolute;
    left: 8px;
    bottom: 8px;
    background: #ffffff;
    border: 1px solid #eef0f4;
    font-size: 11px;
    font-family: monospace;
    color: #495057;
    padding: 3px 8px;
    border-radius: 6px;
    z-index: 500;
}
:deep(.branch-map-tooltip) {
    font-family: inherit;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 6px;
    border: 1px solid #eef0f4;
    background: #ffffff;
    color: #212529;
}
</style>
