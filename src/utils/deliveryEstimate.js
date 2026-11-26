/**
 * Delivery distance & travel time estimator.
 *
 * Uses Google Maps DistanceMatrixService (DRIVING) when available on the key,
 * and falls back cleanly to a road-adjusted Haversine estimate (~1.32x road
 * factor at 24 km/h urban rider speed) so distance & ETA always render.
 */

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDuration(minutes) {
  const m = Math.max(1, Math.round(minutes));
  if (m < 60) return `${m} min${m === 1 ? '' : 's'}`;
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${hrs} hr${hrs === 1 ? '' : 's'}` : `${hrs} hr ${rem} min`;
}

function fallbackEstimate(origin, destination) {
  const straightKm = haversineKm(
    Number(origin.latitude),
    Number(origin.longitude),
    Number(destination.latitude),
    Number(destination.longitude)
  );
  // Urban road factor ~1.32x straight-line distance; average rider speed ~24 km/h
  const roadKm = Math.max(0.2, Math.round(straightKm * 1.32 * 10) / 10);
  const etaMinutes = Math.max(5, Math.round((roadKm / 24) * 60 + 3));
  return {
    distanceText: `~${roadKm.toFixed(1)} km`,
    durationText: `~${formatDuration(etaMinutes)}`,
    distanceKm: roadKm,
    durationMinutes: etaMinutes,
    source: 'estimate',
  };
}

/**
 * Resolve active branch origin coordinates from shiftStore.
 * Checks candidate branches in priority order and picks the first one that
 * actually carries valid GPS coordinates (since activeShift.branch often only
 * includes { id, name } without latitude/longitude).
 */
export function resolveBranchOrigin(shiftStore) {
  const branches = Array.isArray(shiftStore?.branches) ? shiftStore.branches : [];
  const activeBranchId = shiftStore?.activeShift?.branch_id ?? shiftStore?.activeShift?.branch?.id;
  const selectedBranchId = shiftStore?.selectedBranchId;

  const candidates = [
    shiftStore?.activeShift?.branch,
    activeBranchId != null ? branches.find((b) => String(b.id) === String(activeBranchId)) : null,
    selectedBranchId != null ? branches.find((b) => String(b.id) === String(selectedBranchId)) : null,
    branches.find((b) => b.is_main),
    ...branches,
  ].filter(Boolean);

  for (const branch of candidates) {
    const lat = Number(branch.latitude);
    const lng = Number(branch.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
      return {
        latitude: lat,
        longitude: lng,
        name: branch.name || 'Branch',
      };
    }
  }

  return null;
}

/**
 * Compute driving distance and ETA between origin and destination.
 */
export async function calculateDeliveryEstimate(origin, destination) {
  if (
    !origin?.latitude ||
    !origin?.longitude ||
    !destination?.latitude ||
    !destination?.longitude
  ) {
    return null;
  }

  // Try Google Maps Distance Matrix first if loaded
  if (typeof window !== 'undefined' && window.google?.maps?.DistanceMatrixService) {
    try {
      const result = await new Promise((resolve) => {
        const service = new window.google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [{ lat: Number(origin.latitude), lng: Number(origin.longitude) }],
            destinations: [{ lat: Number(destination.latitude), lng: Number(destination.longitude) }],
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.METRIC,
          },
          (response, status) => {
            if (status === 'OK') {
              const el = response?.rows?.[0]?.elements?.[0];
              if (el?.status === 'OK' && el.distance && el.duration) {
                resolve({
                  distanceText: el.distance.text,
                  durationText: el.duration.text,
                  distanceKm: Math.round((el.distance.value / 1000) * 10) / 10,
                  durationMinutes: Math.max(1, Math.round(el.duration.value / 60)),
                  source: 'google',
                });
                return;
              }
            }
            resolve(null);
          }
        );
      });

      if (result) return result;
    } catch {
      // Fall through to Haversine estimate
    }
  }

  return fallbackEstimate(origin, destination);
}
