<template>
  <div ref="container"></div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

declare global {
  interface Window {
    StlViewer: any
  }
}

const props = defineProps({
  stlFile: {
    type: String,
    required: true
  },
  modelOptions: {
    type: Object,
    default: () => ({})
  }
})

const container = ref<HTMLElement>()

function loadScript(src: string) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = resolve
    script.onerror = reject
    document.head.append(script)
  })
}

onMounted(async () => {
  await loadScript('/viewstl/stl_viewer.min.js')
  const StlViewer = window.StlViewer
  const stl_viewer = new StlViewer(container.value, {
    allow_drag_and_drop: false,
    models: [{ id: 0, filename: props.stlFile, ...props.modelOptions }]
  })
})
</script>
