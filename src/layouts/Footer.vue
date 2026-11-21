<template>
  <!-- Footer: the app on the left, the signed-in business on the right -->
  <footer class="footer">
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-6">
          © {{ currentYear }} PaySol Business
        </div>
        <div class="col-md-6 d-none d-md-block">
          <div class="text-md-end">
            {{ businessName }}
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
// ---------------------------------------------------------------
// Footer — the year and app name, and the business this session is for
// (from the auth store, so it follows a business switch).
// ---------------------------------------------------------------
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const currentYear = new Date().getFullYear()
const businessName = computed(() => authStore.tenant?.name || '')
</script>
