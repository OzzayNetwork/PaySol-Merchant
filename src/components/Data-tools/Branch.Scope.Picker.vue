<template>
    <!-- "Works at": every branch, or ticked ones -->
    <div class="branch-scope">
        <template v-if="loading">
            <SkeletonLoader v-for="n in 2" :key="n" type="text" :lines="1" height="38px" class="mb-2" />
        </template>

        <template v-else>
            <!-- All branches (empty scope) -->
            <label class="branch-scope-row" :class="{ 'is-on': all }">
                <input type="radio" class="form-check-input mt-0" :name="`${id}-mode`" :checked="all" :disabled="disabled" @change="setAll(true)" />
                <span class="flex-grow-1">
                    <span class="d-block fw-semibold text-dark">All branches</span>
                    <small class="text-muted">Including branches added later</small>
                </span>
            </label>

            <!-- Only some -->
            <label class="branch-scope-row" :class="{ 'is-on': !all }">
                <input type="radio" class="form-check-input mt-0" :name="`${id}-mode`" :checked="!all" :disabled="disabled || !branches.length" @change="setAll(false)" />
                <span class="flex-grow-1">
                    <span class="d-block fw-semibold text-dark">Only some branches</span>
                    <small class="text-muted">{{ branches.length ? 'Tick where they work' : 'This business has no branches to pick from yet' }}</small>
                </span>
            </label>

            <div v-if="!all" class="ps-4 pt-1">
                <div v-for="b in branches" :key="b.id" class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" :id="`${id}-b-${b.id}`" :value="b.id"
                        :checked="modelValue.includes(b.id)" :disabled="disabled" @change="toggle(b.id)" />
                    <label class="form-check-label" :for="`${id}-b-${b.id}`">
                        {{ b.name }}
                        <span v-if="b.is_main" class="badge bg-light text-muted ms-1">Main</span>
                        <span v-if="b.is_active === false" class="badge bg-light text-muted ms-1">Closed</span>
                    </label>
                </div>
                <small v-if="!modelValue.length" class="text-danger">Tick at least one branch, or choose All branches.</small>
            </div>
        </template>
    </div>
</template>

<script setup>
// ---------------------------------------------------------------
// Branch.Scope.Picker — which branches a person works at (12 Nov 2026).
// Empty array = all branches (the API's branch_scope null / []). Used by Add
// staff and a staff member's Edit; branches come from GET /tenant/branches.
//
// Props: modelValue (branch ids), branches ([{ id, name, is_main, is_active }]),
// loading, disabled, id (unique per form). Emits update:modelValue.
// Styles: custom.css (.branch-scope-row).
// ---------------------------------------------------------------
import { ref, watch } from 'vue'
import SkeletonLoader from '@/components/Loaders/SkeletonLoader.vue'

const props = defineProps({
    modelValue: { type: Array, default: () => [] },
    branches: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    id: { type: String, default: 'branchScope' },
})
const emit = defineEmits(['update:modelValue'])

// "Only some" stays chosen while no box is ticked yet
const all = ref(!props.modelValue.length)
watch(() => props.modelValue, (v) => { if (v.length) all.value = false })

function setAll(on) {
    all.value = on
    if (on) emit('update:modelValue', [])
}

function toggle(branchId) {
    const next = props.modelValue.includes(branchId)
        ? props.modelValue.filter((x) => x !== branchId)
        : [...props.modelValue, branchId]
    emit('update:modelValue', next)
}

// The parent asks before saving: "Only some" with nothing ticked is not valid
defineExpose({ isValid: () => all.value || props.modelValue.length > 0 })
</script>
