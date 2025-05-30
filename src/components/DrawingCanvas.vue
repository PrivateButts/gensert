<template>
    <div>
        <div>
            <fieldset class="fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4">
                <legend class="fieldset-legend">Tool Selection</legend>
                <label class="label">
                    <input type="radio" v-model="activeTool" value="scale" class="radio" @change="redrawStage" />
                    Scale
                </label>
                <label class="label">
                    <input type="radio" v-model="activeTool" value="outline" class="radio" />
                    Outline
                </label>
            </fieldset>

            <input type="number" class="input" min="1" v-model="scaleLineDistance" />
            <input type="range" class="input" min="0" max="1" step=".01" v-model="outlineTension">
        </div>
        <v-stage :config="configKonva" ref="stage" @click="dispatchClick">
            <v-layer>
                <v-image v-if="image" :config="configImage" />
            </v-layer>
            <v-layer>
                <v-line :config="configScaleLine"></v-line>
            </v-layer>
            <v-layer v-if="outlinePoints.length > 1">
                <v-line :config="configOutline"></v-line>
            </v-layer>
        </v-stage>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useImage } from 'vue-konva'

const props = defineProps(['image'])

const stage = ref(null)

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

const scaleLinePoints = ref([0, 0, 0, 0])
let scalePntSetA = true
const scaleLineDistance = ref(10)

const outlinePoints = ref([])
const outlineTension = ref(0)

const configImage = ref({
    x: 0,
    y: 0,
    image: useImage(props.image)[0],
    width: imageWidth,
    height: imageHeight
})

const configScaleLine = computed(() => {
    return {
        x: 0,
        y: 0,
        points: scaleLinePoints.value,
        stroke: activeTool.value === 'scale' ? "orange" : "gray",
        tension: 0,
        closed: false,
    }
})

const canShowScaleLine = computed(() => {
    return scaleLinePoints.value.every(pnt => pnt !== 0)
})

const configOutline = computed(() => {
    return {
        x: 0,
        y: 0,
        points: outlinePoints.value,
        stroke: activeTool.value === 'outline' ? "blue" : "gray",
        tension: parseFloat(outlineTension.value),
        closed: true,
    }
})


function redrawStage() {
    stage.value.getNode().batchDraw()
}


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

function addScaleLinePoint(event) {
    console.debug('addScaleLinePoint', event)
    const mousePos = stage.value.getNode().getPointerPosition();
    if (scalePntSetA) {
        scaleLinePoints.value[0] = mousePos.x
        scaleLinePoints.value[1] = mousePos.y
    } else {
        scaleLinePoints.value[2] = mousePos.x
        scaleLinePoints.value[3] = mousePos.y
    }
    scalePntSetA = !scalePntSetA

    redrawStage()
}


function addOutlinePoint(event) {
    console.debug('addOutlinePoint', event)
    const mousePos = stage.value.getNode().getPointerPosition();

    outlinePoints.value.push(mousePos.x, mousePos.y)
    redrawStage()
}


function dispatchClick(event) {
    switch (activeTool.value) {
        case 'scale':
            addScaleLinePoint(event)
            break;
        case 'outline':
            addOutlinePoint(event)
            break;
        default:
            console.warn("Unknown tool")
            break;
    }
}


</script>