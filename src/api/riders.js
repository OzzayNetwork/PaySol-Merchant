import { tenantClient } from "./index";

/**
 * Reusable Riders, Vehicles & Delivery Providers API client.
 */
export default {
  list(params = {}) {
    return tenantClient.get("/riders", { params });
  },

  create(data) {
    return tenantClient.post("/riders", data);
  },

  addVehicle(riderId, data) {
    return tenantClient.post(`/riders/${riderId}/vehicles`, data);
  },

  providers() {
    return tenantClient.get("/delivery-providers");
  },

  createProvider(name) {
    return tenantClient.post("/delivery-providers", { name });
  },
};
