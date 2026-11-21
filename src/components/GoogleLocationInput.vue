<template>
  <div class="form-input-icon">
    <div class="position-relative">
      <input
        ref="autocompleteInput"
        :value="currentValue"
        type="text"
        class="form-control pe-5"
        :placeholder="placeholder"
        :disabled="disabled"
        spellcheck="false"
        autocomplete="off"
        @input="onInput"
        @focus="onFocus"
        @keydown.enter.prevent
      />
      <span class="mdi mdi-map-marker"></span>

      <!-- Clear (X) icon -->
      <i
        v-if="currentValue"
        class="position-absolute end-0 top-50 translate-middle-y me-3 text-muted cursor-pointer map-close clear-selection-map-input"
        style="cursor: pointer;"
        title="Clear address"
        @click="clearLocation"
      >
        <i class="mdi mdi-close" style="font-size: 16px;"></i>
      </i>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { loadGoogleMaps } from "@/utils/googleMaps.js";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  apiKey: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Search for Address or Place in Kenya",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "location-selected", "location-cleared"]);

const internalValue = ref(props.modelValue || "");

watch(
  () => props.modelValue,
  (newVal) => {
    internalValue.value = newVal || "";
  }
);

const currentValue = computed(() => internalValue.value);

const autocompleteInput = ref(null);
let autocomplete = null;
let placeChangedListener = null;

function onInput(event) {
  const val = event.target.value;
  internalValue.value = val;
  emit("update:modelValue", val);
}

function onFocus() {
  if (!autocomplete && window.google?.maps?.places) {
    initAutocomplete();
  }
}

const initAutocomplete = () => {
  const input = autocompleteInput.value;
  if (!input || !window.google?.maps?.places) return;

  if (placeChangedListener && window.google.maps.event) {
    window.google.maps.event.removeListener(placeChangedListener);
    placeChangedListener = null;
  }

  // Google Places Autocomplete - restricted to Kenya, matching all types (addresses, businesses, landmarks)
  autocomplete = new window.google.maps.places.Autocomplete(input, {
    fields: ["formatted_address", "geometry", "name", "address_components"],
    componentRestrictions: { country: "ke" },
  });

  placeChangedListener = autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();

    if (place && place.geometry) {
      const selectedText = input.value || place.formatted_address || place.name || "";
      internalValue.value = selectedText;
      emit("update:modelValue", selectedText);

      emit("location-selected", {
        location: selectedText,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        name: place.name,
        formatted_address: place.formatted_address,
        address_components: place.address_components,
        place,
      });
    }
  });
};

const clearLocation = () => {
  internalValue.value = "";
  emit("update:modelValue", "");
  emit("location-cleared");
};

// Global mousedown listener to prevent Bootstrap modal focus trap from closing pac dropdown
let mousedownHandler = null;

onMounted(async () => {
  mousedownHandler = (e) => {
    if (e.target && (e.target.classList?.contains("pac-item") || e.target.closest?.(".pac-container"))) {
      e.stopPropagation();
    }
  };
  window.addEventListener("mousedown", mousedownHandler, true);

  try {
    await loadGoogleMaps(props.apiKey);
    initAutocomplete();
  } catch (error) {
    console.warn("Failed to load Google Maps for location input:", error);
  }
});

onBeforeUnmount(() => {
  if (mousedownHandler) {
    window.removeEventListener("mousedown", mousedownHandler, true);
  }
  if (placeChangedListener && window.google?.maps?.event) {
    window.google.maps.event.removeListener(placeChangedListener);
  }
  autocomplete = null;
});

defineExpose({
  init: initAutocomplete,
});
</script>

<style scoped>
.form-input-icon {
  position: relative;
}
.mdi-map-marker {
  font-size: 1.2rem;
  color: #6c757d;
}
.map-close {
  right: 10px !important;
}
</style>

<!-- Non-scoped styles for Google Places dropdown appended to <body> -->
<style>
.pac-container {
  z-index: 100000 !important;
  pointer-events: auto !important;
  background-color: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08) !important;
  font-family: inherit !important;
  margin-top: 4px !important;
}

.pac-item {
  cursor: pointer !important;
  padding: 8px 14px !important;
  font-size: 13px !important;
  color: #1e293b !important;
  border-top: 1px solid #f1f5f9 !important;
  display: flex !important;
  align-items: center !important;
}

.pac-item:first-child {
  border-top: none !important;
}

.pac-item:hover,
.pac-item-selected {
  background-color: #f1f5f9 !important;
}

.pac-icon {
  margin-top: 0 !important;
  margin-right: 8px !important;
}

.pac-item-query {
  font-size: 13px !important;
  color: #0f172a !important;
  font-weight: 600 !important;
  padding-right: 4px !important;
}

.pac-matched {
  font-weight: 700 !important;
  color: #2b59ff !important;
}
</style>
