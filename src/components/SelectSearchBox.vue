<script setup>
import { defineProps, defineEmits } from 'vue'
import { Icon } from '@iconify/vue'
import VueSelect from 'vue3-select-component'

const props = defineProps({
  modelValue: { default: null },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: "" },
  isMulti: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  inputClass: { type: String, default: "" },
  className: { type: String, default: "" },
  required: { type: Boolean, default: false },
  isTaggable: { type: Boolean, default: false },

  // ✅ New Props
  showCreate: { type: Boolean, default: false },
  createText: { type: String, default: "Create" },
  createModalId: { type: [String, Number], default: "categoryModal" },
  createBtnTitle: { type: String, default: "Create new item" },

  // New For Images
  imageKey: { type: String, default: "image" },
  showImages: { type: Boolean, default: false },
  // Contact results use label, phone, email, and optional initials / image.
  contactMode: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'create', 'option-created'])

const updateValue = (newValue) => {
  emit('update:modelValue', newValue)
}

const handleOptionCreated = (newOption) => {
  emit('option-created', newOption)
}

// The create row: open the Bootstrap modal whose id is createModalId (the
// page mounts it, e.g. AddCategory with id="addCategoryModal"), and tell the
// page in case it wants to prefill anything.
const createBoard = () => {
  const modalEl = document.getElementById(String(props.createModalId))
  if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show()
  emit('create', props.createModalId)
}
</script>

<template>
  <VueSelect
  v-model="props.modelValue"
  :options="props.options"
  :placeholder="props.placeholder"
  :is-multi="props.isMulti"
  :is-taggable="props.isTaggable"
  :disabled="props.disabled"
  :input-class="props.inputClass"
  :class="props.className"
  @update:modelValue="updateValue"
  @option-created="handleOptionCreated"
>
  <!-- Selected value -->
  <template v-if="props.showImages || props.contactMode" #value="{ option }">
    <span v-if="props.contactMode" class="text-body">{{ option.label }}</span>
    <template v-else>
    <div class="d-flex align-items-center gap-2 min-w-0">
      <img
        v-if="option?.[props.imageKey]"
        :src="option[props.imageKey]"
        class="select-image"
      />
      <span
        v-else-if="option?.icon"
        class="select-icon-badge"
        :style="{ background: option.iconBg || '#f1f5f9', color: option.iconColor || '#334155' }"
      >
        <Icon :icon="option.icon" class="font-size-14" />
      </span>

      <span class="text-truncate">{{ option.label }}</span>
      <small v-if="option?.subtitle" class="text-muted text-truncate d-none d-sm-inline">· {{ option.subtitle }}</small>
    </div>
    </template>
  </template>

  <!-- Dropdown option -->
  <template v-if="props.showImages || props.contactMode" #option="{ option }">
    <div v-if="props.contactMode" class="contact-search-option d-flex align-items-center gap-3">
      <img
        v-if="option.image"
        :src="option.image"
        :alt="''"
        class="contact-search-avatar"
      />
      <span v-else class="contact-search-initials" aria-hidden="true">{{ option.initials || option.label?.slice(0, 1) }}</span>
      <span class="d-flex flex-column min-w-0">
        <strong class="contact-search-name text-truncate">{{ option.label }}</strong>
        <span class="contact-search-meta text-muted text-truncate">{{ option.email }}</span>
        <span class="contact-search-meta text-muted">{{ option.phone }}</span>
      </span>
    </div>
    <template v-else>
    <div class="d-flex align-items-center gap-2 min-w-0 py-1">
      <img
        v-if="option?.[props.imageKey]"
        :src="option[props.imageKey]"
        class="select-image-rich"
      />
      <span
        v-else-if="option?.icon"
        class="select-icon-badge-rich"
        :style="{ background: option.iconBg || '#f1f5f9', color: option.iconColor || '#334155' }"
      >
        <Icon :icon="option.icon" class="font-size-16" />
      </span>

      <span class="d-flex flex-column min-w-0">
        <span class="fw-semibold text-dark text-truncate">{{ option.label }}</span>
        <small v-if="option?.subtitle" class="text-muted font-size-11 text-truncate">{{ option.subtitle }}</small>
      </span>
    </div>
    </template>
  </template>

  <!--
    Create row, pinned to the bottom of the list by the scoped style (same
    markup as components/testing.vue). Opens the modal with id createModalId.
  -->
  <template v-if="props.showCreate" #menu-header>
    <div class="menu-header waves-effect waves-light cursor-pointer w-100" :title="props.createBtnTitle"
      @click.stop="createBoard">
      <div class="d-flex gap-3 cursor-pointer align-items-center w-100">
        <div class="bg-primary-subtle waves-effect waves-light btn-sm p-1 px-2 rounded">
          <i class="mdi mdi-plus fs-5"></i>
        </div>
        <h3 class="text-black mb-0">
          <span>{{ props.createText }}</span>
        </h3>
      </div>
    </div>
  </template>
</VueSelect>
</template>

<style scoped>
/* IMPORTANT: reach into VueSelect dropdown */
:deep(.vs__dropdown-menu) {
  display: flex;
  flex-direction: column;
}

/* send header to the bottom */
:deep(.menu-header) {
  order: 999;          /* puts it after options */
  margin-top: auto;    /* pushes it to bottom */
  position: sticky;
  top: 0;
  z-index: 5;
  padding: var(--vs-option-padding);
  background: #fff;
  border-bottom: 1px solid #eee;
}

/* hover */
:deep(.menu-header:hover) {
  background: #bcd7ff;
}

:deep(.menu-header:hover i) {
  color: black;
}

:deep(.menu-header h3) {
  font-size: var(--vs-option-font-size);
  font-weight: var(--bs-body-font-weight);
}

.select-image {
  width: 22px;
  height: 22px;
  object-fit: contain;
  border-radius: 50%;
  flex-shrink: 0;
}

.select-image-rich {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 50%;
  flex-shrink: 0;
}

.select-icon-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.select-icon-badge-rich {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.contact-search-option { min-width: 0; padding: 4px 0; }
.contact-search-avatar,
.contact-search-initials {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  border-radius: 50%;
}
.contact-search-avatar { object-fit: cover; }
.contact-search-initials {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eef2f7;
  color: #495057;
  font-size: 13px;
  font-weight: 700;
}
.contact-search-name { color: var(--bs-body-color); font-size: 13px; }
.contact-search-meta { font-size: 11px; line-height: 1.35; }
</style>
