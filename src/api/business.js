import { tenantClient } from "./index";

/**
 * Tenant Business API Client (§5.1).
 *
 *   get()                      GET    /business
 *   update(data)               PATCH  /business
 *   uploadLogo(formData)       POST   /business/logo
 *   deleteLogo()               DELETE /business/logo
 *   checkShortName(shortName)  GET    /business/check-short-name?short_name=...
 */
export default {
  get() {
    return tenantClient.get("/business");
  },

  update(data) {
    return tenantClient.patch("/business", data);
  },

  uploadLogo(formData) {
    return tenantClient.post("/business/logo", formData);
  },

  deleteLogo() {
    return tenantClient.delete("/business/logo");
  },

  checkShortName(shortName) {
    return tenantClient.get("/business/check-short-name", {
      params: { short_name: shortName },
    });
  },
};
