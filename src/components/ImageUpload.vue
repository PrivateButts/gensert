<template>
    <input type="image" name="image-upload" @change="handleImageChange" accept="image/*" />
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
