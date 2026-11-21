<template>
    <!-- One card per role: icon, name, what they can do. Outline icon idle, filled when picked -->
    <div class="role-picker" role="radiogroup" :aria-label="ariaLabel">
        <button v-for="key in roles" :key="key" type="button" class="role-picker-card"
            :class="{ 'is-on': modelValue === key }" role="radio" :aria-checked="modelValue === key"
            :disabled="disabled" @click="pick(key)">
            <span class="avatar-xs flex-shrink-0">
                <span class="avatar-title rounded-circle" :class="meta[key]?.tint || 'bg-light text-muted'">
                    <Icon :icon="modelValue === key ? (meta[key]?.iconActive || meta[key]?.icon) : meta[key]?.icon" class="fs-5" />
                </span>
            </span>
            <span class="flex-grow-1 text-start min-w-0">
                <span class="d-block fw-semibold text-dark">{{ meta[key]?.label || key }}</span>
                <small class="d-block text-muted">{{ meta[key]?.about }}</small>
            </span>
            <Icon :icon="modelValue === key ? 'ri:radio-button-fill' : 'ri:checkbox-blank-circle-line'"
                class="fs-4 flex-shrink-0" :class="modelValue === key ? 'text-primary' : 'text-muted'" />
        </button>
    </div>
</template>

<script setup>
// ---------------------------------------------------------------
// Role.Picker — choose one role from cards (12 Nov 2026). Used by Add staff and
// a staff member's Edit; works for any list of options in the same shape.
//
// Props: modelValue (key), roles (keys in order), meta ({ key: { label, about,
// icon, iconActive, tint } }), disabled, ariaLabel. Emits update:modelValue.
// Styles: custom.css (.role-picker, .role-picker-card).
// ---------------------------------------------------------------
import { Icon } from '@iconify/vue'

const props = defineProps({
    modelValue: { type: String, default: '' },
    roles: { type: Array, required: true },
    meta: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
    ariaLabel: { type: String, default: 'Role' },
})
const emit = defineEmits(['update:modelValue'])

function pick(key) {
    if (!props.disabled) emit('update:modelValue', key)
}
</script>
