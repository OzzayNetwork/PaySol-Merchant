import { tenantClient } from "./index";

/**
 * Item-level Discount Approval API (Per-Approver Unique Email OTP).
 */
export default {
  requestApproval(payload) {
    return tenantClient.post("/discounts/request-approval", payload);
  },

  verifyOtp(payload) {
    return tenantClient.post("/discounts/verify-otp", payload);
  },
};
