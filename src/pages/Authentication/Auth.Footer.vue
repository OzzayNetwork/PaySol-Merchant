<template>
    <div class="mt-4 mt-md-5 text-center">
        <p class="mb-0">
        © {{ currentYear }} PaySol · 
        <strong>Know your business without having to be there</strong>
        </p>
    </div>
</template>

<script setup>
const currentYear = new Date().getFullYear();
</script>

<style lang="scss" scoped>
</style>
