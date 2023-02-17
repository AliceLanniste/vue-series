import Module from './module'
import { forEachValue } from "../utils";

export  default class ModuleCollection {
    constructor(options = {}) {
        this.register([],options)
    }

    get (path) {
      return path.reduce((module,key) =>{
          return module.getChild(key)
      },this.root)
    }

    getNamespace(path) {
        let module = this.root
        return path.reduce((namespace,key) =>{
            module =module.getChild(key)
            return namespace + (module.namespaced ? key + '/' : '')
        },'')
    }

    register(path,rawModule) {
        const newModule =  new Module(rawModule)
        if (path.length === 0) {
            this.root = newModule
        } else {
            const parent =this.get(path.slice(0,-1))
            parent.addChild(path[path.length-1],newModule)
        }


        if(rawModule.modules) {
            forEachValue(rawModule.modules,(rawChildModule,key)=>{
                this.register(path.concat(key),rawChildModule)
            })
        }
    }

    update(options) {
        update([],this.root,options)
    }
    
}

function update(path,targetModule,newModule) {
    assertRawModule(path,rawModule)
    targetModule.update(rawModule)

    if (newModule.modules) {
        for (const key in newModule.modules) {
            if (!targetModule.getChild(key)) {
                return
            }
            update(path.concat(key),target.getChild(key),newModule.modules[key])
        }
    }
}


const functionAssert ={
    assert: value=>typeof value === 'function',
    expected:'function'
}

const objectAssert = {
    assert: value => typeof value  === 'function' || (
        typeof value === 'object' && typeof value.hanlder ==='function'
    ),
    expected:'function or object with "handler" function'
}
const assertTypes = {
    getters:functionAssert,
    mutations:functionAssert,
    actions:objectAssert
}

function assertRawModule (path, rawModule) {
    Object.keys(assertTypes).forEach(key => {
      if (!rawModule[key]) return
  
      const assertOptions = assertTypes[key]
  
      forEachValue(rawModule[key], (value, type) => {
        assert(
          assertOptions.assert(value),
          makeAssertionMessage(path, key, type, value, assertOptions.expected)
        )
      })
    })
  }
  
  function makeAssertionMessage (path, key, type, value, expected) {
    let buf = `${key} should be ${expected} but "${key}.${type}"`
    if (path.length > 0) {
      buf += ` in module "${path.join('.')}"`
    }
    buf += ` is ${JSON.stringify(value)}.`
    return buf
  }
  