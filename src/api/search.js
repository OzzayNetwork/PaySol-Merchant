import api from './index';

export default {
    /**
     * Search tenant records across permitted modules.
     *
     * @param {Object} params - { q, category, status, limit }
     * @param {AbortSignal} [signal] - optional AbortController signal
     */
    search(params = {}, signal) {
        return api.get('/tenant/search', { params, signal });
    },

    /**
     * Options for the "How can we improve search?" feedback form.
     */
    feedbackOptions() {
        return api.get('/tenant/search/feedback/options');
    },

    /**
     * Send user feedback on a specific search.
     *
     * @param {Object} payload - { query, category, filters, result_count, elapsed_ms, found, reasons, comment }
     */
    sendFeedback(payload) {
        return api.post('/tenant/search/feedback', payload);
    },
};
