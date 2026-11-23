<template>
  <div v-if="hasCoordinates" class="position-relative overflow-hidden rounded-3 border border-light-subtle my-2">
    <!-- Map Canvas Mount -->
    <div ref="mapEl" class="esri-map-container" :style="{ height }"></div>

    <!-- Location Pill Badge Overlay -->
    <div
      v-if="label || (latitude && longitude)"
      class="position-absolute bottom-0 start-0 m-2 px-2 py-1 bg-white bg-opacity-90 rounded shadow-sm font-size-11 font-monospace text-dark d-flex align-items-center gap-1 border border-light-subtle"
      style="z-index: 1000;"
    >
      <i class="bx bxs-map text-primary"></i>
      <span class="fw-semibold">{{ label || `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}` }}</span>
    </div>

    <!-- Esri Badge -->
    <div
      class="position-absolute top-0 end-0 m-2 px-1.5 py-0.5 bg-white bg-opacity-90 rounded font-size-10 text-muted border border-light-subtle"
      style="z-index: 1000;"
    >
      Esri Map
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  latitude: { type: [Number, String], default: null },
  longitude: { type: [Number, String], default: null },
  label: { type: String, default: '' },
  height: { type: String, default: '180px' },
  zoom: { type: Number, default: 15 },
});

const mapEl = ref(null);
let leafletMap = null;
let markerLayer = null;

const hasCoordinates = computed(() => {
  const lat = Number(props.latitude);
  const lng = Number(props.longitude);
  return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
});

const renderMap = () => {
  if (!mapEl.value || !hasCoordinates.value) return;

  const lat = Number(props.latitude);
  const lng = Number(props.longitude);

  if (!leafletMap) {
    leafletMap = L.map(mapEl.value, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    // Esri World Light Gray Base tile layer (fast, clean, high-resolution)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 }
    ).addTo(leafletMap);

    // Esri Reference labels
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 }
    ).addTo(leafletMap);

    markerLayer = L.layerGroup().addTo(leafletMap);
  }

  leafletMap.invalidateSize({ animate: false });
  markerLayer.clearLayers();

  // Pin marker icon
  const pinIcon = L.divIcon({
    className: 'esri-pin-icon',
    html: `
      <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
        <i class="bx bxs-map text-primary" style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));"></i>
      </div>
    `,
    iconSize: [0, 0],
  });

  const marker = L.marker([lat, lng], { icon: pinIcon }).addTo(markerLayer);

  // Subtle radius pulse ring
  L.circleMarker([lat, lng], {
    radius: 10,
    color: '#2b59ff',
    weight: 1.5,
    fillColor: '#2b59ff',
    fillOpacity: 0.15,
  }).addTo(markerLayer);

  if (props.label) {
    marker.bindTooltip(props.label, {
      permanent: false,
      direction: 'top',
      offset: [0, -28],
    });
  }

  leafletMap.setView([lat, lng], props.zoom);
};

watch(
  () => [props.latitude, props.longitude],
  () => {
    nextTick(() => {
      setTimeout(renderMap, 100);
    });
  }
);

onMounted(() => {
  nextTick(() => {
    setTimeout(renderMap, 200);
  });
});

onBeforeUnmount(() => {
  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
  }
});
</script>

<style scoped>
.esri-map-container {
  width: 100%;
  background: #f8f9fa;
  pointer-events: none; /* Prevents scroll zoom or dragging completely */
}
</style>
