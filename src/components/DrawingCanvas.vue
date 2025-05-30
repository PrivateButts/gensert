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
                    <input type="radio" v-model="activeTool" value="outlineDraw" class="radio" />
                    Draw Outline
                </label>
                <label class="label">
                    <input type="radio" v-model="activeTool" value="outlineMove" class="radio" />
                    Move Outline
                </label>
            </fieldset>

            <input type="number" class="input" min="1" v-model="scaleLineDistance" />
            <input type="range" class="input" min="0" max="1" step=".01" v-model="outlineTension">
            <button class="btn btn-primary" @click="exportOutline">Export Outline</button>
        </div>
        <div class="relative" @click="dispatchClick">
            <img :src="image" alt="">
            <svg class="absolute top-0 left-0 w-full h-full" id="scaleLine">
                <line v-if="canShowScaleLine" :x1="scaleLineA.x" :y1="scaleLineA.y" :x2="scaleLineB.x"
                    :y2="scaleLineB.y" stroke="orange" stroke-width="4" />
            </svg>
            <svg class="absolute top-0 left-0 w-full h-full" id="outline">
                <polygon v-if="outlinePoints.length > 0" :points="outlinePath" fill="none" stroke="blue"
                    stroke-width="4" />
                <circle v-for="(pnt, i) in outlinePoints" :cx="pnt.x" :cy="pnt.y" r="5" fill="red" :key="i"
                    @click.stop="removeOutlinePoint(i)" />
            </svg>
            <svg class="absolute top-0 left-0 w-full h-full" id="outlineExport">
                <g :transform="`scale(${calcedScale})`">
                    <polygon v-if="outlinePoints.length > 0" :points="outlinePath" fill="none" stroke="blue"
                        stroke-width="4" />
                </g>
            </svg>
            <!-- <svg class="absolute top-0 left-0 w-full h-full" id="grabs">
                <line v-if="scaleLinePoints.every(x => x > 0)" :x1="scaleLinePoints[0]" :y1="scaleLinePoints[1]"
                    :x2="scaleLinePoints[2]" :y2="scaleLinePoints[3]" stroke="orange" stroke-width="4" />
            </svg> -->
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'

const props = defineProps(['image'])

const activeTool = ref('scale')

const imageWidth = ref(0)
const imageHeight = ref(0)

const scaleLineA = ref(null)
const scaleLineB = ref(null)
const scaleLineDistance = ref(10)

const outlinePoints = ref([])
const outlineTension = ref(0)

const canShowScaleLine = computed(() => {
    return scaleLineA.value && scaleLineB.value
})

const calcedScale = computed(() => {
    if (!canShowScaleLine.value) return 1
    const measuredDistance = Math.sqrt(Math.pow(scaleLineA.value.x - scaleLineB.value.x, 2) + Math.pow(scaleLineA.value.y - scaleLineB.value.y, 2))
    return scaleLineDistance.value / measuredDistance
})

const outlinePath = computed(() => {
    if (outlinePoints.value.length === 0) return ""
    let points = ""

    outlinePoints.value.forEach(pnt => {
        points += `${pnt.x}, ${pnt.y} `
    });

    return points
})

function addScaleLinePoint(event) {
    console.debug('addScaleLinePoint', event)
    const X = event.offsetX
    const Y = event.offsetY

    if (!canShowScaleLine.value) {
        if (!scaleLineA.value) {
            scaleLineA.value = { x: X, y: Y }
        } else if (!scaleLineB.value) {
            scaleLineB.value = { x: X, y: Y }
        }
        return
    }

    const dToA = Math.sqrt(Math.pow(X - scaleLineA.value.x, 2) + Math.pow(Y - scaleLineA.value.y, 2))
    const dToB = Math.sqrt(Math.pow(X - scaleLineB.value.x, 2) + Math.pow(Y - scaleLineB.value.y, 2))

    if (dToA < dToB) {
        scaleLineA.value.x = X
        scaleLineA.value.y = Y
    } else {
        scaleLineB.value.x = X
        scaleLineB.value.y = Y
    }
}


function addOutlinePoint(event) {
    console.debug('addOutlinePoint', event)
    const X = event.offsetX
    const Y = event.offsetY

    outlinePoints.value.push({ x: X, y: Y })
}


function removeOutlinePoint(index) {
    outlinePoints.value.splice(index, 1)
}


function moveOutlinePoint(event) {
    const X = event.offsetX
    const Y = event.offsetY

    const distances = outlinePoints.value.map(point => {
        const dx = point.x - X
        const dy = point.y - Y
        return Math.sqrt(dx * dx + dy * dy)
    })
    const minIndex = distances.indexOf(Math.min(...distances))
    outlinePoints.value[minIndex] = { x: X, y: Y }
}

function dispatchClick(event) {
    switch (activeTool.value) {
        case 'scale':
            addScaleLinePoint(event)
            break;
        case 'outlineDraw':
            addOutlinePoint(event)
            break;
        case 'outlineMove':
            moveOutlinePoint(event)
            break;
        default:
            console.warn("Unknown tool")
            break;
    }
}


function exportOutline() {
    const svgElm = document.getElementById('outlineExport')
    const name = "outline.svg";
    svgElm.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    var svgData = svgElm.outerHTML;
    var preface = '<?xml version="1.0" standalone="no"?>\r\n';
    var svgBlob = new Blob([preface, svgData], { type: "image/svg+xml;charset=utf-8" });
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}


</script>