<template>
    <!-- "Please review our terms": shown after sign-in when GET /tenant/legal/pending has something.
         Blocking terms (in force now): no close button, no "Later". Scheduled ones: "Remind me later". -->
    <div class="modal fade" :id="id" tabindex="-1" aria-hidden="true" aria-labelledby="legalPromptTitle"
        :data-bs-backdrop="blocking ? 'static' : true" :data-bs-keyboard="blocking ? 'false' : 'true'">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header border-bottom-0 pb-0">
                    <h5 class="modal-title" id="legalPromptTitle">{{ blocking ? 'Please accept our updated terms' : 'Our terms are changing' }}</h5>
                    <button v-if="!blocking" type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p class="text-muted">
                        {{ blocking
                            ? 'To keep using PaySol, please read and accept the terms below. Your counters keep selling while you decide.'
                            : 'These changes take effect on the dates shown. You can accept them now or later.' }}
                    </p>

                    <div v-for="d in items" :key="`${d.key}-${d.version}`" class="legal-prompt-item">
                        <div class="d-flex align-items-start gap-2">
                            <Icon icon="ri:file-text-line" class="fs-4 text-primary flex-shrink-0" />
                            <div class="flex-grow-1 min-w-0">
                                <div class="fw-semibold text-black">{{ d.name }} <small class="text-muted fw-normal">· version {{ d.version }}</small></div>
                                <small class="text-muted d-block">{{ d.blocking ? 'In force' : 'Takes effect' }} {{ formatDate(d.effective_at) }}</small>
                                <p v-if="d.summary" class="mb-0 mt-2 font-size-13">{{ d.summary }}</p>
                                <a v-if="d.public_url" :href="d.public_url" target="_blank" rel="noopener" class="font-size-13">Read it in full <i class="mdi mdi-open-in-new"></i></a>
                            </div>
                        </div>
                    </div>

                    <div class="form-check mt-3">
                        <input class="form-check-input" type="checkbox" id="legalPromptAgree" v-model="agreed">
                        <label class="form-check-label" for="legalPromptAgree">I have read and accept {{ items.length > 1 ? 'these terms' : 'this' }} for my business.</label>
                    </div>
                    <p v-if="error" class="text-danger font-size-13 mt-2 mb-0">{{ error }}</p>
                </div>
                <div class="modal-footer border-top-0 pt-0">
                    <button v-if="!blocking" type="button" class="btn btn-light waves-effect" data-bs-dismiss="modal">Remind me later</button>
                    <button type="button" class="btn btn-primary waves-effect waves-light" :disabled="!agreed || saving" @click="accept">
                        <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span> Accept
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
// ---------------------------------------------------------------
// LegalPrompt — asks the signed-in person to accept new or changed legal
// terms (11 Nov 2026). Mounted once in App.vue for signed-in pages.
//
// GET  /tenant/legal/pending  -> what this person still has to accept
// POST /tenant/legal/accept   -> { accept: [{ key, version }] }
//
// Blocking items (in force now) make the modal static: no close, no Later.
// Non-blocking ones (scheduled) can be put off; "Later" is remembered for this
// browser session only, so it asks again next time they sign in.
// Pass `preview` (an array in the API's shape) to show it without the API,
// as the Test Page does.
// ---------------------------------------------------------------
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted, nextTick, watch } from 'vue'

import LegalAPI from '@/api/legal'
import { formatDate } from '@/utils/dates'

const props = defineProps({
    id: { type: String, default: 'legalPromptModal' },
    preview: { type: Array, default: null },      // Test Page only
    active: { type: Boolean, default: true },     // false while signed out
})
const emit = defineEmits(['accepted'])

const items = ref([])
const agreed = ref(false)
const saving = ref(false)
const error = ref('')
const blocking = computed(() => items.value.some(d => d.blocking))

const LATER_KEY = 'psLegalLater'

function modal() {
    const el = document.getElementById(props.id)
    return el ? window.bootstrap.Modal.getOrCreateInstance(el) : null
}

// Load what is pending; open the modal if there is something to ask
async function check() {
    if (props.preview) {
        items.value = props.preview
    } else {
        if (!props.active) return
        try {
            const { data } = await LegalAPI.pending()
            items.value = data.data || []
        } catch (e) {
            // Never stand in the way of work over this: try again next sign-in
            console.error('Error loading pending terms:', e)
            return
        }
        if (!blocking.value && sessionStorage.getItem(LATER_KEY)) return
    }
    if (!items.value.length) return
    agreed.value = false
    error.value = ''
    await nextTick()
    modal()?.show()
}

async function accept() {
    if (props.preview) { modal()?.hide(); return }
    saving.value = true
    error.value = ''
    try {
        const { data } = await LegalAPI.accept(items.value.map(d => ({ key: d.key, version: d.version })))
        items.value = data.data || []
        if (!items.value.length) {
            modal()?.hide()
            emit('accepted')
        }
    } catch (e) {
        console.error('Error accepting terms:', e)
        error.value = e.response?.data?.message || 'Could not save that. Please try again.'
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    // "Remind me later" (or the ×) on scheduled terms: quiet for this session
    document.getElementById(props.id)?.addEventListener('hidden.bs.modal', () => {
        if (!props.preview && items.value.length && !blocking.value) sessionStorage.setItem(LATER_KEY, '1')
    })
    // The Test Page opens its preview with the buttons, not on load
    if (!props.preview) check()
})

// Signing in (active turns true) asks again
watch(() => props.active, (on) => { if (on) check() })

defineExpose({ check })
</script>
