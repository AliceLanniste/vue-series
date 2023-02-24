/** 
 * 在最简observer基础上实现一个vue2版本的observer
 * 
*/
/**
 *  let obj = {
  a: {
    aa: {
      aaa: 123,
      bbb: 456,
    },
    bb: "obj.a.bb",
  },
  b: "obj.b",
}; 
 */



function observe(obj) {
    if (!isObject(obj)) {
        return
    }

    let ob = new Observer(obj)
    return ob
}


class Observer{
    constructor(obj) {
        this.walk(obj)
    }

    walk(obj) {
        for (const key of Object.keys(obj)) {
            defineReactive(obj,key)
        }
    }
}

function defineReactive(obj,key) {
    let val = obj[key]
    let childObj = observe(val)
    Object.defineProperty(obj,key,{
        get() {
            console.log('getter trigger',key)
            return val
        },

        set(newVal) {
            if (newVal === val) {
                return
            }

            console.log('setter trigger',newVal)
            val = newVal
            childObj = observe(newVal)
        }
    })
}


let obj = {
    a: {
      aa: {
        aaa: 123,
        bbb: 456,
      },
      bb: "obj.a.bb",
    },
    b: "obj.b",
  };



function isObject(obj) {
    return obj !== null && typeof obj ==='object'
}


observe(obj)
console.log(obj.a.aa.aaa = 234)