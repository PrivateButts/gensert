<template>
  <div>
    <div class="navbar bg-base-100 shadow-sm">
      <a class="btn btn-ghost text-xl">Gen-sert</a>
    </div>
    <ImageUpload @change="handleImageUpdate" />
    <DrawingCanvas v-if="selectedImage" :image="selectedImage" />
    <PreviewModel :forceDisabled="true" />
  </div>
</template>

<script setup>
import { ref } from 'vue';

const selectedImage = ref(null);

function handleImageUpdate(image) {
  selectedImage.value = image
}

</script>

<style scoped></style>
