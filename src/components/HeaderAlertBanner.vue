<template>
    <!-- Wide operational alert for the strip directly below the application header. -->
    <section class="header-alert-banner" :class="`header-alert-${safeTone}`" :style="{ '--header-alert-tone': toneColor }"
        :role="safeTone === 'warning' || safeTone === 'danger' ? 'alert' : 'status'" aria-live="polite">
        <span class="header-alert-pulse" aria-hidden="true"></span>
        <span class="header-alert-tag">
            <Icon v-if="icon" :icon="icon" aria-hidden="true" />
            {{ label }}
        </span>

        <p class="header-alert-copy mb-0">
            <strong>{{ title }}:</strong> {{ message }}
        </p>

        <button v-if="detailsLabel" type="button" class="header-alert-details" :title="detailsLabel" @click="emit('details')">
            {{ detailsLabel }} <Icon icon="mdi:open-in-new" aria-hidden="true" />
        </button>

        <button v-if="actionLabel" type="button" class="header-alert-action" :disabled="busy" :title="actionLabel" @click="emit('action')">
            <Icon v-if="actionIcon" :icon="actionIcon" aria-hidden="true" />
            {{ actionLabel }}
        </button>
        <button v-if="dismissible" type="button" class="header-alert-dismiss" :disabled="busy" :title="dismissLabel" :aria-label="dismissLabel" @click="emit('dismiss')">
            <Icon icon="mdi:close" aria-hidden="true" />
        </button>
    </section>
</template>

<script setup>
// ---------------------------------------------------------------
// Header alert banner: an operational alert strip directly below the app header.
// The parent provides its copy and handles details/action events; this component
// makes no API calls and does not own alert state.
// ---------------------------------------------------------------
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

// Inputs
const props = defineProps({
    tone: { type: String, default: 'warning' },
    label: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    icon: { type: String, default: '' },
    detailsLabel: { type: String, default: '' },
    actionLabel: { type: String, default: '' },
    actionIcon: { type: String, default: 'mdi:send' },
    busy: { type: Boolean, default: false },
    dismissible: { type: Boolean, default: false },
    dismissLabel: { type: String, default: 'Dismiss alert' },
})

const emit = defineEmits(['details', 'action', 'dismiss'])

// Keep caller-provided tones within the four supported operational states.
const toneColors = {
    warning: 'var(--warning-icon, #d97706)',
    danger: 'var(--bs-danger)',
    info: 'var(--bs-info)',
    success: 'var(--bs-success)',
}
const safeTone = computed(() => Object.prototype.hasOwnProperty.call(toneColors, props.tone) ? props.tone : 'warning')
const toneColor = computed(() => toneColors[safeTone.value])
</script>

<style scoped>
.header-alert-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 44px;
    padding: 7px 14px;
    border-bottom: 1px solid color-mix(in srgb, var(--header-alert-tone) 32%, transparent);
    background: color-mix(in srgb, var(--header-alert-tone) 11%, #fff);
    color: var(--bs-body-color);
    font-size: 12px;
}

.header-alert-pulse {
    width: 8px;
    height: 8px;
    flex: 0 0 8px;
    border-radius: 50%;
    background: var(--header-alert-tone);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--header-alert-tone) 18%, transparent);
    animation: header-alert-pulse 1.8s ease-in-out infinite;
}

@keyframes header-alert-pulse {
    50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--header-alert-tone) 7%, transparent); }
}

@media (prefers-reduced-motion: reduce) {
    .header-alert-pulse { animation: none; }
}

.header-alert-tag {
    flex: 0 0 auto;
    padding: 4px 8px;
    border: 1px solid color-mix(in srgb, var(--header-alert-tone) 38%, transparent);
    border-radius: 4px;
    background: color-mix(in srgb, var(--header-alert-tone) 15%, #fff);
    color: color-mix(in srgb, var(--header-alert-tone) 68%, #251500);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .04em;
    line-height: 1.2;
    text-transform: uppercase;
    white-space: nowrap;
}

.header-alert-copy {
    flex: 1 1 auto;
    min-width: 0;
    line-height: 1.45;
}

.header-alert-copy strong { color: var(--bs-dark); }

.header-alert-details {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    flex: 0 0 auto;
    padding: 4px 2px;
    border: 0;
    background: transparent;
    color: color-mix(in srgb, var(--header-alert-tone) 78%, #271500);
    font-size: 11px;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
    white-space: nowrap;
}

.header-alert-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex: 0 0 auto;
    padding: 6px 11px;
    border: 1px solid var(--header-alert-tone);
    border-radius: 7px;
    background: var(--header-alert-tone);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
}

.header-alert-action:hover:not(:disabled) { filter: brightness(.93); }
.header-alert-action:disabled { cursor: not-allowed; opacity: .65; }

.header-alert-dismiss {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--bs-secondary-color, #74788d);
}

.header-alert-dismiss:hover:not(:disabled) { background: color-mix(in srgb, var(--header-alert-tone) 14%, transparent); }
.header-alert-dismiss:disabled { cursor: not-allowed; opacity: .55; }

@media (max-width: 767.98px) {
    .header-alert-banner { flex-wrap: wrap; gap: 8px 10px; }
    .header-alert-copy { flex-basis: calc(100% - 26px); order: 2; }
    .header-alert-details { margin-left: 18px; }
    .header-alert-details, .header-alert-action { order: 3; }
}
</style>
