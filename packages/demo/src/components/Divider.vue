<script setup lang="ts">
import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'

const props = withDefaults(defineProps<{
  el?: HTMLElement | null
  direction?: 'horizontal' | 'vertical'
  moveDirection?: 1 | - 1
}>(), {
  direction: 'horizontal',
  moveDirection: 1
})

interface Pos {
  x: number
  y: number
}

const getMousePos = (ev: MouseEvent | TouchEvent): Pos => {
  const { clientX: x, clientY: y } =  ev instanceof MouseEvent ? ev : ev.touches[0]
  return { x, y }
}

const dividerEl = ref<HTMLElement | null>(null)
const isMoving = ref(false)
let pos0: Pos | null = null

const onMoveStart = (ev: MouseEvent | TouchEvent) => {
  isMoving.value = true
  pos0 = getMousePos(ev)
  document.body.style.cursor = props.direction === 'horizontal'
    ? 'ns-resize'
    : 'ew-resize'
}

const onMove = (ev: MouseEvent | TouchEvent) => {
  const { el, moveDirection, direction } = props
  if (! pos0 || ! el) return
  const pos1 = getMousePos(ev)
  if (direction === 'vertical') {
    el.style.width = `${el.clientWidth + (pos1.x - pos0.x) * moveDirection}px`
  }
  else {
    el.style.height = `${el.clientHeight + (pos1.y - pos0.y) * moveDirection}px`
  }
  pos0 = pos1
}

const onMoveEnd = (ev: MouseEvent | TouchEvent) => {
  onMove(ev)
  pos0 = null
  isMoving.value = false
  document.body.style.cursor = ''
}

useEventListener(dividerEl, [ 'mousedown', 'touchstart' ], onMoveStart)
useEventListener([ 'mousemove', 'touchmove' ], onMove)
useEventListener([ 'mouseup', 'touchend', 'touchcancel' ], onMoveEnd)
</script>

<template>
  <div
    ref="dividerEl"
    class="divider"
    :class="{
      moving: !! isMoving,
      [direction]: true,
    }"
  >
    <div class="divider-inner"></div>
  </div>
</template>

<style>
.divider.vertical + * {
  padding-left: 1em;
}
.divider.horizontal + * {
  padding-top: 1em;
}

:has(+ .divider.vertical) {
  padding-right: 1em;
}
:has(+ .divider.horizontal) {
  padding-bottom: 1em;
}
</style>

<style scoped>
.divider {
  flex-grow: 0;
  cursor: pointer;
}
.divider.vertical {
  height: 100%;
  padding: 0 3px;
}
.divider.horizontal {
  width: 100%;
  padding: 3px 0;
}
.divider.vertical.moving {
  cursor: ew-resize;
  padding: 0 2px;
}
.divider.horizontal.moving {
  cursor: ns-resize;
  padding: 2px 0;
}

.divider-inner {
  background-color: #7c8c8d;
  transition: background-color .3s;
}
.divider.vertical > .divider-inner {
  height: 100%;
  width: 1px;
}
.divider.horizontal > .divider-inner {
  width: 100%;
  height: 1px;
}
.divider.moving > .divider-inner {
  background-color: #007acc;
}
.divider.vertical.moving > .divider-inner {
  width: 3px;
}
.divider.horizontal.moving > .divider-inner {
  height: 3px;
}
</style>
