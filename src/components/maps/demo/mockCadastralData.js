/**
 * Mock Cadastral GeoJSON Data for Demo and Testing
 * Represents realistic titled parcel polygons in Upper Hill / Community area, Nairobi, Kenya.
 */
export const mockKenyaParcels = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "LR-209-12340",
      properties: {
        id: "LR-209-12340",
        plotNumber: "LR 209/12340",
        registrationSection: "NAIROBI/BLOCK 82",
        lrNumber: "209/12340",
        ownerName: "PaySol Technologies Ltd",
        status: "active", // active, leased, reserved, disputed
        statusLabel: "Titled & Active",
        areaAcres: 0.85,
        areaSqm: 3439.8,
        zoning: "Commercial / High-Density Office",
        landRateStatus: "Paid (Current)",
        annualRatesKsh: 45000,
        valuationKsh: 125000000,
        tenure: "Leasehold (99 Years)",
        leaseExpiry: "2115-12-31"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [36.8145, -1.2952],
            [36.8162, -1.2950],
            [36.8160, -1.2965],
            [36.8143, -1.2967],
            [36.8145, -1.2952]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "LR-209-12341",
      properties: {
        id: "LR-209-12341",
        plotNumber: "LR 209/12341",
        registrationSection: "NAIROBI/BLOCK 82",
        lrNumber: "209/12341",
        ownerName: "Apex Logistics Hub",
        status: "leased",
        statusLabel: "Leased",
        areaAcres: 1.12,
        areaSqm: 4532.5,
        zoning: "Mixed-Use Commercial",
        landRateStatus: "Paid (Current)",
        annualRatesKsh: 58000,
        valuationKsh: 160000000,
        tenure: "Leasehold (99 Years)",
        leaseExpiry: "2110-06-30"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [36.8162, -1.2950],
            [36.8180, -1.2948],
            [36.8178, -1.2963],
            [36.8160, -1.2965],
            [36.8162, -1.2950]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "LR-209-12342",
      properties: {
        id: "LR-209-12342",
        plotNumber: "LR 209/12342",
        registrationSection: "NAIROBI/BLOCK 82",
        lrNumber: "209/12342",
        ownerName: "Crown Heights Residency",
        status: "reserved",
        statusLabel: "Pending Allocation",
        areaAcres: 0.65,
        areaSqm: 2630.4,
        zoning: "Residential High-Rise",
        landRateStatus: "Pending Assessment",
        annualRatesKsh: 32000,
        valuationKsh: 85000000,
        tenure: "Leasehold (50 Years)",
        leaseExpiry: "2074-03-15"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [36.8180, -1.2948],
            [36.8198, -1.2946],
            [36.8196, -1.2961],
            [36.8178, -1.2963],
            [36.8180, -1.2948]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "LR-209-12343",
      properties: {
        id: "LR-209-12343",
        plotNumber: "LR 209/12343",
        registrationSection: "NAIROBI/BLOCK 82",
        lrNumber: "209/12343",
        ownerName: "Estate In Succession / Caveat",
        status: "disputed",
        statusLabel: "Caution / Disputed",
        areaAcres: 1.45,
        areaSqm: 5868.0,
        zoning: "Commercial",
        landRateStatus: "Arrears Outstanding",
        annualRatesKsh: 72000,
        valuationKsh: 210000000,
        tenure: "Freehold",
        leaseExpiry: "N/A"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [36.8143, -1.2967],
            [36.8160, -1.2965],
            [36.8158, -1.2982],
            [36.8140, -1.2984],
            [36.8143, -1.2967]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "LR-209-12344",
      properties: {
        id: "LR-209-12344",
        plotNumber: "LR 209/12344",
        registrationSection: "NAIROBI/BLOCK 82",
        lrNumber: "209/12344",
        ownerName: "Nairobi County Civic Utility",
        status: "active",
        statusLabel: "Public Utility / County",
        areaAcres: 0.92,
        areaSqm: 3723.1,
        zoning: "Public Purpose / Infrastructure",
        landRateStatus: "Exempt",
        annualRatesKsh: 0,
        valuationKsh: 95000000,
        tenure: "Government Reserve",
        leaseExpiry: "Perpetual"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [36.8160, -1.2965],
            [36.8178, -1.2963],
            [36.8175, -1.2980],
            [36.8158, -1.2982],
            [36.8160, -1.2965]
          ]
        ]
      }
    }
  ]
};

export const defaultCadastralCenter = [-1.2960, 36.8165]; // Upper Hill, Nairobi
export const defaultCadastralZoom = 17;
