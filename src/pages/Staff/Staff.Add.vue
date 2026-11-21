<template>
    <!-- Page title -->
    <div class="row">
        <div class="col-12">
            <div class="page-title-box d-sm-flex align-items-center justify-content-between">
                <div>
                    <h4 class="mb-sm-0 font-size-18 pb-2">Add Staff</h4>
                    <div class="page-title-right">
                        <ol class="breadcrumb m-0">
                            <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
                            <li class="breadcrumb-item"><router-link to="/staff">Staff</router-link></li>
                            <li class="breadcrumb-item active">Add</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <form class="row" @submit.prevent="save" novalidate>
        <!-- ================= Left: the form ================= -->
        <div class="col-xl-8">
            <!-- 1. Who -->
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title mb-1">Who are they?</h4>
                    <p class="text-muted mb-4">Their phone number is how they sign in. If they already use PaySol at another business, the same login is used.</p>

                    <div class="row g-3">
                        <div class="col-12">
                            <label class="form-label" for="staffName">Full name <span class="text-danger">*</span></label>
                            <input id="staffName" v-model.trim="form.name" type="text" class="form-control" :class="{ 'is-invalid': errors.name }"
                                placeholder="e.g. Faith Wanjiru" maxlength="100" autocomplete="off" />
                            <div class="invalid-feedback">{{ errors.name }}</div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label" for="staffPhone">Phone number <span class="text-danger">*</span></label>
                            <input id="staffPhone" v-model.trim="form.phone" type="tel" inputmode="tel" class="form-control" :class="{ 'is-invalid': errors.phone }"
                                placeholder="0712 345 678" maxlength="20" autocomplete="off" />
                            <div class="invalid-feedback">{{ errors.phone }}</div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label" for="staffEmail">Email <span class="text-muted">(optional)</span></label>
                            <input id="staffEmail" v-model.trim="form.email" type="email" class="form-control" :class="{ 'is-invalid': errors.email }"
                                placeholder="faith@example.com" maxlength="255" autocomplete="off" />
                            <div class="invalid-feedback">{{ errors.email }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2. Role -->
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title mb-1">What do they do?</h4>
                    <p class="text-muted mb-3">The role decides what they can see and do. You can change it later.</p>
                    <RolePicker v-model="form.role" :roles="ASSIGNABLE_ROLES" :meta="ROLE_META" aria-label="Role" />
                    <small v-if="errors.role" class="text-danger d-block mt-2">{{ errors.role }}</small>
                </div>
            </div>

            <!-- 3. Branches -->
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title mb-1">Where do they work?</h4>
                    <p class="text-muted mb-3">They only see sales, stock and shifts for these branches.</p>
                    <BranchScopePicker ref="scopePicker" id="addStaffScope" v-model="form.branch_scope" :branches="branches" :loading="loadingBranches" />
                    <small v-if="errors.branch_scope" class="text-danger d-block mt-2">{{ errors.branch_scope }}</small>
                </div>
            </div>

            <!-- 4. Counter PIN -->
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title mb-1">Counter PIN <span class="text-muted font-size-13 fw-normal">(optional)</span></h4>
                    <p class="text-muted mb-3">
                        {{ form.role === 'manager'
                            ? 'Managers sign in with a password; a PIN also lets them approve voids at the counter.'
                            : 'Cashiers and waiters sign in at the counter with a PIN. With a PIN they can start today.' }}
                    </p>
                    <div class="row g-3">
                        <div class="col-sm-6">
                            <label class="form-label" for="staffPin">PIN (4 to 6 digits)</label>
                            <input id="staffPin" v-model="form.pin" :type="showPin ? 'text' : 'password'" inputmode="numeric" maxlength="6"
                                class="form-control" :class="{ 'is-invalid': errors.pin }" placeholder="••••" autocomplete="new-password"
                                @input="form.pin = form.pin.replace(/\D/g, '')" />
                            <div class="invalid-feedback">{{ errors.pin }}</div>
                        </div>
                        <div class="col-sm-6">
                            <label class="form-label" for="staffPin2">Type it again</label>
                            <input id="staffPin2" v-model="pinConfirm" :type="showPin ? 'text' : 'password'" inputmode="numeric" maxlength="6"
                                class="form-control" :class="{ 'is-invalid': errors.pinConfirm }" placeholder="••••" autocomplete="new-password"
                                @input="pinConfirm = pinConfirm.replace(/\D/g, '')" />
                            <div class="invalid-feedback">{{ errors.pinConfirm }}</div>
                        </div>
                    </div>
                    <div class="form-check mt-2">
                        <input id="staffShowPin" v-model="showPin" class="form-check-input" type="checkbox" />
                        <label class="form-check-label" for="staffShowPin">Show the PIN</label>
                    </div>
                </div>
            </div>
        </div>

        <!-- ================= Right: what happens next ================= -->
        <div class="col-xl-4">
            <div class="card staff-add-summary">
                <div class="card-body">
                    <h4 class="card-title mb-3">Summary</h4>
                    <div class="d-flex align-items-center gap-3 mb-3">
                        <div class="avatar-sm flex-shrink-0">
                            <span class="avatar-title rounded-circle fw-semibold" :class="ROLE_META[form.role]?.tint || 'bg-light text-muted'">{{ initialsOf(form.name || '?') }}</span>
                        </div>
                        <div class="min-w-0">
                            <div class="fw-semibold text-dark text-truncate">{{ form.name || 'New person' }}</div>
                            <small class="text-muted">{{ form.role ? roleLabel(form.role) : 'No role yet' }} · {{ branchNames(form.branch_scope, branches) }}</small>
                        </div>
                    </div>

                    <!-- What the API will do -->
                    <div class="legal-note" :class="willBeActive ? 'is-success' : 'is-warning'">
                        <template v-if="willBeActive">
                            <b>Active straight away.</b> They can sign in at the counter with their phone number and this PIN.
                        </template>
                        <template v-else>
                            <b>Added as invited.</b> They need to activate their account before they can sign in.
                            PaySol doesn't send the invitation text yet, so for cashiers and waiters a PIN is the quickest way in.
                        </template>
                    </div>

                    <div class="d-flex gap-2 mt-4">
                        <router-link to="/staff" class="btn btn-white waves-effect flex-grow-1">Cancel</router-link>
                        <button type="submit" class="btn btn-primary waves-effect waves-light flex-grow-1" :disabled="saving">
                            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span> Add Staff
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </form>

    <ImageToast :status="toastStatus" :title="toastTitle" :message="toastMessage" :image="toastImage"
        :imageHeight="70" @hide="toastStatus = null" />
</template>

<script setup>
// ---------------------------------------------------------------
// Staff.Add — add a manager, cashier or waiter (owner and manager only).
// Modelled on the console's Team.Invite.
//
// API: POST /tenant/staff { name, phone, email?, role, branch_scope?, pin? }
// (with a PIN the person is active at once, without one "invited"; a phone
// already on this business is a 422 on phone), GET /tenant/branches.
// After saving it opens the new person's page.
// ---------------------------------------------------------------
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// API
import StaffAPI from '@/api/staff'
import BranchesAPI from '@/api/branches'

// Components
import RolePicker from '@/components/Data-tools/Role.Picker.vue'
import BranchScopePicker from '@/components/Data-tools/Branch.Scope.Picker.vue'
import ImageToast from '@/components/ImageToast.vue'

// Utils
import { ROLE_META, ASSIGNABLE_ROLES, roleLabel, initialsOf, branchNames } from './helpers/staffMeta'
import errorImage from '@/assets/images/icons/error.png'

const router = useRouter()

// Form
const form = reactive({ name: '', phone: '', email: '', role: 'cashier', branch_scope: [], pin: '' })
const pinConfirm = ref('')
const showPin = ref(false)
const errors = ref({})
const saving = ref(false)
const scopePicker = ref(null)

// Branches for "Where do they work?"
const branches = ref([])
const loadingBranches = ref(true)

// With a valid PIN the API makes them active at once
const willBeActive = computed(() => /^\d{4,6}$/.test(form.pin))

// Toast
const toastStatus = ref(null)
const toastTitle = ref('')
const toastMessage = ref('')
const toastImage = ref(null)

async function getBranches() {
    try {
        const { data } = await BranchesAPI.list()
        branches.value = data.data || []
    } catch (error) {
        console.error('Error fetching branches:', error)
    } finally {
        loadingBranches.value = false
    }
}

// ---- Checks before sending (the API checks again) ----
function validate() {
    const e = {}
    if (!form.name) e.name = 'Enter their name.'
    if (!/^\+?[\d\s-]{9,20}$/.test(form.phone)) e.phone = 'Enter a phone number like 0712 345 678.'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'That email doesn\'t look right.'
    if (!form.role) e.role = 'Choose a role.'
    if (scopePicker.value && !scopePicker.value.isValid()) e.branch_scope = 'Tick at least one branch, or choose All branches.'
    if (form.pin && !/^\d{4,6}$/.test(form.pin)) e.pin = 'A PIN is 4 to 6 digits.'
    if (form.pin && pinConfirm.value !== form.pin) e.pinConfirm = 'The two PINs don\'t match.'
    errors.value = e
    return !Object.keys(e).length
}

// ---- Save ----
async function save() {
    if (!validate()) return
    saving.value = true
    try {
        const body = { name: form.name, phone: form.phone, role: form.role }
        if (form.email) body.email = form.email
        if (form.branch_scope.length) body.branch_scope = form.branch_scope
        if (form.pin) body.pin = form.pin
        const { data } = await StaffAPI.create(body)
        router.push({ path: `/staff/${data.data.id}`, query: { added: '1' } })
    } catch (error) {
        console.error('Error adding staff:', error)
        if (error.response?.status === 422) {
            // The first message under each field (branch_scope.0 → branch_scope)
            const e = {}
            for (const [k, v] of Object.entries(error.response.data.errors || {})) e[k.split('.')[0]] = v[0]
            errors.value = e
        } else {
            toastStatus.value = 'error'
            toastTitle.value = 'Could Not Add Staff'
            toastMessage.value = error.response?.data?.message || 'Please try again.'
            toastImage.value = errorImage
        }
    } finally {
        saving.value = false
    }
}

onMounted(getBranches)
</script>
