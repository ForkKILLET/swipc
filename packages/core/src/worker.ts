import { createIpcOn, handleIpcOn, IpcMessage } from './ipc'
import { StrictOmit } from './utils/types'
import { uneval } from './utils/uneval'

export interface TypedWorkerEventMap<O, E = any> extends StrictOmit<WorkerEventMap, 'message' | 'messageerror'> {
  message: MessageEvent<O>
  messageerror: MessageEvent<E>
}

export interface TypedWorker<I, O, E = any>
extends StrictOmit<Worker, 'postMessage' | 'addEventListener' | 'removeEventListener' | 'onmessage' | 'onmessageerror'> {
  postMessage(message: I, transfer: Transferable[]): void
  postMessage(message: I, options?: StructuredSerializeOptions): void
  
  addEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: TypedWorkerEventMap<O, E>[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: TypedWorkerEventMap<O, E>[K]) => any,
    options?: boolean | EventListenerOptions
  ): void

  onmessage: ((this: Worker, ev: MessageEvent<O>) => any) | null
  onmessageerror: ((this: Worker, ev: MessageEvent<E>) => any) | null
}

export interface IpcWorkerDefinition {
  init: (ev: MessageEvent<IpcMessage>) => void
  dependencies: Record<string, any>
}

export type IpcWorker = TypedWorker<IpcMessage, IpcMessage>

export class IpcWorkerFactory {
  constructor(
    public readonly windowIpc: any
  ) {}

  codeUrlCache = new Map<IpcWorkerDefinition, string>()

  getCodeUrl(def: IpcWorkerDefinition): string {
    if (this.codeUrlCache.has(def)) {
      return this.codeUrlCache.get(def)!
    }
    else {
      const code = [
        ...Object
          .entries({
            ...def.dependencies,
            createIpcOn,
            handleIpcOn,
            init: def.init,
          })
          .map(([ key, value ]) => `const ${key} = ${uneval(value)}`),
        `const ipc = createIpcOn(self)()`,
        `const handleIpc = handleIpcOn(self)`,
        `self.addEventListener('message', function(ev) {
          if (ev.data.type === 'init') init()
        })`,
        ''
      ].join('\n')
      const codeBlob = new Blob([ code ], { type: 'application/javascript' })
      return URL.createObjectURL(codeBlob)
    }
  }

  createWorker(def: IpcWorkerDefinition): IpcWorker {
    console.clear()
    const codeUrl = this.getCodeUrl(def)
    const worker: IpcWorker = new Worker(codeUrl)
    handleIpcOn(worker)(this.windowIpc)
    worker.postMessage({ type: 'init' })
    return worker
  }
}
