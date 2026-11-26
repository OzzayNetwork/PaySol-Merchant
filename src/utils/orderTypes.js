/**
 * Dynamic Order / Service Type configuration keyed by tenant `business_type`.
 *
 * Maps all 12 PaySol BusinessType keys (bar, restaurant, salon_and_barber,
 * spa_and_wellness, car_wash, turf, wines_and_spirits, butchery, clothes_shop,
 * pharmacy, electronics, supermarket) to industry-appropriate labels, icons,
 * canonical fulfilment methods, and in-premises fields.
 */

const PROFILES = {
  hospitality: {
    sectionTitle: 'Order & Bill Details',
    fieldTitle: 'Order Type',
    defaultType: 'dine_in',
    options: [
      {
        key: 'dine_in',
        label: 'Dine-In',
        icon: 'ri:restaurant-line',
        fulfilment: 'dine_in',
        usesTables: true,
        usesGuests: true,
      },
      {
        key: 'counter',
        label: 'Counter Sale',
        icon: 'ri:store-2-line',
        fulfilment: 'takeaway',
      },
      {
        key: 'takeaway',
        label: 'Takeaway',
        icon: 'ri:shopping-bag-3-line',
        fulfilment: 'takeaway',
      },
      {
        key: 'delivery',
        label: 'Delivery',
        icon: 'ri:e-bike-2-line',
        fulfilment: 'delivery',
        usesDelivery: true,
        deliveryLabel: 'Delivery Location',
      },
    ],
  },

  salon_spa: {
    sectionTitle: 'Service & Bill Details',
    fieldTitle: 'Service Type',
    defaultType: 'in_premises',
    options: [
      {
        key: 'in_premises',
        label: 'In-Premises',
        icon: 'ri:scissors-cut-line',
        fulfilment: 'dine_in',
        usesStation: true,
        stationLabel: 'Chair / Room',
        stationPlaceholder: 'e.g. Chair 2, Room A',
        attendantLabel: 'Stylist / Therapist',
        attendantPlaceholder: 'Optional',
      },
      {
        key: 'counter',
        label: 'Counter / Retail',
        icon: 'ri:store-2-line',
        fulfilment: 'takeaway',
      },
      {
        key: 'home_service',
        label: 'Home Service',
        icon: 'ri:home-smile-line',
        fulfilment: 'delivery',
        usesDelivery: true,
        deliveryLabel: 'Client Service Location',
      },
      {
        key: 'delivery',
        label: 'Product Delivery',
        icon: 'ri:e-bike-2-line',
        fulfilment: 'delivery',
        usesDelivery: true,
        deliveryLabel: 'Delivery Location',
      },
    ],
  },

  car_wash: {
    sectionTitle: 'Service & Bill Details',
    fieldTitle: 'Service Type',
    defaultType: 'in_bay',
    options: [
      {
        key: 'in_bay',
        label: 'In-Bay Service',
        icon: 'ri:car-washing-line',
        fulfilment: 'dine_in',
        usesStation: true,
        stationLabel: 'Vehicle Reg / Bay',
        stationPlaceholder: 'e.g. KDK 123A · Bay 2',
        attendantLabel: 'Attendant',
        attendantPlaceholder: 'Optional',
      },
      {
        key: 'drop_off',
        label: 'Drop-Off',
        icon: 'ri:key-2-line',
        fulfilment: 'dine_in',
        usesStation: true,
        stationLabel: 'Vehicle Reg',
        stationPlaceholder: 'e.g. KDK 123A',
        attendantLabel: 'Attendant',
        attendantPlaceholder: 'Optional',
      },
      {
        key: 'counter',
        label: 'Counter Sale',
        icon: 'ri:store-2-line',
        fulfilment: 'takeaway',
      },
      {
        key: 'mobile_service',
        label: 'Mobile Wash',
        icon: 'ri:e-bike-2-line',
        fulfilment: 'delivery',
        usesDelivery: true,
        deliveryLabel: 'Service Location',
      },
    ],
  },

  turf: {
    sectionTitle: 'Booking & Bill Details',
    fieldTitle: 'Session Type',
    defaultType: 'on_pitch',
    options: [
      {
        key: 'on_pitch',
        label: 'On-Pitch / Slot',
        icon: 'ri:football-line',
        fulfilment: 'dine_in',
        usesStation: true,
        stationLabel: 'Pitch / Court',
        stationPlaceholder: 'e.g. Pitch 1 (6–7 PM)',
        attendantLabel: 'Team / Players',
        attendantPlaceholder: 'e.g. 10 players',
      },
      {
        key: 'counter',
        label: 'Counter / Refreshments',
        icon: 'ri:store-2-line',
        fulfilment: 'takeaway',
      },
      {
        key: 'delivery',
        label: 'Delivery',
        icon: 'ri:e-bike-2-line',
        fulfilment: 'delivery',
        usesDelivery: true,
        deliveryLabel: 'Delivery Location',
      },
    ],
  },

  retail: {
    sectionTitle: 'Order & Bill Details',
    fieldTitle: 'Order Type',
    defaultType: 'counter',
    options: [
      {
        key: 'counter',
        label: 'Counter Sale',
        icon: 'ri:store-2-line',
        fulfilment: 'takeaway',
      },
      {
        key: 'pickup',
        label: 'Pick Up Later',
        icon: 'ri:shopping-bag-3-line',
        fulfilment: 'takeaway',
      },
      {
        key: 'in_premises',
        label: 'In-Premises',
        icon: 'ri:goblet-line',
        fulfilment: 'dine_in',
        usesTables: true,
        usesGuests: true,
      },
      {
        key: 'delivery',
        label: 'Delivery',
        icon: 'ri:e-bike-2-line',
        fulfilment: 'delivery',
        usesDelivery: true,
        deliveryLabel: 'Delivery Location',
      },
    ],
  },
};

/**
 * Resolve the business_type key (string or { key } object) to a profile.
 */
export function resolveOrderTypeProfile(businessType) {
  const raw =
    typeof businessType === 'string'
      ? businessType
      : businessType?.key || businessType?.slug || '';
  const key = String(raw).trim().toLowerCase().replace(/-/g, '_');

  if (['bar', 'restaurant', 'cafe', 'hotel', 'lounge', 'pub', 'club'].includes(key)) {
    return PROFILES.hospitality;
  }
  if (['salon_and_barber', 'spa_and_wellness', 'salon', 'barber', 'spa'].includes(key)) {
    return PROFILES.salon_spa;
  }
  if (['car_wash', 'auto_garage', 'garage'].includes(key)) {
    return PROFILES.car_wash;
  }
  if (['turf', 'sports_venue', 'gym'].includes(key)) {
    return PROFILES.turf;
  }
  if (
    [
      'wines_and_spirits',
      'butchery',
      'clothes_shop',
      'pharmacy',
      'electronics',
      'supermarket',
      'retail',
      'hardware',
    ].includes(key)
  ) {
    return PROFILES.retail;
  }

  // Sensible default for unknown/unset business types
  return PROFILES.hospitality;
}
