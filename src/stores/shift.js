import { defineStore } from "pinia";
import shiftsApi from "@/api/shifts";
import branchesApi from "@/api/branches";

export const useShiftStore = defineStore("shift", {
  state: () => ({
    activeShift: null,
    hasActiveShift: false,
    isJoined: false,
    isLead: false,
    myRole: null,
    joinedAt: null,

    branches: [],
    selectedBranchId: null,

    isLoading: false,
    isModalOpen: false,
    lastCheckedAt: null,
  }),

  getters: {
    isOnDuty: (state) => state.hasActiveShift && state.isJoined,
    activeShiftNumber: (state) => state.activeShift?.shift_number ?? "",
    openingFloat: (state) => state.activeShift?.opening_float ?? 0,
    activeMembersCount: (state) => state.activeShift?.active_members_count ?? 0,
    activeMembers: (state) => state.activeShift?.active_members ?? [],
  },

  actions: {
    async fetchBranches() {
      if (this.branches.length > 0) return;
      try {
        const res = await branchesApi.list();
        this.branches = res.data?.data || res.data || [];
        if (!this.selectedBranchId && this.branches.length > 0) {
          const mainBranch = this.branches.find((b) => b.is_main) || this.branches[0];
          this.selectedBranchId = mainBranch?.id ?? null;
        }
      } catch (e) {
        console.warn("Could not load branches for shift store:", e);
      }
    },

    async checkCurrentShift(branchId = null) {
      this.isLoading = true;
      try {
        await this.fetchBranches();
        const targetBranch = branchId || this.selectedBranchId;
        const res = await shiftsApi.current({ branch_id: targetBranch || undefined });
        const data = res.data || {};

        this.hasActiveShift = !!data.has_active_shift;
        this.isJoined = !!data.is_joined;
        this.isLead = !!data.is_lead;
        this.myRole = data.my_role || null;
        this.joinedAt = data.joined_at || null;
        this.activeShift = data.shift || null;
        this.lastCheckedAt = new Date().toISOString();

        if (this.activeShift?.branch?.id) {
          this.selectedBranchId = this.activeShift.branch.id;
        }

        return data;
      } catch (err) {
        console.error("Failed to check active shift:", err);
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async openShift(payload) {
      this.isLoading = true;
      try {
        const res = await shiftsApi.open(payload);
        const data = res.data || {};
        this.activeShift = data.shift || null;
        this.hasActiveShift = true;
        this.isJoined = true;
        this.isLead = true;
        this.myRole = "lead";
        this.isModalOpen = false;
        return { success: true, data };
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.errors?.branch_id?.[0] ||
          err.response?.data?.errors?.user?.[0] ||
          "Could not open shift.";
        return { success: false, error: msg };
      } finally {
        this.isLoading = false;
      }
    },

    async joinActiveShift(shiftId) {
      this.isLoading = true;
      try {
        const targetId = shiftId || this.activeShift?.id;
        const res = await shiftsApi.join(targetId);
        const data = res.data || {};
        this.activeShift = data.shift || this.activeShift;
        this.hasActiveShift = true;
        this.isJoined = true;
        this.myRole = "member";
        this.isModalOpen = false;
        return { success: true, data };
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.errors?.shift?.[0] ||
          "Could not join shift.";
        return { success: false, error: msg };
      } finally {
        this.isLoading = false;
      }
    },

    openModal() {
      this.isModalOpen = true;
      this.checkCurrentShift();
    },

    closeModal() {
      this.isModalOpen = false;
    },
  },
});
