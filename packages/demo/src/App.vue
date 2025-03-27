<script setup lang="ts">
import { reactive, ref, shallowReactive } from 'vue'
import Divider from './components/Divider.vue'

import { createIpcOn, IpcWorkerFactory, type Ipc } from 'swipc'
import testWorker, { type TestWorkerIpc } from './test.worker'
import AutoTextarea from './components/AutoTextarea.vue'
import { useEventListener } from '@vueuse/core'

const scrollToTop = () => {
  window.scroll({ top: 0, behavior: 'smooth' })
}
const scrollToPanel = () => {
  panelEl.value!.scrollIntoView({ behavior: 'smooth' })
}

const leftEl = ref<HTMLElement | null>(null)
const rightEl = ref<HTMLElement | null>(null)
const workersEl = ref<HTMLElement | null>(null)
const workerCodeEl = ref<HTMLElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)

const workerId = ref(0)
const workers = shallowReactive<Record<number, Worker>>({})

const windowMessages = reactive<string[]>([])

const windowIpc = {
  sleep: (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  },
  log: (message: string) => {
    windowMessages.push(message)
  },
  id: <T>(id: T) => {
    return id
  }
}

export type WindowIpc = Ipc<typeof windowIpc>

const workerFactory = new IpcWorkerFactory(windowIpc)

const createWorker = () => {
  const id = workerId.value ++
  const worker = workerFactory.createWorker({
    init: testWorker,
    dependencies: { workerId: id }
  })

  workers[id] = worker
  const ipc = createIpcOn(worker)<TestWorkerIpc>()
  ipc.ping(), 'FIXME'
}

useEventListener('wheel', ev => {
  ev.preventDefault()
  if (ev.deltaY > 0) {
    scrollToPanel()
  }
  else {
    scrollToTop()
  }
})
</script>

<template>
  <div class="root">
    <div class="header">
      <div>
        <h1>swipc.js</h1>
        <p>A TypeScript library supporting synchronous worker IPC</p>
      </div>
    </div>

    <div class="main">
      <div class="panel" ref="panelEl">
        <div class="panel-inner" @click="scrollToPanel">
          <div class="column left" ref="leftEl">
            <div class="row worker-code" ref="workerCodeEl">
              <div class="title">Worker Code</div>
              <AutoTextarea spellcheck="false" :model-value="testWorker.toString()" />
            </div>

            <Divider
              direction="horizontal"
              :el="workerCodeEl"
            />

            <div class="row main-code">
              <div class="title">Main Code</div>
              <AutoTextarea spellcheck="false" :model-value="createWorker.toString()" />
            </div>
          </div>

          <Divider
            direction="vertical"
            :el="rightEl"
            :move-direction="- 1"
          />

          <div class="column right" ref="rightEl">
            <div class="row workers" ref="workersEl">
              <div class="title">
                Workers
                <div>
                  <button @click="createWorker">Create worker</button>
                </div>
              </div>

              <div v-for="(_worker, id) of workers" :key="id" class="worker">
                #{{ id }}
              </div>
            </div>

            <Divider
              direction="horizontal"
              :el="workersEl"
            />

            <div class="row messages">
              <div class="title">Messages</div>
              <div class="messages-content">
                <pre v-for="message of windowMessages" class="message" v-html="message"></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.header {
  display: flex;
  height: 100vh;
  align-items: center;
  text-align: center;
}

.root {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  user-select: none;
  display: flex;
  justify-content: space-between;
  margin-bottom: 1em;
}

.main {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
  padding: 2em;
  box-sizing: border-box;
}

.panel {
  padding: 1em;
  height: calc(100vh - 4em);
  width: calc(100% - 2em);
}

.panel-inner {
  display: flex;
  height: 100%;
  background-color: #1e1e1e;
  color: #ffffff;
  border-radius: .5em;
  padding: 1em;
  box-shadow: 0 0 1em #000000ee;
}

.column {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
}
.row {
  box-sizing: border-box;
}

.left {
  flex-grow: 1;
}

.right {
  min-width: 15em;
  width: 50%;
}

.workers {
  min-height: 5em;
}

.worker-code, .main-code {
  display: flex;
  flex-direction: column;
}
</style>
