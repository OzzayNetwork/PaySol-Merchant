<template>
    <div class="offcanvas offcanvas-end activity-aside" tabindex="-1" :id="id" aria-labelledby="activityEventLabel" style="width: 560px; max-width: 100vw;">

        <!-- Header: who (initials), what happened, "by … · when", the category; the result and previous / next on the right -->
        <div class="offcanvas-header border-bottom align-items-start gap-3">
            <span class="activity-who activity-who-lg flex-shrink-0" :style="{ background: actorTone.tint, color: actorTone.fg }">{{ initials }}</span>
            <div class="flex-grow-1 min-w-0">
                <!-- What happened as the title; "by <who> · when" and the category under it (the log panels' shared look) -->
                <h5 id="activityEventLabel" class="panel-title mb-1">{{ event ? recordTitle(event.verb, event.subject) : 'Event' }}</h5>
                <span v-if="event" class="d-block text-muted font-size-12">
                    by <span class="text-body fw-medium">{{ actorName }}</span><template v-if="event.actor?.role"> ({{ event.actor.role }})</template> · {{ longWhen(event.occurred_at) }}
                </span>
                <span v-if="event" class="d-block text-muted font-size-12">{{ event.category?.label }} › {{ event.type?.label }}<template v-if="event.business"> · {{ event.business.name }}</template></span>
            </div>
            <div class="d-flex align-items-center gap-2 flex-shrink-0">
                <span v-if="event" class="activity-pill" :style="{ background: resultTone.bg, color: resultTone.fg }">{{ resultTone.label }}</span>
                <div v-if="ids.length > 1" class="btn-group" role="group" aria-label="Previous and next event">
                    <button type="button" class="btn btn-light btn-sm waves-effect" :disabled="position <= 0" title="Newer event" @click="go(-1)">
                        <i class="mdi mdi-chevron-left fs-5"></i>
                    </button>
                    <button type="button" class="btn btn-light btn-sm waves-effect" :disabled="position < 0 || position >= ids.length - 1" title="Older event" @click="go(1)">
                        <i class="mdi mdi-chevron-right fs-5"></i>
                    </button>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
        </div>

        <!-- Loading / failed to load -->
        <!-- Skeleton (AGENTS.md 6.9): the panel's own shape while the event loads, not a spinner -->
        <div v-if="loading && !event" class="offcanvas-body p-0" aria-busy="true">
            <div class="activity-section-bar"><SkeletonLoader type="text" :lines="1" height="9px" width="60px" /></div>
            <div class="px-4 py-3 d-flex align-items-center gap-3">
                <SkeletonLoader type="rectangle" width="48px" height="48px" />
                <span class="flex-grow-1"><SkeletonLoader type="text" :lines="1" height="11px" width="45%" /><SkeletonLoader type="text" :lines="1" height="9px" width="30%" margin-top="8px" /></span>
                <SkeletonLoader type="rectangle" width="80px" height="22px" />
            </div>
            <div class="activity-section-bar"><SkeletonLoader type="text" :lines="1" height="9px" width="60px" /></div>
            <div class="px-4 pb-3">
                <div v-for="i in 7" :key="`sk-kv-${i}`" class="kv-row">
                    <SkeletonLoader type="text" :lines="1" height="9px" width="90px" />
                    <SkeletonLoader type="text" :lines="1" height="9px" width="140px" />
                </div>
            </div>
        </div>
        <div v-else-if="loadError" class="offcanvas-body text-center py-5">
            <Icon icon="ri:error-warning-line" class="display-4 text-danger" />
            <h6 class="mt-3 text-black">Could not load this event</h6>
            <p class="text-muted">{{ loadError }}</p>
            <button type="button" class="btn btn-sm btn-white waves-effect" @click="load">Try again</button>
        </div>

        <div v-else-if="event" class="offcanvas-body p-0">
            <!-- Why it failed, was refused or locked someone out -->
            <template v-if="event.reason">
                <div class="activity-section-bar">{{ reasonTitle }}</div>
                <div class="px-4 py-3">
                    <div class="activity-reason">{{ event.reason }}</div>
                </div>
            </template>

            <!-- Change: a row per field, drawn by its type (the API's `changes`, 9 Nov 2026):
                 a logo as small images, a colour as swatches, anything else as text -->
            <template v-if="event.changes?.length">
                <div class="activity-section-bar">Change</div>
                <div class="px-4 py-3 d-flex flex-column gap-3">
                    <div v-for="(c, i) in event.changes" :key="i">
                        <span v-if="c.field" class="d-block text-muted font-size-12 text-capitalize mb-1">{{ fieldLabel(c.field) }}</span>
                        <div class="activity-diff">
                            <div v-for="side in sidesOf(c)" :key="side.label" :class="{ 'is-after': side.after }">
                                <span class="filter-list-title d-block p-0 mb-1">{{ side.label }}</span>
                                <span v-if="c.type === 'image'" class="history-thumb history-thumb-lg">
                                    <img v-if="side.url" :src="side.url" :alt="`${side.label} logo`" loading="lazy"><small v-else>No logo</small>
                                </span>
                                <span v-else-if="c.type === 'color' && side.value" class="text-black fw-medium">
                                    <span class="history-swatch" :style="{ background: side.value }"></span>{{ String(side.value).toUpperCase() }}
                                </span>
                                <span v-else class="text-black fw-medium text-break history-value">{{ show(side.value) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
            <!-- An older answer without `changes`: before and after as text -->
            <template v-else-if="event.before || event.after">
                <div class="activity-section-bar">Change</div>
                <div class="px-4 py-3 activity-diff">
                    <div><span class="filter-list-title d-block p-0 mb-1">Before</span><span class="text-black fw-medium text-break">{{ changeText(event.before) }}</span></div>
                    <div class="is-after"><span class="filter-list-title d-block p-0 mb-1">After</span><span class="text-black fw-medium text-break">{{ changeText(event.after) }}</span></div>
                </div>
            </template>

            <!-- Device: the browser's logo (or PaySol's tile for the counter app), name, system and trust -->
            <template v-if="event.device">
                <div class="activity-section-bar">Device</div>
                <div class="px-4 py-3 d-flex align-items-center gap-3">
                    <span class="activity-device-tile" :title="`${event.device.browser} logo`">
                        <Icon v-if="logo" :icon="logo" width="30" height="30" />
                        <span v-else class="activity-device-app">PS</span>
                    </span>
                    <span class="flex-grow-1 min-w-0">
                        <span class="d-block text-black fw-semibold font-size-14">{{ [event.device.browser, event.device.version].filter(Boolean).join(' ') }}</span>
                        <span class="text-muted font-size-12">{{ [event.device.os, DEVICE_KIND[event.device.kind]].filter(Boolean).join(' · ') }}</span>
                    </span>
                    <span v-if="trustTone" class="activity-pill" :style="{ background: trustTone.bg, color: trustTone.fg }">{{ trustTone.label }}</span>
                </div>
            </template>

            <!-- The record -->
            <div class="activity-section-bar">Record</div>
            <div class="px-4 pb-3">
                <div v-for="r in recordRows" :key="r.k" class="kv-row">
                    <span class="text-muted">{{ r.k }}</span>
                    <span class="text-black text-end text-break" :class="{ 'font-monospace small': r.mono }">{{ r.v }}</span>
                </div>
            </div>
        </div>

        <!-- Footer: one line (short labels, full meaning in the titles), as on the other log panels -->
        <div v-if="event" class="offcanvas-footer border-top px-4 py-3 d-flex gap-2 align-items-center flex-nowrap">
            <button v-if="showFilters && event.actor?.id && event.actor?.type !== 'system'" type="button" class="btn btn-white waves-effect text-nowrap"
                :title="`Show only ${event.actor.name}'s activity`"
                @click="emit('filter', { actor: event.actor.type, actor_id: event.actor.id, label: event.actor.name })">
                <Icon icon="ri:user-line" class="me-1" />By {{ (event.actor.name || 'them').split(' ')[0] }}
            </button>
            <button v-else-if="showFilters && event.actor?.type === 'unknown' && event.ip_address" type="button" class="btn btn-white waves-effect text-nowrap"
                :title="`Show everything from ${event.ip_address}`" @click="emit('filter', { q: event.ip_address, label: event.ip_address })">
                <Icon icon="ri:map-pin-line" class="me-1" />Same address
            </button>
            <router-link v-if="showBusiness && event.business" :to="`/tenants/${event.business.id}`" class="btn btn-white waves-effect text-nowrap"
                :title="`Open ${event.business.name}`">
                <Icon icon="ri:store-2-line" class="me-1" />Business
            </router-link>
            <button type="button" class="btn btn-light waves-effect text-nowrap ms-auto" data-bs-dismiss="offcanvas">Close</button>
        </div>
    </div>
</template>

<script setup>
// ---------------------------------------------------------------
// ActivityEvent.aside — one Activity log event in full (9 Nov 2026), from
// the right like the console's other asides. Reads GET /admin/activity/{id};
// opening an event is not itself logged.
//
// Sections: why it failed (when it did), before / after, Device (the
// browser's logo from Iconify's "logos" set, name and version, system and
// kind, trusted / seen before / new), then the record (who, what, IP,
// approximate place, request ID, the log it came from, kept until).
//
// Props:  id (the offcanvas element id), eventId, ids (the list's ids, for
//         previous / next), preview (a full event object; skips the request,
//         used by the test page)
// Emits:  navigate(id), closed, filter({ actor, actor_id } | { q }, label)
// ---------------------------------------------------------------
import { ref, computed, watch, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import ActivityAPI from '@/api/activity'
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue'
import {
    RESULT_META, ACTOR_META, TRUST_META, DEVICE_KIND, browserLogo, initialsOf, longWhen, changeText, recordTitle,
} from '../helpers/activityMeta'

const props = defineProps({
    id: { type: String, default: 'activityEventAside' },
    eventId: { type: [Number, String], default: null },
    ids: { type: Array, default: () => [] },
    preview: { type: Object, default: null },
    // How to load one event. Default: the Activity log (needs audit.view). A team
    // member's page passes (id) => AdminsAPI.activityEvent(adminId, id) (team.view).
    fetcher: { type: Function, default: null },
    // "By X" / "Same address" filter the Activity log; off where the list is already one person's
    showFilters: { type: Boolean, default: true },
    // "Business" opens the business; off on that business's own page
    showBusiness: { type: Boolean, default: true },
})
const emit = defineEmits(['navigate', 'closed', 'filter'])

const event = ref(null)
const loading = ref(false)
const loadError = ref('')

// Answers can arrive out of order when someone clicks through quickly
let seq = 0
async function load() {
    if (props.preview) { event.value = props.preview; return }
    if (!props.eventId) { event.value = null; return }
    const mine = ++seq
    loading.value = true
    loadError.value = ''
    event.value = null      // the skeleton shows for the new event, never the previous one's facts
    try {
        const { data } = await (props.fetcher ? props.fetcher(props.eventId) : ActivityAPI.get(props.eventId))
        if (mine === seq) event.value = data.data
    } catch (error) {
        if (mine !== seq) return
        event.value = null
        loadError.value = error.response?.status === 404 ? 'This event is no longer kept.' : error.response?.data?.message || 'Please try again.'
    } finally {
        if (mine === seq) loading.value = false
    }
}
watch(() => [props.eventId, props.preview], load)

const position = computed(() => props.ids.indexOf(props.eventId))
function go(step) {
    const next = props.ids[position.value + step]
    if (next !== undefined) emit('navigate', next)
}

const initials = computed(() => initialsOf(event.value?.actor))
// "by …": the person, "PaySol" for the system, "someone (not signed in)" for a failed sign-in
const actorName = computed(() => event.value?.actor?.name
    || (event.value?.actor?.type === 'unknown' ? 'someone (not signed in)' : 'PaySol'))
const actorTone = computed(() => ACTOR_META[event.value?.actor?.type] || ACTOR_META.system)
const resultTone = computed(() => RESULT_META[event.value?.result] || RESULT_META.ok)
const trustTone = computed(() => TRUST_META[event.value?.device?.trust] || null)
const logo = computed(() => browserLogo(event.value?.device?.browser))

// A change's field and values in words; its two sides (before / after, with a logo's URL)
const fieldLabel = (f) => String(f).replace(/_id$/, '').replace(/_/g, ' ')
const show = (v) => (v === null || v === undefined || v === '' ? '-' : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v)
const sidesOf = (c) => [
    { label: 'Before', after: false, value: c.before, url: c.before_url },
    { label: 'After', after: true, value: c.after, url: c.after_url },
]

const reasonTitle = computed(() => ({
    locked: 'Why they were locked out', failed: 'Why it failed', refused: 'Why it was refused',
}[event.value?.result] || 'Reason given'))

// Where the event was first written, in words
const SOURCES = {
    admin_auth_logs: 'Team sign-in log', tenant_activities: 'Business activity', setting_audits: 'Settings history',
    contact_audits: 'Contacts history', outbound_messages: 'Messages', lead_activities: 'Lead activity',
    catalogue_products: 'Product catalogue', registry_businesses: 'Business registry', areas: 'Areas',
}

const recordRows = computed(() => {
    const e = event.value
    if (!e) return []
    const who = [e.actor?.name || (e.actor?.type === 'unknown' ? 'Someone (not signed in)' : 'PaySol'), e.actor?.role, e.business?.name].filter(Boolean).join(' · ')
    const kept = e.kept_until ? new Date(e.kept_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
    return [
        { k: 'Who', v: who },
        { k: 'What', v: e.event_key || '—', mono: true },
        { k: 'IP address', v: e.ip_address || '—', mono: true },
        { k: 'Approximate place', v: e.location || '—' },
        { k: 'Request ID', v: e.request_id || '—', mono: true },
        { k: 'Recorded in', v: SOURCES[e.source] || e.source || '—' },
        { k: 'Kept until', v: kept },
    ]
})

onMounted(() => {
    document.getElementById(props.id)?.addEventListener('hidden.bs.offcanvas', () => emit('closed'))
    load()
})
</script>
