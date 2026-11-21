<template>
    <!-- A pill of periods (Monthly · Quarterly · 6 months · Annual); the selected one is white on the grey track.
         An optional small badge sits beside a label (e.g. "Save 17%"). Styles: custom.css 36 (.period-switch). -->
    <div class="period-switch" role="radiogroup" :aria-label="ariaLabel">
        <button v-for="p in periods" :key="p.key" type="button" role="radio" class="period-switch-btn"
            :class="{ active: modelValue === p.key }" :aria-checked="modelValue === p.key" :disabled="disabled"
            @click="$emit('update:modelValue', p.key)">
            {{ p.label }}
            <span v-if="p.badge" class="period-switch-badge">{{ p.badge }}</span>
        </button>
    </div>
</template>

<script setup>
// ---------------------------------------------------------------
// Billing.Period.Switch — choose a billing period (10 Nov 2026, Plans).
// Shared: the Plans page, the compare page, and later pricing or a
// business's Change plan. v-model is the period key.
//
// Props:  modelValue (key), periods [{ key, label, badge? }],
//         ariaLabel, disabled
// Emits:  update:modelValue
// ---------------------------------------------------------------
defineProps({
    modelValue: { type: String, default: 'monthly' },
    periods: {
        type: Array,
        default: () => [
            { key: 'monthly', label: 'Monthly' },
            { key: 'quarterly', label: 'Quarterly' },
            { key: 'semi_annual', label: '6 months' },
            { key: 'annual', label: 'Annual' },
        ],
    },
    ariaLabel: { type: String, default: 'Billing period' },
    disabled: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])
</script>
