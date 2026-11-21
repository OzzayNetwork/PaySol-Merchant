<template>
    <!-- Confirm suspend / reactivate / remove for one person -->
    <div class="modal fade" :id="id" tabindex="-1" aria-hidden="true" :aria-labelledby="`${id}Title`">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content" v-if="person && copy">
                <div class="modal-header border-bottom-0 pb-0">
                    <h5 class="modal-title" :id="`${id}Title`">{{ copy.title }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" :disabled="saving"></button>
                </div>
                <div class="modal-body">
                    <!-- Who -->
                    <div class="d-flex align-items-center gap-3 p-3 rounded bg-light mb-3">
                        <div class="avatar-sm flex-shrink-0">
                            <span class="avatar-title rounded-circle fw-semibold" :class="ROLE_META[person.role]?.tint || 'bg-light text-muted'">{{ initialsOf(person.name) }}</span>
                        </div>
                        <div class="min-w-0">
                            <div class="fw-semibold text-dark text-truncate">{{ person.name }}</div>
                            <small class="text-muted">{{ person.role_label || roleLabel(person.role) }} · {{ person.phone }}</small>
                        </div>
                    </div>
                    <p class="mb-0 text-muted">{{ copy.body }}</p>
                    <p v-if="error" class="text-danger font-size-13 mt-2 mb-0">{{ error }}</p>
                </div>
                <div class="modal-footer border-top-0 pt-0">
                    <button type="button" class="btn btn-white waves-effect" data-bs-dismiss="modal" :disabled="saving">Cancel</button>
                    <button type="button" class="btn waves-effect waves-light" :class="copy.btn" :disabled="saving" @click="confirm">
                        <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span> {{ copy.action }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
// ---------------------------------------------------------------
// StaffAction.modal — asks before suspending, reactivating or removing a staff
// member, then calls the API (12 Nov 2026). Modelled on the console's
// DeactivateAdminModal. Opened with ref.open(person, action).
//
// POST /tenant/staff/{id}/suspend · /reactivate · DELETE /tenant/staff/{id}
// (owner, manager; the owner can never be suspended or removed).
// Emits done({ person, action, data }) and error(title, message).
// ---------------------------------------------------------------
import { ref, computed } from 'vue'
import StaffAPI from '@/api/staff'
import { ROLE_META, roleLabel, initialsOf } from '../helpers/staffMeta'

const props = defineProps({
    id: { type: String, default: 'staffActionModal' },
})
const emit = defineEmits(['done', 'error'])

const person = ref(null)
const action = ref('')       // suspend | reactivate | remove
const saving = ref(false)
const error = ref('')

// The words for each action
const copy = computed(() => {
    const name = person.value?.name?.split(/\s+/)[0] || 'They'
    return {
        suspend: {
            title: 'Suspend this person?', action: 'Suspend', btn: 'btn-danger',
            body: `${name} won't be able to sign in to this business or sell until you reactivate them. Their sales and history stay.`,
        },
        reactivate: {
            title: 'Reactivate this person?', action: 'Reactivate', btn: 'btn-primary',
            body: `${name} can sign in to this business again with their role and branches as before.`,
        },
        remove: {
            title: 'Remove from this business?', action: 'Remove', btn: 'btn-danger',
            body: `${name} loses access to this business for good. Their past sales and activity stay in the records. To bring them back you'd add them again.`,
        },
    }[action.value]
})

function modal() {
    const el = document.getElementById(props.id)
    return el ? window.bootstrap.Modal.getOrCreateInstance(el) : null
}

function open(p, a) {
    person.value = p
    action.value = a
    error.value = ''
    modal()?.show()
}

async function confirm() {
    saving.value = true
    error.value = ''
    try {
        const id = person.value.id
        const call = { suspend: StaffAPI.suspend, reactivate: StaffAPI.reactivate, remove: StaffAPI.remove }[action.value]
        const { data } = await call(id)
        modal()?.hide()
        emit('done', { person: person.value, action: action.value, data: data?.data || null, message: data?.message })
    } catch (e) {
        console.error(`Error trying to ${action.value} staff:`, e)
        // 422 explains (e.g. "The business owner cannot be suspended."); 403 means the role can't
        const first = e.response?.data?.errors ? Object.values(e.response.data.errors)[0]?.[0] : null
        error.value = first || e.response?.data?.message || 'That did not work. Please try again.'
    } finally {
        saving.value = false
    }
}

defineExpose({ open })
</script>
