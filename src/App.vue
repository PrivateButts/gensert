<template>
  <div>
    <div class="navbar bg-base-100 shadow-sm">
      <a class="btn btn-ghost text-xl">Gen-sert</a>
    </div>
    <div class="mx-3">
      <ImageUpload @change="handleImageUpdate" />
      <DrawingCanvas v-if="selectedImage" :image="selectedImage" @change="handleSVGUpdate" />
      <PreviewModel :forceDisabled="!readyToGenerate" :outline="outline" :outputName="'bin-outline.stl'" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const selectedImage = ref(null);
const outline = ref(null);

function handleImageUpdate(image) {
  selectedImage.value = image
}

function handleSVGUpdate(svg) {
  outline.value = svg
}

const readyToGenerate = computed(() => {
  return [
    selectedImage.value !== null,
    outline.value !== null,
  ].every(test => test == true);
});

</script>

<style scoped></style>
