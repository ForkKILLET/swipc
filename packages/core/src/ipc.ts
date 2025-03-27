import type { AtPath, Fn, Path, Primitive } from './utils/types'
import { IpcWorker } from './worker'

type _Ipc<T, S extends string = ''> = {
  [K in keyof T & string as T[K] extends Fn
    ? `${S}${K}`
    : never
  ]: T[K] extends Fn
    ? T[K]
    : never
}

export type IpcPath<T> = Path<T, Fn | Primitive>

type _SubIpc<T, P extends IpcPath<T>> =
  _Ipc<AtPath<T, P>, `${P}.`>

export type Ipc<T = any, P extends IpcPath<T> = never> =
  _Ipc<T> & _SubIpc<T, P>

export interface IpcInvokeMessage {
  type: 'invoke'
  call: string
  args: any[]
  sab: SharedArrayBuffer
}

export interface IpcInitMessage {
  type: 'init'
}

export type IpcMessage =
  | IpcInvokeMessage
  | IpcInitMessage

export const enum IPC_DATA_TYPE {
  UNDEFINED = 0,
  NULL = 1,
  INTEGER = 10,
  FLOAT = 11,
  TRUE = 20,
  FALSE = 21,
  STRING = 40,
  JSON = 100,
  ARRAY_BUFFER = 110,
}

export const createIpcOn = (worker: IpcWorker) => <T>(): T => {
  const sab = new SharedArrayBuffer(2 ** 20)

  return new Proxy({}, {
    get: ({}, path: string) => {
      return (...args: any[]): any => {
        const data = new Int32Array(sab)

        worker.postMessage({
          type: 'invoke',
          call: path,
          args,
          sab,
        })

        Atomics.wait(data, 0, 0)

        const size = data[1]
        const type = data[2]

        if (type === IPC_DATA_TYPE.UNDEFINED) {
          return undefined
        }
        if (type === IPC_DATA_TYPE.NULL) {
          return null
        }
        if (type === IPC_DATA_TYPE.TRUE) {
          return true
        }
        if (type === IPC_DATA_TYPE.FALSE) {
          return false
        }

        const buffer = data.subarray(3, 3 + size)
        if (type === IPC_DATA_TYPE.INTEGER) {
          if (size === 1) {
            return buffer[0]
          }
        }
        if (type === IPC_DATA_TYPE.FLOAT) {
          const view = new DataView(buffer.buffer)
          return view.getFloat64(0)
        }
        if (type === IPC_DATA_TYPE.STRING) {
          const decoder = new TextDecoder()
          return decoder.decode(buffer)
        }
        if (type === IPC_DATA_TYPE.JSON) {
          const decoder = new TextDecoder()
          const json = decoder.decode(buffer)
          return JSON.parse(json)
        }
      }
    }
  }) as any
}

export const handleIpcOn = (worker: IpcWorker) => (selfIpc: any) => {
  worker.addEventListener('message', async ({ data: messageData }) => {
    if (messageData.type === 'invoke') {
      const { call, args, sab } = messageData

      const keys = call.split('.')
      let object = selfIpc
      while (keys.length > 1) {
        object = object[keys.shift()!]
      }

      const ret = await object[keys[0]](...args)

      const data = new Int32Array(sab)
      if (ret === undefined) {
        data[2] = IPC_DATA_TYPE.UNDEFINED
      }
      else if (ret === null) {
        data[2] = IPC_DATA_TYPE.NULL
      }
      else switch (typeof ret) {
        case 'number':
          data[1] = 2
          data[2] = IPC_DATA_TYPE.FLOAT
          const view = new DataView(data.subarray(3, 3 + 2).buffer)
          view.setFloat64(0, ret)
          break
        case 'boolean':
          data[2] = ret ? IPC_DATA_TYPE.TRUE : IPC_DATA_TYPE.FALSE
          break
        case 'string': {
          const encoder = new TextEncoder()
          const buffer = encoder.encode(ret)
          data[1] = buffer.length
          data[2] = IPC_DATA_TYPE.STRING
          data.set(buffer, 3)
          break
        }
        case 'object': {
          const json = JSON.stringify(ret)
          const encoder = new TextEncoder()
          const buffer = encoder.encode(json)
          data[1] = buffer.length
          data[2] = IPC_DATA_TYPE.JSON
          data.set(buffer, 3)
          break
        }
      }

      Atomics.notify(data, 0, 1)
    }
  })
}