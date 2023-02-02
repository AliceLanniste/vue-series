### vue的整体流程
vue组件把模板和数据分开处理，当数据变化时候，引用数据的模板也会发生变化。
Vue有3个核心模块：compiler ，reactivity，render
vue内部的流程：
1.html在浏览器运行时或者vue项目build时被compiler 模块生成render 函数
2.初始数据被reactivity 模块跟踪，转成reactivity data
3.render阶段调用render函数和eactivity data，生成vnode，渲染成html初次挂载
4.当reactivity data变化时，render阶段再次render函数和eactivity data，生成newVnode和Vnode对比，然后新html更新到浏览器

首先看看vue模板解析整体流程，模板先经过compiler 阶段将html转成render 函数，render 函数返回 vdom，然后经过渲染阶段将vdom生成DOM挂载到浏览器中。
![mini_vue](/assets/process.PNG "process")
介绍下什么是virtual DOM？
virtual DOM 是使用js来表达DOM的数据对象。
vdom和DOM相当于蓝图和实物，如果你要修改的话在蓝图上修改，然后在用到实物上，因为创建销毁一个DOM耗费很大,vdom可以减轻工作量。

render阶段分成三部分：
![mini_vue](/assets/renderStage.PNG "renderStage")

第一阶段：render返回vnode
第二阶段： 初次渲染vnode渲染至网页
第三阶段：数据变化生成新vnode，和vnode对比，再次渲染

---

### vdom 
按照vue的写法我们需有个h 函数，生成vnode。
然后一个初次渲染函数mounted 和对比新旧vnode再次渲染的patch 函数。

function h(tag,props,children) => vnode

function mounted(vnode,container) => None

function patch(oldVnode,newVnode)=> None

过程大致就是：
1. h 解析html生成vnode，这里就只是简单返回{tag,props,children} 对象。
2. 将第一步的vnode和要挂载的container传入mounted 函数，mounted 函数会将vnode生成HTMLElement元素，然后插入到container中。这样初次渲染就完毕。
3. 当有新的vnode也就是newVnode，就调用patch(vnode,newVnode) ，patch 函数不生成新的HTMLElement，在原有的HTML基础上用新数据替换老数据。所以 patch 函数依次对比tag，props，children，如果数据不一致，就取最新数据。
因此在vdom.html 演示中，虽然props和children数据变了，但始终只有一个html元素。

---

### reactvie
在vue中我们会将data传入到reactive 中，然后data就变成reactivity,当data发生变化，依赖data的模板就会跟着变化，所以在vue机制内必须追踪data每次变化，一旦变化就要触发模板。
既然需求是这样，我们使用observer模式就能满足上述。
我们先从最简单入手，实现一个简单数据变化追踪
dep.html 实现了class Dep 和watchEffect 函数。
class Dep {
  set value(newValue) {}
  get value() {}
  depend() {}
  notify() {}
}
Dep 实现了observer模式，depend 负责添加订阅者，notify 负责触发订阅者。
watchEffect(effect) 执行函数。

watchEffect(effect) 其中传入的effect 是订阅者。现在的问题是effect 如何添加到Dep中去

watchEffect(effect)内部实现如下：
function watchEffect(effect) {
            activeEffect = effect
            effect()
            activeEffect=null
        }
这里定义了一个activeEffect 全局变量，当watchEffect 传参的时候， 会先赋值activeEffect，   activeEffect 不为空，就会添加这个订阅者。
这个具体的功能实现要看下Dep 和使用才能明白。

Dep 实现如下：
class Dep {
        constructor(value) {
                this.subscribers = new Set()
                this._value = value
            }
        get value() {
            this.depend()
            return this._value
           }

           set value(newValue) {
            this._value = newValue
            this.notify()
           }
            depend() {
                if (activeEffect) {
                    this.subscribers.add(activeEffect)
                }
            }
}
Dep 这里将depend/notify 放入getter/setter 属性内，每次赋值就会触发notify ，取值则添加订阅者。
每次赋值取值，watchEffect 都能跟踪参数的变化。
const dep = new Dep()
 dep.value='hello'
        
        watchEffect(() =>
         {
            console.log(dep.value)
         }
        )

       dep.value = 'changed'
watchEffect 传参后，首先赋值activeEffect ，然后调用effect ，触发getter 从而将effect 放入dep.subscribers 中，然后将activeEffect 置空。
当dep.value 变化的时候，触发getter 进而触发notify ，一个简单的依赖追踪就完成了。

---

reactive
reactive.htm 则是在dep.html 基础上，追踪数据对象。
 const state = reactive({
            count:0
        })
        watchEffect(() => console.log(state.count))
        state.count++
定义reactive 函数，追踪数据对象，当state.count 数据变化，watchEffect 会打印最新state.count。
这里使用了vue2和vue3两种方法：
vue2使用的是Object.defineProperty 给每个属性添加depend/notify。
function reactiveVue2(raw) {
            Object.keys(raw).forEach((key) =>{
                let dep = new Dep()
                let value = raw[key]

                Object.defineProperty(raw,key, {
                    get() {
                        dep.depend()
                        return value
                    },
                    set(newValue) {
                        value= newValue
                        dep.notify()
                    }
                })
            })
            return raw
        }
这里就能看出在vue2使用push,shift等方法，新增数据是没法响应，所以在vue2对push,shift等方法进行了hack。
vue3使用了Proxy和Refect，则没有Object.defineProperty 带来的麻烦。
.....
.....
const targetMap = new WeakMap()
        const receiverHandler = {
            get(target,key,receiver) {
               let dep = getHandler(target,key)
                dep.depend()
                return Reflect.get(target,key,receiver)
            },
            set(target,key,value,receiver) {
                let dep = getHandler(target,key)
                const result =Reflect.set(target,key,value,receiver)
                dep.notify()
                return result
            }
        }
// vue3
function reactive(raw) {
   return new Proxy(raw,receiverHandler)
}

---

### minivue

经过vdom和reactive,现在可以结合这俩做一个最简单minivue了。
mini_vue.html中，我们将vdom和reactive的代码移到文件中，然后定义一个mountedApp 函数。
mountedApp 函数用来渲染和再次渲染组件然后挂载，需要watchEffect 和mounted 和patch 函数。现在要判断是否挂载,通过判断挂载状态，决定是用mounted 还是patch 。所以定义isMounted 变量，
初次渲染完成后，赋值isMounted=true ，当数据变化的时候通过isMounted 来判断。
//组件
 const component = {
    data:reactive({
        count:0
    }),
    render() {
        return h('div',
        {
            onClick:() =>{
                this.data.count++
                
            }
        },
        String(this.data.count))
    }
 }  

function mountedApp(component,container) {
   
    let isMounted = false
    let oldvdom 
    watchEffect(()=>{
    if (!isMounted) {
        oldvdom= component.render()
        mounted(oldvdom,container)
        isMounted=true
    } else {
        let newvdom = component.render()
        console.log('pathc newdow',oldvdom,newvdom)
        patch(oldvdom,newvdom)
        oldvdom=newvdom
    }
    })
}
mountedApp(component,document.getElementById('app'))
         
到此为止一个mini_vue完成了。