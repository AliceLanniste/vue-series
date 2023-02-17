import { isObject } from "./utils";


export const mapState = normalizeNamespace((namespace,map) =>{
    const res = {}
  
    normalizeMap(map).forEach(({key,val}) =>{
        res[key] = function mappedState() {
            let state = this.$store.state
            let getters = this.$store.getters
           
            if (namespace) {
             
                const module = getModuleByNamespace(this.$store,'mapState',namespace)
               
                if (!module) {
                    return
                }
                console.log('mapState',module.context)
            state = module.context.state
            getters = module.context.getters
            }
           
            return typeof val === 'function' 
                   ? val.call(this,state,getters)
                   :state[val]
        }
    })
   
    return res
})


function isValidMap (map) {
    return Array.isArray(map) || isObject(map)
  }

  
function normalizeMap(map) {
    if (!isValidMap(map)) {
        return []
    }
    return Array.isArray(map)
           ? map.map(val =>({key:val,val:val}))
           : Object.keys(map).map(key=>({key,val:map[key]}))
}

export const mapMutations = normalizeNamespace((namespace,mutations) =>{
    const res = {}
    normalizeMap(mutations).forEach(({key,val}) =>{
        res[key] = function mappedMutation(...args) {
            let commit = this.$store.commit
            if (namespace) {
                const module = getModuleByNamespace(this.$store,'mapMutations',namespace)
                if (!module) {
                    return
                }

                commit = module.context.commit
            }
            
            return typeof val === 'function'
                   ? val.apply(this,[commit].concat(args))
                   :commit.apply(this.$store,[val].concat(args))
        }
    })
    return res
})

export const mapActions =normalizeNamespace((namespace,map) =>{
    const res = {}
    normalizeMap(map).forEach(({key,val}) =>{
        res[key] = function mappedAction(...args) {
            let dispatch = this.$store.dispatch
            if (namespace) {
                const module = getModuleByNamespace(this.$store,'mapActions',namespace)
                if (!module) {
                    return
                }
                dispatch = module.context.dispatch
            }
            return typeof val === 'function'
                   ? val.apply(this,[dispatch].concat(args))
                   :dispatch.apply(this.$store,[val].concat(args))
        }
    })
    return res
})

export const mapGetters = normalizeNamespace((namespace,map) =>{
    const res = {}
    normalizeMap(map).forEach(({key,val}) =>{
        res[key] = function mappedGetter() {
                        let getters = this.$store.getters
                        if (namespace) {
                            const module = getModuleByNamespace(this.$store,'mapGetters',namespace)
                            if (!module) {
                                return
                            }
                            getters = module.context.getters
                        }
                        return getters[val]
                    }
                })
                return res
    
}) 
    




function normalizeNamespace(fn) {
    return(namespace,map) =>{
        if (typeof namespace !== 'string') {
            map = namespace
            namespace = ''
        } else if(namespace.charAt(namespace.length-1) !=='/'){
            namespace +='/'
        }
        return fn(namespace,map)
    }
}

function getModuleByNamespace(store,helper,namespace) {
   const module = store._moduleNamespaceMap[namespace]
    if (!module) {
        console.error(`[vuex] module namespace not found in ${helper}(): ${namespace}`)
        return
    }
    return module
}
export const  createNamespaceHelper =(namespace) => ({
    mapState : mapState.bind(null,namespace),
    mapGetters : mapGetters.bind(null,namespace),
    mapMutations : mapMutations.bind(null,namespace),
    mapActions :mapActions.bind(null,namespace)
})