<template>
    <form class="px-5 mt-2 mb-5" @submit.prevent="generateBtnHandler">
        <legend>Generation Settings</legend>

        <div class="columns-sm">
            <fieldset class="fieldset w-xs break-inside-avoid">
                <legend class="fieldset-legend">Sizing</legend>
                <label class="label">Addition Bins Wide</label>
                <label class="input">
                    <input type="number" class="input" v-model="additionalBinX" />
                    <span class="label">Bins</span>
                </label>
                <label class="label">Additional Bins Tall</label>
                <label class="input">
                    <input type="number" class="input" v-model="additionalBinY" />
                    <span class="label">Bins</span>
                </label>
                <label class="label">Bin Height</label>
                <label class="input">
                    <input type="number" class="input" v-model="scadVariables.gridz" />
                    <span class="label">z units</span>
                </label>
            </fieldset>
            <fieldset class="fieldset w-xs break-inside-avoid">
                <legend class="fieldset-legend">Insert Options</legend>
                <label class="label">Cutout Depth</label>
                <label class="input">
                    <input type="number" class="input" v-model="scadVariables.outline_depth" />
                    <span class="label">mm</span>
                </label>
                <label class="label">Insert Height</label>
                <label class="input">
                    <input type="number" class="input" v-model="scadVariables.height_internal" />
                    <span class="label">mm</span>
                </label>
                <p class="label">Leave at 0 to fill the bin</p>
            </fieldset>
            <fieldset class="fieldset w-xs break-inside-avoid">
                <legend class="fieldset-legend">Generation Options</legend>
                <label class="label">Lip Style</label>
                <select class="select" v-model="scadVariables.style_lip">
                    <option value="0" selected>Regular Lip</option>
                    <option value="1">Remove Lip</option>
                    <option value="2">No Lip, Full Height</option>
                </select>
                <label class="label">Hole Type</label>
                <select class="select" v-model="hole_selection" @change="updateHoleSelection">
                    <option value="magnet_holes" selected>Magnet Holes</option>
                    <option value="refined_holes">Refined Holes</option>
                </select>
                <label class="label">
                    <input type="checkbox" class="checkbox" v-model="scadVariables.only_corners" />
                    Only Corners
                </label>
                <label class="label">
                    <input type="checkbox" class="checkbox" v-model="scadVariables.screw_holes" />
                    Screw Holes
                </label>
                <label class="label">
                    <input type="checkbox" class="checkbox" v-model="scadVariables.crush_ribs" />
                    Crush Ribs
                </label>
                <label class="label">
                    <input type="checkbox" class="checkbox" v-model="scadVariables.chamfer_holes" />
                    Chamfer Holes
                </label>
                <label class="label">
                    <input type="checkbox" class="checkbox" v-model="scadVariables.printable_hole_top" />
                    Printable Hole Top
                </label>
                <label class="label">
                    <input type="checkbox" class="checkbox" v-model="scadVariables.enable_thumbscrew" />
                    Enable Thumbscrew
                </label>
            </fieldset>
        </div>

        <button @click="generateBtnHandler" :disabled="generating || forceDisabled"
            class="btn btn-block btn-primary my-2">
            Generate
        </button>
        <button @click="downloadSTL" :disabled="!generatedSTL" class="btn btn-block btn-primary">
            Download STL
        </button>
    </form>
    <div v-if="generating" class="aspect-video max-w-3/4 mx-auto">
        <div class="w-full">Generating... This tab may freeze for a couple seconds.</div>
    </div>
    <STLViewer v-if="!generating && generatedSTL" :stlFile="stlDataUrl" :modelOptions="{ ...props.modelOptions }"
        class="aspect-video max-w-3/4 mx-auto border"></STLViewer>
    <div class="px-5 mt-5">
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

import useOpenSCAD from '@/lib/alt-wasm/openscad'


// const props = defineProps({
//     scadFile: { type: Object as () => SCADResource, required: true },
//     outputName: { type: String, required: true },
//     scadResources: { type: Array as () => SCADResource[] },
//     scadVariables: { type: Object },
//     modelOptions: { type: Object, default: () => ({}) },
//     forceDisabled: { type: Boolean, default: false }
// })

const props = defineProps(['outputName', 'forceDisabled', 'outline'])

const scadInstance = ref()
const scadVariables = ref({
    gridx: 1,
    gridy: 1,
    gridz: 3,
    outline_depth: 10,
    height_internal: 0,
    style_lip: 0,
    only_corners: false,
    refined_holes: false,
    magnet_holes: true,
    screw_holes: false,
    crush_ribs: true,
    chamfer_holes: true,
    printable_hole_top: true,
    enable_thumbscrew: false,
})
const resourceDatas = ref({})
const generating = ref(false)
const prepped = ref(false)
const generatedSTL = ref()
const additionalBinX = ref(0)
const additionalBinY = ref(0)
const hole_selection = ref('magnet_holes')

const scadFile = {
    name: "gridfinity-rebuilt-bins.scad",
    url: "/openscad/gridfinity-rebuilt-bins.scad"
}

const scadResourceNames = [
    "generic-helpers.scad", "gridfinity-rebuilt-utility.scad", "threads.scad", "gridfinity-baseplate.scad", "gridfinity-rebuilt-holes.scad", "standard.scad"
]

const scadResources = scadResourceNames.map(name => ({ name, url: `/openscad/${name}` }))

onMounted(async () => {
    fetchResource(scadFile)
    if (scadResources) {
        console.log('fetching resources', scadResources)
        await Promise.all(scadResources.map(fetchResource))
    }
})

watch(() => scadResources, async (newResources) => {
    if (newResources) {
        console.log('scadResources changed, fetching new resources', newResources)
        await Promise.all(scadResources.map(fetchResource))
    }
}, { deep: true })

const fetchResource = async (resource) => {
    const response = await fetch(resource.url)
    if (!response.ok) {
        throw new Error(`Failed to fetch ${resource.url}`)
    }
    const data = await response.arrayBuffer()
    resourceDatas.value[resource.name] = new Uint8Array(data)
}

const prepFS = async () => {
    if (!scadInstance.value) return
    if (Object.keys(resourceDatas.value).length < (scadResources?.length || 0) + 1) return

    console.debug('prepping FS')

    await scadInstance.value.FS.writeFile('/' + scadFile.name, resourceDatas.value[scadFile.name])
    scadVariables.value['gridx'] = Math.ceil(props.outline.size.x / 42) + additionalBinX.value
    scadVariables.value['gridy'] = Math.ceil(props.outline.size.y / 42) + additionalBinY.value
    console.debug('updating scad vars', scadVariables)
    const svgArrayBuffer = await props.outline.svg.arrayBuffer();
    const svgOutline = new Uint8Array(svgArrayBuffer);
    await scadInstance.value.FS.writeFile('/outline.svg', svgOutline)
    if (scadResources) {
        await scadResources.forEach(async (resource) => {
            if (resourceDatas.value[resource.name]) {
                await scadInstance.value.FS.writeFile('/' + resource.name, resourceDatas.value[resource.name])
            }
        })
    }

    prepped.value = true
}


const generateBtnHandler = async () => {
    generating.value = true
    try {
        await generate()
    } catch (e) {
        console.error(e)
    }
    generating.value = false
}

const generate = async () => {
    const wasmMemory = new WebAssembly.Memory({ initial: 16384, maximum: 16384 })
    scadInstance.value = await useOpenSCAD({
        wasmMemory,
        buffer: wasmMemory && wasmMemory.buffer,
        noInitialRun: true,
        print: (text) => {
            console.debug('stdout: ' + text)
        },
        printErr: (text) => {
            console.debug('stderr: ' + text)
        }
    })
    window.scadInstance = scadInstance.value
    await prepFS()

    console.debug(scadInstance)
    let cmd = [`/${scadFile.name}`, "--enable=manifold"]
    if (scadVariables.value) {
        for (const [key, value] of Object.entries(scadVariables.value)) {
            if (typeof value === 'boolean') {
                cmd.push('-D', `${key}=${value}`)
            } else if (typeof value === 'number') {
                cmd.push('-D', `${key}=${value}`)
            } else {
                cmd.push('-D', `${key}="${value}"`)
            }
        }
    }
    cmd.push('-o', 'output.stl')
    console.debug("Current MEMFS: ", scadInstance.value.FS.readdir('/'))
    console.debug('Calling openscad with', cmd)
    scadInstance.value.callMain(cmd)

    // Read the data from cube.stl
    generatedSTL.value = new Blob([scadInstance.value.FS.readFile('/output.stl')])
}

const downloadSTL = () => {
    if (!generatedSTL.value) return
    const aElement = document.createElement('a')
    aElement.setAttribute('download', props.outputName)
    const href = stlDataUrl.value
    aElement.href = href
    aElement.setAttribute('target', '_blank')
    aElement.click()
    URL.revokeObjectURL(href)
    aElement.remove()
}

const stlDataUrl = computed(() => {
    if (generatedSTL.value) {
        return URL.createObjectURL(generatedSTL.value)
    }
    return ''
})

function updateHoleSelection() {
    if (hole_selection.value === 'magnet_holes') {
        scadVariables.value.refined_holes = false
        scadVariables.value.magnet_holes = true
    } else if (hole_selection.value === 'refined_holes') {
        scadVariables.value.refined_holes = true
        scadVariables.value.magnet_holes = false
    }
}
</script>