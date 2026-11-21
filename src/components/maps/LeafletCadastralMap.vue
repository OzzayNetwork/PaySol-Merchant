<template>
  <div class="cadastral-map-wrapper position-relative" :style="{ height }">
    <!-- Map Canvas Mount -->
    <div ref="mapContainer" class="w-100 h-100 rounded-3 shadow-sm border"></div>

    <!-- Floating Top Control Bar -->
    <div class="cadastral-toolbar position-absolute top-0 start-0 m-3 cadastral-floating-ui d-flex flex-wrap gap-2 align-items-center">
      <!-- Basemap Switcher Pill -->
      <div class="btn-group btn-group-sm rounded-pill p-1 cadastral-glass-panel">
        <button
          type="button"
          class="btn btn-sm rounded-pill px-3 py-1 waves-effect"
          :class="activeBasemap === 'satellite' ? 'btn-primary text-white fw-semibold' : 'btn-light text-dark'"
          @click="switchBasemap('satellite')"
        >
          <i class="mdi mdi-satellite-variant me-1"></i> Satellite (Esri)
        </button>
        <button
          type="button"
          class="btn btn-sm rounded-pill px-3 py-1 waves-effect"
          :class="activeBasemap === 'osm' ? 'btn-primary text-white fw-semibold' : 'btn-light text-dark'"
          @click="switchBasemap('osm')"
        >
          <i class="mdi mdi-map-outline me-1"></i> Streets (OSM)
        </button>
        <button
          type="button"
          class="btn btn-sm rounded-pill px-3 py-1 waves-effect"
          :class="activeBasemap === 'light' ? 'btn-primary text-white fw-semibold' : 'btn-light text-dark'"
          @click="switchBasemap('light')"
        >
          <i class="mdi mdi-layers-outline me-1"></i> Clean Light
        </button>
      </div>

      <!-- Quick Action Buttons -->
      <div class="d-flex gap-1 p-1 rounded-pill cadastral-glass-panel">
        <button
          type="button"
          class="btn btn-sm btn-light rounded-circle p-1 action-btn waves-effect"
          title="Fit view to all parcels"
          @click="fitBoundsToParcels"
        >
          <i class="mdi mdi-crop-free font-size-16"></i>
        </button>
        <button
          type="button"
          class="btn btn-sm rounded-circle p-1 action-btn waves-effect"
          :class="showLabels ? 'btn-info text-white' : 'btn-light'"
          title="Toggle Plot Labels"
          @click="toggleLabels"
        >
          <i class="mdi mdi-label-outline font-size-16"></i>
        </button>
      </div>

      <!-- Provider Tag -->
      <span class="badge cadastral-dark-panel px-3 py-2 rounded-pill d-flex align-items-center gap-2">
        <span class="provider-dot bg-success rounded-circle"></span>
        Provider: Leaflet.js
      </span>
    </div>

    <!-- Bottom Left Cadastral Status Legend -->
    <div class="cadastral-legend position-absolute bottom-0 start-0 m-3 cadastral-floating-ui cadastral-glass-panel p-3 rounded-3" style="min-width: 195px;">
      <div class="fw-bold small mb-2 text-dark text-uppercase letter-spacing-1">Cadastral Status</div>
      <div class="d-flex flex-column gap-2 small">
        <div class="d-flex align-items-center gap-2">
          <span class="legend-swatch legend-active"></span>
          <span class="fw-medium text-dark">Titled / Active</span>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="legend-swatch legend-leased"></span>
          <span class="fw-medium text-dark">Leased / Occupied</span>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="legend-swatch legend-reserved"></span>
          <span class="fw-medium text-dark">Pending Allocation</span>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="legend-swatch legend-disputed"></span>
          <span class="fw-medium text-dark">Caution / Disputed</span>
        </div>
      </div>
    </div>

    <!-- Bottom Right Coordinate & Selection HUD -->
    <div class="position-absolute bottom-0 end-0 m-3 cadastral-floating-ui cadastral-hud d-flex flex-column align-items-end gap-2">
      <div v-if="hoveredParcel" class="hud-card cadastral-glass-panel p-2 rounded-3 small animate-fade-in">
        <div class="fw-bold text-primary">{{ hoveredParcel.properties?.plotNumber }}</div>
        <div class="text-muted">{{ hoveredParcel.properties?.areaAcres }} Acres ({{ Number(hoveredParcel.properties?.areaSqm || 0).toLocaleString() }} m²)</div>
        <div class="text-dark">{{ hoveredParcel.properties?.registrationSection }}</div>
      </div>

      <div class="hud-coords cadastral-dark-panel px-3 py-1 rounded-pill font-monospace x-small">
        <i class="mdi mdi-crosshairs-gps me-1 text-info"></i>
        {{ cursorCoords.lat ? `${cursorCoords.lat.toFixed(5)}, ${cursorCoords.lng.toFixed(5)}` : 'Hover map for coordinates' }}
      </div>
    </div>
  </div>
</template>

<script setup>
// -----------------------------------------------------------------------------
// LeafletCadastralMap.vue — Leaflet.js Cadastral Mapping Provider
//
// Renders cadastral parcels (GeoJSON polygons) with multi-provider basemap support
// (Esri World Imagery satellite, OSM streets, CartoDB Positron clean light).
//
// Features:
// - Status-based polygon styles (active, leased, reserved, disputed).
// - Interactive parcel hover, selection, and popup cards with ownership/valuation.
// - GPS coordinate tracking and fit-to-bounds geometry controls.
// - Emits: parcel-selected, parcel-hover, map-clicked, basemap-changed.
// -----------------------------------------------------------------------------
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue"
import "leaflet/dist/leaflet.css"
import "@/assets/css/maps.cadastral.css"
import L from "leaflet"

// Marker assets for Vite bundler
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png"
import iconUrl from "leaflet/dist/images/marker-icon.png"
import shadowUrl from "leaflet/dist/images/marker-shadow.png"

// Default mock cadastral data for instant demo/testing
import { mockKenyaParcels, defaultCadastralCenter, defaultCadastralZoom } from "./demo/mockCadastralData.js"

// Leaflet default icon path fix for Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

const props = defineProps({
  parcels: {
    type: Object,
    default: () => mockKenyaParcels,
  },
  selectedParcelId: {
    type: [String, Number],
    default: null,
  },
  center: {
    type: Array,
    default: () => defaultCadastralCenter,
  },
  zoom: {
    type: Number,
    default: defaultCadastralZoom,
  },
  height: {
    type: String,
    default: "650px",
  },
  defaultBasemap: {
    type: String,
    default: "satellite", // 'satellite' | 'osm' | 'carto'
  },
  interactive: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  "parcel-selected",
  "parcel-hover",
  "map-clicked",
  "basemap-changed",
])

// ---- State ----
const mapContainer = ref(null)
let map = null
let geoJsonLayer = null
let baseLayers = {}
let activeTileLayer = null
let overlayHybridLayer = null

const activeBasemap = ref(props.defaultBasemap)
const showLabels = ref(true)
const hoveredParcel = ref(null)
const cursorCoords = ref({ lat: null, lng: null })

// ---- Status Color Styles ----
const statusStyles = {
  active: {
    color: "#10B981",
    fillColor: "#10B981",
    fillOpacity: 0.35,
    weight: 2,
  },
  leased: {
    color: "#3B82F6",
    fillColor: "#3B82F6",
    fillOpacity: 0.35,
    weight: 2,
  },
  reserved: {
    color: "#F59E0B",
    fillColor: "#F59E0B",
    fillOpacity: 0.35,
    weight: 2,
  },
  disputed: {
    color: "#EF4444",
    fillColor: "#EF4444",
    fillOpacity: 0.45,
    weight: 2.5,
    dashArray: "4, 4",
  },
  default: {
    color: "#6B7280",
    fillColor: "#9CA3AF",
    fillOpacity: 0.3,
    weight: 1.5,
  },
}

function getParcelStyle(feature) {
  const status = feature.properties?.status || "default"
  const baseStyle = { ...(statusStyles[status] || statusStyles.default) }

  const parcelId = feature.id || feature.properties?.id || feature.properties?.plotNumber
  if (props.selectedParcelId && String(props.selectedParcelId) === String(parcelId)) {
    baseStyle.weight = 3.5
    baseStyle.color = "#FACC15"
    baseStyle.fillOpacity = 0.6
  }

  return baseStyle
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "active":
      return "badge bg-success bg-soft text-success border border-success border-opacity-25"
    case "leased":
      return "badge bg-primary bg-soft text-primary border border-primary border-opacity-25"
    case "reserved":
      return "badge bg-warning bg-soft text-warning border border-warning border-opacity-25"
    case "disputed":
      return "badge bg-danger bg-soft text-danger border border-danger border-opacity-25"
    default:
      return "badge bg-secondary bg-soft text-secondary"
  }
}

// ---- Map Initialization ----
function initMap() {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value, {
    center: props.center,
    zoom: props.zoom,
    zoomControl: false,
    attributionControl: true,
  })

  L.control.zoom({ position: "topright" }).addTo(map)

  // Satellite Basemap (Esri World Imagery)
  baseLayers.satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics",
      maxZoom: 19,
    }
  )

  // Hybrid Labels & Places Overlay
  overlayHybridLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Labels &copy; Esri",
      maxZoom: 19,
    }
  )

  // Streets Basemap (OpenStreetMap)
  baseLayers.osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  })

  // Clean Light Basemap (Esri World Light Gray Canvas - Free, No API key needed)
  baseLayers.light = L.layerGroup([
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors",
        maxZoom: 19,
      }
    ),
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Labels &copy; Esri",
        maxZoom: 19,
      }
    ),
  ])

  switchBasemap(props.defaultBasemap)

  map.on("mousemove", (e) => {
    cursorCoords.value = { lat: e.latlng.lat, lng: e.latlng.lng }
  })

  map.on("click", (e) => {
    emit("map-clicked", { lat: e.latlng.lat, lng: e.latlng.lng })
  })

  renderParcels()
}

// ---- Basemap Switching ----
function switchBasemap(providerKey) {
  if (!map || !baseLayers[providerKey]) return

  if (activeTileLayer) {
    map.removeLayer(activeTileLayer)
  }

  activeTileLayer = baseLayers[providerKey]
  map.addLayer(activeTileLayer)

  if (providerKey === "satellite") {
    if (!map.hasLayer(overlayHybridLayer)) {
      map.addLayer(overlayHybridLayer)
    }
  } else {
    if (map.hasLayer(overlayHybridLayer)) {
      map.removeLayer(overlayHybridLayer)
    }
  }

  activeBasemap.value = providerKey
  emit("basemap-changed", providerKey)
}

// ---- Parcel Rendering ----
function renderParcels() {
  if (!map) return

  if (geoJsonLayer) {
    map.removeLayer(geoJsonLayer)
  }

  if (!props.parcels || !props.parcels.features) return

  geoJsonLayer = L.geoJSON(props.parcels, {
    style: getParcelStyle,
    onEachFeature(feature, layer) {
      const propsData = feature.properties || {}

      if (propsData.plotNumber) {
        layer.bindTooltip(
          `<div class="fw-bold text-center">${propsData.plotNumber}</div><div class="x-small text-muted text-center">${propsData.areaAcres ? propsData.areaAcres + ' Ac' : ''}</div>`,
          {
            permanent: showLabels.value,
            direction: "center",
            className: "cadastral-plot-tooltip",
          }
        )
      }

      const popupHtml = `
        <div class="cadastral-popup p-1" style="min-width: 240px;">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="fw-bold mb-0 text-primary">${propsData.plotNumber || 'Cadastral Parcel'}</h6>
            <span class="${getStatusBadgeClass(propsData.status)}">${propsData.statusLabel || propsData.status || 'Active'}</span>
          </div>
          <div class="small text-muted mb-2">${propsData.registrationSection || 'Cadastral Section'}</div>
          
          <table class="table table-sm table-borderless x-small mb-2">
            <tbody>
              <tr>
                <td class="text-muted ps-0 py-0">Owner:</td>
                <td class="fw-semibold text-end pe-0 py-0 text-truncate" style="max-width: 140px;">${propsData.ownerName || 'N/A'}</td>
              </tr>
              <tr>
                <td class="text-muted ps-0 py-0">Area:</td>
                <td class="fw-semibold text-end pe-0 py-0">${propsData.areaAcres ? propsData.areaAcres + ' Acres' : ''} (${propsData.areaSqm ? Number(propsData.areaSqm).toLocaleString() + ' m²' : 'N/A'})</td>
              </tr>
              <tr>
                <td class="text-muted ps-0 py-0">Zoning:</td>
                <td class="fw-semibold text-end pe-0 py-0">${propsData.zoning || 'General'}</td>
              </tr>
              <tr>
                <td class="text-muted ps-0 py-0">Tenure:</td>
                <td class="fw-semibold text-end pe-0 py-0">${propsData.tenure || 'Leasehold'}</td>
              </tr>
              ${propsData.valuationKsh ? `
              <tr>
                <td class="text-muted ps-0 py-0">Valuation:</td>
                <td class="fw-semibold text-end pe-0 py-0 text-success">KES ${Number(propsData.valuationKsh).toLocaleString()}</td>
              </tr>` : ''}
            </tbody>
          </table>

          <button id="btn-select-parcel-${feature.id || propsData.id}" class="btn btn-primary btn-sm w-100 rounded-pill py-1 waves-effect fw-semibold">
            <i class="mdi mdi-check-circle-outline me-1"></i> Select Parcel
          </button>
        </div>
      `

      layer.bindPopup(popupHtml, { maxWidth: 300 })

      layer.on("popupopen", () => {
        const btnId = `btn-select-parcel-${feature.id || propsData.id}`
        const btn = document.getElementById(btnId)
        if (btn) {
          btn.onclick = () => {
            selectParcel(feature)
            map.closePopup()
          }
        }
      })

      layer.on("mouseover", (e) => {
        hoveredParcel.value = feature
        emit("parcel-hover", feature)
        e.target.setStyle({
          weight: 3,
          fillOpacity: 0.55,
        })
      })

      layer.on("mouseout", (e) => {
        hoveredParcel.value = null
        emit("parcel-hover", null)
        geoJsonLayer.resetStyle(e.target)
        e.target.setStyle(getParcelStyle(feature))
      })

      layer.on("click", () => {
        selectParcel(feature)
      })
    },
  }).addTo(map)
}

function selectParcel(feature) {
  emit("parcel-selected", feature)
}

function fitBoundsToParcels() {
  if (geoJsonLayer && map && geoJsonLayer.getLayers().length > 0) {
    map.fitBounds(geoJsonLayer.getBounds(), { padding: [40, 40] })
  }
}

function toggleLabels() {
  showLabels.value = !showLabels.value
  renderParcels()
}

// ---- Watchers ----
watch(
  () => props.parcels,
  () => {
    renderParcels()
    fitBoundsToParcels()
  },
  { deep: true }
)

watch(
  () => props.selectedParcelId,
  () => {
    if (geoJsonLayer) {
      geoJsonLayer.eachLayer((layer) => {
        if (layer.feature) {
          layer.setStyle(getParcelStyle(layer.feature))
        }
      })
    }
  }
)

// ---- Lifecycle ----
onMounted(() => {
  nextTick(() => {
    initMap()
    fitBoundsToParcels()
  })
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})

defineExpose({
  fitBounds: fitBoundsToParcels,
  switchBasemap,
  getMapInstance: () => map,
})
</script>

<style scoped>
.cadastral-map-wrapper {
  overflow: hidden;
  background-color: #f8f9fa;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.provider-dot {
  width: 8px;
  height: 8px;
  display: inline-block;
}

.legend-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  display: inline-block;
}

.legend-active {
  background-color: rgba(16, 185, 129, 0.4);
  border: 2px solid #10b981;
}

.legend-leased {
  background-color: rgba(59, 130, 246, 0.4);
  border: 2px solid #3b82f6;
}

.legend-reserved {
  background-color: rgba(245, 158, 11, 0.4);
  border: 2px solid #f59e0b;
}

.legend-disputed {
  background-color: rgba(239, 68, 68, 0.45);
  border: 2px dashed #ef4444;
}

.letter-spacing-1 {
  letter-spacing: 0.05rem;
}

.x-small {
  font-size: 0.75rem;
}

.hud-card {
  max-width: 250px;
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.cadastral-plot-tooltip) {
  background: rgba(15, 23, 42, 0.85);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 2px 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  font-size: 11px;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.15);
}

:deep(.leaflet-popup-content) {
  margin: 12px 14px;
}
</style>
