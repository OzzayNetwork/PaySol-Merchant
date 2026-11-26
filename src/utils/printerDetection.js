/**
 * PaySol POS Printer Type Detection & Format Resolver.
 *
 * Supports:
 *  - 'thermal_58' : 58mm (2-inch) narrow thermal receipt roll
 *  - 'thermal_80' : 80mm (3-inch) standard desktop thermal receipt roll
 *  - 'a4'         : A4 (210mm x 297mm) commercial receipt sheet
 */

const STORAGE_KEY = "paysol_pos_printer_type";

// Common ESC/POS thermal receipt printer USB Vendor IDs
const KNOWN_THERMAL_VENDORS = new Set([
  0x04b8, // Epson (TM-T20, TM-T88, TM-m30)
  0x0519, // Star Micronics (TSP100, TSP650)
  0x1504, // Bixolon (SRP-350, SPP-R200)
  0x1d90, // Citizen
  0x0416, // Winbond / Xprinter
  0x0483, // STMicroelectronics / Generic POS-58/80
  0x28e9, // GD32 / Mini 58mm thermal
  0x0fe6, // ICS Advent / Generic 58mm thermal
  0x6868, // Generic 58mm/80mm POS printer
  0x1fc9, // NXP / Rongta
  0x0dd4, // Custom Engineering
]);

export const PRINTER_PROFILES = {
  thermal_58: {
    key: "thermal_58",
    label: "Thermal 58mm",
    shortLabel: "58mm",
    paperLabel: "58mm Roll (2-inch)",
    icon: "ri:printer-line",
    pageCss: "@page { size: 58mm auto; margin: 0; }",
    contentWidth: "54mm",
    previewWidth: "252px",
  },
  thermal_80: {
    key: "thermal_80",
    label: "Thermal 80mm",
    shortLabel: "80mm",
    paperLabel: "80mm Roll (3-inch)",
    icon: "ri:printer-line",
    pageCss: "@page { size: 80mm auto; margin: 0; }",
    contentWidth: "74mm",
    previewWidth: "316px",
  },
  a4: {
    key: "a4",
    label: "A4 Printer",
    shortLabel: "A4",
    paperLabel: "A4 Sheet (210×297mm)",
    icon: "ri:file-text-line",
    pageCss: "@page { size: A4 portrait; margin: 12mm; }",
    contentWidth: "100%",
    previewWidth: "100%",
  },
};

export function normalizePrinterType(rawType, fallbackPaperWidth = "58mm") {
  if (rawType === "thermal_58" || rawType === "58mm") return "thermal_58";
  if (rawType === "thermal_80" || rawType === "80mm") return "thermal_80";
  if (rawType === "a4" || rawType === "A4") return "a4";
  return fallbackPaperWidth === "80mm" ? "thermal_80" : "thermal_58";
}

export function getSavedWorkstationPrinter() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && PRINTER_PROFILES[saved]) return saved;
  } catch {
    // ignore storage errors
  }
  return null;
}

export function saveWorkstationPrinter(printerType) {
  try {
    if (printerType && PRINTER_PROFILES[printerType]) {
      localStorage.setItem(STORAGE_KEY, printerType);
    }
  } catch {
    // ignore storage errors
  }
}

function classifyUsbDevice(device) {
  const name = `${device.manufacturerName || ""} ${device.productName || ""}`.trim();
  const lower = name.toLowerCase();
  const isKnownThermal =
    KNOWN_THERMAL_VENDORS.has(device.vendorId) ||
    /thermal|receipt|pos-?58|pos-?80|tm-t|tsp|xprinter|rongta|bixolon|epson/i.test(lower);

  if (!isKnownThermal) return null;

  if (/58|2.?inch|mini|r200|mtp-2/i.test(lower)) {
    return {
      printerType: "thermal_58",
      deviceName: name || "USB 58mm Thermal Printer",
    };
  }

  return {
    printerType: "thermal_80",
    deviceName: name || "USB 80mm Thermal Printer",
  };
}

/**
 * Detect active printer type using:
 *  1. Paired WebUSB thermal printer (if already permitted in Chrome/Edge)
 *  2. Workstation saved preference (localStorage)
 *  3. Business default printer setting (receipt.printer_type / receipt.paper_width)
 */
export async function detectActivePrinter(businessSettings = null) {
  // 1. Check already-paired WebUSB devices (silent, no prompt)
  if (typeof navigator !== "undefined" && navigator.usb?.getDevices) {
    try {
      const devices = await navigator.usb.getDevices();
      for (const dev of devices) {
        const match = classifyUsbDevice(dev);
        if (match) {
          return {
            printerType: match.printerType,
            source: "usb",
            sourceLabel: `Detected USB: ${match.deviceName}`,
          };
        }
      }
    } catch {
      // ignore WebUSB errors
    }
  }

  // 2. Workstation saved override
  const workstation = getSavedWorkstationPrinter();
  if (workstation) {
    return {
      printerType: workstation,
      source: "workstation",
      sourceLabel: "Detected from This Terminal",
    };
  }

  // 3. Business default printer setting
  const bizType = normalizePrinterType(
    businessSettings?.receipt?.printer_type,
    businessSettings?.receipt?.paper_width || "58mm"
  );

  return {
    printerType: bizType,
    source: "business_default",
    sourceLabel: "Business Default Printer",
  };
}

/**
 * Interactive WebUSB scan triggered by user click (Chrome/Edge).
 */
export async function requestUsbPrinterDetection() {
  if (typeof navigator === "undefined" || !navigator.usb?.requestDevice) {
    return { supported: false, message: "Browser does not support direct USB printer detection." };
  }

  try {
    const device = await navigator.usb.requestDevice({
      filters: Array.from(KNOWN_THERMAL_VENDORS).map((vendorId) => ({ vendorId })),
    });
    const match = classifyUsbDevice(device);
    if (match) {
      saveWorkstationPrinter(match.printerType);
      return {
        supported: true,
        detected: true,
        printerType: match.printerType,
        sourceLabel: `Detected USB: ${match.deviceName}`,
      };
    }
    return {
      supported: true,
      detected: true,
      printerType: "a4",
      sourceLabel: `Detected USB: ${device.productName || "Standard Printer"}`,
    };
  } catch (err) {
    if (err?.name === "NotFoundError") {
      return { supported: true, detected: false, cancelled: true };
    }
    return { supported: true, detected: false, message: err?.message || "Could not detect USB printer." };
  }
}
