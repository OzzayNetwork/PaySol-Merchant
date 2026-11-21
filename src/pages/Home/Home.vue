<template>
    <!-- Page title -->
    <div class="row">
        <div class="col-12">
            <div class="page-title-box d-sm-flex align-items-center justify-content-between">
                <h4 class="mb-sm-0 font-size-18">Home</h4>
                <div class="page-title-right">
                    <button type="button" class="btn btn-light waves-effect p-0 avatar-sm rounded-circle" title="Refresh" @click="refresh">
                        <span class="avatar-title bg-transparent text-reset"><Icon icon="boxicons:refresh-ccw" class="fs-4" /></span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <!-- ================= Welcome ================= -->
        <div class="col-xl-8">
            <div class="card">
                <div class="card-body">
                    <template v-if="loading && !authStore.user">
                        <SkeletonLoader type="text" :lines="2" height="16px" />
                    </template>
                    <template v-else>
                        <div class="d-flex flex-wrap align-items-center gap-3">
                            <div class="avatar-md flex-shrink-0">
                                <span class="avatar-title rounded-circle bg-success bg-soft text-success fs-4 fw-semibold">{{ initials }}</span>
                            </div>
                            <div class="flex-grow-1 min-w-0">
                                <h4 class="mb-1 text-truncate">{{ greeting }}, {{ firstName }}</h4>
                                <p class="text-muted mb-0 text-truncate">{{ authStore.tenant?.name }}<span v-if="authStore.tenant?.human_code"> · {{ authStore.tenant.human_code }}</span></p>
                            </div>
                            <span class="role-chip"><Icon icon="ri:shield-user-fill" /> {{ authStore.roleLabel || 'Team member' }}</span>
                        </div>
                        <p class="text-muted mt-3 mb-0">
                            Selling, stock, staff and reports land here as they are built. For now you can
                            <template v-if="canOversee"> follow everything that happens in the <router-link to="/activity-log">Activity Log</router-link>.</template>
                            <template v-else> sign in and out, and switch business from the top bar.</template>
                        </p>
                    </template>
                </div>
            </div>
        </div>

        <!-- ================= Setup checklist (owner and manager) ================= -->
        <div class="col-xl-4" v-if="canOversee">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title mb-1">Getting set up</h4>
                    <template v-if="loading && !setup">
                        <SkeletonLoader v-for="n in 4" :key="`sk-${n}`" type="text" :lines="1" height="14px" class="mb-3" />
                    </template>
                    <template v-else-if="setup">
                        <p class="text-muted mb-2"><span class="fw-semibold text-black">{{ setup.completed }}</span> of {{ setup.total }} steps done</p>
                        <div class="setup-bar mb-3"><span :style="{ width: setupPercent + '%' }"></span></div>
                        <div v-for="s in setup.steps || []" :key="s.step" class="setup-step"
                            :class="{ 'is-done': !!s.completed_at, 'is-later': !s.available && !s.completed_at }">
                            <Icon :icon="s.completed_at ? 'ri:checkbox-circle-fill' : 'ri:checkbox-blank-circle-line'"
                                class="fs-4 flex-shrink-0" :class="s.completed_at ? 'text-success' : 'text-muted'" />
                            <span class="setup-step-label flex-grow-1">{{ s.label }}</span>
                            <small v-if="!s.available && !s.completed_at" class="text-muted">Coming soon</small>
                        </div>
                    </template>
                    <p v-else class="text-muted mb-0">Nothing to set up right now.</p>
                </div>
            </div>
        </div>
    </div>

    <ImageToast :status="toastStatus" :title="toastTitle" :message="toastMessage" :image="toastImage"
        :imageHeight="70" @hide="toastStatus = null" />
</template>

<script setup>
// ---------------------------------------------------------------
// Home — the first page after sign-in (11 Nov 2026).
//
// A welcome with the person's role at this business, and for owners and
// managers the setup checklist from GET /auth/me (tenant.setup_progress).
// The refresh button calls /auth/me again and puts the answer in the store.
// The Sell and Manage dashboards replace the welcome text as they are built.
// ---------------------------------------------------------------
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted } from 'vue'

import authApi from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue'
import ImageToast from '@/components/ImageToast.vue'
import errorImage from '@/assets/images/icons/error.png'

const authStore = useAuthStore()
const loading = ref(false)

const canOversee = computed(() => authStore.hasRole(['owner', 'manager']))
const setup = computed(() => authStore.tenant?.setup_progress || null)
const setupPercent = computed(() => setup.value?.total ? Math.round((setup.value.completed / setup.value.total) * 100) : 0)

// "Jane Wanjiru" -> "Jane" and "JW"
const firstName = computed(() => (authStore.user?.name || '').split(/\s+/)[0] || 'there')
const initials = computed(() => (authStore.user?.name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase())

// Good morning / afternoon / evening, by the clock on this device
const greeting = computed(() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
})

// Toast
const toastStatus = ref(null)
const toastTitle = ref('')
const toastMessage = ref('')
const toastImage = ref(null)

// Fresh /auth/me (setup progress changes as the business sets up)
async function refresh() {
    loading.value = true
    try {
        const { data } = await authApi.me()
        authStore.applyMe(data?.data ?? {})
    } catch (error) {
        console.error('Error refreshing the session:', error)
        toastStatus.value = 'error'
        toastTitle.value = 'Could Not Refresh'
        toastMessage.value = error.response?.data?.message || 'Please try again.'
        toastImage.value = errorImage
    } finally {
        loading.value = false
    }
}

onMounted(refresh)
</script>
