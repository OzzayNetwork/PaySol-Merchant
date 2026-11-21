<template>
    <div class="container-fluid">

        <!-- Module tabs first, on the page (not in a card). Counts come from the "everything" search. -->
        <div class="ps-tabs mb-4">
            <button type="button" class="ps-tab" :class="{ on: category === 'all' }" @click="setCategory('all')">
                All <span class="ps-count">{{ countLabel('all') }}</span>
            </button>
            <button v-for="m in visibleModules" :key="m.key" type="button" class="ps-tab" :class="{ on: category === m.key }"
                @click="setCategory(m.key)">
                {{ m.label }} <span class="ps-count" :class="{ zero: !counts[m.key] }">{{ countLabel(m.key) }}</span>
            </button>
        </div>

        <!-- What was searched, large; how many and how fast under it; Sort at the far right -->
        <div class="d-flex align-items-end justify-content-between gap-3 flex-wrap mb-4">
            <div class="min-w-0">
                <h1 class="ps-title text-truncate">Showing results for “{{ q }}”</h1>
                <p class="text-muted mb-0 font-size-14">
                    <template v-if="loading">Searching in {{ tenantName }}…</template>
                    <template v-else>Found <strong class="text-dark">{{ shownTotal }} {{ shownTotal === 1 ? 'result' : 'results' }}</strong>
                        in {{ elapsed }}</template>
                </p>
            </div>
            <!-- Sort: the API returns each group newest first. "Name, A to Z" orders each group's rows -->
            <div v-if="!noResultsAtAll" class="d-flex align-items-center gap-2 flex-shrink-0">
                <label for="ps-sort" class="text-muted small mb-0">Sort by</label>
                <select id="ps-sort" v-model="sortBy" class="form-select form-select-sm ps-sort">
                    <option value="newest">Newest first</option>
                    <option value="name">Name, A to Z</option>
                </select>
            </div>
        </div>

        <!-- Fewer than 2 letters: nothing to search -->
        <div v-if="q.length < 2" class="card">
            <div class="card-body text-center py-5">
                <Icon icon="ri:search-2-line" class="display-4 text-muted opacity-50" />
                <h5 class="mt-3">Type at least 2 letters</h5>
                <p class="text-muted mb-0">Use the search at the top, or press <span class="ps-kbd">{{ SEARCH_SHORTCUT_LABEL }}</span> on any page.</p>
            </div>
        </div>

        <!-- Nothing found anywhere, no filters on: one centred card, no filters panel -->
        <div v-else-if="noResultsAtAll" class="row justify-content-center">
            <div class="col-xl-8 col-lg-10">
                <!-- No records, but maybe the place they were looking for -->
                <SearchDestinationsCard :items="destinations" />
                <div class="card">
                    <div class="card-body px-4 px-md-5 py-5">
                        <div class="text-center">
                            <span class="ps-empty-ic"><Icon icon="ri:search-2-line" /></span>
                            <h4 class="mt-3 mb-1 font-size-18">{{ destinations.length ? `No records match “${q}”` : `Nothing matches “${q}”` }}</h4>
                            <p class="text-muted mx-auto mb-0" style="max-width: 520px;">
                                Nothing in {{ searchedList }}. It may be spelled differently, or not be in {{ tenantName }} yet.
                            </p>
                        </div>

                        <!-- How to search -->
                        <div class="mt-4">
                            <div class="ps-lbl mb-1">Try searching by</div>
                            <div class="ps-tip">
                                <span class="ps-tip-ic"><Icon icon="ri:text" /></span>
                                <span><span class="d-block text-dark fw-medium">Part of the product or person's name</span>
                                    <span class="text-muted small">Fewer letters find more: <span class="ps-mono">tusk</span> finds Tusker Lager.</span></span>
                            </div>
                            <div class="ps-tip">
                                <span class="ps-tip-ic"><Icon icon="ri:barcode-line" /></span>
                                <span><span class="d-block text-dark fw-medium">A barcode or SKU</span>
                                    <span class="text-muted small">Products match on barcodes and internal SKUs, e.g. <span class="ps-mono">616110</span>.</span></span>
                            </div>
                            <div class="ps-tip">
                                <span class="ps-tip-ic"><Icon icon="ri:phone-line" /></span>
                                <span><span class="d-block text-dark fw-medium">A staff member's phone number</span>
                                    <span class="text-muted small">Team members match on phone numbers, e.g. <span class="ps-mono">0712448210</span>.</span></span>
                            </div>
                        </div>

                        <!-- Really not added yet: add it (managers / owners only) -->
                        <div v-if="isManager" class="d-flex align-items-center justify-content-between gap-3 flex-wrap mt-4 pt-4 border-top">
                            <span><span class="d-block text-dark fw-medium">Not added to this business yet?</span>
                                <span class="text-muted small">Add it now so the next search finds it immediately.</span></span>
                            <span class="d-flex gap-2">
                                <router-link to="/products/add" class="btn btn-primary d-inline-flex align-items-center gap-1">
                                    <Icon icon="ri:add-line" /> Add a product
                                </router-link>
                                <router-link to="/staff/add" class="btn btn-light d-inline-flex align-items-center gap-1">
                                    <Icon icon="ri:user-add-line" /> Add staff member
                                </router-link>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Feedback strip: a search that found nothing is the one most worth hearing about -->
                <div class="ps-note mb-3 align-items-center">
                    <Icon icon="ri:message-3-line" class="text-primary fs-5" />
                    <span class="flex-grow-1"><strong class="text-dark">How can we improve search?</strong>
                        <span class="text-muted"> {{ feedbackSent ? 'Thanks, your feedback on this search was sent.' : 'Tell us what you expected to find.' }}</span></span>
                    <button type="button" class="btn btn-soft-primary btn-sm flex-shrink-0" @click="openFeedback">Give feedback</button>
                </div>

                <!-- Modules this person can't read: named, never shown -->
                <div v-if="hiddenModules.length" class="ps-note">
                    <Icon icon="ri:lock-line" class="fs-5" />
                    <span><strong class="text-dark">{{ hiddenList }} {{ hiddenModules.length === 1 ? "isn't" : "aren't" }} searched for you.</strong>
                        <span class="text-muted"> Your role ({{ userRoleLabel }}) doesn't include management access. Ask a business owner if you need it.</span></span>
                </div>
            </div>
        </div>

        <!-- Results and filters -->
        <div v-else class="row">

            <!-- ================= Results, grouped by module ================= -->
            <div class="col-lg-9">

                <!-- Skeleton Loader -->
                <template v-if="loading">
                    <div v-for="g in 2" :key="'sk' + g" class="card">
                        <div class="card-body d-flex align-items-center gap-3">
                            <SkeletonLoader type="rectangle" width="34px" height="34px" />
                            <SkeletonLoader type="text" :width="rand(120, 220)" height="16px" />
                        </div>
                        <div v-for="r in 3" :key="r" class="ps-row">
                            <SkeletonLoader type="rectangle" width="40px" height="40px" />
                            <div class="flex-grow-1">
                                <SkeletonLoader type="text" :width="rand(140, 300)" height="15px" />
                                <SkeletonLoader type="text" :width="rand(200, 420)" height="12px" class="mt-2" />
                            </div>
                        </div>
                    </div>
                </template>

                <template v-else>
                    <!-- Pages & actions first: where to go, then the records -->
                    <SearchDestinationsCard :items="destinations" />

                    <div v-for="sec in sections" :key="sec.key" class="card overflow-hidden">
                        <!-- Group head -->
                        <div class="card-body d-flex align-items-center justify-content-between gap-3 py-3">
                            <span class="d-flex align-items-center gap-3 min-w-0">
                                <span class="ps-tile" :style="{ background: sec.tint, color: sec.fg }">
                                    <Icon :icon="sec.icon" />
                                </span>
                                <span class="min-w-0">
                                    <span class="d-block fw-semibold text-dark font-size-15">{{ sec.label }}
                                        <span class="text-muted fw-normal">· {{ countLabel(sec.key) }}</span></span>
                                    <span class="text-muted small">{{ sec.note }}</span>
                                </span>
                            </span>
                            <router-link :to="sec.listLink" class="small fw-medium text-nowrap d-inline-flex align-items-center gap-1">
                                Open {{ sec.label }} <Icon icon="ri:arrow-right-line" />
                            </router-link>
                        </div>

                        <!-- Rows -->
                        <div v-for="row in sec.rows" :key="row.category + row.id" class="ps-row cursor-pointer" @click="openRow(row)">
                            <!-- Picture / Avatar: photo when present, else initials on role colour or module icon -->
                            <span v-if="showImage(row)" class="ps-tile ps-tile-lg ps-tile-img"
                                :class="{ 'is-round': row.category === 'staff', 'is-product': row.category === 'products' }">
                                <img :src="row.image_url" :alt="row.title" loading="lazy" @error="markBroken(row)">
                            </span>
                            <span v-else class="ps-tile ps-tile-lg"
                                :class="{ 'is-round': row.category === 'staff', 'is-product': row.category === 'products' }"
                                :style="fallbackStyle(row, sec)">
                                <template v-if="initials(row)">{{ initials(row) }}</template>
                                <Icon v-else :icon="row.category === 'products' ? 'ri:price-tag-3-line' : sec.icon" />
                            </span>

                            <span class="min-w-0 flex-grow-1">
                                <span class="ps-crumb">{{ tenantName }} <Icon icon="ri:arrow-right-s-line" /> {{ sec.label }} <Icon icon="ri:arrow-right-s-line" /> <span class="text-truncate">{{ row.title }}</span></span>
                                <span class="d-flex align-items-center gap-2 flex-wrap">
                                    <span class="fw-semibold text-dark font-size-15">{{ hit(row.title)[0] }}<mark class="ps-hit">{{ hit(row.title)[1] }}</mark>{{ hit(row.title)[2] }}</span>
                                    <span v-if="row.badge" class="badge rounded-pill" :class="badgeTone(row.badge)">{{ row.badge }}</span>
                                </span>
                                <span v-if="row.subtitle" class="d-block text-muted small mt-1 text-truncate">{{ row.subtitle }}</span>
                                <span class="d-flex gap-3 flex-wrap mt-2 small">
                                    <!-- The field that matched, when it is not the name -->
                                    <span v-if="matchedElsewhere(row)">
                                        <span class="text-muted">{{ MATCHED_FIELD_LABELS[row.matched_field] || row.matched_field }}: </span>
                                        {{ hit(row.matched_text)[0] }}<mark class="ps-hit">{{ hit(row.matched_text)[1] }}</mark>{{ hit(row.matched_text)[2] }}
                                    </span>
                                    <span v-if="row.location"><Icon icon="ri:price-tag-2-line" class="text-muted" /> {{ row.location }}</span>
                                </span>
                            </span>
                            <router-link :to="resultLink(row)" class="btn btn-soft-primary btn-sm flex-shrink-0 d-none d-sm-inline-flex" @click.stop>
                                {{ sec.action }}
                            </router-link>
                        </div>

                        <!-- More in this group: the module's own tab shows up to 50 -->
                        <div v-if="sec.more" class="border-top text-center py-2">
                            <button type="button" class="btn btn-light btn-sm" @click="setCategory(sec.key)">
                                Show {{ sec.moreLabel }} more in {{ sec.label }}
                            </button>
                        </div>
                    </div>

                    <!-- Filters on and nothing left -->
                    <div v-if="!sections.length" class="card">
                        <div class="card-body text-center py-5">
                            <Icon icon="ri:filter-3-line" class="display-4 text-muted opacity-50" />
                            <h5 class="mt-3">Nothing for “{{ q }}” {{ hasFilters ? 'with these filters' : 'here' }}</h5>
                            <p class="text-muted">Try part of a name, a barcode, a phone number{{ hasFilters ? ', or loosen the filters' : '' }}.</p>
                            <button v-if="hasFilters" type="button" class="btn btn-light" @click="resetFilters">Reset filters</button>
                            <button v-else-if="category !== 'all'" type="button" class="btn btn-light" @click="setCategory('all')">Search everything</button>
                        </div>
                    </div>
                </template>

                <!-- Modules this person can't read: named, never shown -->
                <div v-if="hiddenModules.length" class="ps-note mb-4">
                    <Icon icon="ri:lock-line" class="fs-5" />
                    <span><strong class="text-dark">{{ hiddenList }} {{ hiddenModules.length === 1 ? "isn't" : "aren't" }} searched for you.</strong>
                        <span class="text-muted"> Your role ({{ userRoleLabel }}) does not have permission to view them.</span></span>
                </div>
            </div>

            <!-- ================= Filters: stay in view while the results scroll ================= -->
            <div class="col-lg-3">
                <div class="card ps-filters">
                    <div class="card-body">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <h5 class="font-size-15 mb-0">Filters
                                <span v-if="filterCount" class="badge rounded-pill bg-primary ms-1">{{ filterCount }}</span></h5>
                            <button v-if="hasFilters" type="button" class="btn btn-link btn-sm p-0" @click="resetFilters">Reset</button>
                        </div>

                        <!-- Section / Category filter -->
                        <div class="ps-lbl">Section</div>
                        <p class="text-muted small mb-2">Scope results to a specific module.</p>

                        <label for="ps-category-select" class="text-muted small mb-1">Module</label>
                        <select id="ps-category-select" class="form-select mb-3" :value="category" @change="setCategory($event.target.value)">
                            <option value="all">All sections ({{ countLabel('all') }})</option>
                            <option v-for="m in visibleModules" :key="'opt_' + m.key" :value="m.key">
                                {{ m.label }} ({{ countLabel(m.key) }})
                            </option>
                        </select>

                        <!-- Status filter: active vs inactive -->
                        <div class="ps-lbl">Status</div>
                        <p class="text-muted small mb-2">Active items or archived / inactive.</p>

                        <label for="ps-status-select" class="text-muted small mb-1">State</label>
                        <select id="ps-status-select" class="form-select" :value="statusFilter" @change="setStatus($event.target.value)">
                            <option value="all">All statuses</option>
                            <option value="active">Active only</option>
                            <option value="inactive">Inactive only</option>
                        </select>

                        <!-- The shortcut -->
                        <div class="d-flex align-items-center gap-2 mt-4 pt-3 border-top">
                            <span class="ps-kbd">{{ SEARCH_SHORTCUT_LABEL }}</span>
                            <span class="text-muted small">Press <strong>{{ SEARCH_SHORTCUT_LABEL }}</strong> on any page to search again.</span>
                        </div>
                    </div>
                </div>

                <!-- Feedback: its own card under the filters; scrolls with the page -->
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <span class="ps-fb-ic"><Icon icon="ri:message-3-line" /></span>
                            <span><span class="d-block fw-semibold text-dark font-size-15">How can we improve search?</span>
                                <span class="text-muted small">Tell us what you expected to find</span></span>
                        </div>
                        <div v-if="feedbackSent" class="small text-success mb-2">
                            <Icon icon="ri:check-line" /> Thanks, your feedback on this search was sent.
                        </div>
                        <button type="button" class="btn btn-soft-primary w-100" :disabled="loading" @click="openFeedback">Give feedback</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Feedback form -->
    <SearchFeedbackModal ref="feedbackModal" @sent="onFeedbackSent" @error="showError" />

    <!-- Toast notification -->
    <ImageToast :status="toastStatus" :title="toastTitle" :message="toastMessage" :image="toastImage"
        :imageHeight="70" @hide="toastStatus = null" />
</template>

<script setup>
// ---------------------------------------------------------------
// Tenant Search Results — replicates PaySol Platform Admin Search Results
// (design, structure, behaviors, tabs, cards, highlighting, filters & feedback).
// Scoped strictly to the active business context.
// ---------------------------------------------------------------
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';

// API & Store
import SearchAPI from '@/api/search';
import { useAuthStore } from '@/stores/auth';

// Components
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue';
import ImageToast from '@/components/ImageToast.vue';
import SearchFeedbackModal from './components/SearchFeedback.modal.vue';
import SearchDestinationsCard from './components/SearchDestinations.card.vue';

// Utils
import {
    ALL_LIMIT,
    ALL_SHOWN,
    TAB_LIMIT,
    SEARCH_MODULES,
    moduleMeta,
    resultLink,
    listLink,
    badgeTone,
    SEARCH_SHORTCUT_LABEL,
    splitHit,
    MATCHED_FIELD_LABELS,
    initials,
} from './helpers/searchMeta';
import { destinationsFor, matchDestinations } from '@/nav/searchDestinations';
import successImage from '@/assets/images/icons/check.png';
import errorImage from '@/assets/images/icons/error.png';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Current business context
const tenantName = computed(() => authStore.currentTenant?.name || 'Your business');
const userRole = computed(() => authStore.role || 'waiter');
const userRoleLabel = computed(() => authStore.roleLabel || 'Staff');
const isManager = computed(() => ['owner', 'manager'].includes(userRole.value));

// Page state
const loading = ref(false);
const allAnswer = ref(null);
const tabAnswer = ref(null);
let controller = null;

// Search / filters from URL
const q = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''));
const category = computed(() => (SEARCH_MODULES.some(m => m.key === route.query.category) ? route.query.category : 'all'));
const statusFilter = computed(() => (['active', 'inactive'].includes(route.query.status) ? route.query.status : 'all'));
const hasFilters = computed(() => statusFilter.value !== 'all');
const filterCount = computed(() => (statusFilter.value !== 'all' ? 1 : 0));

// Sort
const sortBy = ref('newest');

// Feedback
const feedbackModal = ref(null);
const feedbackSent = ref(false);

// Skeletons
const rand = (min, max) => `${Math.floor(Math.random() * (max - min) + min)}px`;

// Toast
const toastStatus = ref(null);
const toastTitle = ref('');
const toastMessage = ref('');
const toastImage = ref(null);

// Matching Pages & actions
const destinations = computed(() => (category.value === 'all' && q.value.length >= 2
    ? matchDestinations(q.value, destinationsFor(userRole.value), 6) : []));

// Server answer data
const permissions = computed(() => allAnswer.value?.permissions || {
    products: true,
    staff: isManager.value,
    activity: isManager.value,
});
const counts = computed(() => allAnswer.value?.counts || {});

// Visible & hidden modules based on permissions
const visibleModules = computed(() => SEARCH_MODULES.filter(m => (allAnswer.value ? !!permissions.value[m.key] : (!m.roles || m.roles.includes(userRole.value)))));
const hiddenModules = computed(() => allAnswer.value ? SEARCH_MODULES.filter(m => permissions.value[m.key] === false) : []);
const hiddenList = computed(() => listWords(hiddenModules.value.map(m => m.label)));
const searchedList = computed(() => listWords(visibleModules.value.map(m => m.label.toLowerCase())) || 'anything you can see');

// Label count with "+" capped display
function countLabel(key) {
    if (!allAnswer.value) return '·';
    if (key === 'all') return visibleModules.value.reduce((n, m) => n + (counts.value[m.key] || 0), 0) + (anyFull.value ? '+' : '');
    const n = counts.value[key] || 0;
    return n >= ALL_LIMIT ? `${ALL_LIMIT}+` : String(n);
}
const anyFull = computed(() => visibleModules.value.some(m => (counts.value[m.key] || 0) >= ALL_LIMIT));

const elapsed = computed(() => {
    const ms = (category.value === 'all' ? allAnswer.value : tabAnswer.value)?.elapsed_ms;
    return ms == null ? '' : `${(ms / 1000).toFixed(2)}s`;
});

// Grouped sections
const sections = computed(() => {
    const answer = category.value === 'all' ? allAnswer.value : tabAnswer.value;
    if (!answer) return [];
    const keys = category.value === 'all' ? visibleModules.value.map(m => m.key) : [category.value];
    return keys.map((key) => {
        let rows = [...(answer.results?.[key] || [])];
        if (!rows.length) return null;
        if (sortBy.value === 'name') rows.sort((a, b) => String(a.title).localeCompare(String(b.title)));
        const m = moduleMeta(key);
        const shown = category.value === 'all' ? rows.slice(0, ALL_SHOWN) : rows;
        const left = rows.length - shown.length;
        const full = rows.length >= (category.value === 'all' ? ALL_LIMIT : TAB_LIMIT);
        return {
            ...m,
            rows: shown,
            listLink: listLink(key),
            more: category.value === 'all' && left > 0,
            moreLabel: full ? `${left}+` : String(left),
        };
    }).filter(Boolean);
});

const shownTotal = computed(() => {
    const answer = category.value === 'all' ? allAnswer.value : tabAnswer.value;
    if (!answer) return 0;
    const keys = category.value === 'all' ? visibleModules.value.map(m => m.key) : [category.value];
    return keys.reduce((n, k) => n + (answer.results?.[k]?.length || 0), 0);
});

const noResultsAtAll = computed(() => !loading.value && !!allAnswer.value && q.value.length >= 2
    && !hasFilters.value && visibleModules.value.every(m => !(counts.value[m.key] || 0)));

// Row helpers
const hit = (text) => splitHit(text, q.value);
const matchedElsewhere = (row) => row.matched_text && row.matched_field
    && !String(row.title || '').toLowerCase().includes(q.value.toLowerCase());

function openRow(row) {
    router.push(resultLink(row));
}

// Pictures and fallbacks
const brokenImages = ref(new Set());
const imageKey = (row) => `${row.category}:${row.id}`;
const showImage = (row) => !!row.image_url && !brokenImages.value.has(imageKey(row));
function markBroken(row) {
    brokenImages.value = new Set(brokenImages.value).add(imageKey(row));
}

function fallbackStyle(row, sec) {
    if (row.category === 'staff') return { background: '#F3EEFD', color: '#6B3FD1' };
    return { background: sec.tint, color: sec.fg };
}

function listWords(items) {
    if (items.length <= 1) return items.join('');
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

// Search API caller
async function search() {
    controller?.abort();
    feedbackSent.value = false;
    allAnswer.value = q.value.length >= 2 ? allAnswer.value : null;
    tabAnswer.value = null;
    if (q.value.length < 2) return;

    controller = new AbortController();
    const signal = controller.signal;
    loading.value = true;
    try {
        const base = { q: q.value };
        if (statusFilter.value !== 'all') base.status = statusFilter.value;

        const calls = [SearchAPI.search({ ...base, category: 'all', limit: ALL_LIMIT }, signal)];
        if (category.value !== 'all') {
            calls.push(SearchAPI.search({ ...base, category: category.value, limit: TAB_LIMIT }, signal));
        }

        const [all, tab] = await Promise.all(calls);
        allAnswer.value = all.data;
        tabAnswer.value = tab ? tab.data : null;
    } catch (error) {
        if (signal.aborted) return;
        console.error('Error searching:', error);
        allAnswer.value = null;
        showError('Search Failed', error.response?.status === 422
            ? (error.response.data?.message || 'Check the search text and try again.')
            : error.response?.data?.message || 'Please try again.');
    } finally {
        if (!signal.aborted) loading.value = false;
    }
}

// Tabs and query state in URL
function setQuery(patch) {
    const query = { ...route.query, ...patch };
    Object.keys(query).forEach((k) => { if (query[k] === '' || query[k] == null) delete query[k]; });
    router.push({ path: '/search', query });
}

function setCategory(key) {
    setQuery({ category: key === 'all' ? undefined : key });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setStatus(v) {
    setQuery({ status: v === 'all' ? undefined : v });
}

function resetFilters() {
    setQuery({ status: undefined, category: undefined });
}

// Feedback
function openFeedback() {
    const answer = category.value === 'all' ? allAnswer.value : tabAnswer.value;
    const filters = {};
    if (statusFilter.value !== 'all') filters.status = statusFilter.value;
    feedbackModal.value?.open({
        query: q.value,
        category: category.value,
        filters,
        result_count: answer ? shownTotal.value : null,
        elapsed_ms: answer?.elapsed_ms ?? null,
    });
}

function onFeedbackSent() {
    feedbackSent.value = true;
    showToast('success', 'Feedback Sent', 'Thanks. The team reads every one.');
}

// Toasts
function showToast(status, title, message) {
    toastStatus.value = status;
    toastTitle.value = title;
    toastMessage.value = message;
    toastImage.value = status === 'success' ? successImage : null;
}

function showError(title, message) {
    toastStatus.value = 'error';
    toastTitle.value = title;
    toastMessage.value = message;
    toastImage.value = errorImage;
}

// Watchers & Lifecycle
watch(() => [q.value, category.value, statusFilter.value], search);

onMounted(() => {
    search();
});

onBeforeUnmount(() => controller?.abort());
</script>

<style scoped>
/* Tabs on the page */
.ps-tabs { display: flex; gap: 26px; overflow-x: auto; border-bottom: 1px solid #E3E7EE; scrollbar-width: thin }
.ps-tab { height: 46px; padding: 0 2px; display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: #495057; border: 0;
    border-bottom: 2px solid transparent; background: transparent; white-space: nowrap; transition: color 0.15s ease-in-out }
.ps-tab:hover { color: #2164F3 }
.ps-tab.on { color: #2164F3; font-weight: 600; border-bottom-color: #2164F3 }
.ps-count { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 20px; padding: 0 6px; border-radius: 10px;
    font-size: 11px; font-weight: 600; background: #EFF2F7; color: #495057 }
.ps-count.zero { background: #F3F4F6; color: #ADB5BD }
.ps-tab.on .ps-count { background: #2164F3; color: #FFFFFF }

/* Title row */
.ps-title { font-size: 28px; line-height: 1.25; font-weight: 600; color: #343A40; margin: 0 0 4px }
.ps-sort { width: 170px }

/* Result rows */
.ps-row { display: flex; gap: 14px; align-items: flex-start; padding: 16px 20px; border-top: 1px solid #EFF2F7; transition: background-color 0.15s ease-in-out }
.ps-row:hover { background: #FAFBFD }
.ps-tile { width: 34px; height: 34px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 17px }
.ps-tile-lg { width: 40px; height: 40px; font-size: 13px; font-weight: 600 }
.ps-tile-lg i { font-size: 19px }
.ps-tile.is-round { border-radius: 50% }
/* Products get a bigger picture: the photo is how people recognise them */
.ps-tile.is-product { width: 52px; height: 52px }
/* Pictures: whole logo or product on white, never cropped */
.ps-tile-img { background: #FFFFFF; border: 1px solid #EFF2F7; overflow: hidden }
.ps-tile-img img { width: 100%; height: 100%; object-fit: contain; padding: 3px; display: block }
.ps-tile-img.is-round img { object-fit: cover; padding: 0 }
.ps-crumb { display: flex; align-items: center; gap: 4px; font-size: 11.5px; color: #74788D; margin-bottom: 2px; min-width: 0 }
.ps-hit { background: #FFF1B8; color: #3D2F00; border-radius: 3px; padding: 0 1px }
.ps-hit:empty { display: none }

/* Filters: stay in view under the fixed top bar */
.ps-filters { position: sticky; top: 94px; z-index: 2 }
.ps-lbl { font-size: 11px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: #74788D }
.ps-kbd { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 22px; padding: 0 6px; border: 1px solid #DDE1E7;
    border-bottom-width: 2px; border-radius: 4px; background: #FFFFFF; font-size: 12px; font-weight: 600; color: #495057 }

/* Notes and the empty card */
.ps-note { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border: 1px solid #E3E7EE; border-radius: 6px; background: #FFFFFF; font-size: 13px }
.ps-note > i { font-size: 18px; color: #74788D }
.ps-note > i.text-primary { color: #2164F3 }
.ps-fb-ic { width: 40px; height: 40px; border-radius: 50%; background: #E8F0FE; color: #2164F3; display: inline-flex; align-items: center;
    justify-content: center; font-size: 20px; flex-shrink: 0 }
.ps-empty-ic { width: 72px; height: 72px; border-radius: 50%; background: #F3F3F9; color: #74788D; display: inline-flex; align-items: center;
    justify-content: center; font-size: 32px }
.ps-tip { display: flex; gap: 12px; align-items: flex-start; padding: 12px 0; border-top: 1px solid #EFF2F7 }
.ps-tip:first-of-type { border-top: 0 }
.ps-tip-ic { width: 30px; height: 30px; border-radius: 8px; background: #F3F3F9; color: #495057; display: inline-flex; align-items: center;
    justify-content: center; flex-shrink: 0; font-size: 16px }
.ps-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; background: #F3F3F9; border-radius: 4px; padding: 1px 6px; color: #343A40 }

@media (max-width: 991.98px) {
    .ps-filters { position: static }
    .ps-title { font-size: 22px }
}
</style>
