<template>
  <div class="cadastral-viewer-container">
    <!-- Provider Switcher Bar (Useful for testing & alternating providers) -->
    <div
      v-if="allowProviderSwitch"
      class="provider-switch-header d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded-3 border"
    >
      <div class="d-flex align-items-center gap-2">
        <div class="avatar-xs flex-shrink-0">
          <span class="avatar-title rounded-circle bg-primary bg-soft text-primary fs-5">
            <i class="mdi mdi-layers-triple"></i>
          </span>
        </div>
        <span class="fw-semibold small text-dark">Map Engine Provider:</span>
        <div class="btn-group btn-group-sm">
          <button
            type="button"
            class="btn btn-sm waves-effect"
            :class="selectedProvider === 'leaflet' ? 'btn-primary text-white fw-semibold' : 'btn-outline-secondary'"
            @click="switchProvider('leaflet')"
          >
            <i class="mdi mdi-leaf me-1"></i> Leaflet.js
          </button>
          <button
            type="button"
            class="btn btn-sm waves-effect"
            :class="selectedProvider === 'mapbox' ? 'btn-primary text-white fw-semibold' : 'btn-outline-secondary'"
            :disabled="!isProviderReady('mapbox')"
            :title="isProviderReady('mapbox') ? 'Switch to Mapbox GL' : 'Mapbox provider component coming next'"
            @click="switchProvider('mapbox')"
          >
            <i class="mdi mdi-map-marker-path me-1"></i> Mapbox GL
          </button>
          <button
            type="button"
            class="btn btn-sm waves-effect"
            :class="selectedProvider === 'esri' ? 'btn-primary text-white fw-semibold' : 'btn-outline-secondary'"
            :disabled="!isProviderReady('esri')"
            :title="isProviderReady('esri') ? 'Switch to ArcGIS/Esri' : 'Esri provider component coming next'"
            @click="switchProvider('esri')"
          >
            <i class="mdi mdi-earth me-1"></i> Esri / ArcGIS
          </button>
          <button
            type="button"
            class="btn btn-sm waves-effect"
            :class="selectedProvider === 'here' ? 'btn-primary text-white fw-semibold' : 'btn-outline-secondary'"
            :disabled="!isProviderReady('here')"
            :title="isProviderReady('here') ? 'Switch to HERE Platform' : 'HERE provider component coming next'"
            @click="switchProvider('here')"
          >
            <i class="mdi mdi-compass-outline me-1"></i> HERE Platform
          </button>
        </div>
      </div>

      <div class="small text-muted d-none d-md-block">
        Comparing engines for PaySol Cadastral Registry
      </div>
    </div>

    <!-- Active Provider Component View -->
    <div class="map-view-body position-relative">
      <component
        :is="activeComponent"
        v-if="activeComponent"
        ref="activeMapRef"
        :parcels="parcels"
        :selected-parcel-id="selectedParcelId"
        :center="center"
        :zoom="zoom"
        :height="height"
        :default-basemap="defaultBasemap"
        :interactive="interactive"
        @parcel-selected="handleParcelSelected"
        @parcel-hover="handleParcelHover"
        @map-clicked="handleMapClicked"
        @basemap-changed="handleBasemapChanged"
      />

      <div v-else class="p-5 text-center text-muted bg-light rounded-3 border">
        <i class="mdi mdi-alert-circle-outline fs-1 text-warning mb-2"></i>
        <h5>Provider "{{ selectedProvider }}" is not loaded</h5>
        <p class="small">Please select Leaflet.js or configure the API key for this provider.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// -----------------------------------------------------------------------------
// CadastralMapViewer.vue — Cadastral Engine Orchestrator & Switcher
//
// Allows testing, comparing, and alternating across multiple map providers
// (Leaflet, Mapbox, Esri, HERE, Google) through a unified API and prop interface.
// -----------------------------------------------------------------------------
import { ref, computed } from "vue"
import LeafletCadastralMap from "./LeafletCadastralMap.vue"
import { defaultCadastralCenter, defaultCadastralZoom } from "./demo/mockCadastralData.js"

const props = defineProps({
  provider: {
    type: String,
    default: "leaflet", // 'leaflet' | 'mapbox' | 'esri' | 'here' | 'google'
  },
  allowProviderSwitch: {
    type: Boolean,
    default: true,
  },
  parcels: {
    type: Object,
    default: null,
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
    default: "satellite",
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
  "provider-changed",
])

const selectedProvider = ref(props.provider)
const activeMapRef = ref(null)

// ---- Provider Registry ----
const providerComponents = {
  leaflet: LeafletCadastralMap,
  // Future providers will be registered here as created:
  // mapbox: MapboxCadastralMap,
  // esri: EsriCadastralMap,
  // here: HereCadastralMap,
  // google: GoogleCadastralMap,
}

const activeComponent = computed(() => {
  return providerComponents[selectedProvider.value] || null
})

function isProviderReady(providerKey) {
  return !!providerComponents[providerKey]
}

function switchProvider(providerKey) {
  if (isProviderReady(providerKey)) {
    selectedProvider.value = providerKey
    emit("provider-changed", providerKey)
  }
}

function handleParcelSelected(parcel) {
  emit("parcel-selected", parcel)
}

function handleParcelHover(parcel) {
  emit("parcel-hover", parcel)
}

function handleMapClicked(coords) {
  emit("map-clicked", coords)
}

function handleBasemapChanged(basemap) {
  emit("basemap-changed", basemap)
}

defineExpose({
  switchProvider,
  getActiveMap: () => activeMapRef.value,
  fitBounds: () => activeMapRef.value?.fitBounds?.(),
})
</script>

<style scoped>
.cadastral-viewer-container {
  width: 100%;
}
</style>
