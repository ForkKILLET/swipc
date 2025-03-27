<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const model = defineModel<string>()
const textareaEl = ref<HTMLTextAreaElement | null>(null)

let resizeObserver: ResizeObserver
let height = 0
let fitting = false
const fitHeight = () => {
  if (fitting) return
  fitting = true
  const el = textareaEl.value
  if (! el) return
  el.style.height = 'auto'
  if (el.scrollHeight > height) height = el.scrollHeight
  el.style.height = `${height}px`
  fitting = false
}

onMounted(() => {
  resizeObserver = new ResizeObserver(fitHeight)
  fitHeight()
})
onUnmounted(() => {
  resizeObserver.disconnect()
})
watch(model, fitHeight)
</script>

<template>
  <textarea
    ref="textareaEl"
    v-model="model"
    @input="fitHeight"
  ></textarea>
</template>

<style scoped>
textarea {
  padding: .5em;

  outline: none;
  border-radius: 6px;
  border-style: solid;
  border-width: 1px;
  border-color: #7c8c8d;

  color: #ffffff;
  background-color: #1e1e1e;

  font-family: monospace;
  font-size: 1em;

  overflow-x: auto;
  overflow-y: auto;
  resize: vertical;
  transition: border-color .3s;
}

textarea:focus {
  border-color: #007acc;
}
</style>