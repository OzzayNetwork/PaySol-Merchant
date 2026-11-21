<template>
    <div class="modal fade" :class="{ show: visible }" tabindex="-1" role="dialog" aria-labelledby="searchFeedbackTitle"
        :style="{ display: visible ? 'block' : 'none' }" :aria-hidden="visible ? 'false' : 'true'">
        <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down animate__animated animate__zoomInUp animate__faster">
            <div class="modal-content">
                <!-- Header -->
                <div class="modal-header align-items-start">
                    <div class="d-flex gap-3 align-items-center">
                        <span class="sf-ic">
                            <Icon icon="ri:message-3-line" />
                        </span>
                        <div>
                            <h5 id="searchFeedbackTitle" class="modal-title fw-bold text-black fs-4 mb-0">How can we improve search?</h5>
                            <span class="text-muted small">About your search for “{{ search.query }}”</span>
                        </div>
                    </div>
                    <button type="button" class="btn p-0 border-0 sf-close" @click="close" :disabled="submitting" title="Close" aria-label="Close">
                        <Icon icon="ri:close-line" class="text-dark" />
                    </button>
                </div>

                <!-- The form -->
                <template v-if="!sent">
                    <div class="modal-body d-flex flex-column gap-4">
                        <!-- 1. Found it? (required) -->
                        <div>
                            <label class="form-label fw-bold mb-2">Did you find what you were looking for? <span class="text-danger">*</span></label>
                            <div class="row g-2">
                                <div class="col-6">
                                    <button type="button" class="sf-mood" :class="{ on: found === true }" :aria-pressed="found === true"
                                        @click="found = true">
                                        <Icon icon="ri:check-line" class="fs-5" /> Yes, found it
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button type="button" class="sf-mood" :class="{ on: found === false }" :aria-pressed="found === false"
                                        @click="found = false">
                                        <Icon icon="ri:error-warning-line" class="fs-5" /> Could be better
                                    </button>
                                </div>
                            </div>
                            <div v-if="err('found')" class="text-danger small mt-1">{{ err('found') }}</div>
                        </div>

                        <!-- 2. What could be better (reasons from the API) -->
                        <div>
                            <label class="form-label fw-bold mb-2">What could be better? <span class="text-muted fw-normal">Pick any</span></label>
                            <div v-if="loadingOptions" class="d-flex flex-wrap gap-2">
                                <SkeletonLoader v-for="i in 5" :key="i" type="rectangle" :width="rand(110, 190)" height="30px" />
                            </div>
                            <div v-else class="d-flex flex-wrap gap-2">
                                <button v-for="r in reasons" :key="r.key" type="button" class="sf-chip" :class="{ on: picked.includes(r.key) }"
                                    :aria-pressed="picked.includes(r.key)" @click="toggleReason(r.key)">
                                    {{ r.label }}
                                </button>
                            </div>
                            <div v-if="err('reasons')" class="text-danger small mt-1">{{ err('reasons') }}</div>
                        </div>

                        <!-- 3. Free text -->
                        <div>
                            <label for="sfComment" class="form-label fw-bold mb-2">Tell us more <span class="text-muted fw-normal">optional</span></label>
                            <textarea id="sfComment" v-model="comment" class="form-control" rows="4" :maxlength="commentMax" :disabled="submitting"
                                placeholder="e.g. I searched a product barcode and the price didn't show up"></textarea>
                            <div class="d-flex justify-content-between">
                                <div v-if="err('comment')" class="text-danger small mt-1">{{ err('comment') }}</div>
                                <span class="text-muted small mt-1 ms-auto">{{ comment.length }} / {{ commentMax }}</span>
                            </div>
                        </div>

                        <!-- Context footer -->
                        <div class="d-flex gap-2 align-items-start p-2 px-3 bg-light rounded small text-muted">
                            <Icon icon="ri:information-line" class="mt-1 flex-shrink-0" />
                            <span>Sent as <strong class="text-dark">{{ senderName }}</strong> with this search: {{ searchSummary }}.
                                Nothing else from your screen is sent.</span>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-link waves-effect fw-bold" @click="close" :disabled="submitting">Cancel</button>
                        <button type="button" class="btn btn-primary fw-semibold d-flex align-items-center gap-2" @click="send"
                            :disabled="submitting || found === null" :title="found === null ? 'Answer the first question first' : 'Send feedback'">
                            <span v-if="submitting" class="spinner-border spinner-border-sm"></span>
                            <Icon v-else icon="ri:send-plane-line" />
                            <span>{{ submitting ? 'Sending…' : 'Send feedback' }}</span>
                        </button>
                    </div>
                </template>

                <!-- Sent confirmation screen -->
                <div v-else class="modal-body text-center px-4 py-5">
                    <span class="sf-done">
                        <Icon icon="ri:check-line" />
                    </span>
                    <h5 class="mt-3 mb-1">Thanks, feedback received</h5>
                    <p class="text-muted mb-4">The team reads every one. Searches people struggle with are improved first.</p>
                    <button type="button" class="btn btn-soft-primary" @click="close">Done</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Backdrop -->
    <div v-if="visible" class="modal-backdrop fade show" @click="close"></div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import SearchAPI from '@/api/search';
import { useAuthStore } from '@/stores/auth';
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue';
import { moduleMeta } from '../helpers/searchMeta';

const emit = defineEmits(['sent', 'error', 'close']);

const authStore = useAuthStore();

// Modal state
const visible = ref(false);
const sent = ref(false);
const submitting = ref(false);
const errors = ref({});

// Search context
const search = ref({ query: '', category: 'all', filters: {}, result_count: null, elapsed_ms: null });

// Form values
const found = ref(null);
const picked = ref([]);
const comment = ref('');

// Options from backend
const reasons = ref([]);
const commentMax = ref(2000);
const loadingOptions = ref(false);

const rand = (min, max) => `${Math.floor(Math.random() * (max - min) + min)}px`;
const err = (key) => errors.value[key]?.[0] || '';

// Sender label
const senderName = computed(() => {
    const u = authStore.user || {};
    const name = u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || 'You';
    const role = authStore.roleLabel || '';
    return role ? `${name} (${role})` : name;
});

const searchSummary = computed(() => {
    const s = search.value;
    const parts = [`“${s.query}”`];
    if (s.category && s.category !== 'all') parts.push(`in ${moduleMeta(s.category).label}`);
    if (s.result_count != null) parts.push(`${s.result_count} ${s.result_count === 1 ? 'result' : 'results'}`);
    const filterCount = Object.keys(s.filters || {}).length;
    parts.push(filterCount ? `${filterCount} ${filterCount === 1 ? 'filter' : 'filters'}` : 'no filters');
    return parts.join(', ');
});

function open(about = {}) {
    search.value = { query: '', category: 'all', filters: {}, result_count: null, elapsed_ms: null, ...about };
    found.value = null;
    picked.value = [];
    comment.value = '';
    errors.value = {};
    sent.value = false;
    submitting.value = false;
    visible.value = true;
    if (!reasons.value.length) loadOptions();
}

function close() {
    if (submitting.value) return;
    visible.value = false;
    emit('close');
}

async function loadOptions() {
    loadingOptions.value = true;
    try {
        const { data } = await SearchAPI.feedbackOptions();
        reasons.value = data.reasons || [];
        commentMax.value = data.comment_max || 2000;
    } catch (error) {
        console.error('Error loading search feedback options:', error);
        // Fallback default options
        reasons.value = [
            { key: 'missing_record', label: 'Missing a product, price or staff member' },
            { key: 'code_no_match', label: 'Barcode, SKU or phone number didn’t match' },
            { key: 'wrong_order', label: 'Results in the wrong order' },
            { key: 'need_filter', label: 'Need another filter or category' },
            { key: 'too_slow', label: 'Search was too slow' },
        ];
    } finally {
        loadingOptions.value = false;
    }
}

function toggleReason(key) {
    picked.value = picked.value.includes(key)
        ? picked.value.filter(k => k !== key)
        : [...picked.value, key];
}

async function send() {
    errors.value = {};
    if (found.value === null) {
        errors.value = { found: ['Please answer this first.'] };
        return;
    }
    submitting.value = true;
    try {
        const { data } = await SearchAPI.sendFeedback({
            query: search.value.query,
            category: search.value.category || 'all',
            filters: search.value.filters || {},
            result_count: search.value.result_count,
            elapsed_ms: search.value.elapsed_ms,
            found: found.value,
            reasons: picked.value,
            comment: comment.value.trim() || null,
        });
        sent.value = true;
        emit('sent', data.data);
    } catch (error) {
        console.error('Error sending search feedback:', error);
        if (error.response?.status === 422) {
            errors.value = error.response.data?.errors || {};
            const reasonKey = Object.keys(errors.value).find(k => k.startsWith('reasons'));
            if (reasonKey) errors.value.reasons = errors.value[reasonKey];
        } else {
            emit('error', 'Feedback Not Sent', error.response?.status === 429
                ? 'That is a lot of feedback in a minute. Please wait a moment and send again.'
                : error.response?.data?.message || 'Please try again.');
        }
    } finally {
        submitting.value = false;
    }
}

defineExpose({ open, close });
</script>

<style scoped>
.sf-ic {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #E8F0FE;
    color: #2164F3;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
}
.sf-close {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(0, 0, 0, .05);
    display: grid;
    place-items: center;
    font-size: 20px;
    line-height: 1;
}
.sf-mood {
    width: 100%;
    height: 46px;
    border-radius: 6px;
    border: 1px solid #E3E7EE;
    background: #FFFFFF;
    color: #495057;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.15s ease-in-out;
}
.sf-mood.on {
    border-color: #2164F3;
    background: #EEF4FF;
    color: #2164F3;
}
.sf-chip {
    height: 30px;
    padding: 0 12px;
    border-radius: 15px;
    border: 1px solid #E3E7EE;
    background: #FFFFFF;
    font-size: 12.5px;
    color: #495057;
    transition: all 0.15s ease-in-out;
}
.sf-chip:hover {
    border-color: #B9CEF9;
}
.sf-chip.on {
    border-color: #B9CEF9;
    background: #EEF4FF;
    color: #2164F3;
}
.sf-done {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #E3F5EC;
    color: #1E7F45;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
}
</style>
