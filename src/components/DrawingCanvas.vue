<template>
    <v-stage :config="configKonva">
        <v-layer>
            <v-circle :config="configCircle"></v-circle>
        </v-layer>
        <v-layer>
            <v-image v-if="image" :config="configImage" />
        </v-layer>
    </v-stage>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useImage } from 'vue-konva'
import { Image } from 'konva'

const props = defineProps(['image'])

const configKonva = ref({
    width: window.innerWidth * .9,
    height: window.innerHeight
})

const configCircle = ref({
    x: 100,
    y: 100,
    radius: 70,
    fill: "red",
    stroke: "black",
    strokeWidth: 4
})

const configImage = ref({
    x: 0,
    y: 0,
    image: useImage(props.image)[0],
    // ...calcImageContain(image)
})


function calcImageContain(img) {
    const imageWidth = img.width
    const imageHeight = img.height
    const containerWidth = configKonva.value.width
    const containerHeight = configKonva.value.height

    const scaleX = containerWidth / imageWidth
    const scaleY = containerHeight / imageHeight
    const scale = Math.min(scaleX, scaleY)

    return {
        width: imageWidth * scale,
        height: imageHeight * scale
    }
}


</script>