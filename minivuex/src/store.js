import {  isPromise, forEachValue, isObject,partial, assert} from "./utils";
import ApplyMixin  from "./mixins";
import ModuleCollection from "./module/module-collection";
let Vue

export class Store {
    constructor( options ={}) {
      
       if (!Vue && typeof window ==='undefined' && window.Vue) {
           install(Vue)
       }
    const {strict,plugins=[] } = options
    this.strict = strict
    this._commiting = false
    // 存储mutations
    this._mutations = Object.create(null)
     //存储actions
    this._actions = Object.create(null)
    //存储getters
    this._wrapperGetters = Object.create(null)
    //初始化模块
    this._modules = new ModuleCollection(options)
    this._makeLocalGetterCache = Object.create(null)
    this._moduleNamespaceMap = Object.create(null)
    // this._watcherVM = new Vue()
    const state = this._modules.root.state
    const store = this
   
     
    const {dispatch, commit} = this
    this.commit  = function bindCommit(type,playload,options) {
        return commit.call(store,type,playload,options)
    }
    this.dispatch  = function bindDispatch(type,payload) {
        return dispatch.call(store,type,payload)
    }
    // 将插件通过传入this(store)开启
    plugins.forEach(plugin=> plugin(this))
    // 注册模块
   installModule(this,state,[],this._modules.root)
   resetStoreVM(this,state)
    }

    get state() {
        return this._vm._data.$$state 
    }

    // 保证mutation改动
    _withCommiting(fn) {
        const commiting = this._commiting
        this._commiting = true

        fn()
        this._commiting  = commiting
    }
  

dispatch(_type,_payload) {       
let { type, payload } = unifyObjectStyle(_type, _payload)
const entry = this._actions[type]
const result = entry.length > 1
    ? Promise.all(entry.map(handler => handler(payload)))
    : entry[0](payload) 
return new Promise((resolve, reject) => {
    result
    .then(
        res => resolve(res), 
        err => reject(err)
    )
})
}

commit(_type,_payload,_options) {
    let { type, payload } = unifyObjectStyle(_type, _payload,_options)
  const entry = this._mutations[type]
  this._withCommiting(() =>{
    entry.forEach( (handler) => handler(payload))
  })

}
replaceState (state) {
    this._withCommiting(() => {
      this._vm._data.$$state = state
    })
  }


  hotUpload(options) {
    this._modules.update(options)
    resetStore(this,true)
  }
}

function resetStore (store, hot) {
    store._actions = Object.create(null)
    store._mutations = Object.create(null)
    store._wrappedGetters = Object.create(null)
    store._modulesNamespaceMap = Object.create(null)
    const state = store.state
    // init all modules
    installModule(store, state, [], store._modules.root, true)
    // reset vm
    resetStoreVM(store, state, hot)
  }
// 把module中的getters,mutations,actions,根据namespace注册进_mutations
function installModule(store,rootState,path,module) {
    const isROOT = !path.length
  
    const namespace = store._modules.getNamespace(path)
    if (module.namespaced) {
        store._moduleNamespaceMap[namespace] = module
    }
    
// 根模块注册state
    if (!isROOT) {
        const parentState =getNestedState(rootState,path.slice(0,-1))
        const moduleName = path[path.length-1]
        store._withCommiting(()=>{
            if (moduleName in parentState) {
                console.warn(
                  `[vuex] state field "${moduleName}" was overridden by a module with the same name at "${path.join('.')}"`
                )
              }
            Vue.set(parentState,moduleName,module.state)
        })
    }
    const local = module.context=makeLocalContext(store,namespace,path)
    console.log('xx',module.context)
    // 模块注册mutation
    module.forEachMutation((mutation,key) =>{
        const namespaceType = namespace+key
        registerMutation(store,namespaceType,mutation,local)
    })
    // 模块注册action
    module.forEachAction((action,key) => {
        const namespaceType = namespace + key
        registerAction(store,namespaceType,action,local)
    })
    // 根模块注册getter
    module.forEachGetter((getter,key) => {
        const namespaceType = namespace+key
        registerGetter(store,namespaceType,getter,local)
    })

    //父模块注册子模块
    module.forEachChild((childModule,key) => 
        installModule(store,rootState,path.concat(key),childModule))

}

function  makeLocalContext(store,namespace,path) {
    const noNamespace =namespace === ''
    const local = {
        dispatch: noNamespace ? store.dispatch : (_type,_payload,_options) =>{
            let { type, payload ,options} = unifyObjectStyle(_type, _payload,_options)
            if (!options || !options.root) {
                type = namespace+type
            }
            return store.dispatch(type,payload)
        },
        commit: noNamespace ? store.commit : (_type,_payload,_options) =>{
            let { type, payload ,options} = unifyObjectStyle(_type, _payload,_options)
            if (!options || !options.root) {
                type = namespace+type
            }
            return store.commit(type,payload,options)
        },
       
    }
    
    Object.defineProperties(local, {
        getters:{
            get:noNamespace ? () =>store.getters :() => makeLocalGetter(store,namespace) 
        },
        state: {
          get: () => getNestedState(store.state, path)
        }
      })

    return local
}

/**
 * localGetter封装一层映射，local.getters.fun => store.gtters['first/fun']
 * 并把它缓存在_makeLocalGetterCache里,
 */ 

function makeLocalGetter(store,namespace) {
    
    if (!store._makeLocalGetterCache[namespace]) {
        let splitLength = namespace.length
        const getterProxy = {}
        Object.keys(store.getters).forEach((type) =>{
            //type是namespace+localType
            if (type.slice(0,splitLength) !== namespace) return
            // 获取当前模块
            let  localType = type.slice(splitLength)
            Object.defineProperty(getterProxy,localType, {
                get:()=>store.getters[type],
                enumerable:true
            })
          store._makeLocalGetterCache[namespace] = getterProxy
        })
    }
    return store._makeLocalGetterCache[namespace]
}

function getNestedState(state,path) {
    return path.reduce((state,key)=> state[key],state)
}
//使用当前模块state，registerMutation得传入一个可以找到当前state参数
/*
 {
     state: {a:1},
     mutations:{
         increment(state,n) {
             state.a +=n
         }
     },
     moudles:{
         moduleA: {
            state:{b:1},
         mutations:{
             //其中state是moduleA.state.b
             increment(state,n) {
                 state.b += n
             }
         }
         }
         
     }
 }
*/ 
function registerMutation(store,type,handler,local) {
const entry = store._mutations[type] ||(store._mutations[type]=[])

    entry.push(function wrapperMutation(payload) {
        handler.call(store,local.state,payload)
    })


}

function registerAction(store,type,handler,local) {
    const entry = store._actions[type] || (store._actions[type]=[])
   
    entry.push(function wrapperAction(payload) {
        let res = handler.call(store, {
                state:local.state,      
                rootState:store.state,  
                commit:local.commit,     
                dispatch:local.dispatch,   
                getters:local.getters,    
                rootGetters:store.getters 
              
        },payload)
        if (!isPromise(res)) {
            res = Promise.resolve(res)
        }
       
        return res
    })

    
}

// getters注册
function registerGetter(store,type,getter,local) {
    if (store._wrapperGetters[type]) {
        return
    }
    store._wrapperGetters[type] = function wrapperGetter(store) {
       
        return getter(
            local.state, // local state
            local.getters, // local getters
            store.state, // root state
            store.getters

        )
    }
}


function unifyObjectStyle(type, payload, options) {
    if(isObject(type) && type.type) {
        options = payload
        payload = type
        type = type.type
    }

    return { type, payload, options }
}


function resetStoreVM(store,state,hot) {
    let oldVM = store._vm
    const computed = {}
    store.getters = {}
    const wrapperGetters  = store._wrapperGetters
    forEachValue(wrapperGetters,(fn,key) =>{
        computed[key] = partial(fn,store)
        Object.defineProperty(store.getters, key, {
            get: ()=>store._vm[key],
            enumerable: true
        })
    })
    store._vm = new Vue({
        data:{
            $$state: state
        },
        computed
    })
    if (store.strict) {
        enableStrictMode(mode)
    }
    if (oldVM) {
        if (hot) {
            store._withCommiting(() => {
                oldVM._data.$$state = null
              })
        }
        Vue.$nextTick(() =>oldVM.$destroy());
    }
}

function enableStrictMode(store) {
    if (store.strict) {
        store._vm.$watch(store._commiting, () => {
            assert(store._committing, `Do not mutate vuex store state outside mutation handlers.`)
          }, { deep: true, sync: true })
    }
}


export function install(_vue) {
    if (Vue && _Vue === Vue) {
        if (__DEV__) {
          console.error(
            '[vuex] already installed. Vue.use(Vuex) should be called only once.'
          )
        }
        return
      }
    Vue =_vue
ApplyMixin(Vue)
}