export function isPromise(obj) {
    return obj &&  typeof obj.then ==='function'
}

export function forEachValue(obj,fn) {
    Object.keys(obj).forEach(key => fn(obj[key],key))
}

export function isObject (obj) {
    return obj !== null && typeof obj === 'object'
  }
  export function partial (fn, arg) {
    
    return function () {
      return fn(arg)
    }
  }
  

export function assert(condition,message) {
  if (!condition) throw new Error(`[vuex] ${message}`)
}