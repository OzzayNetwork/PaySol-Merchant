<template>
    <!-- Page title, as on every page -->
    <div class="row">
        <div class="col-12">
            <div class="page-title-box d-sm-flex align-items-center justify-content-between">
                <h4 class="mb-sm-0 font-size-18">Activity Log</h4>
                <div class="page-title-right">
                    <ol class="breadcrumb m-0">
                        <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
                        <li class="breadcrumb-item active">Activity Log</li>
                    </ol>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <!-- ================= Left: the trail ================= -->
        <div class="col-xl-8">
            <div class="card">
                <!-- Toolbar: refresh, search, filters, date range, export -->
                <div class="card-body border-bottom">
                    <div class="d-flex flex-wrap gap-2 gap-md-3 align-items-center">
                        <!-- Refresh -->
                        <div>
                            <button @click="reload()" type="button"
                                class="btn waves-effect btn-lg btn-light position-relative p-0 avatar-sm rounded-circle">
                                <span class="avatar-title bg-transparent text-reset">
                                    <Icon title="Refresh the activity" icon="boxicons:refresh-ccw" class="fs-4" />
                                </span>
                            </button>
                        </div>

                        <!-- Search: what, key or person. Fills the bar, never below 200px -->
                        <div class="flex-grow-1" style="min-width: 200px;">
                            <div class="search-box mb-0 me-0">
                                <div class="position-relative">
                                    <form @submit.prevent="reload()" class="input-group bg-light rounded pb-0 flex-nowrap">
                                        <div class="flex-grow-1">
                                            <input style="border-radius: 0px; padding-right: 35px;" type="text"
                                                class="form-control bg-light rounded flex-grow-1"
                                                placeholder="Search: product, person, setting..." spellcheck="false"
                                                aria-label="Search activity" v-model="q" @input="onSearch">
                                            <i class="bx bx-search-alt search-icon fs-4"></i>
                                            <i v-if="q != ''" title="Clear search" style="right: 15px; left:unset;"
                                                class="mdi mdi-close search-icon cursor-pointer fs-3 waves-effect"
                                                @click="q = ''; reload();"></i>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <!-- Phones & tablets: every filter in one menu -->
                        <div class="position-relative d-flex d-lg-none">
                            <button type="button" title="Filter the activity"
                                class="btn btn-light waves-effect position-relative p-0 avatar-sm rounded-circle"
                                data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                                <span class="avatar-title bg-transparent text-reset"><i class="mdi mdi-filter-variant fs-4"></i></span>
                                <span v-if="kind || actor" class="filter-dot"></span>
                            </button>
                            <div class="dropdown-menu dropdown-menu-end p-2" style="min-width: 240px; max-height: 70vh; overflow-y: auto;">
                                <h6 class="dropdown-header">Kind</h6>
                                <a v-for="k in kindOptions" :key="`m-${k.key}`" href="javascript:void(0);" class="dropdown-item"
                                    :class="{ active: kind === k.key }" @click="setKind(k.key)">{{ k.label }}</a>
                                <div class="dropdown-divider"></div>
                                <h6 class="dropdown-header">Who</h6>
                                <a v-for="a in ACTOR_OPTIONS" :key="`m-${a.key}`" href="javascript:void(0);" class="dropdown-item"
                                    :class="{ active: actor === a.key }" @click="setActor(a.key)">{{ a.label }}</a>
                            </div>
                        </div>

                        <!-- Kind filter -->
                        <div class="position-relative d-lg-flex d-none">
                            <button class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <Icon :icon="kindIcon(kind, !!kind)" class="fs-4" />
                                <span>{{ kind ? kindLabel(kind) : 'Kind' }}</span>
                                <i class="mdi mdi-chevron-down fs-4"></i>
                            </button>
                            <div class="dropdown-menu p-2" style="min-width: 220px;">
                                <a v-for="k in kindOptions" :key="k.key" href="javascript:void(0);" class="dropdown-item d-flex align-items-center gap-2"
                                    :class="{ active: kind === k.key }" @click="setKind(k.key)">
                                    <Icon :icon="kindIcon(k.key, kind === k.key)" class="fs-5" /> {{ k.label }}
                                    <span v-if="k.count" class="ms-auto text-muted small">{{ k.count }}</span>
                                </a>
                            </div>
                        </div>

                        <!-- Who filter: fixed choices, then the people active lately -->
                        <div class="position-relative d-lg-flex d-none">
                            <button class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <Icon :icon="actor ? 'ri:user-3-fill' : 'ri:user-3-line'" class="fs-4" />
                                <span class="text-truncate" style="max-width: 160px;">{{ personName || ACTOR_OPTIONS.find(a => a.key === actor)?.short || 'Who' }}</span>
                                <i class="mdi mdi-chevron-down fs-4"></i>
                            </button>
                            <div class="dropdown-menu p-2" style="min-width: 220px;">
                                <a v-for="a in ACTOR_OPTIONS" :key="a.key" href="javascript:void(0);" class="dropdown-item"
                                    :class="{ active: actor === a.key && !personName }" @click="setActor(a.key)">{{ a.label }}</a>
                                <template v-if="people.length">
                                    <div class="dropdown-divider"></div>
                                    <h6 class="dropdown-header">People</h6>
                                    <a v-for="p in people" :key="`who-${p.filter}`" href="javascript:void(0);"
                                        class="dropdown-item d-flex align-items-center gap-2" :class="{ active: actor === p.filter }" @click="setPerson(p.filter, p.name)">
                                        <span class="avatar-xs flex-shrink-0"><span class="avatar-title rounded-circle fw-semibold font-size-11" :class="whoTint(p.type)">{{ nameInitials(p.name) }}</span></span>
                                        {{ p.name }}
                                    </a>
                                </template>
                            </div>
                        </div>

                        <!-- Date range (the shared date picker) -->
                        <div class="position-relative d-flex align-items-center flex-shrink-0 text-nowrap">
                            <DateRangePicker v-model:dateFrom="dateFrom" v-model:dateTo="dateTo" />
                        </div>

                        <!-- Export what is loaded -->
                        <div class="d-lg-flex d-none">
                            <button type="button" class="d-flex align-items-center fw-bold btn btn-light waves-effect gap-2"
                                :disabled="!events.length" @click="exportCsv" title="Download what is loaded as a CSV">
                                <i class="bx bx-download fs-4"></i><span>Export</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- "Showing X of Y" and the filters in use -->
                <div class="card-body py-2 border-bottom d-flex flex-wrap align-items-center gap-2 font-size-13">
                    <div v-if="loading && !events.length"><SkeletonLoader type="text" :lines="1" height="10px" width="150px" /></div>
                    <span v-else class="text-muted">Showing <span class="fw-bold text-black">{{ events.length }}</span> of <span class="fw-bold text-black">{{ total }}</span> events</span>
                    <template v-if="chips.length">
                        <span class="text-muted">· Filters in use:</span>
                        <span v-for="c in chips" :key="c.key"
                            class="badge rounded-pill bg-primary bg-soft text-primary font-size-12 fw-medium px-2 py-1 d-inline-flex align-items-center gap-1">
                            {{ c.label }}
                            <a href="javascript:void(0);" class="text-primary" :title="`Remove ${c.label}`" @click="c.clear()"><i class="mdi mdi-close"></i></a>
                        </span>
                        <a v-if="chips.length > 1" href="javascript:void(0);" class="ms-1" @click="clearAll">Clear all</a>
                    </template>
                </div>

                <!-- The trail, in the shared day boxes (components/Data-tools/Activity.Days.vue) -->
                <div class="card-body" style="min-height: 50vh;">
                    <ActivityDays :items="items" :loading="loading && page === 1" :loading-more="loading && page > 1"
                        :has-more="hasMore" :selected-id="selected?.id" :end-note="endNote" :skeleton-rows="8"
                        @open="open" @who="(it) => setPerson(it.whoFilter, it.who)" @more="loadMore">
                        <template #empty>
                            <Icon icon="ri:history-line" class="text-black opacity-25" style="font-size: 120px;" />
                            <h4 class="fw-bold text-dark mb-2">{{ hasFilters ? 'Nothing matches' : 'No activity yet' }}</h4>
                            <p class="text-muted mb-0">{{ hasFilters ? 'Nothing matches your search or filters.' : 'What your team does in PaySol will show here.' }}</p>
                        </template>
                    </ActivityDays>
                </div>
            </div>
        </div>

        <!-- ================= Right: the last 30 days ================= -->
        <div class="col-xl-4">
            <!-- By kind -->
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title mb-1">Last 30 days</h4>
                    <p class="text-muted mb-3">Events by kind · refused ones in red</p>
                    <template v-if="loading && !summary">
                        <SkeletonLoader v-for="n in 4" :key="`sk-k-${n}`" type="text" :lines="1" height="14px" class="mb-3" />
                    </template>
                    <p v-else-if="!summary?.by_kind?.length" class="text-muted mb-0">Nothing in the last 30 days.</p>
                    <div v-for="(b, i) in summary?.by_kind || []" :key="b.kind" class="d-flex align-items-center gap-3 py-2"
                        :class="{ 'border-bottom': i < summary.by_kind.length - 1 }">
                        <span class="avatar-xs flex-shrink-0">
                            <span class="avatar-title rounded-circle bg-light text-primary"><Icon :icon="kindIcon(b.kind, kind === b.kind)" class="fs-5" /></span>
                        </span>
                        <a href="javascript:void(0);" class="flex-grow-1 text-black" @click="setKind(b.kind)">{{ kindLabel(b.kind) }}</a>
                        <span><span class="fw-semibold text-black">{{ b.count }}</span><small v-if="b.refused" class="text-danger"> · {{ b.refused }} refused</small></span>
                    </div>
                </div>
            </div>

            <!-- Who's been active -->
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title mb-1">Who's been active</h4>
                    <p class="text-muted mb-3">Last 30 days, most first · click to see only theirs</p>
                    <template v-if="loading && !summary">
                        <SkeletonLoader v-for="n in 3" :key="`sk-p-${n}`" type="text" :lines="1" height="14px" class="mb-3" />
                    </template>
                    <p v-else-if="!summary?.people?.length" class="text-muted mb-0">Nobody yet.</p>
                    <div v-for="(p, i) in summary?.people || []" :key="p.name + p.type" class="d-flex align-items-center gap-3 py-2 activity-person"
                        :class="{ 'border-bottom': i < summary.people.length - 1, 'is-on': actor === p.filter }" role="button"
                        :title="`Show only ${p.name}'s activity`" @click="p.filter && setPerson(actor === p.filter ? '' : p.filter, p.name)">
                        <div class="avatar-xs flex-shrink-0">
                            <span class="avatar-title rounded-circle fw-semibold font-size-11" :class="whoTint(p.type)">{{ nameInitials(p.name) }}</span>
                        </div>
                        <div class="flex-grow-1 min-w-0">
                            <span class="d-block text-black text-truncate">{{ p.name }}</span>
                            <small class="text-muted">{{ p.role }}</small>
                        </div>
                        <span class="fw-semibold text-black">{{ p.count }}</span>
                    </div>
                    <p class="text-muted small mt-3 mb-0">Activity is kept for {{ keptMonths }} months.</p>
                </div>
            </div>
        </div>
    </div>

    <!-- On <body>, out of the .row (its gutters would land on the off-canvas) -->
    <Teleport to="body">
        <ActivityEventAside id="businessActivityAside" :eventId="selected?.event_id || null" :preview="selectedPreview"
            :ids="events.map(e => e.event_id).filter(Boolean)" :fetcher="ActivityAPI.get"
            :showBusiness="false" @navigate="onNavigate" @filter="onPanelFilter" @closed="selected = null" />
    </Teleport>

    <ImageToast :status="toastStatus" :title="toastTitle" :message="toastMessage" :image="toastImage"
        :imageHeight="70" @hide="toastStatus = null" />
</template>

<script setup>
// ---------------------------------------------------------------
// ActivityLog.List — the business's Activity Log (owner and manager only).
//
// Reads GET /tenant/activity: everything that happened in this business
// (sales, products, staff, settings, sign-ins, setup, subscription), newest
// first, 30 at a time ("Load older activity"). PaySol staff who touched the
// business show as "PaySol team" (the API hides who, and their device).
// Built from the console's per-business Activity tab so both look the same:
// toolbar (refresh, search, Kind / Who, date range, Export), "Showing X of Y"
// with the filters in use, the shared day boxes (Activity.Days), and on the
// right the last 30 days by kind and the most active people.
// A row opens ActivityEvent.aside, loaded through GET /tenant/activity/{id}.
// ---------------------------------------------------------------
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { subDays, format } from 'date-fns'

import ActivityAPI from '@/api/activity'
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue'
import ImageToast from '@/components/ImageToast.vue'
import DateRangePicker from '@/components/DatePickers/datePicker.facebookstyle.vue'
import ActivityDays from '@/components/Data-tools/Activity.Days.vue'
import ActivityEventAside from '@/pages/ActivityLog/components/ActivityEvent.aside.vue'
import { formatDate } from '@/utils/dates'
import { RESULT_META } from '@/pages/ActivityLog/helpers/activityMeta'
import { KIND_LABELS, ACTOR_OPTIONS, kindLabel, kindIcon, whoTint, nameInitials } from '@/pages/ActivityLog/helpers/businessActivity'
import errorImage from '@/assets/images/icons/error.png'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// ---- State ----
const events = ref([])
const loading = ref(false)
const page = ref(1)
const lastPage = ref(1)
const total = ref(0)                // matching the filters
const summary = ref(null)
const keptMonths = ref(12)
const selected = ref(null)

// Filters
const kind = ref('')
const actor = ref('')
const personName = ref('')          // set when the filter is one person
const dateFrom = ref(subDays(new Date(), 29))   // the last 30 days by default
const dateTo = ref(new Date())
const q = ref('')

const hasMore = computed(() => page.value < lastPage.value)
const hasFilters = computed(() => !!(kind.value || actor.value || q.value.trim()))

// Toast
const toastStatus = ref(null)
const toastTitle = ref('')
const toastMessage = ref('')
const toastImage = ref(null)
function showError(title, message) {
    toastStatus.value = 'error'
    toastTitle.value = title
    toastMessage.value = message
    toastImage.value = errorImage
}

// ---- Fetch ----
async function getActivity(more = false) {
    loading.value = true
    try {
        const params = { page: page.value, per_page: 30 }
        if (kind.value) params.kind = kind.value
        if (actor.value) params.actor = actor.value
        if (q.value.trim()) params.q = q.value.trim()
        if (dateFrom.value) params.from = format(dateFrom.value, 'yyyy-MM-dd')
        if (dateTo.value) params.to = format(dateTo.value, 'yyyy-MM-dd')
        const { data } = await ActivityAPI.list(params)
        events.value = more ? [...events.value, ...(data.data || [])] : (data.data || [])
        lastPage.value = data.meta?.last_page || 1
        total.value = data.meta?.total ?? events.value.length
        summary.value = data.meta?.summary || summary.value
        keptMonths.value = data.meta?.kept_months || 12
    } catch (error) {
        console.error('Error fetching activity:', error)
        showError('Could Not Load Activity', error.response?.data?.message || 'Please try again.')
    } finally {
        loading.value = false
    }
}

function reload() {
    page.value = 1
    getActivity()
}

function loadMore() {
    if (!hasMore.value || loading.value) return
    page.value++
    getActivity(true)
}

// Search waits for typing to pause
let searchTimer = null
function onSearch() {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(reload, 400)
}

function setKind(next) {
    kind.value = next
    reload()
}

// ---- Filter options ----
// Kinds with their 30-day counts
const kindOptions = computed(() => {
    const counts = Object.fromEntries((summary.value?.by_kind || []).map(b => [b.kind, b.count]))
    return [
        { key: '', label: 'All kinds' },
        ...Object.keys(KIND_LABELS).map(k => ({ key: k, label: KIND_LABELS[k], count: counts[k] || 0 })),
    ]
})

// Named people only (the PaySol team entry is one of the fixed choices already)
const people = computed(() => (summary.value?.people || []).filter(p => p.filter && p.filter.startsWith('user:')))

function setActor(next) { actor.value = next; personName.value = ''; reload() }

// One person: user:ID, team or system; '' clears it
function setPerson(filter, name) {
    actor.value = filter || ''
    personName.value = filter ? name : ''
    selected.value = null
    reload()
}

// The picker emits from and to one after the other; one reload covers both
let dateTimer = null
watch([dateFrom, dateTo], () => {
    clearTimeout(dateTimer)
    dateTimer = setTimeout(reload, 50)
})

// Rows in the shape Activity.Days draws (it groups them by Nairobi day)
const items = computed(() => events.value.map((e) => {
    const result = RESULT_META[e.result] || RESULT_META.refused
    return {
        id: e.id,
        at: e.at,
        initials: nameInitials(e.who),
        tintClass: whoTint(e.who_type),
        badgeIcon: kindIcon(e.kind, true),
        who: e.who,
        whoFilter: e.who_filter,
        whoClickable: !!e.who_filter,
        verb: e.verb,
        what: e.what,
        meta: [kindLabel(e.kind), e.who_role, e.device, e.location].filter(Boolean).join(' · '),
        reason: e.result !== 'ok' ? e.reason : '',
        pill: e.result === 'ok' ? 'Done' : 'Refused',
        pillBg: result.bg,
        pillFg: result.fg,
        raw: e,
    }
}))

// The end of the list, in words
const endNote = computed(() => {
    if (!events.value.length) return ''
    const range = dateFrom.value && dateTo.value ? ` from ${formatDate(dateFrom.value.toISOString())} to ${formatDate(dateTo.value.toISOString())}` : ''
    return `Showing all ${total.value} ${total.value === 1 ? 'event' : 'events'}${range}`
})

// "Filters in use": one chip per filter, each with its own ×
const chips = computed(() => {
    const out = []
    if (kind.value) out.push({ key: 'kind', label: kindLabel(kind.value), clear: () => setKind('') })
    if (actor.value) out.push({ key: 'who', label: personName.value || ACTOR_OPTIONS.find(a => a.key === actor.value)?.short || 'One person', clear: () => setActor('') })
    if (q.value.trim()) out.push({ key: 'q', label: `"${q.value.trim()}"`, clear: () => { q.value = ''; reload() } })
    return out
})
function clearAll() {
    kind.value = ''
    actor.value = ''
    personName.value = ''
    q.value = ''
    reload()
}

// ---- The side panel (pages/ActivityLog/components/ActivityEvent.aside.vue) ----
function eventAside() {
    const el = document.getElementById('businessActivityAside')
    return el ? window.bootstrap.Offcanvas.getOrCreateInstance(el) : null
}
// Takes a row from Activity.Days (its raw event) or an event
function open(it) {
    selected.value = it?.raw || it
    eventAside()?.show()
}

// A row whose full record is not there yet (event_id null, before the nightly
// backfill): the panel shows what the row has, in the panel's own shape
const selectedPreview = computed(() => {
    const e = selected.value
    if (!e || e.event_id) return null
    return {
        id: e.id, occurred_at: e.at, result: e.result === 'ok' ? 'ok' : 'refused', verb: e.verb, subject: e.what, reason: e.reason,
        actor: { type: e.who_type === 'user' ? 'user' : e.who_type, name: e.who, role: e.who_role },
        category: { label: kindLabel(e.kind) }, type: { label: e.key }, event_key: e.key, changes: e.changes,
        ip_address: e.ip_address, location: e.location, request_id: e.request_id, source: 'tenant_activities',
    }
})

// Previous / next in the panel: the row whose event it is
function onNavigate(eventId) {
    selected.value = events.value.find(e => e.event_id === eventId) || selected.value
}

// "By X" / "Same address" in the panel: filter this page.
// PaySol staff come back anonymised (no id), so they filter as the whole team.
function onPanelFilter(f) {
    eventAside()?.hide()
    if (f.q) { q.value = f.q; reload(); return }
    if (f.actor === 'admin') return setPerson('team', 'PaySol team')
    if (f.actor === 'system') return setPerson('system', 'Automatic')
    if (f.actor === 'user' && f.actor_id) setPerson(`user:${f.actor_id}`, f.label)
}

// ---- Export what is loaded ----
function exportCsv() {
    const rows = [['When', 'Who', 'Role', 'Did', 'What', 'Kind', 'Result', 'Reason', 'Device', 'Place']]
    for (const e of events.value) {
        rows.push([e.at, e.who, e.who_role, e.verb, e.what, kindLabel(e.kind), e.result, e.reason || '', e.device || '', e.location || ''])
    }
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${authStore.tenant?.short_name || 'business'}-activity-${formatDate(new Date().toISOString()).replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
}

// ---- Lifecycle ----
onMounted(getActivity)
onBeforeUnmount(() => {
    clearTimeout(searchTimer)
    clearTimeout(dateTimer)
    eventAside()?.hide()
})
</script>
