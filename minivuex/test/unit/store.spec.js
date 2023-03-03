import Vue from "Vue";
import Vuex from '@/index'

const TEST = 'TEST'

describe('store, mutation',() =>{
 it('committing mutations',()=>{
     const store = new Vuex.Store({
         state: {
             a:1
         },
         mutations:{
             [TEST](state,n) {
                 state.a += n
             }
         }
     })
     store.commit(TEST,2)
     expect(store.state.a).toBe(3)
 })

it('dispatching actions sync',() =>{
    const store = new Vuex.Store({
        state: {
            a:1
        },
        mutations:{
            [TEST](state,n) {
                state.a += n
            }
        },
        actions:{
            [TEST]({commit},n) {
                commit(TEST,2)
            }
        }
    })
    store.dispatch(TEST,2)
    expect(store.state.a).toBe(3)
})
  it('dispatching actions, with returned Promise', done => {
    const store = new Vuex.Store({
      state: {
        a: 1
      },
      mutations: {
        [TEST] (state, n) {
          state.a += n
        }
      },
      actions: {
        [TEST] ({commit}, n) {
            return new Promise((resolve) =>{
                setTimeout(()=>{
                    commit(TEST,2)
                    resolve()
                },0)
            })
        }
   
      }
      })

      expect(store.state.a).toBe(1)
      store.dispatch(TEST,2).then(() => {
          expect(store.state.a).toBe(3)
          done()
      })
})

it('getters',() =>{
    const store = new Vuex.Store({
        state:{
            a: 0
        },
        getters:{
            state: state => state.a > 0 ? 'hasAny' : 'none' 
        },
        mutations:{
            [TEST](state, n) {
                state.a += n
            }
        },
        actions:{
            check({getters}, value) {
                expect(getters.state).toBe(value)
            }
        }
    })
    expect(store.getters.state).toBe('none')
    store.dispatch('check', 'none')

    // store.commit(TEST, 1)

    // expect(store.getters.state).toBe('hasAny')
    // store.dispatch('check', 'hasAny')
})


})