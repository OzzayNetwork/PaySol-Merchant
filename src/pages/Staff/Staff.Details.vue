<template>
    <!-- Page title -->
    <div class="row">
        <div class="col-12">
            <div class="page-title-box d-sm-flex align-items-center justify-content-between">
                <h4 class="mb-sm-0 font-size-18">Staff Profile</h4>
                <div class="page-title-right">
                    <ol class="breadcrumb m-0">
                        <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
                        <li class="breadcrumb-item"><router-link to="/staff">Staff</router-link></li>
                        <li class="breadcrumb-item active">{{ person?.name || '…' }}</li>
                    </ol>
                </div>
            </div>
        </div>
    </div>

    <!-- Not found / error -->
    <div v-if="loadError" class="row justify-content-center">
        <div class="col-md-6">
            <div class="card text-center p-5">
                <Icon icon="ri:user-unfollow-line" class="text-black opacity-25 mx-auto" style="font-size: 96px;" />
                <h5 class="mb-2">{{ loadError.title }}</h5>
                <p class="text-muted">{{ loadError.message }}</p>
                <router-link to="/staff" class="btn btn-link">← Back to Staff</router-link>
            </div>
        </div>
    </div>

    <div v-else class="row justify-content-center">
        <!-- ===================================================== -->
        <!-- LEFT: identity card                                    -->
        <!-- ===================================================== -->
        <div class="col-sm-12 col-lg-4">
            <div class="card">
                <!-- Banner -->
                <div style="height: 108px; overflow: hidden;" class="position-relative">
                    <img class="card-img-top img-fluid position-absolute" style="bottom: -100%;" src="@/assets/images/modern-bg/waves.png" alt="">
                </div>

                <!-- Loading -->
                <div v-if="loading && !person" class="card-body text-center d-flex flex-column align-items-center">
                    <div style="margin-top: -65px;" class="mb-3"><SkeletonLoader width="96px" height="96px" /></div>
                    <SkeletonLoader type="text" :lines="2" height="14px" width="180px" />
                    <SkeletonLoader type="text" :lines="1" height="70px" class="w-100 mt-4" />
                </div>

                <div v-else-if="person" class="card-body text-center d-flex flex-column align-items-center justify-content-center position-relative">
                    <!-- Avatar (initials in the role's colour) with an online dot -->
                    <div class="avatar-xl profile-user-wid mb-4 position-relative" style="margin-top: -65px;">
                        <div class="img-thumbnail rounded-circle d-flex align-items-center justify-content-center border-4"
                            :class="ROLE_META[person.role]?.tint || 'bg-secondary text-white'" style="width: 100%; height: 100%; font-size: 32px; font-weight: 600;">
                            {{ initialsOf(person.name) }}
                        </div>
                        <span v-if="isOnline" class="online-indicator" :title="`Last seen ${smartDate(person.last_seen_at)}`"></span>
                    </div>

                    <h5 class="font-size-15 text-truncate fw-bold text-black mb-0 text-capitalize">
                        {{ person.name }} <small v-if="isMe" class="text-muted fw-normal">(you)</small>
                    </h5>
                    <p class="text-muted mb-0 text-truncate">{{ person.role_label || roleLabel(person.role) }} · {{ branchNames(person.branch_scope, branches) }}</p>

                    <!-- ===== Status block ===== -->
                    <div class="w-100 mt-4 text-start">
                        <div class="p-3 border-top border-dark-muted rounded" :class="statusBlock.bg">
                            <div class="d-flex align-items-center gap-3">
                                <div class="flex-shrink-0"><Icon :icon="statusBlock.icon" class="h2 mb-0" :class="statusBlock.fg" /></div>
                                <div class="flex-grow-1">
                                    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                                        <h5 class="font-size-15 text-black mb-0">{{ statusBlock.title }}</h5>
                                        <span class="badge text-uppercase" :class="statusBlock.badge">{{ statusMeta(person.membership_status).label }}</span>
                                    </div>
                                    <p class="text-muted mb-0 mt-1 small">{{ statusBlock.note }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Four facts in dashed boxes -->
                    <div class="row m-0 px-0 w-100 pt-3">
                        <div v-for="f in facts" :key="f.label" class="col-6 mt-4" :class="{ 'mb-3': f.top }">
                            <div class="d-block py-3 px-2 text-center border border-dashed border-gray-5 rounded position-relative">
                                <div class="avatar-sm mx-auto position-absolute top-0 start-50 translate-middle">
                                    <div class="avatar-title rounded-circle bg-soft" :class="f.bg"><Icon :icon="f.icon" class="fs-3" :class="f.fg" /></div>
                                </div>
                                <div>
                                    <div class="fs-12 text-muted mb-1 mt-3">{{ f.label }}</div>
                                    <h6 class="m-0 p-0 text-truncate">{{ f.value }}</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Contact details -->
                <div v-if="person" class="card-body border-top">
                    <div class="d-flex flex-column gap-4">
                        <div class="d-flex align-items-center gap-3">
                            <div><span class="mdi-phone-in-talk-outline mdi fs-2"></span></div>
                            <div class="min-w-0">
                                <span class="text-muted">Phone (their login)</span>
                                <p class="text-black mb-0">{{ person.phone }}</p>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-3">
                            <div><span class="mdi-email-outline mdi fs-2"></span></div>
                            <div class="min-w-0">
                                <span class="text-muted">Email</span>
                                <p class="text-black mb-0 text-truncate">{{ person.email || '-' }}</p>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-3">
                            <div><span class="mdi-account-tie-outline mdi fs-2"></span></div>
                            <div>
                                <span class="text-muted">Role</span>
                                <p class="text-black mb-0">{{ person.role_label || roleLabel(person.role) }}</p>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-3">
                            <div><span class="mdi-storefront-outline mdi fs-2"></span></div>
                            <div class="min-w-0">
                                <span class="text-muted">Works at</span>
                                <p class="text-black mb-0">{{ branchNames(person.branch_scope, branches) }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action buttons (never on the owner or on yourself) -->
                <div v-if="person && canManage" class="card-body border-top gap-3 d-flex flex-wrap">
                    <button v-if="person.membership_status !== 'suspended'" class="btn btn-soft-danger waves-effect waves-light" @click="ask('suspend')">
                        Suspend
                    </button>
                    <button v-else class="btn btn-outline-success d-flex align-items-center justify-content-center gap-2" @click="ask('reactivate')">
                        <i class="mdi mdi-account-check fs-4"></i> Reactivate
                    </button>

                    <div class="btn-group flex-grow-1">
                        <button type="button" class="btn btn-primary dropdown-toggle w-100" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            More Options <i class="mdi mdi-chevron-down"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end p-2">
                            <li><a class="dropdown-item d-flex py-2" href="javascript:void(0);" @click="openSettings"><Icon icon="ri:edit-line" class="me-2 fs-5" /> Edit role &amp; access</a></li>
                            <li><a class="dropdown-item d-flex py-2" href="javascript:void(0);" @click="openSettings('pin')"><Icon icon="ri:lock-password-line" class="me-2 fs-5" /> {{ person.can_use_pin ? 'Change counter PIN' : 'Set counter PIN' }}</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item d-flex py-2 text-danger" href="javascript:void(0);" @click="ask('remove')"><Icon icon="ri:delete-bin-line" class="me-2 fs-5" /> Remove from business</a></li>
                        </ul>
                    </div>
                </div>
                <div v-else-if="person" class="card-body border-top">
                    <p class="text-muted small mb-0">{{ person.role === 'owner' ? 'The owner can\'t be suspended, removed or given another role.' : 'You can\'t change your own role or status.' }}</p>
                </div>
            </div>
        </div>

        <!-- ===================================================== -->
        <!-- RIGHT: tabbed panel                                    -->
        <!-- ===================================================== -->
        <div class="col-sm-12 col-lg-8">
            <div class="card">
                <div class="card-header">
                    <h4 class="card-title">Staff Member Details</h4>
                </div>
                <div class="card-header bg-white px-0 pt-0">
                    <ul class="nav nav-tabs nav-tabs-custom card-header-tabs mx-0">
                        <li class="nav-item">
                            <a class="nav-link py-3" :class="{ active: activeTab === 'activity' }" href="javascript:void(0);" @click="setTab('activity')">Activity log</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link py-3" :class="{ active: activeTab === 'access' }" href="javascript:void(0);" @click="setTab('access')">Role &amp; access</a>
                        </li>
                    </ul>
                </div>

                <div class="card-body" style="min-height: 70vh">
                    <!-- ===== ACTIVITY TAB ===== -->
                    <div v-if="activeTab === 'activity'">
                        <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
                            <div class="min-w-0">
                                <h5 class="fw-semibold text-black mb-1">Activity log</h5>
                                <p class="text-muted font-size-13 mb-0">
                                    What {{ firstName }} did in this business, and every sign-in attempt on their account.
                                </p>
                            </div>
                            <button type="button" class="btn btn-white waves-effect text-nowrap" title="Check for new activity"
                                :disabled="loadingActivity" @click="reloadActivity">
                                <Icon icon="ri:refresh-line" class="me-1" />Refresh
                            </button>
                        </div>

                        <!-- Filters: search, kind, dates (the Activity Log page's, for this one person) -->
                        <div class="d-flex flex-wrap gap-2 align-items-center mb-2">
                            <!-- Search -->
                            <div class="flex-grow-1" style="min-width: 200px;">
                                <div class="search-box mb-0 me-0">
                                    <div class="position-relative">
                                        <form @submit.prevent="reloadActivity" class="input-group bg-light rounded pb-0 flex-nowrap">
                                            <div class="flex-grow-1">
                                                <input style="border-radius: 0px; padding-right: 35px;" type="text"
                                                    class="form-control bg-light rounded flex-grow-1" placeholder="Search: product, setting, receipt..."
                                                    spellcheck="false" aria-label="Search their activity" v-model="actQ" @input="onActSearch">
                                                <i class="bx bx-search-alt search-icon fs-4"></i>
                                                <i v-if="actQ != ''" title="Clear search" style="right: 15px; left:unset;"
                                                    class="mdi mdi-close search-icon cursor-pointer fs-3 waves-effect" @click="actQ = ''; reloadActivity();"></i>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>

                            <!-- Kind -->
                            <div class="position-relative d-flex">
                                <button class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <Icon :icon="kindIcon(actKind, !!actKind)" class="fs-4" />
                                    <span>{{ actKind ? kindLabel(actKind) : 'Kind' }}</span>
                                    <i class="mdi mdi-chevron-down fs-4"></i>
                                </button>
                                <div class="dropdown-menu dropdown-menu-end p-2" style="min-width: 210px;">
                                    <a href="javascript:void(0);" class="dropdown-item" :class="{ active: !actKind }" @click="setActKind('')">All kinds</a>
                                    <a v-for="(label, k) in KIND_LABELS" :key="k" href="javascript:void(0);" class="dropdown-item d-flex align-items-center gap-2"
                                        :class="{ active: actKind === k }" @click="setActKind(k)">
                                        <Icon :icon="kindIcon(k, actKind === k)" class="fs-5" /> {{ label }}
                                    </a>
                                </div>
                            </div>

                            <!-- Dates (the shared picker) -->
                            <div class="position-relative d-flex align-items-center flex-shrink-0 text-nowrap">
                                <DateRangePicker v-model:dateFrom="actFrom" v-model:dateTo="actTo" />
                            </div>
                        </div>

                        <!-- "Showing X of Y" and the filters in use -->
                        <div class="d-flex flex-wrap align-items-center gap-2 font-size-13 mb-3">
                            <div v-if="loadingActivity && !activity.length"><SkeletonLoader type="text" :lines="1" height="10px" width="150px" /></div>
                            <span v-else class="text-muted">Showing <span class="fw-bold text-black">{{ activity.length }}</span> of <span class="fw-bold text-black">{{ activityTotal }}</span> events</span>
                            <template v-if="actChips.length">
                                <span class="text-muted">· Filters in use:</span>
                                <span v-for="c in actChips" :key="c.key"
                                    class="badge rounded-pill bg-primary bg-soft text-primary font-size-12 fw-medium px-2 py-1 d-inline-flex align-items-center gap-1">
                                    {{ c.label }}
                                    <a href="javascript:void(0);" class="text-primary" :title="`Remove ${c.label}`" @click="c.clear()"><i class="mdi mdi-close"></i></a>
                                </span>
                                <a v-if="actChips.length > 1" href="javascript:void(0);" class="ms-1" @click="clearActFilters">Clear all</a>
                            </template>
                        </div>

                        <ActivityDays :items="activityItems" :loading="loadingActivity && activityPage === 1" :loading-more="loadingActivity && activityPage > 1"
                            :has-more="activityPage < activityLastPage" :selected-id="selectedEvent?.id"
                            :end-note="activity.length ? actEndNote : ''"
                            @open="openEvent" @more="loadMoreActivity">
                            <template #empty>
                                <Icon icon="ri:history-line" class="text-black opacity-25" style="font-size: 96px;" />
                                <h5 class="fw-bold text-dark mt-3 mb-2">{{ actHasFilters ? 'Nothing matches' : 'No activity yet' }}</h5>
                                <p class="text-muted mb-0">{{ actHasFilters ? 'Nothing matches your search or filters for these dates.' : 'Their sales, changes and sign-ins will appear here as they happen.' }}</p>
                            </template>
                        </ActivityDays>
                    </div>

                    <!-- ===== ROLE & ACCESS TAB ===== -->
                    <div v-else-if="activeTab === 'access' && person">
                        <div class="row align-items-center justify-content-center">
                            <div class="col-xl-9 col-lg-10 mt-3 col-sm-12 col-md-11">

                                <!-- View only: the owner, or yourself -->
                                <div v-if="!canManage" class="legal-note is-info mb-3">
                                    {{ person.role === 'owner' ? 'The owner\'s role and access can\'t be changed here.' : 'You can\'t change your own role or access.' }}
                                </div>

                                <form @submit.prevent="saveAccess" novalidate>
                                    <!-- Name and email -->
                                    <div class="access-row">
                                        <div class="d-flex gap-3 align-items-start mb-3">
                                            <span class="avatar-title rounded-circle bg-dark bg-soft font-size-24 flex-shrink-0" style="height:3rem;width:3rem;"><i class="mdi mdi-card-account-details-outline text-black"></i></span>
                                            <div>
                                                <p class="mb-0 fw-semibold">Name and email</p>
                                                <small class="text-muted">How they appear on receipts and in the Activity Log. The phone number is their login and can't be changed here.</small>
                                            </div>
                                        </div>
                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label" for="accName">Full name</label>
                                                <input id="accName" v-model.trim="form.name" type="text" maxlength="100" class="form-control" :class="{ 'is-invalid': errors.name }" :disabled="!canManage" />
                                                <div class="invalid-feedback">{{ errors.name }}</div>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label" for="accEmail">Email</label>
                                                <input id="accEmail" v-model.trim="form.email" type="email" maxlength="255" class="form-control" :class="{ 'is-invalid': errors.email }" :disabled="!canManage" placeholder="Optional" />
                                                <div class="invalid-feedback">{{ errors.email }}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Role -->
                                    <div class="access-row">
                                        <div class="d-flex gap-3 align-items-start mb-3">
                                            <span class="avatar-title rounded-circle bg-dark bg-soft font-size-24 flex-shrink-0" style="height:3rem;width:3rem;"><i class="mdi mdi-account-tie-outline text-black"></i></span>
                                            <div>
                                                <p class="mb-0 fw-semibold">Role</p>
                                                <small class="text-muted">Decides what they can see and do in this business.</small>
                                            </div>
                                        </div>
                                        <RolePicker v-if="person.role !== 'owner'" v-model="form.role" :roles="ASSIGNABLE_ROLES" :meta="ROLE_META" :disabled="!canManage" aria-label="Role" />
                                        <RolePicker v-else model-value="owner" :roles="['owner']" :meta="ROLE_META" disabled aria-label="Role" />
                                        <small v-if="errors.role" class="text-danger d-block mt-1">{{ errors.role }}</small>
                                    </div>

                                    <!-- Works at -->
                                    <div class="access-row">
                                        <div class="d-flex gap-3 align-items-start mb-3">
                                            <span class="avatar-title rounded-circle bg-dark bg-soft font-size-24 flex-shrink-0" style="height:3rem;width:3rem;"><i class="mdi mdi-storefront-outline text-black"></i></span>
                                            <div>
                                                <p class="mb-0 fw-semibold">Works at</p>
                                                <small class="text-muted">They only see sales, stock and shifts for these branches.</small>
                                            </div>
                                        </div>
                                        <BranchScopePicker :key="`scope-${person.id}-${formKey}`" ref="scopePicker" id="accScope" v-model="form.branch_scope" :branches="branches" :loading="loadingBranches" :disabled="!canManage" />
                                        <small v-if="errors.branch_scope" class="text-danger d-block mt-1">{{ errors.branch_scope }}</small>
                                    </div>

                                    <!-- Counter PIN -->
                                    <div id="accPinRow" class="access-row">
                                        <div class="d-flex gap-3 align-items-start mb-3">
                                            <span class="avatar-title rounded-circle bg-dark bg-soft font-size-24 flex-shrink-0" style="height:3rem;width:3rem;"><i class="mdi mdi-dialpad text-black"></i></span>
                                            <div class="flex-grow-1">
                                                <div class="d-flex justify-content-between gap-2 flex-wrap">
                                                    <p class="mb-0 fw-semibold">Counter PIN</p>
                                                    <span class="fw-bold" :class="person.can_use_pin ? 'text-success' : 'text-muted'">{{ person.can_use_pin ? 'Set' : 'Not set' }}</span>
                                                </div>
                                                <small class="text-muted">4 to 6 digits for signing in at the counter. Leave empty to keep {{ person.can_use_pin ? 'the current PIN' : 'it unset' }}.</small>
                                            </div>
                                        </div>
                                        <div class="row g-3">
                                            <div class="col-sm-6">
                                                <input id="accPin" v-model="form.pin" type="password" inputmode="numeric" maxlength="6" :placeholder="person.can_use_pin ? 'New PIN' : 'PIN'" aria-label="Counter PIN"
                                                    class="form-control" :class="{ 'is-invalid': errors.pin }" autocomplete="new-password" :disabled="!canManage" @input="form.pin = form.pin.replace(/\D/g, '')" />
                                                <div class="invalid-feedback">{{ errors.pin }}</div>
                                            </div>
                                            <div class="col-sm-6">
                                                <input v-model="pinConfirm" type="password" inputmode="numeric" maxlength="6" placeholder="Type it again" aria-label="Type the PIN again"
                                                    class="form-control" :class="{ 'is-invalid': errors.pinConfirm }" autocomplete="new-password" :disabled="!canManage" @input="pinConfirm = pinConfirm.replace(/\D/g, '')" />
                                                <div class="invalid-feedback">{{ errors.pinConfirm }}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Save -->
                                    <div v-if="canManage" class="d-flex justify-content-end gap-2 mt-2">
                                        <button type="button" class="btn btn-white waves-effect" :disabled="saving || !isDirty" @click="resetForm">Undo changes</button>
                                        <button type="submit" class="btn btn-primary waves-effect waves-light" :disabled="saving || !isDirty">
                                            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span> Save changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Suspend / reactivate / remove -->
    <StaffActionModal ref="actionModal" @done="onActionDone" />

    <!-- One event in full: the Activity Log's own panel (on <body>, out of the page wrapper) -->
    <Teleport to="body">
        <ActivityEventAside id="staffActivityAside" :eventId="selectedEvent?.event_id || null"
            :ids="activity.map(e => e.event_id).filter(Boolean)" :fetcher="ActivityAPI.get" :showBusiness="false" :showFilters="false"
            @navigate="onNavigate" @closed="selectedEvent = null" />
    </Teleport>

    <ImageToast :status="toastStatus" :title="toastTitle" :message="toastMessage" :image="toastImage"
        :imageHeight="70" @hide="toastStatus = null" />
</template>

<script setup>
// ---------------------------------------------------------------
// Staff.Details — one staff member's profile (owner and manager only).
// Laid out like the console's Team.Details (Kelvin, 12 Nov 2026: "similar to
// what we did on the user page"): an identity card on the left (banner,
// avatar, status block, four facts, contact details, actions) and tabs on the
// right (Activity log, Role & access).
//
// API: GET /tenant/staff/{id} (404 = not at this business), PATCH
// /tenant/staff/{id} { name, email, role, branch_scope, pin? }, suspend /
// reactivate / remove through StaffAction.modal, GET /tenant/branches, and
// GET /tenant/activity?actor=user:{user_id} (+ /activity/{event} in the panel).
// ?tab=access (or the old ?do=edit) opens Role & access; ?added=1 shows "added".
// The owner and your own record are view-only.
// ---------------------------------------------------------------
import { Icon } from '@iconify/vue'
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// API
import StaffAPI from '@/api/staff'
import BranchesAPI from '@/api/branches'
import ActivityAPI from '@/api/activity'

// Components
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue'
import ImageToast from '@/components/ImageToast.vue'
import RolePicker from '@/components/Data-tools/Role.Picker.vue'
import BranchScopePicker from '@/components/Data-tools/Branch.Scope.Picker.vue'
import ActivityDays from '@/components/Data-tools/Activity.Days.vue'
import ActivityEventAside from '@/pages/ActivityLog/components/ActivityEvent.aside.vue'
import StaffActionModal from './components/StaffAction.modal.vue'
import DateRangePicker from '@/components/DatePickers/datePicker.facebookstyle.vue'

// Utils
import { subDays, format } from 'date-fns'
import { formatDate, smartDate } from '@/utils/dates'
import { ROLE_META, ASSIGNABLE_ROLES, roleLabel, statusMeta, initialsOf, branchNames } from './helpers/staffMeta'
import { KIND_LABELS, kindLabel, kindIcon } from '@/pages/ActivityLog/helpers/businessActivity'
import { RESULT_META } from '@/pages/ActivityLog/helpers/activityMeta'
import { useAuthStore } from '@/stores/auth'
import successImage from '@/assets/images/icons/check.png'
import errorImage from '@/assets/images/icons/error.png'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Page state
const person = ref(null)
const loading = ref(true)
const loadError = ref(null)
const branches = ref([])
const loadingBranches = ref(true)
const activeTab = ref('activity')

// Role & access form
const form = reactive({ name: '', email: '', role: '', branch_scope: [], pin: '' })
const pinConfirm = ref('')
const errors = ref({})
const saving = ref(false)
const scopePicker = ref(null)
const formKey = ref(0)          // remounts the branch picker on reset

// Activity
const activity = ref([])
const activityTotal = ref(0)
const loadingActivity = ref(false)
const activityPage = ref(1)
const activityLastPage = ref(1)
const selectedEvent = ref(null)

// Activity filters (the Activity Log page's: search, kind, dates; the person is fixed)
const actQ = ref('')
const actKind = ref('')
const actFrom = ref(subDays(new Date(), 29))     // the last 30 days, as on the Activity Log
const actTo = ref(new Date())
const actHasFilters = computed(() => !!(actQ.value.trim() || actKind.value))

// Modal and toast
const actionModal = ref(null)
const toastStatus = ref(null)
const toastTitle = ref('')
const toastMessage = ref('')
const toastImage = ref(null)

// ---- Who they are to the viewer ----
const isMe = computed(() => person.value?.user_id === authStore.user?.id)
const canManage = computed(() => !!person.value && person.value.role !== 'owner' && !isMe.value)
const firstName = computed(() => person.value?.name?.split(/\s+/)[0] || 'they')
// Seen in the last 5 minutes
const isOnline = computed(() => !!person.value?.last_seen_at && (Date.now() - new Date(person.value.last_seen_at).getTime()) < 5 * 60 * 1000)

// The status block's colours and words, per status at this business
const statusBlock = computed(() => {
    const p = person.value
    if (!p) return {}
    if (p.membership_status === 'suspended') {
        return { bg: 'bg-danger-subtle', fg: 'text-danger', icon: 'bx:user-x', badge: 'bg-danger', title: 'Suspended', note: 'Can\'t sign in to this business until reactivated. Their history stays.' }
    }
    if (p.membership_status === 'invited') {
        return { bg: 'bg-warning-subtle', fg: 'text-warning', icon: 'bx:time-five', badge: 'bg-warning', title: 'Invited', note: 'Not active yet. For a cashier or waiter, setting a counter PIN is the quickest way in.' }
    }
    return {
        bg: 'bg-success-subtle', fg: 'text-success', icon: 'bx:check-shield', badge: 'bg-success',
        title: isOnline.value ? 'Online now' : 'Active',
        note: p.last_seen_at ? `Last seen ${smartDate(p.last_seen_at)}` : 'Has not signed in yet',
    }
})

// The four dashed boxes
const facts = computed(() => {
    const p = person.value
    if (!p) return []
    const scope = p.branch_scope || []
    return [
        { label: 'Joined', value: p.joined_at ? formatDate(p.joined_at) : 'Not yet', icon: 'mdi:calendar-check', bg: 'bg-dark', fg: 'text-dark', top: true },
        { label: 'Last seen', value: p.last_seen_at ? smartDate(p.last_seen_at) : 'Never', icon: 'mdi:login', bg: 'bg-info', fg: 'text-info', top: true },
        { label: 'Signs in with', value: p.can_use_pin ? 'PIN' : (p.role === 'owner' || p.role === 'manager') ? 'Password' : 'No PIN yet', icon: 'mdi:dialpad', bg: 'bg-primary', fg: 'text-primary' },
        { label: 'Branches', value: scope.length ? String(scope.length) : 'All', icon: 'mdi:storefront-outline', bg: 'bg-success', fg: 'text-success' },
    ]
})

// ---- Fetch ----
async function getPerson() {
    loading.value = true
    try {
        const { data } = await StaffAPI.get(route.params.id)
        person.value = data.data
        loadError.value = null
        resetForm()
    } catch (error) {
        console.error('Error fetching staff member:', error)
        loadError.value = error.response?.status === 404
            ? { title: 'Not found', message: 'This person doesn\'t work at this business, or was removed.' }
            : { title: 'Could not load', message: error.response?.data?.message || 'Please try again.' }
    } finally {
        loading.value = false
    }
}

async function getBranches() {
    try {
        const { data } = await BranchesAPI.list({ include_inactive: 1 })
        branches.value = data.data || []
    } catch (error) {
        console.error('Error fetching branches:', error)
    } finally {
        loadingBranches.value = false
    }
}

async function getActivity(more = false) {
    if (!person.value) return
    loadingActivity.value = true
    try {
        const params = { actor: `user:${person.value.user_id}`, page: activityPage.value, per_page: 20 }
        if (actKind.value) params.kind = actKind.value
        if (actQ.value.trim()) params.q = actQ.value.trim()
        if (actFrom.value) params.from = format(actFrom.value, 'yyyy-MM-dd')
        if (actTo.value) params.to = format(actTo.value, 'yyyy-MM-dd')
        const { data } = await ActivityAPI.list(params)
        activity.value = more ? [...activity.value, ...(data.data || [])] : (data.data || [])
        activityLastPage.value = data.meta?.last_page || 1
        activityTotal.value = data.meta?.total ?? activity.value.length
    } catch (error) {
        console.error('Error fetching their activity:', error)
    } finally {
        loadingActivity.value = false
    }
}
function reloadActivity() { activityPage.value = 1; selectedEvent.value = null; getActivity() }

// ---- Activity filters ----
// Search waits for typing to pause
let actSearchTimer = null
function onActSearch() {
    clearTimeout(actSearchTimer)
    actSearchTimer = setTimeout(reloadActivity, 400)
}
function setActKind(k) { actKind.value = k; reloadActivity() }

// The picker sets from and to one after the other; one reload covers both
let actDateTimer = null
watch([actFrom, actTo], () => {
    clearTimeout(actDateTimer)
    actDateTimer = setTimeout(reloadActivity, 50)
})

// "Filters in use": one chip per filter, each with its own ×
const actChips = computed(() => {
    const out = []
    if (actKind.value) out.push({ key: 'kind', label: kindLabel(actKind.value), clear: () => setActKind('') })
    if (actQ.value.trim()) out.push({ key: 'q', label: `"${actQ.value.trim()}"`, clear: () => { actQ.value = ''; reloadActivity() } })
    return out
})
function clearActFilters() {
    actKind.value = ''
    actQ.value = ''
    reloadActivity()
}

// The end of the list, in words (with the dates it covers)
const actEndNote = computed(() => {
    const range = actFrom.value && actTo.value ? ` from ${formatDate(actFrom.value.toISOString())} to ${formatDate(actTo.value.toISOString())}` : ''
    return `Showing all ${activityTotal.value} ${activityTotal.value === 1 ? 'event' : 'events'}${range}`
})
function loadMoreActivity() {
    if (loadingActivity.value || activityPage.value >= activityLastPage.value) return
    activityPage.value++
    getActivity(true)
}

// Rows in the shape Activity.Days draws (all theirs, so no "who" link)
const activityItems = computed(() => activity.value.map((e) => {
    const result = RESULT_META[e.result] || RESULT_META.refused
    return {
        id: e.id, at: e.at,
        initials: initialsOf(e.who), tintClass: ROLE_META[person.value?.role]?.tint || 'bg-light text-muted',
        badgeIcon: kindIcon(e.kind, true),
        who: e.who, whoClickable: false,
        verb: e.verb, what: e.what,
        meta: [kindLabel(e.kind), e.device, e.location].filter(Boolean).join(' · '),
        reason: e.result !== 'ok' ? e.reason : '',
        pill: e.result === 'ok' ? 'Done' : 'Refused', pillBg: result.bg, pillFg: result.fg,
        raw: e,
    }
}))

// ---- The event panel (the Activity Log's own) ----
function eventAside() {
    const el = document.getElementById('staffActivityAside')
    return el ? window.bootstrap.Offcanvas.getOrCreateInstance(el) : null
}
function openEvent(it) {
    const e = it?.raw || it
    if (!e?.event_id) return      // not copied to the full log yet (nightly backfill)
    selectedEvent.value = e
    eventAside()?.show()
}
function onNavigate(eventId) {
    selectedEvent.value = activity.value.find((e) => e.event_id === eventId) || selectedEvent.value
}

// ---- Tabs (kept in ?tab= so a refresh stays put) ----
function setTab(tab) {
    activeTab.value = tab
    router.replace({ query: { ...route.query, tab: tab === 'activity' ? undefined : tab, do: undefined } })
}
// "Edit role & access" / "Change counter PIN" from the card
async function openSettings(focus) {
    setTab('access')
    if (focus === 'pin') {
        await nextTick()
        document.getElementById('accPinRow')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        document.getElementById('accPin')?.focus()
    }
}

// ---- Role & access ----
function resetForm() {
    const p = person.value
    if (!p) return
    Object.assign(form, { name: p.name || '', email: p.email || '', role: p.role, branch_scope: [...(p.branch_scope || [])], pin: '' })
    pinConfirm.value = ''
    errors.value = {}
    formKey.value++
}

// Something to save?
const isDirty = computed(() => {
    const p = person.value
    if (!p) return false
    const sameScope = JSON.stringify([...(p.branch_scope || [])].sort()) === JSON.stringify([...form.branch_scope].sort())
    return form.name !== (p.name || '') || form.email !== (p.email || '') || form.role !== p.role || !sameScope || !!form.pin
})

function validate() {
    const e = {}
    if (!form.name) e.name = 'Enter their name.'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'That email doesn\'t look right.'
    if (scopePicker.value && !scopePicker.value.isValid()) e.branch_scope = 'Tick at least one branch, or choose All branches.'
    if (form.pin && !/^\d{4,6}$/.test(form.pin)) e.pin = 'A PIN is 4 to 6 digits.'
    if (form.pin && pinConfirm.value !== form.pin) e.pinConfirm = 'The two PINs don\'t match.'
    errors.value = e
    return !Object.keys(e).length
}

async function saveAccess() {
    if (!validate()) return
    saving.value = true
    try {
        // branch_scope [] means every branch: send null so the API clears it
        const body = { name: form.name, email: form.email || null, role: form.role, branch_scope: form.branch_scope.length ? form.branch_scope : null }
        if (form.pin) body.pin = form.pin
        const { data } = await StaffAPI.update(person.value.id, body)
        person.value = data.data
        resetForm()
        showToast('Saved', `${person.value.name}'s role and access were updated.`)
        reloadActivity()
    } catch (error) {
        console.error('Error updating staff member:', error)
        if (error.response?.status === 422) {
            const e = {}
            for (const [k, v] of Object.entries(error.response.data.errors || {})) e[k.split('.')[0]] = v[0]
            errors.value = e
        } else {
            showError('Could Not Save', error.response?.data?.message || 'Please try again.')
        }
    } finally {
        saving.value = false
    }
}

// ---- Suspend / reactivate / remove ----
function ask(action) {
    actionModal.value?.open(person.value, action)
}
function onActionDone({ person: p, action, data }) {
    if (action === 'remove') {
        router.push('/staff')
        return
    }
    if (data) person.value = data
    showToast(action === 'suspend' ? 'Suspended' : 'Reactivated',
        action === 'suspend' ? `${p.name} can't sign in here until reactivated.` : `${p.name} can sign in again.`)
    reloadActivity()
}

// ---- Toast helpers ----
function showToast(title, message) {
    toastStatus.value = 'success'
    toastTitle.value = title
    toastMessage.value = message
    toastImage.value = successImage
}
function showError(title, message) {
    toastStatus.value = 'error'
    toastTitle.value = title
    toastMessage.value = message
    toastImage.value = errorImage
}

// ---- Lifecycle ----
async function load() {
    activeTab.value = (route.query.tab === 'access' || route.query.do === 'edit') ? 'access' : 'activity'
    activityPage.value = 1
    await getPerson()
    if (!person.value) return
    getActivity()
    if (route.query.added) {
        showToast('Staff Added', person.value.membership_status === 'active'
            ? `${person.value.name} can sign in at the counter now.`
            : `${person.value.name} was added as invited.`)
        router.replace({ query: { ...route.query, added: undefined } })
    }
}

onMounted(() => {
    getBranches()
    load()
})
watch(() => route.params.id, (id) => { if (id) load() })
onBeforeUnmount(() => {
    clearTimeout(actSearchTimer)
    clearTimeout(actDateTimer)
    eventAside()?.hide()
})
</script>

<style scoped>
.nav-tabs .nav-link {
    cursor: pointer;
}
</style>
