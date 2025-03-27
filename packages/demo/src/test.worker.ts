import { type Ipc } from 'swipc'
import {} from './test.window'

interface TestWorkerIpcObject {
  ping(): void
}

export type TestWorkerIpc = Ipc<TestWorkerIpcObject>

export default () => {
  ipc.log(`Worker #${workerId} sleeping...`)
  ipc.sleep(1000)
  ipc.log(`Hello from worker #${workerId}!`)
  const idWorkerId = ipc.id(workerId)
  ipc.log(`id(${workerId}) = ${idWorkerId}`)

  handleIpc<TestWorkerIpcObject>({
    ping: () => {
      ipc.log('Pong')
    }
  })
}