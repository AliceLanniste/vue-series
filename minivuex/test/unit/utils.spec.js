import { isPromise,isObject,forEachValue,partial } from "@/utils";


describe('utils', ()=>{
  it('isPromise',() =>{
      const promise = new Promise(()=>{})
      expect(isPromise(1)).toBe(false)
      expect(isPromise(promise)).toBe(true)
      expect(isPromise(new Function())).toBe(false)
  })

  it('isObject',() =>{
    expect(isObject(1)).toBe(false)
  })

  it('forEachValue',()=> {

  })

  it('partial',()=>{
    
  })
}) 


