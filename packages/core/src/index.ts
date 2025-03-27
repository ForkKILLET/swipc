export { IpcWorkerFactory } from './worker'
export { createIpcOn, handleIpcOn, type Ipc } from './ipc'

declare global {
  const handleIpc: <T>(selfRpc: T) => void
}