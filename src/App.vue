<script setup>
// ---------------------------------------------------------------
// App — the shell of PaySol Business.
// Sign-in pages (meta.layout 'none') render alone; everything else gets the
// header, the role-filtered sidebar and the footer. LegalPrompt asks for new
// terms once someone is signed in.
// Navigation guards, NProgress and document.title live in src/router/index.js
// so HMR reloads of App.vue never register duplicate router hooks.
// ---------------------------------------------------------------
import { useRoute } from "vue-router";
import LoaderVue from "./layouts/Loader.vue";
import HeaderVue from "./layouts/Header.vue";
import SideBar from "./layouts/Sidebar.vue";
import FooterVue from "./layouts/Footer.vue";
import LegalPrompt from "./components/legal/LegalPrompt.vue";
import SessionTimeoutModal from "./components/guards/SessionTimeoutModal.vue";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const authStore = useAuthStore();
</script>

<template>
  <LoaderVue />

  <!-- Bare layout (sign-in, activation, choose business): only the view -->
  <div v-if="route.meta.layout === 'none'">
    <router-view />
  </div>

  <!-- Otherwise the full app layout -->
  <div v-else id="layout-wrapper">
    <HeaderVue />
    <SideBar />

    <div class="main-content">
      <!-- Direct header alert strip under the fixed header (matching Admin reference on /test-page) -->
      <div id="main-content-alert-slot" class="main-content-alert-slot"></div>

      <div class="page-content">
        <div class="container-fluid">
          <router-view />
        </div>
      </div>
      <FooterVue />
    </div>

    <!-- New or changed terms for this person (GET /tenant/legal/pending) -->
    <LegalPrompt :active="authStore.isAuthenticated" />

    <!-- Inactivity auto-logout warning modal -->
    <SessionTimeoutModal />
  </div>
</template>

<style scoped>
.main-content-alert-slot:empty {
  display: none;
}

.main-content-alert-slot:not(:empty) {
  margin-top: 70px;
}

.main-content-alert-slot:not(:empty) + .page-content {
  padding-top: 24px;
}
</style>
