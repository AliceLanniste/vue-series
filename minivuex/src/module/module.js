import { forEachValue } from "../utils";

export default class Module {
    constructor(rawModule){
        this._rawModule = rawModule
        this._children =Object.create(null)
        const rawState = this._rawModule.state
        this.state = (typeof rawState === 'function' ? rawState() : rawState) || {}
    }
    

    get namespaced() {
        return this._rawModule.namespaced
    }

    addChild(key,module) {
        this._children[key] = module
    }

    deleteChild(key) {
        delete this._children[key]
    }

    getChild (key) {
        return this._children[key]
      }
    
    hasChild (key) {
    return key in this._children
    }

    update (rawModule) {
        this._rawModule.namespaced = rawModule.namespaced
        if (rawModule.actions) {
          this._rawModule.actions = rawModule.actions
        }
        if (rawModule.mutations) {
          this._rawModule.mutations = rawModule.mutations
        }
        if (rawModule.getters) {
          this._rawModule.getters = rawModule.getters
        }
      }

      
    forEachMutation(fn) {
        if (this._rawModule.mutations) {
            forEachValue(this._rawModule.mutations,fn)
        }
    }

    forEachAction(fn) {
        
        if (this._rawModule.actions) {
            forEachValue(this._rawModule.actions,fn)
        }
    }

    forEachGetter(fn) {
        if (this._rawModule.getters) {
            forEachValue(this._rawModule.getters,fn)
        }
    }

    forEachChild(fn) {
        if (this._children) {
            forEachValue(this._children,fn)
        }
    }

}