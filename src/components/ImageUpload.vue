<template>
    <fieldset class="fieldset w-xs">
        <legend class="fieldset-legend">Reference Image for SVG Outline</legend>
        <input type="file" name="image-upload" class="file-input" @change="handleImageChange" accept="image/*" />
        <p class="label">Image should be directly of the object you want to trace, without any skew or rotation</p>
    </fieldset>
</template>


<script setup>
import { ref } from 'vue';

const emit = defineEmits(['change'])

const selectedImage = ref(null);


function handleImageChange(event) {
    const file = event.target.files[0];
    if (file) {
        const img = URL.createObjectURL(file);
        selectedImage.value = img;
        emit('change', img);
    }
}
</script>
