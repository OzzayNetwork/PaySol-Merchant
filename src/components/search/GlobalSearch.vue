<template>
    <!-- Universal Tenant Search in the top bar.
         Desktop: a neat box that widens to fill the bar while in use.
         Phones (mobile prop): a magnifier button that opens over the top bar. -->
    <div ref="rootEl" class="ps-search" :class="{ 'is-open': expanded, 'is-mobile': mobile, 'mobile-shown': mobile && mobileOpen }">

        <!-- Phones: button that opens the search -->
        <button v-if="mobile" type="button" class="btn header-item noti-icon waves-effect" title="Search" aria-label="Search"
            @click="openMobile">
            <i class="bx bx-search"></i>
        </button>

        <div v-show="!mobile || mobileOpen" class="ps-search-holder">
            <!-- Search input box -->
            <form class="ps-search-box" role="search" @submit.prevent="onEnter">
                <button v-if="mobile" type="button" class="btn btn-sm btn-light rounded-circle ps-round" title="Close search"
                    aria-label="Close search" @click="closeAll">
                    <i class="bx bx-arrow-back"></i>
                </button>
                <i v-else class="bx bx-search-alt ps-search-icon" aria-hidden="true"></i>

                <!-- Scope chip: shown when search is filtered to one category -->
                <span v-if="scope !== 'all'" class="ps-scope">
                    <Icon :icon="moduleMeta(scope).icon" class="me-1 fs-12" />
                    {{ moduleMeta(scope).label }}
                    <button type="button" title="Search everything again" aria-label="Search everything again" @click="scope = 'all'">
                        <i class="bx bx-x"></i>
                    </button>
                </span>

                <input ref="inputEl" v-model="text" type="search" class="ps-search-input" autocomplete="off" spellcheck="false"
                    :placeholder="placeholder" :aria-label="`Search in ${tenantName}`" role="combobox" :aria-expanded="dropdownOpen ? 'true' : 'false'"
                    aria-controls="ps-search-menu" @focus="onFocus" @keydown="onKeydown">

                <!-- Clear button -->
                <button v-if="text" type="button" class="ps-clear" title="Clear text" aria-label="Clear search" @click="clearText">
                    <i class="bx bx-x"></i>
                </button>

                <!-- Shortcut label / Search button -->
                <span v-if="!expanded && !mobile" class="ps-kbd" :title="`Press ${SEARCH_SHORTCUT_LABEL} to search`">{{ SEARCH_SHORTCUT_LABEL }}</span>
                <button v-if="expanded" type="submit" class="btn btn-primary btn-sm ps-go" title="Search (Enter)">
                    <span class="d-none d-sm-inline">Search</span><i class="bx bx-search d-sm-none"></i>
                </button>
            </form>

            <!-- Suggestion / Omnibar Dropdown -->
            <div v-if="dropdownOpen" id="ps-search-menu" class="ps-menu shadow" role="listbox">

                <!-- 1. Nothing typed yet: Recent searches + Scope chips -->
                <template v-if="!trimmed">
                    <div class="ps-menu-section">
                        <div class="ps-menu-head">
                            <span>Recent searches</span>
                            <button v-if="recent.length" type="button" class="btn btn-link btn-sm p-0" @click="clearAllRecent">Clear</button>
                        </div>
                        <div v-if="!recent.length" class="text-muted small px-3 pb-2">
                            Searches you run in {{ tenantName }} show here.
                        </div>
                        <div v-for="(r, i) in recent" :key="r.q" class="ps-item" :class="{ active: activeIndex === i }"
                            role="option" :aria-selected="activeIndex === i" @mouseenter="activeIndex = i" @click="runRecent(r)">
                            <i class="bx bx-history ps-item-ic"></i>
                            <span class="flex-grow-1 text-truncate">
                                <span class="text-dark">{{ r.q }}</span>
                                <span v-if="r.category && r.category !== 'all'" class="text-muted small"> · in {{ moduleMeta(r.category).label }}</span>
                            </span>
                            <span class="text-muted small d-none d-sm-inline">{{ smartDate(new Date(r.at)) }}</span>
                            <button type="button" class="ps-remove" title="Remove" aria-label="Remove from recent"
                                @click.stop="dropRecent(r.q)"><i class="bx bx-x"></i></button>
                        </div>
                    </div>

                    <!-- Search scope chips -->
                    <div v-if="availableModules.length > 1" class="ps-menu-section border-top">
                        <div class="ps-menu-head"><span>Search in</span></div>
                        <div class="d-flex flex-wrap gap-2 px-3 pb-3">
                            <button type="button" class="ps-chip" :class="{ on: scope === 'all' }" @click="pickScope('all')">
                                <Icon icon="ri:apps-2-line" class="me-1 fs-14" /> Everything
                            </button>
                            <button v-for="m in availableModules" :key="m.key" type="button" class="ps-chip" :class="{ on: scope === m.key }"
                                @click="pickScope(m.key)">
                                <Icon :icon="m.icon" class="me-1 fs-14" /> {{ m.label }}
                            </button>
                        </div>
                    </div>
                </template>

                <!-- 2. While typing: Run search + Query hint + Matching recent + Pages & actions -->
                <template v-else>
                    <div class="ps-menu-section pt-2">
                        <template v-for="(item, i) in typedItems" :key="item.key">
                            <div v-if="item.heading" class="ps-menu-head" :class="{ 'border-top pt-2 mt-1': i > 0 }">
                                <span>{{ item.heading }}</span>
                            </div>
                            <div class="ps-item" :class="{ active: activeIndex === item.index, 'ps-item-main': item.main }"
                                role="option" :aria-selected="activeIndex === item.index" @mouseenter="activeIndex = item.index" @click="item.run()">
                                <span class="ps-item-ic" :class="item.icClass">
                                    <Icon v-if="item.iconify" :icon="item.iconify" /><i v-else :class="item.icon"></i>
                                </span>
                                <span class="flex-grow-1 text-truncate">
                                    <span v-if="item.lead" class="text-muted">{{ item.lead }} </span>
                                    <span class="text-dark fw-medium">{{ item.label }}</span>
                                    <span v-if="item.note" class="text-muted small"> · {{ item.note }}</span>
                                </span>
                                <!-- Badge/Kind -->
                                <span v-if="item.kind" class="ps-kind" :class="`is-${item.kind}`">{{ KIND_LABELS[item.kind] }}</span>
                                <span v-if="item.main" class="ps-kbd">Enter ↵</span>
                            </div>
                        </template>
                        <div v-if="tooShort" class="text-muted small px-3 pb-2">Type at least 2 characters to search.</div>
                    </div>
                </template>

                <!-- Footer shortcuts legend -->
                <div class="ps-menu-foot d-none d-sm-flex">
                    <span><span class="ps-kbd">↑</span><span class="ps-kbd">↓</span> to navigate</span>
                    <span><span class="ps-kbd">Enter ↵</span> to select</span>
                    <span><span class="ps-kbd">Esc</span> to close</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useAuthStore } from '@/stores/auth';
import { smartDate } from '@/utils/dates';
import { destinationsFor, matchDestinations, KIND_LABELS } from '@/nav/searchDestinations';
import {
    moduleMeta,
    modulesFor,
    detectQuery,
    SEARCH_SHORTCUT_LABEL,
    isSearchShortcut,
    readRecent,
    saveRecent,
    removeRecent,
    clearRecent,
} from '@/pages/Search/helpers/searchMeta';

const props = defineProps({
    mobile: { type: Boolean, default: false },
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// ---- State ----
const rootEl = ref(null);
const inputEl = ref(null);
const focused = ref(false);
const mobileOpen = ref(false);
const activeIndex = ref(-1);

// Scoped strictly to current tenant and user
const tenantId = computed(() => authStore.tenant?.id || 'default');
const tenantName = computed(() => authStore.tenant?.name || 'Your business');
const myRole = computed(() => authStore.role || 'waiter');
const availableModules = computed(() => modulesFor(myRole.value));

const text = ref(typeof route.query.q === 'string' ? route.query.q : '');
const scope = ref(typeof route.query.category === 'string' ? route.query.category : 'all');
const recent = ref(readRecent(tenantId.value));

const trimmed = computed(() => text.value.trim());
const tooShort = computed(() => trimmed.value.length > 0 && trimmed.value.length < 2);
const onResultsPage = computed(() => route.path === '/search');
const expanded = computed(() => focused.value || !!text.value || onResultsPage.value || mobileOpen.value);
const dropdownOpen = computed(() => focused.value);

const placeholder = computed(() => {
    if (scope.value === 'all') {
        return `Search ${tenantName.value} (products, staff, activity…)`;
    }
    return `Search ${moduleMeta(scope.value).label.toLowerCase()} in ${tenantName.value}…`;
});

// Keep input in sync when route query updates
watch(() => route.query, (q) => {
    if (route.path !== '/search') return;
    text.value = typeof q.q === 'string' ? q.q : '';
    scope.value = typeof q.category === 'string' ? q.category : 'all';
});

// Reload recent list when tenant changes
watch(tenantId, (newId) => {
    recent.value = readRecent(newId);
});

// Destination shortcuts available to this role
const destinations = computed(() => destinationsFor(myRole.value));

// Items shown while typing
const typedItems = computed(() => {
    if (!trimmed.value) return [];
    const q = trimmed.value;
    const lower = q.toLowerCase();
    const rows = [];

    // 1. Primary search action
    rows.push({
        key: 'go',
        main: true,
        iconify: 'ri:search-line',
        icClass: 'ps-ic-primary',
        lead: scope.value === 'all' ? `Search ${tenantName.value} for` : `Search ${moduleMeta(scope.value).label} for`,
        label: `“${q}”`,
        run: () => runSearch(),
    });

    // 2. Query heuristic hint (e.g. barcode -> products)
    const hint = detectQuery(q);
    if (hint && hint.category !== scope.value && availableModules.value.some(m => m.key === hint.category)) {
        rows.push({
            key: 'hint',
            iconify: moduleMeta(hint.category).icon,
            lead: `Looks like ${hint.label}:`,
            label: `Search ${moduleMeta(hint.category).label} only`,
            run: () => runSearch(hint.category),
        });
    }

    // 3. Matching recent searches
    recent.value
        .filter(r => r.q.toLowerCase().includes(lower) && r.q.toLowerCase() !== lower)
        .slice(0, 3)
        .forEach((r, i) => rows.push({
            key: 'recent_' + r.q,
            heading: i === 0 ? 'Recent searches' : '',
            icon: 'bx bx-history',
            label: r.q,
            note: r.category && r.category !== 'all' ? `in ${moduleMeta(r.category).label}` : '',
            run: () => runRecent(r),
        }));

    // 4. Matching pages & quick actions
    matchDestinations(q, destinations.value, 5)
        .forEach((d, i) => rows.push({
            key: 'dest_' + d.key,
            heading: i === 0 ? 'Pages & actions' : '',
            iconify: d.icon,
            label: d.label,
            note: d.crumb || '',
            kind: d.kind,
            run: () => goTo(d.to),
        }));

    return rows.map((r, index) => ({ ...r, index }));
});

// ---- Actions ----
function onFocus() {
    focused.value = true;
    recent.value = readRecent(tenantId.value);
    activeIndex.value = -1;
}

async function openMobile() {
    mobileOpen.value = true;
    await nextTick();
    inputEl.value?.focus();
}

function closeAll() {
    focused.value = false;
    mobileOpen.value = false;
    activeIndex.value = -1;
    inputEl.value?.blur();
}

function clearText() {
    text.value = '';
    activeIndex.value = -1;
    inputEl.value?.focus();
}

function onDocumentClick(e) {
    if (rootEl.value && !rootEl.value.contains(e.target)) {
        focused.value = false;
        if (!text.value) mobileOpen.value = false;
    }
}

function onEnter() {
    if (activeIndex.value > 0 && trimmed.value) {
        const row = typedItems.value.find(r => r.index === activeIndex.value);
        if (row) return row.run();
    }
    runSearch();
}

function runSearch(category = scope.value) {
    if (trimmed.value.length < 2) {
        inputEl.value?.focus();
        return;
    }
    recent.value = saveRecent(tenantId.value, trimmed.value, category);
    router.push({
        path: '/search',
        query: {
            q: trimmed.value,
            category: category !== 'all' ? category : undefined,
        },
    });
    focused.value = false;
    mobileOpen.value = false;
    inputEl.value?.blur();
}

function runRecent(r) {
    text.value = r.q;
    scope.value = r.category || 'all';
    runSearch(scope.value);
}

function goTo(path) {
    text.value = '';
    closeAll();
    router.push(path);
}

function pickScope(key) {
    scope.value = key;
    inputEl.value?.focus();
}

function dropRecent(q) {
    recent.value = removeRecent(tenantId.value, q);
}

function clearAllRecent() {
    recent.value = clearRecent(tenantId.value);
}

// ---- Keyboard Navigation ----
function onKeydown(e) {
    const count = trimmed.value ? typedItems.value.length : recent.value.length;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex.value = count ? (activeIndex.value + 1) % count : -1;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex.value = count ? (activeIndex.value <= 0 ? count - 1 : activeIndex.value - 1) : -1;
    } else if (e.key === 'Escape') {
        closeAll();
    } else if (e.key === 'Enter' && !trimmed.value && activeIndex.value >= 0 && recent.value[activeIndex.value]) {
        e.preventDefault();
        runRecent(recent.value[activeIndex.value]);
    }
}

function onGlobalKey(e) {
    if (!isSearchShortcut(e)) return;
    if (props.mobile === window.matchMedia('(min-width: 992px)').matches) return;
    const inOwnBox = e.target === inputEl.value;
    const tag = (e.target?.tagName || '').toLowerCase();
    if (!inOwnBox && (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable)) return;
    e.preventDefault();
    if (props.mobile && !mobileOpen.value) openMobile();
    else inputEl.value?.focus();
    onFocus();
}

function onGlobalEscape(e) {
    if (e.key === 'Escape' && (focused.value || mobileOpen.value) && e.target !== inputEl.value) closeAll();
}

watch(text, () => {
    activeIndex.value = trimmed.value ? 0 : -1;
});

onMounted(() => {
    document.addEventListener('mousedown', onDocumentClick);
    document.addEventListener('keydown', onGlobalKey);
    document.addEventListener('keydown', onGlobalEscape);
});

onBeforeUnmount(() => {
    document.removeEventListener('mousedown', onDocumentClick);
    document.removeEventListener('keydown', onGlobalKey);
    document.removeEventListener('keydown', onGlobalEscape);
});
</script>

<style scoped>
/* Desktop Omnibar */
.ps-search {
    position: relative;
    display: flex;
    align-items: center;
    align-self: center;
    width: 320px;
    margin-left: 12px;
    transition: width .2s ease, flex-grow .2s ease;
}
.ps-search.is-open {
    flex-grow: 1;
    width: auto;
    max-width: 100%;
    margin-right: 16px;
}
.ps-search-holder {
    width: 100%;
    position: relative;
}
.ps-search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 0 8px 0 14px;
    border-radius: 8px;
    background: #F3F3F9;
    border: 1px solid transparent;
    transition: background .15s, border-color .15s, box-shadow .15s;
}
.ps-search.is-open .ps-search-box {
    background: #FFFFFF;
    border-color: #DDE3EC;
    box-shadow: 0 0 0 3px rgba(33, 100, 243, .08);
}
.ps-search-icon {
    font-size: 17px;
    color: #74788D;
}
.ps-search.is-open .ps-search-icon {
    color: #2164F3;
}
.ps-search-input {
    flex-grow: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    font-size: 13.5px;
    color: #343A40;
    height: 100%;
}
.ps-search-input::-webkit-search-cancel-button {
    display: none;
}
.ps-clear, .ps-remove {
    width: 26px;
    height: 26px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: #74788D;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 17px;
}
.ps-clear:hover, .ps-remove:hover {
    background: #EFF2F7;
    color: #343A40;
}
.ps-go {
    height: 30px;
    padding: 0 12px;
    flex-shrink: 0;
}
.ps-round {
    width: 32px;
    height: 32px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.ps-kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 20px;
    padding: 0 6px;
    margin-right: 4px;
    border: 1px solid #DDE1E7;
    border-bottom-width: 2px;
    border-radius: 4px;
    background: #FFFFFF;
    font-size: 11px;
    font-weight: 600;
    color: #495057;
    white-space: nowrap;
}

/* Scope chip */
.ps-scope {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    height: 24px;
    padding: 0 4px 0 10px;
    border-radius: 12px;
    background: #E8F0FE;
    color: #2164F3;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    flex-shrink: 0;
}
.ps-scope button {
    border: 0;
    background: transparent;
    color: inherit;
    display: inline-flex;
    padding: 0;
    font-size: 15px;
}

/* Dropdown Menu */
.ps-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 1005;
    background: #FFFFFF;
    border-radius: 8px;
    border: 1px solid #EFF2F7;
    max-height: 70vh;
    overflow-y: auto;
}
.ps-menu-section {
    padding: 6px 0;
}
.ps-menu-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 16px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .05em;
    text-transform: uppercase;
    color: #74788D;
}
.ps-menu-head .btn-link {
    font-size: 12px;
    text-transform: none;
    letter-spacing: 0;
}
.ps-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 13.5px;
}
.ps-item.active {
    background: #F3F6FD;
}
.ps-item-ic {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: #F3F3F9;
    color: #495057;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 16px;
}
.ps-ic-primary {
    background: #E8F0FE;
    color: #2164F3;
}
.ps-kind {
    flex-shrink: 0;
    height: 20px;
    padding: 0 8px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 500;
    background: #EEF4FF;
    color: #2164F3;
}
.ps-kind.is-tab {
    background: #F3F3F9;
    color: #495057;
}
.ps-kind.is-action {
    background: #E3F5EC;
    color: #1E7F45;
}
.ps-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 12px;
    border-radius: 15px;
    border: 1px solid #E3E7EE;
    background: #FFFFFF;
    font-size: 12.5px;
    color: #495057;
}
.ps-chip:hover {
    border-color: #B9CEF9;
    background: #F5F8FF;
}
.ps-chip.on {
    border-color: #2164F3;
    background: #EEF4FF;
    color: #2164F3;
    font-weight: 500;
}
.ps-menu-foot {
    gap: 18px;
    padding: 10px 16px;
    border-top: 1px solid #EFF2F7;
    background: #FAFBFD;
    font-size: 12px;
    color: #74788D;
}

/* Mobile full-bar overlay */
.ps-search.is-mobile {
    width: auto;
    margin: 0;
    flex-grow: 0;
}
.ps-search.is-mobile .ps-search-holder {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1006;
    height: 70px;
    padding: 15px 12px;
    background: #FFFFFF;
    box-shadow: 0 2px 12px rgba(18, 38, 63, .08);
}
.ps-search.is-mobile .ps-menu {
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    border-radius: 0;
    max-height: calc(100vh - 70px);
}
</style>
