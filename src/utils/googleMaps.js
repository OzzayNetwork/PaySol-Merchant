// ---------------------------------------------------------------
// Load the Google Maps JavaScript API once per page.
//
// Same script tag (id "google-maps-script") and libraries as
// components/GoogleLocationInput.vue, so a page that uses both the search
// box and a map loads Google once, whichever of the two mounts first.
// The key comes dynamically from the tenant / global settings in DB,
// falling back to VITE_GOOGLE_MAPS_API_KEY (.env).
// ---------------------------------------------------------------

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

/**
 * Resolves with window.google once the Maps API (with places + geometry) is
 * ready. Rejects if the script fails to load, so the caller can show a
 * "map unavailable" note instead of a blank box.
 */
export function loadGoogleMaps(apiKey = null) {
    let key = apiKey
    if (!key) {
        try {
            const rawSession = localStorage.getItem('psSession') || sessionStorage.getItem('psSession')
            if (rawSession) {
                const parsed = JSON.parse(rawSession)
                if (parsed.tenant?.maps_api_key) {
                    key = parsed.tenant.maps_api_key
                }
            }
        } catch (e) {
            // Ignore parse errors and fall back to env key
        }
    }
    if (!key) {
        key = GOOGLE_MAPS_API_KEY
    }

    return new Promise((resolve, reject) => {
        // Already loaded (another component got there first)
        if (window.google?.maps?.places) {
            resolve(window.google)
            return
        }

        // Loading: wait for the same tag rather than adding a second one
        const existing = document.querySelector('#google-maps-script')
        if (existing) {
            existing.addEventListener('load', () => resolve(window.google))
            existing.addEventListener('error', reject)
            return
        }

        const script = document.createElement('script')
        script.id = 'google-maps-script'
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry`
        script.async = true
        script.defer = true
        script.onload = () => resolve(window.google)
        script.onerror = reject
        document.head.appendChild(script)
    })
}
