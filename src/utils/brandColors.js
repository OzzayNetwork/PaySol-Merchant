// ---------------------------------------------------------------
// Brand colour helpers: read a palette out of a logo, and check whether
// white text is readable on a colour.
//
// Used by the Onboard screen: once a business's logo is picked, its main
// colours are offered as swatches for the primary and accent colours.
// Everything runs in the browser on a small canvas; nothing is uploaded.
// ---------------------------------------------------------------

/** Two-digit hex for one 0–255 channel. */
const hex2 = (n) => n.toString(16).padStart(2, '0')

/** [r, g, b] -> "#RRGGBB" */
export const rgbToHex = ([r, g, b]) => `#${hex2(r)}${hex2(g)}${hex2(b)}`.toUpperCase()

/** "#RRGGBB" -> [r, g, b] (null for anything else) */
export function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim())
    if (!m) return null
    const n = parseInt(m[1], 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** WCAG relative luminance of an [r, g, b] colour. */
function luminance([r, g, b]) {
    const lin = (c) => {
        const s = c / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/**
 * Contrast ratio between a colour and white, 1 to 21. Buttons put white
 * text on the primary colour, and text needs at least 4.5 to be readable.
 */
export function contrastWithWhite(hex) {
    const rgb = hexToRgb(hex)
    if (!rgb) return null
    return 1.05 / (luminance(rgb) + 0.05)
}

/** Rough saturation (0–1): grey has none, a strong red has lots. */
function saturation([r, g, b]) {
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    return max === 0 ? 0 : (max - min) / max
}

/** Straight-line distance between two colours, 0 to ~441. */
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/**
 * The main colours in an image, most useful first.
 *
 * The logo is shrunk to 64×64, transparent pixels and near-white background
 * are skipped, and the rest are grouped into buckets of similar colours.
 * Buckets are ranked by how much of the logo they cover, with a lift for
 * strong colours so a red mark beats a large grey outline, then colours too
 * close to one already chosen are dropped.
 *
 * @param {string} src   image URL or data URL
 * @param {number} count how many colours to return
 * @returns {Promise<string[]>} "#RRGGBB" values
 */
export function extractPalette(src, count = 6) {
    return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
            try {
                const size = 64
                const canvas = document.createElement('canvas')
                canvas.width = size
                canvas.height = size
                const ctx = canvas.getContext('2d', { willReadFrequently: true })
                ctx.drawImage(img, 0, 0, size, size)
                const { data } = ctx.getImageData(0, 0, size, size)

                // Bucket by 4 bits per channel (4,096 buckets), keeping each
                // bucket's running total so its colour is a true average.
                const buckets = new Map()
                for (let i = 0; i < data.length; i += 4) {
                    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
                    if (a < 128) continue                              // transparent
                    if (r > 240 && g > 240 && b > 240) continue        // white background
                    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
                    const bucket = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 }
                    bucket.n += 1
                    bucket.r += r
                    bucket.g += g
                    bucket.b += b
                    buckets.set(key, bucket)
                }

                const ranked = [...buckets.values()]
                    .map((bk) => {
                        const rgb = [Math.round(bk.r / bk.n), Math.round(bk.g / bk.n), Math.round(bk.b / bk.n)]
                        return { rgb, score: bk.n * (0.4 + saturation(rgb)) }
                    })
                    .sort((a, b) => b.score - a.score)

                // Keep colours that are clearly different from each other.
                const picked = []
                for (const c of ranked) {
                    if (picked.every((p) => distance(p, c.rgb) > 60)) picked.push(c.rgb)
                    if (picked.length === count) break
                }

                resolve(picked.map(rgbToHex))
            } catch (error) {
                // A tainted canvas or an odd image: no suggestions, the agent
                // can still type or pick colours by hand.
                console.error('Error reading colours from the logo:', error)
                resolve([])
            }
        }
        img.onerror = () => resolve([])
        img.src = src
    })
}

/**
 * A data URL (what ImageUploader emits after cropping) as a File, so it can
 * go in a FormData upload. Same conversion the Logo Assets page does.
 */
export function dataUrlToFile(dataUrl, name = 'logo') {
    const [head, body] = String(dataUrl).split(',')
    const mime = /data:(.*?);/.exec(head)?.[1] || 'image/png'
    const bytes = atob(body)
    const buffer = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i)
    const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
    return new File([buffer], `${name}.${ext}`, { type: mime })
}
