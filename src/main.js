// ===============================
// main.js - Robust SPA initialization
// ===============================

// Import core Vue functions
import { createApp, nextTick } from 'vue'

// Import Pinia (state management library)
import { createPinia } from "pinia";

// Import root component
import App from './App.vue'

// Import router configuration
import router from './router'

// Import jQuery
import jQuery from 'jquery'

// Import your custom UI script
import { initTestScript } from './assets/js/test.js'

// Utility for dynamic script loading
import { loadScript } from './utils/loadScript.js'

// Import Pinia auth store & 401 session-expiry hook
import { useAuthStore } from "@/stores/auth";
import { onUnauthorized } from "@/api/index";

//select picker styles
import "vue3-select-component/styles"

// ------------------------
// Global jQuery
// ------------------------
window.$ = jQuery
window.jQuery = jQuery

// ------------------------
// Track loaded scripts
// ------------------------
let scriptsLoaded = {
  bootstrap: false,
  metismenu: false,
  simplebar: false,
  waves: false
}

// ------------------------
// UI Initialization
// ------------------------
function initSidebarAndUI() {
    // Initialize MetisMenu safely (dispose first if already bound so click handlers never double-bind)
    if ($("#side-menu").length && $.fn.metisMenu) {
        try {
            $("#side-menu").metisMenu("dispose");
        } catch (e) {
            // Not yet bound
        }
        $("#side-menu").metisMenu();
    }

    // Fullscreen toggle
    $('[data-bs-toggle="fullscreen"]').off("click").on("click", function(e) {
        e.preventDefault();
        $("body").toggleClass("fullscreen-enable");
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    });

    // Waves.js initialization (once)
    if (window.Waves && !$("#waves-init").length) {
        Waves.init();
        $('<div id="waves-init"></div>').appendTo('body'); // mark as initialized
    }

    // Bootstrap components safely guarded via `getOrCreateInstance`
    if (typeof window !== 'undefined' && window.bootstrap) {
      if (window.bootstrap.Tooltip) {
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
          .forEach(el => window.bootstrap.Tooltip.getOrCreateInstance ? window.bootstrap.Tooltip.getOrCreateInstance(el) : new window.bootstrap.Tooltip(el));
      }
      if (window.bootstrap.Popover) {
        document.querySelectorAll('[data-bs-toggle="popover"]')
          .forEach(el => window.bootstrap.Popover.getOrCreateInstance ? window.bootstrap.Popover.getOrCreateInstance(el) : new window.bootstrap.Popover(el));
      }
      if (window.bootstrap.Offcanvas) {
        document.querySelectorAll(".offcanvas")
          .forEach(el => window.bootstrap.Offcanvas.getOrCreateInstance ? window.bootstrap.Offcanvas.getOrCreateInstance(el) : new window.bootstrap.Offcanvas(el));
      }
    }

    // Sidebar active link highlight (clear stale classes from previous route, then activate current)
    const currentUrl = window.location.href.split(/[?#]/)[0];
    $("#sidebar-menu a").each(function() {
        if (this.href === currentUrl) {
            $(this).addClass("active");
        }
    });
    $("#sidebar-menu li").not(":has(a.active)").removeClass("mm-active active");
    $("#sidebar-menu ul.sub-menu").not(":has(a.active)").removeClass("mm-show");
    $("#sidebar-menu a").each(function() {
        if (this.href === currentUrl || $(this).hasClass("active")) {
            $(this).addClass("active");
            $(this).parents("li").addClass("mm-active");
            $(this).parents("ul").addClass("mm-show");
        }
    });

    // Scroll sidebar to active link (if exists)
    if ($("#sidebar-menu .mm-active .active").length) {
        const offset = $("#sidebar-menu .mm-active .active").offset()?.top || 0;
        if (offset > 300) {
            $(".vertical-menu .simplebar-content-wrapper").animate({ scrollTop: offset - 300 }, "slow");
        }
    }
}

// ------------------------
// Script loader helper
// ------------------------
function checkAndInitialize() {
    if (scriptsLoaded.bootstrap && scriptsLoaded.metismenu && scriptsLoaded.waves) {
        nextTick(() => {
            initTestScript?.(); // optional custom script
            initSidebarAndUI();
        });
    }
}

// ------------------------
// Load External Scripts
// ------------------------
loadScript('/libs/bootstrap/js/bootstrap.bundle.min.js')
     .then(() => { scriptsLoaded.bootstrap = true; checkAndInitialize(); })
     .catch(err => { console.error('Bootstrap load error', err); scriptsLoaded.bootstrap = true; checkAndInitialize(); });

loadScript('/libs/metismenu/metisMenu.min.js')
     .then(() => { scriptsLoaded.metismenu = true; checkAndInitialize(); })
     .catch(err => { console.error('MetisMenu load error', err); scriptsLoaded.metismenu = true; checkAndInitialize(); });

loadScript('/libs/simplebar/simplebar.min.js')
     .then(() => { scriptsLoaded.simplebar = true; })
     .catch(err => console.error('SimpleBar load error', err));

loadScript('/libs/node-waves/waves.min.js')
     .then(() => { scriptsLoaded.waves = true; checkAndInitialize(); })
     .catch(err => { console.error('Waves load error', err); scriptsLoaded.waves = true; checkAndInitialize(); });

// ------------------------
// Vue App Setup
// ------------------------
const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// Hydrate auth state BEFORE installing the router so the initial navigation
// guard sees the restored token immediately.
const auth = useAuthStore();
auth.initFromLocalStorage();

// When any authenticated request answers 401 (expired or revoked
// Sanctum token), clear stale storage and return to `/login` with an explanation.
onUnauthorized(() => {
    if (!auth.isAuthenticated) return;
    auth.clearAuth();
    const current = router.currentRoute.value;
    if (current?.path && current.path !== '/login') {
        router.push({
            path: '/login',
            query: {
                ...(current.fullPath && current.fullPath !== '/' ? { redirect: current.fullPath } : {}),
                reason: 'expired',
            },
        });
    }
});

app.use(router);

// Focus directive
app.directive('focus', {
    mounted(el) { el.focus(); }
});

// Mount app
app.mount('#app');

// ------------------------
// Re-initialize UI on route changes
// ------------------------
router.afterEach(() => {
    nextTick(() => {
        initSidebarAndUI();
    });
});
