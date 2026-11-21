<script setup>
// ---------------------------------------------------------------
// Address search and map comparison for the component reference page.
//
// Search uses the existing Google Places input (Google API key; no backend
// endpoint or permission). The picked coordinates center both map engines.
// Based on the onboarding map flow, GoogleLocationInput, and Leaflet maps.
// ---------------------------------------------------------------

import { onBeforeUnmount, onMounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Components
import GoogleLocationInput from '@/components/GoogleLocationInput.vue'

// Utils
import { GOOGLE_MAPS_API_KEY, loadGoogleMaps } from '@/utils/googleMaps.js'

// Page state
const googleMapElement = ref(null)
const leafletMapElement = ref(null)
const googleMapError = ref('')
const selectedPlace = ref('Nairobi CBD sample location')
const selectedCoordinates = ref({ lat: -1.286389, lng: 36.817223 })

// Map instances
let googleMap = null
let googleMarker = null
let googleClickListener = null
let leafletMap = null
let leafletMarker = null

// ---- Map initialization ----
onMounted(() => {
    initLeafletMap()
    initGoogleMap()
})

function initLeafletMap() {
    if (!leafletMapElement.value) return

    leafletMap = L.map(leafletMapElement.value, { scrollWheelZoom: false })
        .setView([selectedCoordinates.value.lat, selectedCoordinates.value.lng], 12)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
    }).addTo(leafletMap)

    leafletMarker = L.circleMarker([selectedCoordinates.value.lat, selectedCoordinates.value.lng], {
        radius: 8,
        color: '#fff',
        weight: 3,
        fillColor: '#2164f3',
        fillOpacity: 1,
    }).addTo(leafletMap)

    leafletMap.on('click', (event) => setSelectedPoint(event.latlng.lat, event.latlng.lng, 'Picked on Leaflet map'))
}

async function initGoogleMap() {
    if (!googleMapElement.value) return
    if (!GOOGLE_MAPS_API_KEY) {
        googleMapError.value = 'Set VITE_GOOGLE_MAPS_API_KEY to enable Google Places search and the Google map.'
        return
    }

    try {
        const google = await loadGoogleMaps()
        if (!googleMapElement.value) return

        googleMap = new google.maps.Map(googleMapElement.value, {
            center: selectedCoordinates.value,
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        })
        googleMarker = new google.maps.Marker({
            map: googleMap,
            position: selectedCoordinates.value,
            title: selectedPlace.value,
        })
        googleClickListener = googleMap.addListener('click', (event) => {
            if (event.latLng) setSelectedPoint(event.latLng.lat(), event.latLng.lng(), 'Picked on Google map')
        })
    } catch (error) {
        console.error('Error loading the Google reference map:', error)
        googleMapError.value = 'Google Maps could not load. The Leaflet map is still available.'
    }
}

// ---- Address selection and synchronized map pins ----
function onPlaceSelected(place) {
    setSelectedPoint(Number(place.latitude), Number(place.longitude), place.location)
}

function onPlaceCleared() {
    setSelectedPoint(-1.286389, 36.817223, 'Nairobi CBD sample location')
}

function setSelectedPoint(lat, lng, label) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    selectedCoordinates.value = { lat, lng }
    selectedPlace.value = label || 'Selected location'
    leafletMarker?.setLatLng([lat, lng])
    leafletMap?.setView([lat, lng], 16)
    googleMarker?.setPosition({ lat, lng })
    googleMarker?.setTitle(selectedPlace.value)
    googleMap?.panTo({ lat, lng })
    googleMap?.setZoom(16)
}

// ---- Cleanup ----
onBeforeUnmount(() => {
    leafletMap?.remove()
    if (googleClickListener) window.google?.maps?.event?.removeListener(googleClickListener)
})
</script>

<template>
    <section class="card">
        <div class="card-header">
            <h2 class="h5 mb-1">Address search with Google Maps and Leaflet</h2>
            <p class="text-muted small mb-0">Choose an address once; the pin and map center stay synchronized in both map engines.</p>
        </div>
        <div class="card-body">
            <!-- Address search: Google Places returns a label and coordinates to center both maps. -->
            <div v-if="GOOGLE_MAPS_API_KEY" class="mb-3">
                <label class="form-label" for="reference-map-address">Address or place</label>
                <GoogleLocationInput
                    id="reference-map-address"
                    :api-key="GOOGLE_MAPS_API_KEY"
                    @location-selected="onPlaceSelected"
                    @location-cleared="onPlaceCleared"
                />
            </div>
            <div v-else class="alert alert-warning py-2 small" role="status">
                Google Places search needs <code>VITE_GOOGLE_MAPS_API_KEY</code>. Leaflet remains available below.
            </div>

            <div class="row g-3">
                <!-- Google map: address search and map clicks both update the shared point. -->
                <div class="col-12 col-xl-6">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h3 class="h6 mb-0">Google Maps</h3>
                        <span class="badge bg-primary-subtle text-primary">Places search</span>
                    </div>
                    <div class="reference-map-frame">
                        <div v-if="googleMapError" class="h-100 d-flex align-items-center justify-content-center text-center text-muted p-3 small">
                            {{ googleMapError }}
                        </div>
                        <div v-else ref="googleMapElement" class="w-100 h-100"></div>
                    </div>
                </div>

                <!-- Leaflet map: open map tiles, synchronized with the same selected coordinates. -->
                <div class="col-12 col-xl-6">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h3 class="h6 mb-0">Leaflet.js</h3>
                        <span class="badge bg-success-subtle text-success">OpenStreetMap tiles</span>
                    </div>
                    <div ref="leafletMapElement" class="reference-map-frame"></div>
                </div>
            </div>

            <!-- Selected location: show the exact coordinates shared by both maps. -->
            <div class="d-flex flex-wrap justify-content-between gap-2 align-items-center border-top mt-3 pt-3 small">
                <span class="fw-semibold text-dark text-break">{{ selectedPlace }}</span>
                <span class="font-monospace text-muted">{{ selectedCoordinates.lat.toFixed(6) }}, {{ selectedCoordinates.lng.toFixed(6) }}</span>
            </div>
            <p class="text-muted small mt-2 mb-0">
                Source components: <code>GoogleLocationInput.vue</code> and Leaflet.js. Map clicks move the same pin in both panels.
            </p>
        </div>
    </section>
</template>

<style scoped>
.reference-map-frame {
    height: 300px;
    overflow: hidden;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.5rem;
    background: var(--bs-light);
}

@media (max-width: 575.98px) {
    .reference-map-frame { height: 240px; }
}
</style>
