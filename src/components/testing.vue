<script setup>
// ---------------------------------------------------------------
// Component reference page for agents and developers.
//
// This page makes no API requests and writes no data. Each example imports the
// real shared component so its props and events stay visible beside usage.
// It is a reference, not a production screen; keep examples safe and local.
// ---------------------------------------------------------------

// Components
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import SelectSearchBox from '@/components/SelectSearchBox.vue'
import DataViewToggle from '@/components/Data-tools/Data.View.Toggle.vue'
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue'
import ActivityDays from '@/components/Data-tools/Activity.Days.vue'

// Activity.Days card: sample rows only (two days, one refused), and a toggle for the loading state
const trailLoading = ref(false)
const trailPicked = ref('')
const trailItems = [
    { id: 1, at: new Date().toISOString(), initials: 'VM', tint: '#E8F0FE', fg: '#2164F3', badgeIcon: 'ri:settings-4-fill', badgeColor: '#495057',
        who: 'Vivian Muthoni', whoClickable: true, verb: 'changed', what: 'business.city', meta: 'Settings · Edge on Windows · Nairobi',
        pill: 'Done', pillBg: '#E3F5EC', pillFg: '#1E7F45' },
    { id: 2, at: new Date().toISOString(), initials: '?', tint: '#FDECEC', fg: '#B42318', badgeIcon: 'ri:shield-check-fill', badgeColor: '#7B4FC9',
        who: 'Someone (not signed in)', verb: 'tried to sign in to', what: 'the console', meta: 'Sign-ins · Chrome on Android',
        reason: 'Wrong password (3rd try)', pill: 'Failed', pillBg: 'rgba(244,106,106,.14)', pillFg: '#B42318' },
    { id: 3, at: new Date(Date.now() - 86400000).toISOString(), initials: 'P', tint: '#EFF2F7', fg: '#495057', badgeIcon: 'ri:store-2-fill', badgeColor: '#5B6B8C',
        who: 'PaySol', verb: 'sent', what: 'a setup reminder', meta: 'Setup · PaySol',
        pill: 'Done', pillBg: '#E3F5EC', pillFg: '#1E7F45' },
]
// Plans pieces (10 Nov 2026): two shared ones in components/Data-tools, the card from pages/Plans
import BillingPeriodSwitch from '@/components/Data-tools/Billing.Period.Switch.vue'
import AvatarStack from '@/components/Data-tools/Avatar.Stack.vue'
import PlanCard from '@/pages/Plans/components/PlanCard.vue'
// Selection actions bar (11 Nov 2026): the File Manager's bar after ticking rows, shared (Tenants uses it)
import SelectionActionsBar from '@/components/Data-tools/Selection.Actions.bar.vue'
const barCount = ref(4)
const barPicked = ref('')
const barActions = [
    { key: 'open', label: 'Open', icon: 'ri:folder-open-line' },
    { key: 'star', label: 'Star', icon: 'ri:star-line' },
    { key: 'remind', label: 'Remind', icon: 'ri:mail-send-line' },
    // An action with choices opens a menu (as Contacts' Add tag)
    { key: 'tag', label: 'Add tag', icon: 'ri:price-tag-3-line', items: [
        { key: 'vip', label: 'VIP', dot: '#F1B44C' }, { key: 'wholesale', label: 'Wholesale', dot: '#34C38F' },
        { divider: true }, { key: 'new', label: 'New tag…', icon: 'ri:add-line' },
    ] },
    { key: 'download', label: 'Download', icon: 'ri:download-2-line' },
    { key: 'delete', label: 'Delete', icon: 'ri:delete-bin-line', danger: true },
]
// Legal & Terms (10 Nov 2026): the shared document dropdown, with the page's own looks
import DocumentPicker from '@/components/Data-tools/Document.Picker.vue'
import { lookOf } from '@/pages/Site.Identity/helpers/legalMeta'

// Legal prompt card (PaySol Business, 11 Nov 2026): two samples in GET /tenant/legal/pending's shape
import LegalPrompt from '@/components/legal/LegalPrompt.vue'
const legalRef = ref(null)
const legalBlockingSample = [
    { key: 'terms', name: 'Terms of Service', version: 3, summary: 'Clearer rules on refunds for M-Pesa payments and on data kept after you leave.', effective_at: '2026-11-01T00:00:00+03:00', blocking: true, public_url: null },
]
const legalLaterSample = [
    { key: 'privacy', name: 'Privacy Policy', version: 2, summary: 'Names the SMS provider that sends your receipts.', effective_at: '2026-12-01T00:00:00+03:00', blocking: false, public_url: null },
]
const legalSample = ref(legalBlockingSample)

// Session timeout warning card (PaySol Business, 18 Nov 2026)
import SessionTimeoutModal from '@/components/guards/SessionTimeoutModal.vue'
const sessionTimeoutRef = ref(null)

// Universal search card (PaySol Business, 18 Nov 2026)
import GlobalSearch from '@/components/search/GlobalSearch.vue'

// Role picker and branch scope picker cards (Staff, 12 Nov 2026): sample data only
import RolePicker from '@/components/Data-tools/Role.Picker.vue'
import BranchScopePicker from '@/components/Data-tools/Branch.Scope.Picker.vue'
import { ROLE_META, ASSIGNABLE_ROLES } from '@/pages/Staff/helpers/staffMeta'
const sampleRole = ref('cashier')
// Pack rows card (Products, 12 Nov 2026): sample data only
import PackRows from '@/components/Data-tools/Pack.Rows.vue'
const samplePacks = ref([{ _key: 1, name: 'Crate', units: 24, selling_price: 5600, cost_price: '', barcode: '' }])
const sampleScope = ref([])
const sampleBranches = [
    { id: 1, name: 'Main (Kasarani)', is_main: true, is_active: true },
    { id: 2, name: 'Westlands', is_main: false, is_active: true },
    { id: 3, name: 'Old Thika Road', is_main: false, is_active: false },
]

// Document.Picker card: the four legal documents with sample status lines, and a loading toggle
const pickedDoc = ref('terms')
const pickerLoading = ref(false)
const pickerItemsSample = [
    { key: 'terms', label: 'Terms of Service', sub: 'v3 · v4 from 10 Dec 2026', ...lookOf('terms') },
    { key: 'privacy', label: 'Privacy Policy', sub: 'v2 · shown, not accepted', ...lookOf('privacy') },
    { key: 'refund', label: 'Refund Policy', sub: 'Draft v1 · not published', ...lookOf('refund') },
    { key: 'dpa', label: 'Data Processing Agreement', sub: 'v1 · acceptance required', ...lookOf('dpa') },
]

// Billing.Period.Switch card: the chosen period, with a saving badge on the longer ones
const samplePeriod = ref('monthly')
const samplePeriods = [
    { key: 'monthly', label: 'Monthly' }, { key: 'quarterly', label: 'Quarterly', badge: 'Save 7%' },
    { key: 'semi_annual', label: '6 months', badge: 'Save 7%' }, { key: 'annual', label: 'Annual', badge: 'Save 8%' },
]
// Avatar.Stack card: a few businesses, a loading toggle and the arrow's message
const stackLoading = ref(false)
const stackPicked = ref('')
const stackItems = [{ id: 1, name: 'Kwa Maina Wines' }, { id: 2, name: 'Club Galaxy' }, { id: 3, name: 'Baraka Hardware' }]
// PlanCard card: a sample plan in the API's shape (GET /admin/plans)
const samplePlan = {
    key: 'standard', name: 'Standard', description: 'For a bar with a few staff', icon: 'star', color: '#2164F3',
    is_free: false, is_quoted: false, is_active: true, is_public: true, user_limit: 5, unlimited_users: false, branch_limit: 1, unlimited_branches: false,
    trial_days: 30, payment_methods: ['m_pesa', 'card'], inherits: 'Free',
    features: ['Tabs with deadlines', 'Staff on every sale', 'M-Pesa matching', 'Daily owner email'],
    prices: [
        { period: 'monthly', offered: true, amount: 500, monthly_equivalent: 500, saving_percent: null },
        { period: 'quarterly', offered: true, amount: 1400, monthly_equivalent: 466.67, saving_percent: 7 },
        { period: 'semi_annual', offered: true, amount: 2800, monthly_equivalent: 466.67, saving_percent: 7 },
        { period: 'annual', offered: true, amount: 5500, monthly_equivalent: 458.33, saving_percent: 8 },
    ],
    businesses: { total: 14, trialing: 3, active: 10, past_due: 1 }, scheduled_price_changes: [],
    last_changed: { at: new Date().toISOString(), by: 'Kelvin N.' },
}
const planPicked = ref('')
import ImageToast from '@/components/ImageToast.vue'
import Otptimer from '@/components/OTP/Otptimer.vue'
import ReferenceModal from '@/components/ReferenceModal.vue'
import ReferenceAside from '@/components/ReferenceAside.vue'
import AsideSectionHeading from '@/components/AsideSectionHeading.vue'
import IconifyTabs from '@/components/IconifyTabs.vue'
import DateRangePicker from '@/components/DatePickers/datePicker.facebookstyle.vue'
import ReferenceAddressMaps from '@/components/ReferenceAddressMaps.vue'
import ReferenceAlert from '@/components/ReferenceAlert.vue'
import ReferenceInventoryToolbar from '@/components/ReferenceInventoryToolbar.vue'
import ReferenceIntegrationSettings from '@/components/ReferenceIntegrationSettings.vue'
// Overview pieces (5 Nov 2026): shared ones from components/, the page's own from pages/Overview
import AnimatedNumber from '@/components/AnimatedNumber.vue'
import MetricCard from '@/components/Data-tools/Metric.Card.vue'
import BreakdownBars from '@/components/Data-tools/Breakdown.Bars.vue'
import TrendCompareChart from '@/components/Charts/Trend.Compare.chart.vue'
import OverviewPulse from '@/pages/Overview/components/OverviewPulse.vue'
import HealthMatrix from '@/pages/Overview/components/HealthMatrix.vue'
import DashboardDatePicker from '@/components/DatePickers/datePicker.dashboard.vue'
import InfoDialog from '@/components/Data-tools/Info.Dialog.vue'
import ActivityFilterList from '@/pages/ActivityLog/components/ActivityFilterList.vue'
import ActivityEventAside from '@/pages/ActivityLog/components/ActivityEvent.aside.vue'
import kenyaFlag from '@/assets/images/flags/kenya.jpg'
import ugandaFlag from '@/assets/images/flags/uganda.png'

// Page state
const selectedTeam = ref(null)
const teamOptions = [
    { label: 'Operations', value: 'operations' },
    { label: 'Customer Support', value: 'support' },
    { label: 'Finance', value: 'finance' },
]
const selectedCountry = ref(null)
const countryOptions = [
    { label: 'Kenya', value: 'KE', image: kenyaFlag },
    { label: 'Uganda', value: 'UG', image: ugandaFlag },
]
const selectedContact = ref(null)
const inventorySearchQuery = ref('')
const inventoryFilterCount = ref(2)
const inventoryColumns = ref([
    { key: 'product', label: 'Product info', visible: true },
    { key: 'category', label: 'Category', visible: true },
    { key: 'addedBy', label: 'Added by', visible: true },
    { key: 'stock', label: 'Stock level', visible: false },
])
const inventoryCreateOptions = [
    { key: 'item', label: 'Add Item', icon: 'bx bxs-cloud-upload' },
    { key: 'category', label: 'Add Category', icon: 'bx bxs-folder-plus' },
    { key: 'tax', label: 'Add Tax type', icon: 'mdi mdi-percent' },
    { key: 'packaging', label: 'Add packaging type', icon: 'mdi mdi-package-variant-closed' },
    { key: 'unit', label: 'Add Unit Type', icon: 'mdi mdi-ruler-square' },
]
const insightDateFrom = ref(null)
const insightDateTo = ref(null)
const contactOptions = [
    { label: 'Amina Wanjiku', value: 'amina', email: 'amina.wanjiku@example.test', phone: '+254 712 345 678', initials: 'AW' },
    { label: 'Brian Otieno', value: 'brian', email: 'brian.otieno@example.test', phone: '+254 723 456 789', initials: 'BO' },
    { label: 'Carol Njeri', value: 'carol', email: 'carol.njeri@example.test', phone: '+254 734 567 890', initials: 'CN' },
]

// Static log examples model the Site Identity audit table and user activity timeline.
const identityLogExamples = [
    { date: 'Today, 10:42 AM', setting: 'Business name', section: 'General settings', change: 'PaySol Market → PaySol Stores', actor: 'Kelvin Mwangi', ip: 'Chrome · Nairobi' },
    { date: 'Yesterday', setting: 'Primary logo', section: 'Brand assets', change: 'Logo asset updated', actor: 'Amina Wanjiku', ip: 'Windows · Nairobi' },
]
const latestIdentityChanges = [
    { date: 'Today, 10:42 AM', actor: 'Kelvin Mwangi', action: 'updated', setting: 'primary brand colour', key: 'branding.primary_color', device: 'Edge on Windows', ip: '127.0.0.1', failed: false },
    { date: 'Yesterday', actor: 'Amina Wanjiku', action: 'set', setting: 'support email', key: 'platform.support_email', device: 'Chrome on Windows', ip: '197.232.14.8', failed: false },
    { date: '3 days ago', actor: 'Kelvin Mwangi', action: 'reset', setting: 'daily email limit', key: 'alert_rules.messaging.daily_email_use', device: 'Unknown browser', ip: '127.0.0.1', failed: true },
]
const userLogExamples = [
    { event: 'Successful login', channel: 'Web', date: '2 hours ago', fullDate: '1 Nov 2026, 10:42 AM', ip: '197.232.14.8', icon: 'mdi-login', tone: 'success', browser: 'Chrome on Windows', browserIcon: 'logos:google-chrome', location: 'Nairobi, Kenya', details: ['Chrome', 'Nairobi, Kenya'], tableDetails: ['New session'] },
    { event: 'Password changed', channel: 'Security', date: 'Yesterday', fullDate: '31 Oct 2026, 4:18 PM', ip: '197.232.14.8', icon: 'mdi-lock-reset', tone: 'primary', browser: 'Microsoft Edge on Windows', browserIcon: 'simple-icons:microsoftedge', location: 'Nairobi, Kenya', details: ['Self-service'], tableDetails: ['Self-service'] },
    { event: 'Failed login attempt', channel: 'Web', date: '3 days ago', fullDate: '29 Oct 2026, 8:06 AM', ip: '41.90.12.4', icon: 'mdi-account-alert', tone: 'danger', browser: 'Firefox on Android', browserIcon: 'logos:firefox', location: 'Mombasa, Kenya', details: ['Incorrect password'], tableDetails: ['Incorrect password'] },
]

// View switcher state
const activeView = ref('table')
const activeReferenceTab = ref('profile')
const analyticsEnabled = ref(true)
const referenceTabs = [
    { value: 'profile', label: 'Profile', icon: 'ri:user-3-line', iconActive: 'ri:user-3-fill' },
    { value: 'security', label: 'Security', icon: 'ri:shield-keyhole-line', iconActive: 'ri:shield-keyhole-fill' },
    { value: 'activity', label: 'Activity', icon: 'ri:time-line', iconActive: 'ri:time-fill' },
]

// Toast state
const toastStatus = ref(null)
const toastTitle = ref('')
const toastMessage = ref('')

// OTP timer state
const timerRef = ref(null)
const exampleModal = ref(null)
const exampleSoftModal = ref(null)
const exampleAside = ref(null)
const exampleIconAside = ref(null)
const exampleInsightsAside = ref(null)

// ---- Reference interactions ----
function showExampleToast(status) {
    toastStatus.value = status
    toastTitle.value = status === 'success' ? 'Example saved' : 'Example error'
    toastMessage.value = status === 'success'
        ? 'This static message demonstrates the shared toast.'
        : 'This static message demonstrates an error state.'
}

function startExampleTimer() {
    timerRef.value?.start()
}

function stopExampleTimer() {
    timerRef.value?.stop()
}

function openExampleModal() {
    exampleModal.value?.open()
}

function openExampleSoftModal() {
    exampleSoftModal.value?.open()
}

function openExampleAside() {
    exampleAside.value?.open()
}

function openExampleIconAside() {
    exampleIconAside.value?.open()
}

function openExampleInsightsAside() {
    exampleInsightsAside.value?.open()
}

function showAsideActionExample(action) {
    toastStatus.value = 'success'
    toastTitle.value = `${action} example`
    toastMessage.value = 'This is a local-only reference action.'
}

function showInventoryExample(title, message) {
    toastStatus.value = 'success'
    toastTitle.value = title
    toastMessage.value = message
}

function handleInventorySearch(query) {
    showInventoryExample('Search example', query ? `The toolbar emitted “${query}”. No API request was made.` : 'An empty search was submitted locally.')
}

function handleInventoryCreate(option) {
    showInventoryExample(`${option.label} example`, 'The selected Create action was emitted locally. A real page decides whether to navigate or open a modal.')
}

// ---- Overview pieces: sample data only (no API) ----
const kes = (n) => `KES ${Math.round(n).toLocaleString('en-KE')}`
const count = (n) => Math.round(n).toLocaleString('en-KE')
const pct = (n) => `${(Math.round(n * 10) / 10).toLocaleString('en-KE')}%`
const demoNumber = ref(18)
const demoMoney = ref(6700)
const demoShare = ref(42.5)
function changeDemoNumbers() {
    demoNumber.value = Math.round(5 + Math.random() * 40)
    demoMoney.value = Math.round(1000 + Math.random() * 20000)
    demoShare.value = Math.round(Math.random() * 1000) / 10
}

const demoActiveCard = ref('live')
const demoCards = [
    { key: 'live', label: 'Businesses live', icon: 'ri:store-2-line', iconActive: 'ri:store-2-fill', value: 18, of: 24, format: count, tone: 'positive', marker: '▲', text: '12.5%' },
    { key: 'collected', label: 'Subscriptions collected', icon: 'ri:hand-coin-line', iconActive: 'ri:hand-coin-fill', value: 6700, of: null, format: kes, tone: 'positive', marker: '▲', text: '8%' },
    { key: 'unpaid', label: 'Still unpaid', icon: 'tabler:cash-off', iconActive: 'tabler:cash-off', value: 1400, of: null, format: kes, tone: 'negative', marker: '▲', text: '20%' },
    { key: 'sales', label: 'Sales through PaySol', icon: 'ri:shopping-bag-3-line', iconActive: 'ri:shopping-bag-3-fill', value: null, of: null, format: kes, planned: true },
]

// Chart: 14 days, this period against the one before; "Change the dates" shows the glide
const demoDays = Array.from({ length: 14 }, (_, i) => `${i + 22} Oct`)
const makeDemoPoints = () => demoDays.map((label) => ({ label, value: Math.round(200 + Math.random() * 900), previous: Math.round(200 + Math.random() * 700) }))
const demoPoints = ref(makeDemoPoints())
const demoCompare = ref(true)
const demoStep = ref(false)

const demoBars = ref([
    { key: 'standard', label: 'Standard', value: 4200, share: 62.7 },
    { key: 'gold', label: 'Gold', value: 2500, share: 37.3 },
])
const demoBarsCounts = ref([
    { key: 'products', label: 'Add a product', value: 4, share: 40 },
    { key: 'staff', label: 'Add a cashier', value: 3, share: 30 },
    { key: 'payments', label: 'Choose payment methods', value: 2, share: 20 },
    { key: 'till', label: 'Open a till', value: 1, share: 10 },
])
function shuffleDemoBars() {
    const a = Math.round(1000 + Math.random() * 5000), b = Math.round(1000 + Math.random() * 5000)
    demoBars.value = [
        { key: 'standard', label: 'Standard', value: a, share: Math.round((a / (a + b)) * 1000) / 10 },
        { key: 'gold', label: 'Gold', value: b, share: Math.round((b / (a + b)) * 1000) / 10 },
    ]
}

const demoPulseWide = ref(false)
const demoPulse = {
    title: 'Pulse',
    scope: 'platform',
    checked_at: '2026-11-04T17:05:00+03:00',
    attention: {
        counts: { critical: 2, warning: 3, info: 1, total: 6 },
        items: [
            { id: 'tenant:1', source: 'business', severity: 'critical', code: 'payment_failed', title: 'Kwamaina Bar', reason: 'Payment failed', detail: 'M-Pesa: insufficient balance', meta: 'PS-00012', since: '2026-11-03T09:00:00+03:00', link: { path: '/test-page' } },
            { id: 'integration:sms', source: 'integration', severity: 'critical', code: 'sms', title: "Africa's Talking SMS", reason: 'Failing', detail: 'Key refused', meta: 'Messaging', since: '2026-11-04T16:55:00+03:00', link: { path: '/test-page' } },
            { id: 'tenant:2', source: 'business', severity: 'warning', code: 'trial_ending', title: 'Baraka Wines', reason: 'Trial ending', detail: 'Trial ends in 3 days', meta: 'PS-00015', since: '2026-11-02T10:00:00+03:00', link: { path: '/test-page' } },
            { id: 'tenant:3', source: 'business', severity: 'warning', code: 'setup_stuck', title: 'Mama Njeri Kinyozi', reason: 'Setup stuck', detail: 'No setup step done for 4 days', meta: 'PS-00017', since: '2026-10-31T10:00:00+03:00', link: { path: '/test-page' } },
            { id: 'tenant:4', source: 'business', severity: 'warning', code: 'gone_quiet', title: 'Club Vibes', reason: 'No recent sales', detail: 'No sales for 4 days', meta: 'PS-00008', since: '2026-10-31T10:00:00+03:00', link: { path: '/test-page' } },
            { id: 'leads:today', source: 'leads', severity: 'info', code: 'followups_today', title: '2 leads to follow up today', reason: 'Follow-up due', detail: null, meta: null, since: '2026-11-04T00:00:00+03:00', link: { path: '/test-page' } },
        ],
        more: 2,
        limit: 4,
    },
    services: {
        counts: { working: 5, attention: 2, not_live: 4 },
        last_checked_at: '2026-11-04T17:05:00+03:00',
        items: [
            { key: 'sms', name: "Africa's Talking SMS", state: 'down', status_label: 'Failing', reading: 'Key refused', usage: null, last_checked_at: '2026-11-04T17:05:00+03:00', checks_24h: [...Array(15).fill('ok'), 'slow', ...Array(8).fill('fail')], up_pct_24h: 66.7 },
            { key: 'email', name: 'Gmail SMTP', state: 'working', status_label: 'Working', reading: '120 of 500', usage: null, last_checked_at: '2026-11-04T17:05:00+03:00', checks_24h: [...Array(3).fill('none'), ...Array(21).fill('ok')], up_pct_24h: 100 },
            { key: 'backups', name: 'Backups', state: 'degraded', status_label: 'Getting old', reading: '30 h old', usage: null, last_checked_at: '2026-11-04T17:05:00+03:00', checks_24h: Array.from({ length: 24 }, (_, i) => (i % 3 ? 'ok' : 'slow')), up_pct_24h: 100 },
        ],
        sms: { balance: 1240, currency: 'KES', warn_at: 1500, critical_at: 500, target: 5000, reading: 'KES 1,240', days_left: '7 days left', state: 'degraded', checked_at: '2026-11-04T17:05:00+03:00', price_per_sms: null },
        core: {
            name: 'PaySol Core', sub: 'API, database & scheduled jobs', state: 'working', up_pct_24h: 99.8,
            checks_24h: [...Array(20).fill('ok'), 'slow', 'ok', 'ok', 'ok'],
            parts: [
                { key: 'api', name: 'API', state: 'working', reading: 'Answering now', checked_at: '2026-11-04T17:05:00+03:00' },
                { key: 'database', name: 'Database', state: 'working', reading: '8 ms', checked_at: '2026-11-04T17:05:00+03:00' },
                { key: 'queue', name: 'Queue worker', state: 'working', reading: '0 waiting', checked_at: '2026-11-04T17:04:00+03:00' },
                { key: 'scheduler', name: 'Scheduled jobs', state: 'working', reading: 'Ran 1 min ago', checked_at: '2026-11-04T17:05:00+03:00' },
            ],
        },
    },
    quick_actions: [
        { key: 'onboard', label: 'Onboard a business', icon: 'ri:store-2-line', path: '/test-page' },
        { key: 'integrations', label: 'Integrations', icon: 'fluent:puzzle-piece-24-regular', path: '/test-page' },
    ],
}

// Dashboard date picker (datePicker.dashboard.vue)
const demoDpFrom = ref(new Date(new Date().setHours(0, 0, 0, 0) - 29 * 864e5))
const demoDpTo = ref(new Date(new Date().setHours(0, 0, 0, 0)))
const demoDpGrain = ref(null)
const demoDpCompare = ref(true)
const demoDpChanges = ref(0)

// "More info" pop-up (Info.Dialog.vue)
const demoInfoOpen = ref(false)
const demoInfoChecks = ref(false)

const demoMatrixGroup = ref('spotlight')
const demoMatrixCounts = { spotlight: 3, healthy: 13, attention: 3, danger: 2, onboarding: 5, suspended: 1, live: 18, total: 24 }
const demoMatrixRows = [
    { id: 'a', name: 'Kwamaina Bar', human_code: 'PS-00012', business_type: { key: 'bar', name: 'Bar' }, health: 'danger', plan: { key: 'standard', name: 'Standard' }, attention: { level: 'urgent', type: 'payment_failed', label: 'Payment failed', since: '2026-11-03T09:00:00+03:00' }, last_activity_at: '2026-11-04T12:00:00+03:00' },
    { id: 'b', name: 'Baraka Wines', human_code: 'PS-00015', business_type: { key: 'wines_and_spirits', name: 'Wines & spirits' }, health: 'attention', plan: { key: 'gold', name: 'Gold' }, attention: { level: 'warning', type: 'trial_ending', label: 'Trial ending', since: '2026-11-02T10:00:00+03:00' }, last_activity_at: '2026-11-03T16:00:00+03:00' },
    { id: 'c', name: 'Club Vibes', human_code: 'PS-00008', business_type: { key: 'bar', name: 'Bar' }, health: 'healthy', plan: { key: 'standard', name: 'Standard' }, attention: null, last_activity_at: '2026-11-04T09:30:00+03:00' },
]

// Activity log (9 Nov 2026): sample facets and summary for the filter list, two sample events for the panel
const demoActivityCategory = ref('security')
const demoActivityType = ref('')
const demoActivityResult = ref('')
const demoActivityActor = ref('')
const demoActivityLoading = ref(false)   // shows the skeleton state
const demoActivityFacets = {
    total: 1248,
    categories: [
        { key: 'security', label: 'Sign-ins & security', planned: false, count: 412, types: [
            { key: 'signins', label: 'Signed in and out', planned: false, count: 360 }, { key: 'failed', label: 'Failed and locked out', planned: false, count: 14 },
            { key: 'codes', label: 'Sign-in codes', planned: false, count: 30 }, { key: 'passwords', label: 'Passwords', planned: false, count: 3 },
            { key: 'devices', label: 'Devices & sessions', planned: false, count: 5 }] },
        { key: 'team', label: 'PaySol team', planned: false, count: 12, types: [{ key: 'accounts', label: 'Admin accounts', planned: false, count: 12 }, { key: 'roles', label: 'Roles & permissions', planned: true, count: 0 }] },
        { key: 'businesses', label: 'Businesses', planned: false, count: 520, types: [{ key: 'details', label: 'Onboarding & details', planned: false, count: 80 }, { key: 'products', label: 'Products', planned: false, count: 440 }] },
        { key: 'money', label: 'Money', planned: false, count: 304, types: [] },
        { key: 'sales', label: 'Sales', planned: true, count: 0, types: [] },
    ],
    results: [{ key: 'ok', label: 'Done', count: 1220 }, { key: 'refused', label: 'Refused', count: 9 }, { key: 'failed', label: 'Failed', count: 16 }, { key: 'locked', label: 'Locked out', count: 3 }],
    actors: [{ key: 'admin', label: 'PaySol team', count: 640 }, { key: 'user', label: 'Business people', count: 500 }, { key: 'system', label: 'PaySol', count: 92 }, { key: 'unknown', label: 'Not signed in', count: 16 }],
}
const demoActivitySummary = { security: {
    failed_signins_24h: { label: 'Failed sign-ins', value: 4, alert_at: 10, level: 'ok' },
    lockouts_24h: { label: 'Lockouts', value: 2, alert_at: 3, level: 'watch' },
    new_devices_7d: { label: 'New devices (7 days)', value: 5, alert_at: 5, level: 'alert' },
} }
const DEMO_EVENTS = {
    locked: {
        id: 1, occurred_at: '2026-11-09T07:44:00Z', category: { key: 'security', label: 'Sign-ins & security' }, type: { key: 'failed', label: 'Failed and locked out' },
        result: 'locked', actor: { type: 'user', id: 7, name: 'Brian O.', role: 'Cashier' }, business: { id: '01HSAMPLE', name: 'Kwa Maina Bar' },
        verb: 'was locked out of', subject: 'Kwa Maina Bar', reason: 'Locked for 15 minutes after 5 wrong PINs. They can try again at 10:59.',
        event_key: 'auth.locked', before: null, after: null,
        device: { browser: 'PaySol counter app', version: '1.4', os: 'Android 13', kind: 'counter', trust: 'known' },
        ip_address: '105.163.2.10', location: 'Bypass, Kiambu', request_id: 'a1b2c3d4-sample', source: 'tenant_activities', kept_until: '2027-11-09',
    },
    price: {
        id: 2, occurred_at: '2026-11-09T06:58:00Z', category: { key: 'businesses', label: 'Businesses' }, type: { key: 'products', label: 'Products' },
        result: 'ok', actor: { type: 'admin', id: 3, name: 'Wanjiru K.', role: 'Support' }, business: { id: '01HSAMPLE', name: 'Kwa Maina Bar' },
        verb: 'changed the price of', subject: 'Tusker Lager 500ml', reason: null, event_key: 'product.selling_price',
        before: { selling_price: 'KES 250' }, after: { selling_price: 'KES 270' },
        device: { browser: 'Chrome', version: '130', os: 'Windows 10/11', kind: 'desktop', trust: 'new' },
        ip_address: '41.90.70.12', location: 'Nairobi', request_id: 'e5f6a7b8-sample', source: 'tenant_activities', kept_until: '2027-11-09',
    },
}
const demoActivityEvent = ref(null)
function openDemoEvent(key) {
    demoActivityEvent.value = DEMO_EVENTS[key]
    const el = document.getElementById('demoActivityEventAside')
    if (el) bootstrap.Offcanvas.getOrCreateInstance(el).show()
}

function handleInventoryFilter() {
    showInventoryExample('Filter example', 'The Filter button emits an event. The page owns its filter aside and active filter count.')
}

</script>

<template>
    <main class="container-fluid py-3">
        <!-- Page title: internal reference only; examples below link to source files. -->
        <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
            <div>
                <h1 class="h3 mb-1">Shared Component Reference</h1>
                <p class="text-muted mb-0">Shared controls and layout shells with small, safe usage examples.</p>
            </div>
            <span class="badge bg-warning-subtle text-warning-emphasis">Development reference</span>
        </div>

        <div class="row g-3">
            <!-- Address-to-map flow: one Google Places selection centers Google Maps and the attached Leaflet.js map. -->
            <section class="col-12">
                <ReferenceAddressMaps />
            </section>

            <!-- POS inventory header: reusable search, Create menu, Filter action, and table-column chooser. -->
            <section class="col-12">
                <div class="card">
                    <div class="card-header bg-white">
                        <h2 class="h5 mb-1">Products inventory toolbar</h2>
                        <code>src/components/ReferenceInventoryToolbar.vue · modeled on Products.inventory.pos.table.vue</code>
                    </div>
                    <div class="card-body">
                        <ReferenceInventoryToolbar
                            v-model="inventorySearchQuery"
                            :columns="inventoryColumns"
                            :create-options="inventoryCreateOptions"
                            :filter-count="inventoryFilterCount"
                            @update:columns="inventoryColumns = $event"
                            @search="handleInventorySearch"
                            @create="handleInventoryCreate"
                            @filter="handleInventoryFilter"
                            @clear="inventorySearchQuery = ''; showInventoryExample('Search cleared', 'The local search value was cleared.')"
                        />
                        <p class="small text-muted mt-3 mb-0">
                            Search query: <code>{{ inventorySearchQuery || 'empty' }}</code> ·
                            Visible columns: <code>{{ inventoryColumns.filter((column) => column.visible).map((column) => column.label).join(', ') || 'none' }}</code>.
                            All events are local; the parent page owns API search, navigation, modals, and filter state.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Latest Identity changes card: compact mini-timeline and full-audit-trail link, modeled on Identity.coreVisuals.vue. -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header bg-white">
                        <h2 class="h5 mb-1">Latest identity changes card</h2>
                        <code>src/pages/Site.Identity/Identity.coreVisuals.vue</code>
                    </div>
                    <div class="card-body">
                        <div class="border rounded-4 overflow-hidden">
                            <div class="p-3 border-bottom d-flex justify-content-between align-items-start">
                                <div>
                                    <h3 class="h6 text-black mb-1">Latest identity changes</h3>
                                    <small class="text-muted">Recent updates across the identity settings</small>
                                </div>
                                <span class="reference-count-chip" title="52 changes recorded">52</span>
                            </div>
                            <div class="p-3">
                                <div v-for="change in latestIdentityChanges" :key="change.key" class="reference-change-item">
                                    <span class="reference-change-dot" :class="change.failed ? 'reference-dot-failed' : 'reference-dot-ok'"></span>
                                    <small class="text-muted d-block">{{ change.date }}</small>
                                    <p class="mb-1 small text-black">
                                        <span class="fw-semibold">{{ change.actor }}</span> {{ change.action }}
                                        <span class="fw-medium">{{ change.setting }}</span>
                                    </p>
                                    <span class="reference-key-chip">{{ change.key }}</span>
                                    <small class="d-block text-muted mt-1">{{ change.device }} · {{ change.ip }}</small>
                                </div>
                            </div>
                            <div class="border-top p-2 text-center">
                                <router-link to="/site-identity/history" class="btn btn-link fw-bold text-primary waves-effect" title="View the full Site Identity audit trail">
                                    View full audit trail <i class="bx bx-right-arrow-alt align-middle" aria-hidden="true"></i>
                                </router-link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Site Identity change history: audit table with actor and device context, modeled on Identity.history.vue. -->
            <section class="col-12 col-xl-7">
                <div class="card h-100">
                    <div class="card-header bg-white">
                        <h2 class="h5 mb-1">Site Identity change history</h2>
                        <code>src/pages/Site.Identity/Identity.history.vue</code>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table verticle-middle table-hover mb-0">
                                <thead class="table-light text-nowrap">
                                    <tr><th>When</th><th>Setting / change</th><th>Changed by</th><th>Device &amp; location</th></tr>
                                </thead>
                                <tbody>
                                    <tr v-for="log in identityLogExamples" :key="log.setting" class="cursor-pointer">
                                        <td class="text-nowrap">{{ log.date }}</td>
                                        <td>
                                            <span class="d-block fw-bold text-black">{{ log.setting }}</span>
                                            <small class="text-muted">{{ log.section }} · {{ log.change }}</small>
                                        </td>
                                        <td><span class="fw-bold">{{ log.actor }}</span></td>
                                        <td><i class="bx bx-laptop fs-4 text-muted me-1"></i><span>{{ log.ip }}</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p class="small text-muted px-3 pt-2 mb-3">The real page adds search, filters, sortable dates, restore actions, and a details aside.</p>
                    </div>
                </div>
            </section>

            <!-- User activity log: event timeline with event-colored icons, metadata badges, and load-more footer, modeled on User.details.vue. -->
            <section class="col-12 col-xl-5">
                <div class="card h-100">
                    <div class="card-header bg-white">
                        <h2 class="h5 mb-1">User activity log</h2>
                        <code>src/pages/SystemUsers/User.details.vue</code>
                    </div>
                    <div class="card-body">
                        <ul class="verti-timeline list-unstyled mb-0">
                            <li v-for="log in userLogExamples" :key="log.event" class="event-list">
                                <div class="event-timeline-dot" style="left: -17px;">
                                    <span class="avatar-xs rounded-circle d-flex align-items-center justify-content-center" :class="`bg-${log.tone}-subtle`">
                                        <i class="mdi fs-4" :class="[log.icon, `text-${log.tone}`]"></i>
                                    </span>
                                </div>
                                <div class="d-flex mb-3">
                                    <div class="flex-grow-1">
                                        <h5 class="font-size-14 text-capitalize mb-1">{{ log.event }} <span class="fw-normal">[{{ log.channel }}]</span></h5>
                                        <p class="text-muted mb-1">{{ log.date }}<span v-if="log.ip"> · {{ log.ip }}</span></p>
                                        <div class="d-flex flex-wrap gap-2">
                                            <span v-for="detail in log.details" :key="detail" class="text-capitalize badge-alt2 bg-gray-200 text-dark bg-primary-soft w-auto">{{ detail }}</span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                        <div class="text-center pt-2 border-top">
                            <button type="button" class="btn btn-link waves-effect" title="Load more activity">Load More</button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Proposed user log table: prioritize scan-friendly event, time, context, and network details for audit review. -->
            <section class="col-12">
                <div class="card">
                    <div class="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <div>
                            <h2 class="h5 mb-1">Proposed user logs table</h2>
                            <span class="small text-muted">A denser audit view for comparing events and investigating sign-in activity.</span>
                        </div>
                        <span class="badge bg-light text-dark border">{{ userLogExamples.length }} recent events</span>
                    </div>
                    <!-- Toolbar layout mirrors the project: refresh, search, then filters. Controls are visual examples only. -->
                    <div class="card-body border-bottom py-3">
                        <div class="d-flex flex-wrap align-items-center gap-2">
                            <button type="button" class="btn btn-light avatar-sm rounded-circle p-0" title="Refresh user log example" aria-label="Refresh user log example">
                                <i class="mdi mdi-refresh fs-4"></i>
                            </button>
                            <div class="flex-grow-1" style="min-width: 220px; max-width: 420px;">
                                <div class="input-group">
                                    <span class="input-group-text bg-light border-end-0"><i class="bx bx-search-alt"></i></span>
                                    <input type="search" class="form-control bg-light border-start-0" placeholder="Search events, IP or details" aria-label="Search user activity examples" />
                                </div>
                            </div>
                            <button type="button" class="btn btn-light d-inline-flex align-items-center gap-2" title="Filter by event type">
                                <i class="mdi mdi-filter-variant fs-5"></i><span>Event type</span><i class="mdi mdi-chevron-down"></i>
                            </button>
                            <button type="button" class="btn btn-light d-inline-flex align-items-center gap-2" title="Filter by date range">
                                <i class="mdi mdi-calendar-range fs-5"></i><span>Date range</span><i class="mdi mdi-chevron-down"></i>
                            </button>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover verticle-middle mb-0">
                            <thead class="table-light text-nowrap">
                                <tr><th>When</th><th>Event</th><th>Channel</th><th>Details</th><th>Device &amp; location</th></tr>
                            </thead>
                            <tbody>
                                <tr v-for="log in userLogExamples" :key="`table-${log.event}`">
                                    <td class="text-nowrap" :title="log.fullDate">
                                        <span class="d-block fw-semibold text-black">{{ log.date }}</span>
                                        <small class="text-muted">{{ log.fullDate }}</small>
                                    </td>
                                    <td>
                                        <span class="d-inline-flex align-items-center gap-2">
                                            <span class="avatar-xs rounded-circle d-inline-flex align-items-center justify-content-center" :class="`bg-${log.tone}-subtle`">
                                                <i class="mdi" :class="[log.icon, `text-${log.tone}`]" aria-hidden="true"></i>
                                            </span>
                                            <span class="fw-semibold text-black">{{ log.event }}</span>
                                        </span>
                                    </td>
                                    <td><span class="badge bg-light text-dark border">{{ log.channel }}</span></td>
                                    <td><div class="d-flex flex-wrap gap-1"><span v-for="detail in log.tableDetails" :key="detail" class="badge-alt2 bg-gray-200 text-dark bg-primary-soft w-auto">{{ detail }}</span></div></td>
                                    <td class="text-nowrap">
                                        <div class="d-flex align-items-center gap-2 mb-1">
                                            <Icon :icon="log.browserIcon" class="reference-browser-icon" aria-hidden="true" />
                                            <span>{{ log.browser }}</span>
                                        </div>
                                        <div class="d-flex align-items-center gap-2 small text-muted">
                                            <i class="mdi mdi-map-marker-outline fs-6" aria-hidden="true"></i>
                                            <span>{{ log.location }}</span>
                                            <span class="text-muted">·</span>
                                            <code>{{ log.ip }}</code>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="card-footer bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <small class="text-muted">Showing {{ userLogExamples.length }} example events</small>
                        <button type="button" class="btn btn-white btn-sm" title="Load the next page of user logs" disabled>
                            Load more <i class="bx bx-down-arrow-alt align-middle"></i>
                        </button>
                    </div>
                </div>
            </section>

            <!-- Button variants: use one visual treatment consistently for the action's importance and context. -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Buttons</h2>
                        <span class="small text-muted">Bootstrap and theme variants, plus the shared white button.</span>
                    </div>
                    <div class="card-body">
                        <p class="small text-uppercase fw-semibold text-muted mb-2">Primary actions</p>
                        <div class="d-flex flex-wrap gap-2 mb-3">
                            <button type="button" class="btn btn-primary" title="Primary action example">Save changes</button>
                            <button type="button" class="btn btn-white" title="White secondary action example">Cancel</button>
                            <button type="button" class="btn btn-outline-secondary" title="Outlined action example">View details</button>
                        </div>
                        <p class="small text-uppercase fw-semibold text-muted mb-2">Status and destructive actions</p>
                        <div class="d-flex flex-wrap gap-2 mb-3">
                            <button type="button" class="btn btn-soft-success" title="Success action example">Approve</button>
                            <button type="button" class="btn btn-soft-warning" title="Warning action example">Review</button>
                            <button type="button" class="btn btn-soft-danger" title="Destructive action example">Deactivate</button>
                            <button type="button" class="btn btn-light" title="Quiet action example">More options</button>
                        </div>
                        <p class="small text-uppercase fw-semibold text-muted mb-2">Bordered actions (white fill)</p>
                        <div class="d-flex flex-wrap gap-2 mb-3">
                            <button type="button" class="btn btn-outline-soft-primary" title="Bordered primary action">Edit</button>
                            <button type="button" class="btn btn-outline-soft-secondary" title="Bordered neutral action">Dismiss</button>
                            <button type="button" class="btn btn-outline-soft-warning" title="Bordered warning action">Needs review</button>
                            <button type="button" class="btn btn-outline-soft-danger" title="Bordered destructive action">Remove</button>
                        </div>
                        <p class="small text-uppercase fw-semibold text-muted mb-2">Bordered actions (muted fill)</p>
                        <div class="d-flex flex-wrap gap-2 mb-3">
                            <button type="button" class="btn btn-outline-muted-primary" title="Muted bordered primary action">Edit</button>
                            <button type="button" class="btn btn-outline-muted-secondary" title="Muted bordered neutral action">Dismiss</button>
                            <button type="button" class="btn btn-outline-muted-warning" title="Muted bordered warning action">Needs review</button>
                            <button type="button" class="btn btn-outline-muted-danger" title="Muted bordered destructive action">Remove</button>
                            <button type="button" class="btn btn-outline-muted-primary" title="Disabled muted bordered action" disabled>Unavailable</button>
                        </div>
                        <p class="small text-uppercase fw-semibold text-muted mb-2">Compact icon actions</p>
                        <div class="d-flex flex-wrap gap-2">
                            <button type="button" class="btn btn-white btn-sm" title="Refresh" aria-label="Refresh"><i class="mdi mdi-refresh"></i></button>
                            <button type="button" class="btn btn-primary btn-sm" title="Add item"><i class="mdi mdi-plus me-1"></i>Add item</button>
                        </div>
                        <p class="small text-muted mt-3 mb-0">
                            Existing filled and soft variants remain available. The <code>btn-outline-soft-*</code> set has a white fill;
                            <code>btn-outline-muted-*</code> has a muted grey fill. Both have tone-colored borders and text.
                            Icon-only buttons need <code>title</code> and <code>aria-label</code>.
                            Styles live in <code>src/assets/css/custom.css</code>.
                        </p>
                    </div>
                </div>
            </section>

            <!-- ================= Overview pieces (5 Nov 2026) ================= -->

            <!-- Animated number: a value that counts to its new value instead of jumping. -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header bg-white">
                        <h2 class="h5 mb-1">Animated number</h2>
                        <code>src/components/AnimatedNumber.vue</code>
                    </div>
                    <div class="card-body">
                        <p class="small text-muted">
                            Use it wherever a number can change while someone is looking (dashboard cards, counts in a panel), so the change is
                            noticed and reads as a movement rather than a flicker. Don't use it in table cells or long lists: dozens of moving numbers distract.
                            It counts up from zero the first time it shows, eases out as it lands, and changes at once for people who turned on "reduce motion".
                        </p>
                        <div class="d-flex flex-wrap gap-4 align-items-end mb-3">
                            <div><div class="small text-muted">A count</div><div class="fs-3 fw-bold text-dark"><AnimatedNumber :value="demoNumber" :format="count" /></div></div>
                            <div><div class="small text-muted">Money</div><div class="fs-3 fw-bold text-dark"><AnimatedNumber :value="demoMoney" :format="kes" /></div></div>
                            <div><div class="small text-muted">A percentage</div><div class="fs-3 fw-bold text-dark"><AnimatedNumber :value="demoShare" :format="pct" /></div></div>
                            <div><div class="small text-muted">No value yet</div><div class="fs-3 fw-bold text-dark"><AnimatedNumber :value="null" /></div></div>
                        </div>
                        <button type="button" class="btn btn-white btn-sm" title="Give the numbers new values" @click="changeDemoNumbers">Change the numbers</button>
                        <p class="small text-muted mt-3 mb-0">
                            Props: <code>value</code> (null shows the placeholder), <code>format</code> (a function: count, money, %),
                            <code>duration</code> (ms, 700), <code>fromZero</code>, <code>placeholder</code>. Screen readers hear only the final value.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Metric cards: big-number cards that pick what the chart below them shows. -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header bg-white">
                        <h2 class="h5 mb-1">Metric cards</h2>
                        <code>src/components/Data-tools/Metric.Card.vue · custom.css 26</code>
                    </div>
                    <div class="card-body">
                        <p class="small text-muted">
                            A row of these sits above a chart: clicking one shows it in the chart (the Overview). Each says the number, its change
                            against the period before, and whether that change is good news. Red means bad news, not "went down":
                            "Still unpaid" going up is red. A planned card has no number until its data exists.
                        </p>
                        <div class="metric-strip mb-2" role="tablist" aria-label="Example cards">
                            <MetricCard
                                v-for="c in demoCards"
                                :key="c.key"
                                :label="c.label"
                                :icon="c.icon"
                                :icon-active="c.iconActive"
                                :value="c.value"
                                :of="c.of"
                                :format="c.format"
                                :change-tone="c.tone"
                                :change-marker="c.marker"
                                :change-text="c.text"
                                period="vs the previous 30 days"
                                :active="demoActiveCard === c.key"
                                :planned="!!c.planned"
                                planned-text="Starts with the counter app"
                                @select="demoActiveCard = c.key"
                            />
                            <MetricCard label="Loading" loading />
                        </div>
                        <p class="small text-muted mb-0">
                            Props: <code>label</code>, <code>icon</code> / <code>iconActive</code>, <code>value</code>, <code>of</code>, <code>format</code>,
                            <code>changeTone</code> (positive | negative | neutral), <code>changeMarker</code>, <code>changeText</code>, <code>period</code>,
                            <code>active</code>, <code>planned</code> + <code>plannedText</code>, <code>loading</code>. Emits <code>select</code>; hover and focus
                            pass through (the Overview fetches a card's chart on hover). Put them in <code>.metric-strip</code>.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Trend chart: this period against the one before, gliding to new data. -->
            <section class="col-12 col-xl-7">
                <div class="card h-100">
                    <div class="card-header bg-white">
                        <h2 class="h5 mb-1">Trend against the period before</h2>
                        <code>src/components/Charts/Trend.Compare.chart.vue (Highcharts)</code>
                    </div>
                    <div class="card-body">
                        <p class="small text-muted">
                            For one number over time with the same dates before it as a dashed grey line. The chart is drawn once and then
                            moves to new data, so changing the dates or the card glides instead of flashing. Use <code>step</code> for counts that
                            change in jumps (businesses live); a smooth line for money. Gaps (null) mean "not recorded", never zero.
                        </p>
                        <TrendCompareChart :points="demoPoints" name="22 Oct – 4 Nov" previous-name="8 Oct – 21 Oct" :compare="demoCompare" :step="demoStep" :format="kes" :axis-format="kes" :height="220" />
                        <div class="d-flex flex-wrap gap-2 mt-2">
                            <button type="button" class="btn btn-white btn-sm" title="New sample values" @click="demoPoints = makeDemoPoints()">Change the dates</button>
                            <button type="button" class="btn btn-sm" :class="demoCompare ? 'btn-soft-primary' : 'btn-white'" @click="demoCompare = !demoCompare">Compare</button>
                            <button type="button" class="btn btn-sm" :class="demoStep ? 'btn-soft-primary' : 'btn-white'" @click="demoStep = !demoStep">Steps</button>
                        </div>
                        <p class="small text-muted mt-3 mb-0">
                            Props: <code>points</code> (<code>[{ label, value, previous }]</code>), <code>name</code>, <code>previousName</code>,
                            <code>compare</code>, <code>step</code>, <code>color</code>, <code>height</code>, <code>format</code> (tooltip),
                            <code>axisFormat</code>. It follows its box's width, so a panel opening beside it reflows it.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Breakdown bars: what a number is made of, square bars with a share. -->
            <section class="col-12 col-xl-5">
                <div class="card h-100">
                    <div class="card-header bg-white">
                        <h2 class="h5 mb-1">Breakdown bars</h2>
                        <code>src/components/Data-tools/Breakdown.Bars.vue · custom.css 27</code>
                    </div>
                    <div class="card-body">
                        <p class="small text-muted">
                            Under a chart, to say what makes up its number: one square bar per part with its share and value. Bars grow in when
                            they first show and glide when the numbers change. Keep it to about eight parts; group the rest as "Others".
                        </p>
                        <div class="d-grid gap-3">
                            <BreakdownBars title="Collected by plan" subtitle="KES in these dates" :items="demoBars" :format="kes" footnote="In 22 Oct – 4 Nov" />
                            <BreakdownBars title="Steps still open" :items="demoBarsCounts" footnote="As things stand now" clickable @select="(item) => showInventoryExample('Bar clicked', `${item.label}: ${item.value}`)" />
                            <BreakdownBars title="Loading" :items="[]" loading />
                        </div>
                        <button type="button" class="btn btn-white btn-sm mt-3" @click="shuffleDemoBars">Change the numbers</button>
                        <p class="small text-muted mt-3 mb-0">
                            Props: <code>title</code>, <code>subtitle</code>, <code>items</code> (<code>[{ key, label, value, share, color? }]</code>),
                            <code>colors</code>, <code>format</code>, <code>footnote</code>, <code>emptyText</code>, <code>clickable</code>, <code>loading</code>. Emits <code>select</code>.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Pulse: the Overview's side panel, with sample issues and services. -->
            <section class="col-12 col-xl-5">
                <div class="card h-100">
                    <div class="card-header bg-white">
                        <h2 class="h5 mb-1">Pulse (side panel)</h2>
                        <code>src/pages/Overview/components/OverviewPulse.vue · custom.css 28, 31</code>
                    </div>
                    <div class="card-body bg-light">
                        <p class="small text-muted">
                            The Overview's right-hand panel: what needs someone today (worst first, the counts filter the list), quick actions the
                            admin can use, and the outside services with the SMS balance against its alert marks (amber warning, red critical).
                            The page fetches it every minute while visible and passes it in; on the Overview it is pinned to the right from 1280 px
                            (<code>body.has-side-panel</code> + <code>.page-side-panel</code>, custom.css 31). The links here stay on this page.
                        </p>
                        <p class="small text-muted">
                            As V11 (5 Nov): counts read "2 urgent 3 warnings 1 to do" in V11's red, amber and blue; the PaySol Core card shows the
                            API, database, queue and scheduler with their 24-hour uptime; expanded, every service gets its last 24 hourly checks.
                            A business or service row opens its "More info" pop-up instead of leaving the page.
                        </p>
                        <OverviewPulse :pulse="demoPulse" :wide="demoPulseWide" @toggle-wide="demoPulseWide = !demoPulseWide" @refresh="showInventoryExample('Check again', 'The Overview would fetch Pulse again.')"
                            @open-business="(id) => showInventoryExample('Business pop-up', `The Overview would open business ${id}'s More info pop-up.`)"
                            @open-integration="(key) => showInventoryExample('Service pop-up', `The Overview would open ${key}'s details window.`)"
                            @open-core="showInventoryExample('PaySol Core', 'The Overview would open the PaySol Core pop-up.')" />
                        <p class="small text-muted mt-3 mb-0">
                            Props: <code>pulse</code> (the <code>GET /overview/pulse</code> data), <code>loading</code>, <code>refreshing</code>, <code>wide</code>.
                            Emits <code>toggle-wide</code> (4 issues ↔ 10 with detail lines), <code>refresh</code>, <code>open-business</code> (tenant id),
                            <code>open-integration</code> (key), <code>open-core</code>.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Health matrix: businesses grouped by health, with sortable headers. -->
            <section class="col-12 col-xl-7">
                <div class="card h-100">
                    <div class="card-header bg-white">
                        <h2 class="h5 mb-1">Business health matrix</h2>
                        <code>src/pages/Overview/components/HealthMatrix.vue · custom.css 29</code>
                    </div>
                    <div class="card-body">
                        <p class="small text-muted">
                            Laid out as V11 (5 Nov): the status tabs carry their counts, "Live business health" splits the live businesses into
                            healthy, attention and danger zone (a square bar and three tiers), "Lifecycle status" counts live, setting up and
                            suspended, and the chosen group shows as spot cards. Every bar part, tier and row switches the group; a spot card
                            opens the business's "More info" pop-up on the Overview (here it only says so).
                        </p>
                        <HealthMatrix
                            :counts="demoMatrixCounts"
                            :rows="demoMatrixRows"
                            :group="demoMatrixGroup"
                            tenants-link="/test-page"
                            @update:group="demoMatrixGroup = $event"
                            @open="(row) => showInventoryExample('Spot card', `The Overview would open ${row.name}'s More info pop-up.`)"
                        />
                        <p class="small text-muted mt-3 mb-0">
                            Props: <code>counts</code>, <code>rows</code>, <code>group</code>, <code>loading</code>, <code>loadingMore</code>,
                            <code>hasMore</code>, <code>tenantsLink</code>. Emits <code>update:group</code>, <code>open</code> (row), <code>load-more</code>.
                            Look: custom.css 29 and 32.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Dashboard date picker: V11's two header buttons, dates and View by. -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header bg-white">
                        <h2 class="h5 mb-1">Dashboard date picker</h2>
                        <code>src/components/DatePickers/datePicker.dashboard.vue · custom.css 32</code>
                    </div>
                    <div class="card-body">
                        <p class="small text-muted">
                            For any page with a chart over time. Two header buttons: the dates, which are the shared picker
                            (<code>datePicker.facebookstyle.vue</code>, the same as Messages: presets, "Custom →" calendar, Back / Apply);
                            and "View by" (hour, day, week, month), where a choice that doesn't fit the range is greyed with its rule, with the
                            "Compare with the period before" switch at its foot. It emits <code>change</code> once per choice, so the page fetches once.
                        </p>
                        <div class="d-flex justify-content-end">
                            <DashboardDatePicker v-model:dateFrom="demoDpFrom" v-model:dateTo="demoDpTo" v-model:grain="demoDpGrain" v-model:compare="demoDpCompare"
                                :min-date="new Date(2026, 8, 26)" @change="demoDpChanges++" />
                        </div>
                        <p class="small text-muted mt-3 mb-0">
                            Now: {{ demoDpFrom.toDateString() }} – {{ demoDpTo.toDateString() }} · grain {{ demoDpGrain || 'best fit' }} ·
                            compare {{ demoDpCompare ? 'on' : 'off' }} · {{ demoDpChanges }} change events.<br>
                            Props: <code>v-model:dateFrom</code>, <code>v-model:dateTo</code>, <code>v-model:grain</code>, <code>v-model:compare</code>,
                            <code>minDate</code>, <code>autoGrain</code>. Emits <code>change</code>.
                        </p>
                    </div>
                </div>
            </section>

            <!-- "More info" pop-up: V11's small pop-up for a business or a service. -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header bg-white">
                        <h2 class="h5 mb-1">"More info" pop-up</h2>
                        <code>src/components/Data-tools/Info.Dialog.vue · custom.css 32</code>
                    </div>
                    <div class="card-body">
                        <p class="small text-muted">
                            The light pop-up wherever a business or a service is named (V10's store pop-up): a title, a few facts with icons, and
                            one main action. Give it <code>checks</code> (24 results) to add the "Up, 24 h / Response / Failed" figures and the hourly
                            blocks. "Open in …" goes first (left), the main action last, Close always. Escape and the backdrop close it.
                            Use <code>ReferenceModal</code> for forms; this one is for looking.
                        </p>
                        <div class="d-flex gap-2">
                            <button type="button" class="btn btn-white btn-sm" @click="demoInfoChecks = false; demoInfoOpen = true">Open a business</button>
                            <button type="button" class="btn btn-white btn-sm" @click="demoInfoChecks = true; demoInfoOpen = true">Open a service</button>
                        </div>
                        <InfoDialog v-model:open="demoInfoOpen" :title="demoInfoChecks ? 'PaySol Core' : 'Kwamaina Bar'"
                            :checks="demoInfoChecks ? demoPulse.services.core.checks_24h : null" :uptime="demoInfoChecks ? 99.8 : null" :response="demoInfoChecks ? '142 ms' : null">
                            <template v-if="!demoInfoChecks">
                                <div class="info-row"><Icon icon="ri:store-2-line" /><span>PS-00012 · Bar</span></div>
                                <div class="info-row"><Icon icon="ri:hand-coin-line" /><span>Standard plan · past due</span></div>
                                <div class="info-row"><Icon icon="ri:error-warning-line" /><span class="text-danger fw-semibold">Payment failed: M-Pesa insufficient balance</span></div>
                            </template>
                            <template v-else>
                                <div v-for="p in demoPulse.services.core.parts" :key="p.key" class="info-row">
                                    <span class="sq" style="background: #1e8e3e"></span><span class="flex-grow-1">{{ p.name }}</span><span class="small text-success">Working</span>
                                </div>
                            </template>
                            <template #actions>
                                <button type="button" class="btn btn-link text-muted me-auto px-0 d-flex align-items-center gap-2 order-first"><Icon icon="ri:share-forward-line" />Open in Tenants</button>
                                <button type="button" class="btn btn-primary d-flex align-items-center gap-2 order-last" @click="demoInfoOpen = false"><Icon icon="ri:store-2-line" />Open Business</button>
                            </template>
                        </InfoDialog>
                        <p class="small text-muted mt-3 mb-0">
                            Props: <code>v-model:open</code>, <code>title</code>, <code>subtitle</code>, <code>checks</code>, <code>uptime</code>,
                            <code>response</code>. Slots: default (rows: <code>.info-row</code>), <code>after</code>, <code>actions</code>. Emits <code>close</code>.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Activity log: the left card's filter list (9 Nov 2026) -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header bg-white">
                        <h2 class="h5 mb-1">Activity log filter list</h2>
                        <code>src/pages/ActivityLog/components/ActivityFilterList.vue · custom.css 33</code>
                    </div>
                    <div class="card-body p-0">
                        <p class="small text-muted px-3 pt-3">
                            The Activity log's left card: Category (icon outline when idle, filled when chosen, count pill), the chosen
                            category's types, Result, Who, and "Security, last 24 hours" as square bars against their alert points.
                            Give it the list's <code>facets</code>; each count is worked out without its own filter. Sample counts below.
                            While counts load it shows <code>SkeletonLoader</code> rows (AGENTS.md 6.9), never dashes.
                        </p>
                        <div class="px-3 pb-3">
                            <button type="button" class="btn btn-white btn-sm" @click="demoActivityLoading = !demoActivityLoading">
                                {{ demoActivityLoading ? 'Show the counts' : 'Show loading' }}
                            </button>
                        </div>
                        <div class="border-top">
                            <ActivityFilterList :facets="demoActivityLoading ? {} : demoActivityFacets" :summary="demoActivityLoading ? null : demoActivitySummary"
                                :loading="demoActivityLoading" :summaryLoading="demoActivityLoading"
                                v-model:category="demoActivityCategory" v-model:type="demoActivityType"
                                v-model:result="demoActivityResult" v-model:actor="demoActivityActor" />
                        </div>
                        <p class="small text-muted px-3 py-3 mb-0 border-top">
                            Chosen: <code>{{ demoActivityCategory || 'all' }}</code> · <code>{{ demoActivityType || 'any type' }}</code> ·
                            <code>{{ demoActivityResult || 'any result' }}</code> · <code>{{ demoActivityActor || 'anyone' }}</code>.
                            Props: <code>facets</code>, <code>summary</code>, <code>v-model:category</code> / <code>type</code> / <code>result</code> / <code>actor</code>.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Activity log: one event in full (9 Nov 2026) -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header bg-white">
                        <h2 class="h5 mb-1">Activity event panel</h2>
                        <code>src/pages/ActivityLog/components/ActivityEvent.aside.vue · custom.css 33</code>
                    </div>
                    <div class="card-body">
                        <p class="small text-muted">
                            One event from the right: why it failed, before and after, the Device (the browser's logo from Iconify's
                            <code>logos</code> set, or PaySol's tile for the counter app; system; trusted, seen before or new), then the record.
                            On the page it loads <code>GET /admin/activity/{id}</code>; here <code>preview</code> passes a sample instead.
                        </p>
                        <div class="d-flex gap-2 flex-wrap">
                            <button type="button" class="btn btn-white btn-sm" @click="openDemoEvent('locked')">A lockout on a counter</button>
                            <button type="button" class="btn btn-white btn-sm" @click="openDemoEvent('price')">A price change in Chrome</button>
                        </div>
                        <ActivityEventAside id="demoActivityEventAside" :preview="demoActivityEvent" />
                        <p class="small text-muted mt-3 mb-0">
                            Props: <code>id</code>, <code>eventId</code>, <code>ids</code> (previous / next), <code>preview</code>.
                            Emits <code>navigate</code>, <code>closed</code>, <code>filter</code> ("More from …").
                        </p>
                    </div>
                </div>
            </section>

            <!-- Motion: the console's standard transitions (custom.css 30). -->
            <section class="col-12">
                <div class="card">
                    <div class="card-header bg-white">
                        <h2 class="h5 mb-1">Motion</h2>
                        <code>src/assets/css/custom.css 30 (fade, fade-up, is-refreshing)</code>
                    </div>
                    <div class="card-body small text-muted">
                        <p class="mb-2">
                            Use <code>&lt;Transition name="fade-up" mode="out-in"&gt;</code> when content replaces content (a tab's cards),
                            <code>name="fade"</code> for things that appear and go (a list row), and <code>.is-refreshing</code> on a block whose
                            numbers are being reloaded: it dims the old numbers instead of blanking them, then <code>.is-refreshed</code> brings them back.
                            Keep motion short (200–600 ms) and purposeful; everything stops for "reduce motion".
                        </p>
                        <p class="mb-0">Skeletons (<code>SkeletonLoader</code>) are for the first load only; after that, keep the old numbers on screen while new ones load.</p>
                    </div>
                </div>
            </section>

            <!-- Alert variants: compare optional icons, tone borders, titles, and dismiss controls using the shared reference component. -->
            <section class="col-12">
                <div class="card">
                    <div class="card-header bg-white">
                        <h2 class="h5 mb-1">Alerts</h2>
                        <code>src/components/ReferenceAlert.vue</code>
                    </div>
                    <div class="card-body d-flex flex-column gap-3">
                        <p class="small text-muted mb-0">Use a short inline alert for feedback, add an icon when the tone needs a quick visual cue, and keep the border when the message needs a clearer edge.</p>
                        <div class="row g-3">
                            <div class="col-12 col-lg-6">
                                <p class="small text-uppercase fw-semibold text-muted mb-2">No icon · no tone border</p>
                                <div class="d-flex flex-column gap-2">
                                    <ReferenceAlert tone="success" message="Settings saved successfully." />
                                    <ReferenceAlert tone="info" message="Changes will apply across the platform." />
                                </div>
                            </div>
                            <div class="col-12 col-lg-6">
                                <p class="small text-uppercase fw-semibold text-muted mb-2">Icon · tone border</p>
                                <div class="d-flex flex-column gap-2">
                                    <ReferenceAlert tone="warning" bordered icon="mdi:alert-circle-outline" title="Review required" message="Some settings are incomplete." />
                                    <ReferenceAlert tone="danger" bordered icon="mdi:close-octagon-outline" title="Could not save" message="Check the fields and try again." />
                                </div>
                            </div>
                            <div class="col-12 col-lg-6">
                                <p class="small text-uppercase fw-semibold text-muted mb-2">Border · no icon</p>
                                <ReferenceAlert tone="primary" bordered title="Pending approval" message="The request is waiting for a reviewer." />
                            </div>
                            <div class="col-12 col-lg-6">
                                <p class="small text-uppercase fw-semibold text-muted mb-2">Icon · dismissible</p>
                                <ReferenceAlert tone="secondary" icon="mdi:information-outline" title="Heads up" message="This alert can be dismissed locally." dismissible />
                            </div>
                        </div>
                        <p class="small text-muted mb-0">Props: <code>tone</code>, <code>bordered</code>, <code>icon</code>, <code>title</code>, <code>message</code>, and <code>dismissible</code>. The default slot can replace the message text.</p>
                    </div>
                </div>
            </section>

            <!-- Integration settings reference: monitoring thresholds, provider keys, and balance alerts are local-only examples. -->
            <section class="col-12">
                <ReferenceIntegrationSettings />
            </section>

            <!-- Iconify tabs: use outline icons at rest and the matching filled icon for the active section. -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Iconify tab navigation</h2>
                        <code>src/components/IconifyTabs.vue</code>
                    </div>
                    <div class="card-body">
                        <IconifyTabs v-model="activeReferenceTab" :items="referenceTabs" />
                        <p class="small text-muted mt-2 mb-0">
                            Each item provides <code>icon</code> and <code>iconActive</code>. The component emits the selected value with <code>v-model</code>.
                            Active tab: <code>{{ activeReferenceTab }}</code>.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Modal and aside: demonstrate the shared shells, while page-specific forms and record data stay with their parent. -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Modal / popup title styles</h2>
                        <code>src/components/ReferenceModal.vue</code>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">Both versions use your bold black 20px modal title. The header treatment changes around it.</p>
                        <div class="d-flex flex-wrap gap-2">
                            <button type="button" class="btn btn-primary" title="Open standard modal title example" @click="openExampleModal">
                                Standard header
                            </button>
                            <button type="button" class="btn btn-white" title="Open soft modal title example" @click="openExampleSoftModal">
                                Soft grey header
                            </button>
                        </div>
                        <p class="small text-muted mt-3 mb-0">
                            Use <code>titleStyle="standard"</code> for the usual divider or <code>titleStyle="soft"</code> for the padded,
                            borderless <code>bg-light</code> header used by the POS product form. The parent opens the shell through a template ref.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Details aside: reserve a side panel for record context and quick actions, with full-width behavior on phones. -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Details aside</h2>
                        <code>src/components/ReferenceAside.vue</code>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">Your asides use two header treatments and three section heading treatments. Both keep the page visible behind the panel.</p>
                        <div class="d-flex flex-wrap gap-2">
                            <button type="button" class="btn btn-white" title="Open compact details aside" @click="openExampleAside">
                                Back arrow + title
                            </button>
                            <button type="button" class="btn btn-white" title="Open icon and subtitle aside" @click="openExampleIconAside">
                                Icon + title + subtitle
                            </button>
                            <button type="button" class="btn btn-white" title="Open Product Analytics style aside" @click="openExampleInsightsAside">
                                Analytics + date range
                            </button>
                        </div>
                        <p class="small text-muted mt-3 mb-0">
                            Choose with <code>headerStyle="details"</code> or <code>headerStyle="icon"</code>.
                            The details header supports quick actions; the icon header supports a subtitle and optional footer.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Dropdown patterns: keep plain choices simple; add imagery or contact detail only when it helps identify an option. -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Searchable dropdowns</h2>
                        <code>src/components/SelectSearchBox.vue</code>
                    </div>
                    <div class="card-body d-grid gap-3">
                        <div>
                            <label for="reference-team" class="form-label">Plain options</label>
                            <SelectSearchBox
                                id="reference-team"
                                v-model="selectedTeam"
                                :options="teamOptions"
                                placeholder="Choose a team"
                            />
                            <small class="text-muted">Options use <code>{ label, value }</code>.</small>
                        </div>
                        <div>
                            <label for="reference-country" class="form-label">Options with images</label>
                            <SelectSearchBox
                                id="reference-country"
                                v-model="selectedCountry"
                                :options="countryOptions"
                                placeholder="Choose a country"
                                :show-images="true"
                                image-key="image"
                            />
                            <small class="text-muted">Set <code>showImages</code> and the option image key.</small>
                        </div>
                        <div>
                            <label for="reference-contact" class="form-label">Contact search</label>
                            <SelectSearchBox
                                id="reference-contact"
                                v-model="selectedContact"
                                :options="contactOptions"
                                placeholder="Search name, email, or phone"
                                :contact-mode="true"
                            />
                            <small class="text-muted">Each option has <code>label</code>, <code>email</code>, <code>phone</code>, and <code>value</code>.</small>
                        </div>
                        <p class="small text-muted mb-0">
                            All three bind through <code>v-model</code>. Keep the option's label human-readable and use opaque values for IDs.
                            The contact layout is supported by <code>contactMode</code> on the shared select.
                        </p>
                    </div>
                </div>
            </section>

            <!-- View navigation: use the shared toggle when a page offers more than one presentation of the same data. -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">View navigation</h2>
                        <code>src/components/Data-tools/Data.View.Toggle.vue</code>
                    </div>
                    <div class="card-body">
                        <DataViewToggle v-model:active-view="activeView" :show-stats="false" />
                        <p class="small text-muted mt-2 mb-0">
                            Use the named model <code>v-model:active-view</code>. Enable only the views that page implements.
                            Current example: <code>{{ activeView }}</code>.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Skeletons: show placeholders during loading and match the shape of the content being replaced. -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Loading placeholders</h2>
                        <code>src/components/Loaders/SkeletonLoader.vue</code>
                    </div>
                    <div class="card-body">
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <SkeletonLoader type="avatar" width="48px" height="48px" />
                            <div class="flex-grow-1">
                                <SkeletonLoader type="text" width="55%" height="16px" class="mb-2" />
                                <SkeletonLoader type="text" :lines="2" height="12px" />
                            </div>
                        </div>
                        <SkeletonLoader type="rectangle" height="72px" :rounded="true" />
                        <p class="small text-muted mt-2 mb-0">
                            Choose the matching type (<code>text</code>, <code>avatar</code>, <code>rectangle</code>, or <code>circle</code>).
                            Source: <code>src/components/Loaders/SkeletonLoader.vue</code>.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Toasts: in real pages the parent owns status and messages; keep API text plain and trusted. -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Success and error feedback</h2>
                        <code>src/components/ImageToast.vue</code>
                    </div>
                    <div class="card-body">
                        <div class="d-flex flex-wrap gap-2">
                            <button type="button" class="btn btn-soft-success" title="Show example success" @click="showExampleToast('success')">
                                Show success
                            </button>
                            <button type="button" class="btn btn-soft-danger" title="Show example error" @click="showExampleToast('error')">
                                Show error
                            </button>
                        </div>
                        <p class="small text-muted mt-2 mb-0">
                            Parent components own toast state and handle <code>hide</code>. This component renders its message with <code>v-html</code>,
                            so pass plain trusted text only; never pass unsanitized API or user content.
                        </p>
                    </div>
                </div>
            </section>

            <!-- OTP timer: start and stop it through the exposed component methods; parent retains the surrounding OTP flow. -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">OTP countdown</h2>
                        <code>src/components/OTP/Otptimer.vue</code>
                    </div>
                    <div class="card-body">
                        <div class="d-flex align-items-center gap-2">
                        <Otptimer ref="timerRef" :seconds="30" :auto-start="false" />
                            <button type="button" class="btn btn-outline-primary" title="Start example countdown" @click="startExampleTimer">
                                Start
                            </button>
                            <button type="button" class="btn btn-outline-secondary" title="Stop example countdown" @click="stopExampleTimer">
                                Stop
                            </button>
                        </div>
                        <p class="small text-muted mt-2 mb-0">
                            The component exposes <code>start</code> and <code>stop</code>. Check its emitted events before wiring a page flow.
                            This example starts a local 30-second countdown.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Activity trail: the Activity log's day boxes for any page with a trail (sample rows, a loading toggle) -->
            <section class="col-12">
                <div class="card h-100">
                    <div class="card-header d-flex align-items-start justify-content-between gap-2">
                        <div>
                            <h2 class="h5 mb-1">Activity trail (day boxes)</h2>
                            <code>src/components/Data-tools/Activity.Days.vue</code>
                        </div>
                        <button type="button" class="btn btn-white btn-sm waves-effect" @click="trailLoading = !trailLoading">
                            {{ trailLoading ? 'Show rows' : 'Show loading' }}
                        </button>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">Use wherever one person's or one business's activity is listed (team member page, a business's Activity tab). The Activity Log page itself keeps its wider row with the business column.</p>
                        <div class="trail-list">
                            <ActivityDays :items="trailLoading ? [] : trailItems" :loading="trailLoading" :skeleton-rows="3"
                                end-note="Showing all 3 events" @open="(it) => (trailPicked = `Opened: ${it.who} ${it.verb} ${it.what}`)"
                                @who="(it) => (trailPicked = `Filter to: ${it.who}`)" />
                        </div>
                        <p v-if="trailPicked" class="small text-primary mb-2">{{ trailPicked }}</p>
                        <p class="small text-muted mb-0">
                            Props: <code>items</code> (id, at, initials, tint / fg or tintClass, badgeIcon, badgeColor, who, whoClickable, verb, what, meta, reason, pill, pillBg, pillFg),
                            <code>loading</code>, <code>loadingMore</code>, <code>hasMore</code>, <code>selectedId</code>, <code>moreLabel</code>, <code>endNote</code>, <code>skeletonRows</code>.
                            Emits <code>open</code>, <code>who</code>, <code>more</code>. Slot <code>empty</code>. Styles: custom.css 33 and 35.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Selection actions bar (File Manager style, 11 Nov 2026) -->
            <section class="col-12">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Selection actions bar (after ticking rows)</h2>
                        <code>src/components/Data-tools/Selection.Actions.bar.vue</code>
                    </div>
                    <div class="card-body p-0">
                        <p class="text-muted small px-3 pt-3">Use above any list with tick boxes once something is ticked: the File Manager's look, now on Tenants. Actions are icon + word links that tint blue on hover; "× N selected" unticks everything. Untick all here to see the bar go.</p>
                        <SelectionActionsBar v-if="barCount" :count="barCount" :actions="barActions" @action="(k, it) => barPicked = `Pressed: ${k}${it ? ' › ' + it.label : ''}`" @clear="barCount = 0">
                            <template #right><span class="text-muted font-size-13">Showing <span class="fw-bold text-black">4</span> of <span class="fw-bold text-black">5</span></span></template>
                        </SelectionActionsBar>
                        <div class="px-3 py-3">
                            <button v-if="!barCount" type="button" class="btn btn-white btn-sm mb-2" @click="barCount = 4">Tick 4 rows again</button>
                            <p class="small text-primary mb-2">{{ barPicked || 'Press an action' }}</p>
                            <p class="small text-muted mb-0">
                                Props: <code>count</code>, <code>actions</code> ([{ key, label, icon, title?, disabled?, hidden?, danger?, items? }]; <code>items</code> makes a menu), <code>busy</code>.
                                Emits <code>action</code> (key, chosen item) and <code>clear</code>. Rule: every list with tick boxes uses it (AGENTS.md 6.1 step 7). Slot <code>right</code> (e.g. "Showing X of Y"). Styles: custom.css <code>.more-actions</code> / <code>.contact-links</code> (the File Manager's).
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Document picker (Legal & Terms, 10 Nov 2026) -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header d-flex align-items-start justify-content-between gap-2">
                        <div>
                            <h2 class="h5 mb-1">Document picker (dropdown with status)</h2>
                            <code>src/components/Data-tools/Document.Picker.vue</code>
                        </div>
                        <button type="button" class="btn btn-white btn-sm waves-effect" @click="pickerLoading = !pickerLoading">{{ pickerLoading ? 'Show items' : 'Show loading' }}</button>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">Use to choose one of a few named items that each need an icon and a one-line status, at the top of a card that then shows the chosen one full width: Settings › Legal &amp; Terms (terms, privacy, refund, DPA), later templates or reports.</p>
                        <div class="border-soft rounded-3 p-3 mb-2" style="min-height: 280px;">
                            <DocumentPicker v-model="pickedDoc" :items="pickerItemsSample" :loading="pickerLoading" />
                        </div>
                        <p class="small text-primary mb-2">Chosen: {{ pickedDoc }}</p>
                        <p class="small text-muted mb-0">
                            Props: <code>modelValue</code> (key), <code>items</code> ([{ key, label, sub?, icon, iconActive?, tint?, fg? }]), <code>loading</code>, <code>disabled</code>, <code>placeholder</code>, <code>ariaLabel</code>.
                            Emits <code>update:modelValue</code> and <code>change</code> (the item). Keyboard: ↓ / Enter opens, ↑ ↓ move, Enter picks, Esc closes. Styles: custom.css 37 (<code>.doc-picker</code>).
                        </p>
                    </div>
                </div>
            </section>

            <!-- Legal prompt (PaySol Business, 11 Nov 2026) -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header d-flex align-items-start justify-content-between gap-2">
                        <div>
                            <h2 class="h5 mb-1">Legal prompt (new or changed terms)</h2>
                            <code>src/components/legal/LegalPrompt.vue</code>
                        </div>
                        <div class="d-flex gap-2">
                            <button type="button" class="btn btn-white btn-sm waves-effect" @click="legalSample = legalBlockingSample; $nextTick(() => legalRef?.check())">Blocking</button>
                            <button type="button" class="btn btn-white btn-sm waves-effect" @click="legalSample = legalLaterSample; $nextTick(() => legalRef?.check())">Scheduled</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">Mounted once in App.vue. After sign-in it reads <code>GET /tenant/legal/pending</code> and, if anything is there, asks the person to accept (<code>POST /tenant/legal/accept</code>). Terms in force now are blocking: no close, no "Later". Scheduled ones show "Remind me later", which lasts until they sign out.</p>
                        <p class="small text-muted mb-0">
                            Props: <code>id</code>, <code>active</code> (signed in), <code>preview</code> (an array in the API's shape; skips the API, as here).
                            Exposes <code>check()</code>. Emits <code>accepted</code>. Styles: custom.css (<code>.legal-prompt-item</code>).
                        </p>
                    </div>
                </div>
                <LegalPrompt ref="legalRef" id="legalPromptPreview" :preview="legalSample" :active="false" />
            </section>

            <!-- Session timeout warning modal (18 Nov 2026) -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h2 class="h5 mb-1">Session timeout warning</h2>
                            <code>src/components/guards/SessionTimeoutModal.vue</code>
                        </div>
                        <div>
                            <button type="button" class="btn btn-outline-warning btn-sm waves-effect" @click="sessionTimeoutRef?.openPreview()">
                                <i class="mdi mdi-timer-outline me-1"></i> Preview Warning
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">Mounted once in <code>App.vue</code>. Listens for user inactivity across tabs with throttled activity tracking. Shows a warning dialog 60 seconds before auto-logout with a live countdown, progress bar, and "Stay signed in" keep-alive action.</p>
                        <p class="small text-muted mb-0">
                            Composable: <code>useAutoLogout.js</code>. Exposes <code>openPreview()</code>, <code>closePreview()</code>. Emits <code>stayed</code>, <code>signed-out</code>.
                        </p>
                    </div>
                </div>
                <SessionTimeoutModal ref="sessionTimeoutRef" :preview="true" />
            </section>

            <!-- Universal Search Omnibar (18 Nov 2026) -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Universal tenant search</h2>
                        <code>src/components/search/GlobalSearch.vue</code>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">Omnibar search in the top bar scoped strictly to the active business. Supports Ctrl+K / ⌘+K shortcut, query heuristics (barcodes, phones), recent searches, and navigation actions.</p>
                        <div class="p-3 bg-light rounded-3 mb-3">
                            <GlobalSearch />
                        </div>
                        <p class="small text-muted mb-2">
                            Endpoints: <code>GET /tenant/search</code>. Results page: <code>/search</code>. Shortcut: <code>Ctrl + K</code>.
                        </p>
                        <div class="d-flex gap-2">
                            <router-link to="/search?q=tusker" class="btn btn-sm btn-soft-primary">
                                <Icon icon="ri:search-line" class="me-1" /> Open Replicated Search Results
                            </router-link>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Circular Business Avatar (Logo & Initials on Primary Color) -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Circular Business Avatar</h2>
                        <code>Logo with fallback to bold Initials on business primary_color</code>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">
                            Businesses can have a circular logo. If the logo is absent or fails to load, it falls back to bold initials on the business's own primary color background.
                        </p>
                        <div class="d-flex align-items-center gap-4 p-3 bg-light rounded-3 mb-3 flex-wrap">
                            <!-- 1. Arsenal Sports Bar (With Logo) -->
                            <div class="d-flex align-items-center gap-2">
                                <div class="sidebar-business-avatar d-flex align-items-center justify-content-center shadow-sm" style="width: 40px; height: 40px;">
                                    <img src="http://localhost:8000/storage/tenants/01m5h125ga8nqmkjn5b72s5r8n/logo-anddy5bv3txj.png" alt="Arsenal" />
                                </div>
                                <div>
                                    <div class="fw-semibold text-dark fs-13">Arsenal Sports Bar</div>
                                    <div class="fs-11 text-muted">With logo</div>
                                </div>
                            </div>

                            <!-- 2. Cleo's Kitchen (With Logo) -->
                            <div class="d-flex align-items-center gap-2">
                                <div class="sidebar-business-avatar d-flex align-items-center justify-content-center shadow-sm" style="width: 40px; height: 40px;">
                                    <img src="http://localhost:8000/storage/tenants/01m5enhgf8jnmh80r1jmgwqdqe/logo-ds1wmbcvcor2.png" alt="Cleo" />
                                </div>
                                <div>
                                    <div class="fw-semibold text-dark fs-13">Cleo's Kitchen</div>
                                    <div class="fs-11 text-muted">With logo</div>
                                </div>
                            </div>

                            <!-- 3. Absent logo: Initials on Primary Color (#ED0208) -->
                            <div class="d-flex align-items-center gap-2">
                                <div class="sidebar-business-avatar d-flex align-items-center justify-content-center shadow-sm" style="width: 40px; height: 40px;">
                                    <span class="avatar-title font-size-14 fw-bold text-uppercase" style="background-color: #ED0208;">AS</span>
                                </div>
                                <div>
                                    <div class="fw-semibold text-dark fs-13">Arsenal Bar</div>
                                    <div class="fs-11 text-muted">Initials on #ED0208</div>
                                </div>
                            </div>

                            <!-- 4. Absent logo: Initials on Primary Color (#744214) -->
                            <div class="d-flex align-items-center gap-2">
                                <div class="sidebar-business-avatar d-flex align-items-center justify-content-center shadow-sm" style="width: 40px; height: 40px;">
                                    <span class="avatar-title font-size-14 fw-bold text-uppercase" style="background-color: #744214;">CK</span>
                                </div>
                                <div>
                                    <div class="fw-semibold text-dark fs-13">Cleo's Kitchen</div>
                                    <div class="fs-11 text-muted">Initials on #744214</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Stock & Inventory Health Indicators (18 Nov 2026) -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Stock Health &amp; Inventory Badges</h2>
                        <code>pages/Stock/helpers/stockMeta.js</code> &middot; <code>pages/Stock/Stock.List.vue</code>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">
                            Visual progress bars and badges for inventory on-hand vs. reorder point (ROL). Reuses Kelvin's formula from <code>Products.inventory.pos.table.vue</code>.
                        </p>

                        <!-- Stock Health Indicators -->
                        <div class="d-flex flex-column gap-3 mb-4">
                            <!-- Safe -->
                            <div class="p-2 border rounded bg-light">
                                <div class="d-flex justify-content-between align-items-baseline mb-1">
                                    <span class="fw-bold fs-13 text-dark">Coca-Cola 330ml Can</span>
                                    <span class="fs-12 text-success fw-semibold">48 / 20 ROL &middot; Safe (100%)</span>
                                </div>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar bg-success" role="progressbar" style="width: 100%;"></div>
                                </div>
                            </div>

                            <!-- Low -->
                            <div class="p-2 border rounded bg-light">
                                <div class="d-flex justify-content-between align-items-baseline mb-1">
                                    <span class="fw-bold fs-13 text-dark">Tusker Lager 500ml</span>
                                    <span class="fs-12 text-warning fw-semibold">12 / 24 ROL &middot; Low (50%)</span>
                                </div>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar bg-warning" role="progressbar" style="width: 50%;"></div>
                                </div>
                            </div>

                            <!-- Critically Low -->
                            <div class="p-2 border rounded bg-light">
                                <div class="d-flex justify-content-between align-items-baseline mb-1">
                                    <span class="fw-bold fs-13 text-dark">White Cap 500ml</span>
                                    <span class="fs-12 text-danger fw-semibold">3 / 24 ROL &middot; Critically Low (12%)</span>
                                </div>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar bg-danger" role="progressbar" style="width: 12%;"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Status Badges -->
                        <h6 class="fs-12 text-uppercase text-muted fw-semibold mb-2">Inventory Status Badges</h6>
                        <div class="d-flex flex-wrap gap-2 mb-3">
                            <span class="badge bg-danger text-white">Out of Stock</span>
                            <span class="badge bg-warning text-dark">Low Stock</span>
                            <span class="badge bg-success text-white">In Stock</span>
                            <span class="badge bg-secondary text-white">No ROL Set</span>
                            <span class="badge bg-light text-muted">Uncounted</span>
                        </div>

                        <!-- Movement types -->
                        <h6 class="fs-12 text-uppercase text-muted fw-semibold mb-2">Ledger Movement Badges</h6>
                        <div class="d-flex flex-wrap gap-2">
                            <span class="badge bg-success-subtle text-success">Goods Received</span>
                            <span class="badge bg-primary-subtle text-primary">Sale</span>
                            <span class="badge bg-info-subtle text-info">Audit Count</span>
                            <span class="badge bg-danger-subtle text-danger">Waste / Spoilage</span>
                            <span class="badge bg-warning-subtle text-warning">Staff Consumption</span>
                            <span class="badge bg-secondary-subtle text-secondary">Transfer Out</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Suppliers Directory & Profile Reference (18 Nov 2026) -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Suppliers &amp; Vendor Directory</h2>
                        <code>pages/Suppliers/Suppliers.List.vue</code> &middot; <code>components/SupplierForm.modal.vue</code>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">
                            Directory for registration and management of intake delivery vendors, KRA tax PINs, contact persons, payment terms and immutable delivery logs.
                        </p>

                        <!-- Sample Supplier Card Preview -->
                        <div class="border rounded p-3 mb-3 bg-light">
                            <div class="d-flex align-items-center justify-content-between mb-2">
                                <div class="d-flex align-items-center gap-2">
                                    <div class="avatar-xs flex-shrink-0">
                                        <span class="avatar-title rounded-circle fw-bold font-size-12 bg-primary text-white">BD</span>
                                    </div>
                                    <div>
                                        <h6 class="fw-bold text-dark mb-0">Brookside Dairies Ltd</h6>
                                        <small class="text-muted font-size-11">PIN: P051234567Z &middot; Industrial Area</small>
                                    </div>
                                </div>
                                <span class="badge bg-success-subtle text-success font-size-12">Active</span>
                            </div>
                            <div class="d-flex flex-wrap gap-2 align-items-center pt-2 border-top">
                                <span class="badge bg-white text-secondary border font-size-12">
                                    <Icon icon="ri:money-dollar-circle-line" class="me-1 align-middle" /> Net 30 Days
                                </span>
                                <span class="badge bg-white text-dark border font-size-12">
                                    <Icon icon="ri:phone-line" class="me-1 align-middle text-primary" /> +254 712 345 678
                                </span>
                                <span class="ms-auto text-muted fs-12">14 Deliveries &middot; KES 248,500</span>
                            </div>
                        </div>

                        <!-- Payment Terms Options -->
                        <h6 class="fs-12 text-uppercase text-muted fw-semibold mb-2">Standard Payment Terms</h6>
                        <div class="d-flex flex-wrap gap-2 mb-3">
                            <span class="badge bg-light text-dark border font-size-12">Cash on Delivery (COD)</span>
                            <span class="badge bg-light text-dark border font-size-12">Net 7 Days</span>
                            <span class="badge bg-light text-dark border font-size-12">Net 14 Days</span>
                            <span class="badge bg-light text-dark border font-size-12">Net 30 Days</span>
                            <span class="badge bg-light text-dark border font-size-12">Prepaid</span>
                            <span class="badge bg-light text-dark border font-size-12">Consignment</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Role picker (Staff, 12 Nov 2026) -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Role picker</h2>
                        <code>src/components/Data-tools/Role.Picker.vue</code>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">Use to choose one role (or any one-of-a-few option that needs a sentence of explanation): Add Staff and a staff member's Edit.</p>
                        <RolePicker v-model="sampleRole" :roles="ASSIGNABLE_ROLES" :meta="ROLE_META" />
                        <p class="small text-primary mt-2 mb-2">Chosen: {{ sampleRole }}</p>
                        <p class="small text-muted mb-0">
                            Props: <code>modelValue</code>, <code>roles</code> (keys in order), <code>meta</code> ({ key: { label, about, icon, iconActive, tint } }), <code>disabled</code>, <code>ariaLabel</code>.
                            Emits <code>update:modelValue</code>. Roles and words: <code>pages/Staff/helpers/staffMeta.js</code>. Styles: custom.css (<code>.role-picker</code>).
                        </p>
                    </div>
                </div>
            </section>

            <!-- Branch scope picker (Staff, 12 Nov 2026) -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Branch scope picker ("Works at")</h2>
                        <code>src/components/Data-tools/Branch.Scope.Picker.vue</code>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">Use wherever someone is limited to some branches: staff now, later counter devices and reports. An empty list means all branches (the API's <code>branch_scope</code> null).</p>
                        <BranchScopePicker id="testScope" v-model="sampleScope" :branches="sampleBranches" />
                        <p class="small text-primary mt-2 mb-2">Value: {{ JSON.stringify(sampleScope) }}</p>
                        <p class="small text-muted mb-0">
                            Props: <code>modelValue</code> (ids), <code>branches</code> ([{ id, name, is_main, is_active }] from <code>GET /tenant/branches</code>), <code>loading</code>, <code>disabled</code>, <code>id</code>.
                            Emits <code>update:modelValue</code>; exposes <code>isValid()</code> ("Only some" with nothing ticked is not). Styles: custom.css (<code>.branch-scope-row</code>).
                        </p>
                    </div>
                </div>
            </section>

            <!-- Pack rows (Products, 12 Nov 2026) -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Pack rows (box, carton, crate)</h2>
                        <code>src/components/Data-tools/Pack.Rows.vue</code>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">Use wherever one item is also sold in bigger packs: Add Product now, later product edit and receiving stock. Tap a chip to fill the name and the usual count; the per-piece price and the saving show under each row.</p>
                        <div class="bg-light rounded p-3">
                            <PackRows id="testPacks" v-model="samplePacks" unit-label="Bottles" unit-price="250" />
                        </div>
                        <p class="small text-primary mt-2 mb-2">Value: {{ JSON.stringify(samplePacks.map(({ _key, ...p }) => p)) }}</p>
                        <p class="small text-muted mb-0">
                            Props: <code>modelValue</code> ([{ _key, name, units, selling_price, cost_price, barcode }]), <code>unitLabel</code>, <code>unitPrice</code> (for the saving line), <code>errors</code> (the API's 422 errors as sent: <code>packs.0.barcode</code>), <code>disabled</code>, <code>id</code>.
                            Emits <code>update:modelValue</code>. Drop <code>_key</code> before sending. Names and usual counts: <code>pages/Products/helpers/productMeta.js</code>. Styles: custom.css (<code>.pack-row</code>, <code>.pack-chip</code>).
                        </p>
                    </div>
                </div>
            </section>

            <!-- Billing period switch (Plans, 10 Nov 2026) -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Billing period switch</h2>
                        <code>src/components/Data-tools/Billing.Period.Switch.vue</code>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">Use to choose Monthly, Quarterly, 6 months or Annual: the Plans page, Compare plans, and later pricing or a business's Change plan. Centre it under a title.</p>
                        <div class="d-flex justify-content-center mb-3"><BillingPeriodSwitch v-model="samplePeriod" :periods="samplePeriods" /></div>
                        <p class="small text-primary mb-2">Chosen: {{ samplePeriod }}</p>
                        <p class="small text-muted mb-0">
                            Props: <code>modelValue</code> (period key), <code>periods</code> ([{ key, label, badge? }], defaults to the four), <code>ariaLabel</code>, <code>disabled</code>.
                            Emits <code>update:modelValue</code>. Styles: custom.css 36 (<code>.period-switch</code>).
                        </p>
                    </div>
                </div>
            </section>

            <!-- Avatar stack (Plans, 10 Nov 2026) -->
            <section class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header d-flex align-items-start justify-content-between gap-2">
                        <div>
                            <h2 class="h5 mb-1">Avatar stack (count with faces)</h2>
                            <code>src/components/Data-tools/Avatar.Stack.vue</code>
                        </div>
                        <button type="button" class="btn btn-white btn-sm waves-effect" @click="stackLoading = !stackLoading">{{ stackLoading ? 'Show faces' : 'Show loading' }}</button>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">Use where a card says how many businesses or people something has and opens the full list: the businesses on a plan. The count sits on the left, then faces, "+N", a dashed circle and the arrow.</p>
                        <div class="border-soft rounded-3 p-3 mb-2">
                            <AvatarStack :items="stackItems" :total="14" :loading="stackLoading" note="3 on trial · 1 overdue" @open="stackPicked = 'Opened the full list'" />
                        </div>
                        <div class="border-soft rounded-3 p-3 mb-2">
                            <AvatarStack :items="[]" :total="0" :clickable="false" one="person" many="people" />
                        </div>
                        <p v-if="stackPicked" class="small text-primary mb-2">{{ stackPicked }}</p>
                        <p class="small text-muted mb-0">
                            Props: <code>items</code> ([{ id, name, initials?, image?, tint?, fg? }]), <code>total</code>, <code>max</code> (3), <code>one</code> / <code>many</code>, <code>note</code>,
                            <code>loading</code>, <code>showEmpty</code>, <code>clickable</code>, <code>goLabel</code>. Emits <code>open</code>. Styles: custom.css 36 (<code>.avatar-stack</code>).
                        </p>
                    </div>
                </div>
            </section>

            <!-- Plan card (Plans, 10 Nov 2026) -->
            <section class="col-12">
                <div class="card h-100">
                    <div class="card-header">
                        <h2 class="h5 mb-1">Plan card</h2>
                        <code>src/pages/Plans/components/PlanCard.vue</code>
                    </div>
                    <div class="card-body">
                        <p class="text-muted small">One plan in the Plans slider: colour bar, icon, state, price for the chosen period, limits and trial, what it adds, payment methods, the businesses on it, Edit. Change the period above to see the price change.</p>
                        <div class="row">
                            <div class="col-md-6 col-xl-4">
                                <PlanCard :plan="samplePlan" :period="samplePeriod" :faces="stackItems" can-manage
                                    @edit="planPicked = 'Edit: opens the plan panel'" @businesses="planPicked = 'Businesses: opens the plan panel on its Businesses tab'" />
                            </div>
                            <div class="col-md-6 col-xl-8">
                                <p v-if="planPicked" class="small text-primary">{{ planPicked }}</p>
                                <p class="small text-muted mb-0">
                                    Props: <code>plan</code> (a GET /admin/plans row), <code>period</code>, <code>faces</code>, <code>facesLoading</code>, <code>canManage</code> (Edit or View),
                                    <code>selected</code>. Emits <code>edit</code>, <code>businesses</code>. Helpers: <code>pages/Plans/helpers/planMeta.js</code> (icons, colours, money, periods).
                                    Styles: custom.css 36 (<code>.plan-card</code>).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <!-- Toast instance: included once at page level, as in regular screens. -->
        <ImageToast
            :status="toastStatus"
            :title="toastTitle"
            :message="toastMessage"
            @hide="toastStatus = null"
        />
    </main>

    <!-- Standard title treatment: bold black fs-4 title on the normal modal header. -->
    <ReferenceModal ref="exampleModal" id="referenceStandardModal" title="Edit contact" size="modal-lg modal-fullscreen-sm-down" title-style="standard">
        <div class="mb-3">
            <label for="example-contact-name" class="form-label">Name</label>
            <input id="example-contact-name" class="form-control" value="Amina Wanjiku" />
        </div>
        <div class="row g-3">
            <div class="col-12 col-md-6">
                <label for="example-contact-email" class="form-label">Email</label>
                <input id="example-contact-email" type="email" class="form-control" value="amina@example.test" />
            </div>
            <div class="col-12 col-md-6">
                <label for="example-contact-phone" class="form-label">Phone</label>
                <input id="example-contact-phone" type="tel" class="form-control" value="+254 712 345 678" />
            </div>
        </div>
        <template #footer>
            <button type="button" class="btn btn-white" title="Cancel and close" @click="exampleModal?.close()">Cancel</button>
            <button type="button" class="btn btn-primary" title="Save example contact" @click="exampleModal?.close()">Save changes</button>
        </template>
    </ReferenceModal>

    <!-- Soft title treatment: same project title typography in a padded, borderless grey header. -->
    <ReferenceModal ref="exampleSoftModal" id="referenceSoftModal" title="Product details" size="modal-lg modal-fullscreen-sm-down" title-style="soft">
        <div class="d-flex align-items-center gap-3 pb-3 border-bottom">
            <div class="rounded border bg-light p-3"><i class="mdi mdi-package-variant-closed fs-2 text-secondary"></i></div>
            <div>
                <h3 class="h5 mb-1">Coca Cola</h3>
                <span class="text-muted small">Matched by barcode</span>
            </div>
        </div>
        <p class="text-muted mt-3 mb-0">The heading stays <code>h5.modal-title.fw-bold.text-black.fs-4</code>; the grey header gives the product form a softer frame.</p>
        <template #footer>
            <button type="button" class="btn btn-white" title="Close soft header example" @click="exampleSoftModal?.close()">Close</button>
            <button type="button" class="btn btn-primary" title="Continue from soft header example" @click="exampleSoftModal?.close()">Continue</button>
        </template>
    </ReferenceModal>

    <!-- Example aside: sticky grey section headings and detail rows follow the project's record detail convention. -->
    <ReferenceAside ref="exampleAside" id="referenceContactAside" title="Contact details">
        <template #actions>
            <!-- The Product Analytics aside puts its quick actions beside the title. These are local style examples. -->
            <div class="d-flex align-items-center px-2" title="Toggle example status">
                <div class="form-check form-switch form-switch-md mb-0">
                    <input id="referenceAsideActive" v-model="analyticsEnabled" class="form-check-input" type="checkbox" role="switch" />
                    <label class="form-check-label" for="referenceAsideActive"></label>
                </div>
            </div>
            <button type="button" class="btn header-item noti-icon waves-effect" title="Edit example item" aria-label="Edit example item" @click="showAsideActionExample('Edit')">
                <i class="bx bx-edit-alt" aria-hidden="true"></i>
            </button>
            <button type="button" class="btn header-item noti-icon waves-effect" title="Change example image" aria-label="Change example image" @click="showAsideActionExample('Image')">
                <i class="bx bx-camera" aria-hidden="true"></i>
            </button>
        </template>
        <div class="p-3 d-flex align-items-center gap-3 bg-light">
            <div class="contact-search-initials" aria-hidden="true">AW</div>
            <div>
                <h3 class="h5 mb-1">Amina Wanjiku</h3>
                <span class="text-muted small">Operations contact</span>
            </div>
        </div>
        <AsideSectionHeading title="Contact" />
        <div class="reference-detail-row"><span class="text-muted">Email</span><span>amina@example.test</span></div>
        <div class="reference-detail-row"><span class="text-muted">Phone</span><span>+254 712 345 678</span></div>
        <AsideSectionHeading title="Account" variant="plain" />
        <div class="reference-detail-row"><span class="text-muted">Status</span><span class="badge bg-success-subtle text-success">Active</span></div>
        <div class="reference-detail-row"><span class="text-muted">Added</span><span>Today</span></div>
    </ReferenceAside>

    <!-- Alternate icon header: matches the title, subtitle, round icon, and close layout in page.layout.aside.vue. -->
    <ReferenceAside
        ref="exampleIconAside"
        id="referenceSettingsAside"
        title="Business defaults"
        subtitle="Settings for this workspace"
        icon="mdi mdi-cog-outline"
        header-style="icon"
    >
        <AsideSectionHeading title="Localization" variant="plain" />
        <div class="reference-detail-row"><span class="text-muted">Country</span><span>Kenya</span></div>
        <div class="reference-detail-row"><span class="text-muted">Currency</span><span>KES</span></div>
        <div class="reference-detail-row"><span class="text-muted">Time zone</span><span>Africa/Nairobi</span></div>
        <template #footer>
            <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-white" title="Cancel and close settings" @click="exampleIconAside?.close()">Cancel</button>
                <button type="button" class="btn btn-primary" title="Save example settings" @click="exampleIconAside?.close()">Save changes</button>
            </div>
        </template>
    </ReferenceAside>

    <!-- Third aside example: Product Analytics quick actions plus the white Stock Insights heading and date range. -->
    <ReferenceAside ref="exampleInsightsAside" id="referenceInsightsAside" title="Item Analytics">
        <template #actions>
            <div class="d-flex align-items-center px-2" title="Toggle example item status">
                <div class="form-check form-switch form-switch-md mb-0">
                    <input id="referenceInsightsActive" class="form-check-input" type="checkbox" role="switch" checked />
                    <label class="form-check-label" for="referenceInsightsActive"></label>
                </div>
            </div>
            <button type="button" class="btn header-item noti-icon waves-effect" title="Edit example item" aria-label="Edit example item" @click="showAsideActionExample('Edit')">
                <i class="bx bx-edit-alt" aria-hidden="true"></i>
            </button>
            <button type="button" class="btn header-item noti-icon waves-effect" title="Change example image" aria-label="Change example image" @click="showAsideActionExample('Image')">
                <i class="bx bx-camera" aria-hidden="true"></i>
            </button>
        </template>
        <AsideSectionHeading title="Stock Insights" variant="toolbar">
            <DateRangePicker
                v-model:date-from="insightDateFrom"
                v-model:date-to="insightDateTo"
                custom-range-title="Last 30 days"
            />
        </AsideSectionHeading>
        <div class="p-3">
            <div class="border rounded p-3 mb-3">
                <span class="text-muted small d-block">Current stock level</span>
                <strong class="fs-4">1,402</strong>
                <span class="text-success small ms-2"><i class="mdi mdi-trending-up"></i> +5%</span>
            </div>
            <div class="border rounded p-3">
                <span class="text-muted small d-block">Daily sales</span>
                <strong class="fs-4">1,404</strong>
                <span class="text-danger small ms-2"><i class="mdi mdi-trending-down"></i> -5%</span>
            </div>
            <p class="text-muted small mt-3 mb-0">The white sticky heading keeps the date-range control visible while scrolling analytics.</p>
        </div>
    </ReferenceAside>
</template>

<style scoped>
.reference-detail-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 24px;
    border-bottom: 1px solid var(--bs-border-color);
}

.reference-count-chip {
    min-width: 32px;
    height: 32px;
    border: 1px solid var(--bs-border-color);
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    color: var(--bs-secondary-color);
    font-size: 12px;
}

.reference-change-item {
    position: relative;
    padding: 0 0 18px 22px;
}

.reference-change-item:last-child { padding-bottom: 0; }

.reference-change-item::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 14px;
    bottom: -2px;
    width: 1px;
    background: var(--bs-border-color);
}

.reference-change-item:last-child::before { display: none; }

.reference-change-dot {
    position: absolute;
    left: 0;
    top: 4px;
    width: 11px;
    height: 11px;
    border: 2px solid;
    border-radius: 50%;
    background: #fff;
}

.reference-dot-ok { border-color: var(--bs-primary); }
.reference-dot-failed { border-color: var(--bs-danger); }

.reference-key-chip {
    display: inline-block;
    padding: 2px 8px;
    border: 1px solid var(--bs-border-color);
    border-radius: 6px;
    background: var(--bs-light);
    color: var(--bs-body-color);
    font-family: var(--bs-font-monospace);
    font-size: 11px;
}

.reference-browser-icon {
    width: 18px;
    height: 18px;
    flex: 0 0 18px;
}

@media (max-width: 575.98px) {
    .reference-detail-row { padding: 12px 16px; }
}
</style>
