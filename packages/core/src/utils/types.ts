export type Fn = (...args: any[]) => any

export type StrictPick<T, K extends keyof T> = Pick<T, K>
export type StrictOmit<T, K extends keyof T> = Omit<T, K>

export type Primitive = string | number | boolean | null | undefined | bigint | symbol

export type Path<T, E = never, M = never> = keyof {
  [K in keyof T & string as
    string extends K
      ? never
      : T[K] extends M
        ? never
        : | (T[K] extends E
            ? never
            : K
          )
          | `${K}.${Path<
            T[K],
            E,
            M | (T[K] extends Primitive
              ? never
              : 0 extends 1 & T[K]
                ? never
                : T[K]
            )
          >}`
  ]: void
}

export type AtPath<T, P extends string> =
  P extends `${infer K extends keyof T & string}.${infer R extends string}`
    ? AtPath<T[K], R>
    : P extends keyof T & string
      ? T[P]
      : never