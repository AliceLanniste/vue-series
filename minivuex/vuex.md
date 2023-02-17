vuex

是一个专为Vue.js应用程序开发的状态管理模式。

什么是状态管理模式,官方文档例子:

- **state**，驱动应用的数据源；
- **view**，以声明方式将 **state** 映射到视图；
- **actions**，响应在 **view** 上的用户输入导致的状态变化。

```vue
new Vue({
  // state
  data () {
    return {
      count: 0
    }
  },
  // view
  template: `
    <div>{{ count }}</div>
  `,
  // actions
  methods: {
    increment () {
      this.count++
    }
  }
})
```

这个例子的数据流简图：



![data_stream](.\assets\data_stream.jpg)



`vuex`解决的痛点是大型单页应用中状态依赖，1.嵌套组件依赖同个状态；2.兄弟组件状态依赖。

比如嵌套组件依赖某个状态`state`，没有`vuex`我们就必须不断从父组件传参到子组件，这样就很繁琐也很容易出错;兄弟组件状态依赖如果还是依照老方法就很难解决了。

如果只是这么简单的单向数据流模式其实不需要用到`vuex`我们可以构建一个最简单的`store`.

一个最简单的`store`模式:

```js
var store = {
  debug: true,
  state: {
    message: 'Hello!'
  },
  setMessageAction (newValue) {
    if (this.debug) console.log('setMessageAction triggered with', newValue)
    this.state.message = newValue
  },
  clearMessageAction () {
    if (this.debug) console.log('clearMessageAction triggered')
    this.state.message = ''
  }
}


//依赖store的组件，store中state的变化只能使用store.setMessageAction和store.clearMessageAction
var vmA = new Vue({
  data: {
    privateState: {},
    sharedState: store.state
  }
})

var vmB = new Vue({
  data: {
    privateState: {},
    sharedState: store.state
  }
})
```



![simple_store](.\assets\simple_store.jpg)



但是如果遇到的是组件更多更复杂的大型应用，简单的`store`模式就不适用了。





vuex官方示意图:

![simple_store](\assets\vuex.jpg)

![vuex](.\assets\vuex.jpg)

vuex提供了`state`,`commit`,`dispatch`以及`getter`等api，除此之外vuex还提供了`modules`允许我们将 store 分割成**模块（module）**。

先不考虑**模块（module）**的问题，先从最基本的一个`store`开始。最简单的`store`其实和上面列举出的`store`差不多。

2.一个最简单的vuex

`vuex`的初始化需要向`Vuex.Store`传入一个对象（object），该对象嵌套了`state`,`commit`,`actions`以及`getter`对象:

```js
const store = new Vuex.Store({
  state: {
    count: 0
  },
   getters: {
    countNum: state => state.count
  }，
  mutations: {
    increment (state) {
      state.count++
    }
  },
  actions: {
    increment (context) {
      context.commit('increment')
    }
  
})
```

因此`vuex`的构造函数`constructor`会接受传入的对象，并将这些对象进行辨别，收集`state`，`commit`等。

源码如下:

简单讲讲`construtor`函数所进行的操作，首先在`store`内部,变量`_mutations`,`_actions`,`_wrapperGetters`是为了存储对应的对象，但`mutations`,`actions`和`getters`传入不是直接传入到这些变量中，它们首先要经过一个`registerXXX`函数注册到这些对象，为什么要这么做。

因为在组件内使用`mutations`或`actions`是采用分发的形式，也就是订阅者模式，来实现的。

```
store.commit('increment', 10) //使用名为`incremnet`的函数，窜入参数为10
store.dispatch('incrementAsync', {
  amount: 10
})

```

因此在`actions`,`mutations`，`getters`在`constructor`先进行（name：function）注册到对应存储对象中。



```js

export class Store {
 constructor( options ={}) {
      
       if (!Vue && typeof window ==='undefined' && window.Vue) {
           install(Vue)
       }
    const {strict,plugins=[],mutations,actions,getters } = options
    this.strict = strict
    this._commiting = false
    // 存储mutations
    this._mutations = Object.create(null)
     //存储actions
    this._actions = Object.create(null)
    //存储getters
    this._wrapperGetters = Object.create(null)
    ....
    //保存state
    const store = this
    const state = options.state
    const {dispatch, commit} = this
    this.commit  = function bindCommit(type,playload,options) {
        return commit.call(store,type,playload,options)
    }
    this.dispatch  = function bindDispatch(type,payload) {
        return dispatch.call(store,type,payload)
    }
    registerMutation(store,mutations)
    registerAction(store,actions)
    registerGetter(store,getters)
    }
    
}
```



vuex想要改变`state`里的值必须通过`store.commit`和`store.dispatch`来操作，直接改变`state`状态虽然state确实会变，但是vuex会报错的。

先来看看`commit`和`dispatch`的实现：

无论是`commit`还是`dispatch`都先用`unifyObjectStyle`函数是格式化参数传入，因为这两个函数都可能使用

```js
// 以载荷形式分发
store.dispatch('incrementAsync', {
  amount: 10
})

// 以对象形式分发
store.dispatch({
  type: 'incrementAsync',
  amount: 10
})
```

这两种形式来调用`actions`或者`mutations`。

先看`commit`它从`_mutations`拿出对应的函数，然后在`this._withCommiting()`函数对`state`进行操作，为什么需要在`this._withCommiting`而不是直接进行调用呢？

因为`this._withCommiting`是为了确保对`state`操作只有`mutations`可以。可以看看` _withCommiting` 代码。

```js
commit(_type,_payload,_options) {
    let { type, payload } = unifyObjectStyle(_type, _payload,_options)
  const entry = this._mutations[type]
  this._withCommiting(() =>{
    entry.forEach( (handler) => handler(payload))
  })

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

  // 保证mutation改动
    _withCommiting(fn) {
        //用来记录上一次_commiting
        //this._commiting在consturctor初始化为false
        const commiting = this._commiting
        this._commiting = true

        fn()
        this._commiting  = commiting
    }


```

`_withCommiting`使用`commiting`记录是否使用`mutations`，当使用时，`this._commiting = true`，当`fn()`调用完成后，`this._commiting`由commiting赋值为原样。如果直接`stote.state=xxx`这样赋值的话`this._commiting`就一直为`false`。不会变动。但是` const commiting = this._commiting`并不会导致`commiting`只是存储`false`的变量，因为使用 store.commit 会出现 `store.commit('xxx',{xxx, store.commit('ccc',{xxx})})`嵌套的情况,在嵌套情况下实际上`commiting`是保存上一次`this._commiting`,当嵌套操作完成`commiting`才会恢复false。

`dispatch`是异步操作，所以使用`promise`来操作。

2.`commit`  `dispatch`绑定
实现了`commit`和`dispatch`,在`constructor`中还进行一个强制绑定`store`实例的操作。

```
 const {dispatch, commit} = this
    this.commit  = function bindCommit(type,playload,options) {
        return commit.call(store,type,playload,options)
    }
    this.dispatch  = function bindDispatch(type,payload) {
        return dispatch.call(store,type,payload)
    }
```

这样的操作并不是多此一举，如果遇到这种情况`this.$store.commit({},xxxx)`，因为`commit.call(store,xxx)`绑定这样就不会出错了。



3.如何注入Vue

到这里一个最简单的`vuex`就完成了，现在我们需要完成“vuex注入vue”的一步，vuex能够在`vue`上使用必须实现`install`。

`install`函数中先判断是否由`vue`存在，没有就赋值，然后`ApplyMixin`把Vue传入，`ApplyMixin`做的事很简单，就是通过`Vue.mixin`将`store`注入`vue`,这样在`vue`组件就可以使用`this.$store`。

```
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

export  default function  ApplyMixin(Vue) {
   
        Vue.mixin({beforeCreate: vuexInit})
    function vuexInit() {
        const options = this.$options
        if (options.store) {
            this.$store = typeof options.store === 'function' ? options.store() : options.store
        } else if(options.parent && options.parent.store) {
            this.$store = options.parent.store
        }
    }

}

```



4.模块收集

> 由于使用单一状态树，应用的所有状态会集中到一个比较大的对象。当应用变得非常复杂时，store 对象就有可能变得相当臃肿。为了解决以上问题，Vuex 允许我们将 store 分割成**模块（module）**。

```js
const moduleA = {
  state: () => ({ ... }),
  mutations: { ... },
  actions: { ... },
  getters: { ... }
}

const moduleB = {
  state: () => ({ ... }),
  mutations: { ... },
  actions: { ... }
}

const store = new Vuex.Store({
    //根模块
   state:{...},
   mutations:{...},
   actions:{....},
    //模块
  modules: {
    a: moduleA,
    b: moduleB
  }
})

store.state.a // -> moduleA 的状态
store.state.b //
```

如果要支持模块，`vuex`源码从`constructor`就需要对`modules`进行处理，在`vuex`里`moudle-collection`负责模块收集。

``moudle-collection.js`逻辑就是通过`register`函数将模块按照根模块-父模块-子模块生成。

首先我们先注册根模块，然后递归注册子模块，在已经注册的父模块上添加子模块。

```
export  default class ModuleCollection {
    constructor(options = {}) {
        this.register([],options)
    }
      get (path) {
      return path.reduce((module,key) =>{
          return module.getChild(key)
      },this.root)
    }
    register(path,rawModule) {
        const newModule =  new Module(rawModule)
        if (path.length === 0) {
            this.root = newModule
        } else {
        //在父模块添加子模块
            const parent =this.get(path.slice(0,-1))
            parent.addChild(path[path.length-1],newModule)
        }

        //递归注册子模块
        if(rawModule.modules) {
            forEachValue(rawModule.modules,(rawChildModule,key)=>{
                this.register(path.concat(key),rawChildModule)
            })
        }
    }
}

//util.js
export function forEachValue(obj,fn) {
    Object.keys(obj).forEach(key => fn(obj[key],key))
}

```

然后在`store.js`使用`installModule`将模块注册到`store`实例中。

对于模块内部的 mutation 和 getter，接收的第一个参数是**模块的局部状态对象**。

```js
const moduleA = {
  state: () => ({
    count: 0
  }),
  mutations: {
    increment (state) {
      // 这里的 `state` 对象是模块的局部状态
      state.count++
    }
  },

  getters: {
    doubleCount (state) {
      return state.count * 2
    }
  }
}
```

因此我们需要构建一个局部的状态对象，这个局部状态对象其实就是（state,getters,commit,dispatch），那和store提供的有什么不一样，这其实要看modules是否带有`namespaced:true`。

```js
const store = new Vuex.Store({
  modules: {
    account: {
      namespaced: true,

      // 模块内容（module assets）
      state: () => ({ ... }), // 模块内的状态已经是嵌套的了，使用 `namespaced` 属性不会对其产生影响
      getters: {
        isAdmin () { ... } // -> getters['account/isAdmin']
      },
      actions: {
        login () { ... } // -> dispatch('account/login')
      },
      mutations: {
        login () { ... } // -> commit('account/login')
      },

      // 嵌套模块
      modules: {
        // 继承父模块的命名空间
        myPage: {
          state: () => ({ ... }),
          getters: {
            profile () { ... } // -> getters['account/profile']
          }
        },

        // 进一步嵌套命名空间
        posts: {
          namespaced: true,

          state: () => ({ ... }),
          getters: {
            popular () { ... } // -> getters['account/posts/popular']
          }
        }
      }
    }
  }
})
```

> 启用了命名空间的 getter 和 action 会收到局部化的 `getter`，`dispatch` 和 `commit`。换言之，你在使用模块内容（module assets）时不需要在同一模块内额外添加空间名前缀。更改 `namespaced` 属性后不需要修改模块内的代码。

`vuex`源码中`makeLocalContext`通过是否有`namespace`来生成局部的状态对象`local`。

```
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

```



5.辅助函数

mapState，mapGetter辅助函数可以在嵌套模块下，进行方便的操作。

```
 ...mapState({
    a: state => state.some.nested.module.a,
    b: state => state.some.nested.module.b
  })
  
    ...mapState('some/nested/module', {
    a: state => state.a,
    b: state => state.b
  })
```



map系列辅助函数支持上面两种情况,以mapState为例，获取map之后迭代的赋值mapState function

之前看到的时候不知道有啥用，但在这里看到后，觉得真的非常得赞 👍

确定好了 `state` 和 `getters` 的值，最后就可以返回值了

```
return typeof val === 'function'
  ? val.call(this, state, getters)
	: state[val]
```

这里还做了一层处理是因为要处理两种不同的方式，例如：

```
mapState({
  foo: state => state.foo,
  bar: 'bar'
})
```

​                     

在这里我又发现了一个官方文档里没有提及的，就是以函数形式返回的时候，还能接收第二个参数 `getters` ，即：`foo: (state, getters) => state.foo + getters.bar`

```
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

function normalizeMap(map) {
    if (!isValidMap(map)) {
        return []
    }
    return Array.isArray(map)
           ? map.map(val =>({key:val,val:val}))
           : Object.keys(map).map(key=>({key,val:map[key]}))
}
```



6.plugin和hotupload

> Vuex 的 store 接受 `plugins` 选项，这个选项暴露出每次 mutation 的钩子。Vuex 插件就是一个函数，它接收 store 作为唯一参数：

```js
const myPlugin = store => {
  // 当 store 初始化后调用
  store.subscribe((mutation, state) => {
    // 每次 mutation 之后调用
    // mutation 的格式为 { type, payload }
  })
}
//在Vuex.Store使用plugin
const store = new Vuex.Store({
  // ...
  plugins: [myPlugin]
})

```

在`vuex`源码中启动plugin也很简单在`constructor`加上`  plugins.forEach(plugin => plugin(this))`就行，`this`就是`store`实例。

热重载(hot module reload)

要想让Vuex 支持在开发过程中热重载 mutation、module、action 和 getter，首先得在开过程中使用使用 webpack 的 [Hot Module Replacement API (opens new window)](https://webpack.js.org/guides/hot-module-replacement/)，然后使用 `store.hotUpdate()` 方法。

热重载实例:

```
import Vue from 'vue'
import Vuex from 'vuex'
import mutations from './mutations'
import moduleA from './modules/a'

Vue.use(Vuex)

const state = { ... }

const store = new Vuex.Store({
  state,
  mutations,
  modules: {
    a: moduleA
  }
})
//module.hot和module.hot.accept是webpack的api
if (module.hot) {
  // 使 action 和 mutation 成为可热重载模块
  module.hot.accept(['./mutations', './modules/a'], () => {
    // 获取更新后的模块
    // 因为 babel 6 的模块编译格式问题，这里需要加上 `.default`
    const newMutations = require('./mutations').default
    const newModuleA = require('./modules/a').default
    // 加载新模块
    store.hotUpdate({
      mutations: newMutations,
      modules: {
        a: newModuleA
      }
    })
  })
}
```

`vuex`源码是如何实现热重载，当使用`store.hotUpdate()`源码，1.更新模块；2.重置store实例

```js
  hotUpdate (newOptions) {
    this._modules.update(newOptions)
    resetStore(this, true)
  }
  
  //将actions，mutations，getters重置
  //注册已更新的模块
  //重置store实例
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

//将this.$store.state转为响应式
//store.getters转为computed
function resetStoreVM (store, state, hot) {
  const oldVm = store._vm

  store.getters = {}    // 在实例store上设置getters对象
  

  const wrappedGetters = store._wrappedGetters
  const computed = {}
  // 遍历getters，将每一个getter注册到store.getters，访问对应getter时会去vm上访问对应的computed
  forEachValue(wrappedGetters, (fn, key) => {
    computed[key] = partial(fn, store)
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key],
      enumerable: true // for local getters
    })
  })

  const silent = Vue.config.silent
  Vue.config.silent = true
  // 使用Vue实例来存储Vuex的state状态树，并利用computed去缓存getters返回的值
  store._vm = new Vue({
    data: {
      $$state: state
    },
    computed
  })
  Vue.config.silent = silent

 

  // 若存在旧的vm, 销毁旧的vm
  if (oldVm) {
    if (hot) {
      // 解除对旧的vm对state的引用
      store._withCommit(() => {
        oldVm._data.$$state = null
      })
    }
    Vue.nextTick(() => oldVm.$destroy())
  }
}
```







热重载

在`vuex`使用（hrl）需要配合webpack提供的module.hot和module.hot.accept。

`module.hot.accept`将‘mutations’和`actions`当成模块，然后使用`require`引入，最后传入store.hotUpdate

```
import Vue from 'vue'
import Vuex from 'vuex'
import mutations from './mutations'
import moduleA from './modules/a'

Vue.use(Vuex)

const state = { ... }

const store = new Vuex.Store({
  state,
  mutations,
  modules: {
    a: moduleA
  }
})

if (module.hot) {
  // accept actions and mutations as hot modules
  module.hot.accept(['./mutations', './modules/a'], () => {
    // require the updated modules
    // have to add .default here due to babel 6 module output
    const newMutations = require('./mutations').default
    const newModuleA = require('./modules/a').default
    // swap in the new modules and mutations
    store.hotUpdate({
      mutations: newMutations,
      modules: {
        a: newModuleA
      }
    })
  })
}
```

动态导入使用`require.context` const context = require.context("./modules", false, /([a-z_]+)\.js$/i)

会查询`./modules`下所有文件（是否有子文件）。

返回`require(request)`函数，有三个属性其中keys()可以使用动态引入

```
context.keys().map((key)=>({key, name: key.match(/([a-z_]+)\.js$/i)[1] })
.reduce((modules, { key, name }) =>({
    ...modules,
   [name]:context(key).default
}),{})
```

虽然说`context`是个require函数，但实际上它应该是,否则不会使用context(key).default

```
{
 ./A.js:'./src/xxx/sfff.js'
 ...
 ..
}
```

