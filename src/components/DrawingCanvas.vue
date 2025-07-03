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

            <div>
                <label class="input">
                    <span class="label">Scale Line Distance</span>
                    <input type="number" class="input" min="1" v-model="scaleLineDistance" />
                    <span class="label">mm</span>
                </label>
            </div>
            <div>
                <label class="input">
                    <span class="label">Outline Smoothness</span>
                    <input type="range" class="range" min="0" max="1" step=".01" v-model="outlineTension">
                </label>
            </div>

            <button class="btn btn-primary" @click="exportOutline">Export Outline</button>
            <!-- <fieldset class="fieldset w-xs">
                <legend class="fieldset-legend">Import SVG Outline</legend>
                <input type="file" class="file-input" placeholder=" SVG" accept="image/svg" />
                <button class="btn btn-primary" @click="importOutline">Import</button>
                <p class="label">This doesn't work yet</p>
            </fieldset> -->

        </div>
        <div class="relative w-2xl mx-auto" @click="dispatchClick">
            <img :src="image" alt="">
            <svg class="absolute top-0 left-0 w-full h-full" id="scaleLine">
                <line v-if="canShowScaleLine" :x1="scaleLineA.x" :y1="scaleLineA.y" :x2="scaleLineB.x"
                    :y2="scaleLineB.y" stroke="orange" stroke-width="4" />
            </svg>
            <svg class="absolute top-0 left-0 w-full h-full" id="outline">
                <path v-if="outlinePoints.length > 0" :d="svgPath" fill="none" stroke="blue" stroke-width="4" />
                <circle v-for="(pnt, i) in outlinePoints" :cx="pnt.x" :cy="pnt.y" r="5" fill="red" :key="i"
                    @click.stop="removeOutlinePoint(i)" />
            </svg>
        </div>
        <div class="mt-3 container">
            <legend>Outline Information</legend>
            <table class="table">
                <thead>
                    <tr>
                        <th>Property</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="objWidth !== null">
                        <td>Object Width</td>
                        <td>{{ objWidth }} mm</td>
                    </tr>
                    <tr v-if="objHeight !== null">
                        <td>Object Height</td>
                        <td>{{ objHeight }} mm</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, watch, nextTick } from 'vue'

const emit = defineEmits(['change'])
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

const svgPath = computed(() => {
    if (outlinePoints.value.length === 0) return ""

    const points = outlinePoints.value;
    const tension = outlineTension.value || 0; // Default tension if not set
    const n = points.length;
    if (n < 2) return "";
    let d = `M ${points[0].x} ${points[0].y} `;
    for (let i = 0; i < n; i++) {
        const p0 = points[(i - 1 + n) % n];
        const p1 = points[i];
        const p2 = points[(i + 1) % n];
        const p3 = points[(i + 2) % n];

        // Control points
        const cp1x = p1.x + (p2.x - p0.x) * tension / 6;
        const cp1y = p1.y + (p2.y - p0.y) * tension / 6;
        const cp2x = p2.x - (p3.x - p1.x) * tension / 6;
        const cp2y = p2.y - (p3.y - p1.y) * tension / 6;

        d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y} `;
    }
    d += "Z";
    return d;
})


const objHeight = computed(() => {
    if (outlinePoints.value.length < 2) return null;
    const topMostPnt = Math.min(...outlinePoints.value.map(p => p.y));
    const bottomMostPnt = Math.max(...outlinePoints.value.map(p => p.y));
    return (bottomMostPnt - topMostPnt) * calcedScale.value;
})

const objWidth = computed(() => {
    if (outlinePoints.value.length < 2) return null;
    const leftMostPnt = Math.min(...outlinePoints.value.map(p => p.x));
    const rightMostPnt = Math.max(...outlinePoints.value.map(p => p.x));
    return (rightMostPnt - leftMostPnt) * calcedScale.value;
})


watch([outlinePoints, outlineTension], async (outline, newOutline) => {
    nextTick(() => {
        const svg = createSVG();
        emit('change', { svg, size: { x: objWidth, y: objHeight } });
    })
}, { deep: true });

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


function createSVG() {
    var svgData = `<?xml version="1.0" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg">
    <g transform="scale(${calcedScale.value})">
        <path d="${svgPath.value}" fill="none" stroke="blue" stroke-width="4" />
    </g>
</svg>`;
    return new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
}


function exportOutline() {
    const name = "outline.svg";
    var svgUrl = URL.createObjectURL(createSVG());

    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}


</script>