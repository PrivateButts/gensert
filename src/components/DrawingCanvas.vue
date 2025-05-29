<template>
    <div>
        <div>
            <fieldset class="fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4">
                <legend class="fieldset-legend">Tool Selection</legend>
                <label class="label">
                    <input type="radio" v-model="activeTool" value="scale" class="radio" />
                    Scale
                </label>
                <label class="label">
                    <input type="radio" v-model="activeTool" value="outline" class="radio" />
                    Outline
                </label>
            </fieldset>

            <input type="number" class="input" min="1" v-model="scaleLineDistance" />
        </div>
        <v-stage :config="configKonva">
            <v-layer>
                <v-image v-if="image" :config="configImage" />
            </v-layer>
            <v-layer v-if="activeTool === 'scale'">
                <v-line :config="configScaleLine"></v-line>
            </v-layer>
        </v-stage>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useImage } from 'vue-konva'

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

const activeTool = ref('scale')

const imageWidth = ref(0)
const imageHeight = ref(0)

const scaleLinePoints = ref([])
const scaleLineDistance = ref(10)

const configImage = ref({
    x: 0,
    y: 0,
    image: useImage(props.image)[0],
    width: imageWidth,
    height: imageHeight
})

const configScaleLine = ref({
    points: scaleLinePoints,
    stroke: "orange",
    strokeWidth: 2
})


onMounted(() => {
    calcImageContain(props.image).then((result) => {
        configImage.value.width = result.width
        configImage.value.height = result.height
    }).catch((error) => {
        console.error('Error calculating image size:', error)
    })
})


async function calcImageContain(imgBlob) {
    const img = new Image()

    return new Promise((resolve, reject) => {
        img.onload = () => {
            const imageWidth = img.width
            const imageHeight = img.height
            const containerWidth = configKonva.value.width
            const containerHeight = configKonva.value.height

            const scaleX = containerWidth / imageWidth
            const scaleY = containerHeight / imageHeight
            const scale = Math.min(scaleX, scaleY)

            return resolve({
                width: imageWidth * scale,
                height: imageHeight * scale
            })
        }
        img.onerror = reject;
        img.src = imgBlob
    })
}


</script>