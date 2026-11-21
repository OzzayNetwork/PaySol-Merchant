// ---------------------------------------------------------------
// Product helpers (12 Nov 2026): "Sold by" units, VAT choices, pack names and
// where a lookup's details came from. Shared by Products.Add, Products.List
// and Barcode.Lookup. Words follow the API (ProductController).
// ---------------------------------------------------------------

// "Sold by": stock is counted in this unit
export const UNITS = [
    { key: 'piece', label: 'Piece', short: 'pc', icon: 'ri:checkbox-blank-line' },
    { key: 'kg', label: 'Kilo', short: 'kg', icon: 'ri:scales-3-line' },
    { key: 'litre', label: 'Litre', short: 'L', icon: 'ri:drop-line' },
    { key: 'metre', label: 'Metre', short: 'm', icon: 'ri:ruler-line' },
]
export const unitShort = (key) => UNITS.find((u) => u.key === key)?.short || 'pc'

// VAT (KRA's classes). Prices are VAT-inclusive (Proposed, 28 Oct)
export const VAT_TYPES = [
    { key: 'standard_16', label: '16% VAT', rate: 0.16 },
    { key: 'zero_rated', label: 'Zero rated', rate: 0 },
    { key: 'exempt', label: 'Exempt', rate: 0 },
]
// The VAT inside a VAT-inclusive price
export function vatInside(price, vatType) {
    const rate = VAT_TYPES.find((v) => v.key === vatType)?.rate || 0
    const p = Number(price) || 0
    return rate ? Math.round((p - p / (1 + rate)) * 100) / 100 : 0
}

// The quick names for a pack (Kaunta POS's chips); any name is allowed
export const PACK_NAMES = ['Box', 'Carton', 'Dozen', 'Bale', 'Crate']
// A sensible starting size for each
export const PACK_DEFAULT_UNITS = { Box: 12, Carton: 24, Dozen: 12, Bale: 10, Crate: 24 }

// Where the details came from (the lookup's `source`)
export const SOURCE_META = {
    shop: { label: 'Already in your shop', icon: 'mdi:alert-circle-outline', tone: 'warning' },
    catalogue: { label: 'PaySol catalogue', icon: 'mdi:check-decagram', tone: 'primary' },
    openfoodfacts: { label: 'Open Food Facts', icon: 'mdi:cloud-check', tone: 'info' },
    openproductsfacts: { label: 'Open Products Facts', icon: 'mdi:cloud-check', tone: 'info' },
    openbeautyfacts: { label: 'Open Beauty Facts', icon: 'mdi:cloud-check', tone: 'info' },
    openpetfoodfacts: { label: 'Open Pet Food Facts', icon: 'mdi:cloud-check', tone: 'info' },
    none: { label: 'Not found', icon: 'mdi:magnify-scan', tone: 'secondary' },
    manual: { label: 'Typed in', icon: 'mdi:pencil-outline', tone: 'secondary' },
}

// The steps the lookup goes through, as the person sees them
export const LOOKUP_STEPS = [
    { key: 'shop', label: 'Your shop' },
    { key: 'catalogue', label: 'PaySol catalogue' },
    { key: 'open', label: 'Open Food Facts' },
]

export const money = (n) => (n === null || n === undefined || n === '' ? '—' : `KSh ${Number(n).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`)
