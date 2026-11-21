import { apiClient } from "./index";

/**
 * Public Geography Reference API (§8) for Kenyan Counties, Constituencies, Wards, and Areas.
 */
export default {
  counties(params = {}) {
    return apiClient.get("/counties", { params });
  },

  county(id) {
    return apiClient.get(`/counties/${id}`);
  },

  constituencies(countyId) {
    return apiClient.get(`/counties/${countyId}/constituencies`);
  },

  wards(constituencyId) {
    return apiClient.get(`/constituencies/${constituencyId}/wards`);
  },

  wardAreas(wardId) {
    return apiClient.get(`/wards/${wardId}/areas`);
  },

  locate(params = {}) {
    return apiClient.get("/geo/locate", { params });
  },

  searchAreas(query) {
    return apiClient.get("/areas/search", { params: { query } });
  },

  searchGeo(query) {
    return apiClient.get("/geo/search", { params: { query } });
  },
};
