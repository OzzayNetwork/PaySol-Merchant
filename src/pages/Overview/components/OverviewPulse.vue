<script setup>
// ---------------------------------------------------------------
// OverviewPulse — "Pulse", the Overview's side panel, as the V11 design draws
// it (docs/paysol-operations-overview-v11.html, renderRail):
//
//   ● Pulse · today                                   [expand] [···]
//   Critical issues                                          [refresh]
//   ⚠ Open                         2 urgent  3 warnings  1 to do
//   ▢ Mama Pima Bar                              Payment failed
//   …                                                 View all 6
//   Quick actions
//   Services                                          5/7 working
//   [PS] PaySol Core  API, database & scheduled jobs          99.8%
//   ✱ Need a look                                   1 down  1 slow
//   (expanded: every service with its last 24 hourly checks and uptime)
//   ✉ SMS balance                                       KES 1,240
//   ███████░░░|░|░  (warning and critical marks)
//   View all in Integrations
//
// Presentational: the page fetches GET /admin/overview/pulse and passes it in
// (`pulse`), so this panel can also be shown on /test-page with sample data.
// The backend already left out what the admin may not see.
//
// Issues: worst first; the counts line filters the list (in the browser).
// Collapsed it shows 4; expanded (`wide`) up to 10, each with a detail line and
// an action. A business or service opens its "More info" pop-up (the page
// owns the pop-ups); other issues (lead follow-ups) go to their page.
//
// Emits: toggle-wide, refresh, open-business (tenant id), open-integration
// (key), open-core. Look: custom.css 28 and 32 (.sp-core, .sp-svc, .sp-mini).
// ---------------------------------------------------------------

// Components
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue'
import AnimatedNumber from '@/components/AnimatedNumber.vue'

// Utils
import { smartDate, formatDateTime } from '@/utils/dates'
import { formatKES } from '@/utils/currency'
import { SEVERITY, issueIcon, CHECK_LABELS, STATE_COLOR } from '../helpers/overviewMeta'

const props = defineProps({
    pulse: { type: Object, default: null },
    loading: { type: Boolean, default: false },
    refreshing: { type: Boolean, default: false },   // a background poll is running
    wide: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-wide', 'refresh', 'open-business', 'open-integration', 'open-core'])
const router = useRouter()

// Severity filter (null = all)
const severity = ref(null)

// ---- Issues ----
const attention = computed(() => props.pulse?.attention || { counts: { critical: 0, warning: 0, info: 0, total: 0 }, items: [], more: 0 })
const filtered = computed(() => (severity.value ? attention.value.items.filter((i) => i.severity === severity.value) : attention.value.items))
const shown = computed(() => filtered.value.slice(0, props.wide ? 10 : 4))
const listTotal = computed(() => (severity.value ? attention.value.counts[severity.value] : attention.value.counts.total) || 0)
const hiddenCount = computed(() => Math.max(0, listTotal.value - shown.value.length))

function toggleSeverity(key) {
    severity.value = severity.value === key ? null : key
}

// A business or service opens its pop-up; anything else goes to its page
function openIssue(item) {
    if (item.source === 'business') return emit('open-business', Number(String(item.id).split(':')[1]))
    if (item.source === 'integration') return emit('open-integration', item.code)
    router.push({ path: item.link?.path || '/', query: item.link?.query || {} })
}
// The action word in the expanded panel
const actionOf = (item) => ({ business: 'Open', integration: 'Check', leads: 'Call' }[item.source] || 'Open')
const ageOf = (iso) => (iso ? `open ${smartDate(iso).toLowerCase()}` : '')

// ---- Services ----
const services = computed(() => props.pulse?.services || null)
const liveCount = computed(() => (services.value ? services.value.counts.working + services.value.counts.attention : 0))
const down = computed(() => (services.value?.items || []).filter((i) => i.state === 'down'))
const slow = computed(() => (services.value?.items || []).filter((i) => i.state === 'degraded' || i.state === 'unchecked'))
const core = computed(() => services.value?.core || null)
const pct = (v) => (v === null || v === undefined ? '—' : `${v}%`)

// SMS bar: balance against the top-up target, with the alert marks
const sms = computed(() => services.value?.sms || null)
const smsMax = computed(() => Math.max(sms.value?.target || 0, sms.value?.balance || 0, sms.value?.warn_at || 0, 1))
const smsPct = (v) => `${Math.min(100, Math.max(0, ((v || 0) / smsMax.value) * 100))}%`
const smsTone = computed(() => {
    const s = sms.value
    if (!s || s.balance === null) return '#9a9aa3'
    if (s.critical_at !== null && s.balance <= s.critical_at) return '#c0392b'
    if (s.warn_at !== null && s.balance <= s.warn_at) return '#b7791f'
    return '#1e8e3e'
})
const kes = (n) => formatKES(Math.round(n), { showDecimals: false })

// Quick-action icons come as a base name ("ri:store-2"); idle icons are outline
const outline = (icon) => (/-(line|fill|regular|filled)$/.test(icon) ? icon : icon.startsWith('fluent:') ? `${icon}-regular` : `${icon}-line`)

// ---- The ··· menu ----
const menuOpen = ref(false)
const menuEl = ref(null)
function onDocClick(e) { if (menuOpen.value && menuEl.value && !menuEl.value.contains(e.target)) menuOpen.value = false }
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
    <section class="sp-card" :aria-busy="loading || refreshing">
        <!-- Head: the live dot, the name, expand / collapse, more -->
        <div class="sp-head">
            <span class="d-flex align-items-center gap-2">
                <span class="sp-pulse" aria-hidden="true"></span>
                <span class="fw-semibold">{{ pulse?.title || 'Pulse' }}</span>
                <span class="sp-muted">· {{ pulse?.scope === 'mine' ? 'your day' : 'today' }}</span>
            </span>
            <span ref="menuEl" class="d-flex align-items-center position-relative">
                <button type="button" class="sp-icon-btn" :title="wide ? 'Collapse Pulse' : 'Expand Pulse'" :aria-label="wide ? 'Collapse Pulse' : 'Expand Pulse'" @click="emit('toggle-wide')">
                    <Icon :icon="wide ? 'ri:contract-right-line' : 'ri:expand-left-line'" />
                </button>
                <button type="button" class="sp-icon-btn" title="More" aria-label="More" aria-haspopup="menu" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">
                    <Icon icon="ri:more-fill" />
                </button>
                <Transition name="fade">
                    <div v-if="menuOpen" class="dropdown-menu dropdown-menu-end show dp-grain-menu" role="menu">
                        <button type="button" class="dropdown-item d-flex align-items-center gap-2" @click="menuOpen = false; emit('refresh')"><Icon icon="ri:refresh-line" />Check again now</button>
                        <router-link to="/integrations" class="dropdown-item d-flex align-items-center gap-2"><Icon icon="fluent:puzzle-piece-24-regular" />Open Integrations</router-link>
                        <router-link to="/site-identity/service-checks" class="dropdown-item d-flex align-items-center gap-2"><Icon icon="ri:pulse-line" />Open Service Checks</router-link>
                    </div>
                </Transition>
            </span>
        </div>

        <!-- Skeleton: the first load only (later polls keep the panel on screen) -->
        <template v-if="loading && !pulse">
            <div v-for="n in 6" :key="n" class="d-flex align-items-center gap-3 px-2 py-2">
                <SkeletonLoader type="circle" width="18px" height="18px" />
                <SkeletonLoader type="text" width="60%" height="12px" />
            </div>
        </template>

        <template v-else-if="pulse">
            <!-- ===== Critical issues ===== -->
            <div class="sp-section">
                <span>Critical issues</span>
                <button type="button" class="sp-icon-btn" :title="pulse.checked_at ? `Checked ${formatDateTime(pulse.checked_at)}. Check again` : 'Check again'" aria-label="Check again" @click="emit('refresh')">
                    <Icon icon="ri:refresh-line" :class="{ 'spin-slow': refreshing }" />
                </button>
            </div>

            <!-- Counts: coloured, and each one filters the list -->
            <div class="sp-row">
                <Icon icon="ri:alarm-warning-line" />
                <span class="sp-text">Open</span>
                <span class="sp-counts">
                    <button
                        v-for="(meta, key) in SEVERITY"
                        :key="key"
                        type="button"
                        class="sp-count"
                        :class="{ 'is-on': severity === key }"
                        :style="{ color: meta.color }"
                        :title="severity === key ? 'Show all' : `Only ${meta.count}`"
                        @click="toggleSeverity(key)"
                    >
                        <AnimatedNumber :value="attention.counts[key] || 0" :duration="500" /> {{ meta.count }}
                    </button>
                </span>
            </div>

            <!-- Issue rows -->
            <TransitionGroup name="fade" tag="div">
                <button
                    v-for="item in shown"
                    :key="item.id"
                    type="button"
                    class="sp-row"
                    :title="[item.detail, item.meta, ageOf(item.since)].filter(Boolean).join(' · ') || 'More info'"
                    @click="openIssue(item)"
                >
                    <Icon :icon="issueIcon(item)" :style="{ color: SEVERITY[item.severity]?.color }" />
                    <span class="sp-text">
                        <span class="d-block text-truncate">{{ item.title }}</span>
                        <span v-if="wide" class="sp-sub">{{ [item.detail, item.meta, ageOf(item.since)].filter(Boolean).join(' · ') }}</span>
                    </span>
                    <span class="sp-value">
                        <span :style="{ color: SEVERITY[item.severity]?.color }">{{ item.reason }}</span>
                        <span v-if="wide" class="sp-act text-primary">{{ actionOf(item) }}</span>
                    </span>
                </button>
            </TransitionGroup>
            <div v-if="!shown.length" class="sp-empty">Nothing here right now.</div>

            <!-- More than fits: expand the panel; a filter can be cleared -->
            <button v-if="hiddenCount > 0" type="button" class="sp-row sp-more" @click="wide ? router.push('/tenants?tab=attention') : emit('toggle-wide')">
                <Icon icon="ri:list-check" />
                <span class="sp-text">View all {{ listTotal }}</span>
            </button>
            <button v-else-if="severity" type="button" class="sp-row sp-more" @click="severity = null">
                <Icon icon="ri:list-check" />
                <span class="sp-text">Show all {{ attention.counts.total }}</span>
            </button>

            <!-- ===== Quick actions (only ones this admin can use) ===== -->
            <template v-if="pulse.quick_actions?.length">
                <div class="sp-section"><span>Quick actions</span></div>
                <router-link
                    v-for="action in pulse.quick_actions"
                    :key="action.key"
                    :to="{ path: action.path, query: action.query || {} }"
                    class="sp-row"
                >
                    <Icon :icon="outline(action.icon)" class="text-primary" />
                    <span class="sp-text">{{ action.label }}</span>
                    <Icon icon="ri:arrow-right-s-line" class="sp-muted" />
                </router-link>
            </template>

            <!-- ===== Services ===== -->
            <template v-if="services">
                <div class="sp-section">
                    <span>Services</span>
                    <span class="sp-muted">{{ services.counts.working }}/{{ liveCount }} working</span>
                </div>

                <!-- PaySol's own platform first; click for the parts and their checks -->
                <button v-if="core" type="button" class="sp-core" title="More info" @click="emit('open-core')">
                    <span class="sp-core-logo">PS</span>
                    <span class="flex-grow-1 min-w-0">
                        <span class="d-block fw-semibold text-truncate">{{ core.name }}</span>
                        <span class="d-block sp-muted text-truncate" style="font-size: 11.5px">{{ core.sub }}</span>
                    </span>
                    <span class="fw-semibold" :style="{ color: STATE_COLOR[core.state], fontSize: '12.5px' }" title="Up in the last 24 hours">{{ pct(core.up_pct_24h) }}</span>
                </button>

                <!-- Broken services already show under Critical issues: one summary line here -->
                <div v-if="down.length || slow.length" class="sp-row" :title="[...down, ...slow].map((i) => `${i.name}: ${i.status_label}`).join('\n')">
                    <Icon icon="fluent:puzzle-piece-24-regular" />
                    <span class="sp-text">Need a look</span>
                    <span class="sp-value">
                        <span v-if="down.length" :style="{ color: STATE_COLOR.down }">{{ down.length }} down</span>
                        <span v-if="slow.length" :style="{ color: STATE_COLOR.degraded }">{{ slow.length }} slow</span>
                    </span>
                </div>

                <!-- Expanded: every live service with its last 24 hourly checks -->
                <TransitionGroup v-if="wide" name="fade" tag="div">
                    <button v-for="item in services.items" :key="item.key" type="button" class="sp-svc" :title="`${item.name}: ${item.status_label}`" @click="emit('open-integration', item.key)">
                        <span class="sp-text">{{ item.name }}</span>
                        <span class="sp-mini" aria-hidden="true">
                            <i v-for="(c, n) in item.checks_24h || []" :key="n" :class="`check-${c}`" :title="CHECK_LABELS[c]"></i>
                        </span>
                        <span class="sp-muted sp-up">{{ pct(item.up_pct_24h) }}</span>
                    </button>
                </TransitionGroup>

                <!-- SMS balance with its alert marks -->
                <button v-if="sms" type="button" class="sp-limit" title="More info" @click="emit('open-integration', 'sms')">
                    <span class="sp-row">
                        <Icon icon="ri:message-2-line" />
                        <span class="sp-text">SMS balance</span>
                        <span class="sp-value" :style="{ color: smsTone }">
                            <template v-if="sms.balance !== null">{{ sms.currency }} <AnimatedNumber :value="sms.balance" /></template>
                            <template v-else>{{ sms.reading || 'Not read' }}</template>
                        </span>
                    </span>
                    <span class="sp-bar d-block" :title="sms.target ? `Top-up target ${kes(sms.target)}` : ''">
                        <span :style="{ width: smsPct(sms.balance), background: smsTone }"></span>
                        <span v-if="sms.critical_at" class="sp-mark" :style="{ left: smsPct(sms.critical_at), background: '#c0392b' }" :title="`Critical alert at ${kes(sms.critical_at)}`"></span>
                        <span v-if="sms.warn_at" class="sp-mark" :style="{ left: smsPct(sms.warn_at), background: '#b7791f' }" :title="`Warning alert at ${kes(sms.warn_at)}`"></span>
                    </span>
                    <span class="sp-note d-block">
                        <template v-if="sms.days_left">{{ sms.days_left }} · </template>alert below {{ sms.warn_at !== null ? kes(sms.warn_at) : '—' }}
                    </span>
                    <span v-if="sms.state === 'down'" class="sp-note d-block">Last read {{ sms.checked_at ? smartDate(sms.checked_at) : 'never' }}; the key is failing now</span>
                </button>

                <router-link to="/integrations" class="sp-row sp-more">
                    <Icon icon="ri:arrow-right-line" />
                    <span class="sp-text">View all in Integrations</span>
                </router-link>
            </template>
        </template>

        <!-- The request failed and there is nothing to show -->
        <div v-else class="sp-empty">Pulse could not load. <button type="button" class="btn btn-link btn-sm p-0 align-baseline" @click="emit('refresh')">Try again</button></div>
    </section>
</template>

<style scoped>
/* The refresh icon turns while a check runs */
.spin-slow { animation: pulseSpin 1s linear infinite; }
@keyframes pulseSpin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spin-slow { animation: none; } }
</style>
