import Vue from "vue";
import Vuex ,{mapState,mapMutations,mapActions,mapGetters  } from '@/index';

describe('helper function', ()=>{
    it('mapState (Array)', ()=>{
        const store = new Vuex.Store({
            state: {
                a:1
            }
        })

        const vm = new Vue({
            store,
            computed: mapState(['a'])
        })
        expect(vm.a).toBe(1)
        store.state.a++
        expect(vm.a).toBe(2)
    })

    it('mapState (Object)',() =>{
        const store = new Vuex.Store({
            state:{
                a:1
            },
            getters:{
                b:()=>2
            }
        })

        const vm = new Vue({
            store,
            computed: mapState({
                a:(state,getters) =>{
                    return state.a+getters.b
                }
            })
        })

        expect(vm.a).toBe(3)
        store.state.a++
        expect(vm.a).toBe(4)
    })
    it('mapState (with namespace)', () => {
        const store = new Vuex.Store({
          modules: {
            foo: {
              namespaced: true,
              state: { a: 1 },
              getters: {
                b: state => state.a + 1
              }
            }
          }
        })
        const vm = new Vue({
          store,
          computed: mapState('foo', {
            a: (state, getters) => {
              return state.a + getters.b
            }
          })
        })
        expect(vm.a).toBe(3)
        store.state.foo.a++
        expect(vm.a).toBe(5)
        // store.replaceState({
        //   foo: { a: 3 }
        // })
        // expect(vm.a).toBe(7)
      })
    it('mapState (with namespace and a nested module)', () => {
    const store = new Vuex.Store({
      modules: {
        foo: {
          namespaced: true,
          state: { a: 1 },
          modules: {
            bar: {
              state: { b: 2 }
            }
          }
        }
      }
    })
    const vm = new Vue({
      store,
      computed: mapState('foo', {
        value: state => state
      })
    })
    expect(vm.value.a).toBe(1)
    expect(vm.value.bar.b).toBe(2)
    expect(vm.value.b).toBeUndefined()
  })

  
    it('mapGetters (array)', () => {
        const store = new Vuex.Store({
          state: { count: 0 },
          mutations: {
            inc: state => state.count++,
            dec: state => state.count--
          },
          getters: {
            hasAny: ({ count }) => count > 0,
            negative: ({ count }) => count < 0
          }
        })
        const vm = new Vue({
          store,
          computed: mapGetters(['hasAny', 'negative'])
        })
        expect(vm.hasAny).toBe(false)
        expect(vm.negative).toBe(false)
        store.commit('inc')
        expect(vm.hasAny).toBe(true)
        expect(vm.negative).toBe(false)
        store.commit('dec')
        store.commit('dec')
        expect(vm.hasAny).toBe(false)
        expect(vm.negative).toBe(true)
      })

    it('mapMutations (Array)',()=>{
        const store = new Vuex.Store({
            state:{count: 0},
            mutations:{
                inc: state => state.count++,
                dec:state=> state.count--
            }
        })

        const vm = new Vue({
            store,
            methods: mapMutations(['inc','dec'])
        })

        vm.inc()
        expect(store.state.count).toBe(1)
        vm.dec()
        expect(store.state.count).toBe(0)
    })

    it('mapGetters (object)', () => {
        const store = new Vuex.Store({
          state: { count: 0 },
          mutations: {
            inc: state => state.count++,
            dec: state => state.count--
          },
          getters: {
            hasAny: ({ count }) => count > 0,
            negative: ({ count }) => count < 0
          }
        })
        const vm = new Vue({
          store,
          computed: mapGetters({
            a: 'hasAny',
            b: 'negative'
          })
        })
        expect(vm.a).toBe(false)
        expect(vm.b).toBe(false)
        store.commit('inc')
        expect(vm.a).toBe(true)
        expect(vm.b).toBe(false)
        store.commit('dec')
        store.commit('dec')
        expect(vm.a).toBe(false)
        expect(vm.b).toBe(true)
      })                     
      it('mapGetters (with namespace)', () => {
        const store = new Vuex.Store({
          modules: {
            foo: {
              namespaced: true,
              state: { count: 0 },
              mutations: {
                inc: state => state.count++,
                dec: state => state.count--
              },
              getters: {
                hasAny: ({ count }) => count > 0,
                negative: ({ count }) => count < 0
              }
            }
          }
        })
        const vm = new Vue({
          store,
          computed: mapGetters('foo', {
            a: 'hasAny',
            b: 'negative'
          })
        })
        expect(vm.a).toBe(false)
        expect(vm.b).toBe(false)
        store.commit('foo/inc')
        expect(vm.a).toBe(true)
        expect(vm.b).toBe(false)
        store.commit('foo/dec')
        store.commit('foo/dec')
        expect(vm.a).toBe(false)
        expect(vm.b).toBe(true)
      })
    it('mapMutations (Object)',()=>{
        const store = new Vuex.Store({
            state:{count: 0},
            mutations:{
                inc: state => state.count++,
                dec:state=> state.count--
            }
        })

        const vm = new Vue({
            store,
            methods: mapMutations({ a:'inc',b:'dec'})
        })

        vm.a()
        expect(store.state.count).toBe(1)
        vm.b()
        expect(store.state.count).toBe(0)
    })

    it('mapMutations (Function)',()=>{
        const store = new Vuex.Store({
            state:{count: 0},
            mutations:{
               inc(state,amount) {
                   state.count+= amount
               }
            }
        })

        const vm = new Vue({
            store,
            methods: mapMutations({ 
                plus(commit,ammount) {
                    commit('inc',ammount+1)
                }
            })
        })

        vm.plus(42)
        expect(store.state.count).toBe(43)
    })

    it('mapMutations (with namespace)', () => {
      const store = new Vuex.Store({
        modules: {
          foo: {
            namespaced: true,
            state: { count: 0 },
            mutations: {
              inc: state => state.count++,
              dec: state => state.count--
            }
          }
        }
      })
      const vm = new Vue({
        store,
        methods: mapMutations('foo', {
          plus: 'inc',
          minus: 'dec'
        })
      })
      vm.plus()
      expect(store.state.foo.count).toBe(1)
      vm.minus()
      expect(store.state.foo.count).toBe(0)
    })

    it('dispatch (Array)', ()=>{
        const a = jest.fn()
        const b = jest.fn()
        const store = new Vuex.Store({
            actions:{
                a,b
            }
        })

        const vm = new Vue({
            store,
            methods: mapActions(['a','b'])
        })

        vm.a()
        expect(a).toHaveBeenCalled()
        expect(b).not.toHaveBeenCalled()
        vm.b()
        expect(b).toHaveBeenCalled()
    })


    it('dispatch (Object)',() =>{
        const a = jest.fn()
        const b = jest.fn()
        const store  = new Vuex.Store({
            action: {a,b}
        })

        const vm = new Vue({
            store,
            methods:mapActions({a1:a, b1:b})
        })

        vm.a1()
        expect(a).toHaveBeenCalled()
        expect(b).not.toHaveBeenCalled()
        vm.b1()
        expect(b).toHaveBeenCalled()
    })

    it('mapActions (function with namespace)', () => {
      const a = jest.fn()
      const store = new Vuex.Store({
        modules: {
          foo: {
            namespaced: true,
            actions: { a }
          }
        }
      })
      const vm = new Vue({
        store,
        methods: mapActions('foo/', {
          foo (dispatch, arg) {
            dispatch('a', arg + 'bar')
          }
        })
      })
      vm.foo('foo')
      expect(a.mock.calls[0][1]).toBe('foobar')
    })
  

   
  
})