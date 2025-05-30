<template>
    <div class="px-5 mt-2 mb-5">
        <button @click="generateBtnHandler" :disabled="generating || forceDisabled" class="btn btn-block btn-primary">
            Generate
        </button>
    </div>
    <div v-if="generating" class="aspect-w-16 aspect-h-9">
        <div class="w-full">Generating... This tab may freeze for a couple seconds.</div>
    </div>
    <STLViewer v-if="!generating && generatedSTL" :stlFile="stlDataUrl"
        :modelOptions="{ rotationx: -1.5708, ...props.modelOptions }" class="aspect-w-16 aspect-h-9"></STLViewer>
    <div class="px-5 mt-5">
        <button @click="downloadSTL" :disabled="!generatedSTL" class="btn btn-block btn-primary">
            Download STL
        </button>
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

const props = defineProps(['scadFile', 'outputName', 'scadResources', 'scadVariables', 'modelOptions', 'forceDisabled'])

const scadInstance = ref()
const resourceDatas = ref({})
const generating = ref(false)
const prepped = ref(false)
const generatedSTL = ref()

const scadFile = {
    name: "gridfinity-rebuilt-bins.scad",
    url: "/public/openscad/gridfinity-rebuilt-bins.scad"
}

const scadResourceNames = [
    "generic-helpers.scad", "gridfinity-rebuilt-utility.scad", "threads.scad", "gridfinity-baseplate.scad", "gridfinity-rebuilt-holes.scad", "standard.scad"
]

const scadResources = scadResourceNames.map(name => ({ name, url: `/public/openscad/${name}` }))

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

    scadInstance.value.FS.writeFile(scadFile.name, resourceDatas.value[scadFile.name])
    if (scadResources) {
        scadResources.forEach((resource) => {
            if (resourceDatas.value[resource.name]) {
                scadInstance.value.FS.writeFile(resource.name, resourceDatas.value[resource.name])
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
    prepFS()

    console.debug(scadInstance)
    let cmd = [`/${scadFile.name}`, "--enable=manifold"]
    if (props.scadVariables) {
        for (const [key, value] of Object.entries(props.scadVariables)) {
            if (typeof value === 'boolean') {
                cmd.push('-D', `${key}=${value}`)
            } if (typeof value === 'number') {
                cmd.push('-D', `${key}=${value}`)
            } else {
                cmd.push('-D', `${key}="${value}"`)
            }
        }
    }
    cmd.push('-o', 'output.stl')
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
</script>