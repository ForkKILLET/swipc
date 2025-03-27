export const uneval = (value: any): string => {
  switch (typeof value) {
    case 'function':
    case 'number':
    case 'boolean':
      return value.toString()
    case 'symbol':
      throw new Error('Cannot uneval symbol')
    case 'undefined':
      return 'undefined'
    case 'bigint':
      return `${value}n`
    case 'string':
      return JSON.stringify(value)
    case 'object':
      if (value === null) return 'null'
      if (Array.isArray(value)) {
        return `[ ${value.map(uneval).join(', ')} ]`
      }
      if (value instanceof RegExp) {
        return value.toString()
      }
      return `{ ${Object
        .entries(value)
        .map(([ key, value ]): string => `${JSON.stringify(key)}:${uneval(value)}`).join(',')
      } }`
    }
}