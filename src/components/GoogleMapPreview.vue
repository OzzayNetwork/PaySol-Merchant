<template>
  <div v-if="mapUrl" class="position-relative my-2">
    <!-- Loader Overlay -->
    <div
      v-if="mapLoading"
      class="d-flex align-items-center justify-content-center"
      style="position: absolute; inset: 0; background: rgba(255,255,255,0.7); z-index: 10; border-radius: 8px;"
    >
      <div class="spinner-border text-primary spinner-border-sm" role="status">
        <span class="visually-hidden">Loading map...</span>
      </div>
    </div>

    <!-- Google Map iframe (non-zoomable with pointer-events: none matching gallery.add.vue) -->
    <iframe
      :src="mapUrl"
      width="100%"
      :height="height"
      style="border: 2px solid rgb(229, 231, 235); border-radius: 8px; overflow: hidden; pointer-events: none; display: block;"
      allowfullscreen=""
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      @load="mapLoaded"
    ></iframe>

    <!-- Location Pill Badge Overlay -->
    <div
      v-if="label || (latitude && longitude)"
      class="position-absolute bottom-0 start-0 m-2 px-2 py-1 bg-white bg-opacity-90 rounded shadow-sm font-size-11 font-monospace text-dark d-flex align-items-center gap-1 border border-light-subtle"
      style="z-index: 5;"
    >
      <i class="bx bxs-map-pin text-danger"></i>
      <span class="fw-semibold">{{ label || `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}` }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  latitude: { type: [Number, String], default: null },
  longitude: { type: [Number, String], default: null },
  label: { type: String, default: '' },
  height: { type: [Number, String], default: '180' },
  zoom: { type: Number, default: 15 },
});

const mapLoading = ref(false);

const mapLoaded = () => {
  mapLoading.value = false;
};

const mapUrl = computed(() => {
  const lat = Number(props.latitude);
  const lng = Number(props.longitude);
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) return '';
  return `https://www.google.com/maps?q=${lat},${lng}&z=${props.zoom}&output=embed`;
});

watch(
  () => [props.latitude, props.longitude],
  ([lat, lng]) => {
    if (lat && lng) {
      mapLoading.value = true;
    }
  },
  { immediate: true }
);
</script>
