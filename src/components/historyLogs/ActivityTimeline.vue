<template>
    <div class="activity-card">
        <!-- Timeline entries are plain text; matched fields are highlighted with Vue nodes, never injected HTML. -->
        <div class="timeline">
            <div v-for="(log, index) in displayedLogs" :key="log.id" class="timeline-item">
                <div class="timeline-marker" :class="getMarkerClass(log.type, index)">
                    <span v-if="index === 0" class="marker-dot"></span>
                </div>
                <div class="timeline-content">
                    <div class="log-message text-capitalize">
                        <template v-for="(part, partIndex) in formatMessage(log.message, log.fields)" :key="partIndex">
                            <span v-if="part.highlighted" class="highlight-field">{{ part.text }}</span>
                            <span v-else>{{ part.text }}</span>
                        </template>
                    </div>
                    <div class="log-meta">
                        {{ log.date }} • {{ log.time }}
                        <span v-if="log.user"> • {{ log.user }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Show the control whenever this local list has entries beyond the visible page. -->
        <div v-if="hasMore" class="load-more-container">
            <button type="button" @click="loadMore" class="btn btn-link waves-effect" title="Show more changes">
                Load more <span class="small text-muted">({{ displayedLogs.length }} of {{ sortedLogs.length }})</span>
            </button>
        </div>
    </div>
</template>

<script setup>
// ---------------------------------------------------------------
// Activity timeline used by the Site Identity change-history aside.
// It receives already-fetched log rows and only controls their display.
// Messages and highlighted fields stay text so API values cannot inject HTML.
// ---------------------------------------------------------------
import { ref, computed } from 'vue'

// Display settings
const INITIAL_ITEMS = 5
const ITEMS_PER_PAGE = 5

const props = defineProps({
    logs: {
        type: Array,
        default: () => [],
    }
})

const itemsToShow = ref(INITIAL_ITEMS)

// The Site Identity aside passes oldest-first rows so the newest entry appears first here.
const sortedLogs = computed(() => {
    return [...props.logs].reverse()
})

const displayedLogs = computed(() => {
    return sortedLogs.value.slice(0, itemsToShow.value)
})

const hasMore = computed(() => {
    return itemsToShow.value < sortedLogs.value.length
})

const loadMore = () => {
    itemsToShow.value = Math.min(itemsToShow.value + ITEMS_PER_PAGE, sortedLogs.value.length)
}

const formatMessage = (message, fields) => {
    const text = String(message ?? '')
    const terms = [...new Set((Array.isArray(fields) ? fields : [])
        .filter(field => typeof field === 'string' && field.length > 0))]
        .sort((first, second) => second.length - first.length)
    if (!terms.length || !text) return [{ text, highlighted: false }]

    const parts = []
    let cursor = 0
    while (cursor < text.length) {
        const remaining = text.slice(cursor)
        const lowerRemaining = remaining.toLocaleLowerCase()
        let nextMatch = null

        for (const term of terms) {
            const matchIndex = lowerRemaining.indexOf(term.toLocaleLowerCase())
            if (matchIndex !== -1 && (!nextMatch || matchIndex < nextMatch.index)) {
                nextMatch = { index: matchIndex, term }
            }
        }

        if (!nextMatch) {
            parts.push({ text: remaining, highlighted: false })
            break
        }
        if (nextMatch.index > 0) {
            parts.push({ text: remaining.slice(0, nextMatch.index), highlighted: false })
        }
        parts.push({ text: remaining.slice(nextMatch.index, nextMatch.index + nextMatch.term.length), highlighted: true })
        cursor += nextMatch.index + nextMatch.term.length
    }

    return parts
}

const getMarkerClass = (type, index) => {
    if (index === 0) return 'marker-active'
    return 'marker-inactive'
}
</script>

<style scoped>
.activity-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
}

.timeline {
    position: relative;
}

.timeline-item {
    display: flex;
    gap: 16px;
    position: relative;
    padding-bottom: 24px;
}

.timeline-item:last-child {
    padding-bottom: 0;
}

.timeline-item:last-child .timeline-marker::after {
    display: none;
}

.timeline-marker {
    position: relative;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.timeline-marker::before {
    content: '';
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #d1d5db;
    background: white;
    position: relative;
    z-index: 2;
}

.timeline-marker.marker-active::before {
    border-color: #3b82f6;
    border-width: 2px;
}

.timeline-marker .marker-dot {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #3b82f6;
    z-index: 3;
}

.timeline-marker::after {
    content: '';
    position: absolute;
    left: 9px;
    top: 20px;
    width: 2px;
    height: calc(100% + 24px);
    background: #e5e7eb;
    z-index: 1;
}

.timeline-content {
    flex: 1;
    padding-top: 1px;
}

.log-message {
    color: #1f2937;
    line-height: 1.5;
    margin-bottom: 4px;
}

.log-meta {
    color: #9ca3af;
    font-size: 12px;
    line-height: 1.4;
}

.load-more-container {
    margin-top: 24px;
    text-align: center;
    padding-top: 24px;
    border-top: 1px solid #e5e7eb;
}

.btn-load-more {
    background: white;
    border: 1px solid #d1d5db;
    color: #374151;
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-load-more:hover {
    background: #f9fafb;
    border-color: #9ca3af;
}

.btn-load-more:active {
    transform: scale(0.98);
}

.highlight-field {
    background: #dbeafe;
    color: #1e40af;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
}
</style>
