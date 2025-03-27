import type { WindowIpc } from './App.vue'

declare global {
  const ipc: WindowIpc
  const workerId: number
}