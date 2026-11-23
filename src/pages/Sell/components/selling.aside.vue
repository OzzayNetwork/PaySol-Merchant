<template>
  <SellingAside v-bind="$attrs" @sale-completed="$emit('sale-completed', $event)" />
</template>

<script setup>
import SellingAside from './SellingAside.vue';
defineEmits(['sale-completed']);
</script>
