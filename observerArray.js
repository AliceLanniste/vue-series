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
    const property = Object.getOwnPropertyDescriptor(obj,key)
    if (property && property.configurable === false) {
        return;
      }
      let val
    const getter = property.get
    const setter = property.set
    if ((!getter || setter) && arguments.length === 2) {
        val = obj[key]
    }
    
    let childObj = observe(val)
    Object.defineProperty(obj,key,{
        get() {
            const value = getter ? getter.call(obj): val
            console.log('getter trigger',key)
            return value
        },

        set(newVal) {
            const value = getter ? getter.call(obj): val
            if (newVal === value) {
                return
            }

            console.log('setter trigger',newVal)
            if (setter) {
                setter.call(obj, newVal);
            } else {
                val = newVal
            }
            childObj = observe(newVal)
        }
    })
}



function isObject(obj) {
    return obj !== null && typeof obj ==='object'
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


//   observe(obj)
//   console.log(obj.a.aa.aaa = 234)

let obj2 = {};
Object.defineProperty(obj2, "a", {
    get() {
        return obj2._a;
    },
    set(val) {
        obj2._a = val;
    },
});

obj2._a = 123;


