<template>
    <!-- ========== Left Sidebar Start ========== -->

    <div class="vertical-menu">

        <!-- Business Identity & Switcher (Resembles Header profile dropdown) -->
        <div v-if="authStore.isAuthenticated" ref="businessDropdownRoot" class="sidebar-business-wrapper dropdown" :class="{ show: dropdownOpen }">
            <button
                type="button"
                class="btn header-item sidebar-business-btn waves-effect d-flex align-items-center w-100 px-3 text-start"
                id="sidebar-business-dropdown"
                @click.stop="toggleDropdown"
                :aria-expanded="dropdownOpen ? 'true' : 'false'"
                :title="tenantName ? `${tenantName} · ${tenantLocation}` : 'Your business'"
            >
                <!-- Avatar circle: Logo image if available, else bold initials on business primary color -->
                <div
                    class="sidebar-business-avatar d-flex flex-shrink-0 align-items-center justify-content-center p-0 rounded-circle overflow-hidden shadow-sm"
                >
                    <img
                        v-if="hasValidLogo"
                        :src="tenantLogo"
                        alt="Logo"
                        class="rounded-circle w-100 h-100"
                        @error="logoBroken = true"
                    />
                    <span
                        v-else
                        class="avatar-title rounded-circle w-100 h-100 font-size-13 text-white fw-bold d-flex align-items-center justify-content-center text-uppercase"
                        :style="{ backgroundColor: tenantPrimaryColor }"
                    >
                        <strong>{{ businessInitials }}</strong>
                    </span>
                </div>

                <!-- Business Name & Location (resembles the user profile text) -->
                <h5 class="text-start mb-0 ms-2 min-w-0 flex-grow-1 sidebar-business-text d-flex flex-column">
                    <div class="d-flex align-items-center justify-content-between min-w-0">
                        <span v-if="tenantName" class="d-inline-block text-white fw-bold text-truncate lh-sm" :title="tenantName">
                            {{ tenantName }}
                        </span>
                        <span v-else class="placeholder-glow d-inline-block" style="width: 100px;">
                            <span class="placeholder col-12"></span>
                        </span>
                        <i class="mdi mdi-chevron-down d-inline-block text-white-50 ms-1 font-size-14 align-middle flex-shrink-0"></i>
                    </div>
                    <p class="fs-12 mb-0 text-white-50 text-truncate lh-sm mt-1" :title="tenantLocation">
                        {{ tenantLocation }}
                    </p>
                </h5>
            </button>

            <!-- Dropdown Menu (structured identical to Header profile menu) -->
            <div
                class="dropdown-menu sidebar-business-dropdown-menu shadow-lg p-0"
                :class="{ show: dropdownOpen }"
                aria-labelledby="sidebar-business-dropdown"
                @click.stop
            >
                <!-- Who and where -->
                <div class="p-3 d-flex align-items-center gap-2">
                    <div
                        class="sidebar-business-avatar d-flex flex-shrink-0 align-items-center justify-content-center p-0 rounded-circle overflow-hidden shadow-sm"
                        style="width: 42px; height: 42px; min-width: 42px;"
                    >
                        <img
                            v-if="hasValidLogo"
                            :src="tenantLogo"
                            alt="Logo"
                            class="rounded-circle w-100 h-100"
                            @error="logoBroken = true"
                        />
                        <span
                            v-else
                            class="avatar-title rounded-circle w-100 h-100 font-size-14 text-white fw-bold d-flex align-items-center justify-content-center text-uppercase"
                            :style="{ backgroundColor: tenantPrimaryColor }"
                        >
                            <strong>{{ businessInitials }}</strong>
                        </span>
                    </div>
                    <div class="d-flex flex-column min-w-0 flex-grow-1">
                        <span class="text-capitalize text-black fw-bold text-truncate">{{ tenantName }}</span>
                        <span class="small text-muted text-truncate">{{ tenantLocation }}</span>
                        <span class="small text-muted text-truncate">{{ authStore.tenant?.human_code }} · {{ authStore.roleLabel }}</span>
                    </div>
                    <span class="badge bg-primary-subtle text-primary font-size-11 flex-shrink-0 align-self-start">{{ authStore.tenant?.plan || 'Free' }}</span>
                </div>

                <!-- Other businesses -->
                <div v-if="authStore.otherBusinesses.length" class="p-2 border-top d-flex flex-column gap-1">
                    <div class="text-muted fs-11 text-uppercase fw-semibold px-2 py-1">Switch to</div>
                    <button
                        v-for="b in authStore.otherBusinesses"
                        :key="b.tenant_id"
                        type="button"
                        class="dropdown-item px-2 py-2 rounded d-flex align-items-center gap-2"
                        :disabled="!!switching"
                        @click="switchTo(b)"
                    >
                        <div
                            class="sidebar-business-avatar d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle overflow-hidden shadow-sm"
                            style="width: 32px; height: 32px; min-width: 32px;"
                        >
                            <img
                                v-if="showOtherLogo(b)"
                                :src="b.logo_url"
                                alt=""
                                class="rounded-circle w-100 h-100"
                                @error="markOtherLogoBroken(b.tenant_id)"
                            />
                            <span
                                v-else
                                class="avatar-title rounded-circle w-100 h-100 font-size-11 fw-bold text-white text-uppercase d-flex align-items-center justify-content-center"
                                :style="{ backgroundColor: b.primary_color || '#2164F3' }"
                            >
                                {{ initialsOf(b.name) }}
                            </span>
                        </div>
                        <div class="min-w-0 flex-grow-1 text-start">
                            <div class="fw-semibold text-dark text-truncate">{{ b.name }}</div>
                            <div class="fs-11 text-muted text-truncate">{{ b.location || b.address_line || b.business_type || 'Main Branch' }}</div>
                        </div>
                        <span class="badge bg-light text-muted font-size-11 flex-shrink-0 text-capitalize">{{ b.role_label || b.role }}</span>
                        <span v-if="switching === b.tenant_id" class="spinner-border spinner-border-sm text-primary flex-shrink-0" role="status" aria-hidden="true"></span>
                    </button>
                </div>

                <div class="dropdown-divider m-0"></div>

                <!-- Add another business -->
                <div class="p-2">
                    <a class="dropdown-item px-3 d-flex align-items-center" href="javascript:void(0)" @click="openAddBusinessModal">
                        <i class="mdi mdi-plus-circle-outline align-middle me-2 fs-4 text-primary"></i>
                        <span>Add another business</span>
                    </a>
                </div>
            </div>
        </div>

        <div data-simplebar class="sidebar-menu-scroll">

            <!--- Sidemenu -->

            <div id="sidebar-menu">

                <!-- Left Menu Start -->

                <!--
                    The menu is data, not markup. Every item below comes from
                    src/nav/manageMenu.js and has already been filtered to what
                    this person's role at this business allows, so nothing here asks who is
                    signed in — it only renders.

                    That replaced ~1,180 lines of hand-written <li> elements and
                    the isActiveParent / isCurrentPage helpers they needed.
                -->

                <ul class="metismenu list-unstyled" id="side-menu">

                    <template v-for="(item, i) in menu" :key="i">

                        <!-- Section label, e.g. "Platform Administration" -->
                        <li v-if="item.heading" class="menu-title">{{ item.label }}</li>

                        <!-- Horizontal rule between sections -->
                        <hr v-else-if="item.divider" />

                        <!--
                            Group. MetisMenu is strict about this shape: the
                            <a class="has-arrow"> and the <ul class="sub-menu">
                            must be siblings, or the collapse breaks.
                        -->
                        <li
                            v-else-if="item.children"
                            :class="{ 'mm-active': isGroupActive(item) }"
                        >

                            <a
                                href="javascript: void(0);"
                                class="waves-effect has-arrow"
                                :class="{ 'mm-active': isGroupActive(item) }"
                            >
                                <Icon
                                    :icon="iconFor(item, isGroupActive(item))"
                                    class="menu-icon"
                                />
                                <span>{{ item.label }}</span>
                            </a>

                            <ul
                                class="sub-menu"
                                :class="{ 'mm-show': isGroupActive(item) }"
                                :aria-expanded="isGroupActive(item) ? 'true' : 'false'"
                            >

                                <li
                                    v-for="child in item.children"
                                    :key="child.label"
                                    :class="{ 'mm-active': isItemActive(child) }"
                                >

                                    <!-- Planned, not built yet: greyed, goes nowhere -->
                                    <a
                                        v-if="child.soon"
                                        href="javascript: void(0);"
                                        class="menu-soon"
                                        aria-disabled="true"
                                        title="Coming soon"
                                    >
                                        {{ child.label }} <span class="menu-soon-tag">Soon</span>
                                    </a>

                                    <router-link
                                        v-else
                                        :to="child.to"
                                        class="waves-effect"
                                        :class="{ active: isItemActive(child) }"
                                    >
                                        {{ child.label }}
                                    </router-link>

                                </li>

                            </ul>

                        </li>

                        <!-- Leaf link -->
                        <!--
                            Active on its own page and on every page listed in
                            its otherLinks (e.g. Site Identity's sub-pages).
                        -->
                        <li
                            v-else
                            :class="{ 'mm-active': isItemActive(item), active: isItemActive(item) }"
                        >

                            <!-- Planned, not built yet: greyed with a "Soon" tag, goes nowhere -->
                            <a
                                v-if="item.soon"
                                href="javascript: void(0);"
                                class="menu-soon"
                                aria-disabled="true"
                                title="Coming soon"
                            >
                                <Icon :icon="item.icon" class="menu-icon" />
                                <span>{{ item.label }}</span>
                                <span class="menu-soon-tag">Soon</span>
                            </a>

                            <router-link
                                v-else
                                :to="item.to"
                                class="waves-effect"
                                :class="{ active: isItemActive(item) }"
                            >
                                <Icon
                                    :icon="iconFor(item, isItemActive(item))"
                                    class="menu-icon"
                                />
                                <span>{{ item.label }}</span>
                            </router-link>

                        </li>

                    </template>

                </ul>

            </div>

            <!-- Sidebar -->

        </div>

    </div>

    <!-- Left Sidebar End -->

    <!-- Add Another Business Modal (18 Nov 2026) -->
    <div v-if="showAddBusinessModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5); z-index: 1060;">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content shadow-lg border-0">
                <div class="modal-header border-bottom py-3">
                    <div class="d-flex align-items-center gap-2">
                        <div class="avatar-xs flex-shrink-0">
                            <span class="avatar-title rounded-circle bg-primary-subtle text-primary fs-5">
                                <Icon icon="ri:store-3-line" />
                            </span>
                        </div>
                        <h5 class="modal-title mb-0">Add Another Business</h5>
                    </div>
                    <button type="button" class="btn-close" aria-label="Close" @click="showAddBusinessModal = false"></button>
                </div>
                <div class="modal-body p-4">
                    <p class="text-muted fs-13 mb-4">
                        Grow your business footprint on PaySol. Register an additional location or link with an invitation code.
                    </p>

                    <div class="d-flex flex-column gap-3">
                        <!-- Option 1: Register New -->
                        <div class="border rounded-3 p-3 bg-light bg-opacity-25">
                            <div class="d-flex align-items-start gap-3">
                                <div class="avatar-sm flex-shrink-0">
                                    <span class="avatar-title rounded bg-primary-subtle text-primary fs-4">
                                        <Icon icon="ri:store-2-line" />
                                    </span>
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="fw-bold text-dark mb-1">Register a New Business</h6>
                                    <p class="text-muted fs-12 mb-3">
                                        Open a new shop or outlet with separate till, stock tracking, and staff.
                                    </p>
                                    <button type="button" class="btn btn-sm btn-primary" @click="requestNewBusiness">
                                        <Icon icon="ri:add-circle-line" class="me-1" /> Request New Business
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Option 2: Join with code -->
                        <div class="border rounded-3 p-3 bg-light bg-opacity-25">
                            <div class="d-flex align-items-start gap-3">
                                <div class="avatar-sm flex-shrink-0">
                                    <span class="avatar-title rounded bg-success-subtle text-success fs-4">
                                        <Icon icon="ri:key-2-line" />
                                    </span>
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="fw-bold text-dark mb-1">Have an Invitation Code?</h6>
                                    <p class="text-muted fs-12 mb-3">
                                        If another business invited you to their team, enter your activation code.
                                    </p>
                                    <router-link to="/activate" class="btn btn-sm btn-outline-success" @click="showAddBusinessModal = false">
                                        <Icon icon="ri:shield-check-line" class="me-1" /> Enter Code
                                    </router-link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-top py-2 bg-light">
                    <button type="button" class="btn btn-sm btn-light" @click="showAddBusinessModal = false">Close</button>
                </div>
            </div>
        </div>
    </div>
</template>


<script setup>

import { Icon } from '@iconify/vue';
import { useRoute, useRouter } from 'vue-router';
import {
    ref,
    computed,
    onMounted,
    onBeforeUnmount,
    nextTick,
    watch
} from 'vue';

import { useAuthStore } from '@/stores/auth';
import authApi from '@/api/auth';
import { useSessionStart } from '@/composables/useSessionStart';
import manageMenu from '@/nav/manageMenu';

// ------------------------------------------------------------
// State
// ------------------------------------------------------------

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const { startSession } = useSessionStart();

const currentPath = computed(() => route.path);

// The person's role at this business, from the sign-in answer (restored on refresh).
const myRole = computed(() => authStore.role);

// Business Switcher State
const switching = ref(null);
const showAddBusinessModal = ref(false);
const dropdownOpen = ref(false);
const businessDropdownRoot = ref(null);

const tenantName = computed(() => authStore.tenant?.name || 'Your business');
const tenantLogo = computed(() => authStore.tenant?.logo_url || null);
const tenantPrimaryColor = computed(() => authStore.tenant?.primary_color || '#2164F3');
const tenantLocation = computed(() => {
    const t = authStore.tenant;
    return t?.address_line || t?.location || t?.business_type || 'Main Branch';
});

// Image error handling: fallback to initials on business primary color
const logoBroken = ref(false);
const brokenOtherLogos = ref(new Set());

watch(() => authStore.tenant?.id, () => {
    logoBroken.value = false;
});

const hasValidLogo = computed(() => !!tenantLogo.value && !logoBroken.value);

function showOtherLogo(b) {
    return !!b.logo_url && !brokenOtherLogos.value.has(b.tenant_id);
}

function markOtherLogoBroken(tenantId) {
    brokenOtherLogos.value = new Set(brokenOtherLogos.value).add(tenantId);
}

const businessInitials = computed(() => {
    const name = authStore.tenant?.name || '';
    return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'PS';
});

const initialsOf = (name) => {
    return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'PS';
};

function toggleDropdown() {
    dropdownOpen.value = !dropdownOpen.value;
}

function openAddBusinessModal() {
    dropdownOpen.value = false;
    showAddBusinessModal.value = true;
}

function onDocumentClick(e) {
    if (businessDropdownRoot.value && !businessDropdownRoot.value.contains(e.target)) {
        dropdownOpen.value = false;
    }
}

function onKeydown(e) {
    if (e.key === 'Escape') {
        dropdownOpen.value = false;
    }
}

async function switchTo(business) {
    dropdownOpen.value = false;
    switching.value = business.tenant_id;
    try {
        const response = await authApi.switchTenant(business.tenant_id);
        await startSession(response.data.data, { remember: !!localStorage.getItem('psBizToken') });
        await router.push('/');
        window.location.reload();
    } catch (error) {
        console.error('Error switching business:', error.response?.data || error.message);
        alert(error.response?.data?.message || 'Could not switch business. Please try again.');
    } finally {
        switching.value = null;
    }
}

function requestNewBusiness() {
    showAddBusinessModal.value = false;
    alert('Thank you! Our onboarding team will contact you shortly to set up your new business. For immediate assistance, please contact support@paysol.co.ke.');
}


// ------------------------------------------------------------
// Role check
// ------------------------------------------------------------

/**
 * null / missing  → any signed-in person at this business.
 * an array        → ANY of these roles (owner, manager, cashier, waiter),
 * like the backend's EnsureTenantRole. The backend still decides; the menu
 * only avoids offering a page the API would refuse.
 */
function can(roles) {
    if (!roles) return true;
    return roles.includes(myRole.value);
}

/**
 * The menu, filtered down to what this person may see.
 *
 * Dividers always survive; a heading survives when its own roles allow it
 * (a section of owner-only pages has no title for a cashier). A group
 * survives if ANY child is visible.
 */
const menu = computed(() =>

    manageMenu
        .filter((item) => {

            if (item.divider) return true;

            if (item.heading) return can(item.roles);

            if (can(item.roles)) return true;

            return item.children?.some((c) => can(c.roles));

        })
        .map((item) =>
            item.children
                ? { ...item, children: item.children.filter((c) => can(c.roles)) }
                : item
        )
);


// ------------------------------------------------------------
// Active state
// ------------------------------------------------------------

// "site-identity/platform/" -> "/site-identity/platform", so a missing or
// extra slash in manageMenu.js can never stop a match.
const normalizePath = (path) =>
    ('/' + String(path).trim().replace(/^\/+|\/+$/g, '')).replace(/^\/$/, '/');

// Exact match on a leaf's own `to`.
const isActive = (to) => Boolean(to) && currentPath.value === normalizePath(to);

/**
 * A leaf is active on its own page, and on any page in its `otherLinks`:
 * the pages that live under it without a menu entry of their own (Site
 * Identity's Platform, Logo Assets, Change History...). An other link also
 * covers what sits below it, so "/reference/banks" would light up for
 * "/reference/banks/12" too.
 */
const isItemActive = (item) => {
    if (isActive(item.to)) return true;

    return (item.otherLinks ?? []).some((link) => {
        const path = normalizePath(link);
        return currentPath.value === path || currentPath.value.startsWith(path + '/');
    });
};

/**
 * A group highlights when the current path belongs to one of its children
 * (their `to` or their `otherLinks`). Derived from the children rather than
 * a hand-written list of paths, so adding a leaf to the array cannot leave
 * its group failing to highlight.
 */
const isGroupActive = (item) =>
    Boolean(item.children?.some((c) => isItemActive(c)));

// Fall back to the single icon for entries with no active-state variant.
const iconFor = (item, active) =>
    (active ? item.iconActive ?? item.icon : item.icon);


// ------------------------------------------------------------
// MetisMenu (jQuery)
// ------------------------------------------------------------

/**
 * MetisMenu is a jQuery plugin that toggles mm-active / mm-show itself. It
 * knows nothing about Vue, so this is the one place that has to be told when
 * the markup changed.
 */
const initMetisMenu = () => {

    const menuEl = document.getElementById('side-menu');

    if (!menuEl) return;

    if (window.jQuery && window.jQuery.fn.metisMenu) {

        try {

            // Dispose first. main.js re-initialises on every afterEach, and
            // binding twice makes open/close fire twice per click.
            window.jQuery(menuEl).metisMenu('dispose');

        } catch (e) {

            // Nothing was bound — that is fine.

        }

        window.jQuery(menuEl).metisMenu();

    } else {

        // Scripts load async in main.js, so jQuery may not be here yet.
        setTimeout(initMetisMenu, 100);

    }

};

/**
 * Without this, a permission arriving after mount leaves MetisMenu's classes
 * stale and an already-open group stops animating.
 */
watch(menu, () => nextTick(initMetisMenu));

onMounted(() => {
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onKeydown);

    nextTick(() => {

        initMetisMenu();

    });

});

onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onKeydown);

    const menuEl = document.getElementById('side-menu');

    if (
        menuEl &&
        window.jQuery &&
        window.jQuery.fn.metisMenu
    ) {

        try {

            window.jQuery(menuEl).metisMenu('dispose');

        } catch (e) {

            // ignore

        }

    }

});


</script>


<style scoped>

.menu-icon {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    margin-right: 10px;
}

</style>
